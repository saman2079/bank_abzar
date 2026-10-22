import { z } from "zod";
import { ARTICLE_IMAGE_URL } from "@/lib/sanitize";
import { slugSchema } from "@/modules/catalog/admin/schemas";
import { ARTICLE_HTML_MAX, ARTICLE_STATUSES } from "./constants";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `حداکثر ${max} کاراکتر`)
    .transform((value) => value || null);

type EditorDoc = { type: "doc" } & Record<string, unknown>;

function parseDoc(text: string): EditorDoc | null {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof value === "object" && value !== null && !Array.isArray(value) && (value as { type?: unknown }).type === "doc") {
    return value as EditorDoc;
  }
  return null;
}

export const articleSchema = z
  .object({
    /** فقط هنگام ویرایش */
    id: z.string().max(40).optional(),
    title: z.string().trim().min(3, "عنوان را وارد کنید").max(150, "عنوان حداکثر ۱۵۰ کاراکتر"),
    slug: slugSchema,
    excerpt: z.string().trim().min(10, "خلاصه حداقل ۱۰ کاراکتر باشد").max(300, "خلاصه حداکثر ۳۰۰ کاراکتر"),
    contentHtml: z.string().max(ARTICLE_HTML_MAX, "متن مقاله بیش از حد طولانی است"),
    contentJson: z.string().max(1_000_000).transform((text, ctx) => {
      const doc = parseDoc(text);
      if (!doc) {
        ctx.addIssue({ code: "custom", message: "محتوای ادیتور نامعتبر است؛ صفحه را تازه کنید." });
        return z.NEVER;
      }
      return doc;
    }),
    coverUrl: z
      .string()
      .trim()
      .max(500)
      .refine((value) => value === "" || ARTICLE_IMAGE_URL.test(value), "آدرس تصویر شاخص نامعتبر است")
      .transform((value) => value || null),
    coverAlt: optionalText(160),
    status: z.enum(ARTICLE_STATUSES, { error: "وضعیت نامعتبر است" }),
    seoTitle: optionalText(70),
    seoDescription: optionalText(160),
  })
  .superRefine((value, ctx) => {
    if (value.coverUrl && !value.coverAlt) {
      ctx.addIssue({ code: "custom", path: ["coverAlt"], message: "برای تصویر شاخص، متن جایگزین (alt) را وارد کنید" });
    }
  });

export type ArticleInput = z.output<typeof articleSchema>;
