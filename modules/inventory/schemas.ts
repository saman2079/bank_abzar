import { z } from "zod";
import { toLatinDigits } from "@/lib/phone";
import { ADJUST_MODES } from "./constants";

export const adjustStockSchema = z
  .object({
    productId: z.string().min(1).max(40),
    mode: z.enum(ADJUST_MODES, { error: "نوع تغییر را انتخاب کنید" }),
    quantity: z
      .string()
      .transform((value) => Number(toLatinDigits(value).replace(/[,٬\s]/g, "")))
      .pipe(z.number({ error: "تعداد را به عدد وارد کنید" }).int("تعداد باید عدد صحیح باشد").min(0).max(1_000_000)),
    note: z.string().trim().min(3, "دلیل تغییر را بنویسید (حداقل ۳ کاراکتر)").max(200),
  })
  .superRefine((value, ctx) => {
    if (value.mode !== "SET" && value.quantity < 1) {
      ctx.addIssue({ code: "custom", path: ["quantity"], message: "تعداد باید حداقل ۱ باشد" });
    }
  });
