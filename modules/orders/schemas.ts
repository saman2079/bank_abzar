import { z } from "zod";

export const placeOrderSchema = z.object({
  addressId: z.string().min(1, "آدرس تحویل را انتخاب کنید").max(40),
  note: z
    .string()
    .trim()
    .max(300, "توضیحات حداکثر ۳۰۰ کاراکتر است")
    .transform((value) => value || null),
});

export const orderIdSchema = z.string().min(1).max(40);

/** ساختار addressSnapshot ذخیره‌شده در سفارش؛ هنگام خواندن اعتبارسنجی می‌شود. */
export const addressSnapshotSchema = z.object({
  receiverName: z.string(),
  receiverPhone: z.string(),
  province: z.string(),
  city: z.string(),
  postalCode: z.string(),
  street: z.string(),
  plaque: z.string(),
  unit: z.string().nullable(),
});

export type AddressSnapshot = z.output<typeof addressSnapshotSchema>;
