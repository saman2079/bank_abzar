import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { readSessionUser, type SessionUser } from "@/lib/session";
import { isStaffRole } from "@/modules/auth/constants";
import { loginUrl } from "@/modules/auth/redirect";

/** Data Access Layer: تنها راه رسمی دانستن «کاربر فعلی». در هر درخواست یک‌بار به DB می‌رود. */
export const getCurrentUser = cache(readSessionUser);

export async function requireUser(next?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl(next));
  return user;
}

/** ادمین یا استاف (پنل مدیریت). برای مشتری ۴۰۴ می‌دهد تا وجود پنل لو نرود. */
export async function requireStaff(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (!isStaffRole(user.role)) notFound();
  return user;
}

/** فقط ادمین کامل (مدیریت کاربران، تنظیمات). */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireStaff();
  if (user.role !== "ADMIN") notFound();
  return user;
}
