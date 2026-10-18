import Link from "next/link";
import {
  Boxes,
  Cog,
  Drill,
  HardHat,
  PaintBucket,
  Plug,
  Sprout,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { CategorySummary } from "@/modules/catalog/types";

const icons: Record<string, LucideIcon> = {
  "power-tools": Drill,
  "hand-tools": Wrench,
  safety: HardHat,
  machinery: Cog,
  accessories: Plug,
  materials: Boxes,
  garden: Sprout,
  paint: PaintBucket,
};

export function CategoryStrip({ categories }: { categories: CategorySummary[] }) {
  return (
    <section aria-label="دسته‌بندی‌ها">
      <ul className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-9 lg:overflow-visible">
        {categories.map((category) => {
          const Icon = icons[category.slug] ?? Wrench;
          return (
            <li key={category.slug} className="shrink-0 snap-start">
              <Link
                href={`/categories/${category.slug}`}
                className="border-border bg-surface hover:border-primary group flex w-24 flex-col items-center gap-3 rounded-card border px-2 py-4 transition-colors lg:w-auto"
              >
                <span className="bg-surface-2 text-primary grid size-14 place-items-center rounded-full">
                  <Icon className="size-7" strokeWidth={1.5} aria-hidden />
                </span>
                <span className="text-center text-xs font-medium">{category.name}</span>
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 snap-start">
          <Link
            href="/categories"
            className="border-border text-muted hover:border-primary hover:text-primary grid h-full w-24 place-items-center rounded-card border border-dashed px-2 py-4 text-xs transition-colors lg:w-auto"
          >
            مشاهده همه
          </Link>
        </li>
      </ul>
    </section>
  );
}
