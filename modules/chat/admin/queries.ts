import "server-only";
import { db } from "@/lib/db";

export function listConversations() {
  return db.chatConversation.findMany({
    orderBy: [{ unreadByStaff: "desc" }, { lastMessageAt: "desc" }],
    take: 100,
    include: { messages: { orderBy: { seq: "desc" }, take: 1, select: { body: true, sender: true } } },
  });
}

export async function getConversation(id: string) {
  const conversation = await db.chatConversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { seq: "asc" }, take: 500, select: { seq: true, sender: true, body: true, createdAt: true } } },
  });
  if (!conversation) return null;

  const user = conversation.userId
    ? await db.user.findUnique({ where: { id: conversation.userId }, select: { id: true, name: true, phone: true } })
    : null;

  return { conversation, user };
}

export async function countUnreadConversations(): Promise<number> {
  return db.chatConversation.count({ where: { unreadByStaff: { gt: 0 } } });
}
