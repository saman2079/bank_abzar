"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formString } from "@/lib/form";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request";
import { createSession, destroyCurrentSession } from "@/lib/session";
import { mergeGuestCart } from "@/modules/cart/service";
import type { Role } from "./constants";
import { hashPassword, verifyPassword } from "./password";
import { safeRedirectPath } from "./redirect";
import { adminLoginSchema, loginSchema, registerSchema } from "./schemas";
import { registerCustomer } from "./service";
import type { FormState } from "./types";

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "ورودی نامعتبر است.";
}

/** بعد از ورود/ثبت‌نام: نشست، انتقال سبد مهمان (بدون تأثیر خطا روی ورود) و هدایت. */
async function startCustomerSession(user: { id: string; role: Role }, next: string | undefined): Promise<never> {
  await createSession(user.id, user.role);

  try {
    await mergeGuestCart(user.id);
  } catch (error) {
    console.error("[cart] guest cart merge failed", error instanceof Error ? error.message : error);
  }

  redirect(safeRedirectPath(next));
}

const LOGIN_ERROR = "شماره یا رمز عبور اشتباه است.";
const TOO_MANY = "تلاش‌های ناموفق زیاد است؛ ۱۵ دقیقه بعد دوباره امتحان کنید.";

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    phone: formString(formData, "phone"),
    password: formString(formData, "password"),
    next: formString(formData, "next") || undefined,
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { phone, password, next } = parsed.data;
  const { ip } = await getRequestMeta();

  const [byIp, byPhone] = await Promise.all([
    rateLimit(`login:ip:${ip}`, 20, 900),
    rateLimit(`login:phone:${phone}`, 8, 900),
  ]);
  if (!byIp.ok || !byPhone.ok) return { error: TOO_MANY };

  // فقط مشتری؛ ادمین/استاف از /admin/login وارد می‌شوند.
  const user = await db.user.findFirst({
    where: { phone, role: "CUSTOMER", isActive: true },
    select: { id: true, role: true, passwordHash: true },
  });

  const valid = await verifyPassword(user?.passwordHash ?? null, password);
  if (!user || !valid) return { error: LOGIN_ERROR };

  return startCustomerSession(user, next);
}

const REGISTER_ERRORS = {
  exists: "این شماره قبلاً ثبت‌نام کرده است؛ از تب «ورود» وارد شوید.",
  "has-history": "برای این شماره قبلاً سفارش ثبت شده است؛ برای دریافت رمز عبور با پشتیبانی تماس بگیرید.",
} as const;

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    phone: formString(formData, "phone"),
    password: formString(formData, "password"),
    confirm: formString(formData, "confirm"),
    next: formString(formData, "next") || undefined,
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { phone, password, next } = parsed.data;
  const { ip } = await getRequestMeta();

  const [byIp, byPhone] = await Promise.all([
    rateLimit(`register:ip:${ip}`, 10, 3600),
    rateLimit(`register:phone:${phone}`, 5, 3600),
  ]);
  if (!byIp.ok || !byPhone.ok) return { error: "تعداد درخواست‌ها زیاد است؛ بعداً دوباره تلاش کنید." };

  const result = await registerCustomer(phone, await hashPassword(password));
  if (!result.ok) return { error: REGISTER_ERRORS[result.reason] };

  return startCustomerSession(result.user, next);
}

export async function logoutAction(): Promise<void> {
  await destroyCurrentSession();
  redirect("/");
}

const ADMIN_LOGIN_ERROR = "شماره یا رمز عبور اشتباه است.";

export async function adminLoginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = adminLoginSchema.safeParse({
    phone: formString(formData, "phone"),
    password: formString(formData, "password"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { phone, password } = parsed.data;
  const { ip } = await getRequestMeta();

  const [byIp, byPhone] = await Promise.all([
    rateLimit(`admin:login:ip:${ip}`, 10, 900),
    rateLimit(`admin:login:phone:${phone}`, 5, 900),
  ]);
  if (!byIp.ok || !byPhone.ok) return { error: "تلاش‌های ناموفق زیاد است؛ ۱۵ دقیقه بعد دوباره امتحان کنید." };

  const user = await db.user.findFirst({
    where: { phone, role: { in: ["ADMIN", "STAFF"] }, isActive: true },
    select: { id: true, role: true, passwordHash: true },
  });

  const valid = await verifyPassword(user?.passwordHash ?? null, password);
  if (!user || !valid) return { error: ADMIN_LOGIN_ERROR };

  await createSession(user.id, user.role);
  redirect("/admin");
}
