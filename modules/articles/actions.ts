"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { CACHE_TAGS } from "@/lib/cache";
import { requireStaff } from "@/lib/dal";
import { formString, type ActionState } from "@/lib/form";
import { rateLimit } from "@/lib/rate-limit";
import { articleSchema } from "./schemas";
import { saveArticle } from "./service";

export async function saveArticleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = articleSchema.safeParse({
    id: formString(formData, "id") || undefined,
    title: formString(formData, "title"),
    slug: formString(formData, "slug"),
    excerpt: formString(formData, "excerpt"),
    contentHtml: formString(formData, "contentHtml"),
    contentJson: formString(formData, "contentJson"),
    coverUrl: formString(formData, "coverUrl"),
    coverAlt: formString(formData, "coverAlt"),
    status: formString(formData, "status"),
    seoTitle: formString(formData, "seoTitle"),
    seoDescription: formString(formData, "seoDescription"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر است." };

  const limit = await rateLimit(`article:save:${staff.id}`, 60, 60);
  if (!limit.ok) return { error: "ذخیره‌های پشت‌سرهم زیاد است؛ کمی صبر کنید." };

  const result = await saveArticle(staff, parsed.data);
  if (!result.ok) return { error: result.error };

  updateTag(CACHE_TAGS.articles);
  updateTag(CACHE_TAGS.article(result.slug));
  if (result.oldSlug) updateTag(CACHE_TAGS.article(result.oldSlug));
  revalidatePath("/admin/articles");

  if (!parsed.data.id) redirect(`/admin/articles/${result.id}`);
  return { ok: true };
}
