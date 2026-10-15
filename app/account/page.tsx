import type { Metadata } from "next";
import Link from "next/link";
import "../shop.css";

export const metadata: Metadata = { title: "حساب کاربری", description: "پیش‌نمایش صفحه حساب کاربری بانک ابزار." };

export default function AccountPage() {
  return <main className="shop-page"><div className="container">
    <div className="shop-breadcrumb"><Link href="/">خانه</Link><span>/</span><span>حساب کاربری</span></div>
    <section className="account-preview"><span className="account-preview-icon">♙</span><span className="eyebrow">حساب مشتری</span><h1>همه سفارش‌ها، یک‌جا</h1><p>ورود با شماره موبایل و رمز یک‌بارمصرف در برنامه پیاده‌سازی خواهد شد. در حال حاضر ورود واقعی فعال نیست و هیچ شماره‌ای ارسال یا ذخیره نمی‌شود.</p><div className="account-preview-steps"><div><strong>۰۱</strong><span>ورود امن با پیامک</span></div><div><strong>۰۲</strong><span>مدیریت آدرس‌ها</span></div><div><strong>۰۳</strong><span>پیگیری سفارش‌ها</span></div></div><span className="demo-notice">این بخش صرفاً نمایشی است</span><div><Link className="button-primary" href="/products">مرور محصولات</Link></div></section>
  </div></main>;
}
