import type { Metadata } from "next";
import { BrandStrip } from "@/components/home/brand-strip";
import { CategoryStrip } from "@/components/home/category-strip";
import { Hero } from "@/components/home/hero";
import { HeroSlider } from "@/components/home/hero-slider";
import { LatestArticles } from "@/components/home/latest-articles";
import { ProductRail } from "@/components/home/product-rail";
import { PromoBanners } from "@/components/home/promo-banners";
import { ToolFinder } from "@/components/home/tool-finder";
import { TrustBar } from "@/components/home/trust-bar";
import { JsonLd } from "@/components/shared/json-ld";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { listLatestArticles } from "@/modules/articles/queries";
import { listActiveBanners } from "@/modules/banners/queries";
import { listBrands, listCategories, listFeaturedProducts, listNewestProducts } from "@/modules/catalog/queries";

export const metadata: Metadata = {
  title: { absolute: "بانک ابزار | فروشگاه اینترنتی ابزارآلات دستی و برقی" },
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [banners, categories, featured, newest, brands, articles] = await Promise.all([
    listActiveBanners(),
    listCategories(),
    listFeaturedProducts(8),
    listNewestProducts(8),
    listBrands(),
    listLatestArticles(3),
  ]);

  return (
    <div className="space-y-10">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      {/* بنرهای ادمین؛ وقتی هیچ بنر فعالی نیست، هیروی پیش‌فرض (با h1 خودش) نمایش داده می‌شود. */}
      {banners.length > 0 ? (
        <>
          <h1 className="sr-only">بانک ابزار؛ فروشگاه اینترنتی ابزارآلات دستی و برقی</h1>
          <HeroSlider slides={banners} />
        </>
      ) : (
        <Hero />
      )}
      <TrustBar />
      <CategoryStrip categories={categories} />
      <ProductRail id="featured-title" title="تخفیف‌های ویژه" subtitle="محصولات منتخب با بهترین قیمت" href="/products?sort=discount" products={featured} />
      <PromoBanners />
      <ProductRail id="newest-title" title="تازه‌ترین محصولات" subtitle="جدیدترین ابزارهای اضافه‌شده به فروشگاه" href="/products?sort=newest" products={newest} />
      <BrandStrip brands={brands} />
      <LatestArticles articles={articles} />
      <ToolFinder />
    </div>
  );
}
