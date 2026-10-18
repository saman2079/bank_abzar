"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/dal";
import { formString, type ActionState } from "@/lib/form";
import { changeStatusSchema } from "./schemas";
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
