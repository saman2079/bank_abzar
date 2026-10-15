"use client";

import { useState } from "react";

type Props = { productId: string; disabled?: boolean };

type CartLine = { productId: string; quantity: number };

export default function AddToCartButton({ productId, disabled = false }: Props) {
  const [added, setAdded] = useState(false);

  function addToCart() {
    try {
      const raw = window.localStorage.getItem("bank-abzar-demo-cart");
      const current: CartLine[] = raw ? JSON.parse(raw) as CartLine[] : [];
      const found = current.find((line) => line.productId === productId);
      const next = found
        ? current.map((line) => line.productId === productId ? { ...line, quantity: Math.min(99, line.quantity + 1) } : line)
        : [...current, { productId, quantity: 1 }];
      window.localStorage.setItem("bank-abzar-demo-cart", JSON.stringify(next));
      window.dispatchEvent(new Event("bank-abzar-cart-updated"));
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1400);
    } catch {
      setAdded(false);
    }
  }

  return (
    <button className="product-add-button" type="button" disabled={disabled} onClick={addToCart}>
      {disabled ? "ناموجود" : added ? "به سبد اضافه شد ✓" : "افزودن به سبد"}
    </button>
  );
}
