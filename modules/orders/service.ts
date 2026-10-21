import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getShippingSettings } from "@/modules/settings/queries";
import { ORDER_EXPIRY_MINUTES, calcShipping } from "./constants";

/** خطای قابل‌نمایش به کاربر؛ داخل تراکنش پرتاب می‌شود تا همه‌چیز rollback شود. */
class OrderError extends Error {}

export type PlaceOrderResult = { ok: true; orderId: string } | { ok: false; error: string };

/**
 * ثبت سفارش از روی سبد DB، همه در یک تراکنش:
 * ۱) کسر اتمیک موجودی (`UPDATE ... WHERE stock >= n AND price = قیمت دیده‌شده`)
 * ۲) ساخت سفارش + آیتم‌ها + تاریخچه  ۳) ثبت StockMovement نوع SALE  ۴) خالی‌کردن سبد
 * قیمت و موجودی فقط از DB خوانده می‌شود؛ اگر بین دیدن و ثبت عوض شده باشد سفارش رد می‌شود.
 */
export async function placeOrder(
  userId: string,
  input: { addressId: string; note: string | null },
): Promise<PlaceOrderResult> {
  try {
    const shippingSettings = await getShippingSettings();
    const orderId = await db.$transaction(async (tx) => {
      const address = await tx.address.findFirst({ where: { id: input.addressId, userId } });
      if (!address) throw new OrderError("آدرس انتخاب‌شده معتبر نیست.");

      // ترتیب ثابت قفل‌ها (productId) تا دو سفارش همزمان deadlock نشوند.
      const cartItems = await tx.cartItem.findMany({
        where: { userId },
        orderBy: { productId: "asc" },
        include: { product: { select: { id: true, sku: true, name: true, price: true, status: true } } },
      });
      if (cartItems.length === 0) throw new OrderError("سبد خرید خالی است.");

      let subtotal = 0;
      for (const item of cartItems) {
        const { product } = item;
        if (product.status !== "ACTIVE") throw new OrderError(`«${product.name}» دیگر در دسترس نیست.`);

        const updated = await tx.product.updateMany({
          where: { id: product.id, status: "ACTIVE", price: product.price, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new OrderError(`موجودی «${product.name}» کافی نیست یا قیمت آن تغییر کرده است. سبد خرید را بررسی کنید.`);
        }
        subtotal += product.price * item.quantity;
      }

      const shippingCost = calcShipping(subtotal, shippingSettings);
      const snapshot: Prisma.InputJsonObject = {
        receiverName: address.receiverName,
        receiverPhone: address.receiverPhone,
        province: address.province,
        city: address.city,
        postalCode: address.postalCode,
        street: address.street,
        plaque: address.plaque,
        unit: address.unit,
      };

      const order = await tx.order.create({
        data: {
          userId,
          status: "PENDING_PAYMENT",
          subtotal,
          shippingCost,
          total: subtotal + shippingCost,
          addressSnapshot: snapshot,
          note: input.note,
          expiresAt: new Date(Date.now() + ORDER_EXPIRY_MINUTES * 60_000),
          createdById: userId,
          items: {
            create: cartItems.map((item) => ({
              productId: item.product.id,
              nameSnapshot: item.product.name,
              skuSnapshot: item.product.sku,
              unitPrice: item.product.price,
              quantity: item.quantity,
            })),
          },
          history: { create: { to: "PENDING_PAYMENT", changedById: userId } },
        },
        select: { id: true },
      });

      await tx.stockMovement.createMany({
        data: cartItems.map((item) => ({
          productId: item.product.id,
          delta: -item.quantity,
          type: "SALE" as const,
          orderId: order.id,
          userId,
        })),
      });

      await tx.cartItem.deleteMany({ where: { userId } });
      return order.id;
    });

    return { ok: true, orderId };
  } catch (error) {
    if (error instanceof OrderError) return { ok: false, error: error.message };
    throw error;
  }
}

/**
 * لغو سفارش «در انتظار پرداخت» و برگشت موجودی. idempotent: شرط `status = PENDING_PAYMENT`
 * در UPDATE باعث می‌شود لغو/انقضای تکراری یا همزمان، موجودی را دوبار برنگرداند.
 * `ownerId` برای لغو توسط خود مشتری (ضد IDOR).
 */
export async function cancelPendingOrder(
  orderId: string,
  options: { actorId: string | null; note: string; ownerId?: string },
): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const changed = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING_PAYMENT", ...(options.ownerId ? { userId: options.ownerId } : {}) },
      data: { status: "CANCELED", expiresAt: null },
    });
    if (changed.count === 0) return false;

    const items = await tx.orderItem.findMany({
      where: { orderId },
      orderBy: { productId: "asc" },
      select: { productId: true, quantity: true },
    });

    for (const item of items) {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
    }
    await tx.stockMovement.createMany({
      data: items.map((item) => ({
        productId: item.productId,
        delta: item.quantity,
        type: "ORDER_CANCEL" as const,
        orderId,
        userId: options.actorId,
        note: options.note,
      })),
    });
    await tx.orderStatusHistory.create({
      data: { orderId, from: "PENDING_PAYMENT", to: "CANCELED", changedById: options.actorId, note: options.note },
    });

    return true;
  });
}

/** سفارش‌های پرداخت‌نشده‌ی منقضی را لغو می‌کند (فراخوانی از کرون). تعداد لغوشده را برمی‌گرداند. */
export async function expireStaleOrders(limit = 100): Promise<number> {
  const stale = await db.order.findMany({
    where: { status: "PENDING_PAYMENT", expiresAt: { lt: new Date() } },
    select: { id: true },
    take: limit,
  });

  let canceled = 0;
  for (const order of stale) {
    if (await cancelPendingOrder(order.id, { actorId: null, note: "انقضای مهلت پرداخت" })) canceled += 1;
  }
  return canceled;
}
