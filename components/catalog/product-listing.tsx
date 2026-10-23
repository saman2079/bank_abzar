import Link from "next/link";
import { Search } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ProductGrid } from "@/components/shared/product-grid";
import { formatNumber } from "@/lib/format";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request";
import { DEFAULT_SORT, PRODUCT_SORTS, PRODUCT_SORT_LABELS } from "@/modules/catalog/constants";
import { listBrands, listCategories, listProducts } from "@/modules/catalog/queries";
import { productListQuerySchema } from "@/modules/catalog/schemas";

type RawSearchParams = Record<string, string | string[] | undefined>;

type ProductListingProps = {
  /** Promise خام searchParams؛ داخل Suspense خوانده می‌شود چون داده‌ی runtime است. */
  searchParams: Promise<RawSearchParams>;
  basePath: string;
  /** اگر صفحه‌ی یک دسته باشد، فیلتر دسته قفل و مخفی می‌شود. */
  fixedCategory?: string;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function ProductListing({ searchParams, basePath, fixedCategory }: ProductListingProps) {
  const raw = await searchParams;

  const query = productListQuerySchema.parse({
    q: first(raw.q),
    category: fixedCategory ?? first(raw.category),
    brand: first(raw.brand),
    sort: first(raw.sort),
    page: first(raw.page),
  });

  // جستجوی متنی کش نمی‌شود و به DB می‌رسد؛ سقف تعداد جستجو برای هر IP (ضد اسکرپ/فشار).
  if (query.q) {
    const { ip } = await getRequestMeta();
    const limit = await rateLimit(`search:${ip}`, 40, 60);
    if (!limit.ok) {
      return (
        <p role="alert" className="text-danger py-10 text-center text-sm">
          تعداد جستجوها زیاد است؛ چند لحظه بعد دوباره تلاش کنید.
        </p>
      );
    }
  }

  const [result, categories, brands] = await Promise.all([
    listProducts(query),
    listCategories(),
    listBrands(),
  ]);

  const hasFilters = Boolean(query.q || query.brand || (!fixedCategory && query.category));

  return (
    <div className="space-y-6">
      <form
        action={basePath}
        className="border-border bg-surface grid gap-3 rounded-card border p-4 md:grid-cols-2 lg:grid-cols-5"
      >
        <div className="relative lg:col-span-2">
          <label htmlFor="f-q" className="sr-only">
            جستجو
          </label>
          <Search className="text-muted pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2" aria-hidden />
          <Input id="f-q" name="q" defaultValue={query.q} placeholder="جستجوی نام یا برند..." className="ps-10" />
        </div>

        {!fixedCategory && (
          <div>
            <label htmlFor="f-category" className="sr-only">
              دسته‌بندی
            </label>
            <Select id="f-category" name="category" defaultValue={query.category ?? ""}>
              <option value="">همه دسته‌ها</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <label htmlFor="f-brand" className="sr-only">
            برند
          </label>
          <Select id="f-brand" name="brand" defaultValue={query.brand ?? ""}>
            <option value="">همه برندها</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="f-sort" className="sr-only">
            مرتب‌سازی
          </label>
          <Select id="f-sort" name="sort" defaultValue={query.sort}>
            {PRODUCT_SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {PRODUCT_SORT_LABELS[sort]}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex gap-2 md:col-span-2 lg:col-span-5 lg:justify-end">
          <Button type="submit" size="md">
            اعمال فیلتر
          </Button>
          {hasFilters && (
            <Link href={basePath} className={buttonVariants({ variant: "outline", size: "md" })}>
              حذف فیلترها
            </Link>
          )}
        </div>
      </form>

      <p className="text-muted text-sm" aria-live="polite">
        {formatNumber(result.total)} محصول
      </p>

      {result.items.length > 0 ? (
        <>
          <ProductGrid products={result.items} />
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath={basePath}
            params={{
              q: query.q,
              category: fixedCategory ? undefined : query.category,
              brand: query.brand,
              sort: query.sort === DEFAULT_SORT ? undefined : query.sort,
            }}
          />
        </>
      ) : (
        <div className="border-border text-muted rounded-card border border-dashed p-10 text-center text-sm">
          محصولی با این فیلترها پیدا نشد.
        </div>
      )}
    </div>
  );
}
