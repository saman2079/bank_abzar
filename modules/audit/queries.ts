import "server-only";
import { db } from "@/lib/db";

const PAGE_SIZE = 30;

export async function listAuditLogs(page: number) {
  const [total, items] = await Promise.all([
    db.auditLog.count(),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return { items, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
