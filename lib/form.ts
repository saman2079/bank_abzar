/** مقدار فیلد فرم به‌صورت رشته؛ فیلد غایب یا فایل → رشته‌ی خالی (تا Zod پیام فارسی بدهد، نه خطای نوع). */
export function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** وضعیت فرم‌های پنل برای `useActionState`. */
export type ActionState = { ok?: boolean; error?: string };
