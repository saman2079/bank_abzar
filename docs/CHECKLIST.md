# چک‌لیست پروژه بانک ابزار
> هر کار تمام شد `[ ]` را به `[x]` تغییر بده (و در چت بگو تا آپدیت کنیم). فقط ردیف‌های باز را در چت جدید ادامه بده.

## وضعیت فعلی (برای چت جدید — اول این بخش را بخوان)

**شیوه کار:** روی ریپوی کاربر کامیت/پوش نکن. فایل‌های کامل و آماده‌ی کپی‌پیست بده (کوتاه، بدون توضیح اضافه)، و بعد از هر تحویل کد همین چک‌لیست را آپدیت کن.

**تحویل‌شده ولی هنوز تأیید نشده:** کد فاز ۰ و ۱ و ۲ تحویل شده، اما `lint`/`typecheck`/`build` هیچ‌وقت اجرا نشده (محیط Claude به npm دسترسی ندارد). اولین کار: خروجی `npm run lint && npm run typecheck && npm run build` را از کاربر بگیر، خطاها را رفع کن، سپس موارد تأییدشده را تیک بزن.

**وابستگی‌های لازم** (کاربر باید نصب کرده باشد): `zod`, `lucide-react`, `@fontsource-variable/vazirmatn`, `server-only`, `@prisma/client@7`, `@prisma/adapter-pg`, `pg`, `dotenv`؛ و dev: `prettier`, `prisma@7`, `tsx`, `@types/pg`. اسکریپت‌های `postinstall` (`prisma generate`)، `db:up`, `db:migrate`, `db:deploy`, `db:seed`, `db:studio` و بلوک `"prisma"`/seed در package.json لازم است. `/generated` را به `.gitignore` اضافه کن. بعد از `db:migrate` پوشه‌ی `prisma/migrations` را کامیت کن. اسکریپت‌های `typecheck` (`tsc --noEmit`)، `format`، `format:check` باید در `package.json` باشند. فایل قدیمی `app/page.tsx` باید حذف شده باشد (صفحه اصلی در `app/(storefront)/page.tsx` است).

**قرارداد کاتالوگ (از فاز ۲ با Prisma + `'use cache'`):** `modules/catalog/{constants,types,schemas,queries}.ts`؛ `mock-data.ts` فقط منبع seed است. توابع `queries.ts`: `listProducts` (جستجوی `q` کش نمی‌شود), `listFeaturedProducts`, `listBrands`, `listCategories`, `getProductBySlug`, `getRelatedProducts(slug)`, `getCategoryBySlug`, `listProductSlugs`. تگ‌ها در `lib/cache.ts`؛ بی‌اعتبارسازی: `updateTag(tag)` فقط در Server Action، `revalidateTag(tag,'max')` در Route Handler. چون `generateStaticParams` و صفحه‌ی اصلی از DB می‌خوانند، build به دیتابیس نیاز دارد (در CI: migrate+seed قبل از build). موجودی: `ProductDetail.stock` منبع حقیقت است و `inStock` از آن مشتق می‌شود.

**قانون cacheComponents:** `searchParams` فقط داخل `<Suspense>` خوانده شود (`ProductListing`). `params` صفحه‌ی محصول/دسته بیرون Suspense و همراه `generateStaticParams` خوانده می‌شود تا slug ناموجود ۴۰۴ واقعی بدهد؛ سازگاری این الگو با Next 16.4 هنوز تأیید نشده و اگر build خطای blocking-route داد باید اصلاح شود.

**نکته‌های باز:** `app/not-found.tsx` بدون هدر/فوتر است (۴۰۴ داخل storefront هم از همین می‌آید)؛ تصاویر محصول/هیرو placeholder هستند؛ دکمه‌های سبد و علاقه‌مندی فقط ظاهری‌اند تا فاز ۴؛ `Product` JSON-LD هنوز `image` ندارد.

## فاز ۰ — آماده‌سازی ریپو
- [ ] کپی `CLAUDE.md` در ریشه و `ARCHITECTURE.md` + `CHECKLIST.md` در `docs/`
- [ ] ذخیره تصویر دیزاین در `docs/design/home.png`
- [ ] `npm install` و خواندن `node_modules/next/dist/docs/` (cache components، proxy، metadata)
- [ ] تغییر branch به `main` + محافظت از آن
- [ ] اسکریپت‌ها: `typecheck`, `test`, `format` — فایل‌های Prettier/ESLint داده شد؛ ۴ اسکریپت را دستی در package.json اضافه کن
- [ ] Husky/lint-staged + commitlint (اختیاری)
- [x] `lib/env.ts` (Zod) و `.env.example`
- [x] README واقعی (نصب، اجرا، دیپلوی)

## فاز ۱ — فرانت‌اند و دیزاین
- [x] Tailwind توکن‌ها (رنگ/فاصله/شعاع) در `@theme`
- [x] فونت Vazirmatn (از پکیج `@fontsource-variable/vazirmatn`، self-host) + `dir="rtl"` + `lang="fa"`
- [ ] کامپوننت‌های UI: Button, Badge, Input, Select, Card, Skeleton, Pagination ✓ — مانده: Modal/Sheet, Toast (هر وقت اولین نیاز واقعی پیش آمد)
- [x] Header (دسکتاپ) + Bottom nav (موبایل) + Footer
- [x] هوم: هیرو، دسته‌ها، پیشنهاد ویژه (اسکرول CSS، بدون فلش)، بنرها، نوار اعتماد، باکس جستجو — تصاویر واقعی جایگزین placeholder شود
- [x] ProductCard (برند، امتیاز، قیمت/تخفیف، سبد) — دکمه‌های سبد/علاقه‌مندی در فاز ۴ فعال می‌شوند
- [x] صفحات: لیست محصول با جستجو/دسته/مرتب‌سازی/صفحه‌بندی، جزئیات محصول (+JSON-LD)، دسته، صفحه سبد (فقط حالت خالی؛ منطق واقعی در فاز ۴)
- [x] صفحه‌های استاتیک: درباره ما، تماس، قوانین — متن نهایی از صاحب فروشگاه گرفته شود
- [ ] دموی Vercel با دیتای نمایشی

## فاز ۲ — دیتابیس و کاتالوگ
- [x] Prisma schema (`prisma/schema.prisma`, `prisma.config.ts`, `lib/db.ts`) — migration اولیه را کاربر با `npm run db:migrate` (نام `init`) می‌سازد و کامیت می‌کند [ ]
- [x] Seed (`prisma/seed.ts`، قابل اجرای مجدد)
- [x] `modules/catalog` (queries) + کش `use cache` + تگ‌ها (`lib/cache.ts`)
- [x] جستجو (نام/برند، contains+insensitive) + اندیس‌های sort/فیلتر؛ (بعداً در صورت نیاز pg_trgm)
- [x] اتصال صفحات فروشگاه به DB (صفحه‌ی اصلی async شد) — تأیید با اجرای واقعی مانده

## فاز ۳ — احراز هویت و حساب
- [ ] اینترفیس SMS + یک provider (کاوه‌نگار/ملی‌پیامک/…)
- [ ] OTP (hash، انقضا، تلاش، rate-limit)
- [ ] سشن DB-backed + کوکی امن + logout
- [ ] نقش‌ها و `requireUser/requireAdmin`
- [ ] صفحه ورود/ثبت‌نام با شماره موبایل
- [ ] پروفایل + مدیریت آدرس‌ها
- [ ] ورود ادمین (رمز Argon2id)

## فاز ۴ — سبد، سفارش، انبار
- [ ] سبد (مهمان + لاگین + merge)
- [ ] چک‌اوت: انتخاب/ثبت آدرس اجباری، هزینه ارسال
- [ ] ساخت سفارش در تراکنش + کسر اتمیک موجودی + `StockMovement`
- [ ] انقضای سفارش پرداخت‌نشده + کرون + برگشت موجودی
- [ ] صفحه سفارش‌های من + timeline وضعیت
- [ ] تست همزمانی انبار

## فاز ۵ — پرداخت
- [ ] interface `PaymentGateway` + adapter زرین‌پال
- [ ] request/callback/verify + idempotency
- [ ] صفحه نتیجه پرداخت (موفق/ناموفق)
- [ ] (بعد) کارت‌به‌کارت با تأیید ادمین

## فاز ۶ — پنل ادمین
- [ ] لی‌اوت ادمین + داشبورد (فروش، کمبود موجودی، سفارش‌های جدید)
- [ ] CRUD محصول (تصاویر، مشخصات، SEO، وضعیت)
- [ ] CRUD دسته‌بندی (درختی) و برند
- [ ] انبار: لیست موجودی، افزایش/کاهش دستی با دلیل، تاریخچه
- [ ] سفارش‌ها: لیست/فیلتر/جزئیات/تغییر وضعیت + History
- [ ] ثبت سفارش دستی برای مشتری تلفنی
- [ ] کاربران: لیست، ساخت کاربر تلفنی، ویرایش، غیرفعال‌سازی
- [ ] مدیریت رسانه (آپلود، alt، sharp→WebP)
- [ ] AuditLog + صفحه نمایش
- [ ] تنظیمات (هزینه ارسال، تماس، …)

## فاز ۷ — مقاله و سئو
- [ ] مدل و CRUD مقاله + پیش‌نویس/انتشار
- [ ] ادیتور Tiptap (RTL، تصویر، جدول، لینک، heading) + sanitize
- [ ] صفحات `/blog` و `/blog/[slug]` با JSON-LD Article
- [ ] `generateMetadata` همه صفحات + canonical + OG
- [ ] JSON-LD: Product, Breadcrumb, Organization, WebSite
- [ ] `sitemap.ts` و `robots.ts`
- [ ] ریدایرکت ۳۰۱ برای تغییر slug
- [ ] revalidation بعد از ویرایش ادمین
- [ ] بررسی Lighthouse/CWV و Search Console

## فاز ۸ — امنیت و کیفیت
- [ ] هدرهای امنیتی + CSP
- [ ] بررسی IDOR همه مسیرهای کاربر
- [ ] rate-limit روی OTP/لاگین/آپلود/جستجو
- [ ] تست‌های Vitest (انبار، سفارش، OTP، قیمت)
- [ ] تست‌های Playwright (مسیر خرید، ادمین)
- [ ] `npm audit` + Dependabot + secret scanning
- [ ] مرور نهایی امنیت (OWASP Top 10)

## فاز ۹ — Docker، CI/CD، سرور
- [ ] `next.config.ts` → `output: 'standalone'`
- [ ] Dockerfile چندمرحله‌ای non-root
- [ ] `compose.yml` (app, postgres, caddy) + volumeها + limits
- [x] `ci.yml` (lint/typecheck/test/Postgres+migrate+seed/build/audit)
- [ ] `deploy.yml` (build → انتقال → migrate → healthcheck → rollback)
- [ ] خرید سرور (۲ vCPU / ۴GB) + دامنه + DNS
- [ ] سخت‌سازی سرور: SSH key، ufw، fail2ban، آپدیت خودکار
- [ ] Caddy + HTTPS
- [ ] بکاپ روزانه Postgres + کپی خارج از سرور + تست ریستور
- [ ] مانیتورینگ ساده (health endpoint + uptime check)
- [ ] انتشار و تحویل به دوست (آموزش پنل ادمین)

## ورودی‌های مورد نیاز از صاحب فروشگاه
- [ ] لوگو و نام نهایی، اطلاعات تماس و آدرس
- [ ] دامنه
- [ ] مرچنت‌کد زرین‌پال
- [ ] پنل پیامک (API key + خط)
- [ ] روش‌ها و هزینه ارسال
- [ ] لیست اولیه محصولات/دسته‌ها/تصاویر