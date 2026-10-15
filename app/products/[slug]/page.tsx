import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/add-to-cart-button";
import { demoProducts, formatToman } from "@/lib/demo-products";
import "../../shop.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return demoProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = demoProducts.find((item) => item.slug === slug);
  return product ? { title: product.name, description: product.description } : { title: "محصول پیدا نشد" };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = demoProducts.find((item) => item.slug === slug);
  if (!product) notFound();
  return (
    <main className="shop-page"><div className="container">
      <div className="shop-breadcrumb"><Link href="/">خانه</Link><span>/</span><Link href="/products">محصولات</Link><span>/</span><span>{product.name}</span></div>
      <div className="product-detail">
        <div className="detail-art-wrap"><span className={`product-art tone-${product.tone}`}>{product.icon}</span><span className="demo-notice">تصویرسازی گرافیکی نمونه</span></div>
        <section className="detail-copy"><span className="eyebrow">{product.category}</span><h1>{product.name}</h1><p className="product-brand">برند: {product.brand}</p><p className="detail-description">{product.description}</p><div className="detail-price">{product.oldPriceToman ? <del>{formatToman(product.oldPriceToman)}</del> : null}<strong>{formatToman(product.priceToman)}</strong></div><p className="detail-stock"><span className="stock-dot" /> موجودی نمونه: {new Intl.NumberFormat("fa-IR").format(product.stock)} عدد</p><AddToCartButton productId={product.id} disabled={product.stock < 1} /><p className="detail-disclaimer">این محصول، قیمت و موجودی صرفاً برای نمایش رابط کاربری هستند؛ سفارش واقعی یا پرداخت انجام نمی‌شود.</p><h2>مشخصات محصول</h2><dl className="spec-list">{product.specs.map((spec) => <div key={spec.label}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}</dl></section>
      </div>
    </div></main>
  );
}
