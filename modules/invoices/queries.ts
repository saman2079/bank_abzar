import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { toLatinDigits } from "@/lib/phone";
import type { InvoiceStatus } from "./constants";

const PAGE_SIZE = 20;

export async function listInvoices(filters: { status?: InvoiceStatus; q?: string; page: number }) {
  const q = filters.q ? toLatinDigits(filters.q).trim() : undefined;
  const asNumber = q && /^\d{1,9}$/.test(q) ? Number(q) : null;

  const where: Prisma.InvoiceWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(q
      ? {
          OR: [
            ...(asNumber !== null ? [{ number: asNumber - 1000 }] : []),
            { customerName: { contains: q, mode: "insensitive" as const } },
            { customerPhone: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    db.invoice.count({ where }),
    db.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, number: true, status: true, customerName: true, customerPhone: true, total: true, createdAt: true },
    }),
  ]);

  return {
    items: rows.map((row) => ({ ...row, status: row.status as InvoiceStatus })),
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getInvoice(id: string) {
  const row = await db.invoice.findUnique({
    where: { id },
    include: { items: { orderBy: { id: "asc" } } },
  });
  if (!row) return null;

  const ids = [row.createdById, row.finalizedById, row.canceledById].filter((value): value is string => Boolean(value));
  const people = await db.user.findMany({ where: { id: { in: [...new Set(ids)] } }, select: { id: true, name: true, phone: true } });
  const labels = new Map(people.map((person) => [person.id, person.name ?? person.phone]));
  const label = (userId: string | null) => (userId ? (labels.get(userId) ?? null) : null);

  return {
    ...row,
    status: row.status as InvoiceStatus,
    createdByLabel: label(row.createdById),
    finalizedByLabel: label(row.finalizedById),
    canceledByLabel: label(row.canceledById),
  };
}

/** کالاهای قابل انتخاب در فرم فاکتور (فعال؛ موجودی صفر هم برای پیش‌فاکتور مجاز است). */
export async function listInvoiceProducts() {
  return db.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    take: 1000,
    select: { id: true, name: true, sku: true, price: true, stock: true },
  });
}
