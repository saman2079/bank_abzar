"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/dal";
import { formString, type ActionState } from "@/lib/form";
import { toLatinDigits } from "@/lib/phone";
import { createManualOrder } from "./manual-service";
import { changeStatusSchema, manualOrderSchema } from "./schemas";
import { changeOrderStatus } from "./service";

export async function changeOrderStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = changeStatusSchema.safeParse({
    orderId: formString(formData, "orderId"),
    to: formString(formData, "to"),
    note: formString(formData, "note"),
    restock: formData.get("restock") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر است." };

  const result = await changeOrderStatus(staff, parsed.data);
  if (!result.ok) return { error: result.error };

  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function createManualOrderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  // ردیف‌های کالا به‌صورت فیلدهای تکراری productId / quantity می‌آیند.
  const productIds = formData.getAll("productId");
  const quantities = formData.getAll("quantity");
  const items = productIds.flatMap((productId, index) =>
    typeof productId === "string" && productId !== ""
      ? [{ productId, quantity: Number(toLatinDigits(String(quantities[index] ?? ""))) }]
      : [],
  );

  const parsed = manualOrderSchema.safeParse({
    phone: formString(formData, "phone"),
    customerName: formString(formData, "customerName"),
    items,
    address: {
      receiverName: formString(formData, "receiverName"),
      receiverPhone: formString(formData, "receiverPhone"),
      province: formString(formData, "province"),
      city: formString(formData, "city"),
      postalCode: formString(formData, "postalCode"),
      street: formString(formData, "street"),
      plaque: formString(formData, "plaque"),
      unit: formString(formData, "unit"),
    },
    paid: formString(formData, "payment") === "paid",
    paymentNote: formString(formData, "paymentNote"),
    note: formString(formData, "note"),
    shippingCost: formString(formData, "shippingCost"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر است." };

  const result = await createManualOrder(staff, parsed.data);
  if (!result.ok) return { error: result.error };

  revalidatePath("/admin/orders");
  redirect(`/admin/orders/${result.orderId}`);
}
