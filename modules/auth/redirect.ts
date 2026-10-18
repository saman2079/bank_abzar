/** فقط مسیرهای داخلی سایت (ضد open-redirect). هر چیز مشکوک → fallback. */
export function safeRedirectPath(value: unknown, fallback = "/account"): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 200) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;

  for (const char of value) {
    if (char.charCodeAt(0) < 32) return fallback;
  }

  return value;
}

export function loginUrl(next?: string): string {
  const safe = safeRedirectPath(next, "");
  return safe ? `/login?next=${encodeURIComponent(safe)}` : "/login";
}
