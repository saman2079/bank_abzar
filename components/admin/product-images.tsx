"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ImagePlus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteImageAction, moveImageAction, updateImageAltAction } from "@/modules/media/actions";
import {
  ACCEPT_ATTRIBUTE,
  MAX_FILE_BYTES,
  MAX_FILES_PER_REQUEST,
  MAX_IMAGES_PER_PRODUCT,
} from "@/modules/media/constants";

const ALLOWED_TYPES = ACCEPT_ATTRIBUTE.split(",");

/** بررسی سمت کلاینت فقط برای UX؛ اعتبارسنجی واقعی (نوع از محتوا، حجم، تعداد) سمت سرور است. */
function validateFiles(files: File[], existingCount: number): string | null {
  if (files.length + existingCount > MAX_IMAGES_PER_PRODUCT) return `هر محصول حداکثر ${MAX_IMAGES_PER_PRODUCT} تصویر دارد.`;
  if (files.length > MAX_FILES_PER_REQUEST) return `حداکثر ${MAX_FILES_PER_REQUEST} تصویر در هر بار.`;

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) return `«${file.name}» باید JPG، PNG یا WebP باشد.`;
    if (file.size > MAX_FILE_BYTES) return `حجم «${file.name}» بیشتر از ۸ مگابایت است.`;
  }
  return null;
}

type UploadResult = { ok: true } | { ok: false; error: string };

/** آپلود به `POST /api/admin/products/[id]/images` (app/api/admin/products/[id]/images/route.ts) */
export async function uploadProductImages(productId: string, files: File[]): Promise<UploadResult> {
  const body = new FormData();
  for (const file of files) body.append("files", file);

  try {
    const response = await fetch(`/api/admin/products/${productId}/images`, { method: "POST", body });
    const json = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

    if (response.ok && json?.ok) return { ok: true };
    return { ok: false, error: json?.error ?? "آپلود ناموفق بود." };
  } catch {
    return { ok: false, error: "ارتباط با سرور برقرار نشد." };
  }
}

/* ───────────── ادیت محصول: مدیریت تصاویر موجود ───────────── */

type ImageItem = { id: string; url: string; alt: string };

export function ProductImagesManager({ productId, images }: { productId: string; images: ImageItem[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const problem = validateFiles(files, images.length);
    if (problem) return setMessage(problem);

    setMessage(null);
    setUploading(true);
    const result = await uploadProductImages(productId, files);
    setUploading(false);

    if (!result.ok) return setMessage(result.error);
    router.refresh();
  }

  function run(task: () => Promise<{ error?: string }>) {
    setMessage(null);
    startTransition(async () => {
      const result = await task();
      if (result.error) setMessage(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input ref={inputRef} type="file" accept={ACCEPT_ATTRIBUTE} multiple className="sr-only" id="pi-upload" onChange={onPick} />
        <Button type="button" variant="outline" disabled={uploading || images.length >= MAX_IMAGES_PER_PRODUCT} onClick={() => inputRef.current?.click()}>
          <ImagePlus className="size-4" aria-hidden />
          {uploading ? "در حال آپلود…" : "افزودن تصویر"}
        </Button>
        <p className="text-muted text-xs">
          JPG / PNG / WebP، حداکثر ۸ مگابایت؛ تا {MAX_IMAGES_PER_PRODUCT} تصویر. اولین تصویر = تصویر اصلی. خودکار به WebP تبدیل و کوچک می‌شود.
        </p>
      </div>

      {message ? (
        <p role="alert" className="text-danger text-sm">
          {message}
        </p>
      ) : null}

      {images.length === 0 ? (
        <p className="text-muted text-sm">هنوز تصویری ندارد.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-busy={pending}>
          {images.map((image, index) => (
            <li key={image.id} className="border-border bg-surface space-y-2 rounded-xl border p-2">
              <div className="bg-surface-2 relative aspect-square overflow-hidden rounded-lg">
                {/* پیش‌نمایش ادمین؛ آدرس از درایور ذخیره‌سازی می‌آید (local یا blob) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.alt} className="size-full object-cover" />
                {index === 0 ? (
                  <Badge tone="primary" className="absolute start-2 top-2">
                    اصلی
                  </Badge>
                ) : null}
              </div>

              <label className="sr-only" htmlFor={`alt-${image.id}`}>
                متن جایگزین (alt)
              </label>
              <Input
                id={`alt-${image.id}`}
                defaultValue={image.alt}
                maxLength={160}
                className="h-9 text-xs"
                onBlur={(event) => {
                  const value = event.target.value.trim();
                  if (value !== image.alt) run(() => updateImageAltAction(image.id, value));
                }}
              />

              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <Button type="button" variant="outline" size="sm" aria-label="جابه‌جایی به قبل" disabled={pending || index === 0} onClick={() => run(() => moveImageAction(image.id, "earlier"))}>
                    <ChevronRight className="size-4" aria-hidden />
                  </Button>
                  <Button type="button" variant="outline" size="sm" aria-label="جابه‌جایی به بعد" disabled={pending || index === images.length - 1} onClick={() => run(() => moveImageAction(image.id, "later"))}>
                    <ChevronLeft className="size-4" aria-hidden />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="حذف تصویر"
                  disabled={pending}
                  onClick={() => {
                    if (window.confirm("این تصویر حذف شود؟")) run(() => deleteImageAction(image.id));
                  }}
                >
                  <Trash2 className="text-danger size-4" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ───────────── محصول جدید: انتخاب تصاویر قبل از ساخت (بعد از ساخت محصول آپلود می‌شوند) ───────────── */

type PendingPickerProps = { files: File[]; onChange: (files: File[]) => void };

export function PendingImagesPicker({ files, onChange }: PendingPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";

    const next = [...files, ...picked];
    const problem = validateFiles(next, 0);
    if (problem) return setMessage(problem);

    setMessage(null);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input ref={inputRef} type="file" accept={ACCEPT_ATTRIBUTE} multiple className="sr-only" id="pi-pending" onChange={onPick} />
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          <ImagePlus className="size-4" aria-hidden />
          انتخاب تصاویر
        </Button>
        <p className="text-muted text-xs">همزمان با ساخت محصول آپلود می‌شوند. اولین تصویر = تصویر اصلی؛ alt و ترتیب را بعداً می‌توانید ویرایش کنید.</p>
      </div>

      {message ? (
        <p role="alert" className="text-danger text-sm">
          {message}
        </p>
      ) : null}

      {files.length > 0 ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="bg-surface-2 relative aspect-square overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previews[index]} alt={file.name} className="size-full object-cover" />
              <button
                type="button"
                aria-label={`حذف ${file.name}`}
                className="bg-bg/80 absolute end-1 top-1 grid size-6 place-items-center rounded-full"
                onClick={() => onChange(files.filter((_, i) => i !== index))}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
