/** نقض یکتایی در Prisma (کد P2002)؛ بدون وابستگی به کلاس‌های generated. */
export function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
