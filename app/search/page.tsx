import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/product-card";
import { demoProducts } from "@/lib/demo-products";
import { normalizePersianSearch } from "@/lib/persian";
import "../shop.css";

export const metadata: Metadata = { title: "جست‌وجوی محصولات", description: "جست‌وجوی نمونه در کاتالوگ نمایشی بانک ابزار." };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 120);
  const normalized = normalizePersianSearch(query);
  const results = normalized ? demoProducts.filter((product) => normalizePersianSearch([product.name, product.category, product.brand, product.description].join(" ")).includes(normalized)) : [];
  return (
    <main className="shop-page"><div className="container">
      <div className="shop-breadcrumb"><Link href="/">خانه</Link><span>/</span><span>جست‌وجو</span></div>
      <header className="shop-page-heading"><div><span className="eyebrow">جست‌وجوی ابزار</span><h1>{query ? `نتایج جست‌وجو برای «${query}»` : "چه ابزاری نیاز دارید؟"}</h1><p>این جست‌وجو فعلاً روی داده‌های نمونه انجام می‌شود.</p></div><Link className="button-primary" href="/products">دیدن همه محصولات</Link></header>
      {results.length ? <><p className="search-result-count">{new Intl.NumberFormat("fa-IR").format(results.length)} نتیجه</p><div className="product-grid">{results.map((product) => <ProductCard key={product.id} product={product} />)}</div></> : <div className="empty-state"><span>⌕</span><h2>{query ? "محصولی در نمونه‌ها پیدا نشد" : "عبارت موردنظرتان را جست‌وجو کنید"}</h2><p>نام ابزار یا دسته‌بندی را وارد کنید؛ برای مثال «دریل» یا «ابزار دستی».</p><Link className="button-primary" href="/products">مرور محصولات نمونه</Link></div>}
    </div></main>
  );
}
