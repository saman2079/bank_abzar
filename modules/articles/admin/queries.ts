import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { ArticleStatus } from "../constants";

const PAGE_SIZE = 20;

export async function listAdminArticles(filters: { status?: ArticleStatus; q?: string; page: number }) {
  const where: Prisma.ArticleWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.q ? { OR: [{ title: { contains: filters.q, mode: "insensitive" } }, { slug: { contains: filters.q.toLowerCase() } }] } : {}),
  };

  const [total, rows] = await Promise.all([
    db.article.count({ where }),
    db.article.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, title: true, slug: true, status: true, publishedAt: true, updatedAt: true },
    }),
  ]);

  return {
    items: rows.map((row) => ({ ...row, status: row.status as ArticleStatus })),
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getAdminArticle(id: string) {
  const row = await db.article.findUnique({ where: { id } });
  return row ? { ...row, status: row.status as ArticleStatus } : null;
}
