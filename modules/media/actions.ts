"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { CACHE_TAGS } from "@/lib/cache";
import { requireStaff } from "@/lib/dal";
import type { ActionState } from "@/lib/form";
import { ALT_MAX, ALT_MIN } from "./constants";
import { deleteProductImage, moveProductImage, updateImageAlt, type MediaResult } from "./service";

const idSchema = z.string().min(1).max(40);
const altSchema = z.string().trim().min(ALT_MIN, "متن جایگزین (alt) را وارد کنید").max(ALT_MAX, `حداکثر ${ALT_MAX} کاراکتر`);

function finish(result: MediaResult<{ slug: string }>): ActionState {
  if (!result.ok) return { error: result.error };

  updateTag(CACHE_TAGS.catalog);
  updateTag(CACHE_TAGS.product(result.data.slug));
  return { ok: true };
}

export async function updateImageAltAction(imageId: string, alt: string): Promise<ActionState> {
  const staff = await requireStaff();

  const id = idSchema.safeParse(imageId);
  const text = altSchema.safeParse(alt);
  if (!id.success) return { error: "تصویر نامعتبر است." };
  if (!text.success) return { error: text.error.issues[0]?.message ?? "ورودی نامعتبر است." };

  return finish(await updateImageAlt(staff, id.data, text.data));
}

export async function deleteImageAction(imageId: string): Promise<ActionState> {
  const staff = await requireStaff();

  const id = idSchema.safeParse(imageId);
  if (!id.success) return { error: "تصویر نامعتبر است." };

  return finish(await deleteProductImage(staff, id.data));
}

export async function moveImageAction(imageId: string, direction: "earlier" | "later"): Promise<ActionState> {
  const staff = await requireStaff();

  const id = idSchema.safeParse(imageId);
  if (!id.success || (direction !== "earlier" && direction !== "later")) return { error: "درخواست نامعتبر است." };

  return finish(await moveProductImage(staff, id.data, direction));
}
