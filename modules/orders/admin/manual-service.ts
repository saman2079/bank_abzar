import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/session";
import { getShippingSettings } from "@/modules/settings/queries";
import { ORDER_EXPIRY_MINUTES, calcShipping } from "../constants";
import type { ManualOrderInput } from "./schemas";

class ManualOrderError extends Error {}

export type ManualOrderResult = { ok: true; orderId: string } | { ok: false; error: string };

/**
 * ثبت سفارش دستی (تلفنی/حضوری) در یک تراکنش:
 * مشتری با موبایل پیدا یا (به‌صورت `createdByAdmin`) ساخته می‌شود، موجودی اتمیک کسر می‌شود
 * (همان شرط `stock >= n AND price = دیده‌شده` و قفل به ترتیب productId مثل `placeOrder`)،
 * و سفارش با `createdById = ادمین` ثبت می‌شود.
 * - «پرداخت‌شده» → PAID بدون مهلت (توضیح پرداخت اجباری است).
 * - «در انتظار پرداخت» → PENDING_PAYMENT با مهلت؛ مشتری با ورود می‌تواند آنلاین بپردازد.
 */
export async function createManualOrder(actor: SessionUser, input: ManualOrderInput): Promise<ManualOrderResult> {
  if (input.paid && (!input.paymentNote || input.paymentNote.length < 3)) {
    return { ok: false, error: "برای سفارش پرداخت‌شده، روش/توضیح پرداخت (حداقل ۳ کاراکتر) لازم است." };
  }

  try {
    const shippingSettings = await getShippingSettings();

    const orderId = await db.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { phone: input.phone }, select: { id: true, role: true, isActive: true } });
      if (existing && existing.role !== "CUSTOMER") {
        throw new ManualOrderError("این شماره متعلق به ادمین/کارمند است؛ شماره‌ی مشتری را وارد کنید.");
      }
      if (existing && !existing.isActive) throw new ManualOrderError("حساب این مشتری غیرفعال است.");

      const customer =
        existing ??
        (await tx.user.create({
          data: { phone: input.phone, name: input.customerName, role: "CUSTOMER", createdByAdmin: true },
          select: { id: true, role: true, isActive: true },
        }));

      // ردیف‌های تکراری یک کالا جمع می‌شوند؛ ترتیب ثابت قفل‌ها (productId) تا deadlock نشود.
      const merged = new Map<string, number>();
      for (const item of input.items) merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
      const ids = [...merged.keys()].sort();

      const products = await tx.product.findMany({
        where: { id: { in: ids } },
        select: { id: true, sku: true, name: true, price: true, status: true },
      });
      const byId = new Map(products.map((product) => [product.id, product]));

      let subtotal = 0;
      const lines: { id: string; sku: string; name: string; price: number; quantity: number }[] = [];
      for (const id of ids) {
        const product = byId.get(id);
        const quantity = merged.get(id) ?? 0;
        if (!product || product.status !== "ACTIVE") throw new ManualOrderError("یکی از کالاها پیدا نشد یا فعال نیست.");

        const updated = await tx.product.updateMany({
          where: { id, status: "ACTIVE", price: product.price, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
        if (updated.count === 0) throw new ManualOrderError(`موجودی «${product.name}» کافی نیست یا قیمت آن تغییر کرده است.`);

        subtotal += product.price * quantity;
        lines.push({ id, sku: product.sku, name: product.name, price: product.price, quantity });
      }

      const shippingCost = input.shippingCost ?? calcShipping(subtotal, shippingSettings);
      const status = input.paid ? "PAID" : "PENDING_PAYMENT";
      const snapshot: Prisma.InputJsonObject = {
        receiverName: input.address.receiverName,
        receiverPhone: input.address.receiverPhone,
        province: input.address.province,
        city: input.address.city,
        postalCode: input.address.postalCode,
        street: input.address.street,
        plaque: input.address.plaque,
        unit: input.address.unit,
      };

      const order = await tx.order.create({
        data: {
          userId: customer.id,
          status,
          subtotal,
          shippingCost,
          total: subtotal + shippingCost,
          addressSnapshot: snapshot,
          note: input.note,
          expiresAt: input.paid ? null : new Date(Date.now() + ORDER_EXPIRY_MINUTES * 60_000),
          createdById: actor.id,
          items: {
            create: lines.map((line) => ({
              productId: line.id,
              nameSnapshot: line.name,
              skuSnapshot: line.sku,
              unitPrice: line.price,
              quantity: line.quantity,
            })),
          },
        },
        select: { id: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          from: null,
          to: status,
          changedById: actor.id,
          note: input.paid ? `ثبت دستی توسط ادمین — ${input.paymentNote}` : "ثبت دستی توسط ادمین",
        },
      });
      await tx.stockMovement.createMany({
        data: lines.map((line) => ({
          productId: line.id,
          delta: -line.quantity,
          type: "SALE" as const,
          orderId: order.id,
          userId: actor.id,
          note: "سفارش دستی",
        })),
      });
      await writeAudit(
        {
          actor,
          action: "order.create_manual",
          entity: "order",
          entityId: order.id,
          diff: { phone: input.phone, total: subtotal + shippingCost, paid: input.paid, lines: lines.length, newCustomer: !existing },
        },
        tx,
      );

      return order.id;
    });

    return { ok: true, orderId };
  } catch (error) {
    if (error instanceof ManualOrderError) return { ok: false, error: error.message };
    throw error;
  }
}
