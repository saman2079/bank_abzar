import { cn } from "@/lib/utils";

/** جدول ساده‌ی اسکرول‌افقی برای موبایل. سلول‌ها را با `Td`/`Th` بساز. */
export function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border bg-surface rounded-card overflow-x-auto border">
      <table className="w-full min-w-[640px] text-sm">{children}</table>
    </div>
  );
}

export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("text-muted border-border border-b px-4 py-3 text-start font-medium", className)} {...props} />;
}

export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("border-border border-b px-4 py-3 align-middle last:border-b-0", className)} {...props} />;
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-muted px-4 py-10 text-center">
        {children}
      </td>
    </tr>
  );
}
