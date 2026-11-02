import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, EmptyRow, Td, Th } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { requireStaff } from "@/lib/dal";
import { formatDateTime, formatNumber } from "@/lib/format";
import { listConversations } from "@/modules/chat/admin/queries";

export const metadata: Metadata = { title: "گفتگوها" };

export default async function AdminChatPage() {
  await requireStaff();
  const conversations = await listConversations();

  return (
    <div className="space-y-5">
      <PageHeader
        title="گفتگوهای پشتیبانی"
        description="پیام‌های بازدیدکننده‌ها از چت‌باکس سایت. گفتگوهای بدون فعالیت بعد از ۹۰ روز خودکار پاک می‌شوند."
      />
      <DataTable>
        <thead>
          <tr>
            <Th>بازدیدکننده</Th>
            <Th>آخرین پیام</Th>
            <Th>زمان</Th>
            <Th>وضعیت</Th>
          </tr>
        </thead>
        <tbody>
          {conversations.length === 0 ? (
            <EmptyRow colSpan={4}>هنوز گفتگویی شروع نشده است.</EmptyRow>
          ) : (
            conversations.map((conversation) => {
              const last = conversation.messages[0];
              return (
                <tr key={conversation.id}>
                  <Td>
                    <Link href={`/admin/chat/${conversation.id}`} className="font-bold hover:underline">
                      {conversation.name ?? (conversation.userId ? "کاربر سایت" : "مهمان")}
                    </Link>
                  </Td>
                  <Td className="text-muted max-w-xs truncate">
                    {last ? `${last.sender === "STAFF" ? "شما: " : ""}${last.body}` : "—"}
                  </Td>
                  <Td className="text-muted text-xs">{formatDateTime(conversation.lastMessageAt)}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {conversation.unreadByStaff > 0 ? (
                        <Badge tone="danger">{formatNumber(conversation.unreadByStaff)} جدید</Badge>
                      ) : null}
                      <Badge>{conversation.status === "OPEN" ? "باز" : "بسته"}</Badge>
                    </div>
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </DataTable>
    </div>
  );
}
