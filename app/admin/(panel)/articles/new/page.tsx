import type { Metadata } from "next";
import { ArticleForm } from "@/components/admin/article-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireStaff } from "@/lib/dal";

export const metadata: Metadata = { title: "مقاله‌ی جدید" };

export default async function NewArticlePage() {
  await requireStaff();

  return (
    <div className="space-y-5">
      <PageHeader title="مقاله‌ی جدید" />
      <ArticleForm />
    </div>
  );
}
