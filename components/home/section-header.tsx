import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type SectionHeaderProps = { id: string; title: string; subtitle?: string; href?: string; linkLabel?: string };

/** عنوان بخش‌های صفحه‌ی اول + لینک «مشاهده همه» (حس فروشگاهی). */
export function SectionHeader({ id, title, subtitle, href, linkLabel = "مشاهده همه" }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 id={id} className="text-xl font-extrabold">
          {title}
        </h2>
        {subtitle ? <p className="text-muted mt-1 text-sm">{subtitle}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="text-primary flex shrink-0 items-center gap-1 text-sm font-bold hover:underline">
          {linkLabel}
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
