"use client";

import { useEffect, useState } from "react";

const POLL_MS = 20000;

/** نشان تعداد گفتگوهای خوانده‌نشده کنار «گفتگوها» در منوی پنل. */
export function ChatNavBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;

    const tick = async () => {
      if (document.visibilityState === "visible") {
        try {
          const response = await fetch("/api/admin/chat/unread", { cache: "no-store" });
          if (response.ok) {
            const json = (await response.json()) as { ok: boolean; count?: number };
            if (!stopped) setCount(json.count ?? 0);
          }
        } catch {
          /* ignore */
        }
      }
      if (!stopped) timer = window.setTimeout(tick, POLL_MS);
    };
    timer = window.setTimeout(tick, 0);

    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, []);

  if (count === 0) return null;
  return (
    <span className="bg-danger ms-auto grid min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold text-white" aria-label={`${count} گفتگوی خوانده‌نشده`}>
      {count}
    </span>
  );
}
