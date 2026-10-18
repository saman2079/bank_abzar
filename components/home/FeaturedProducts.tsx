import type { ProductSummary } from "@/modules/catalog/types";
import { ProductCard } from "@/Pagination/shared/product-card";

export function FeaturedProducts({ products }: { products: ProductSummary[] }) {
  return (
    <section aria-labelledby="featured-title">
      <h2 id="featured-title" className="text-xl font-extrabold">
        پیشنهادهای ویژه
      </h2>
      <p className="text-muted mt-1 text-sm">محصولات منتخب با بهترین قیمت</p>

      {/* اسکرول CSS با scroll-snap: بدون JS و مناسب CWV */}
      <ul className="no-scrollbar mt-5 flex snap-x gap-4 overflow-x-auto pb-2">
        {products.map((product) => (
          <li key={product.id} className="w-44 shrink-0 snap-start md:w-56">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}