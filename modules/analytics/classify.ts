import type { Device, PageKind, TrafficSource } from "./constants";

/** منطق خالص دسته‌بندی مسیر، منبع ترافیک و دستگاه (بدون DB؛ قابل تست واحد). */

export type PathInfo = { kind: PageKind; slug: string | null; path: string };

/** فقط مسیر داخلی تمیز؛ query/hash حذف، مسیرهای ادمین/API/آپلود نادیده. */
export function normalizePath(raw: string): string | null {
  let path = raw.trim();
  const cut = path.search(/[?#]/);
  if (cut >= 0) path = path.slice(0, cut);

  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\") || path.length > 300) return null;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  if (/^\/(admin|api|uploads|_next)(\/|$)/.test(path)) return null;

  return path;
}

function decodeSlug(value: string): string | null {
  try {
    const slug = decodeURIComponent(value);
    return slug.length > 0 && slug.length <= 200 ? slug : null;
  } catch {
    return null;
  }
}

export function classifyPath(raw: string): PathInfo | null {
  const path = normalizePath(raw);
  if (!path) return null;

  const parts = path.split("/").filter(Boolean);
  const [first, second] = parts;
  const info = (kind: PageKind, slug: string | null = null): PathInfo => ({ kind, slug, path });

  if (parts.length === 0) return info("HOME");
  if (first === "products" && parts.length === 1) return info("PRODUCTS");
  if (first === "blog" && parts.length === 1) return info("BLOG");
  if (first === "products" && parts.length === 2 && second) {
    const slug = decodeSlug(second);
    return slug ? info("PRODUCT", slug) : null;
  }
  if (first === "categories" && parts.length === 2 && second) {
    const slug = decodeSlug(second);
    return slug ? info("CATEGORY", slug) : null;
  }
  if (first === "blog" && parts.length === 2 && second) {
    const slug = decodeSlug(second);
    return slug ? info("ARTICLE", slug) : null;
  }
  if (first === "cart" && parts.length === 1) return info("CART");
  if (first === "checkout" && parts.length === 1) return info("CHECKOUT");
  if (first === "login") return info("LOGIN");
  if (first === "account") return info("ACCOUNT");

  return info("OTHER");
}

const BOT_RE =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|curl|wget|python-requests|axios|node-fetch|httpclient|monitor|uptime|gtmetrix|pingdom/i;

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT_RE.test(userAgent);
}

export function detectDevice(userAgent: string | null, viewport?: number): Device {
  if (viewport && viewport > 0) {
    if (viewport < 768) return "MOBILE";
    if (viewport < 1100) return "TABLET";
    return "DESKTOP";
  }
  const ua = userAgent ?? "";
  if (/ipad|tablet/i.test(ua)) return "TABLET";
  if (/mobi|android|iphone/i.test(ua)) return "MOBILE";

  return "DESKTOP";
}

export function parseUtm(search: string): { source: string | null; medium: string | null; campaign: string | null } {
  const params = new URLSearchParams(search);
  const pick = (key: string): string | null => {
    const value = params.get(key)?.trim().slice(0, 80);
    return value ? value : null;
  };

  return {
    source: pick("utm_source")?.toLowerCase() ?? null,
    medium: pick("utm_medium")?.toLowerCase() ?? null,
    campaign: pick("utm_campaign"),
  };
}

function fromHost(host: string): TrafficSource | null {
  if (/(^|\.)(t\.me|telegram\.(org|me|dog))$/.test(host) || host.includes("org.telegram")) return "TELEGRAM";
  if (/(^|\.)(instagram\.com|ig\.me)$/.test(host) || host.includes("com.instagram")) return "INSTAGRAM";
  if (/(^|\.)(whatsapp\.com|wa\.me)$/.test(host) || host.includes("com.whatsapp")) return "WHATSAPP";
  if (/(^|\.)(eitaa\.com|rubika\.ir|bale\.ai|ble\.ir|splus\.ir|gap\.im|soroush-hamrah\.ir)$/.test(host)) return "MESSENGER";
  if (
    /(^|\.)(facebook\.com|fb\.com|fb\.me|twitter\.com|t\.co|x\.com|linkedin\.com|lnkd\.in|pinterest\.[a-z.]+|youtube\.com|youtu\.be|aparat\.com|reddit\.com|tiktok\.com)$/.test(
      host,
    )
  ) {
    return "SOCIAL";
  }
  if (
    /(^|\.)(google\.[a-z.]+|bing\.com|yahoo\.com|yandex\.[a-z]+|duckduckgo\.com|ecosia\.org|brave\.com|baidu\.com)$/.test(host) ||
    host.includes("googlequicksearchbox")
  ) {
    return "SEARCH";
  }

  return null;
}

function fromUtm(name: string): TrafficSource {
  if (/telegram|^tg$/.test(name)) return "TELEGRAM";
  if (/instagram|^ig$/.test(name)) return "INSTAGRAM";
  if (/whatsapp/.test(name)) return "WHATSAPP";
  if (/eitaa|rubika|bale|soroush|splus|gap/.test(name)) return "MESSENGER";
  if (/google|bing|yandex|search/.test(name)) return "SEARCH";
  if (/facebook|twitter|^x$|linkedin|youtube|aparat|tiktok|pinterest|social/.test(name)) return "SOCIAL";

  return "REFERRAL";
}

function stripWww(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

/**
 * منبع ورود یک نشست: ۱) utm_source ۲) هاست ارجاع‌دهنده ۳) مرورگر داخلی اپ (UA) ۴) مستقیم.
 * تلگرام/اینستاگرام اغلب referrer نمی‌فرستند؛ برای شمارش دقیق به لینک‌هایتان `?utm_source=telegram` اضافه کنید.
 */
export function classifySource(input: {
  referrer: string;
  utmSource: string | null;
  ownHost: string | null;
  userAgent: string | null;
}): { source: TrafficSource; referrerHost: string | null } {
  let referrerHost: string | null = null;
  if (input.referrer) {
    try {
      referrerHost = stripWww(new URL(input.referrer).hostname) || null;
    } catch {
      referrerHost = null;
    }
  }
  const own = input.ownHost ? stripWww(input.ownHost.split(":")[0] ?? "") : null;
  const isOwn = Boolean(referrerHost && own && referrerHost === own);

  if (input.utmSource) return { source: fromUtm(input.utmSource), referrerHost: isOwn ? null : referrerHost };
  if (referrerHost) {
    if (isOwn) return { source: "INTERNAL", referrerHost: null };
    return { source: fromHost(referrerHost) ?? "REFERRAL", referrerHost };
  }

  const ua = input.userAgent ?? "";
  if (/instagram/i.test(ua)) return { source: "INSTAGRAM", referrerHost: null };
  if (/telegram/i.test(ua)) return { source: "TELEGRAM", referrerHost: null };
  if (/FBAN|FBAV|FB_IAB/.test(ua)) return { source: "SOCIAL", referrerHost: null };

  return { source: "DIRECT", referrerHost: null };
}
