import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { MAX_MESSAGES_PER_CONVERSATION, POLL_BATCH } from "../constants";
import { toMessageDto } from "../service";
import type { ChatMessageDto } from "../types";

const messageSelect = { seq: true, sender: true, body: true, createdAt: true } satisfies Prisma.ChatMessageSelect;

/** پیام‌های جدید یک گفتگو برای ادمین؛ با هر poll شمارنده‌ی خوانده‌نشده‌ی ادمین صفر می‌شود (صفحه باز است = دیده شده). */
export async function pollConversationForStaff(id: string, after: number) {
  const conversation = await db.chatConversation.findUnique({ where: { id }, select: { id: true, status: true, unreadByStaff: true } });
  if (!conversation) return null;

  const rows = await db.chatMessage.findMany({
    where: { conversationId: id, seq: { gt: after } },
    orderBy: { seq: "asc" },
    take: POLL_BATCH,
    select: messageSelect,
  });

  if (conversation.unreadByStaff > 0) {
    await db.chatConversation.update({ where: { id }, data: { unreadByStaff: 0 } });
  }

  return { messages: rows.map(toMessageDto), status: conversation.status };
}

export type StaffReplyResult = { ok: true; message: ChatMessageDto } | { ok: false; error: string };

export async function sendStaffMessage(id: string, staffId: string, body: string): Promise<StaffReplyResult> {
  const conversation = await db.chatConversation.findUnique({ where: { id }, select: { id: true } });
  if (!conversation) return { ok: false, error: "گفتگو پیدا نشد." };

  const count = await db.chatMessage.count({ where: { conversationId: id } });
  if (count >= MAX_MESSAGES_PER_CONVERSATION) return { ok: false, error: "این گفتگو به سقف پیام رسیده است." };

  const message = await db.$transaction(async (tx) => {
    const created = await tx.chatMessage.create({
      data: { conversationId: id, sender: "STAFF", staffId, body },
      select: messageSelect,
    });
    await tx.chatConversation.update({
      where: { id },
      data: { status: "OPEN", unreadByUser: { increment: 1 }, unreadByStaff: 0, lastMessageAt: created.createdAt },
    });
    return created;
  });

  return { ok: true, message: toMessageDto(message) };
}
