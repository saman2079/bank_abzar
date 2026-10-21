# نقشه‌ی ساختار پروژه — هر فایل برای کدام بخش است
> منبع حقیقت: ریپوی `saman2079/bank_abzar` (شاخه‌ی `master`). قانون: `app/` نازک؛ منطق در `modules/`؛ `lib/` ابزار مشترک.
> جریان: صفحه/اکشن → `modules/<دامنه>/(queries|actions)` → `service` → Prisma. هر Action: `requireStaff|requireAdmin|requireUser → Zod → service → updateTag`.

## ریشه
| فایل | کار |
|---|---|
| `prisma/schema.prisma` | همه‌ی مدل‌ها (کاتالوگ، کاربر/OTP/سشن/آدرس، سبد/سفارش/انبار، پرداخت، AuditLog، Setting) |
| `prisma/migrations/` | migrationها — کامیت شود؛ سرور با `prisma migrate deploy` |
| `prisma/seed.ts` · `create-admin.ts` · `check-concurrency.ts` | seed نمایشی · ساخت ادمین (`npm run admin:create`) · تست همزمانی انبار |
| `lib/env.ts` | تنها نقطه‌ی خواندن env (Zod) |
| `next.config.ts` | تنظیمات Next (`vercel.json` فعلاً نداریم) |
| `.env.example` · `docs/` | نمونه‌ی env · CLAUDE/ARCHITECTURE/CHECKLIST/STRUCTURE |
| `uploads/` (gitignore) | تصاویر آپلودشده‌ی درایور `local` |

## `app/` — فقط routing
| مسیر | بخش |
|---|---|
| `(storefront)/` | سایت مشتری: `page.tsx` هوم، `products`، `categories`، `cart`، `checkout`، `login`، `about/contact/rules`، `account/` (پروفایل، آدرس‌ها، سفارش‌ها) |
| `admin/login` | ورود ادمین/کارمند (رمز) |
| `admin/(panel)/` | پنل (گیت `requireStaff`): `page.tsx` داشبورد، `products`، `categories`، `brands`، `inventory`، `orders` (+`new` سفارش دستی، `[id]`)، `invoices` (+`new`، `[id]` سند/چاپ، `[id]/edit`)، `users` (ADMIN)، `audit` (ADMIN)، `settings` (ADMIN) |
| `api/payments/zarinpal/callback` | بازگشت درگاه → verify → PAID |
| `api/internal/cron` | کرون (GET/POST با `Bearer CRON_SECRET`): انقضای سفارش، بازبینی پرداخت، پاک‌سازی |
| `api/admin/products/[id]/images` | آپلود چندفایلی تصویر محصول (staff) |
| `uploads/[...path]` | سرو تصاویر درایور `local` (روی Vercel بلااستفاده) |

## `modules/` — منطق هر دامنه
| ماژول | محتوا |
|---|---|
| `catalog/` | خواندن عمومی (`use cache` + تگ)، `admin/` = CRUD محصول/دسته/برند، `types`، `mock-data` (فقط seed) |
| `auth/` | OTP، رمز Argon2id، ورود/خروج، ریدایرکت امن |
| `users/` | پروفایل/آدرس مشتری؛ `admin/` = مدیریت کاربران (ADMIN) |
| `cart/` | سبد مهمان (کوکی) + کاربر (DB) + merge |
| `orders/` | `placeOrder` (تراکنش اتمیک)، لغو/انقضا؛ `admin/` = تغییر وضعیت، لیست/جزئیات، **ثبت سفارش دستی** (`manual-service.ts`) |
| `payments/` | شروع پرداخت، settle، reconcile |
| `invoices/` | **فاکتور/پیش‌فاکتور فروش خارج از سایت**: `constants` (وضعیت‌ها، `calcInvoiceTotals`، `INVOICE_SELLER`)، `schemas`، `service` (ذخیره/ویرایش پیش‌فاکتور، قطعی‌کردن با کسر اتمیک انبار، ابطال با برگشت موجودی)، `queries`، `actions` |
| `inventory/` | تغییر دستی موجودی + دفتر `StockMovement` |
| `media/` | پردازش sharp→WebP، افزودن/حذف/جابه‌جایی/alt تصاویر محصول |
| `settings/` | تنظیمات فروشگاه (فعلاً هزینه‌ی ارسال) |
| `dashboard/` · `audit/` | کوئری‌های داشبورد · گزارش تغییرات |

## `lib/`
`db` (Prisma)، `session`/`dal` (سشن و `requireUser/Staff/Admin`)، `rate-limit` (Postgres)، `audit`، `cache` (تگ‌ها)، `sms/` (console/kavenegar)، `payments/` (اینترفیس + زرین‌پال)، `storage/` (درایور `local` و `blob` برای تصاویر)، `seo`، `format`، `phone`، `date`، `form`، `query-params`، `db-errors`، `maintenance`، `request`.

## `components/`
`ui/` پایه · `layout/` هدر/فوتر/ناوبری · `home/` هوم · `catalog/` لیست · `shared/` (کارت محصول، `product-image`، JSON-LD، breadcrumb) · `auth/` · `account/` · `cart/` · `orders/` · `invoices/` (سند چاپی A4 + نشان وضعیت + دکمه‌ی چاپ) · `admin/` (منوی ریسپانسیو `admin-nav`/`admin-mobile-nav`، فرم‌ها و جدول‌های پنل؛ `product-images`، `manual-order-form`، `shipping-settings-form`، …).
