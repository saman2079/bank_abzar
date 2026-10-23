# بانک ابزار (Bank Abzar) — کانتکست پروژه

> این فایل در ریشه ریپو (`saman2079/bank_abzar`) و در Project «Bank_abzar» نگه داشته می‌شود. هر چت/سشن جدید اول این فایل + `docs/CHECKLIST.md` (بخش «وضعیت در لحظه») + `docs/STRUCTURE.md` + `docs/ARCHITECTURE.md` را بخواند.

## ۰. قوانین کار با صاحب پروژه (اجباری)
- کاربر فرانت‌کار است؛ تصمیم‌های بک‌اند/دیتابیس با Claude است.
- **بدون اجازه‌ی صریح کامیت/پوش نکن.** کد را کامل و آماده‌ی کپی‌پیست در چت بفرست (فایل‌ها با SendUserFile)؛ بعد کاربر می‌گوید روی `master` پوش شود یا نه.
- برای هر فایل بگو متعلق به کدام بخش/فاز است و کجا باید قرار بگیرد.
- کوتاه و بدون شرّ‌وور؛ فایل کامل، نه تکه‌کد.
- فاز به فاز، «دونه دونه» جلو برو. بعد از هر تحویل `docs/CHECKLIST.md` و `docs/STRUCTURE.md` را آپدیت کن (و نسخه‌ی Project را هم).
- زرین‌پال واقعی (بدون sandbox). Vercel فعلاً لازم نیست.
- همیشه صادق بگو چه چیزی اجرا/تأیید نشده؛ sandbox Claude به npm دسترسی ندارد، پس lint/typecheck/build را کاربر اجرا می‌کند و خطا را می‌فرستد.
- شاخه‌ی اصلی `master` است. قبل از هر کدی `master` را clone کن و با آن تطبیق بده (کاربر کد را فرمت/اصلاح کرده).

## ۱. پروژه چیست
فروشگاه اینترنتی ابزارآلات دستی/برقی برای بازار ایران (فارسی، RTL). مشتری با موبایل+OTP ثبت‌نام می‌کند، سفارش می‌دهد، پرداخت می‌کند و وضعیت سفارش را می‌بیند. ادمین محصول/دسته‌بندی/برند/مقاله/موجودی/سفارش/کاربر را مدیریت می‌کند. سئو اولویت بالا دارد. صاحب‌کسب‌وکار دوست توسعه‌دهنده است؛ هزینه سرور کمتر از ۴–۵ میلیون تومان در ماه.

## ۲. وضعیت فعلی
- Next.js **16.4.1**, React **19.3.0**, TypeScript 5, Tailwind 4 (`@tailwindcss/turbopack`), ESLint 9, Prisma 7 + PostgreSQL، پوشه `app/` در ریشه (بدون `src/`).
- فاز ۰–۶B روی `master` است (کاتالوگ، OTP، سبد/سفارش/انبار، زرین‌پال، پنل ادمین، تصاویر، سفارش دستی، تنظیمات ارسال). **فاکتور (۶C)، مقاله (۷A) و وبلاگ/سئو (۷B) روی master هستند (تأییدنشده)؛ گام بعدی: تأیید و رفع خطاها، فاز ۸ (امنیت و کیفیت: CSP، تست‌ها، CI) هم روی master است (اجرا نشده)؛ سپس فاز ۹.**
- جزئیات لحظه‌ای و کارهای باز: `docs/CHECKLIST.md`؛ نقشه‌ی فایل‌ها: `docs/STRUCTURE.md`.
- `next.config.ts`: `cacheComponents: true`, `partialPrefetching: true`.
- `AGENTS.md` می‌گوید: قبل از کد، داک‌های همراه نسخه را از `node_modules/next/dist/docs/` بخوان.

## ۳. قوانین سخت (قبل از کدزدن)
1. اول `npm install`، بعد داک‌های `node_modules/next/dist/docs/` (cache components، `use cache`، `proxy.ts`، metadata، sitemap، server actions، caching/revalidation). به حافظه قدیمی اعتماد نکن.
2. با `cacheComponents: true` هر دسترسی به داده runtime (`cookies()`, `headers()`, `searchParams`, کوئری DB بدون کش) باید داخل `<Suspense>` یا زیر `'use cache'` باشد. صفحات عمومی (محصول، دسته، مقاله) با `'use cache'` + `cacheLife` + `cacheTag`؛ بی‌اعتبارسازی: `updateTag(tag)` فقط در Server Action، `revalidateTag(tag,'max')` در Route Handler.
3. `middleware.ts` منسوخ است → `proxy.ts`؛ فقط کارهای سبک. احراز هویت/مجوز در هر action/route/صفحه با DAL: `requireUser()`, `requireStaff()`, `requireAdmin()`.
4. منطق کسب‌وکار در UI نباشد؛ UI → action/query → service → Prisma.
5. قیمت، تخفیف، موجودی و مبلغ پرداخت فقط سمت سرور.
6. هر ورودی کاربر → Zod. هر HTML ادمین (مقاله) → sanitize قبل از ذخیره/رندر.
7. قبل از گزارش «تمام شد»: `npm run lint`, `npm run typecheck`, `npm run build` واقعاً اجرا شوند؛ اگر نشد صریح بگو.
8. TypeScript strict، بدون `any`، بدون `@ts-ignore` مگر با کامنت دلیل.

## ۴. استک (تصمیم‌شده)
| لایه | انتخاب |
|---|---|
| فریم‌ورک | Next.js 16 (App Router) — مونولیت ماژولار |
| زبان | TypeScript strict |
| استایل | Tailwind 4 + توکن‌ها در `@theme` |
| دیتابیس | PostgreSQL + Prisma 7 (adapter-pg، migrations) |
| اعتبارسنجی | Zod 4 |
| احراز هویت | OTP پیامکی برای مشتری؛ سشن DB-backed، کوکی httpOnly؛ ادمین/استاف با رمز Argon2id در `/admin/login` |
| ادیتور مقاله | Tiptap (RTL، تصویر، جدول، لینک، heading) → HTML sanitize‌شده + JSON |
| تصویر | `sharp` → WebP؛ درایور `STORAGE_DRIVER=local\|blob` |
| پرداخت | زرین‌پال واقعی (verify سمت سرور) |
| پیامک | interface + کاوه‌نگار (تأییدنشده با پنل واقعی) + console برای dev |
| تست | Vitest + Playwright (فاز ۸) |
| دیپلوی | Docker multi-stage (`output: 'standalone'`) + Compose (app, postgres, caddy) روی VPS ایران؛ CI/CD با GitHub Actions |

## ۵. ساختار پوشه‌ها (خلاصه؛ کامل در `docs/STRUCTURE.md` و `docs/ARCHITECTURE.md`)
```
app/        routing/صفحات (نازک): (storefront)/ admin/ api/ uploads/
modules/    catalog, cart, orders, inventory, users, auth, payments, media, settings, dashboard, audit (+ articles در فاز ۷)
components/ ui/, shared/, layout/, admin/, cart/
lib/        db, env, session, dal, cache, seo, sms, payments, storage, rate-limit, ...
prisma/     schema.prisma, migrations, seed.ts
docs/       ARCHITECTURE.md, CHECKLIST.md, STRUCTURE.md, design/
```

## ۶. قراردادهای کدنویسی
- نام فایل kebab-case، کامپوننت PascalCase؛ هر ماژول: `queries.ts`، `actions.ts` (`'use server'`)، `schemas.ts`، `service.ts`.
- Server Component پیش‌فرض؛ `'use client'` فقط برای تعامل.
- پول: Int به **تومان**؛ برای درگاه ×۱۰ (ریال).
- ارقام فارسی در نمایش (`Intl.NumberFormat('fa-IR')`)، در DB/URL لاتین.
- slug یکتا؛ تغییر slug → ریدایرکت ۳۰۱.
- کامیت: Conventional Commits. شاخه‌ی اصلی `master`.
- env فقط از `lib/env.ts` (Zod).

## ۷. دیزاین
دارک‌مود پریمیوم، تأکید زرد، کارت‌های گرد، RTL، Vazirmatn. رفرنس: `docs/design/home.png`. توکن‌ها: `--color-bg`, `--color-surface`, `--color-border`, `--color-primary` (زرد), `--color-danger`.

## ۸. MVP در برابر بعدی
MVP: کاتالوگ + جستجو + سبد + OTP + چک‌اوت + زرین‌پال + انبار + پنل ادمین + مقاله + سئو + دیپلوی.
بعد از MVP: کد تخفیف، نظرات/امتیاز، علاقه‌مندی، کارت‌به‌کارت، فاکتور PDF، پیامک وضعیت، گزارش فروش، مقایسه محصول.

## ۹. ورودی‌های لازم از صاحب فروشگاه
نام/لوگوی نهایی، اطلاعات تماس، دامنه، مرچنت‌کد زرین‌پال، پنل پیامک، روش‌ها و هزینه ارسال، لیست اولیه محصولات/دسته‌ها/تصاویر.
