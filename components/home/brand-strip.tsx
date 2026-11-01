import Link from "next/link";
import { SectionHeader } from "@/components/home/section-header";

/** برندهای دارای محصول فعال؛ هر برند به لیست محصولات فیلترشده لینک می‌شود. */
export function BrandStrip({ brands }: { brands: string[] }) {
  if (brands.length === 0) return null;

  return (
    <section aria-labelledby="brands-title" className="space-y-5">
      <SectionHeader id="brands-title" title="برندهای معتبر" subtitle="خرید بر اساس برند مورد علاقه" href="/products" linkLabel="همه محصولات" />
      <ul className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-2">
        {brands.map((brand) => (
          <li key={brand} className="shrink-0 snap-start">
            <Link
              href={`/products?brand=${encodeURIComponent(brand)}`}
              className="border-border bg-surface hover:border-primary hover:text-primary grid h-16 min-w-32 place-items-center rounded-card border px-6 text-sm font-extrabold tracking-wide transition-colors"
              dir="auto"
            >
              {brand}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
