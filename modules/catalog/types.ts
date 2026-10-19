export type ProductImageRef = { url: string; alt: string };

export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  /** قیمت نهایی به تومان */
  price: number;
  /** قیمت قبل از تخفیف به تومان */
  compareAtPrice?: number;
  rating: number;
  ratingCount: number;
  inStock: boolean;
  /** تصویر اصلی (اولین تصویر)؛ ندارد = placeholder */
  image?: ProductImageRef;
};

export type ProductSpec = {
  label: string;
  value: string;
};

export type ProductDetail = ProductSummary & {
  sku: string;
  categorySlug: string;
  /** موجودی انبار؛ `inStock` از روی آن محاسبه می‌شود */
  stock: number;
  shortDescription: string;
  description: string;
  specs: ProductSpec[];
  images: ProductImageRef[];
};

export type CategorySummary = {
  slug: string;
  name: string;
};
