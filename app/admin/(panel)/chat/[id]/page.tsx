import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatThread } from "@/components/admin/chat-thread";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";
import { closeChatAction, deleteChatAction } from "@/modules/chat/admin/actions";
import { getConversation } from "@/modules/chat/admin/queries";

export const metadata: Metadata = { title: "گفتگو" };

export default async function AdminChatThreadPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  if (id.length > 40) notFound();

  const data = await getConversation(id);
  if (!data) notFound();
  const { conversation, user } = data;

  const title = conversation.name ?? user?.name ?? (user ? "کاربر سایت" : "مهمان");

  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        description={`شروع: ${formatDateTime(conversation.createdAt)}${user ? ` · کاربر ثبت‌نام‌شده: ${user.phone}` : " · مهمان (بدون ورود)"}${
          conversation.status === "CLOSED" ? " · بسته‌شده" : ""
        }`}
      />

      <ChatThread
        conversationId={conversation.id}
        initialMessages={conversation.messages.map((message) => ({
          seq: message.seq,
          sender: message.sender,
          body: message.body,
          createdAt: message.createdAt.toISOString(),
        }))}
      />

      <div className="border-border flex flex-wrap gap-3 border-t pt-5">
        {conversation.status === "OPEN" ? (
          <form action={closeChatAction}>
            <input type="hidden" name="id" value={conversation.id} />
            <Button type="submit" variant="outline">
              بستن گفتگو
            </Button>
          </form>
        ) : null}
        <form action={deleteChatAction}>
          <input type="hidden" name="id" value={conversation.id} />
          <Button type="submit" variant="outline" className="text-danger">
            حذف گفتگو
          </Button>
        </form>
      </div>
      <p className="text-muted text-xs">بستن، گفتگو را از «باز» خارج می‌کند؛ با پیام جدید بازدیدکننده خودکار دوباره باز می‌شود.</p>
    </div>
  );
}
