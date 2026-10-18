export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  unitPrice: number;
  quantity: number;
  /// موجودی لحظه‌ای؛ اگر کمتر از quantity باشد سفارش تا اصلاح سبد ممکن نیست
  stock: number;
  lineTotal: number;
};

export type Cart = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  hasIssues: boolean;
};
