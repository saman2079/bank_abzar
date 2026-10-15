import type { Metadata } from "next";
import Link from "next/link";
import "../shop.css";

export const metadata: Metadata = { title: "تماس با بانک ابزار", description: "پیش‌نمایش صفحه ارتباط با فروشگاه بانک ابزار." };

export default function ContactPage() {
  return <main className="shop-page"><div className="container"><div className="shop-breadcrumb"><Link href="/">خانه</Link><span>/</span><span>تماس با ما</span></div><section className="account-preview"><span className="account-preview-icon">✉</span><span className="eyebrow">ارتباط با ما</span><h1>در کنار شما هستیم</h1><p>اطلاعات واقعی تماس، ساعات پاسخ‌گویی و فرم پیام پس از دریافت اطلاعات کسب‌وکار تنظیم می‌شوند. در این نسخه شماره یا نشانی ساختگی نمایش داده نمی‌شود.</p><span className="demo-notice">اطلاعات تماس هنوز تنظیم نشده</span><div><Link className="button-primary" href="/products">مرور محصولات نمونه</Link></div></section></div></main>;
}
