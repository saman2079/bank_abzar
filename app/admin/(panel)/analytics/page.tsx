import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, EmptyRow, Td, Th } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { BarList, Funnel, Section, Stat, TrendBars, formatDuration, formatPercent, percent } from "@/components/analytics/report-blocks";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/dal";
import { formatNumber } from "@/lib/format";
import { type RawSearchParams } from "@/lib/query-params";
import { getAnalyticsReport, PERIODS, periodParam } from "@/modules/analytics/admin/queries";
import { DEVICE_LABELS, KIND_LABELS, SOURCE_LABELS, type Device, type PageKind, type TrafficSource } from "@/modules/analytics/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "آمار و تحلیل" };

function sourceLabel(source: string): string {
  return SOURCE_LABELS[source as TrafficSource] ?? source;
}

function prevLabel(kind: string): string {
  if (kind === "EXTERNAL") return "ورود مستقیم از بیرون سایت";
  return KIND_LABELS[kind as PageKind] ?? kind;
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requireAdmin();
  const days = periodParam((await searchParams).days);
  const report = await getAnalyticsReport(days);

  const { totals, bounce, funnel, orders } = report;
  // قیف باید نزولی باشد (شمارش‌ها مستقل‌اند و ممکن است به‌خاطر نشست‌های نیمه‌کاره کمی ناهمخوان شوند)
  const productView = Math.min(funnel.productView, funnel.sessions);
  const cart = Math.min(funnel.cart, productView);
  const checkout = funnel.checkout;
  const articleSessions = report.articles.reduce((sum, a) => sum + a.entries, 0);
  const articleToProduct = report.productPrev.find((row) => row.name === "ARTICLE")?.sessions ?? 0;
  const totalProductViews = report.productPrev.reduce((sum, row) => sum + row.sessions, 0);
  const noData = totals.views === 0;

  return (
    <div className="space-y-6">
      <PageHeader title="آمار و تحلیل" description="بازدید، منابع ترافیک، رفتار خرید و عملکرد مقاله‌ها" />

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p}
            href={`/admin/analytics?days=${p}`}
            className={cn(buttonVariants({ size: "sm", variant: p === days ? "primary" : "outline" }))}
          >
            {formatNumber(p)} روز اخیر
          </Link>
        ))}
      </div>

      {noData ? (
        <Section title="هنوز بازدیدی ثبت نشده است">
          <p className="text-muted text-sm">
            ثبت داده از لحظه‌ی انتشار این بخش شروع می‌شود. چند صفحه‌ی سایت را (بدون ورود با حساب ادمین) باز کنید و دوباره سر بزنید؛ بازدید
            کارمندان واردشده و ربات‌ها عمداً شمرده نمی‌شوند.
          </p>
        </Section>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="بازدیدکننده‌ی یکتا" value={formatNumber(totals.visitors)} sub={`${formatNumber(totals.newVisitors)} نفر جدید`} />
        <Stat label="نشست (ویزیت)" value={formatNumber(totals.sessions)} sub={`${formatNumber(totals.views)} بازدید صفحه`} />
        <Stat
          label="صفحه در هر نشست"
          value={bounce.avgPages === null ? "—" : formatNumber(Math.round(bounce.avgPages * 10) / 10)}
          sub={`نرخ پرش ${formatPercent(percent(bounce.bounced, bounce.sessions))}`}
        />
        <Stat
          label="نرخ تبدیل به سفارش"
          value={formatPercent(percent(orders.placed, totals.sessions))}
          sub={`${formatNumber(orders.placed)} سفارش ثبت‌شده`}
        />
      </div>

      <Section title="روند بازدیدکننده‌ی روزانه" hint="تاریخ‌ها به وقت تهران">
        <TrendBars rows={report.daily} />
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="قیف خرید (نشست‌ها)" hint="هر مرحله: چند نشست به آن رسیده‌اند و چند درصد از مرحله‌ی قبل ریزش داشته‌اند">
          <Funnel
            steps={[
              { label: "ورود به سایت", value: funnel.sessions },
              { label: "دیدن صفحه‌ی محصول", value: productView },
              { label: "افزودن به سبد", value: cart, hint: "فقط افزودن از دکمه‌ی «افزودن به سبد» حساب می‌شود." },
              { label: "رسیدن به تسویه‌حساب", value: checkout },
              { label: "ثبت سفارش", value: orders.placed, hint: "از جدول سفارش‌ها (شامل سفارش‌های دستی ادمین)." },
              { label: "پرداخت/تأیید موفق", value: orders.active, hint: "پرداخت‌شده، در حال آماده‌سازی، ارسال‌شده یا تحویل‌شده." },
            ]}
          />
        </Section>

        <Section title="لغو و رها شدن" hint={`سفارش‌های ${formatNumber(days)} روز اخیر`}>
          <BarList
            rows={[
              { label: "لغو به‌خاطر انقضای مهلت پرداخت", value: orders.canceledExpiredPayment },
              { label: "لغو به‌خاطر عدم تأیید تلفنی (پرداخت در محل)", value: orders.canceledExpiredConfirmation },
              { label: "لغو دستی (مشتری/ادمین)", value: orders.canceledOther },
              { label: "مرجوعی", value: orders.returned },
              { label: "پرداخت ناموفق در درگاه", value: orders.failedPayments },
              { label: "هنوز در انتظار پرداخت", value: orders.pendingPayment },
              { label: "در انتظار تأیید تلفنی", value: orders.pendingConfirmation },
            ]}
          />
          <div className="border-border space-y-2 border-t pt-3 text-sm">
            <p>
              <strong>{formatNumber(report.abandonedCartUsers)}</strong> کاربر واردشده سبد خرید را بیش از یک ساعت رها کرده‌اند.
            </p>
            {report.abandonedProducts.length > 0 ? (
              <BarList rows={report.abandonedProducts.map((p) => ({ label: p.name, value: p.quantity, note: "عدد" }))} />
            ) : null}
          </div>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="مردم از کجا آمده‌اند؟" hint="منبع ورود هر نشست؛ تلگرام و اینستاگرام اغلب بدون ارجاع‌دهنده‌اند، به لینک‌ها utm_source بدهید">
          <BarList
            rows={report.sources.map((row) => ({
              label: sourceLabel(row.source),
              value: row.sessions,
              note: `${formatPercent(percent(row.sessions, totals.sessions))} · سبد ${formatPercent(percent(row.carts, row.sessions))}`,
            }))}
          />
        </Section>

        <Section title="دستگاه و صفحه‌های ورودی">
          <BarList
            rows={report.devices.map((row) => ({
              label: DEVICE_LABELS[row.name as Device] ?? row.name,
              value: row.sessions,
              note: formatPercent(percent(row.sessions, totals.sessions)),
            }))}
          />
          <p className="text-muted border-border border-t pt-3 text-xs">پرتکرارترین صفحه‌های ورودی</p>
          <BarList rows={report.landing.map((row) => ({ label: row.name, value: row.sessions }))} />
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="سایت‌های ارجاع‌دهنده">
          <BarList rows={report.referrers.map((row) => ({ label: row.name, value: row.sessions }))} empty="ارجاع‌دهنده‌ی بیرونی ثبت نشده است." />
        </Section>
        <Section title="کمپین‌های UTM" hint="برای لینک‌های تلگرام/اینستاگرام: ?utm_source=telegram&utm_campaign=نام-کمپین">
          <BarList
            rows={report.campaigns.map((row) => ({ label: `${row.source} · ${row.campaign}`, value: row.sessions }))}
            empty="هنوز لینکی با UTM وارد نشده است."
          />
        </Section>
      </div>

      <Section title="محصولات پربازدید" hint="سفارش‌های لغو/پرداخت‌نشده در «فروخته‌شده» نیستند">
        <DataTable>
          <thead>
            <tr>
              <Th>محصول</Th>
              <Th>بازدید</Th>
              <Th>بازدیدکننده</Th>
              <Th>افزودن به سبد</Th>
              <Th>نرخ سبد</Th>
              <Th>فروخته‌شده</Th>
            </tr>
          </thead>
          <tbody>
            {report.products.length === 0 ? (
              <EmptyRow colSpan={6}>هنوز بازدید محصولی ثبت نشده است.</EmptyRow>
            ) : (
              report.products.map((p) => (
                <tr key={p.id}>
                  <Td>
                    <Link href={`/products/${p.slug}`} className="hover:underline">
                      {p.name}
                    </Link>
                  </Td>
                  <Td>{formatNumber(p.views)}</Td>
                  <Td>{formatNumber(p.visitors)}</Td>
                  <Td>{formatNumber(p.carts)}</Td>
                  <Td>{formatPercent(percent(p.carts, p.views))}</Td>
                  <Td>{formatNumber(p.sold)}</Td>
                </tr>
              ))
            )}
          </tbody>
        </DataTable>
      </Section>

      <Section
        title="عملکرد مقاله‌ها"
        hint="مدت و عمق خواندن فقط برای بازدیدهایی است که صفحه را ترک کرده‌اند؛ «تا آخر» یعنی اسکرول ≥ ۷۵٪"
      >
        <DataTable>
          <thead>
            <tr>
              <Th>مقاله</Th>
              <Th>بازدید</Th>
              <Th>ورود مستقیم</Th>
              <Th>میانگین زمان</Th>
              <Th>میانگین اسکرول</Th>
              <Th>تا آخر خوانده</Th>
              <Th>رفتن به محصول</Th>
            </tr>
          </thead>
          <tbody>
            {report.articles.length === 0 ? (
              <EmptyRow colSpan={7}>هنوز بازدید مقاله‌ای ثبت نشده است.</EmptyRow>
            ) : (
              report.articles.map((a) => (
                <tr key={a.id}>
                  <Td>
                    <Link href={`/blog/${a.slug}`} className="hover:underline">
                      {a.title}
                    </Link>
                  </Td>
                  <Td>{formatNumber(a.views)}</Td>
                  <Td>{formatNumber(a.entries)}</Td>
                  <Td>{formatDuration(a.avgSec)}</Td>
                  <Td>{a.avgScroll === null ? "—" : formatPercent(Math.round(a.avgScroll))}</Td>
                  <Td>{a.reads > 0 ? formatPercent(percent(a.finished, a.reads)) : "—"}</Td>
                  <Td>{formatNumber(a.productClicks)}</Td>
                </tr>
              ))
            )}
          </tbody>
        </DataTable>
      </Section>

      <Section
        title="مسیر رسیدن به صفحه‌ی محصول"
        hint={`${formatNumber(articleToProduct)} از ${formatNumber(totalProductViews)} بازدید محصول (${formatPercent(percent(articleToProduct, totalProductViews))}) از داخل یک مقاله بوده؛ ${formatNumber(articleSessions)} نشست با مقاله شروع شده است`}
      >
        <BarList
          rows={report.productPrev.map((row) => ({
            label: prevLabel(row.name),
            value: row.sessions,
            note: formatPercent(percent(row.sessions, totalProductViews)),
          }))}
        />
      </Section>
    </div>
  );
}
