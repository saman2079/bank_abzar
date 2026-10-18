import "server-only";
import type { Payment } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getPaymentGateway } from "@/lib/payments";
import { formatOrderNumber } from "@/modules/orders/constants";
import {
  MAX_PAYMENT_ATTEMPTS_PER_ORDER,
  PAYMENT_HOLD_MINUTES,
  RECONCILE_AFTER_MINUTES,
  RECONCILE_WINDOW_HOURS,
} from "./constants";

export type StartPaymentResult = { ok: true; redirectUrl: string } | { ok: false; error: string };
export type PaymentOutcome = { orderId: string; status: "paid" | "failed" | "pending" };

/** پرداخت دریافت شد ولی سفارش قابل بازگشایی نیست → rollback بازگشایی و علامت‌گذاری بازگشت وجه. */
class CannotRevive extends Error {}

export async function startPayment(userId: string, orderId: string): Promise<StartPaymentResult> {
  const gateway = getPaymentGateway();
  if (!gateway) return { ok: false, error: "درگاه پرداخت هنوز راه‌اندازی نشده است." };

  const order = await db.order.findFirst({
    where: { id: orderId, userId },
    select: { id: true, number: true, total: true, status: true, expiresAt: true, user: { select: { phone: true } } },
  });
  if (!order) return { ok: false, error: "سفارش پیدا نشد." };
  if (order.status !== "PENDING_PAYMENT" || !order.expiresAt || order.expiresAt <= new Date()) {
    return { ok: false, error: "مهلت پرداخت این سفارش تمام شده است." };
  }

  const attempts = await db.payment.count({ where: { orderId } });
  if (attempts >= MAX_PAYMENT_ATTEMPTS_PER_ORDER) {
    return { ok: false, error: "تعداد تلاش پرداخت برای این سفارش بیش از حد است. با پشتیبانی تماس بگیرید." };
  }

  let started;
  try {
    started = await gateway.request({
      // مبلغ فقط از DB
      amountToman: order.total,
      callbackUrl: `${env.NEXT_PUBLIC_SITE_URL}/api/payments/zarinpal/callback`,
      description: `سفارش ${formatOrderNumber(order.number)} بانک ابزار`,
      mobile: order.user.phone,
    });
  } catch (error) {
    console.error("[payment] gateway request failed", error instanceof Error ? error.message : error);
    return { ok: false, error: "ارتباط با درگاه پرداخت برقرار نشد؛ کمی بعد دوباره تلاش کنید." };
  }

  const holdUntil = new Date(Math.max(order.expiresAt.getTime(), Date.now() + PAYMENT_HOLD_MINUTES * 60_000));
  await db.$transaction([
    db.payment.create({ data: { orderId, gateway: gateway.name, authority: started.authority, amount: order.total } }),
    db.order.updateMany({ where: { id: orderId, status: "PENDING_PAYMENT" }, data: { expiresAt: holdUntil } }),
  ]);

  return { ok: true, redirectUrl: started.redirectUrl };
}

/** بازگشت از درگاه. idempotent: هر تعداد فراخوانی تکراری فقط یک‌بار سفارش را PAID می‌کند. */
export async function completePayment(authority: string, callbackStatus: "OK" | "NOK"): Promise<PaymentOutcome | null> {
  const payment = await db.payment.findUnique({ where: { authority } });
  if (!payment) return null;
  if (payment.status === "PAID") return { orderId: payment.orderId, status: "paid" };

  if (callbackStatus === "NOK") {
    await db.payment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "FAILED" } });
    return { orderId: payment.orderId, status: "failed" };
  }

  return verifyAndSettle(payment);
}

async function verifyAndSettle(payment: Payment): Promise<PaymentOutcome> {
  const gateway = getPaymentGateway();
  if (!gateway) return { orderId: payment.orderId, status: "pending" };

  let result;
  try {
    // مبلغ از رکورد Payment ذخیره‌شده در DB؛ درگاه هم مبلغ نامطابق را رد می‌کند.
    result = await gateway.verify({ authority: payment.authority, amountToman: payment.amount });
  } catch (error) {
    console.error("[payment] verify transport error", error instanceof Error ? error.message : error);
    return { orderId: payment.orderId, status: "pending" }; // کرون بعداً دوباره بازبینی می‌کند
  }

  if (!result.ok) {
    await db.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "FAILED", rawResponse: { code: result.code, message: result.message } },
    });
    return { orderId: payment.orderId, status: "failed" };
  }

  await settlePaid(payment, result.refId, result.cardPan);
  return { orderId: payment.orderId, status: "paid" };
}

async function settlePaid(payment: Payment, refId: string, cardPan: string | null): Promise<void> {
  const outcome = await db.$transaction(async (tx) => {
    // فقط یک درخواست از بین چند callback/کرون همزمان این شرط را رد می‌کند.
    const marked = await tx.payment.updateMany({
      where: { id: payment.id, status: { not: "PAID" } },
      data: { status: "PAID", refId, cardPan, paidAt: new Date() },
    });
    if (marked.count === 0) return "already" as const;

    const moved = await tx.order.updateMany({
      where: { id: payment.orderId, status: "PENDING_PAYMENT" },
      data: { status: "PAID", expiresAt: null },
    });
    if (moved.count === 0) return "orphan" as const;

    await tx.orderStatusHistory.create({
      data: { orderId: payment.orderId, from: "PENDING_PAYMENT", to: "PAID", note: `پرداخت آنلاین — کد پیگیری ${refId}` },
    });
    return "paid" as const;
  });

  if (outcome === "orphan") await reviveOrFlagRefund(payment, refId);
}

/**
 * پول دریافت شده ولی سفارش دیگر «در انتظار پرداخت» نیست (مثلاً لغو/منقضی شده).
 * اگر موجودی هنوز هست سفارش دوباره PAID می‌شود؛ وگرنه `needsRefund` برای بازگشت دستی وجه.
 */
async function reviveOrFlagRefund(payment: Payment, refId: string): Promise<void> {
  try {
    await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: payment.orderId },
        select: { status: true, items: { orderBy: { productId: "asc" }, select: { productId: true, quantity: true } } },
      });
      if (!order || order.status !== "CANCELED") throw new CannotRevive();

      for (const item of order.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, status: "ACTIVE", stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) throw new CannotRevive();
      }

      await tx.stockMovement.createMany({
        data: order.items.map((item) => ({
          productId: item.productId,
          delta: -item.quantity,
          type: "SALE" as const,
          orderId: payment.orderId,
          note: "بازگشایی سفارش پس از پرداخت دیرهنگام",
        })),
      });
      await tx.order.update({ where: { id: payment.orderId }, data: { status: "PAID", expiresAt: null } });
      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          from: "CANCELED",
          to: "PAID",
          note: `پرداخت دیرهنگام دریافت شد و سفارش بازگشایی شد — کد پیگیری ${refId}`,
        },
      });
    });
  } catch (error) {
    if (!(error instanceof CannotRevive)) throw error;

    await db.$transaction([
      db.payment.update({ where: { id: payment.id }, data: { needsRefund: true } }),
      db.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          note: `پرداخت (کد پیگیری ${refId}) پس از لغو سفارش انجام شد و بازگشایی ممکن نبود؛ بازگشت وجه لازم است`,
          from: "CANCELED",
          to: "CANCELED",
        },
      }),
    ]);
  }
}

/**
 * پرداخت‌های PENDING قدیمی را بازبینی می‌کند (مثلاً کاربر پرداخت کرد ولی مرورگر را قبل از بازگشت بست).
 * از کرون صدا زده می‌شود. تعداد بازبینی‌شده را برمی‌گرداند.
 */
export async function reconcilePendingPayments(limit = 50): Promise<number> {
  const now = Date.now();
  const pending = await db.payment.findMany({
    where: {
      status: "PENDING",
      createdAt: {
        lt: new Date(now - RECONCILE_AFTER_MINUTES * 60_000),
        gt: new Date(now - RECONCILE_WINDOW_HOURS * 3_600_000),
      },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  for (const payment of pending) await verifyAndSettle(payment);
  return pending.length;
}
