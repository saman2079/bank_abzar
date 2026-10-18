import type { Metadata } from "next";
import { CategoryStrip } from "@/components/home/category-strip";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { PromoBanners } from "@/components/home/promo-banners";
import { ToolFinder } from "@/components/home/tool-finder";
import { TrustBar } from "@/components/home/trust-bar";
import { listCategories, listFeaturedProducts } from "@/modules/catalog/queries";

export const metadata: Metadata = {
  title: { absolute: "بانک ابزار | فروشگاه اینترنتی ابزارآلات دستی و برقی" },
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [categories, featured] = await Promise.all([listCategories(), listFeaturedProducts()]);

  return (
    <div className="space-y-10">
      <Hero />
      <CategoryStrip categories={categories} />
      <FeaturedProducts products={featured} />
      <PromoBanners />
      <TrustBar />
      <ToolFinder />
    </div>
  );
}
