import "server-only";
import { db } from "@/lib/db";
import type { AddressView } from "./types";

/** فقط آدرس‌های همین کاربر (ضد IDOR: همیشه با userId فیلتر می‌شود). پیش‌فرض اول. */
export async function listAddresses(userId: string): Promise<AddressView[]> {
  return db.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      receiverName: true,
      receiverPhone: true,
      province: true,
      city: true,
      postalCode: true,
      street: true,
      plaque: true,
      unit: true,
      isDefault: true,
    },
  });
}
