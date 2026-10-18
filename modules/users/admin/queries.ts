import "server-only";
import type { Prisma, Role } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { toLatinDigits } from "@/lib/phone";

const PAGE_SIZE = 20;
export const USER_ROLES = ["CUSTOMER", "STAFF", "ADMIN"] as const;

export async function listAdminUsers(filters: { q?: string; role?: Role; page: number }) {
  const q = filters.q ? toLatinDigits(filters.q).trim() : undefined;
  const where: Prisma.UserWhereInput = {
    ...(filters.role ? { role: filters.role } : {}),
    ...(q
      ? { OR: [{ phone: { contains: q } }, { name: { contains: q, mode: "insensitive" as const } }] }
      : {}),
  };

  const [total, items] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        isActive: true,
        createdByAdmin: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
  ]);

  return { items, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getAdminUser(id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      phone: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdByAdmin: true,
      phoneVerifiedAt: true,
      createdAt: true,
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, number: true, status: true, total: true, createdAt: true },
      },
    },
  });
}
