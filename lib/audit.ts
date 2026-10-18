import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getRequestMeta } from "@/lib/request";
import type { SessionUser } from "@/lib/session";

type AuditEntry = {
  actor: SessionUser;
  action: string;
  entity: string;
  entityId?: string;
  /** فقط فیلدهای تغییرکرده؛ هرگز رمز/توکن/OTP نگذار. */
  diff?: Prisma.InputJsonValue;
};

type Client = Pick<typeof db, "auditLog">;

/** با `tx` داخل تراکنش، تا لاگ و تغییر یا هر دو ثبت شوند یا هیچ‌کدام. */
export async function writeAudit(entry: AuditEntry, client: Client = db): Promise<void> {
  const { ip } = await getRequestMeta();

  await client.auditLog.create({
    data: {
      actorId: entry.actor.id,
      actorLabel: entry.actor.name ?? entry.actor.phone,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      diff: entry.diff,
      ip,
    },
  });
}

/** فقط فیلدهای تغییرکرده را به‌صورت `{ field: { from, to } }` برمی‌گرداند. */
export function diffFields(before: Record<string, unknown>, after: Record<string, unknown>): Prisma.InputJsonObject {
  const diff: Record<string, { from: Prisma.InputJsonValue | null; to: Prisma.InputJsonValue | null }> = {};

  for (const key of Object.keys(after)) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      diff[key] = {
        from: (before[key] ?? null) as Prisma.InputJsonValue | null,
        to: (after[key] ?? null) as Prisma.InputJsonValue | null,
      };
    }
  }

  return diff;
}
