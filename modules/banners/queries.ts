import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";
import { db } from "@/lib/db";
import { MAX_ACTIVE_BANNERS } from "./constants";
import type { BannerSlide } from "./types";

/**
 * بنرهای قابل نمایش در اسلایدر: فعال و داخل بازه‌ی زمانی. کش چند دقیقه‌ای است تا شروع/پایان زمان‌دار
 * بدون دخالت دستی اعمال شود؛ با هر تغییر در پنل هم تگ `banners` فوراً بی‌اعتبار می‌شود.
 */
export async function listActiveBanners(): Promise<BannerSlide[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.banners);

  const now = new Date();
  return db.banner.findMany({
    where: {
      isActive: true,
      AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: MAX_ACTIVE_BANNERS,
    select: {
      id: true,
      title: true,
      subtitle: true,
      ctaLabel: true,
      linkUrl: true,
      imageUrl: true,
      mobileImageUrl: true,
      imageAlt: true,
    },
  });
}
