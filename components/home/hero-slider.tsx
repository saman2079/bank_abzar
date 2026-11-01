"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
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
 * اسلایدر صفحه‌ی اول. با CSS scroll-snap کار می‌کند (سوایپ لمسی بومی، بدون کتابخانه)؛ جاوااسکریپت فقط برای
 * نقطه‌ها/فلش‌ها و پخش خودکار است. با یک بنر: بدون کنترل و بدون پخش خودکار. پخش خودکار با hover/focus/لمس یا
 * `prefers-reduced-motion` متوقف می‌شود و دکمه‌ی توقف دارد (WCAG 2.2.2).
 */
export function HeroSlider({ slides }: { slides: BannerSlide[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const count = slides.length;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const goTo = useCallback(
    (target: number) => {
      const el = track.current;
      if (!el || count === 0) return;
      const next = (target + count) % count;
      // در RTL، scrollLeft منفی است؛ از موقعیت خود آیتم استفاده می‌کنیم تا به جهت وابسته نباشد.
      const item = el.children[next] as HTMLElement | undefined;
      item?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest", inline: "start" });
    },
    [count, reducedMotion],
  );

  // نقطه‌ی فعال را از موقعیت اسکرول (سوایپ/فلش/خودکار) می‌خوانیم.
  useEffect(() => {
    const el = track.current;
    if (!el || count < 2) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            setIndex(Array.prototype.indexOf.call(el.children, entry.target));
          }
        }
      },
      { root: el, threshold: [0.6] },
    );
    for (const child of Array.from(el.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [count]);

  useEffect(() => {
    if (count < 2 || paused || userPaused || reducedMotion) return;
    const timer = window.setInterval(() => goTo(index + 1), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count, paused, userPaused, reducedMotion, index, goTo]);

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
      <ul ref={track} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth" aria-live={paused || userPaused ? "polite" : "off"}>
        {slides.map((slide, i) => {
          const body = <SlideBody slide={slide} priority={i === 0} />;
          return (
            <li
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} از ${count}`}
              className="w-full shrink-0 snap-start"
            >
              {slide.linkUrl ? (
                <Link
                  href={slide.linkUrl}
                  {...(isExternal(slide.linkUrl) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  tabIndex={i === index ? 0 : -1}
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

      <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-3">
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
          {!reducedMotion ? (
            <button
              type="button"
              onClick={() => setUserPaused((value) => !value)}
              aria-label={userPaused ? "پخش خودکار" : "توقف پخش خودکار"}
              className="text-muted hover:text-fg ms-1"
            >
              {userPaused ? <Play className="size-3.5" aria-hidden /> : <Pause className="size-3.5" aria-hidden />}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
