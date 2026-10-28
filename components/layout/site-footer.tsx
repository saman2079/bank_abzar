import Link from "next/link";
import { Wrench } from "lucide-react";

const quickLinks = [
  { href: "/products", label: "فروشگاه" },
  { href: "/categories", label: "دسته‌بندی‌ها" },
  { href: "/blog", label: "مقالات" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
  { href: "/rules", label: "قوانین و مقررات" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-border bg-surface mt-16 border-t">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold">
            <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-[#3bb8f5] to-[#1b7fc4] text-white shadow-md">
              <Wrench className="size-5" aria-hidden />
            </span>
            بانک ابزار
          </Link>
          <p className="text-muted mt-4 text-sm leading-7">
            فروشگاه اینترنتی ابزارآلات دستی و برقی؛ عرضه‌ی برندهای معتبر جهانی با ضمانت اصالت کالا و ارسال سریع به
            سراسر کشور.
          </p>
        </div>

        <nav aria-label="دسترسی سریع">
          <h2 className="mb-4 font-bold">دسترسی سریع</h2>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-muted hover:text-primary transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="mb-4 font-bold">تماس با ما</h2>
          {/* اطلاعات واقعی تماس از صاحب فروشگاه گرفته شود */}
          <p className="text-muted text-sm leading-7">اطلاعات تماس و آدرس فروشگاه به‌زودی در این بخش قرار می‌گیرد.</p>
        </div>
      </div>

      <div className="border-border text-muted border-t py-4 text-center text-xs">
        © تمامی حقوق برای بانک ابزار محفوظ است.
      </div>
    </footer>
  );
}
