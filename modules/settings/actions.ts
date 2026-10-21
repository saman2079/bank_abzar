"use server";

import { updateTag } from "next/cache";
import { diffFields, writeAudit } from "@/lib/audit";
import { CACHE_TAGS } from "@/lib/cache";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { formString, type ActionState } from "@/lib/form";
import { SETTING_KEYS } from "./constants";
import { getShippingSettings } from "./queries";
import { shippingFormSchema } from "./schemas";

/** فقط ادمین (نه کارمند): هزینه‌ی ارسال روی مبلغ همه‌ی سفارش‌های بعدی اثر می‌گذارد. */
export async function saveShippingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = shippingFormSchema.safeParse({
    flatCost: formString(formData, "flatCost"),
    freeOver: formString(formData, "freeOver"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر است." };

  const before = await getShippingSettings();
  const value = parsed.data;

  await db.setting.upsert({
    where: { key: SETTING_KEYS.shipping },
    update: { value, updatedById: admin.id },
    create: { key: SETTING_KEYS.shipping, value, updatedById: admin.id },
  });
  await writeAudit({
    actor: admin,
    action: "settings.shipping",
    entity: "setting",
    entityId: SETTING_KEYS.shipping,
    diff: diffFields(before, value),
  });

  updateTag(CACHE_TAGS.settings);
  return { ok: true };
}
