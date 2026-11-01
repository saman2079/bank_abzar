import "server-only";
import { db } from "@/lib/db";

export function listAdminBanners() {
  return db.banner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
}

export function getAdminBanner(id: string) {
  return db.banner.findUnique({ where: { id } });
}
