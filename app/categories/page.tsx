import type { Metadata } from "next";
import Link from "next/link";
import "../shop.css";

export const metadata: Metadata = { title: "دسته‌بندی محصولات", description: "دسته‌بندی‌های نمونه فروشگاه بانک ابزار." };

const categories = [
  { id: "1", title: "ابزار برقی", detail: "دریل، فرز و پیچ‌بند", icon: "⌁", tone: "green" },
  { id: "2", title: "ابزار دستی", detail: "آچار، انبر و پیچ‌گوشتی", icon: "⚒", tone: "orange" },
  { id: "3", title: "اندازه‌گیری", detail: "متر، تراز و لیزر", icon: "◉", tone: "blue" },
  { id: "4", title: "ایمنی و حفاظت", detail: "دستکش، عینک و ماسک", icon: "✳", tone: "sand" },
  { id: "5", title: "باغبانی", detail: "قیچی و ابزار نگهداری", icon: "♧", tone: "green" },
  { id: "6", title: "تجهیزات کارگاهی", detail: "لوازم کاربردی کارگاه", icon: "▦", tone: "blue" },
];

export default function CategoriesPage() {
  return <main className="shop-page"><div className="container"><div className="shop-breadcrumb"><Link href="/">خانه</Link><span>/</span><span>دسته‌بندی‌ها</span></div><header className="shop-page-heading"><div><span className="eyebrow">کشف آسان‌تر</span><h1>دسته‌بندی محصولات</h1><p>گروه ابزار موردنیازت را انتخاب کن و نمونه‌های موجود را ببین.</p></div><span className="demo-notice">داده‌های نمونه</span></header><div className="category-grid-page">{categories.map((category) => <Link className="category-page-card lift" href={`/categories/${category.id}`} key={category.id}><span className={`product-art tone-${category.tone}`}>{category.icon}</span><span><strong>{category.title}</strong><small>{category.detail}</small></span><span className="category-arrow">←</span></Link>)}</div></div></main>;
}
