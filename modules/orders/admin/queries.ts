import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { toLatinDigits } from "@/lib/phone";
import type { OrderStatus } from "../constants";
import { addressSnapshotSchema } from "../schemas";

const PAGE_SIZE = 20;

export async function listAdminOrders(filters: { status?: OrderStatus; q?: string; page: number }) {
  const q = filters.q ? toLatinDigits(filters.q).trim() : undefined;
  const asNumber = q && /^\d{1,9}$/.test(q) ? Number(q) : null;

  const where: Prisma.OrderWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(q
      ? {
          OR: [
            ...(asNumber !== null ? [{ number: asNumber - 1000 }] : []),
            { user: { phone: { contains: q } } },
            { user: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        number: true,
        status: true,
        total: true,
        createdAt: true,
        user: { select: { name: true, phone: true } },
      },
    }),
  ]);

  return {
    items: rows.map((row) => ({ ...row, status: row.status as OrderStatus })),
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getAdminOrder(id: string) {
  const row = await db.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, phone: true } },
      items: { orderBy: { id: "asc" } },
      history: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!row) return null;

  const address = addressSnapshotSchema.safeParse(row.addressSnapshot);
  const creatorIds = [...new Set([row.createdById, ...row.history.map((entry) => entry.changedById)].filter((value): value is string => Boolean(value)))];
  const people = await db.user.findMany({ where: { id: { in: creatorIds } }, select: { id: true, name: true, phone: true } });
  const labels = new Map(people.map((person) => [person.id, person.name ?? person.phone]));

  return {
    ...row,
    status: row.status as OrderStatus,
    address: address.success ? address.data : null,
    createdByLabel: row.createdById ? (labels.get(row.createdById) ?? null) : null,
    history: row.history.map((entry) => ({
      id: entry.id,
      to: entry.to as OrderStatus,
      note: entry.note,
      createdAt: entry.createdAt,
      actor: entry.changedById ? (labels.get(entry.changedById) ?? null) : null,
    })),
  };
}
