export type RawSearchParams = Record<string, string | string[] | undefined>;

export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** شماره‌ی صفحه‌ی امن از URL (۱ تا ۱۰۰۰). */
export function pageParam(value: string | string[] | undefined): number {
  const page = Number(firstParam(value));
  return Number.isInteger(page) && page >= 1 && page <= 1000 ? page : 1;
}
