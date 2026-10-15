import type { Metadata } from "next";
import "./home.css";
import "./shop.css";
import ProductCard from "@/components/product-card";
import { demoProducts } from "@/lib/demo-products";

export const metadata: Metadata = {
  title: "فروشگاه تخصصی ابزارآلات",
  description:
    "بانک ابزار؛ راهنمای انتخاب ابزار مناسب برای کارگاه، پروژه‌های ساختمانی و استفاده روزمره.",
};

const categories = [
  { icon: "⌁", title: "ابزار برقی", detail: "دریل، فرز و پیچ‌بند", tone: "green" },
  { icon: "⚒", title: "ابزار دستی", detail: "آچار، انبر و پیچ‌گوشتی", tone: "orange" },
  { icon: "◉", title: "اندازه‌گیری", detail: "متر، تراز و لیزر", tone: "blue" },
  { icon: "✳", title: "ایمنی و حفاظت", detail: "دستکش، عینک و ماسک", tone: "sand" },
  { icon: "♧", title: "باغبانی", detail: "قیچی و ابزار نگهداری", tone: "green" },
  { icon: "▦", title: "تجهیزات کارگاهی", detail: "لوازم کاربردی کارگاه", tone: "blue" },
];

const benefits = [
  { icon: "✓", title: "انتخاب آگاهانه", text: "راهنمای روشن برای انتخاب ابزار متناسب با کار شما" },
  { icon: "↗", title: "خرید ساده و سریع", text: "مسیر خرید سرراست، از جست‌وجو تا ثبت سفارش" },
  { icon: "▤", title: "اطلاعات شفاف", text: "مشخصات فنی و جزئیات محصول، پیش از تصمیم‌گیری" },
];

function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand-mark${light ? " brand-mark-light" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none">
        <path d="M7 10.5 20 3l13 7.5v15L20 33 7 25.5v-15Z" stroke="currentColor" strokeWidth="2.2" />
        <path d="m13 14 7-4 7 4v8l-7 4-7-4v-8Z" fill="currentColor" />
        <path d="m17 17 3-1.8 3 1.8v3.5l-3 1.8-3-1.8V17Z" fill="#fff" />
      </svg>
    </span>
  );
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H5m0 0 6-6m-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function Home() {
  return (
    <main>
      <div className="announcement">
        <div className="container announcement-inner">
          <span><i /> همراه مطمئن شما در انتخاب ابزار</span>
          <span className="announcement-note">ابزار مناسب، نتیجه بهتر</span>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-main">
          <a href="/" className="brand" aria-label="بانک ابزار، صفحه اصلی">
            <BrandMark />
            <span className="brand-copy"><strong>بانک ابزار</strong><small>انتخاب حرفه‌ای، کار مطمئن</small></span>
          </a>

          <form action="/search" className="search-form" role="search">
            <SearchIcon />
            <input name="q" type="search" placeholder="چه ابزاری نیاز دارید؟ نام محصول یا برند را جست‌وجو کنید..." aria-label="جست‌وجوی محصولات" />
            <button type="submit">جست‌وجو</button>
          </form>

          <div className="header-actions">
            <a className="account-action" href="/account">
              <span className="action-icon">♙</span><span><small>خوش آمدید</small><strong>ورود / حساب من</strong></span>
            </a>
            <a className="cart-action" href="/cart" aria-label="سبد خرید">
              <span className="cart-symbol">▱</span><span className="cart-count">۰</span>
            </a>
          </div>
        </div>

        <nav className="category-nav" aria-label="منوی اصلی">
          <div className="container nav-inner">
            <a href="#categories" className="nav-categories"><span>☷</span> دسته‌بندی محصولات</a><a href="/products">همه محصولات</a>
            <a href="#categories">ابزار برقی</a><a href="#categories">ابزار دستی</a><a href="#categories">ابزار اندازه‌گیری</a><a href="#categories">ایمنی و حفاظت</a>
            <a href="#guide">راهنمای خرید</a>
            <span className="nav-spacer" />
            <span className="nav-tag">برای حرفه‌ای‌ها، با دقت بیشتر</span>
          </div>
        </nav>
      </header>

      <section className="hero-wrap">
        <div className="container hero">
          <div className="hero-copy">
            <span className="hero-kicker"><span className="kicker-line" /> دنیای ابزار، یک انتخاب دقیق</span>
            <h1>برای هر کار،<br /><span>ابزار درست</span> را پیدا کن.</h1>
            <p>از کارهای روزمره تا پروژه‌های حرفه‌ای؛ ابزار موردنیازت را با اطلاعات روشن و انتخابی مطمئن پیدا کن.</p>
            <div className="hero-actions">
              <a className="button-primary" href="#categories">مشاهده دسته‌بندی‌ها <ArrowIcon /></a>
              <a className="button-quiet" href="#guide">راهنمای انتخاب ابزار</a>
            </div>
            <div className="hero-proof">
              <span className="proof-icon">✓</span>
              <span><strong>اول انتخاب درست</strong><small>مشخصات شفاف، تصمیم بهتر</small></span>
              <span className="proof-divider" />
              <span className="proof-icon proof-icon-orange">⌁</span>
              <span><strong>برای کار واقعی</strong><small>طراحی‌شده برای نیازهای شما</small></span>
            </div>
          </div>

          <div className="hero-visual" aria-label="تصویرسازی ابزارهای صنعتی">
            <div className="visual-grid" />
            <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
            <div className="visual-label"><span className="visual-dot" /> انتخاب هوشمند ابزار</div>
            <div className="tool-illustration">
              <div className="drill-handle" /><div className="drill-body"><div className="drill-grip" /><div className="drill-top" /><div className="drill-button" /><div className="drill-vent vent-one" /><div className="drill-vent vent-two" /><div className="drill-vent vent-three" /></div>
              <div className="drill-neck" /><div className="drill-chuck" /><div className="drill-bit" />
              <div className="drill-battery"><span /></div>
            </div>
            <div className="visual-sticker sticker-top"><span>۰۱</span><small>دقت در انتخاب</small></div>
            <div className="visual-sticker sticker-bottom"><span className="sticker-check">✓</span><span><strong>هر پروژه، یک راه‌حل</strong><small>ابزار مناسب کار شما</small></span></div>
            <div className="visual-caption">BUILT FOR THE WORK</div>
          </div>
          <div className="hero-side-note"><span>۰۱</span><span className="side-note-rule" /><span>ابزارآلات<br />حرفه‌ای</span></div>
        </div>
      </section>

      <section id="categories" className="categories-section section-pad">
        <div className="container">
          <div className="section-heading">
            <div><span className="eyebrow">دسته‌بندی‌های کاربردی</span><h2>از کجا شروع کنیم؟</h2><p>سریع‌تر به گروه ابزار موردنیازت برس.</p></div>
            <a href="/categories" className="text-link">همه دسته‌بندی‌ها <ArrowIcon /></a>
          </div>
          <div className="category-grid">
            {categories.map((category, index) => (
              <a href={`/categories/${index + 1}`} className="category-card lift" key={category.title}>
                <span className={`category-art art-${category.tone}`}><span className="art-number">۰{index + 1}</span><span className="art-icon">{category.icon}</span><span className="art-ring" /></span>
                <span className="category-info"><strong>{category.title}</strong><small>{category.detail}</small></span>
                <span className="category-arrow"><ArrowIcon /></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="featured-section section-pad">
        <div className="container">
          <div className="section-heading">
            <div><span className="eyebrow">منتخب‌های نمایشی</span><h2>چند ابزار برای شروع</h2><p>کاتالوگ نمونه برای دیدن مسیر انتخاب و افزودن به سبد خرید.</p></div>
            <a href="/products" className="text-link">مشاهده همه محصولات <ArrowIcon /></a>
          </div>
          <div className="product-grid">{demoProducts.slice(0, 3).map((product) => <ProductCard key={product.id} product={product} />)}</div>
          <p className="home-demo-note">محصولات، قیمت‌ها و موجودی‌های این نسخه نمونه‌اند و برای فروش واقعی استفاده نمی‌شوند.</p>
        </div>
      </section>

      <section className="principles-section">
        <div className="container principles">
          {benefits.map((benefit) => <article className="principle" key={benefit.title}><span className="principle-icon">{benefit.icon}</span><div><h3>{benefit.title}</h3><p>{benefit.text}</p></div></article>)}
        </div>
      </section>

      <section id="guide" className="guide-section section-pad">
        <div className="container guide-panel">
          <div className="guide-copy"><span className="eyebrow">قبل از خرید</span><h2>ابزار مناسب را<br />با شناخت انتخاب کن.</h2><p>قدرت، کاربرد، اندازه و شرایط استفاده را بشناس؛ انتخاب آگاهانه یعنی کار دقیق‌تر و هزینه منطقی‌تر.</p><a className="button-light" href="/articles">مطالعه راهنماها <ArrowIcon /></a></div>
          <div className="guide-details"><div className="guide-number">A<span>/</span>01</div><div className="guide-rule" /><div className="guide-tip"><span>01</span><div><strong>کاربرد را مشخص کن</strong><p>ابزار را بر اساس نوع کار و میزان استفاده انتخاب کن.</p></div></div><div className="guide-tip"><span>02</span><div><strong>مشخصات فنی را مقایسه کن</strong><p>توان، اندازه، دقت و لوازم جانبی را در نظر بگیر.</p></div></div><div className="guide-tip"><span>03</span><div><strong>ایمنی را جدی بگیر</strong><p>تجهیزات محافظتی متناسب با کار را فراموش نکن.</p></div></div></div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-main">
          <a href="/" className="brand footer-brand"><BrandMark light /><span className="brand-copy"><strong>بانک ابزار</strong><small>انتخاب حرفه‌ای، کار مطمئن</small></span></a>
          <p>ابزار مناسب، شروع یک کار درست است.</p>
          <div className="footer-links"><a href="#categories">دسته‌بندی‌ها</a><a href="#guide">راهنمای خرید</a><a href="/contact">تماس با ما</a></div>
        </div>
        <div className="container footer-bottom"><span>© بانک ابزار</span><span>طراحی‌شده برای انتخابی دقیق‌تر</span></div>
      </footer>
    </main>
  );
}
