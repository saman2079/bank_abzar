"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { formString } from "@/lib/form";
import { MAX_ADDRESSES } from "./constants";
import { addressSchema, idSchema, profileSchema } from "./schemas";
import type { UserFormState } from "./types";

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "ورودی نامعتبر است.";
}

export async function updateProfileAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const user = await requireUser("/account");

  const parsed = profileSchema.safeParse({
    name: formString(formData, "name"),
    email: formString(formData, "email"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  await db.user.update({ where: { id: user.id }, data: parsed.data });
  revalidatePath("/account");

  return { ok: true };
}

export async function saveAddressAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const user = await requireUser("/account/addresses");

  const parsed = addressSchema.safeParse({
    receiverName: formString(formData, "receiverName"),
    receiverPhone: formString(formData, "receiverPhone"),
    province: formString(formData, "province"),
    city: formString(formData, "city"),
    postalCode: formString(formData, "postalCode"),
    street: formString(formData, "street"),
    plaque: formString(formData, "plaque"),
    unit: formString(formData, "unit"),
    isDefault: formData.get("isDefault") === "on",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { isDefault, ...fields } = parsed.data;
  const id = formString(formData, "id");

  if (id) {
    // مالکیت: آدرس باید متعلق به همین کاربر باشد.
    const owned = await db.address.findFirst({ where: { id, userId: user.id }, select: { id: true } });
    if (!owned) return { error: "آدرس پیدا نشد." };

    await db.$transaction(async (tx) => {
      if (isDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      await tx.address.update({ where: { id }, data: { ...fields, ...(isDefault && { isDefault: true }) } });
    });
  } else {
    const result = await db.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId: user.id } });
      if (count >= MAX_ADDRESSES) return "limit" as const;

      const makeDefault = isDefault || count === 0;
      if (makeDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      await tx.address.create({ data: { ...fields, userId: user.id, isDefault: makeDefault } });
      return "ok" as const;
    });
    if (result === "limit") return { error: `حداکثر ${MAX_ADDRESSES} آدرس می‌توانید ثبت کنید.` };
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true };
}

export async function deleteAddressAction(formData: FormData): Promise<void> {
  const user = await requireUser("/account/addresses");
  const id = idSchema.safeParse(formString(formData, "id"));
  if (!id.success) return;

  await db.$transaction(async (tx) => {
    const removed = await tx.address.deleteMany({ where: { id: id.data, userId: user.id, isDefault: false } });
    if (removed.count > 0) return;

    // پیش‌فرض حذف شد → جدیدترین آدرس باقی‌مانده پیش‌فرض می‌شود.
    const wasDefault = await tx.address.deleteMany({ where: { id: id.data, userId: user.id, isDefault: true } });
    if (wasDefault.count === 0) return;

    const next = await tx.address.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
  });

  revalidatePath("/account/addresses");
}

export async function setDefaultAddressAction(formData: FormData): Promise<void> {
  const user = await requireUser("/account/addresses");
  const id = idSchema.safeParse(formString(formData, "id"));
  if (!id.success) return;

  await db.$transaction(async (tx) => {
    const owned = await tx.address.findFirst({ where: { id: id.data, userId: user.id }, select: { id: true } });
    if (!owned) return;

    await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    await tx.address.update({ where: { id: owned.id }, data: { isDefault: true } });
  });

  revalidatePath("/account/addresses");
}
