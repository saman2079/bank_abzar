"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { demoProducts, formatToman } from "@/lib/demo-products";
import "../shop.css";

type CartLine = { productId: string; quantity: number };

export default function CartPage() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    try {
      const raw = window.localStorage.getItem("bank-abzar-demo-cart");
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setLines(parsed.filter((line): line is CartLine => typeof line === "object" && line !== null && "productId" in line && "quantity" in line && typeof line.productId === "string" && typeof line.quantity === "number" && Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= 99));
      }
    } catch {
      setLines([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("bank-abzar-cart-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("bank-abzar-cart-updated", refresh);
    };
  }, [refresh]);

  const items = lines.map((line) => ({ line, product: demoProducts.find((product) => product.id === line.productId) })).filter((item): item is { line: CartLine; product: (typeof demoProducts)[number] } => Boolean(item.product));
  const total = items.reduce((sum, item) => sum + item.product.priceToman * item.line.quantity, 0);

  function save(next: CartLine[]) {
    setLines(next);
    window.localStorage.setItem("bank-abzar-demo-cart", JSON.stringify(next));
    window.dispatchEvent(new Event("bank-abzar-cart-updated"));
  }

  return <main className="shop-page"><div className="container">
    <div className="shop-breadcrumb"><Link href="/">خانه</Link><span>/</span><span>سبد خرید</span></div>
    <header className="shop-page-heading"><div><span className="eyebrow">سبد خرید</span><h1>ابزارهای انتخاب‌شده</h1><p>این سبد فقط برای پیش‌نمایش رابط کاربری و در مرورگر شما ذخیره می‌شود.</p></div><span className="demo-notice">دمو · بدون سفارش واقعی</span></header>
    {!ready ? <div className="empty-state">در حال آماده‌سازی سبد…</div> : items.length === 0 ? <div className="empty-state"><span>▱</span><h2>سبد خرید شما خالی است</h2><p>از کاتالوگ نمونه محصولی انتخاب کنید تا اینجا نمایش داده شود.</p><Link className="button-primary" href="/products">مشاهده محصولات</Link></div> : <div className="cart-layout">
      <section className="cart-lines">{items.map(({ line, product }) => <article className="cart-line" key={product.id}><span className={`product-art tone-${product.tone}`}>{product.icon}</span><div className="cart-line-info"><Link href={`/products/${product.slug}`}><strong>{product.name}</strong></Link><span>{formatToman(product.priceToman)}</span><div className="quantity-control"><button type="button" aria-label="کم کردن تعداد" onClick={() => save(line.quantity === 1 ? lines.filter((item) => item.productId !== line.productId) : lines.map((item) => item.productId === line.productId ? { ...item, quantity: item.quantity - 1 } : item))}>−</button><span>{new Intl.NumberFormat("fa-IR").format(line.quantity)}</span><button type="button" aria-label="زیاد کردن تعداد" onClick={() => save(lines.map((item) => item.productId === line.productId ? { ...item, quantity: Math.min(99, item.quantity + 1) } : item))} disabled={line.quantity >= 99}>+</button><button className="remove-line" type="button" onClick={() => save(lines.filter((item) => item.productId !== line.productId))}>حذف</button></div></div><strong className="cart-line-total">{formatToman(product.priceToman * line.quantity)}</strong></article>)}</section>
      <aside className="cart-summary"><h2>خلاصه سبد</h2><div><span>تعداد کالا</span><strong>{new Intl.NumberFormat("fa-IR").format(items.reduce((sum, item) => sum + item.line.quantity, 0))}</strong></div><div><span>جمع نمونه</span><strong>{formatToman(total)}</strong></div><div><span>هزینه ارسال</span><strong>پس از راه‌اندازی مشخص می‌شود</strong></div><hr/><div className="summary-total"><span>مجموع نمایشی</span><strong>{formatToman(total)}</strong></div><button className="product-add-button" type="button" disabled>ادامه ثبت سفارش (هنوز فعال نیست)</button><p>ثبت سفارش، پرداخت، رزرو موجودی و ارسال در این نسخه پیاده‌سازی نشده‌اند.</p></aside>
    </div>}
  </div></main>;
}
