export type OrderStatus =
  | "pending_payment"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

const allowedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_payment: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return allowedTransitions[from].includes(to);
}

export function assertOrderTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransitionOrder(from, to)) {
    throw new Error(`انتقال وضعیت سفارش از «${from}» به «${to}» مجاز نیست.`);
  }
}

export function assertPaymentCanBeMarkedPaid(
  current: PaymentStatus,
  verifiedByProvider: boolean,
  authorizedCashOnDeliveryConfirmation: boolean,
): void {
  if (current === "paid") return;
  if (!verifiedByProvider && !authorizedCashOnDeliveryConfirmation) {
    throw new Error("پرداخت فقط پس از تأیید درگاه یا تأیید مجاز پرداخت در محل قابل ثبت است.");
  }
  if (current === "refunded") {
    throw new Error("وضعیت پرداخت بازپرداخت‌شده قابل تغییر مستقیم نیست.");
  }
}

export interface StockState {
  onHand: number;
  reserved: number;
}

export function availableStock(stock: StockState): number {
  assertValidStock(stock);
  return stock.onHand - stock.reserved;
}

export function assertValidStock(stock: StockState): void {
  if (!Number.isSafeInteger(stock.onHand) || !Number.isSafeInteger(stock.reserved)) {
    throw new Error("موجودی باید عدد صحیح امن باشد.");
  }
  if (stock.onHand < 0 || stock.reserved < 0 || stock.reserved > stock.onHand) {
    throw new Error("وضعیت موجودی نامعتبر است.");
  }
}

export function reserveStock(stock: StockState, quantity: number): StockState {
  assertValidStock(stock);
  assertQuantity(quantity);
  if (availableStock(stock) < quantity) {
    throw new Error("موجودی کافی برای این تعداد وجود ندارد.");
  }
  return { onHand: stock.onHand, reserved: stock.reserved + quantity };
}

export function releaseStock(stock: StockState, quantity: number): StockState {
  assertValidStock(stock);
  assertQuantity(quantity);
  if (stock.reserved < quantity) {
    throw new Error("مقدار آزادسازی از موجودی رزروشده بیشتر است.");
  }
  return { onHand: stock.onHand, reserved: stock.reserved - quantity };
}

export function commitReservedSale(stock: StockState, quantity: number): StockState {
  assertValidStock(stock);
  assertQuantity(quantity);
  if (stock.reserved < quantity || stock.onHand < quantity) {
    throw new Error("رزرو کافی برای نهایی‌کردن فروش وجود ندارد.");
  }
  return { onHand: stock.onHand - quantity, reserved: stock.reserved - quantity };
}

export function adjustOnHand(stock: StockState, delta: number): StockState {
  assertValidStock(stock);
  if (!Number.isSafeInteger(delta) || delta === 0) {
    throw new Error("مقدار اصلاح موجودی باید عدد صحیح غیرصفر باشد.");
  }
  const next = { onHand: stock.onHand + delta, reserved: stock.reserved };
  assertValidStock(next);
  return next;
}

export function calculateOrderTotals(input: {
  subtotalToman: number;
  discountToman?: number;
  shippingToman?: number;
}): { subtotalToman: number; discountToman: number; shippingToman: number; totalToman: number } {
  const subtotalToman = input.subtotalToman;
  const discountToman = input.discountToman ?? 0;
  const shippingToman = input.shippingToman ?? 0;
  for (const amount of [subtotalToman, discountToman, shippingToman]) {
    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new Error("مبالغ باید عدد صحیح نامنفی و در محدوده امن باشند.");
    }
  }
  if (discountToman > subtotalToman) {
    throw new Error("مبلغ تخفیف نمی‌تواند از مبلغ کالاها بیشتر باشد.");
  }
  return {
    subtotalToman,
    discountToman,
    shippingToman,
    totalToman: subtotalToman - discountToman + shippingToman,
  };
}

function assertQuantity(quantity: number): void {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new Error("تعداد باید عدد صحیح بین ۱ تا ۹۹ باشد.");
  }
}
