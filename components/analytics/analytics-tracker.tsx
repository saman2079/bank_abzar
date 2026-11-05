"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * ردیاب سبک آنالیتیکس: بازدید هر صفحه + (فقط محصول/مقاله) زمان ماندن و بیشترین عمق اسکرول.
 * بدون کتابخانه‌ی بیرونی و بدون کوکی سمت کلاینت؛ «Do Not Track» را رعایت می‌کند.
 */

const ENDPOINT = "/api/analytics";
const PREV_KEY = "ba_prev";
const ENGAGEMENT_PATH = /^\/(products|blog)\/[^/]+$/;

type Payload = {
  type: "VIEW" | "LEAVE";
  path: string;
  prevPath: string;
  referrer: string;
  search: string;
  viewport?: number;
  durationSec?: number;
  scrollPct?: number;
};

let firstRun = true;

function post(payload: Payload, beacon: boolean): void {
  try {
    const body = JSON.stringify(payload);
    if (beacon && typeof navigator.sendBeacon === "function") {
      if (navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }))) return;
    }
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => undefined);
  } catch {
    // آنالیتیکس هرگز نباید سایت را خراب کند
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (navigator.doNotTrack === "1") return;

    let previous = "";
    try {
      previous = sessionStorage.getItem(PREV_KEY) ?? "";
    } catch {
      previous = "";
    }

    // بارگذاری کامل صفحه: ارجاع‌دهنده‌ی واقعی مرورگر؛ ناوبری داخلی (SPA): صفحه‌ی قبلی از sessionStorage.
    const referrer = firstRun ? document.referrer : "";
    const internalReferrer = !referrer || referrer.startsWith(window.location.origin);
    firstRun = false;

    post(
      {
        type: "VIEW",
        path: pathname,
        prevPath: internalReferrer ? previous : "",
        referrer,
        search: window.location.search,
        viewport: window.innerWidth,
      },
      false,
    );
    try {
      sessionStorage.setItem(PREV_KEY, pathname);
    } catch {
      // نادیده
    }

    if (!ENGAGEMENT_PATH.test(pathname)) return;

    let visibleSince = document.visibilityState === "visible" ? Date.now() : 0;
    let visibleMs = 0;
    let maxScroll = 0;
    let sent = false;

    const measureScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const pct = scrollable <= 0 ? 100 : Math.round((window.scrollY / scrollable) * 100);
      if (pct > maxScroll) maxScroll = Math.min(100, pct);
    };
    measureScroll();

    const flush = () => {
      if (sent) return;
      sent = true;
      if (visibleSince) visibleMs += Date.now() - visibleSince;

      const seconds = Math.min(3600, Math.round(visibleMs / 1000));
      if (seconds < 1) return;
      post(
        { type: "LEAVE", path: pathname, prevPath: "", referrer: "", search: "", durationSec: seconds, scrollPct: maxScroll },
        true,
      );
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
      else if (!visibleSince) visibleSince = Date.now();
    };

    window.addEventListener("scroll", measureScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);

    return () => {
      window.removeEventListener("scroll", measureScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [pathname]);

  return null;
}
