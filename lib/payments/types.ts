export type PaymentRequestInput = {
  /// تومان؛ آداپتر خودش به واحد درگاه تبدیل می‌کند
  amountToman: number;
  callbackUrl: string;
  description: string;
  mobile?: string;
};

export type PaymentRequestResult = { authority: string; redirectUrl: string };

export type PaymentVerifyResult =
  | { ok: true; refId: string; cardPan: string | null; alreadyVerified: boolean }
  | { ok: false; code: number | null; message: string };

/**
 * درگاه پرداخت. `request` و خطای انتقال `verify` (شبکه/۵xx) throw می‌کنند؛
 * ولی «تراکنش ناموفق» در verify به‌صورت `{ ok: false }` برمی‌گردد (نتیجه‌ی قطعی).
 */
export interface PaymentGateway {
  readonly name: string;
  request(input: PaymentRequestInput): Promise<PaymentRequestResult>;
  verify(input: { authority: string; amountToman: number }): Promise<PaymentVerifyResult>;
}
