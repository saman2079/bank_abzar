"use client";

import Link from "next/link";
import { Drill, Minus, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatNumber, formatToman } from "@/lib/format";
import { MAX_CART_QUANTITY } from "@/modules/cart/constants";
import type { CartLine } from "@/modules/cart/types";

function QuantityButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="border-border hover:border-primary hover:text-primary grid size-8 place-items-center rounded-full border transition-colors disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/**
 * ردیف سبد. تعداد و جمع ردیف از state خوش‌بینانه‌ی `CartView` می‌آید (فوری عوض می‌شود)؛
 * ذخیره‌ی واقعی و بازبینی موجودی/قیمت سمت سرور در پس‌زمینه انجام می‌شود.
 */
export function CartLineRow({
  line,
  onChangeQuantity,
}: {
  line: CartLine;
  onChangeQuantity: (productId: string, quantity: number) => void;
}) {
  const soldOut = line.stock < 1;
  const short = !soldOut && line.stock < line.quantity;
  const cap = Math.min(MAX_CART_QUANTITY, Math.max(line.stock, 1));

  return (
    <Card className="flex gap-4 p-4">
      <div className="bg-surface-2 text-muted grid size-20 shrink-0 place-items-center rounded-xl" aria-hidden>
        <Drill className="size-9" strokeWidth={1.25} />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-muted text-xs font-bold" dir="ltr">
          {line.brand}
        </p>
        <Link href={`/products/${line.slug}`} className="line-clamp-2 text-sm font-medium hover:underline">
          {line.name}
        </Link>

        {soldOut ? (
          <p role="alert" className="text-danger text-xs">
            این کالا ناموجود شده؛ لطفاً از سبد حذفش کنید.
          </p>
        ) : short ? (
          <p role="alert" className="text-danger text-xs">
            فقط {formatNumber(line.stock)} عدد موجود است؛ تعداد را کم کنید.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <QuantityButton
              label="افزایش تعداد"
              disabled={soldOut || line.quantity >= cap}
              onClick={() => onChangeQuantity(line.productId, line.quantity + 1)}
            >
              <Plus className="size-4" aria-hidden />
            </QuantityButton>
            <span className="min-w-6 text-center text-sm font-bold">{formatNumber(line.quantity)}</span>
            <QuantityButton label="کاهش تعداد" onClick={() => onChangeQuantity(line.productId, line.quantity - 1)}>
              <Minus className="size-4" aria-hidden />
            </QuantityButton>
            <QuantityButton label="حذف از سبد" onClick={() => onChangeQuantity(line.productId, 0)}>
              <Trash2 className="text-danger size-4" aria-hidden />
            </QuantityButton>
          </div>
          <p className="font-extrabold">{formatToman(line.lineTotal)}</p>
        </div>
      </div>
    </Card>
  );
}
