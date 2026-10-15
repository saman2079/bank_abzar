export type DemoProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  brand: string;
  priceToman: number;
  oldPriceToman?: number;
  stock: number;
  description: string;
  icon: string;
  tone: "green" | "orange" | "blue" | "sand";
  specs: { label: string; value: string }[];
};

export const demoProducts: DemoProduct[] = [
  { id: "drill-18v", slug: "cordless-drill-18v", name: "دریل پیچ‌گوشتی شارژی ۱۸ ولت", category: "ابزار برقی", brand: "نمونه نمایشی", priceToman: 4850000, oldPriceToman: 5290000, stock: 8, description: "دریل شارژی برای نصب، مونتاژ و کارهای عمومی کارگاهی. مشخصات و قیمت این محصول صرفاً نمونه نمایشی هستند.", icon: "⚙", tone: "green", specs: [{ label: "ولتاژ", value: "۱۸ ولت" }, { label: "کاربری", value: "نصب و مونتاژ" }, { label: "وضعیت", value: "نمونه نمایشی" }] },
  { id: "angle-grinder", slug: "angle-grinder-115", name: "مینی فرز ۱۱۵ میلی‌متری", category: "ابزار برقی", brand: "نمونه نمایشی", priceToman: 2380000, stock: 5, description: "مینی فرز جمع‌وجور برای برش و سایش در کارهای متداول. مشخصات و قیمت این محصول صرفاً نمونه نمایشی هستند.", icon: "◈", tone: "orange", specs: [{ label: "قطر صفحه", value: "۱۱۵ میلی‌متر" }, { label: "کاربری", value: "برش و سایش" }, { label: "وضعیت", value: "نمونه نمایشی" }] },
  { id: "wrench-set", slug: "combination-wrench-set", name: "مجموعه آچار یکسر تخت و رینگ", category: "ابزار دستی", brand: "نمونه نمایشی", priceToman: 1760000, oldPriceToman: 1990000, stock: 12, description: "مجموعه آچار برای تعمیرات عمومی و استفاده در کارگاه. مشخصات و قیمت این محصول صرفاً نمونه نمایشی هستند.", icon: "⚒", tone: "blue", specs: [{ label: "نوع", value: "تخت و رینگ" }, { label: "کاربری", value: "تعمیرات عمومی" }, { label: "وضعیت", value: "نمونه نمایشی" }] },
  { id: "laser-level", slug: "laser-level-cross-line", name: "تراز لیزری خطی", category: "اندازه‌گیری", brand: "نمونه نمایشی", priceToman: 3150000, stock: 4, description: "تراز لیزری برای هم‌راستاسازی و نصب دقیق در پروژه‌ها. مشخصات و قیمت این محصول صرفاً نمونه نمایشی هستند.", icon: "⌖", tone: "sand", specs: [{ label: "نوع", value: "خطی" }, { label: "کاربری", value: "نصب و اندازه‌گیری" }, { label: "وضعیت", value: "نمونه نمایشی" }] },
  { id: "safety-glasses", slug: "protective-safety-glasses", name: "عینک ایمنی کارگاهی", category: "ایمنی و حفاظت", brand: "نمونه نمایشی", priceToman: 285000, stock: 25, description: "عینک محافظ برای کمک به حفاظت چشم در محیط کار متناسب با استاندارد محصول واقعی. این مورد نمونه نمایشی است.", icon: "◉", tone: "blue", specs: [{ label: "دسته", value: "تجهیزات ایمنی" }, { label: "کاربری", value: "حفاظت چشم" }, { label: "وضعیت", value: "نمونه نمایشی" }] },
  { id: "pliers", slug: "combination-pliers-8", name: "انبر دست ۸ اینچ", category: "ابزار دستی", brand: "نمونه نمایشی", priceToman: 640000, stock: 15, description: "انبر دست برای گرفتن و کارهای تعمیراتی روزمره. مشخصات و قیمت این محصول صرفاً نمونه نمایشی هستند.", icon: "⌁", tone: "orange", specs: [{ label: "اندازه", value: "۸ اینچ" }, { label: "کاربری", value: "تعمیرات عمومی" }, { label: "وضعیت", value: "نمونه نمایشی" }] },
];

export function formatToman(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value) + " تومان";
}
