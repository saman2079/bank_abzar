import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // بخش‌های خصوصی؛ (/uploads عمداً باز است تا تصاویر ایندکس شوند)
        disallow: ["/admin", "/api/", "/account", "/cart", "/checkout", "/login"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
