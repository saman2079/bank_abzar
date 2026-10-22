"use client";

import { useRef, useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TableKit } from "@tiptap/extension-table";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table,
  Underline,
  Undo2,
  Unlink,
} from "lucide-react";
import { ACCEPT_ATTRIBUTE } from "@/modules/media/constants";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  initialContent: JSONContent | string;
  onChange: (html: string, json: string) => void;
};

type ToolButtonProps = { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode };

function ToolButton({ label, active, disabled, onClick, children }: ToolButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "hover:bg-surface-2 flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg px-2 text-xs transition-colors disabled:opacity-40",
        active && "bg-primary text-primary-fg hover:bg-primary",
      )}
    >
      {children}
    </button>
  );
}

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/)/i;

/** ادیتور Tiptap (RTL). خروجی HTML خام فقط برای ارسال به سرور است؛ سرور آن را sanitize می‌کند. */
export function RichTextEditor({ initialContent, onChange }: RichTextEditorProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true },
      }),
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TableKit,
    ],
    content: initialContent,
    // SSR امن در Next + بازرندر نوار ابزار با هر تغییر انتخاب (برای نمایش دکمه‌ی فعال)
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: { dir: "rtl", class: "rich-content min-h-80 p-4 outline-none", "aria-label": "متن مقاله" },
    },
    onUpdate: ({ editor: current }) => onChange(current.getHTML(), JSON.stringify(current.getJSON())),
  });

  if (!editor) return <div className="border-border bg-surface min-h-96 animate-pulse rounded-xl border" />;

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const input = window.prompt("آدرس لینک (مثلاً https://… یا /products/slug)", previous ?? "https://");
    if (input === null) return;

    const href = input.trim();
    if (href === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!SAFE_HREF.test(href)) {
      window.alert("آدرس باید با https:// ، http:// ، mailto: ، tel: یا / شروع شود.");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }

  async function uploadImage(file: File) {
    if (!editor) return;
    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/admin/articles/images", { method: "POST", body });
      const result = (await response.json()) as { ok: boolean; url?: string; error?: string };
      if (!result.ok || !result.url) {
        setUploadError(result.error ?? "آپلود ناموفق بود.");
        return;
      }
      const alt = window.prompt("متن جایگزین تصویر (alt) — برای سئو و دسترس‌پذیری", "") ?? "";
      editor.chain().focus().setImage({ src: result.url, alt: alt.trim() }).run();
    } catch {
      setUploadError("آپلود ناموفق بود؛ اتصال را بررسی کنید.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  const inTable = editor.isActive("table");

  return (
    <div className="border-border bg-surface overflow-hidden rounded-xl border">
      <div className="border-border bg-surface-2/50 sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b p-1.5">
        <ToolButton label="بازگردانی" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo2 className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton label="از نو" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo2 className="size-4" aria-hidden />
        </ToolButton>
        <span className="bg-border mx-1 h-5 w-px" aria-hidden />

        <ToolButton label="عنوان بزرگ (H2)" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton label="عنوان کوچک (H3)" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="size-4" aria-hidden />
        </ToolButton>
        <span className="bg-border mx-1 h-5 w-px" aria-hidden />

        <ToolButton label="پررنگ" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton label="کج" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton label="زیرخط" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <Underline className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton label="خط‌خورده" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="size-4" aria-hidden />
        </ToolButton>
        <span className="bg-border mx-1 h-5 w-px" aria-hidden />

        <ToolButton label="لیست نقطه‌ای" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton label="لیست شماره‌دار" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton label="نقل‌قول" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton label="خط جداکننده" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="size-4" aria-hidden />
        </ToolButton>
        <span className="bg-border mx-1 h-5 w-px" aria-hidden />

        <ToolButton label="راست‌چین" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton label="وسط‌چین" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton label="چپ‌چین" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft className="size-4" aria-hidden />
        </ToolButton>
        <span className="bg-border mx-1 h-5 w-px" aria-hidden />

        <ToolButton label="افزودن/ویرایش لینک" active={editor.isActive("link")} onClick={setLink}>
          <Link2 className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton label="حذف لینک" disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}>
          <Unlink className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton label="افزودن تصویر" disabled={uploading} onClick={() => fileInput.current?.click()}>
          <ImagePlus className="size-4" aria-hidden />
          {uploading ? "…" : null}
        </ToolButton>
        <ToolButton label="درج جدول" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <Table className="size-4" aria-hidden />
        </ToolButton>
        {inTable ? (
          <>
            <ToolButton label="افزودن ردیف" onClick={() => editor.chain().focus().addRowAfter().run()}>
              + ردیف
            </ToolButton>
            <ToolButton label="افزودن ستون" onClick={() => editor.chain().focus().addColumnAfter().run()}>
              + ستون
            </ToolButton>
            <ToolButton label="حذف جدول" onClick={() => editor.chain().focus().deleteTable().run()}>
              حذف جدول
            </ToolButton>
          </>
        ) : null}

        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadImage(file);
          }}
        />
      </div>

      {uploadError ? (
        <p role="alert" className="text-danger border-border border-b px-3 py-2 text-xs">
          {uploadError}
        </p>
      ) : null}

      <EditorContent editor={editor} />
    </div>
  );
}
