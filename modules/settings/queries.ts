import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";
import { db } from "@/lib/db";
import { DEFAULT_SHIPPING, SETTING_KEYS, type ShippingSettings } from "./constants";
import { storedShippingSchema } from "./schemas";

/** تنظیمات ارسال؛ کش می‌شود و بعد از ذخیره در پنل با تگ `settings` بی‌اعتبار می‌شود. */
export async function getShippingSettings(): Promise<ShippingSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.settings);

  const row = await db.setting.findUnique({ where: { key: SETTING_KEYS.shipping } });
  const parsed = storedShippingSchema.safeParse(row?.value);

  return parsed.success ? parsed.data : DEFAULT_SHIPPING;
}
