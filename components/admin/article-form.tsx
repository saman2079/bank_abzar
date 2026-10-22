"use client";

import { useActionState, useRef, useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { saveArticleAction } from "@/modules/articles/actions";
import { ARTICLE_STATUSES, ARTICLE_STATUS_LABELS, type ArticleStatus } from "@/modules/articles/constants";
import { ACCEPT_ATTRIBUTE } from "@/modules/media/constants";

export type ArticleFormInitial = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  contentJson: JSONContent;
  coverUrl: string | null;
  coverAlt: string | null;
  status: ArticleStatus;
  seoTitle: string | null;
  seoDescription: string | null;
};

const EMPTY_DOC: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

/** همه‌ی فیلدها controlled هستند تا با خطای اعتبارسنجی، متن نوشته‌شده (به‌خصوص مقاله) پاک نشود. */
export function ArticleForm({ article }: { article?: ArticleFormInitial }) {
  const [state, action] = useActionState(saveArticleAction, {});

  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [status, setStatus] = useState<ArticleStatus>(article?.status ?? "DRAFT");
  const [seoTitle, setSeoTitle] = useState(article?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(article?.seoDescription ?? "");
  const [coverUrl, setCoverUrl] = useState(article?.coverUrl ?? "");
  const [coverAlt, setCoverAlt] = useState(article?.coverAlt ?? "");
  const [html, setHtml] = useState(article?.contentHtml ?? "");
  const [json, setJson] = useState(JSON.stringify(article?.contentJson ?? EMPTY_DOC));

  const coverInput = useRef<HTMLInputElement>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  async function uploadCover(file: File) {
    setCoverBusy(true);
    setCoverError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/admin/articles/images", { method: "POST", body });
      const result = (await response.json()) as { ok: boolean; url?: string; error?: string };
      if (result.ok && result.url) setCoverUrl(result.url);
      else setCoverError(result.error ?? "آپلود ناموفق بود.");
    } catch {
      setCoverError("آپلود ناموفق بود؛ اتصال را بررسی کنید.");
    } finally {
      setCoverBusy(false);
      if (coverInput.current) coverInput.current.value = "";
    }
  }

  return (
    <form action={action} className="grid max-w-4xl gap-6">
      {article ? <input type="hidden" name="id" value={article.id} /> : null}
      <input type="hidden" name="contentHtml" value={html} />
      <input type="hidden" name="contentJson" value={json} />
      <input type="hidden" name="coverUrl" value={coverUrl} />

      <section className="grid gap-4 md:grid-cols-2">
        <Field label="عنوان مقاله" htmlFor="ar-title" className="md:col-span-2">
          <Input id="ar-title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={150} />
        </Field>
        <Field label="نامک (slug)" htmlFor="ar-slug" hint="لاتین و با خط تیره؛ مثل best-drill-guide. تغییر بعدی نامک، ریدایرکت ۳۰۱ می‌سازد.">
          <Input id="ar-slug" name="slug" dir="ltr" value={slug} onChange={(event) => setSlug(event.target.value)} required maxLength={80} />
        </Field>
        <Field label="وضعیت" htmlFor="ar-status">
          <Select id="ar-status" name="status" value={status} onChange={(event) => setStatus(event.target.value as ArticleStatus)}>
            {ARTICLE_STATUSES.map((item) => (
              <option key={item} value={item}>
                {ARTICLE_STATUS_LABELS[item]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="خلاصه" htmlFor="ar-excerpt" hint="در لیست مقاله‌ها و توضیح پیش‌فرض نتایج گوگل استفاده می‌شود." className="md:col-span-2">
          <Textarea id="ar-excerpt" name="excerpt" rows={3} value={excerpt} onChange={(event) => setExcerpt(event.target.value)} required maxLength={300} />
        </Field>
      </section>

      <section className="space-y-3">
        <h2 className="font-bold">تصویر شاخص</h2>
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- پیش‌نمایش پنل ادمین؛ آدرس از آپلود خودمان است
          <img src={coverUrl} alt={coverAlt || "پیش‌نمایش تصویر شاخص"} className="border-border max-h-56 rounded-xl border object-cover" />
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={coverBusy} onClick={() => coverInput.current?.click()}>
            {coverBusy ? "در حال آپلود…" : coverUrl ? "تغییر تصویر" : "انتخاب تصویر"}
          </Button>
          {coverUrl ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setCoverUrl("")}>
              حذف تصویر
            </Button>
          ) : null}
          <input
            ref={coverInput}
            type="file"
            accept={ACCEPT_ATTRIBUTE}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadCover(file);
            }}
          />
        </div>
        <FormMessage error={coverError ?? undefined} />
        {coverUrl ? (
          <Field label="متن جایگزین تصویر (alt)" htmlFor="ar-cover-alt">
            <Input id="ar-cover-alt" name="coverAlt" value={coverAlt} onChange={(event) => setCoverAlt(event.target.value)} maxLength={160} />
          </Field>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-bold">متن مقاله</h2>
        <RichTextEditor
          initialContent={article?.contentJson ?? EMPTY_DOC}
          onChange={(nextHtml, nextJson) => {
            setHtml(nextHtml);
            setJson(nextJson);
          }}
        />
      </section>

      <section className="grid gap-4">
        <h2 className="font-bold">سئو (اختیاری)</h2>
        <Field label="عنوان سئو" htmlFor="ar-seo-title" hint="خالی = عنوان مقاله. حداکثر ۷۰ کاراکتر.">
          <Input id="ar-seo-title" name="seoTitle" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} maxLength={70} />
        </Field>
        <Field label="توضیح سئو (meta description)" htmlFor="ar-seo-desc" hint="خالی = خلاصه‌ی مقاله. حداکثر ۱۶۰ کاراکتر.">
          <Textarea id="ar-seo-desc" name="seoDescription" rows={2} value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} maxLength={160} />
        </Field>
      </section>

      <div className="space-y-3">
        <FormMessage error={state.error} success={state.ok ? "ذخیره شد." : undefined} />
        <SubmitButton pendingLabel="در حال ذخیره…">{article ? "ذخیره تغییرات" : "ساخت مقاله"}</SubmitButton>
      </div>
    </form>
  );
}
