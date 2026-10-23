"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites } from "./favorites-provider";

type FavoriteButtonProps = { productId: string; productName: string };

/** قلب علاقه‌مندی روی کارت محصول. */
export function FavoriteButton({ productId, productName }: FavoriteButtonProps) {
  const { isFavorite, toggle, pendingId } = useFavorites();
  const [error, setError] = useState<string | null>(null);
  const active = isFavorite(productId);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `حذف ${productName} از علاقه‌مندی‌ها` : `افزودن ${productName} به علاقه‌مندی‌ها`}
      title={error ?? undefined}
      disabled={pendingId === productId}
      onClick={async () => setError(await toggle(productId))}
      className={cn(
        "relative z-10 grid size-8 place-items-center rounded-full transition-colors disabled:opacity-60",
        error ? "text-danger" : active ? "text-danger" : "text-muted hover:text-danger",
      )}
    >
      <Heart className={cn("size-4", active && "fill-danger")} aria-hidden />
    </button>
  );
}
