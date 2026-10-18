import { z } from "zod";

/** پارامترهای بازگشت از زرین‌پال. هر چیز نامعتبر → رد می‌شود. */
export const callbackQuerySchema = z.object({
  Authority: z.string().regex(/^[A-Za-z0-9]{1,64}$/),
  Status: z.enum(["OK", "NOK"]),
});

export const startPaymentSchema = z.object({ orderId: z.string().min(1).max(40) });
