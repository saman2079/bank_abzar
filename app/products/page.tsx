import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/product-card";
import { demoProducts } from "@/lib/demo-products";
import "../shop.css";

export const metadata: Metadata = { title: "همه محصولات", description: "مرور نمونه نمایشی محصولات فروشگاه بانک ابزار." };

export default function ProductsPage() {
  const categories = ["همه", ...Array.from(new Set(demoProducts.map((product) => product.category)))];
  return (
    <main className="shop-page">
      <div className="container">
        <div className="shop-breadcrumb"><Link href="/">خانه</Link><span>/</span><span>محصولات</span></div>
        <header className="shop-page-heading">
          <div><span className="eyebrow">کاتالوگ بانک ابزار</span><h1>ابزار مناسب کارتان را پیدا کنید</h1><p>مشخصات را مقایسه کنید و محصولات موردنیازتان را در یک فهرست ببینید.</p></div>
          <span className="demo-notice">نسخه پیش‌نمایش · داده‌ها نمونه‌اند</span>
        </header>
        <div className="shop-layout">
          <aside className="shop-sidebar">
            <h2>دسته‌بندی‌ها</h2>
            {categories.map((category) => <a key={category} href={category === "همه" ? "/products" : `/search?q=${encodeURIComponent(category)}`}>{category}<span>←</span></a>)}
            <div className="sidebar-note"><strong>یادآوری</strong><p>قیمت، موجودی و برندهای این صفحه داده واقعی فروشگاه نیستند.</p></div>
          </aside>
          <section className="shop-results" aria-label="فهرست محصولات">
            <div className="results-toolbar"><span>{new Intl.NumberFormat("fa-IR").format(demoProducts.length)} محصول نمونه</span><span>مرتب‌سازی: پیشنهادی</span></div>
            <div className="product-grid">{demoProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>
          </section>
        </div>
      </div>
    </main>
  );
}
