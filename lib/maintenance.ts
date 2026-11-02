import "server-only";
import { db } from "@/lib/db";
import { CHAT_RETENTION_DAYS } from "@/modules/chat/constants";

/** پاک‌سازی رکوردهای منقضی (OTP، نشست، شمارنده‌های rate-limit). از کرون صدا زده می‌شود. */
export async function cleanupExpired(): Promise<{ otp: number; sessions: number; rateLimits: number; chats: number }> {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const chatCutoff = new Date(now.getTime() - CHAT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const [otp, sessions, rateLimits, chats] = await Promise.all([
    db.otpCode.deleteMany({ where: { expiresAt: { lt: dayAgo } } }),
    db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.rateLimit.deleteMany({ where: { resetAt: { lt: now } } }),
    // گفتگوهای پشتیبانی بدون فعالیت (پیام‌ها با cascade پاک می‌شوند)
    db.chatConversation.deleteMany({ where: { lastMessageAt: { lt: chatCutoff } } }),
  ]);

  return { otp: otp.count, sessions: sessions.count, rateLimits: rateLimits.count, chats: chats.count };
}
