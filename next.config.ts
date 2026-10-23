import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * CSP: با Cache Components صفحه‌ها پیش‌رندر/کش می‌شوند، پس nonce به‌ازای درخواست ممکن نیست؛
 * ‌'unsafe-inline' برای اسکریپت‌های داخلی خود Next لازم است (موازنه‌ی آگاهانه).
 * در عوض همه‌ی منابع بیرونی، فریم، object، base و ارسال فرم محدود شده‌اند.
 * در dev به‌خاطر React refresh، 'unsafe-eval' لازم است.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  // پرداخت: بعد از ثبت، کاربر به درگاه زرین‌پال ریدایرکت می‌شود.
  "form-action 'self' https://www.zarinpal.com",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // HSTS فقط روی production (روی localhost/HTTP بی‌اثر یا مزاحم است).
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // فقط برای درایور blob (دموی Vercel) لازم است؛ برای درایور local بی‌اثر است.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
