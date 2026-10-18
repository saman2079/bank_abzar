import "server-only";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import {
  GUEST_CART_COOKIE,
  GUEST_CART_SECONDS,
  MAX_CART_LINES,
  MAX_CART_QUANTITY,
} from "./constants";
import { guestCartSchema } from "./schemas";
import type { Cart, CartLine } from "./types";

type RawLine = { productId: string; quantity: number };

const EMPTY_CART: Cart = { lines: [], itemCount: 0, subtotal: 0, hasIssues: false };

async function readGuest(): Promise<RawLine[]> {
  const raw = (await cookies()).get(GUEST_CART_COOKIE)?.value;
  if (!raw || raw.length > 4000) return [];

  try {
    const parsed = guestCartSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

async function writeGuest(lines: RawLine[]): Promise<void> {
  const store = await cookies();

  if (lines.length === 0) {
    store.delete(GUEST_CART_COOKIE);
    return;
  }
  store.set(GUEST_CART_COOKIE, JSON.stringify(lines), {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_CART_SECONDS,
  });
}

async function readRaw(userId: string | null): Promise<RawLine[]> {
  if (!userId) return readGuest();

  return db.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { productId: true, quantity: true },
  });
}

/** سبد فعلی با قیمت و موجودی تازه از DB (قیمت هرگز از کلاینت/کوکی نمی‌آید). */
export async function getCart(): Promise<Cart> {
  const user = await getCurrentUser();
  const raw = await readRaw(user?.id ?? null);
  if (raw.length === 0) return EMPTY_CART;

  const products = await db.product.findMany({
    where: { id: { in: raw.map((line) => line.productId) }, status: "ACTIVE" },
    select: { id: true, slug: true, name: true, price: true, stock: true, brand: { select: { name: true } } },
  });
  const byId = new Map(products.map((product) => [product.id, product]));

  const lines: CartLine[] = raw.flatMap((line) => {
    const product = byId.get(line.productId);
    if (!product) return [];

    return [
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand.name,
        unitPrice: product.price,
        quantity: line.quantity,
        stock: product.stock,
        lineTotal: product.price * line.quantity,
      },
    ];
  });

  return {
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: lines.reduce((sum, line) => sum + line.lineTotal, 0),
    hasIssues: lines.some((line) => line.stock < line.quantity),
  };
}

export async function getCartCount(): Promise<number> {
  const user = await getCurrentUser();

  if (user) {
    const result = await db.cartItem.aggregate({ where: { userId: user.id }, _sum: { quantity: true } });
    return result._sum.quantity ?? 0;
  }
  return (await readGuest()).reduce((sum, line) => sum + line.quantity, 0);
}

async function findActiveProduct(productId: string) {
  return db.product.findFirst({ where: { id: productId, status: "ACTIVE" }, select: { id: true, stock: true } });
}

/** فقط داخل Server Action صدا زده شود (کوکی می‌نویسد). */
export async function addToCart(productId: string, quantity = 1): Promise<{ ok: boolean; error?: string }> {
  const product = await findActiveProduct(productId);
  if (!product || product.stock < 1) return { ok: false, error: "این محصول در حال حاضر موجود نیست." };

  const limit = Math.min(MAX_CART_QUANTITY, product.stock);
  const user = await getCurrentUser();

  if (user) {
    const existing = await db.cartItem.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
      select: { quantity: true },
    });
    const next = Math.min((existing?.quantity ?? 0) + quantity, limit);

    await db.cartItem.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      update: { quantity: next },
      create: { userId: user.id, productId, quantity: next },
    });
    return { ok: true };
  }

  const lines = await readGuest();
  const existing = lines.find((line) => line.productId === productId);

  if (!existing && lines.length >= MAX_CART_LINES) return { ok: false, error: "سبد خرید پر است." };

  const next = Math.min((existing?.quantity ?? 0) + quantity, limit);
  await writeGuest(existing
    ? lines.map((line) => (line.productId === productId ? { productId, quantity: next } : line))
    : [...lines, { productId, quantity: next }]);

  return { ok: true };
}

/** quantity ≤ 0 یعنی حذف. تعداد به min(سقف، موجودی) محدود می‌شود. */
export async function setCartQuantity(productId: string, quantity: number): Promise<void> {
  const user = await getCurrentUser();

  if (quantity <= 0) {
    if (user) await db.cartItem.deleteMany({ where: { userId: user.id, productId } });
    else await writeGuest((await readGuest()).filter((line) => line.productId !== productId));
    return;
  }

  const product = await findActiveProduct(productId);
  if (!product) return;
  const next = Math.min(quantity, MAX_CART_QUANTITY, Math.max(product.stock, 1));

  if (user) {
    await db.cartItem.updateMany({ where: { userId: user.id, productId }, data: { quantity: next } });
    return;
  }
  const lines = await readGuest();
  await writeGuest(lines.map((line) => (line.productId === productId ? { productId, quantity: next } : line)));
}

/** بعد از ورود: سبد کوکی در سبد DB ادغام و کوکی پاک می‌شود. فقط داخل Server Action. */
export async function mergeGuestCart(userId: string): Promise<void> {
  const guest = await readGuest();
  if (guest.length === 0) return;

  const products = await db.product.findMany({
    where: { id: { in: guest.map((line) => line.productId) }, status: "ACTIVE" },
    select: { id: true, stock: true },
  });
  const stockById = new Map(products.map((product) => [product.id, product.stock]));

  await db.$transaction(async (tx) => {
    for (const line of guest) {
      const stock = stockById.get(line.productId);
      if (!stock || stock < 1) continue;

      const existing = await tx.cartItem.findUnique({
        where: { userId_productId: { userId, productId: line.productId } },
        select: { quantity: true },
      });
      const next = Math.min((existing?.quantity ?? 0) + line.quantity, MAX_CART_QUANTITY, stock);

      await tx.cartItem.upsert({
        where: { userId_productId: { userId, productId: line.productId } },
        update: { quantity: next },
        create: { userId, productId: line.productId, quantity: next },
      });
    }
  });

  await writeGuest([]);
}
