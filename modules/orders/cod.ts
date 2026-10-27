/** پرداخت در محل فقط برای آدرس‌های شهر تهران مجاز است (قانون سمت سرور؛ UI فقط نمایش می‌دهد). */
function normalize(value: string): string {
  return value.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[\s\u200c]+/g, "");
}

export function isCodEligible(address: { province: string; city: string }): boolean {
  return normalize(address.province) === "تهران" && normalize(address.city) === "تهران";
}

export const COD_NOT_ELIGIBLE_MESSAGE = "پرداخت در محل فقط برای آدرس‌های داخل شهر تهران ممکن است.";
