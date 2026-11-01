import { SectionHeader } from "@/components/home/section-header";
import { ProductCard } from "@/components/shared/product-card";
import type { ProductSummary } from "@/modules/catalog/types";

type ProductRailProps = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  products: ProductSummary[];
};

/** ردیف افقی محصولات (اسکرول CSS با scroll-snap: بدون JS و مناسب CWV). با لیست خالی چیزی رندر نمی‌شود. */
export function ProductRail({ id, title, subtitle, href, products }: ProductRailProps) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby={id} className="space-y-5">
      <SectionHeader id={id} title={title} subtitle={subtitle} href={href} />
      <ul className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-2">
        {products.map((product) => (
          <li key={product.id} className="w-44 shrink-0 snap-start md:w-56">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
