/** پیشنهاد OWASP برای Argon2id: 19MiB، ۲ تکرار، ۱ موازی. الگوریتم پیش‌فرض @node-rs/argon2 همان Argon2id است. */
export const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;
