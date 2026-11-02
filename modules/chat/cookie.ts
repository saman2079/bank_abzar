import "server-only";
import { env } from "@/lib/env";

const isProd = env.NODE_ENV === "production";

/** کوکی هویت بازدیدکننده‌ی چت (httpOnly)؛ در production با پیشوند __Host-. */
export const CHAT_COOKIE = isProd ? "__Host-ba_chat" : "ba_chat";
