import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getRequestMeta } from "@/lib/request";
import {
  CUSTOMER_SESSION_SECONDS,
  STAFF_SESSION_SECONDS,
  isStaffRole,
  type Role,
} from "@/modules/auth/constants";

const isProd = env.NODE_ENV === "production";
/** پیشوند __Host- در production: کوکی فقط Secure، path=/ و بدون Domain پذیرفته می‌شود. */
export const SESSION_COOKIE = isProd ? "__Host-ba_session" : "ba_session";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type SessionUser = {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  role: Role;
};

export async function createSession(userId: string, role: Role): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const { ip, userAgent } = await getRequestMeta();
  const seconds = isStaffRole(role) ? STAFF_SESSION_SECONDS : CUSTOMER_SESSION_SECONDS;
  const expiresAt = new Date(Date.now() + seconds * 1000);

  await db.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt, ip, userAgent } });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function readSessionUser(): Promise<SessionUser | null> {
  // با cacheComponents، `new Date()` (انقضای سشن) فقط بعد از دسترسی صریح به درخواست مجاز است.
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 128) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      expiresAt: true,
      user: { select: { id: true, phone: true, name: true, email: true, role: true, isActive: true } },
    },
  });

  if (!session || session.expiresAt <= new Date() || !session.user.isActive) return null;

  const { id, phone, name, email, role } = session.user;
  return { id, phone, name, email, role };
}

export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(SESSION_COOKIE);
}

/** همه‌ی نشست‌های یک کاربر را باطل می‌کند (غیرفعال‌سازی، تغییر نقش/رمز). */
export async function revokeUserSessions(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
}