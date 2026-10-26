/** وضعیت فرم‌ها برای `useActionState` */
/** `phone`: شماره‌ی واردشده؛ بعد از خطا در فرم می‌ماند (React 19 فیلدهای کنترل‌نشده را بعد از action خالی می‌کند). رمز هرگز برنمی‌گردد. */
export type FormState = { error?: string; phone?: string };
