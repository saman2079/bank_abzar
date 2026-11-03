"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAX_MESSAGE_LENGTH } from "@/modules/chat/constants";
import type { ChatMessageDto } from "@/modules/chat/types";

const timeFormat = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tehran" });
const POLL_MS = 4000;

function merge(prev: ChatMessageDto[], incoming: ChatMessageDto[]): ChatMessageDto[] {
  if (incoming.length === 0) return prev;
  const known = new Set(prev.map((message) => message.seq));
  const fresh = incoming.filter((message) => !known.has(message.seq));
  return fresh.length === 0 ? prev : [...prev, ...fresh].sort((a, b) => a.seq - b.seq);
}

/** تاریخچه‌ی گفتگو + فرم پاسخ برای پنل. هر ۴ ثانیه پیام‌های جدید را می‌گیرد (و گفتگو «خوانده» می‌شود). */
export function ChatThread({ conversationId, initialMessages }: { conversationId: string; initialMessages: ChatMessageDto[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSeq = useRef(initialMessages[initialMessages.length - 1]?.seq ?? 0);
  const logRef = useRef<HTMLDivElement>(null);

  const poll = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/chat/${conversationId}?after=${lastSeq.current}`, { cache: "no-store" });
      if (!response.ok) return;
      const json = (await response.json()) as { ok: boolean; messages?: ChatMessageDto[] };
      const incoming = json.messages ?? [];
      const last = incoming[incoming.length - 1];
      if (last) lastSeq.current = Math.max(lastSeq.current, last.seq);
      setMessages((prev) => merge(prev, incoming));
    } catch {
      /* poll بعدی دوباره تلاش می‌کند */
    }
  }, [conversationId]);

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;
    const tick = async () => {
      if (document.visibilityState === "visible") await poll();
      if (!stopped) timer = window.setTimeout(tick, POLL_MS);
    };
    timer = window.setTimeout(tick, 0);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [poll]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;

    setSending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/chat/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const json = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; message?: ChatMessageDto } | null;
      if (response.ok && json?.ok && json.message) {
        const message = json.message;
        lastSeq.current = Math.max(lastSeq.current, message.seq);
        setMessages((prev) => merge(prev, [message]));
        setText("");
      } else {
        setError(json?.error ?? "ارسال نشد.");
      }
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-border bg-surface flex h-[min(36rem,70dvh)] flex-col overflow-hidden rounded-card border">
      <div ref={logRef} role="log" aria-live="polite" className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((message) => {
          const staff = message.sender === "STAFF";
          return (
            <div key={message.seq} className={cn("flex", staff ? "justify-start" : "justify-end")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-6 break-words whitespace-pre-wrap",
                  staff ? "bg-primary text-primary-fg rounded-ss-sm" : "bg-surface-2 rounded-se-sm",
                )}
              >
                {message.body}
                <span className="mt-0.5 block text-[10px] opacity-70">{timeFormat.format(new Date(message.createdAt))}</span>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
        className="border-border space-y-2 border-t p-3"
      >
        {error ? (
          <p role="alert" className="text-danger text-xs">
            {error}
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                void send();
              }
            }}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={2}
            placeholder="پاسخ شما… (Enter = ارسال، Shift+Enter = خط جدید)"
            aria-label="پاسخ"
            className="border-border bg-surface-2 text-fg placeholder:text-muted focus:border-primary focus:ring-primary/30 focus:ring-2 min-h-12 flex-1 resize-none rounded-2xl border px-4 py-2 text-sm leading-6 outline-none"
          />
          <Button type="submit" disabled={sending || text.trim() === ""}>
            <Send className="size-4 rotate-180" aria-hidden />
            ارسال
          </Button>
        </div>
      </form>
    </div>
  );
}
