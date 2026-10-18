/** وضعیت فرم‌ها برای `useActionState` */
export type OtpRequestState = { step: "phone" | "code"; phone?: string; error?: string };
export type FormState = { error?: string };