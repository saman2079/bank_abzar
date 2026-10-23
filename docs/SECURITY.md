# مرور امنیتی (OWASP Top 10) — فاز ۸

> وضعیت: مرور کد توسط Claude (بدون اجرای ابزار خودکار). `npm audit`، CodeQL و gitleaks در CI اجرا می‌شوند؛ تست نفوذ واقعی انجام نشده.

| OWASP | وضعیت | توضیح |
|---|---|---|
| A01 Broken Access Control | ✅ مرور شد | سفارش/آدرس/پرداخت همیشه با `userId` سشن فیلتر می‌شوند (IDOR بسته). هر action/route/صفحه‌ی ادمین با `requireStaff/requireAdmin`. آپلودها بدون سشن ۴۰۱. |
| A02 Cryptographic Failures | ✅ | رمز ادمین Argon2id؛ OTP با HMAC؛ کوکی httpOnly/secure/sameSite؛ HSTS در production. |
| A03 Injection | ✅ | فقط Prisma (پارامتری)؛ ورودی‌ها با Zod؛ HTML مقاله با `sanitize-html` هنگام ذخیره و هنگام خواندن. |
| A04 Insecure Design | ✅ | قیمت/موجودی/مبلغ پرداخت فقط سرور؛ کسر موجودی اتمیک (`updateMany where stock >= n`). |
| A05 Security Misconfiguration | ✅ | CSP + هدرهای امنیتی در `next.config.ts`؛ `poweredByHeader:false`. ⚠️ `script-src 'unsafe-inline'` (به‌خاطر کش/استاتیک، nonce ممکن نیست). |
| A06 Vulnerable Components | 🔄 | `npm audit` در CI + Dependabot هفتگی. |
| A07 Auth Failures | ✅ | OTP حداکثر ۵ تلاش + rate-limit؛ زمان ورود ادمین یکسان‌سازی شده؛ پیام خطای عمومی. |
| A08 Integrity Failures | ✅ | پرداخت فقط با verify سمت سرور زرین‌پال؛ CI با اکشن‌های پین‌شده توسط Dependabot. |
| A09 Logging/Monitoring | ⚠️ | جدول audit برای کارهای ادمین هست؛ مانیتورینگ/هشدار در فاز ۹. |
| A10 SSRF | ✅ | سرور به URL دلخواه کاربر درخواست نمی‌زند. |

## Rate-limit
ورود/OTP، آپلود، جستجو (۴۰/دقیقه/IP)، سبد (۱۲۰/دقیقه/IP).

## ریسک‌های باز
- `unsafe-inline` در CSP.
- ریدایرکت ۳۰۱ اسلاگ محصول/دسته هنوز نیست (سئو، نه امنیت).
- بعد از دیپلوی: تست CSP روی صفحه‌ی پرداخت و ادیتور Tiptap؛ در صورت بلاک شدن منبعی، `Content-Security-Policy` را تنظیم کنید.
