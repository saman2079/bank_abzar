import "server-only";
import { db } from "@/lib/db";

/** پاک‌سازی رکوردهای منقضی (OTP، نشست، شمارنده‌های rate-limit). از کرون صدا زده می‌شود. */
export async function cleanupExpired(): Promise<{ otp: number; sessions: number; rateLimits: number }> {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [otp, sessions, rateLimits] = await Promise.all([
    db.otpCode.deleteMany({ where: { expiresAt: { lt: dayAgo } } }),
    db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.rateLimit.deleteMany({ where: { resetAt: { lt: now } } }),
  ]);

  return { otp: otp.count, sessions: sessions.count, rateLimits: rateLimits.count };
}
