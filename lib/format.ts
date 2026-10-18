const faNumber = new Intl.NumberFormat("fa-IR");

export function formatNumber(value: number): string {
  return faNumber.format(value);
}

export function formatToman(value: number): string {
  return `${faNumber.format(value)} تومان`;
}

/** درصد تخفیف بر اساس قیمت قبل و بعد؛ اگر تخفیف نباشد 0 برمی‌گرداند. */
export function discountPercent(price: number, compareAtPrice?: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round((1 - price / compareAtPrice) * 100);
}