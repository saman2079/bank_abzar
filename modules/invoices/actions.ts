"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { CACHE_TAGS } from "@/lib/cache";
import { requireStaff } from "@/lib/dal";
import { formString, type ActionState } from "@/lib/form";
import { rateLimit } from "@/lib/rate-limit";
import { cancelInvoiceSchema, finalizeInvoiceSchema, invoiceFormSchema } from "./schemas";
import { cancelInvoice, finalizeInvoice, saveInvoice } from "./service";

/** موجودی عوض شده؛ کش کاتالوگ و صفحه‌ی محصولاتِ درگیر بی‌اعتبار می‌شود (فقط داخل Server Action مجاز است). */
function invalidateStock(slugs: string[]) {
  if (slugs.length === 0) return;
  updateTag(CACHE_TAGS.catalog);
  for (const slug of slugs) updateTag(CACHE_TAGS.product(slug));
}

export async function saveInvoiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  // ردیف‌ها به‌صورت فیلدهای تکراری productId / quantity / unitPrice / discount می‌آیند.
  const productIds = formData.getAll("productId");
  const quantities = formData.getAll("quantity");
  const unitPrices = formData.getAll("unitPrice");
  const discounts = formData.getAll("lineDiscount");
  const text = (value: FormDataEntryValue | undefined) => (typeof value === "string" ? value : "");

  const lines = productIds.flatMap((productId, index) =>
    typeof productId === "string" && productId !== ""
      ? [
          {
            productId,
            quantity: text(quantities[index]),
            unitPrice: text(unitPrices[index]),
            discount: text(discounts[index]).trim() === "" ? "0" : text(discounts[index]),
          },
        ]
      : [],
  );

  const blank = (key: string, fallback: string) => (formString(formData, key).trim() === "" ? fallback : formString(formData, key));

  const parsed = invoiceFormSchema.safeParse({
    invoiceId: formString(formData, "invoiceId") || undefined,
    mode: formString(formData, "mode"),
    customerName: formString(formData, "customerName"),
    customerPhone: formString(formData, "customerPhone"),
    customerAddress: formString(formData, "customerAddress"),
    lines,
    discount: blank("discount", "0"),
    taxPercent: blank("taxPercent", "0"),
    shippingCost: blank("shippingCost", "0"),
    validDays: formString(formData, "validDays"),
    note: formString(formData, "note"),
    paymentNote: formString(formData, "paymentNote"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر است." };

  const limit = await rateLimit(`invoice:save:${staff.id}`, 60, 60);
  if (!limit.ok) return { error: "درخواست‌ها پشت‌سرهم زیاد است؛ کمی صبر کنید." };

  const result = await saveInvoice(staff, parsed.data);
  if (!result.ok) return { error: result.error };

  invalidateStock(result.slugs);
  revalidatePath("/admin/invoices");
  revalidatePath("/admin/inventory");
  redirect(`/admin/invoices/${result.invoiceId}`);
}

export async function finalizeInvoiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = finalizeInvoiceSchema.safeParse({
    invoiceId: formString(formData, "invoiceId"),
    paymentNote: formString(formData, "paymentNote"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر است." };

  const result = await finalizeInvoice(staff, parsed.data);
  if (!result.ok) return { error: result.error };

  invalidateStock(result.slugs);
  revalidatePath(`/admin/invoices/${result.invoiceId}`);
  revalidatePath("/admin/invoices");
  revalidatePath("/admin/inventory");
  return { ok: true };
}

export async function cancelInvoiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = cancelInvoiceSchema.safeParse({
    invoiceId: formString(formData, "invoiceId"),
    reason: formString(formData, "reason"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر است." };

  const result = await cancelInvoice(staff, parsed.data);
  if (!result.ok) return { error: result.error };

  invalidateStock(result.slugs);
  revalidatePath(`/admin/invoices/${result.invoiceId}`);
  revalidatePath("/admin/invoices");
  revalidatePath("/admin/inventory");
  return { ok: true };
}
