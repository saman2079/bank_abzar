"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/dal";
import { db } from "@/lib/db";
import { formString } from "@/lib/form";

function validId(value: string): string | null {
  return value.length > 0 && value.length <= 40 ? value : null;
}

/** بستن گفتگو (با پیام جدید بازدیدکننده خودکار دوباره باز می‌شود). */
export async function closeChatAction(formData: FormData): Promise<void> {
  await requireStaff();
  const id = validId(formString(formData, "id"));
  if (!id) return;

  await db.chatConversation.updateMany({ where: { id }, data: { status: "CLOSED", unreadByStaff: 0 } });
  revalidatePath("/admin/chat");
  redirect("/admin/chat");
}

/** حذف کامل گفتگو و پیام‌هایش (مثلاً اسپم). */
export async function deleteChatAction(formData: FormData): Promise<void> {
  await requireStaff();
  const id = validId(formString(formData, "id"));
  if (!id) return;

  await db.chatConversation.deleteMany({ where: { id } });
  revalidatePath("/admin/chat");
  redirect("/admin/chat");
}
