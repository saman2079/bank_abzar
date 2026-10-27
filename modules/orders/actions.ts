"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { formString } from "@/lib/form";
import { rateLimit } from "@/lib/rate-limit";
import { orderIdSchema, placeOrderSchema } from "./schemas";
import { cancelPendingOrder, placeOrder } from "./service";

export type PlaceOrderState = { error?: string };

export async function placeOrderAction(_prev: PlaceOrderState, formData: FormData): Promise<PlaceOrderState> {
  const user = await requireUser("/checkout");

  const parsed = placeOrderSchema.safeParse({
    addressId: formString(formData, "addressId"),
    paymentMethod: formString(formData, "paymentMethod") || "ONLINE",
    note: formString(formData, "note"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر است." };

  const limit = await rateLimit(`order:place:${user.id}`, 10, 600);
  if (!limit.ok) return { error: "تعداد تلاش برای ثبت سفارش زیاد است؛ چند دقیقه بعد دوباره امتحان کنید." };

  const result = await placeOrder(user.id, parsed.data);
  if (!result.ok) return { error: result.error };

  revalidatePath("/", "layout");
  redirect(`/account/orders/${result.orderId}`);
}

export async function cancelMyOrderAction(formData: FormData): Promise<void> {
  const user = await requireUser("/account/orders");
  const id = orderIdSchema.safeParse(formString(formData, "id"));
  if (!id.success) return;

  await cancelPendingOrder(id.data, { actorId: user.id, note: "لغو توسط مشتری", ownerId: user.id });
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${id.data}`);
}
