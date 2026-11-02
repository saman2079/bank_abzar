import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { MAX_MESSAGES_PER_CONVERSATION, POLL_BATCH } from "./constants";
import type { ChatMessageDto } from "./types";

export function hashChatToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newChatToken(): string {
  return randomBytes(32).toString("base64url");
}

const messageSelect = { seq: true, sender: true, body: true, createdAt: true } satisfies Prisma.ChatMessageSelect;

type MessageRow = Prisma.ChatMessageGetPayload<{ select: typeof messageSelect }>;

export function toMessageDto(row: MessageRow): ChatMessageDto {
  return { seq: row.seq, sender: row.sender, body: row.body, createdAt: row.createdAt.toISOString() };
}

export async function findConversationByToken(token: string | undefined) {
  if (!token) return null;
  return db.chatConversation.findUnique({ where: { tokenHash: hashChatToken(token) } });
}

export type SendResult =
  | { ok: true; message: ChatMessageDto; token: string | null }
  | { ok: false; error: string };

/**
 * پیام بازدیدکننده. اگر گفتگویی با این توکن نیست، گفتگوی جدید (و توکن جدید) ساخته می‌شود؛
 * `token` فقط برای گفتگوی تازه برمی‌گردد تا روتر کوکی را بگذارد.
 */
export async function sendVisitorMessage(input: {
  existingToken: string | undefined;
  body: string;
  name?: string;
  userId?: string;
}): Promise<SendResult> {
  const existing = await findConversationByToken(input.existingToken);

  if (existing) {
    const count = await db.chatMessage.count({ where: { conversationId: existing.id } });
    if (count >= MAX_MESSAGES_PER_CONVERSATION) {
      return { ok: false, error: "تعداد پیام‌های این گفتگو به سقف رسیده است. لطفاً با تلفن تماس بگیرید." };
    }

    const message = await db.$transaction(async (tx) => {
      const created = await tx.chatMessage.create({
        data: { conversationId: existing.id, sender: "VISITOR", body: input.body },
        select: messageSelect,
      });
      await tx.chatConversation.update({
        where: { id: existing.id },
        data: {
          status: "OPEN",
          unreadByStaff: { increment: 1 },
          lastMessageAt: created.createdAt,
          ...(input.name && !existing.name ? { name: input.name } : {}),
          ...(input.userId && !existing.userId ? { userId: input.userId } : {}),
        },
      });
      return created;
    });
    return { ok: true, message: toMessageDto(message), token: null };
  }

  const token = newChatToken();
  const message = await db.$transaction(async (tx) => {
    const conversation = await tx.chatConversation.create({
      data: {
        tokenHash: hashChatToken(token),
        name: input.name,
        userId: input.userId,
        unreadByStaff: 1,
      },
      select: { id: true },
    });
    return tx.chatMessage.create({
      data: { conversationId: conversation.id, sender: "VISITOR", body: input.body },
      select: messageSelect,
    });
  });
  return { ok: true, message: toMessageDto(message), token };
}

/** پیام‌های جدیدتر از `after` برای بازدیدکننده؛ با `markRead` شمارنده‌ی خوانده‌نشده‌اش صفر می‌شود. */
export async function pollVisitor(token: string | undefined, after: number, markRead: boolean) {
  const conversation = await findConversationByToken(token);
  if (!conversation) return { messages: [] as ChatMessageDto[], unread: 0, status: "OPEN" as const };

  const rows = await db.chatMessage.findMany({
    where: { conversationId: conversation.id, seq: { gt: after } },
    orderBy: { seq: "asc" },
    take: POLL_BATCH,
    select: messageSelect,
  });

  let unread = conversation.unreadByUser;
  if (markRead && unread > 0) {
    await db.chatConversation.update({ where: { id: conversation.id }, data: { unreadByUser: 0 } });
    unread = 0;
  }

  return { messages: rows.map(toMessageDto), unread, status: conversation.status };
}
