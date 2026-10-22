import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, EmptyRow, Td, Th } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { SearchForm } from "@/components/admin/search-form";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { requireStaff } from "@/lib/dal";
import { formatDateTime, formatNumber } from "@/lib/format";
import { firstParam, pageParam, type RawSearchParams } from "@/lib/query-params";
import { ARTICLE_STATUSES, ARTICLE_STATUS_LABELS } from "@/modules/articles/constants";
import { listAdminArticles } from "@/modules/articles/admin/queries";

export const metadata: Metadata = { title: "مقاله‌ها" };

export default async function AdminArticlesPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requireStaff();
  const raw = await searchParams;

  const q = firstParam(raw.q)?.trim().slice(0, 60) || undefined;
  const statusRaw = firstParam(raw.status);
  const status = ARTICLE_STATUSES.find((item) => item === statusRaw);
  const page = pageParam(raw.page);

  const { items, total, totalPages } = await listAdminArticles({ status, q, page });

  return (
    <div className="space-y-5">
      <PageHeader title="مقاله‌ها" description={`${formatNumber(total)} مقاله`} action={{ href: "/admin/articles/new", label: "مقاله‌ی جدید" }} />

      <SearchForm action="/admin/articles" q={q} placeholder="عنوان یا نامک…">
        <div className="w-44">
          <Select name="status" defaultValue={status ?? ""} aria-label="وضعیت">
            <option value="">همه‌ی وضعیت‌ها</option>
            {ARTICLE_STATUSES.map((item) => (
              <option key={item} value={item}>
                {ARTICLE_STATUS_LABELS[item]}
              </option>
            ))}
          </Select>
        </div>
      </SearchForm>

      <DataTable>
        <thead>
          <tr>
            <Th>عنوان</Th>
            <Th>وضعیت</Th>
            <Th>انتشار</Th>
            <Th>آخرین ویرایش</Th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <EmptyRow colSpan={4}>مقاله‌ای پیدا نشد.</EmptyRow>
          ) : (
            items.map((article) => (
              <tr key={article.id}>
                <Td>
                  <Link href={`/admin/articles/${article.id}`} className="font-bold hover:underline">
                    {article.title}
                  </Link>
                  <p className="text-muted text-xs" dir="ltr">
                    {article.slug}
                  </p>
                </Td>
                <Td>
                  <Badge tone={article.status === "PUBLISHED" ? "primary" : "neutral"}>{ARTICLE_STATUS_LABELS[article.status]}</Badge>
                </Td>
                <Td className="text-muted whitespace-nowrap">{article.publishedAt ? formatDateTime(article.publishedAt) : "—"}</Td>
                <Td className="text-muted whitespace-nowrap">{formatDateTime(article.updatedAt)}</Td>
              </tr>
            ))
          )}
        </tbody>
      </DataTable>

      <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} basePath="/admin/articles" params={{ q, status }} />
    </div>
  );
}
