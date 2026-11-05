import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";

/** بلوک‌های بصری گزارش آنالیتیکس: سرور-کامپوننت، بدون JS کلاینت (فقط CSS). */

export function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;
}

export function formatPercent(value: number): string {
  return `${formatNumber(value)}٪`;
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return "—";
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;

  if (minutes === 0) return `${formatNumber(rest)} ثانیه`;
  return rest === 0 ? `${formatNumber(minutes)} دقیقه` : `${formatNumber(minutes)} دقیقه و ${formatNumber(rest)} ثانیه`;
}

const dayFormat = new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric", timeZone: "UTC" });

export function formatDay(day: string): string {
  return dayFormat.format(new Date(`${day}T00:00:00Z`));
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="text-muted text-xs">{label}</p>
      <p className="mt-1 text-lg font-extrabold">{value}</p>
      {sub ? <p className="text-muted mt-0.5 text-xs">{sub}</p> : null}
    </Card>
  );
}

export function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card className="space-y-3 p-5">
      <div>
        <h2 className="font-bold">{title}</h2>
        {hint ? <p className="text-muted mt-0.5 text-xs">{hint}</p> : null}
      </div>
      {children}
    </Card>
  );
}

/** ردیف افقی با نوار نسبی. `max` مبنای ۱۰۰٪ نوار است. */
export function BarList({
  rows,
  max,
  empty = "هنوز داده‌ای ثبت نشده است.",
}: {
  rows: { label: string; value: number; note?: string }[];
  max?: number;
  empty?: string;
}) {
  if (rows.length === 0) return <p className="text-muted text-sm">{empty}</p>;
  const top = max ?? Math.max(...rows.map((row) => row.value), 1);

  return (
    <ul className="space-y-2.5 text-sm">
      {rows.map((row) => (
        <li key={row.label} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate">{row.label}</span>
            <span className="shrink-0 font-bold">
              {formatNumber(row.value)}
              {row.note ? <span className="text-muted ms-1.5 text-xs font-normal">{row.note}</span> : null}
            </span>
          </div>
          <div className="bg-surface-2 h-2 overflow-hidden rounded-full">
            <div className="bg-primary h-full rounded-full" style={{ width: `${Math.max(2, percent(row.value, top))}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** قیف: هر مرحله با عرض نسبی به مرحله‌ی اول و درصد ریزش نسبت به مرحله‌ی قبل. */
export function Funnel({ steps }: { steps: { label: string; value: number; hint?: string }[] }) {
  const first = Math.max(steps[0]?.value ?? 0, 1);

  return (
    <ol className="space-y-3">
      {steps.map((step, index) => {
        const previous = index > 0 ? (steps[index - 1]?.value ?? 0) : null;
        const drop = previous !== null && previous > 0 ? percent(previous - step.value, previous) : null;

        return (
          <li key={step.label} className="space-y-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span className="font-medium">
                {formatNumber(index + 1)}. {step.label}
              </span>
              <span>
                <strong>{formatNumber(step.value)}</strong>
                <span className="text-muted ms-2 text-xs">{formatPercent(percent(step.value, first))} از ورودی‌ها</span>
                {drop !== null && drop > 0 ? <span className="text-danger ms-2 text-xs">ریزش {formatPercent(drop)}</span> : null}
              </span>
            </div>
            <div className="bg-surface-2 h-3 overflow-hidden rounded-full">
              <div className="bg-primary h-full rounded-full" style={{ width: `${Math.max(1.5, percent(step.value, first))}%` }} />
            </div>
            {step.hint ? <p className="text-muted text-xs">{step.hint}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}

/** نمودار ستونی روزانه (بازدیدکننده‌ی یکتا) با CSS. */
export function TrendBars({ rows }: { rows: { day: string; visitors: number; views: number }[] }) {
  if (rows.length === 0) return <p className="text-muted text-sm">هنوز داده‌ای ثبت نشده است.</p>;
  const top = Math.max(...rows.map((row) => row.visitors), 1);

  return (
    <div className="overflow-x-auto">
      <div className="flex h-40 min-w-max items-end gap-1.5" dir="ltr">
        {rows.map((row) => (
          <div
            key={row.day}
            className="flex w-7 shrink-0 flex-col items-center justify-end gap-1"
            title={`${formatDay(row.day)}: ${formatNumber(row.visitors)} بازدیدکننده، ${formatNumber(row.views)} بازدید`}
          >
            <span className="text-muted text-[10px]">{formatNumber(row.visitors)}</span>
            <div className="bg-primary w-full rounded-t" style={{ height: `${Math.max(3, percent(row.visitors, top)) * 0.9}px` }} />
            <span className="text-muted text-[10px] whitespace-nowrap" dir="rtl">
              {formatDay(row.day)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
