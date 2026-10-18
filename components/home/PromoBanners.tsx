import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";

export function PromoBanners() {
  return (
    <section aria-label="پیشنهادهای دسته‌ها" className="grid gap-4 md:grid-cols-2">
      <div className="border-border bg-surface relative overflow-hidden rounded-card border bg-[radial-gradient(70%_100%_at_90%_50%,rgba(245,184,0,0.16),transparent)] p-6 md:p-8">
        <h2 className="text-xl font-extrabold">تجهیزات ایمنی</h2>
        <p className="text-muted mt-2 text-sm">حفاظت جان، افزایش بهره‌وری</p>
        <Link href="/categories/safety" className={buttonVariants({ size: "sm", className: "mt-5" })}>
          مشاهده محصولات
        </Link>
      </div>

      <div className="border-border bg-surface relative overflow-hidden rounded-card border bg-[radial-gradient(70%_100%_at_10%_50%,rgba(245,184,0,0.12),transparent)] p-6 md:p-8">
        <h2 className="text-xl font-extrabold">پکیج‌های ویژه</h2>
        <p className="text-muted mt-2 text-sm">ابزارهای برکاربرد با قیمت استثنایی</p>
        <Link href="/products" className={buttonVariants({ variant: "outline", size: "sm", className: "mt-5" })}>
          مشاهده پکیج‌ها
        </Link>
      </div>
    </section>
  );
}