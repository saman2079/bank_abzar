import { z } from "zod";
import { ORDER_STATUSES } from "../constants";

export const changeStatusSchema = z.object({
  orderId: z.string().min(1).max(40),
  to: z.enum(ORDER_STATUSES, { error: "وضعیت جدید را انتخاب کنید" }),
  note: z
    .string()
    .trim()
    .max(300, "حداکثر ۳۰۰ کاراکتر")
    .transform((value) => value || null),
  restock: z.boolean(),
});
