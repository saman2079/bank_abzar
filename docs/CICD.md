# CI/CD بانک ابزار (Vercel، بدون Docker)

## جریان
1. **PR / push به `master`** → `ci.yml`: lint، format، typecheck، Vitest، migrate+seed روی Postgres موقت، build، `npm audit`، Playwright e2e.
2. **push به `master`** → Vercel (اتصال Git) خودش build و منتشر می‌کند.
3. وقتی **CI روی master سبز شد** → `deploy.yml`:
   - `prisma migrate deploy` روی دیتابیس production (فقط مایگریشن‌های commit‌شده)
   - صبر تا `GET {SITE_URL}/api/health` همان کامیت را برگرداند و دیتابیس وصل باشد (تا ~۱۳ دقیقه). نشد → job قرمز می‌شود.
4. `security.yml`: gitleaks، npm audit، CodeQL (هر push و هر دوشنبه).

## تنظیمات لازم (یک‌بار، در GitHub)
در ریپو: **Settings → Secrets and variables → Actions**
| نوع | نام | مقدار |
|---|---|---|
| Secret | `PRODUCTION_DATABASE_URL` | رشته‌ی اتصال دیتابیس production (همان `DATABASE_URL` در Vercel) |
| Variable | `SITE_URL` | آدرس سایت، مثل `https://bank-abzar.vercel.app` (بدون `/` آخر) |

و **Settings → Environments → New environment → `production`** (اختیاری: Required reviewers تا قبل از مایگریشن تأیید دستی بخواهد).
اگر این دو مقدار نباشند، `deploy.yml` فقط هشدار می‌دهد و رد می‌شود (خطا نمی‌دهد).

در Vercel: **Settings → Environment Variables → «Automatically expose System Environment Variables» روشن باشد** تا `VERCEL_GIT_COMMIT_SHA` برای health-check موجود باشد.

⚠️ هیچ مقدار محرمانه‌ای (`.env`، رشته‌ی دیتابیس، توکن) نباید commit شود؛ `.gitignore` همه‌ی `.env*` به‌جز `.env.example` را نادیده می‌گیرد و `gitleaks` هم هر push را اسکن می‌کند.

## نکته‌ی ترتیب
Vercel هم‌زمان با CI شروع به build می‌کند، پس ممکن است نسخه‌ی تازه چند دقیقه قبل از `migrate deploy` بالا بیاید. مایگریشن‌ها باید **سازگار با عقب (additive)** باشند (ستون/جدول اضافه‌کردن امن است؛ حذف/تغییر نام ستون در دو مرحله). اگر خواستید این پنجره صفر شود: در Vercel، Build Command را `prisma migrate deploy && next build` بگذارید.

## بازگشت (Rollback)
خودکار نیست. اگر health-check قرمز شد: Vercel → Deployments → نسخه‌ی سالم قبلی → **Instant Rollback**. مایگریشن‌های اعمال‌شده برگشت نمی‌خورند؛ برای همین additive بودن مهم است.

## اجرای دستی
Actions → Deploy → Run workflow (مثلاً بعد از تغییر env در Vercel).
