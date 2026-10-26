"use client";

import { Suspense, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { loginUrl } from "@/modules/auth/redirect";
import { toggleFavoriteAction } from "@/modules/wishlist/actions";

type FavoritesContextValue = {
  isFavorite: (productId: string) => boolean;
  toggle: (productId: string) => Promise<string | null>;
  pendingId: string | null;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

type WishlistResponse = { authenticated: boolean; ids: string[] };

/**
 * وضعیت قلب‌ها را یک‌بار از `/api/wishlist` می‌خواند (صفحه‌های محصول کش‌شده‌اند و نباید به کاربر وابسته باشند).
 * toggle خوش‌بینانه است و در خطا برمی‌گردد؛ مهمان به صفحه‌ی ورود با `next` هدایت می‌شود.
 */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ids, setIds] = useState<ReadonlySet<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/wishlist", { signal, cache: "no-store" });
      const data = response.ok ? ((await response.json()) as WishlistResponse) : null;
      setIds(new Set(data?.ids ?? []));
    } catch {
      // قطع شبکه یا لغو: وضعیت قبلی می‌ماند.
    }
  }, []);

  const toggle = useCallback(
    async (productId: string): Promise<string | null> => {
      setPendingId(productId);
      const wasFavorite = ids.has(productId);
      const set = (next: boolean) =>
        setIds((current) => {
          const copy = new Set(current);
          if (next) copy.add(productId);
          else copy.delete(productId);
          return copy;
        });

      set(!wasFavorite);
      try {
        const result = await toggleFavoriteAction(productId);

        if (result.status === "ok") {
          set(result.favorited);
          return null;
        }

        set(wasFavorite);
        if (result.status === "unauthenticated") {
          router.push(loginUrl(`${window.location.pathname}${window.location.search}`));
          return null;
        }
        return result.message;
      } catch {
        set(wasFavorite);
        return "خطا در ثبت علاقه‌مندی؛ دوباره تلاش کنید.";
      } finally {
        setPendingId(null);
      }
    },
    [ids, router],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({ isFavorite: (productId) => ids.has(productId), toggle, pendingId }),
    [ids, toggle, pendingId],
  );

  return (
    <FavoritesContext value={value}>
      {/* usePathname داینامیک است و باید داخل Suspense باشد (وگرنه prerender کل لی‌اوت می‌شکند). */}
      <Suspense fallback={null}>
        <RefreshOnNavigation refresh={refresh} />
      </Suspense>
      {children}
    </FavoritesContext>
  );
}

/** با هر تغییر مسیر (و بعد از ورود/خروج) قلب‌ها را از سرور تازه می‌کند. */
function RefreshOnNavigation({ refresh }: { refresh: (signal?: AbortSignal) => Promise<void> }) {
  const pathname = usePathname();

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [pathname, refresh]);

  return null;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return context;
}