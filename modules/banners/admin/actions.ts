"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { diffFields, writeAudit } from "@/lib/audit";
import { CACHE_TAGS } from "@/lib/cache";
import { requireStaff } from "@/lib/dal";
import { db } from "@/lib/db";
import { formString, type ActionState } from "@/lib/form";
import { bannerIdSchema, bannerSchema } from "../schemas";

function invalidate() {
  updateTag(CACHE_TAGS.banners);
}

export async function saveBannerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = bannerSchema.safeParse({
    title: formString(formData, "title"),
    subtitle: formString(formData, "subtitle"),
    ctaLabel: formString(formData, "ctaLabel"),
    linkUrl: formString(formData, "linkUrl"),
    imageUrl: formString(formData, "imageUrl"),
    mobileImageUrl: formString(formData, "mobileImageUrl"),
    imageAlt: formString(formData, "imageAlt"),
    isActive: formString(formData, "isActive") === "on",
    startsAt: formString(formData, "startsAt"),
    endsAt: formString(formData, "endsAt"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر است." };

  const id = formString(formData, "id");

  if (id) {
    const before = await db.banner.findUnique({ where: { id } });
    if (!before) return { error: "بنر پیدا نشد." };

    await db.$transaction(async (tx) => {
      await tx.banner.update({ where: { id }, data: parsed.data });
      await writeAudit(
        { actor: staff, action: "banner.update", entity: "banner", entityId: id, diff: diffFields(before, parsed.data) },
        tx,
      );
    });
    invalidate();
    return { ok: true };
  }

  // بنر جدید ته صف اضافه می‌شود.
  const last = await db.banner.aggregate({ _max: { sortOrder: true } });
  const created = await db.$transaction(async (tx) => {
    const row = await tx.banner.create({
      data: { ...parsed.data, sortOrder: (last._max.sortOrder ?? 0) + 1 },
      select: { id: true },
    });
    await writeAudit(
      { actor: staff, action: "banner.create", entity: "banner", entityId: row.id, diff: { title: parsed.data.title } },
      tx,
    );
    return row;
  });
  invalidate();
  redirect(`/admin/banners/${created.id}`);
}

/** روشن/خاموش کردن سریع از لیست (برای روزهایی که فقط یک بنر می‌خواهید). */
export async function toggleBannerAction(formData: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = bannerIdSchema.safeParse(formString(formData, "id"));
  if (!id.success) return;

  const banner = await db.banner.findUnique({ where: { id: id.data }, select: { isActive: true } });
  if (!banner) return;

  await db.$transaction(async (tx) => {
    await tx.banner.update({ where: { id: id.data }, data: { isActive: !banner.isActive } });
    await writeAudit(
      {
        actor: staff,
        action: "banner.toggle",
        entity: "banner",
        entityId: id.data,
        diff: { isActive: { from: banner.isActive, to: !banner.isActive } },
      },
      tx,
    );
  });
  invalidate();
}

/** جابه‌جایی ترتیب با بالا/پایین: ترتیب همه‌ی بنرها دوباره یکتا و پشت‌سرهم نوشته می‌شود. */
export async function moveBannerAction(formData: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = bannerIdSchema.safeParse(formString(formData, "id"));
  const direction = formString(formData, "direction");
  if (!id.success || (direction !== "up" && direction !== "down")) return;

  await db.$transaction(async (tx) => {
    const rows = await tx.banner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true } });
    const index = rows.findIndex((row) => row.id === id.data);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || target < 0 || target >= rows.length) return;

    const ids = rows.map((row) => row.id);
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    await Promise.all(ids.map((bannerId, order) => tx.banner.update({ where: { id: bannerId }, data: { sortOrder: order } })));
    await writeAudit({ actor: staff, action: "banner.move", entity: "banner", entityId: id.data, diff: { direction } }, tx);
  });
  invalidate();
}

export async function deleteBannerAction(formData: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = bannerIdSchema.safeParse(formString(formData, "id"));
  if (!id.success) return;

  const banner = await db.banner.findUnique({ where: { id: id.data }, select: { title: true } });
  if (!banner) redirect("/admin/banners");

  await db.$transaction(async (tx) => {
    await tx.banner.delete({ where: { id: id.data } });
    await writeAudit(
      { actor: staff, action: "banner.delete", entity: "banner", entityId: id.data, diff: { title: banner.title } },
      tx,
    );
  });
  invalidate();
  redirect("/admin/banners");
}
