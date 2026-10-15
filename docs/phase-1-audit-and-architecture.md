# Phase 1 — ممیزی ریپازیتوری و معماری پیشنهادی (بانک ابزار)

تاریخ: 2026-10-15 · وضعیت: **پیشنهاد، منتظر تأیید تصمیم‌های بخش ۸**

این سند فقط شامل چیزهایی است که واقعاً بررسی شده‌اند. هرجا نتوانستم چیزی را راستی‌آزمایی کنم، صریحاً «بررسی‌نشده» نوشته‌ام.

---

## ۱. وضعیت واقعی ریپازیتوری (بررسی‌شده)

| مورد | یافته |
|---|---|
| شاخه پیش‌فرض | `master` (نه `main`) — قانون «به main دست نزن» را معادل `master` اجرا می‌کنم |
| تاریخچه | یک کامیت: `3d6b13a project build` |
| محتوا | اسکلت `create-next-app`؛ `app/layout.tsx`، `app/page.tsx` (خالی)، `app/globals.css`، آیکون و SVGهای پیش‌فرض |
| نسخه‌ها (از `package.json`) | next 16.4.1، react/react-dom 19.3.0، typescript ^5، tailwindcss ^4، eslint ^9 |
| ساختار | بدون `src/`، alias: `@/* → ./*` |
| TypeScript | `strict: true` |
| فونت | Geist (لاتین) — برای فارسی مناسب نیست |
| زبان/جهت | `<html lang="en">` بدون `dir="rtl"` |
| Metadata | هنوز پیش‌فرض «Create Next App» |
| تست / CI / Docker / docs | **هیچ‌کدام وجود ندارد** |
| README | متن پیش‌فرض create-next-app |
| `.gitignore` | الگوی `.env*` همه‌چیز را ignore می‌کند، **از جمله `.env.example`** — باید `!.env.example` اضافه شود |
| `AGENTS.md` | دستور می‌دهد قبل از نوشتن کد، مستندات `node_modules/next/dist/docs/` خوانده شود |

نکات قابل‌توجه در `next.config.ts` (فقط مشاهده، بررسی‌نشده با مستندات 16.4.1):

- `cacheComponents: true` و `partialPrefetching: true` فعال هستند. این‌ها روی مدل کش و رندر کل پروژه اثر می‌گذارند، پس قبل از ساخت صفحات محصول/سبد باید با مستندات نسخه نصب‌شده تطبیق داده شوند.
- پکیج `@tailwindcss/turbopack` در `devDependencies` است و loader دستی برای `*.css` تنظیم شده. من این پکیج را نمی‌شناسم و نمی‌توانم درستی‌اش را بدون نصب و مستندات تأیید کنم.
- `app/page.tsx` یک import بلااستفاده از `next/image` دارد (احتمالاً هشدار ESLint).

## ۲. محدودیت محیط (بررسی‌شده، نه فرض)

- `npm ci` اجرا شد و شکست خورد: `registry.npmjs.org` در این محیط **resolve نمی‌شود** (`ENOTFOUND`؛ `curl` هم همین را می‌دهد). پروکسی محیط سالم است ولی این میزبان در `noProxy` قرار دارد و مسیر مستقیم DNS ندارد.
- نتیجه: `node_modules` نصب نشد، پس **اجرا نشد**: `eslint`، `tsc`، `next build`، تست‌ها.
- نتیجه مهم‌تر: مستندات Next 16.4.1 (که `AGENTS.md` الزام کرده) در دسترس نیست. تا آن زمان، هیچ کدی که به APIهای Next 16 وابسته باشد (کش، Route Handler، Server Action، metadata، middleware/proxy) نمی‌نویسم تا الگوی قدیمی ننویسم و بعداً خراب نشود.
- دو مسیر برای رفع: (الف) اجرای همین کار روی محیطی که npm دارد (لپ‌تاپ تو یا Codespaces)، (ب) دسترسی شبکه npm برای این نشست.

## ۳. معماری پیشنهادی

یک اپ Next.js یکپارچه (بدون Express جدا)، لایه‌بندی سرور:

```
app/                 مسیرها (storefront، account، admin، api route handlers)
components/          UI مشترک (Button, Input, ProductCard, Price, ...)
features/<domain>/   UI و schema مخصوص هر دامنه (products, orders, articles ...)
server/
  services/          منطق دامنه (orders, inventory, payments, auth)
  policies/          مجوزدهی (can(user, action, resource))
  repositories/      تنها جایی که به db دست می‌زند
db/                  schema (Drizzle)، migrations، seed توسعه
lib/                 env، money، persian، validation مشترک، rate-limit
tests/               unit / integration / e2e
docs/
```

قاعده‌ها: صفحات هرگز مستقیم به `db` وصل نمی‌شوند؛ هر عملیات حساس از `services` رد می‌شود و آنجا auth + zod + policy چک می‌شود.

### تصمیم‌های کلیدی و دلیل

1. **سشن سمت‌سرور در PostgreSQL (نه NextAuth/JWT).** تصویر مرجع «NextAuth (JWT)» نوشته، ولی پرامپت سشن مدیریت‌شده سمت سرور می‌خواهد. با ورود فقط با OTP موبایل، پیاده‌سازی سشن ساده (توکن تصادفی در کوکی HttpOnly، هش آن در جدول `sessions`) کم‌وابستگی‌تر، قابل ابطال فوری و ساده‌تر برای نگهداری است. NextAuth برای OAuth ارزش دارد که اینجا نیاز نیست.
2. **قیمت = عدد صحیح به «تومان».** بدون اعشار؛ زرین‌پال ریال می‌خواهد، تبدیل (×۱۰) فقط در لایه درگاه انجام می‌شود. نوع ستون: `bigint`.
3. **جست‌وجو با PostgreSQL**: ستون `search_text` نرمال‌شده (ی/ي، ک/ك، ارقام فارسی/عربی→لاتین، حذف نیم‌فاصله اضافه) + `pg_trgm` و GIN. بدون موتور جست‌وجوی جدا.
4. **ریت‌لیمیت در PostgreSQL** (بدون Redis) تا هزینه و پیچیدگی کم بماند؛ اگر ترافیک رشد کرد بعداً Redis.
5. **مقاله**: ذخیره به‌صورت JSON ساختاریافته (Tiptap/ProseMirror) و رندر سمت سرور از روی schema؛ هرگز HTML خام ذخیره/اجرا نمی‌شود.
6. **Mock Provider پرداخت** فقط وقتی `NODE_ENV !== production` فعال باشد؛ در production اگر پیکربندی نباشد، برنامه شروع نمی‌شود.

## ۴. مدل داده (پیش‌نویس)

مبلغ‌ها `bigint` تومان؛ زمان‌ها `timestamptz` (UTC)؛ نمایش با `Asia/Tehran`.

- `users` — `id`، `phone` (unique، فرمت نرمال `09xxxxxxxxx`)، `name`، `role` (`customer|admin`)، `phone_verified_at` (null برای مشتری ساخته‌شده توسط ادمین)، `status`، `created_by`
- `otp_codes` — `phone`، `code_hash`، `expires_at`، `attempts`، `consumed_at`
- `sessions` — `token_hash` (unique)، `user_id`، `expires_at`، `revoked_at`
- `addresses` — گیرنده، تلفن، استان، شهر، آدرس، پلاک، واحد، کدپستی، `user_id`
- `brands`، `categories` (`parent_id`، `slug` unique، وضعیت انتشار، فیلدهای SEO)
- `products` — `slug` unique، `category_id`، `brand_id`، `price`، `compare_at_price`، `status` (`draft|published|archived`)، `deleted_at`، `specs` (jsonb)، `stock_on_hand`، `stock_reserved`، `low_stock_threshold`، `search_text`
- `product_images`
- `carts`، `cart_items` (فقط `product_id` + `qty`؛ قیمت هرگز ذخیره/اعتماد نمی‌شود)
- `orders` — `order_number` (unique)، `user_id`، `channel` (`web|phone|in_store`)، `status`، `payment_status`، `payment_method` (`online|cod`)، جمع‌ها، `shipping_address` (snapshot jsonb)، `idempotency_key` (unique)، `created_by`
- `order_items` — snapshot نام/قیمت/تعداد؛ FK به محصول با `ON DELETE RESTRICT`
- `order_status_history`
- `payments` — `order_id`، `provider`، `authority` (unique)، `ref_id`، `amount`، `status`، `verified_at`
- `inventory_movements` (ledger، فقط INSERT) — `product_id`، `delta`، `on_hand_after`، `type` (`purchase|sale|reserve|release|adjust|in_store_sale|return`)، `reason`، `order_id`، `actor_id`
- `articles` — `slug` unique، `content` (jsonb)، `status`، `published_at`، SEO، تصویر شاخص
- `audit_logs`، `rate_limits`، `settings`

محصولات تنوع‌دار (`variants`) در نسخه اول **نیست** مگر در بخش ۸ تأیید شود؛ اضافه‌کردنش بعداً بدون بازنویسی ممکن است.

## ۵. سیاست‌های مالی و انبار (پیشنهاد، برای تأیید)

**وضعیت سفارش:** `pending_payment → confirmed → processing → shipped → delivered`؛ و `cancelled` از `pending_payment|confirmed|processing`. انتقال‌ها در یک جدول مجاز در سرور کنترل می‌شوند.

**وضعیت پرداخت (مستقل):** `unpaid → paid | failed | refunded`؛ `paid` فقط توسط سرویس پرداخت (پس از Verify رسمی) یا ثبت صریح ادمین برای COD (با لاگ) قابل‌تنظیم است، نه با تغییر ساده وضعیت سفارش.

**موجودی:** یک سیاست واحد برای هر دو روش پرداخت:
1. هنگام ایجاد سفارش، در یک تراکنش با `SELECT ... FOR UPDATE` (یا `UPDATE ... WHERE stock_on_hand - stock_reserved >= qty`) موجودی **رزرو** می‌شود.
2. پرداخت آنلاین: رزرو ۱۵ دقیقه اعتبار دارد؛ با Verify موفق، رزرو به فروش قطعی تبدیل می‌شود؛ با انقضا/لغو آزاد می‌شود.
3. COD: رزرو تا تأیید ادمین ثابت می‌ماند و با تأیید به فروش قطعی تبدیل می‌شود.
4. فروش حضوری/تلفنی ادمین از همان سرویس مرکزی می‌گذرد.
5. هر تغییر یک ردیف در `inventory_movements` می‌سازد؛ `payments.authority` unique و بررسی وضعیت قبل از Verify، Callback تکراری را بی‌اثر می‌کند.

**انقضای رزرو:** روی هاست ارزان cron مطمئن نیست؛ پس «انقضای تنبل» (هنگام هر خواندن/رزرو موجودی، رزروهای منقضی آزاد می‌شوند) + یک endpoint محافظت‌شده برای زمان‌بند خارجی.

## ۶. نقش‌ها و مجوزها

`customer`: فقط منابع خودش (بررسی مالکیت در سرور). `admin`: مدیریت کامل. تغییر دستی موجودی به مقدار منفی ممنوع و علت اجباری است. نقش از body درخواست هرگز پذیرفته نمی‌شود.

## ۷. ریسک‌ها

| ریسک | شدت | کاهش |
|---|---|---|
| نبود npm در این محیط، عدم تأیید build/test | بالا | اجرای CI/لوکال؛ گزارش صادقانه |
| flagهای `cacheComponents` روی داده‌های خصوصی (سبد، سفارش) | بالا | بررسی مستندات 16.4.1 قبل از هر صفحه خصوصی |
| بودجه ۴–۵ میلیون تومان/سال برای Node + Postgres + بکاپ ممکن است کافی نباشد | بالا | بررسی قیمت واقعی بازار (در این نشست انجام نشده)؛ استقرار مرحله‌ای |
| هاست اشتراکی cPanel معمولاً Postgres/Node دائمی را پایدار پشتیبانی نمی‌کند | بالا | مسیر B (VPS) یا Postgres مدیریت‌شده |
| ارسال OTP نیازمند سرویس پیامک ایرانی (کلید/قرارداد) | متوسط | رابط قابل‌تعویض + Mock فقط در توسعه |
| زرین‌پال نیازمند مرچنت و دامنه تأییدشده | متوسط | رابط درگاه قابل‌تعویض |
| فونت Vazirmatn: مجوز و self-host | کم | بررسی مجوز قبل از افزودن |

## ۸. تصمیم‌هایی که نیاز به تأیید تو دارند

1. **هاست/دیتابیس:** مسیر B (VPS + Docker Compose) را هدف بگیرم، و Vercel فقط برای Preview؟ (هاست اشتراکی cPanel که در تصویر آمده برای Postgres مناسب نیست.)
2. **سشن:** سشن سمت‌سرور خودی به‌جای NextAuth — موافقی؟
3. **تنوع محصول (Variants):** در نسخه اول لازم است؟ (پیشنهاد: خیر.)
4. **سیاست رزرو:** ۱۵ دقیقه برای آنلاین، و رزرو تا تأیید ادمین برای COD — موافقی؟
5. **ارسال:** هزینه ارسال ثابت، رایگان بالای یک مبلغ، یا محاسبه‌شده؟ و COD برای همه شهرها یا محدود؟
6. **سرویس پیامک** مدنظر (کاوه‌نگار، ملی‌پیامک، ...)؟
7. **مرجع تأیید ادغام:** ریپو `master` دارد؛ منظورت از «main» همین `master` است؟

## ۹. برنامه اجرا

Phase 2 (پایه و Design System، RTL، Vazirmatn، توکن‌ها، کامپوننت‌ها، schema+migration، Docker) → Phase 3 (کاتالوگ و سبد) → 4 (احراز هویت) → 5 (سفارش/انبار/پرداخت) → 6 (ادمین) → 7 (مقاله/SEO) → 8 (امنیت/تست) → 9 (CI/CD و استقرار).

**پیش‌شرط شروع Phase 2:** دسترسی npm برای نصب وابستگی‌ها و خواندن مستندات Next 16.4.1.
