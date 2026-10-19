import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheck, Truck } from "lucide-react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { ProductGrid } from "@/components/shared/product-grid";
import { ProductImage } from "@/components/shared/product-image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { discountPercent, formatNumber, formatToman } from "@/lib/format";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo";
import {
  getCategoryBySlug,
  getProductBySlug,
  getRelatedProducts,
  listProductSlugs,
} from "@/modules/catalog/queries";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const slugs = await listProductSlugs();
  // با Cache Components، generateStaticParams نباید خالی برگردد (مثلاً وقتی دیتابیس هنوز seed نشده).
  if (slugs.length === 0) return [{ slug: "_" }];
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const title = `خرید ${product.name} ${product.brand}`;
  return {
    title,
    description: product.shortDescription,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { type: "website", title, description: product.shortDescription },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [category, related] = await Promise.all([
    getCategoryBySlug(product.categorySlug),
    getRelatedProducts(product.slug),
  ]);

  const discount = discountPercent(product.price, product.compareAtPrice);
  const inStock = product.stock > 0;

  const crumbs = [
    { label: "خانه", href: "/" },
    { label: "فروشگاه", href: "/products" },
    ...(category ? [{ label: category.name, href: `/categories/${category.slug}` }] : []),
    { label: product.name },
  ];

  return (
    <div className="space-y-10">
      <JsonLd data={productJsonLd(product)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "خانه", path: "/" },
          { name: "فروشگاه", path: "/products" },
          ...(category ? [{ name: category.name, path: `/categories/${category.slug}` }] : []),
          { name: product.name, path: `/products/${product.slug}` },
        ])}
      />

      <Breadcrumbs items={crumbs} />

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="overflow-hidden">
          {product.images.length > 0 ? (
            <ul className="flex snap-x snap-mandatory overflow-x-auto">
              {product.images.map((image, index) => (
                <li key={image.url} className="relative aspect-square w-full shrink-0 snap-center">
                  <ProductImage image={image} sizes="(min-width: 768px) 50vw, 100vw" priority={index === 0} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="relative aspect-square">
              <ProductImage />
            </div>
          )}
        </Card>

        <div>
          <p className="text-muted text-sm font-bold tracking-wide" dir="ltr">
            {product.brand}
          </p>
          <h1 className="mt-2 text-2xl leading-9 font-extrabold">{product.name}</h1>
          <p className="text-muted mt-3 text-sm leading-7">{product.shortDescription}</p>

          <div className="mt-6 flex items-end gap-3">
            <p className="text-2xl font-extrabold">{formatToman(product.price)}</p>
            {discount > 0 && <Badge tone="danger">٪{formatNumber(discount)}-</Badge>}
          </div>
          {product.compareAtPrice ? (
            <p className="text-muted mt-1 text-sm line-through">{formatToman(product.compareAtPrice)}</p>
          ) : null}

          <p className={inStock ? "mt-4 text-sm text-emerald-400" : "text-danger mt-4 text-sm"}>
            {inStock ? "موجود در انبار" : "ناموجود"}
          </p>

          <div className="mt-6">
            <AddToCartButton productId={product.id} productName={product.name} inStock={inStock} variant="full" />
          </div>

          <ul className="text-muted mt-8 space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <ShieldCheck className="text-primary size-5" aria-hidden />
              ضمانت اصالت کالا
            </li>
            <li className="flex items-center gap-2">
              <Truck className="text-primary size-5" aria-hidden />
              ارسال سریع به سراسر کشور
            </li>
          </ul>
        </div>
      </div>

      <section aria-labelledby="specs-title">
        <h2 id="specs-title" className="mb-4 text-xl font-extrabold">
          مشخصات فنی
        </h2>
        <Card className="overflow-hidden">
          <dl>
            {product.specs.map((spec) => (
              <div
                key={spec.label}
                className="border-border grid grid-cols-3 gap-4 border-b px-5 py-3 text-sm last:border-b-0"
              >
                <dt className="text-muted">{spec.label}</dt>
                <dd className="col-span-2">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </section>

      <section aria-labelledby="desc-title">
        <h2 id="desc-title" className="mb-4 text-xl font-extrabold">
          توضیحات
        </h2>
        <p className="text-muted leading-8">{product.description}</p>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-title">
          <h2 id="related-title" className="mb-4 text-xl font-extrabold">
            محصولات مرتبط
          </h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
