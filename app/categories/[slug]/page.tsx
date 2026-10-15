import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/product-card";
import { demoProducts } from "@/lib/demo-products";
import "../../shop.css";

const categories = [
  { id: "1", title: "ابزار برقی", detail: "دریل، فرز و پیچ‌بند" },
  { id: "2", title: "ابزار دستی", detail: "آچار، انبر و پیچ‌گوشتی" },
  { id: "3", title: "اندازه‌گیری", detail: "متر، تراز و لیزر" },
  { id: "4", title: "ایمنی و حفاظت", detail: "دستکش، عینک و ماسک" },
  { id: "5", title: "باغبانی", detail: "قیچی و ابزار نگهداری" },
  { id: "6", title: "تجهیزات کارگاهی", detail: "لوازم کاربردی کارگاه" },
];

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return categories.map((category) => ({ slug: category.id })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((item) => item.id === slug);
  return category ? { title: category.title, description: category.detail } : { title: "دسته‌بندی پیدا نشد" };
}

export default async function CategoryDetailPage({ params }: Props) {
  const { slug } = await params;
  const category = categories.find((item) => item.id === slug);
  if (!category) notFound();
  const products = demoProducts.filter((product) => product.category === category.title);
  return <main className="shop-page"><div className="container"><div className="shop-breadcrumb"><Link href="/">خانه</Link><span>/</span><Link href="/categories">دسته‌بندی‌ها</Link><span>/</span><span>{category.title}</span></div><header className="shop-page-heading"><div><span className="eyebrow">دسته‌بندی</span><h1>{category.title}</h1><p>{category.detail}</p></div><span className="demo-notice">کاتالوگ نمونه</span></header>{products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><span>⌁</span><h2>محصولی برای این دسته در نمونه فعلی نیست</h2><p>این دسته‌بندی در طراحی در نظر گرفته شده؛ محصولات واقعی پس از اتصال پنل مدیریت و دیتابیس اضافه می‌شوند.</p><Link className="button-primary" href="/products">مشاهده همه محصولات</Link></div>}</div></main>;
}
