import { describe, expect, it } from "vitest";
import { discountPercent } from "@/lib/format";
import { calcInvoiceTotals, formatInvoiceNumber, lineTotal } from "@/modules/invoices/constants";
import { calcShipping, formatOrderNumber } from "@/modules/orders/constants";

describe("calcShipping", () => {
  const settings = { flatCost: 80_000, freeOver: 5_000_000 };

  it("زیر حد رایگان هزینه‌ی ثابت می‌گیرد", () => {
    expect(calcShipping(1_000_000, settings)).toBe(80_000);
    expect(calcShipping(4_999_999, settings)).toBe(80_000);
  });

  it("در حد رایگان و بالاتر رایگان است", () => {
    expect(calcShipping(5_000_000, settings)).toBe(0);
    expect(calcShipping(9_000_000, settings)).toBe(0);
  });

  it("freeOver = 0 یعنی همیشه رایگان", () => {
    expect(calcShipping(0, { flatCost: 80_000, freeOver: 0 })).toBe(0);
  });
});

describe("discountPercent", () => {
  it("درصد تخفیف را گرد می‌کند", () => {
    expect(discountPercent(750, 1000)).toBe(25);
    expect(discountPercent(667, 1000)).toBe(33);
  });

  it("بدون قیمت قبل یا قیمت قبل ≤ قیمت فعلی → ۰", () => {
    expect(discountPercent(1000)).toBe(0);
    expect(discountPercent(1000, 1000)).toBe(0);
    expect(discountPercent(1000, 900)).toBe(0);
  });
});

describe("شماره‌ی سفارش/فاکتور", () => {
  it("از ۱۰۰۱ شروع می‌شود", () => {
    expect(formatOrderNumber(1)).toBe("1001");
    expect(formatInvoiceNumber(1)).toBe("1001");
  });
});

describe("calcInvoiceTotals", () => {
  const lines = [
    { unitPrice: 1_250_000, quantity: 2, discount: 100_000 },
    { unitPrice: 333_333, quantity: 3, discount: 0 },
  ];

  it("مبلغ ردیف بعد از تخفیف ردیف", () => {
    expect(lines.map(lineTotal)).toEqual([2_400_000, 999_999]);
  });

  it("تخفیف کل، مالیات روی مبلغ بعد از تخفیف (گرد) و ارسال خارج از مالیات", () => {
    expect(calcInvoiceTotals(lines, { discount: 200_000, taxPercent: 10, shippingCost: 80_000 })).toEqual({
      subtotal: 3_399_999,
      discount: 200_000,
      taxAmount: 320_000,
      total: 3_599_999,
    });
  });

  it("تخفیف کل هرگز از جمع بیشتر نمی‌شود و مجموع منفی نمی‌شود", () => {
    const totals = calcInvoiceTotals(lines, { discount: 99_999_999, taxPercent: 9, shippingCost: 0 });
    expect(totals.discount).toBe(totals.subtotal);
    expect(totals.total).toBe(0);
  });

  it("تخفیف ردیف بزرگ‌تر از مبلغ ردیف، ردیف را منفی نمی‌کند", () => {
    expect(lineTotal({ unitPrice: 100, quantity: 1, discount: 500 })).toBe(0);
  });

  it("بدون مالیات و ارسال", () => {
    expect(calcInvoiceTotals(lines, { discount: 0, taxPercent: 0, shippingCost: 0 }).total).toBe(3_399_999);
  });
});
