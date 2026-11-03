"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAX_MESSAGE_LENGTH, MAX_NAME_LENGTH } from "@/modules/chat/constants";
import type { ChatMessageDto } from "@/modules/chat/types";

/* پرچم «این مرورگر گفتگو دارد»: فقط کسانی که قبلاً پیام داده‌اند poll می‌شوند (بقیه هیچ درخواستی نمی‌زنند). */
const FLAG_KEY = "ba_chat_started";
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function readFlag(): boolean {
  try {
    return localStorage.getItem(FLAG_KEY) === "1";
  } catch {
    return false;
  }
}
function writeFlag() {
  try {
    localStorage.setItem(FLAG_KEY, "1");
  } catch {
    /* حالت خصوصی/بلاک‌شده: فقط تا پایان همین صفحه کار می‌کند */
  }
  listeners.forEach((listener) => listener());
}

const OPEN_POLL_MS = 4000;
const CLOSED_POLL_MS = 30000;

const timeFormat = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tehran" });

function merge(prev: ChatMessageDto[], incoming: ChatMessageDto[]): ChatMessageDto[] {
  if (incoming.length === 0) return prev;
  const known = new Set(prev.map((message) => message.seq));
  const fresh = incoming.filter((message) => !known.has(message.seq));
  return fresh.length === 0 ? prev : [...prev, ...fresh].sort((a, b) => a.seq - b.seq);
}

type PollResponse = { ok: boolean; messages?: ChatMessageDto[]; unread?: number };

/**
 * چت‌باکس پشتیبانی (گوشه‌ی پایین سایت). ارتباط با polling است (هر ۴ ثانیه وقتی باز است، هر ۳۰ ثانیه وقتی بسته)،
 * چون Vercel وب‌سوکت پایدار ندارد؛ پیام‌ها در دیتابیس ذخیره می‌شوند و ادمین از `/admin/chat` پاسخ می‌دهد.
 */
export function ChatWidget() {
  const hasConversation = useSyncExternalStore(subscribe, readFlag, () => false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [unread, setUnread] = useState(0);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastSeq = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const poll = useCallback(async (markRead: boolean) => {
    try {
      const response = await fetch(`/api/chat?after=${lastSeq.current}${markRead ? "&markRead=1" : ""}`, { cache: "no-store" });
      if (!response.ok) return;
      const json = (await response.json()) as PollResponse;
      if (!json.ok) return;

      const incoming = json.messages ?? [];
      const last = incoming[incoming.length - 1];
      if (last) lastSeq.current = Math.max(lastSeq.current, last.seq);
      setMessages((prev) => merge(prev, incoming));
      setUnread(markRead ? 0 : (json.unread ?? 0));
    } catch {
      /* اینترنت قطع است؛ poll بعدی دوباره تلاش می‌کند */
    }
  }, []);

  // حلقه‌ی poll: باز = سریع و با علامت «خوانده شد»؛ بسته = کند (فقط برای نشان پیام جدید)؛ تب پنهان = توقف
  useEffect(() => {
    if (!hasConversation) return;
    let stopped = false;
    let timer: number | undefined;

    const tick = async () => {
      if (document.visibilityState === "visible") await poll(open);
      if (!stopped) timer = window.setTimeout(tick, open ? OPEN_POLL_MS : CLOSED_POLL_MS);
    };
    timer = window.setTimeout(tick, 0);

    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [hasConversation, open, poll]);

  // پایین‌ترین پیام همیشه دیده شود
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;

    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, ...(messages.length === 0 && name.trim() ? { name: name.trim() } : {}) }),
      });
      const json = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; message?: ChatMessageDto } | null;

      if (response.ok && json?.ok && json.message) {
        const message = json.message;
        lastSeq.current = Math.max(lastSeq.current, message.seq);
        setMessages((prev) => merge(prev, [message]));
        setText("");
        writeFlag();
      } else {
        setError(json?.error ?? "ارسال نشد؛ دوباره تلاش کنید.");
      }
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {open ? (
        <section
          aria-label="گفتگو با پشتیبانی"
          className="bg-bg border-border fixed end-3 bottom-20 z-50 flex h-[min(34rem,calc(100dvh-7rem))] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-card border shadow-2xl md:end-6 md:bottom-6"
        >
          <header className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <p className="text-sm font-extrabold">پشتیبانی بانک ابزار</p>
              <p className="text-muted text-xs">معمولاً در چند دقیقه پاسخ می‌دهیم</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="بستن گفتگو"
              className="text-muted hover:text-fg grid size-8 place-items-center rounded-full"
            >
              <X className="size-4" aria-hidden />
            </button>
          </header>

          <div ref={logRef} role="log" aria-live="polite" className="flex-1 space-y-2 overflow-y-auto p-4">
            <Bubble own={false}>سلام! 👋 هر سؤالی درباره‌ی محصولات، موجودی یا سفارش دارید همین‌جا بپرسید.</Bubble>
            {messages.map((message) => (
              <Bubble key={message.seq} own={message.sender === "VISITOR"} time={timeFormat.format(new Date(message.createdAt))}>
                {message.body}
              </Bubble>
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
            className="border-border space-y-2 border-t p-3"
          >
            {messages.length === 0 ? (
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={MAX_NAME_LENGTH}
                placeholder="نام شما (اختیاری)"
                aria-label="نام شما (اختیاری)"
                className="border-border bg-surface-2 text-fg placeholder:text-muted focus:border-primary focus:ring-primary/30 focus:ring-2 h-9 w-full rounded-full border px-4 text-sm outline-none"
              />
            ) : null}
            {error ? (
              <p role="alert" className="text-danger text-xs">
                {error}
              </p>
            ) : null}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    void send();
                  }
                }}
                maxLength={MAX_MESSAGE_LENGTH}
                rows={1}
                placeholder="پیام شما…"
                aria-label="پیام شما"
                className="border-border bg-surface-2 text-fg placeholder:text-muted focus:border-primary focus:ring-primary/30 focus:ring-2 max-h-28 min-h-10 flex-1 resize-none rounded-2xl border px-4 py-2 text-sm leading-6 outline-none"
              />
              <Button type="submit" size="sm" disabled={sending || text.trim() === ""} aria-label="ارسال پیام" className="size-10 shrink-0 px-0">
                <Send className="size-4 rotate-180" aria-hidden />
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="گفتگو با پشتیبانی"
          aria-expanded={false}
          className="bg-primary text-primary-fg hover:bg-primary-hover fixed end-3 bottom-20 z-40 grid size-14 place-items-center rounded-full shadow-xl transition-colors md:end-6 md:bottom-6"
        >
          <MessageCircle className="size-6" aria-hidden />
          {unread > 0 ? (
            <span className="bg-danger absolute -top-1 -start-1 grid min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold text-white">
              {unread}
            </span>
          ) : null}
        </button>
      ) : null}
    </>
  );
}

function Bubble({ own, time, children }: { own: boolean; time?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex", own ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 break-words whitespace-pre-wrap",
          own ? "bg-primary text-primary-fg rounded-ss-sm" : "bg-surface-2 rounded-se-sm",
        )}
      >
        {children}
        {time ? <span className="mt-0.5 block text-[10px] opacity-70">{time}</span> : null}
      </div>
    </div>
  );
}
