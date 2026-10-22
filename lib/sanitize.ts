import "server-only";
import sanitizeHtml from "sanitize-html";

/** تصویر فقط از آپلود خودمان (درایور local یا Vercel Blob) پذیرفته می‌شود، نه هر آدرس دلخواه. */
export const ARTICLE_IMAGE_URL = /^(\/uploads\/|https:\/\/[a-z0-9.-]+\.public\.blob\.vercel-storage\.com\/)/;

/**
 * پاک‌سازی HTML مقاله (فهرست سفید). هر چیزی خارج از فهرست حذف می‌شود:
 * اسکریپت، iframe، رویدادها (onerror…)، style به‌جز text-align، پروتکل‌های javascript:/data: و تصویر از منبع بیرونی.
 * لینک بیرونی همیشه `nofollow noopener` و تب جدید می‌گیرد.
 */
export function sanitizeArticleHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      "p", "br", "h2", "h3", "h4", "strong", "em", "u", "s", "code", "pre", "blockquote", "hr",
      "ul", "ol", "li", "a", "img", "table", "thead", "tbody", "tr", "th", "td",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title"],
      p: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedStyles: { "*": { "text-align": [/^(left|right|center|justify)$/] } },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        return /^https?:\/\//i.test(href)
          ? { tagName, attribs: { href, target: "_blank", rel: "noopener noreferrer nofollow" } }
          : { tagName, attribs: { href } };
      },
    },
    exclusiveFilter: (frame) => frame.tag === "img" && !ARTICLE_IMAGE_URL.test(frame.attribs.src ?? ""),
  });
}

/** متن ساده‌ی HTML (برای طول متن و زمان مطالعه). */
export function htmlToText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
}

/** زمان مطالعه به دقیقه (حدود ۱۸۰ کلمه در دقیقه برای فارسی)، حداقل ۱. */
export function readingMinutes(text: string): number {
  const words = text === "" ? 0 : text.split(" ").length;
  return Math.max(1, Math.ceil(words / 180));
}
