import type { Metadata } from "next";
import Link from "next/link";
import "../shop.css";

export const metadata: Metadata = { title: "راهنمای خرید ابزار", description: "پیش‌نمایش بخش راهنمای خرید و مقالات بانک ابزار." };

const guides = [
  { number: "۰۱", title: "پیش از خرید دریل به چه نکاتی توجه کنیم؟", description: "نوع کار، منبع تغذیه، توان و لوازم جانبی از معیارهای مهم انتخاب هستند." },
  { number: "۰۲", title: "ابزار ایمنی؛ بخش جدانشدنی کارگاه", description: "انتخاب تجهیزات حفاظت فردی باید متناسب با خطرها و شرایط محیط کار باشد." },
  { number: "۰۳", title: "چطور ابزار دستی مناسب انتخاب کنیم؟", description: "کیفیت ساخت، اندازه مناسب و نوع استفاده را قبل از خرید بررسی کنید." },
];

export default function ArticlesPage() {
  return <main className="shop-page"><div className="container"><div className="shop-breadcrumb"><Link href="/">خانه</Link><span>/</span><span>راهنمای خرید</span></div><header className="shop-page-heading"><div><span className="eyebrow">دانش ابزار</span><h1>انتخاب آگاهانه، کار بهتر</h1><p>نمونه‌ای از ساختار محتوایی که بعداً از پنل مدیریت منتشر خواهد شد.</p></div><span className="demo-notice">محتوای نمونه</span></header><div className="guide-card-grid">{guides.map((guide) => <article className="guide-preview-card" key={guide.number}><span>{guide.number}</span><h2>{guide.title}</h2><p>{guide.description}</p><small>مقاله نمونه · محتوای نهایی در دست تهیه</small></article>)}</div></div></main>;
}
