"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAudit, diffFields } from "@/lib/audit";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db-errors";
import { formString, type ActionState } from "@/lib/form";
import { revokeUserSessions } from "@/lib/session";
import { hashPassword } from "@/modules/auth/password";
import { createUserSchema, resetPasswordSchema, updateUserSchema } from "./schemas";

export async function createUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = createUserSchema.safeParse({
    kind: formString(formData, "kind"),
    phone: formString(formData, "phone"),
    name: formString(formData, "name"),
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر است." };
  const data = parsed.data;

  let id: string;
  try {
    const user = await db.user.create({
      data:
        data.kind === "STAFF"
          ? {
              phone: data.phone,
              name: data.name,
              email: data.email,
              role: "STAFF",
              passwordHash: await hashPassword(data.password),
              phoneVerifiedAt: new Date(),
            }
          : { phone: data.phone, name: data.name, email: data.email, role: "CUSTOMER", createdByAdmin: true },
      select: { id: true },
    });
    id = user.id;
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "این شماره قبلاً ثبت شده است." };
    throw error;
  }

  await writeAudit({
    actor: admin,
    action: "user.create",
    entity: "user",
    entityId: id,
    diff: { phone: data.phone, role: data.kind },
  });
  revalidatePath("/admin/users");
  redirect(`/admin/users/${id}`);
}

export async function updateUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = updateUserSchema.safeParse({
    id: formString(formData, "id"),
    name: formString(formData, "name"),
    email: formString(formData, "email"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر است." };
  const { id, name, email, isActive } = parsed.data;

  if (id === admin.id && !isActive) return { error: "نمی‌توانید حساب خودتان را غیرفعال کنید." };

  const before = await db.user.findUnique({ where: { id }, select: { name: true, email: true, isActive: true } });
  if (!before) return { error: "کاربر پیدا نشد." };

  await db.user.update({ where: { id }, data: { name, email, isActive } });
  if (!isActive && before.isActive) await revokeUserSessions(id);

  const diff = diffFields(before, { name, email, isActive });
  if (Object.keys(diff).length > 0) {
    await writeAudit({ actor: admin, action: "user.update", entity: "user", entityId: id, diff });
  }
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
  return { ok: true };
}

export async function resetStaffPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = resetPasswordSchema.safeParse({
    id: formString(formData, "id"),
    password: formString(formData, "password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر است." };

  const target = await db.user.findUnique({ where: { id: parsed.data.id }, select: { role: true } });
  if (!target || target.role === "CUSTOMER") return { error: "فقط برای ادمین/کارمند قابل انجام است." };

  await db.user.update({ where: { id: parsed.data.id }, data: { passwordHash: await hashPassword(parsed.data.password) } });
  await revokeUserSessions(parsed.data.id);

  // رمز هرگز در لاگ نمی‌آید.
  await writeAudit({ actor: admin, action: "user.password_reset", entity: "user", entityId: parsed.data.id });
  return { ok: true };
}
