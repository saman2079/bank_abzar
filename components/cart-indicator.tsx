"use client";

import { useCallback, useEffect, useState } from "react";

type CartLine = { productId: string; quantity: number };

export default function CartIndicator() {
  const [count, setCount] = useState(0);
  const refresh = useCallback(() => {
    try {
      const raw = window.localStorage.getItem("bank-abzar-demo-cart");
      const value: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(value)) {
        setCount(0);
        return;
      }
      const lines = value.filter((line): line is CartLine => typeof line === "object" && line !== null && "productId" in line && "quantity" in line && typeof line.productId === "string" && typeof line.quantity === "number" && Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= 99);
      setCount(lines.reduce((sum, line) => sum + line.quantity, 0));
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("bank-abzar-cart-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("bank-abzar-cart-updated", refresh);
    };
  }, [refresh]);

  return <span className="cart-count">{new Intl.NumberFormat("fa-IR").format(count)}</span>;
}
