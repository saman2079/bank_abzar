"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formString } from "@/lib/form";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request";
import { createSession, destroyCurrentSession } from "@/lib/session";
import { mergeGuestCart } from "@/modules/cart/service";
import { sendOtp, verifyOtp } from "./otp";
import { verifyPassword } from "./password";
import { safeRedirectPath } from "./redirect";
import { adminLoginSchema, requestOtpSchema, verifyOtpSchema } from "./schemas";
import type { FormState, OtpRequestState } from "./types";

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "ورودی نامعتبر است.";
}

export async function requestOtpAction(prev: OtpRequestState, formData: FormData): Promise<OtpRequestState> {
  const parsed = requestOtpSchema.safeParse({ phone: formString(formData, "phone") });
  if (!parsed.success) return { step: prev.step, phone: prev.phone, error: firstIssue(parsed.error) };

  const { ip } = await getRequestMeta();
  const result = await sendOtp(parsed.data.phone, ip);

  // در شکست ارسال مجدد، کاربر در مرحله‌ی «کد» می‌ماند.
  return result.ok
    ? { step: "code", phone: parsed.data.phone }
    : { step: prev.step, phone: prev.phone, error: result.error };
}

export async function verifyOtpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = verifyOtpSchema.safeParse({
    phone: formString(formData, "phone"),
    code: formString(formData, "code"),
    next: formString(formData, "next") || undefined,
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { ip } = await getRequestMeta();
  const result = await verifyOtp(parsed.data.phone, parsed.data.code, ip);
  if (!result.ok) return { error: result.error };

  await createSession(result.user.id, result.user.role);

  // سبد مهمان بعد از ورود به سبد حساب منتقل می‌شود؛ خطای آن نباید ورود را خراب کند.
  try {
    await mergeGuestCart(result.user.id);
  } catch (error) {
    console.error("[cart] guest cart merge failed", error instanceof Error ? error.message : error);
  }

  redirect(safeRedirectPath(parsed.data.next));
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
