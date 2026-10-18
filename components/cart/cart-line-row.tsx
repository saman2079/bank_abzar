import Link from "next/link";
import { Drill, Minus, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatNumber, formatToman } from "@/lib/format";
import { setCartQuantityAction } from "@/modules/cart/actions";
import type { CartLine } from "@/modules/cart/types";

function QuantityForm({
  productId,
  quantity,
  label,
  disabled,
  children,
}: {
  productId: string;
  quantity: number;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <form action={setCartQuantityAction}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value={quantity} />
      <button
        type="submit"
        aria-label={label}
        disabled={disabled}
        className="border-border hover:border-primary hover:text-primary grid size-8 place-items-center rounded-full border transition-colors disabled:pointer-events-none disabled:opacity-40"
      >
        {children}
      </button>
    </form>
  );
}

export function CartLineRow({ line }: { line: CartLine }) {
  const soldOut = line.stock < 1;
  const short = !soldOut && line.stock < line.quantity;

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
            <QuantityForm productId={line.productId} quantity={line.quantity + 1} label="افزایش تعداد" disabled={soldOut}>
              <Plus className="size-4" aria-hidden />
            </QuantityForm>
            <span className="min-w-6 text-center text-sm font-bold">{formatNumber(line.quantity)}</span>
            <QuantityForm productId={line.productId} quantity={line.quantity - 1} label="کاهش تعداد">
              <Minus className="size-4" aria-hidden />
            </QuantityForm>
            <QuantityForm productId={line.productId} quantity={0} label="حذف از سبد">
              <Trash2 className="text-danger size-4" aria-hidden />
            </QuantityForm>
          </div>
          <p className="font-extrabold">{formatToman(line.lineTotal)}</p>
        </div>
      </div>
    </Card>
  );
}
