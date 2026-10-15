const MAX_SAFE_AMOUNT = Number.MAX_SAFE_INTEGER;

export function assertTomanAmount(value: number, fieldName = "مبلغ"): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_SAFE_AMOUNT) {
    throw new Error(`${fieldName} باید عدد صحیح نامنفی و در محدوده امن باشد.`);
  }
}

export function formatToman(value: number): string {
  assertTomanAmount(value);
  return `${new Intl.NumberFormat("fa-IR").format(value)} تومان`;
}

export function tomanToRial(value: number): number {
  assertTomanAmount(value);
  const rial = value * 10;
  if (!Number.isSafeInteger(rial)) {
    throw new Error("مبلغ برای تبدیل به ریال بیش از محدوده امن است.");
  }
  return rial;
}

export function rialToToman(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0 || value % 10 !== 0) {
    throw new Error("مبلغ ریالی باید عدد صحیح نامنفی و مضرب ۱۰ باشد.");
  }
  return value / 10;
}
