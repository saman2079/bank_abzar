import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { maskPhone } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";
import { sms } from "@/lib/sms";
import { OTP_LENGTH, OTP_MAX_ATTEMPTS, OTP_RESEND_SECONDS, OTP_TTL_SECONDS, type Role } from "./constants";

type Failure = { ok: false; error: string };

const GENERIC_INVALID = "کد نامعتبر یا منقضی شده است.";

function hashOtp(phone: string, code: string): string {
  return createHmac("sha256", env.SESSION_SECRET).update(`otp:${phone}:${code}`).digest("hex");
}

function generateCode(): string {
  return randomInt(0, 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, "0");
}

export async function sendOtp(phone: string, ip: string): Promise<{ ok: true } | Failure> {
  const byIp = await rateLimit(`otp:send:ip:${ip}`, 20, 3600);
  if (!byIp.ok) return { ok: false, error: "درخواست‌های زیادی ارسال شده؛ کمی بعد تلاش کنید." };

  const cooldown = await rateLimit(`otp:send:cooldown:${phone}`, 1, OTP_RESEND_SECONDS);
  if (!cooldown.ok) return { ok: false, error: `لطفاً ${cooldown.retryAfter} ثانیه دیگر دوباره تلاش کنید.` };

  const hourly = await rateLimit(`otp:send:hour:${phone}`, 5, 3600);
  if (!hourly.ok) return { ok: false, error: "تعداد درخواست کد برای این شماره زیاد است؛ بعداً تلاش کنید." };

  const code = generateCode();

  // هر شماره در هر لحظه فقط یک کد فعال دارد.
  const [, record] = await db.$transaction([
    db.otpCode.deleteMany({ where: { phone } }),
    db.otpCode.create({
      data: {
        phone,
        codeHash: hashOtp(phone, code),
        expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
        ip,
      },
      select: { id: true },
    }),
  ]);

  try {
    await sms.sendOtp(phone, code);
  } catch (error) {
    await db.otpCode.deleteMany({ where: { id: record.id } });
    console.error(`[otp] SMS send failed for ${maskPhone(phone)}`, error instanceof Error ? error.message : error);
    return { ok: false, error: "ارسال پیامک ناموفق بود؛ دوباره تلاش کنید." };
  }

  return { ok: true };
}

export type VerifiedUser = { id: string; role: Role };

export async function verifyOtp(
  phone: string,
  code: string,
  ip: string,
): Promise<{ ok: true; user: VerifiedUser } | Failure> {
  const byIp = await rateLimit(`otp:verify:ip:${ip}`, 30, 900);
  if (!byIp.ok) return { ok: false, error: "تلاش‌های زیاد؛ چند دقیقه بعد دوباره امتحان کنید." };

  const record = await db.otpCode.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return { ok: false, error: GENERIC_INVALID };

  // شمارش تلاش اتمیک: درخواست‌های موازی هم از سقف ۵ تلاش رد نمی‌شوند.
  const attempt = await db.otpCode.updateMany({
    where: { id: record.id, consumedAt: null, attempts: { lt: OTP_MAX_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });
  if (attempt.count === 0) return { ok: false, error: "تعداد تلاش بیش از حد مجاز است؛ کد جدید دریافت کنید." };

  const expected = Buffer.from(record.codeHash, "hex");
  const actual = Buffer.from(hashOtp(phone, code), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { ok: false, error: GENERIC_INVALID };
  }

  // یک‌بارمصرف: فقط یکی از درخواست‌های همزمان موفق می‌شود.
  const consumed = await db.otpCode.updateMany({
    where: { id: record.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (consumed.count === 0) return { ok: false, error: GENERIC_INVALID };

  const user = await db.user.upsert({
    where: { phone },
    update: {},
    create: { phone, phoneVerifiedAt: new Date() },
    select: { id: true, role: true, isActive: true, phoneVerifiedAt: true },
  });

  if (!user.isActive) return { ok: false, error: "این حساب غیرفعال است. با پشتیبانی تماس بگیرید." };
  // ادمین/استاف فقط با رمز و از مسیر جدا وارد می‌شوند.
  if (user.role !== "CUSTOMER") return { ok: false, error: "ورود با این شماره از این مسیر ممکن نیست." };

  if (!user.phoneVerifiedAt) {
    await db.user.update({ where: { id: user.id }, data: { phoneVerifiedAt: new Date() } });
  }

  return { ok: true, user: { id: user.id, role: user.role } };
}
