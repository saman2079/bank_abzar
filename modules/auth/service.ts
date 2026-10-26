import "server-only";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db-errors";
import type { Role } from "./constants";

export type RegisterResult =
  | { ok: true; user: { id: string; role: Role } }
  | { ok: false; reason: "exists" | "has-history" };

/**
 * ثبت‌نام مشتری با شماره + رمز (بدون تأیید پیامکی).
 * چون مالکیت شماره تأیید نمی‌شود، «تصاحب» حساب موجود فقط وقتی مجاز است که چیزی برای لو رفتن نباشد:
 * حساب بدون رمز، از نوع مشتری، فعال، و بدون سفارش/آدرس (مثلاً حساب آزمایشی قدیمی).
 * حساب‌های دارای سفارش (مثلاً سفارش دستی ادمین) باید از طریق پشتیبانی رمز بگیرند.
 */
export async function registerCustomer(phone: string, passwordHash: string): Promise<RegisterResult> {
  const existing = await db.user.findUnique({
    where: { phone },
    select: {
      id: true,
      role: true,
      isActive: true,
      passwordHash: true,
      _count: { select: { orders: true, addresses: true } },
    },
  });

  if (!existing) {
    try {
      const user = await db.user.create({ data: { phone, passwordHash }, select: { id: true, role: true } });
      return { ok: true, user };
    } catch (error) {
      if (isUniqueViolation(error)) return { ok: false, reason: "exists" }; // ثبت‌نام همزمان
      throw error;
    }
  }

  if (existing.passwordHash || existing.role !== "CUSTOMER" || !existing.isActive) return { ok: false, reason: "exists" };
  if (existing._count.orders > 0 || existing._count.addresses > 0) return { ok: false, reason: "has-history" };

  // شرط passwordHash=null در خود UPDATE: اگر همزمان کسی دیگر رمز گذاشت، این یکی ناموفق می‌شود.
  const claimed = await db.user.updateMany({ where: { id: existing.id, passwordHash: null }, data: { passwordHash } });
  if (claimed.count === 0) return { ok: false, reason: "exists" };

  return { ok: true, user: { id: existing.id, role: existing.role } };
}
