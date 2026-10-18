import type { Metadata } from "next";

import { listCategories, listFeaturedProducts } from "@/modules/catalog/queries";
import { Hero } from "@/components/home/Hero";
import { CategoryStrip } from "@/components/home/CategoryStrip";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { PromoBanners } from "@/components/home/PromoBanners";
import { TrustBar } from "@/components/home/TrustBar";

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
      {/* <ToolFinder /> */}
    </div>
  );
}