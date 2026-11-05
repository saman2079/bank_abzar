import "server-only";
import { randomBytes } from "node:crypto";
import { env } from "@/lib/env";

const prefix = env.NODE_ENV === "production" ? "__Host-" : "";

/** شناسه‌ی تصادفی بازدیدکننده (۱۸۰ روز) و نشست (۳۰ دقیقه)؛ httpOnly و بدون هیچ داده‌ی شخصی. */
export const VISITOR_COOKIE = `${prefix}ba_vid`;
export const SESSION_COOKIE = `${prefix}ba_sid`;

const ID_PATTERN = /^[a-f0-9]{32}$/;

export function newId(): string {
  return randomBytes(16).toString("hex");
}

export function validId(value: string | undefined): string | null {
  return value && ID_PATTERN.test(value) ? value : null;
}

export function cookieOptions(maxAge: number) {
  return { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge };
}
