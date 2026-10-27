# چک‌لیست پروژه بانک ابزار
> هر کار تمام شد `[ ]` را به `[x]` تغییر بده (و در چت بگو تا آپدیت کنیم). فقط ردیف‌های باز را در چت جدید ادامه بده.

## وضعیت فعلی (برای چت جدید — اول این بخش را بخوان)

**وضعیت در لحظه (به‌روز: ۲۰۲۶-۱۰-۲۱) — اول این را بخوان:**
- `master` (کامیت `cae5b91`) منبع حقیقت است؛ همه‌ی فاز ۰–۶B روی آن است (تصاویر، سفارش دستی، تنظیمات ارسال، کرون با GET/POST). شاخه‌ی `main` در ریموت قدیمی/اضافه است و باید توسط کاربر پاک شود (`git push origin --delete main`)؛ اجازه‌ی حذف از سمت Claude نیست.
- **کارهای فوری باز روی master:** (۱) `zod` و `sharp` در کد import شده‌اند ولی در `package.json` نیستند → `npm i zod sharp` و `npm i -D prettier`؛ (۲) مایگریشن `settings` ساخته نشده (فقط `init` هست) → `npm run db:migrate -- --name settings` و کامیت پوشه‌ی migrations؛ (۳) پوشه‌ی `generated/` در گیت است → `git rm -r --cached generated` و `/generated` در `.gitignore`؛ (۴) `ci.yml` فقط روی push به `main` اجرا می‌شود → به `master` تغییر بده؛ (۵) `CLAUDE.md` (ریشه) و `docs/ARCHITECTURE.md` در ریپو نیستند.
- **Vercel:** فعلاً تصمیم: دمو نمی‌خواهیم؛ `vercel.json` ساخته نمی‌شود (در صورت نیاز: `{"buildCommand":"prisma migrate deploy && next build","crons":[{"path":"/api/internal/cron","schedule":"0 3 * * *"}]}`).
- **به‌روز (۲۰۲۶-۱۰-۲۲):** روی `master` علاوه بر ۶B: فاز ۶C (فاکتور/پیش‌فاکتور + چاپ A4)، پنل ادمین ریسپانسیو با منوی کشویی موبایل، فاز ۷A (مدیریت مقاله + Tiptap + sanitize؛ migration `articles` دست‌نویس). **۷B (وبلاگ عمومی، sitemap/robots، JSON-LD، ریدایرکت نامک مقاله) هم روی master است.** هیچ‌کدام از ۶C/۷A/۷B هنوز lint/typecheck/build نشده‌اند؛ نیاز به `npm i` پکیج‌های tiptap و `sanitize-html` و `db:migrate`.
- **به‌روز (۲۰۲۶-۱۰-۲۳):** فاز ۸ (هدر/CSP، rate-limit جستجو و سبد، Vitest، Playwright، CI/security/Dependabot، `docs/SECURITY.md`) روی master است و اجرا نشده.
- **به‌روز (۲۰۲۶-۱۰-۲۳):** صفحه‌ی علاقه‌مندی‌ها (`/account/wishlist`، مدل `WishlistItem`، قلب فعال روی کارت، `/api/wishlist`) روی master است؛ اجرا نشده؛ نیاز به `prisma generate` و `db:migrate` (مایگریشن دست‌نویس).
- - **به‌روز (۲۰۲۶-۱۰-۲۷):** ورود/ثبت‌نام مشتری با **شماره + رمز عبور** (حداقل ۸ کاراکتر، رمز رایج رد می‌شود) جایگزین OTP پیامکی شد؛ `lib/sms/`، `modules/auth/otp.ts` و متغیرهای SMS حذف شدند. شماره تأیید نمی‌شود؛ حساب قدیمیِ بدون رمز و بدون سفارش/آدرس با ثبت‌نام قابل تصاحب است، حساب دارای سفارش باید از پشتیبانی رمز بگیرد. مدل `OtpCode` فعلاً در schema مانده (کرون پاکسازی‌اش می‌کند)؛ حذفش نیاز به migration دارد. ⚠️ `SESSION_SECRET` واقعی یک‌بار داخل `.env.example` کامیت شده بود → باید عوض شود.
- **به‌روز (۲۰۲۶-۱۰-۲۷، ب):** صفحه‌ی حساب ریسپانسیو و بازطراحی شد (`components/account/account-nav.tsx`: شبکه‌ی ۲×۲ روی موبایل/منوی عمودی دسکتاپ؛ ستون grid با `minmax(0,1fr)` تا صفحه عریض نشود، هدر کاربر با آواتار و خروج)؛ دکمه‌ی چشم برای رمز (`components/ui/password-input.tsx`) در ورود/ثبت‌نام/ورود ادمین؛ باگ خالی‌شدن شماره بعد از خطای فرم رفع شد (`FormState.phone` + `defaultValue`). تأییدنشده؛ lint/typecheck/build و e2e اجرا نشده.
- **به‌روز (۲۰۲۶-۱۰-۲۷، پ):** «پرداخت در محل (فقط شهر تهران)»: گزینه در `/checkout` (فقط وقتی آدرس انتخابی استان+شهر تهران باشد؛ قانون سمت سرور در `modules/orders/cod.ts`)، وضعیت جدید `PENDING_CONFIRMATION` («در انتظار تأیید تلفنی») و فیلد `Order.paymentMethod` (migration دست‌نویس `20261027120000_cod`). موجودی هنگام ثبت رزرو می‌شود؛ ادمین زنگ می‌زند و «در حال آماده‌سازی» (تأیید) یا «لغو» می‌کند؛ تأییدنشده بعد از ۴۸ ساعت توسط کرون لغو می‌شود؛ هر مشتری حداکثر ۲ سفارش تأییدنشده دارد. داشبورد کارت «پرداخت در محل، منتظر تماس» دارد. مشتری وضعیت را در `/account/orders/[id]` می‌بیند. اجرا/تأیید نشده؛ نیاز به `db:migrate`.
- **گام بعدی:** تأیید/رفع خطای ۷A/۷B/۸ (نصب vitest و playwright)؛ بعد فاز ۹ (Docker، CI/CD، سرور). کار باز مرتبط با سئو: ریدایرکت نامک محصول/دسته، تصویر پیش‌فرض OG، لوگو در Organization، بخش «مقالات تازه» در صفحه‌ی اصلی.
- لینت/typecheck/build هیچ‌وقت توسط Claude اجرا نشده (sandbox بدون npm)؛ کاربر اجرا می‌کند و خطاها را می‌فرستد.

**شیوه کار:** پیش‌فرض: روی ریپوی کاربر کامیت/پوش نکن، مگر کاربر صریحاً بخواهد (تصاویر فقط یک‌بار به درخواست او پوش شد و بعد روی `master` رفت). هر کد را با مسیر و «برای کدام بخش» توضیح بده. فایل‌های کامل و آماده‌ی کپی‌پیست بده (کوتاه، بدون توضیح اضافه)، و بعد از هر تحویل کد همین چک‌لیست را آپدیت کن.

**تحویل‌شده ولی هنوز تأیید نشده:** کد فاز ۰ تا ۶B تحویل شده، اما `lint`/`typecheck`/`build` هیچ‌وقت اجرا نشده (محیط Claude به npm دسترسی ندارد). اولین کار: خروجی `npm run lint && npm run typecheck && npm run build` را از کاربر بگیر، خطاها را رفع کن، سپس موارد تأییدشده را تیک بزن.

**وابستگی‌های لازم** (کاربر باید نصب کرده باشد): `zod`, `lucide-react`, `@fontsource-variable/vazirmatn`, `server-only`, `@prisma/client@7`, `@prisma/adapter-pg`, `pg`, `dotenv`, `@node-rs/argon2`؛ و dev: `prettier`, `prisma@7`, `tsx`, `@types/pg`. اسکریپت‌های `postinstall` (`prisma generate`)، `db:up`, `db:migrate`, `db:deploy`, `db:seed`, `db:studio`, `admin:create` (`tsx prisma/create-admin.ts`), `check:concurrency` (`tsx --conditions=react-server --env-file=.env.local prisma/check-concurrency.ts`) و بلوک `"prisma"`/seed در package.json لازم است. `/generated` را به `.gitignore` اضافه کن. بعد از `db:migrate` پوشه‌ی `prisma/migrations` را کامیت کن. اسکریپت‌های `typecheck` (`tsc --noEmit`)، `format`، `format:check` باید در `package.json` باشند. فایل قدیمی `app/page.tsx` باید حذف شده باشد (صفحه اصلی در `app/(storefront)/page.tsx` است).

**قرارداد کاتالوگ (از فاز ۲ با Prisma + `'use cache'`):** `modules/catalog/{constants,types,schemas,queries}.ts`؛ `mock-data.ts` فقط منبع seed است. توابع `queries.ts`: `listProducts` (جستجوی `q` کش نمی‌شود), `listFeaturedProducts`, `listBrands`, `listCategories`, `getProductBySlug`, `getRelatedProducts(slug)`, `getCategoryBySlug`, `listProductSlugs`. تگ‌ها در `lib/cache.ts`؛ بی‌اعتبارسازی: `updateTag(tag)` فقط در Server Action، `revalidateTag(tag,'max')` در Route Handler. چون `generateStaticParams` و صفحه‌ی اصلی از DB می‌خوانند، build به دیتابیس نیاز دارد (در CI: migrate+seed قبل از build). موجودی: `ProductDetail.stock` منبع حقیقت است و `inStock` از آن مشتق می‌شود.

**احراز هویت (فاز ۳):** `modules/auth/{constants,types,schemas,otp,password,redirect,actions,argon2-options}.ts`, `lib/{session,dal,rate-limit,request,phone,form}.ts`, `lib/sms/{types,console,kavenegar,index}.ts`, `modules/users/{constants,types,schemas,queries,actions}.ts`. مدل‌ها: User, OtpCode, Session, Address, RateLimit (migration جدید با نام `auth`). مشتری فقط با OTP؛ ادمین/استاف فقط با رمز Argon2id در `/admin/login` (OTP برای نقش غیر از CUSTOMER رد می‌شود). نشست: توکن تصادفی، فقط SHA-256 در DB، کوکی `__Host-ba_session` (prod). `SESSION_SECRET` الان **اجباری** است (کلید HMAC کد OTP). `SMS_PROVIDER=console` در production ممنوع است. صفحه‌های login/account داخل `(storefront)` هستند (هدر/فوتر مشترک)؛ پنل ادمین `app/admin/(panel)` با گیت `requireStaff` و `app/admin/login` بیرون گیت. هر چیزی که کوکی می‌خواند باید داخل `<Suspense>` باشد (هدر: `AccountLink`). `proxy.ts` عمداً ساخته نشد؛ گیت واقعی در DAL است. پاک‌سازی OTP/نشست/RateLimit منقضی → کرون فاز ۴.

**سبد/سفارش/انبار (فاز ۴):** `modules/cart/{constants,types,schemas,service,actions}.ts` (مهمان: کوکی `ba_cart`؛ لاگین: جدول CartItem؛ merge هنگام ورود در `verifyOtpAction`؛ قیمت/موجودی هرگز از کلاینت)، `modules/orders/{constants,schemas,types,service,queries,actions}.ts`. مدل‌ها: CartItem, Order, OrderItem, OrderStatusHistory, StockMovement (migration جدید `orders`). `placeOrder`: یک تراکنش با کسر اتمیک `updateMany where stock>=n and price=دیده‌شده`، قفل‌ها به ترتیب productId، ساخت سفارش PENDING_PAYMENT با `expiresAt` ۳۰ دقیقه، StockMovement نوع SALE، خالی‌کردن سبد. `cancelPendingOrder` idempotent است (شرط status در UPDATE) و موجودی را با ORDER_CANCEL برمی‌گرداند؛ کرون `POST /api/internal/cron` با `Authorization: Bearer $CRON_SECRET` سفارش‌های منقضی را لغو و OTP/نشست/RateLimit منقضی را پاک می‌کند (`CRON_SECRET` باید ست شود). صفحه‌ها: `/cart`, `/checkout`, `/account/orders`, `/account/orders/[id]`. هزینه ارسال (`SHIPPING` در `modules/orders/constants.ts`: ۸۰هزار تومان، رایگان بالای ۵ میلیون) **نمونه** است تا صاحب فروشگاه مشخص کند (فاز ۶ → Setting). دکمه‌ی پرداخت در صفحه‌ی سفارش غیرفعال است تا فاز ۵. `Order.paymentMethod`/`Payment` در فاز ۵ اضافه می‌شود. در فاز ۵ باید رقابت «پرداخت موفق بعد از انقضا/لغو» مدیریت شود.

**پرداخت (فاز ۵، زرین‌پال واقعی — بدون sandbox به درخواست کاربر):** `lib/payments/{types,zarinpal,index}.ts` (اینترفیس `PaymentGateway`؛ آداپتر API v4: `api.zarinpal.com/pg/v4/payment/{request,verify}.json`، StartPay در `www.zarinpal.com/pg/StartPay/{authority}`، مبلغ به **ریال** = تومان×۱۰؛ endpointها/کدهای ۱۰۰/۱۰۱ و پارامترهای Authority/Status از مستندات رسمی تأیید شدند)، `modules/payments/{constants,schemas,service,actions}.ts`، `app/api/payments/zarinpal/callback/route.ts`. مدل `Payment` (authority یکتا = idempotency؛ `needsRefund`) — migration جدید `payments`. جریان: دکمه‌ی «پرداخت آنلاین» در `/account/orders/[id]` → `startPayment` (مبلغ از DB، مهلت سفارش حداقل ۲۰ دقیقه تمدید، سقف ۵ تلاش/سفارش) → درگاه → callback → verify سمت سرور → `settlePaid` (شرط `status != PAID` در UPDATE) → سفارش PAID + history. اگر پرداخت بعد از لغو/انقضا برسد: اگر موجودی باشد سفارش بازگشایی می‌شود وگرنه `needsRefund` (ادمین باید دستی برگرداند؛ نمایش در داشبورد فاز ۶). کرون هر ۵ دقیقه `reconcilePendingPayments` (پرداخت‌های PENDING قدیمی‌تر از ۲۰ دقیقه را verify می‌کند: مرورگر بسته‌شده بعد از پرداخت) قبل از `expireStaleOrders` اجرا می‌شود. `ZARINPAL_MERCHANT_ID` باید ۳۶ کاراکتر باشد؛ بدون آن پرداخت پیام «درگاه راه‌اندازی نشده» می‌دهد. ⚠️ زرین‌پال واقعی روی `localhost` و دامنه‌ی ثبت‌نشده callback نمی‌پذیرد → تست پرداخت فقط روی دامنه‌ی واقعی (Vercel/سرور) با پرداخت واقعی کم‌مبلغ؛ تأییدنشده: رفتار دقیق پاسخ خطای request/verify (parse محافظه‌کارانه نوشته شده). `SMS_PROVIDER=console` در production هنگام ارسال خطا می‌دهد (نه هنگام build)؛ برای تست روی دامنه‌ی واقعی کاوه‌نگار لازم است.

**پنل ادمین (فاز ۶A):** مدل `AuditLog` (migration جدید `admin`). `lib/{audit,date,db-errors,query-params}.ts`، `modules/{catalog/admin,inventory,orders/admin,users/admin,dashboard,audit}`، `components/admin/*`، صفحات `/admin/{,products,categories,brands,inventory,orders,users,audit}`. دسترسی: STAFF = محصول/دسته/برند/انبار/سفارش؛ ADMIN = + کاربران و گزارش تغییرات (`requireAdmin`). محصول حذف نمی‌شود، فقط `ARCHIVED`. توضیح محصول فعلاً متن ساده است؛ مشخصات در textarea به‌صورت خطوط «عنوان: مقدار». تغییر قیمت/موجودی/وضعیت سفارش/کاربر در یک تراکنش با AuditLog ثبت می‌شود (رمز هرگز لاگ نمی‌شود). گذار وضعیت سفارش: `modules/orders/admin/transitions.ts`؛ پرداخت دستی/لغو/مرجوع دلیل اجباری دارد؛ لغو سفارش پرداخت‌شده موجودی را برمی‌گرداند ولی بازگشت وجه دستی از پنل زرین‌پال است. تأییدنشده: هیچ‌کدام از فایل‌های فاز ۳–۶ هنوز lint/typecheck/build نشده‌اند؛ `@node-rs/argon2` شاید نیاز به `serverExternalPackages` داشته باشد.

**فاز ۶B (تصاویر، سفارش دستی، تنظیمات):** ⚠️ ریپوی `master` منبع حقیقت است (کاربر typecheck را اجرا و خطاها را آنجا رفع کرده)؛ اول `master` را clone و با کار خودت تطبیق بده، نه با نسخه‌ی قدیمی. کل فاز ۶B اکنون روی `master` است. نقشه‌ی دقیق فایل‌ها: `docs/STRUCTURE.md`.
- **تصاویر:** `lib/storage/{types,local,blob,index}.ts` (درایور `STORAGE_DRIVER=local|blob`؛ local = دیسک `UPLOAD_DIR`، blob = Vercel Blob برای Vercel چون دیسکش فقط‌خواندنی است)، `modules/media/{constants,process,service,actions}.ts` (sharp: نوع از محتوا، حداکثر ۴۰ مگاپیکسل، ۸MB، ۱۰ تصویر/محصول، خروجی WebP حداکثر ۱۶۰۰px بدون EXIF)، `app/api/admin/products/[id]/images/route.ts` (POST multipart؛ staff، Origin، rate-limit ۳۰/دقیقه)، `app/uploads/[...path]/route.ts`، `components/admin/product-images.tsx`، `components/shared/product-image.tsx`. در «محصول جدید» تصاویر انتخاب می‌شوند و بعد از ساخت محصول آپلود می‌شوند؛ در «ویرایش» مدیریت کامل. فروشگاه: کارت و گالری محصول (اسکرول-اسنپ) + `image` در JSON-LD. تغییر schema ندارد. **لازم:** `npm i sharp @vercel/blob`، خط `/uploads` در `.gitignore`، و در `next.config.ts`: `images: { remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }] }` (فقط برای blob). روی Vercel: `STORAGE_DRIVER=blob` + `BLOB_READ_WRITE_TOKEN` (Vercel محدودیت بدنه‌ی ۴.۵MB دارد → هر بار آپلود کم‌حجم).
- **تنظیمات:** مدل `Setting` (migration جدید `settings`)، `modules/settings/*`، `/admin/settings` (فقط ADMIN)، `calcShipping(subtotal, settings)`؛ `SHIPPING` ثابت حذف شد و `CartSummary` اکنون async است. مقدار پیش‌فرض ۸۰ هزار / رایگان بالای ۵ میلیون تا صاحب فروشگاه تعیین کند.
- **سفارش دستی:** `modules/orders/admin/manual-service.ts` (همان کسر اتمیک `placeOrder`؛ مشتری با موبایل پیدا/ساخته می‌شود `createdByAdmin`؛ پرداخت‌شده → PAID با توضیح اجباری، یا PENDING با مهلت ۳۰ دقیقه)، `/admin/orders/new`. تأییدنشده: هیچ‌کدام از کدهای ۶B اجرا/typecheck نشده‌اند.

**فاز ۶C (فاکتور / پیش‌فاکتور برای فروش خارج از سایت):** مدل‌های `Invoice`/`InvoiceItem` + enum `InvoiceStatus` (PROFORMA → FINAL | CANCELED) و ستون `StockMovement.invoiceId` (migration جدید `invoices`: بعد از pull `npm run db:deploy` یا `db:migrate`). مستقل از `Order` فروشگاه آنلاین؛ مشتری لزوماً کاربر سایت نیست (snapshot نام/موبایل/نشانی). `modules/invoices/{constants,schemas,queries,service,actions}.ts`: `calcInvoiceTotals` تنها منبع محاسبه (جمع ردیف‌ها − تخفیف کل + مالیات٪ روی مبلغ بعد از تخفیف + ارسال)، قیمت واحد هر ردیف توافقی است (پیش‌فرض قیمت فعلی). جریان: «پیش‌فاکتور» بدون اثر روی انبار → «قطعی‌کردن» (`finalizeInvoice`: `UPDATE ... WHERE status='PROFORMA'` + کسر اتمیک `stock >= n` با قفل به ترتیب productId + `StockMovement` نوع SALE با `invoiceId`) یا «صدور مستقیم فاکتور قطعی» (همان کسر در همان تراکنش). پیش‌فاکتور قابل ویرایش است؛ فاکتور قطعی فقط ابطال می‌شود (دلیل اجباری، موجودی با نوع RETURN برمی‌گردد). شماره‌ی پیش‌فاکتور و فاکتور یکی است (`formatInvoiceNumber`، از ۱۰۰۱). صفحات: `/admin/invoices` (لیست/جستجو/فیلتر)، `/new`، `/[id]` (سند + چاپ + قطعی/ابطال)، `/[id]/edit`. چاپ: دکمه‌ی «چاپ فاکتور» → پنجره‌ی چاپ مرورگر (پرینتر متصل یا ذخیره PDF)؛ سند A4 سفید با `print:hidden` روی منو/نوار ابزار (`components/invoices/invoice-document.tsx` + بلوک `@media print` در `globals.css`). تاریخچه‌ی انبار لینک فاکتور دارد. **باز:** مشخصات فروشنده (تلفن/نشانی/شناسه‌ی اقتصادی) در `INVOICE_SELLER` (`modules/invoices/constants.ts`) باید پر شود؛ تأییدنشده: هیچ‌کدام از کدهای ۶C اجرا/lint/typecheck/build نشده‌اند (فقط `calcInvoiceTotals` با node تست شد)؛ بعد از `npm install` کلاینت Prisma باید دوباره generate شود (postinstall).

**قانون cacheComponents:** `searchParams` فقط داخل `<Suspense>` خوانده شود (`ProductListing`). `params` صفحه‌ی محصول/دسته بیرون Suspense و همراه `generateStaticParams` خوانده می‌شود تا slug ناموجود ۴۰۴ واقعی بدهد؛ سازگاری این الگو با Next 16.4 هنوز تأیید نشده و اگر build خطای blocking-route داد باید اصلاح شود.

**نکته‌های باز:** `app/not-found.tsx` بدون هدر/فوتر است (۴۰۴ داخل storefront هم از همین می‌آید)؛ تصاویر هیرو/بنرها هنوز placeholder هستند (تصاویر محصول واقعی شد)؛ دکمه‌های سبد و علاقه‌مندی فقط ظاهری‌اند تا فاز ۴؛  تأییدنشده‌ها در فاز ۳: آداپتر کاوه‌نگار با پنل واقعی؛ اینکه `@node-rs/argon2` خودکار external می‌شود (اگر build شکایت کرد `serverExternalPackages: ["@node-rs/argon2"]` را به `next.config.ts` اضافه کن)؛ رفتار `redirect()` داخل Suspense در لی‌اوت‌های account/admin. فقط توابع خالص (`phone.ts`, `redirect.ts`) واقعاً اجرا و تست شده‌اند.

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
- [x] اینترفیس SMS + provider کنسول (dev) + کاوه‌نگار Verify Lookup با REST (POST، بدون پکیج npm؛ خطا با کد کاوه‌نگار `KavenegarError`؛ تست واحد با fetch ساختگی؛ ⚠️ با پنل/قالب واقعی هنوز تست نشده) — `.env.example` اضافه شد. حساب رایگان کاوه‌نگار برای Verify Lookup خطای ۴۲۶ (نیازمند «سرویس پیشرفته») می‌دهد؛ برای آن `SMS_KAVENEGAR_METHOD=send` (+ اختیاری `SMS_SENDER`) پیامک ساده می‌فرستد؛ با حساب پیشرفته به `lookup` برگردان
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
- [x] CRUD محصول (مشخصات، SEO، وضعیت، **تصاویر**: چندتایی، alt، ترتیب، حذف)
- [x] CRUD دسته‌بندی (درختی) و برند
- [x] انبار: لیست موجودی، افزایش/کاهش دستی با دلیل، تاریخچه
- [x] سفارش‌ها: لیست/فیلتر/جزئیات/تغییر وضعیت + History
- [x] ثبت سفارش دستی برای مشتری تلفنی (`/admin/orders/new`)
- [x] کاربران: لیست، ساخت کاربر تلفنی/کارمند، ویرایش، غیرفعال‌سازی، تغییر رمز
- [x] مدیریت رسانه‌ی محصول (آپلود، alt، sharp→WebP) — کتابخانه‌ی رسانه‌ی عمومی برای مقاله در فاز ۷
- [x] AuditLog + صفحه نمایش (فقط ادمین)
- [x] تنظیمات: هزینه ارسال (`/admin/settings`) — اطلاعات تماس بعداً
- [x] فاکتور/پیش‌فاکتور (فروش خارج از سایت): صدور، تبدیل به قطعی با کسر انبار، صدور مستقیم، ابطال با برگشت موجودی، چاپ A4 — تأیید با اجرای واقعی مانده
- [x] پنل ادمین ریسپانسیو: در موبایل منو داخل سایدبار کشویی (`components/admin/admin-mobile-nav.tsx`)، لینک فعال هایلایت می‌شود، لینک «فاکتورها» در منو — تأیید بصری/تست روی گوشی مانده
- [ ] مشخصات فروشنده روی فاکتور (`INVOICE_SELLER`) از صاحب فروشگاه

## فاز ۷ — مقاله و سئو
- [x] مدل و CRUD مقاله + پیش‌نویس/انتشار (۷A — تحویل‌شده، تأیید نشده؛ migration `articles` دست‌نویس است، با `db:migrate` بررسی شود)
- [x] ادیتور Tiptap (RTL، تصویر، جدول، لینک، heading) + sanitize (۷A؛ نیاز به `npm i` پکیج‌های tiptap و sanitize-html)
- [x] صفحات `/blog` و `/blog/[slug]` با JSON-LD Article (۷B — روی master، تأیید نشده)
- [x] `generateMetadata` همه صفحات + canonical + OG (صفحه‌های فروشگاه از قبل؛ مقاله با OG نوع article در ۷B)
- [x] JSON-LD: Product, Breadcrumb ✓؛ Organization, WebSite روی صفحه‌ی اصلی (۷B)
- [x] `sitemap.ts` و `robots.ts` (۷B؛ داده از `modules/seo/queries.ts`)
- [~] ریدایرکت دائمی برای تغییر slug: مقاله ✓ (۷B، `permanentRedirect` = ۳۰۸)؛ محصول/دسته هنوز نه
- [x] revalidation بعد از ویرایش ادمین (کاتالوگ + مقاله با `updateTag`)
- [ ] بررسی Lighthouse/CWV و Search Console

## فاز ۸ — امنیت و کیفیت (کد روی master؛ اجرا/تأیید نشده)
- [x] هدرهای امنیتی + CSP (`next.config.ts`) — بعد از build روی پرداخت زرین‌پال و ادیتور Tiptap تست شود
- [x] بررسی IDOR همه مسیرهای کاربر (نتیجه در `docs/SECURITY.md`)
- [x] rate-limit: OTP، لاگین ادمین، آپلود، جستجو (۴۰/دقیقه)، سبد (۱۲۰/دقیقه)
- [x] تست‌های Vitest (`tests/unit/`: phone، redirect، money/فاکتور، query-params، sanitize، storage-path) — مانده: تست انبار/سفارش روی DB واقعی
- [x] تست‌های Playwright (`e2e/`: smoke عمومی/سئو/هدرها/دسترسی ناشناس، ادمین + چرخه‌ی فاکتور) — مسیر خرید کامل مشتری (نیاز به OTP) ننوشته شد
- [x] `npm audit` + Dependabot + gitleaks + CodeQL (`.github/workflows/security.yml`, `dependabot.yml`)
- [x] مرور OWASP (`docs/SECURITY.md`)
- [ ] کاربر: `npm i -D vitest @playwright/test` (و کامیت `package-lock.json`؛ تا آن موقع `npm ci` در CI می‌شکند)، اجرای `npm test`، `npm run test:e2e`، lint/typecheck/build
- [ ] کاربر: secretهای GitHub برای e2e ادمین (`E2E_ADMIN_PASSWORD` در ci.yml) را بررسی کند

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
