# چک‌لیست پروژه بانک ابزار
> هر کار تمام شد `[ ]` را به `[x]` تغییر بده (و در چت بگو تا آپدیت کنیم). فقط ردیف‌های باز را در چت جدید ادامه بده.

## وضعیت فعلی (برای چت جدید — اول این بخش را بخوان)

**شیوه کار:** روی ریپوی کاربر کامیت/پوش نکن. فایل‌های کامل و آماده‌ی کپی‌پیست بده (کوتاه، بدون توضیح اضافه)، و بعد از هر تحویل کد همین چک‌لیست را آپدیت کن.

**تحویل‌شده ولی هنوز تأیید نشده:** کد فاز ۰ تا ۵ تحویل شده، اما `lint`/`typecheck`/`build` هیچ‌وقت اجرا نشده (محیط Claude به npm دسترسی ندارد). اولین کار: خروجی `npm run lint && npm run typecheck && npm run build` را از کاربر بگیر، خطاها را رفع کن، سپس موارد تأییدشده را تیک بزن.

**وابستگی‌های لازم** (کاربر باید نصب کرده باشد): `zod`, `lucide-react`, `@fontsource-variable/vazirmatn`, `server-only`, `@prisma/client@7`, `@prisma/adapter-pg`, `pg`, `dotenv`, `@node-rs/argon2`؛ و dev: `prettier`, `prisma@7`, `tsx`, `@types/pg`. اسکریپت‌های `postinstall` (`prisma generate`)، `db:up`, `db:migrate`, `db:deploy`, `db:seed`, `db:studio`, `admin:create` (`tsx prisma/create-admin.ts`), `check:concurrency` (`tsx --conditions=react-server --env-file=.env.local prisma/check-concurrency.ts`) و بلوک `"prisma"`/seed در package.json لازم است. `/generated` را به `.gitignore` اضافه کن. بعد از `db:migrate` پوشه‌ی `prisma/migrations` را کامیت کن. اسکریپت‌های `typecheck` (`tsc --noEmit`)، `format`، `format:check` باید در `package.json` باشند. فایل قدیمی `app/page.tsx` باید حذف شده باشد (صفحه اصلی در `app/(storefront)/page.tsx` است).

**قرارداد کاتالوگ (از فاز ۲ با Prisma + `'use cache'`):** `modules/catalog/{constants,types,schemas,queries}.ts`؛ `mock-data.ts` فقط منبع seed است. توابع `queries.ts`: `listProducts` (جستجوی `q` کش نمی‌شود), `listFeaturedProducts`, `listBrands`, `listCategories`, `getProductBySlug`, `getRelatedProducts(slug)`, `getCategoryBySlug`, `listProductSlugs`. تگ‌ها در `lib/cache.ts`؛ بی‌اعتبارسازی: `updateTag(tag)` فقط در Server Action، `revalidateTag(tag,'max')` در Route Handler. چون `generateStaticParams` و صفحه‌ی اصلی از DB می‌خوانند، build به دیتابیس نیاز دارد (در CI: migrate+seed قبل از build). موجودی: `ProductDetail.stock` منبع حقیقت است و `inStock` از آن مشتق می‌شود.

**احراز هویت (فاز ۳):** `modules/auth/{constants,types,schemas,otp,password,redirect,actions,argon2-options}.ts`, `lib/{session,dal,rate-limit,request,phone,form}.ts`, `lib/sms/{types,console,kavenegar,index}.ts`, `modules/users/{constants,types,schemas,queries,actions}.ts`. مدل‌ها: User, OtpCode, Session, Address, RateLimit (migration جدید با نام `auth`). مشتری فقط با OTP؛ ادمین/استاف فقط با رمز Argon2id در `/admin/login` (OTP برای نقش غیر از CUSTOMER رد می‌شود). نشست: توکن تصادفی، فقط SHA-256 در DB، کوکی `__Host-ba_session` (prod). `SESSION_SECRET` الان **اجباری** است (کلید HMAC کد OTP). `SMS_PROVIDER=console` در production ممنوع است. صفحه‌های login/account داخل `(storefront)` هستند (هدر/فوتر مشترک)؛ پنل ادمین `app/admin/(panel)` با گیت `requireStaff` و `app/admin/login` بیرون گیت. هر چیزی که کوکی می‌خواند باید داخل `<Suspense>` باشد (هدر: `AccountLink`). `proxy.ts` عمداً ساخته نشد؛ گیت واقعی در DAL است. پاک‌سازی OTP/نشست/RateLimit منقضی → کرون فاز ۴.

**سبد/سفارش/انبار (فاز ۴):** `modules/cart/{constants,types,schemas,service,actions}.ts` (مهمان: کوکی `ba_cart`؛ لاگین: جدول CartItem؛ merge هنگام ورود در `verifyOtpAction`؛ قیمت/موجودی هرگز از کلاینت)، `modules/orders/{constants,schemas,types,service,queries,actions}.ts`. مدل‌ها: CartItem, Order, OrderItem, OrderStatusHistory, StockMovement (migration جدید `orders`). `placeOrder`: یک تراکنش با کسر اتمیک `updateMany where stock>=n and price=دیده‌شده`، قفل‌ها به ترتیب productId، ساخت سفارش PENDING_PAYMENT با `expiresAt` ۳۰ دقیقه، StockMovement نوع SALE، خالی‌کردن سبد. `cancelPendingOrder` idempotent است (شرط status در UPDATE) و موجودی را با ORDER_CANCEL برمی‌گرداند؛ کرون `POST /api/internal/cron` با `Authorization: Bearer $CRON_SECRET` سفارش‌های منقضی را لغو و OTP/نشست/RateLimit منقضی را پاک می‌کند (`CRON_SECRET` باید ست شود). صفحه‌ها: `/cart`, `/checkout`, `/account/orders`, `/account/orders/[id]`. هزینه ارسال (`SHIPPING` در `modules/orders/constants.ts`: ۸۰هزار تومان، رایگان بالای ۵ میلیون) **نمونه** است تا صاحب فروشگاه مشخص کند (فاز ۶ → Setting). دکمه‌ی پرداخت در صفحه‌ی سفارش غیرفعال است تا فاز ۵. `Order.paymentMethod`/`Payment` در فاز ۵ اضافه می‌شود. در فاز ۵ باید رقابت «پرداخت موفق بعد از انقضا/لغو» مدیریت شود.

**پرداخت (فاز ۵، زرین‌پال واقعی — بدون sandbox به درخواست کاربر):** `lib/payments/{types,zarinpal,index}.ts` (اینترفیس `PaymentGateway`؛ آداپتر API v4: `api.zarinpal.com/pg/v4/payment/{request,verify}.json`، StartPay در `www.zarinpal.com/pg/StartPay/{authority}`، مبلغ به **ریال** = تومان×۱۰؛ endpointها/کدهای ۱۰۰/۱۰۱ و پارامترهای Authority/Status از مستندات رسمی تأیید شدند)، `modules/payments/{constants,schemas,service,actions}.ts`، `app/api/payments/zarinpal/callback/route.ts`. مدل `Payment` (authority یکتا = idempotency؛ `needsRefund`) — migration جدید `payments`. جریان: دکمه‌ی «پرداخت آنلاین» در `/account/orders/[id]` → `startPayment` (مبلغ از DB، مهلت سفارش حداقل ۲۰ دقیقه تمدید، سقف ۵ تلاش/سفارش) → درگاه → callback → verify سمت سرور → `settlePaid` (شرط `status != PAID` در UPDATE) → سفارش PAID + history. اگر پرداخت بعد از لغو/انقضا برسد: اگر موجودی باشد سفارش بازگشایی می‌شود وگرنه `needsRefund` (ادمین باید دستی برگرداند؛ نمایش در داشبورد فاز ۶). کرون هر ۵ دقیقه `reconcilePendingPayments` (پرداخت‌های PENDING قدیمی‌تر از ۲۰ دقیقه را verify می‌کند: مرورگر بسته‌شده بعد از پرداخت) قبل از `expireStaleOrders` اجرا می‌شود. `ZARINPAL_MERCHANT_ID` باید ۳۶ کاراکتر باشد؛ بدون آن پرداخت پیام «درگاه راه‌اندازی نشده» می‌دهد. ⚠️ زرین‌پال واقعی روی `localhost` و دامنه‌ی ثبت‌نشده callback نمی‌پذیرد → تست پرداخت فقط روی دامنه‌ی واقعی (Vercel/سرور) با پرداخت واقعی کم‌مبلغ؛ تأییدنشده: رفتار دقیق پاسخ خطای request/verify (parse محافظه‌کارانه نوشته شده). `SMS_PROVIDER=console` در production هنگام ارسال خطا می‌دهد (نه هنگام build)؛ برای تست روی دامنه‌ی واقعی کاوه‌نگار لازم است.

**پنل ادمین (فاز ۶A):** مدل `AuditLog` (migration جدید `admin`). `lib/{audit,date,db-errors,query-params}.ts`، `modules/{catalog/admin,inventory,orders/admin,users/admin,dashboard,audit}`، `components/admin/*`، صفحات `/admin/{,products,categories,brands,inventory,orders,users,audit}`. دسترسی: STAFF = محصول/دسته/برند/انبار/سفارش؛ ADMIN = + کاربران و گزارش تغییرات (`requireAdmin`). محصول حذف نمی‌شود، فقط `ARCHIVED`. توضیح محصول فعلاً متن ساده است؛ مشخصات در textarea به‌صورت خطوط «عنوان: مقدار». تغییر قیمت/موجودی/وضعیت سفارش/کاربر در یک تراکنش با AuditLog ثبت می‌شود (رمز هرگز لاگ نمی‌شود). گذار وضعیت سفارش: `modules/orders/admin/transitions.ts`؛ پرداخت دستی/لغو/مرجوع دلیل اجباری دارد؛ لغو سفارش پرداخت‌شده موجودی را برمی‌گرداند ولی بازگشت وجه دستی از پنل زرین‌پال است. تأییدنشده: هیچ‌کدام از فایل‌های فاز ۳–۶ هنوز lint/typecheck/build نشده‌اند؛ `@node-rs/argon2` شاید نیاز به `serverExternalPackages` داشته باشد. مانده در ۶B: ثبت سفارش دستی، رسانه/تصاویر محصول، تنظیمات (انتقال `SHIPPING` به Setting).

**قانون cacheComponents:** `searchParams` فقط داخل `<Suspense>` خوانده شود (`ProductListing`). `params` صفحه‌ی محصول/دسته بیرون Suspense و همراه `generateStaticParams` خوانده می‌شود تا slug ناموجود ۴۰۴ واقعی بدهد؛ سازگاری این الگو با Next 16.4 هنوز تأیید نشده و اگر build خطای blocking-route داد باید اصلاح شود.

**نکته‌های باز:** `app/not-found.tsx` بدون هدر/فوتر است (۴۰۴ داخل storefront هم از همین می‌آید)؛ تصاویر محصول/هیرو placeholder هستند؛ دکمه‌های سبد و علاقه‌مندی فقط ظاهری‌اند تا فاز ۴؛ `Product` JSON-LD هنوز `image` ندارد. لینک «علاقه‌مندی» (`/account/wishlist`) هنوز صفحه ندارد. تأییدنشده‌ها در فاز ۳: آداپتر کاوه‌نگار با پنل واقعی؛ اینکه `@node-rs/argon2` خودکار external می‌شود (اگر build شکایت کرد `serverExternalPackages: ["@node-rs/argon2"]` را به `next.config.ts` اضافه کن)؛ رفتار `redirect()` داخل Suspense در لی‌اوت‌های account/admin. فقط توابع خالص (`phone.ts`, `redirect.ts`) واقعاً اجرا و تست شده‌اند.

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
- [x] اینترفیس SMS + provider کنسول (dev) + کاوه‌نگار (تست‌نشده با پنل واقعی؛ از روی حافظه نوشته شده)
- [x] OTP (HMAC، انقضا ۲ دقیقه، ۵ تلاش اتمیک، یک‌بارمصرف، rate-limit شماره/IP + cooldown)
- [x] سشن DB-backed + کوکی امن + logout
- [x] نقش‌ها و `requireUser/requireStaff/requireAdmin` (`lib/dal.ts`)
- [x] صفحه ورود/ثبت‌نام با شماره موبایل (`/login`)
- [x] پروفایل + مدیریت آدرس‌ها (`/account`, `/account/addresses`)
- [x] ورود ادمین (رمز Argon2id، `/admin/login`، اسکریپت `admin:create`)

## فاز ۴ — سبد، سفارش، انبار
- [x] سبد (مهمان کوکی + لاگین DB + merge، شمارنده‌ی هدر، دکمه‌ی افزودن روی کارت/صفحه‌ی محصول)
- [x] چک‌اوت: انتخاب/ثبت آدرس اجباری، هزینه ارسال (نمونه)
- [x] ساخت سفارش در تراکنش + کسر اتمیک موجودی + `StockMovement`
- [x] انقضای سفارش پرداخت‌نشده + کرون + برگشت موجودی (کرون روی سرور در فاز ۹ ست می‌شود)
- [x] صفحه سفارش‌های من + timeline وضعیت + لغو سفارش در انتظار پرداخت
- [x] اسکریپت تست همزمانی انبار روی DB واقعی (`npm run check:concurrency`) — اجرا و تأیید نشده؛ تست Vitest در فاز ۸

## فاز ۵ — پرداخت
- [x] interface `PaymentGateway` + adapter زرین‌پال (production، بدون sandbox)
- [x] request/callback/verify + idempotency + بازبینی کرون + بازگشایی/علامت‌گذاری بازگشت وجه
- [x] نتیجه‌ی پرداخت (بنر موفق/ناموفق/در انتظار + کد پیگیری در صفحه‌ی سفارش)
- [ ] (بعد) کارت‌به‌کارت با تأیید ادمین

## فاز ۶ — پنل ادمین
- [x] لی‌اوت ادمین + داشبورد (فروش، کمبود موجودی، سفارش‌های جدید، نیازمند بازگشت وجه)
- [x] CRUD محصول (مشخصات، SEO، وضعیت) — مانده: تصاویر (فاز ۶B)
- [x] CRUD دسته‌بندی (درختی) و برند
- [x] انبار: لیست موجودی، افزایش/کاهش دستی با دلیل، تاریخچه
- [x] سفارش‌ها: لیست/فیلتر/جزئیات/تغییر وضعیت + History
- [ ] ثبت سفارش دستی برای مشتری تلفنی
- [x] کاربران: لیست، ساخت کاربر تلفنی/کارمند، ویرایش، غیرفعال‌سازی، تغییر رمز
- [ ] مدیریت رسانه (آپلود، alt، sharp→WebP)
- [x] AuditLog + صفحه نمایش (فقط ادمین)
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
- [ ] rate-limit روی OTP ✓ / لاگین ادمین ✓ — مانده: آپلود/جستجو
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
