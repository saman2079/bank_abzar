import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, EmptyRow, Td, Th } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { requireStaff } from "@/lib/dal";
import { formatNumber } from "@/lib/format";
import { listAdminBrands } from "@/modules/catalog/admin/queries";

export const metadata: Metadata = { title: "برندها" };

export default async function AdminBrandsPage() {
  await requireStaff();
  const brands = await listAdminBrands();

  return (
    <div className="space-y-5">
      <PageHeader title="برندها" action={{ href: "/admin/brands/new", label: "برند جدید" }} />
      <DataTable>
        <thead>
          <tr>
            <Th>نام</Th>
            <Th>نامک</Th>
            <Th>محصولات</Th>
          </tr>
        </thead>
        <tbody>
          {brands.length === 0 ? (
            <EmptyRow colSpan={3}>برندی ثبت نشده است.</EmptyRow>
          ) : (
            brands.map((brand) => (
              <tr key={brand.id}>
                <Td>
                  <Link href={`/admin/brands/${brand.id}`} className="font-bold hover:underline">
                    {brand.name}
                  </Link>
                </Td>
                <Td className="text-muted" dir="ltr">
                  {brand.slug}
                </Td>
                <Td>{formatNumber(brand._count.products)}</Td>
              </tr>
            ))
          )}
        </tbody>
      </DataTable>
    </div>
  );
}
