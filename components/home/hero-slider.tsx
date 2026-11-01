"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BannerSlide } from "@/modules/banners/types";

const AUTOPLAY_MS = 6000;

function isExternal(url: string) {
  return /^https?:\/\//.test(url);
}

function SlideBody({ slide, priority }: { slide: BannerSlide; priority: boolean }) {
  const alt = slide.imageAlt || slide.title;

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[2/1] lg:aspect-[3/1]">
      {slide.imageUrl ? (
        <>
          {slide.mobileImageUrl ? (
            <Image
              src={slide.mobileImageUrl}
              alt={alt}
              fill
              sizes="100vw"
              priority={priority}
              className="object-cover sm:hidden"
            />
          ) : null}
          <Image
            src={slide.imageUrl}
            alt={alt}
            fill
            sizes="(min-width: 1280px) 1200px, 100vw"
            priority={priority}
            className={cn("object-cover", slide.mobileImageUrl ? "hidden sm:block" : "")}
          />
          {/* گرادیان پایین برای خوانایی متن روی هر تصویری */}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </>
      ) : (
        <div
          aria-hidden
          className="bg-surface absolute inset-0 bg-[radial-gradient(60%_90%_at_25%_50%,color-mix(in_srgb,var(--color-primary)_28%,transparent),transparent)]"
        />
      )}

      <div className={cn("absolute inset-0 flex flex-col justify-end gap-2 p-5 sm:p-8 lg:justify-center lg:p-14", slide.imageUrl ? "text-white" : "")}>
          <h2 className="max-w-xl text-2xl leading-snug font-extrabold sm:text-3xl lg:text-5xl lg:leading-snug">{slide.title}</h2>
          {slide.subtitle ? (
            <p className={cn("max-w-md text-sm leading-7 sm:text-base", slide.imageUrl ? "text-white/85" : "text-muted")}>{slide.subtitle}</p>
          ) : null}
          {slide.ctaLabel && slide.linkUrl ? (
            <span className={buttonVariants({ size: "lg", className: "mt-2 w-fit" })}>{slide.ctaLabel}</span>
          ) : null}
      </div>
    </div>
  );
}

/**
 * اسلایدر صفحه‌ی اول، به‌صورت **حلقه‌ای**: از اولین بنر به عقب بروید آخرین بنر می‌آید و از آخرین جلو بروید اولین.
 * با CSS scroll-snap کار می‌کند (سوایپ لمسی و اسکرول افقی تاچ‌پد/ماوس بومی، بدون کتابخانه). برای حلقه، یک کپی از
 * آخرین بنر قبل از اولی و یک کپی از اولین بنر بعد از آخری قرار می‌گیرد؛ وقتی اسکرول روی کپی آرام گرفت، بی‌صدا به
 * بنر واقعی می‌پرد. کپی‌ها فقط بعد از hydration ساخته می‌شوند تا HTML اولیه (و LCP) همان بنر اول باشد.
 * پخش خودکار با hover/لمس/فوکوس یا `prefers-reduced-motion` متوقف می‌شود. با یک بنر: بدون کنترل و بدون پخش خودکار.
 */
export function HeroSlider({ slides }: { slides: BannerSlide[] }) {
  const track = useRef<HTMLUListElement>(null);
  /** شماره‌ی بنر واقعی (۰ تا count-1) */
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [looped, setLooped] = useState(false);
  const count = slides.length;
  // اگر کپی‌ها فعال باشند، بنر واقعی i در موقعیت i+1 است.
  const offset = looped ? 1 : 0;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (count > 1) setLooped(true);
  }, [count]);

  /** اسکرول به موقعیت `position` از لیست (شامل کپی‌ها). جهت‌مستقل (RTL/LTR): از اختلاف لبه‌ها استفاده می‌شود. */
  const scrollToPosition = useCallback((position: number, smooth: boolean) => {
    const el = track.current;
    const item = el?.children[position] as HTMLElement | undefined;
    if (!el || !item) return;
    const delta = item.getBoundingClientRect().left - el.getBoundingClientRect().left;
    el.scrollTo({ left: el.scrollLeft + delta, behavior: smooth ? "smooth" : "instant" });
  }, []);

  // بعد از ساخته‌شدن کپی‌ها، قبل از paint روی بنر اول واقعی بایست (بدون پرش دیده‌شدنی).
  useLayoutEffect(() => {
    if (looped) scrollToPosition(1, false);
  }, [looped, scrollToPosition]);

  const goTo = useCallback(
    (target: number) => {
      // target می‌تواند -1 یا count باشد (رفتن روی کپی)؛ بعد از آرام‌گرفتن اسکرول به بنر واقعی می‌پرد.
      scrollToPosition(target + offset, !reducedMotion);
    },
    [offset, reducedMotion, scrollToPosition],
  );

  // بنر فعال (نقطه‌ها) + پرش بی‌صدا از کپی به بنر واقعی بعد از آرام‌گرفتن اسکرول.
  useEffect(() => {
    const el = track.current;
    if (!el || count < 2 || !looped) return;

    const toReal = (position: number) => (position - 1 + count) % count;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            setIndex(toReal(Array.prototype.indexOf.call(el.children, entry.target)));
          }
        }
      },
      { root: el, threshold: [0.6] },
    );
    for (const child of Array.from(el.children)) observer.observe(child);

    let settle: number | undefined;
    const onScroll = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        const width = el.clientWidth;
        if (width === 0) return;
        // موقعیت فعلی = فاصله‌ی لبه‌ی اولین آیتم تا لبه‌ی ظرف، تقسیم بر عرض (جهت‌مستقل)
        const first = el.children[0] as HTMLElement;
        const position = Math.round((el.getBoundingClientRect().left - first.getBoundingClientRect().left) / width);
        if (position === 0) scrollToPosition(count, false);
        else if (position === count + 1) scrollToPosition(1, false);
      }, 120);
    };
    el.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", onScroll);
      window.clearTimeout(settle);
    };
  }, [count, looped, scrollToPosition]);

  useEffect(() => {
    if (count < 2 || paused || reducedMotion) return;
    const timer = window.setInterval(() => goTo(index + 1), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count, paused, reducedMotion, index, goTo]);

  const frame = "border-border bg-surface relative overflow-hidden rounded-card border";

  if (count === 1) {
    const slide = slides[0]!;
    const body = <SlideBody slide={slide} priority />;
    return (
      <section aria-label="بنر اصلی" className={frame}>
        {slide.linkUrl ? (
          <Link href={slide.linkUrl} {...(isExternal(slide.linkUrl) ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="block">
            {body}
          </Link>
        ) : (
          body
        )}
      </section>
    );
  }

  /** ردیف‌های رندر: با حلقه، کپی آخرین ابتدا و کپی اولین انتها اضافه می‌شود (aria-hidden، خارج از ترتیب تب). */
  const items = looped
    ? [
        { slide: slides[count - 1]!, real: count - 1, clone: true, key: "clone-last" },
        ...slides.map((slide, real) => ({ slide, real, clone: false, key: slide.id })),
        { slide: slides[0]!, real: 0, clone: true, key: "clone-first" },
      ]
    : slides.map((slide, real) => ({ slide, real, clone: false, key: slide.id }));

  return (
    <section
      aria-roledescription="carousel"
      aria-label="بنرهای اصلی"
      className={cn(frame, "group")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <ul ref={track} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain" aria-live={paused ? "polite" : "off"}>
        {items.map(({ slide, real, clone, key }) => {
          const body = <SlideBody slide={slide} priority={!clone && real === 0} />;
          return (
            <li
              key={key}
              role="group"
              aria-roledescription="slide"
              aria-label={`${real + 1} از ${count}`}
              aria-hidden={clone || undefined}
              className="w-full shrink-0 snap-start"
            >
              {slide.linkUrl ? (
                <Link
                  href={slide.linkUrl}
                  {...(isExternal(slide.linkUrl) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  tabIndex={!clone && real === index ? 0 : -1}
                  className="block"
                >
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => goTo(index - 1)}
        aria-label="بنر قبلی"
        className="glass border-border absolute start-3 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full border opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 md:grid"
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => goTo(index + 1)}
        aria-label="بنر بعدی"
        className="glass border-border absolute end-3 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full border opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 md:grid"
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>

      <div className="absolute inset-x-0 bottom-3 flex items-center justify-center">
        <div className="glass border-border flex items-center gap-1.5 rounded-full border px-3 py-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`رفتن به بنر ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              className={cn("h-2 rounded-full transition-all", i === index ? "bg-primary w-6" : "bg-muted/50 w-2")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
