import { describe, expect, it } from "vitest";
import { htmlToText, readingMinutes, sanitizeArticleHtml } from "@/lib/sanitize";

describe("sanitizeArticleHtml (XSS)", () => {
  it("اسکریپت و iframe حذف می‌شوند", () => {
    const out = sanitizeArticleHtml('<p>سلام</p><script>alert(1)</script><iframe src="https://evil.com"></iframe>');
    expect(out).toContain("سلام");
    expect(out).not.toContain("<script");
    expect(out).not.toContain("alert(1)");
    expect(out).not.toContain("<iframe");
  });

  it("رویدادهای inline حذف می‌شوند", () => {
    const out = sanitizeArticleHtml('<p onclick="x()" onmouseover="y()">متن</p>');
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("onmouseover");
  });

  it("پروتکل‌های خطرناک در لینک حذف می‌شوند", () => {
    expect(sanitizeArticleHtml('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript:");
    expect(sanitizeArticleHtml('<a href="data:text/html;base64,AAAA">x</a>')).not.toContain("data:");
  });

  it("لینک بیرونی nofollow و تب جدید می‌گیرد", () => {
    const out = sanitizeArticleHtml('<a href="https://example.com/x">x</a>');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
    expect(out).toContain('target="_blank"');
  });

  it("لینک داخلی و mailto حفظ می‌شود", () => {
    expect(sanitizeArticleHtml('<a href="/products/drill">x</a>')).toContain('href="/products/drill"');
    expect(sanitizeArticleHtml('<a href="mailto:a@b.com">x</a>')).toContain("mailto:a@b.com");
  });

  it("تصویر فقط از آپلود خودمان", () => {
    expect(sanitizeArticleHtml('<img src="https://evil.com/a.png" alt="x">')).not.toContain("<img");
    expect(sanitizeArticleHtml('<img src="//evil.com/a.png" alt="x">')).not.toContain("<img");
    expect(sanitizeArticleHtml('<img src="/uploads/articles/a.webp" alt="x">')).toContain("/uploads/articles/a.webp");
    expect(sanitizeArticleHtml('<img src="https://abc123.public.blob.vercel-storage.com/a.webp" alt="x">')).toContain("<img");
  });

  it("فقط text-align از style مجاز است", () => {
    const out = sanitizeArticleHtml('<p style="text-align: center; position: fixed; background: url(x)">x</p>');
    expect(out).toContain("text-align");
    expect(out).not.toContain("position");
    expect(out).not.toContain("url(");
  });

  it("ساختارهای مجاز (جدول، لیست، عنوان) حفظ می‌شوند", () => {
    const out = sanitizeArticleHtml("<h2>عنوان</h2><ul><li>الف</li></ul><table><tbody><tr><th>الف</th><td>ب</td></tr></tbody></table>");
    for (const tag of ["<h2>", "<ul>", "<li>", "<table>", "<th>", "<td>"]) expect(out).toContain(tag);
  });
});

describe("htmlToText / readingMinutes", () => {
  it("تگ‌ها را حذف می‌کند", () => {
    expect(htmlToText("<p>سلام <strong>دنیا</strong></p>")).toBe("سلام دنیا");
  });

  it("زمان مطالعه حداقل ۱ دقیقه", () => {
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes("یک دو سه")).toBe(1);
    expect(readingMinutes(Array(400).fill("کلمه").join(" "))).toBe(3);
  });
});
