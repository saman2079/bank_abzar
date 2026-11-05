import "server-only";
import type { OrderStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";

/** گزارش آنالیتیکس پنل ادمین. همه‌ی شمارش‌ها در دیتابیس انجام می‌شود (SQL خام فقط‌خواندنی و پارامتری). */

export const PERIODS = [7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];

export function periodParam(raw: string | string[] | undefined): Period {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return PERIODS.find((p) => p === value) ?? 30;
}

const ACTIVE_STATUSES: OrderStatus[] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];
const ABANDONED_AFTER_MS = 60 * 60 * 1000;

type Totals = { visitors: number; newVisitors: number; sessions: number; views: number };
type Bounce = { sessions: number; bounced: number; avgPages: number | null };
type FunnelRow = { sessions: number; productView: number; cart: number; checkout: number };
type DayRow = { day: string; visitors: number; views: number };
type SourceRaw = { source: string; sessions: number; carts: number; checkouts: number; newVisitors: number };
type NameCount = { name: string; sessions: number };
type CampaignRow = { source: string; campaign: string; sessions: number };
type ProductRaw = { id: string; views: number; visitors: number; carts: number };
type ArticleRaw = {
  id: string;
  views: number;
  visitors: number;
  entries: number;
  reads: number;
  avgSec: number | null;
  avgScroll: number | null;
  finished: number;
};

export type ProductStat = {
  id: string;
  name: string;
  slug: string;
  views: number;
  visitors: number;
  carts: number;
  sold: number;
};
export type ArticleStat = ArticleRaw & { title: string; slug: string; productClicks: number };
export type AbandonedProduct = { id: string; name: string; slug: string; quantity: number };

export type AnalyticsReport = {
  days: Period;
  totals: Totals;
  bounce: Bounce;
  funnel: FunnelRow;
  orders: {
    placed: number;
    active: number;
    pendingPayment: number;
    pendingConfirmation: number;
    canceled: number;
    returned: number;
    canceledExpiredPayment: number;
    canceledExpiredConfirmation: number;
    canceledOther: number;
    failedPayments: number;
  };
  abandonedCartUsers: number;
  abandonedProducts: AbandonedProduct[];
  daily: DayRow[];
  sources: SourceRaw[];
  referrers: NameCount[];
  campaigns: CampaignRow[];
  landing: NameCount[];
  devices: NameCount[];
  productPrev: NameCount[];
  products: ProductStat[];
  articles: ArticleStat[];
};

export async function getAnalyticsReport(days: Period): Promise<AnalyticsReport> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const abandonedBefore = new Date(Date.now() - ABANDONED_AFTER_MS);

  const [
    totalsRows,
    bounceRows,
    funnelRows,
    daily,
    sources,
    referrers,
    campaigns,
    landing,
    devices,
    productPrev,
    productRaw,
    articleRaw,
    articleClicks,
    orderGroups,
    cancelNotes,
    failedPayments,
    abandonedUsers,
    abandonedGroups,
  ] = await Promise.all([
    db.$queryRaw<Totals[]>`
      SELECT COUNT(DISTINCT "visitorId")::int AS "visitors",
             COUNT(DISTINCT "visitorId") FILTER (WHERE "newVisitor")::int AS "newVisitors",
             COUNT(DISTINCT "sessionId")::int AS "sessions",
             COUNT(*)::int AS "views"
      FROM "AnalyticsEvent" WHERE "type" = 'VIEW' AND "createdAt" >= ${since}`,
    db.$queryRaw<Bounce[]>`
      SELECT COUNT(*)::int AS "sessions",
             COUNT(*) FILTER (WHERE v = 1)::int AS "bounced",
             AVG(v)::float AS "avgPages"
      FROM (SELECT COUNT(*) AS v FROM "AnalyticsEvent"
            WHERE "type" = 'VIEW' AND "createdAt" >= ${since} GROUP BY "sessionId") t`,
    db.$queryRaw<FunnelRow[]>`
      SELECT COUNT(DISTINCT "sessionId")::int AS "sessions",
             COUNT(DISTINCT "sessionId") FILTER (WHERE "type" = 'VIEW' AND "kind" = 'PRODUCT')::int AS "productView",
             COUNT(DISTINCT "sessionId") FILTER (WHERE "type" = 'ADD_TO_CART')::int AS "cart",
             COUNT(DISTINCT "sessionId") FILTER (WHERE "type" = 'VIEW' AND "kind" = 'CHECKOUT')::int AS "checkout"
      FROM "AnalyticsEvent" WHERE "createdAt" >= ${since}`,
    db.$queryRaw<DayRow[]>`
      SELECT to_char((("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Tehran')::date, 'YYYY-MM-DD') AS "day",
             COUNT(DISTINCT "visitorId")::int AS "visitors",
             COUNT(*)::int AS "views"
      FROM "AnalyticsEvent" WHERE "type" = 'VIEW' AND "createdAt" >= ${since}
      GROUP BY 1 ORDER BY 1`,
    db.$queryRaw<SourceRaw[]>`
      SELECT e."source" AS "source",
             COUNT(*)::int AS "sessions",
             COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM "AnalyticsEvent" c
                 WHERE c."sessionId" = e."sessionId" AND c."type" = 'ADD_TO_CART'))::int AS "carts",
             COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM "AnalyticsEvent" c
                 WHERE c."sessionId" = e."sessionId" AND c."type" = 'VIEW' AND c."kind" = 'CHECKOUT'))::int AS "checkouts",
             COUNT(*) FILTER (WHERE e."newVisitor")::int AS "newVisitors"
      FROM "AnalyticsEvent" e
      WHERE e."type" = 'VIEW' AND e."isEntry" AND e."source" IS NOT NULL AND e."createdAt" >= ${since}
      GROUP BY e."source" ORDER BY 2 DESC`,
    db.$queryRaw<NameCount[]>`
      SELECT "referrerHost" AS "name", COUNT(*)::int AS "sessions"
      FROM "AnalyticsEvent"
      WHERE "type" = 'VIEW' AND "isEntry" AND "referrerHost" IS NOT NULL AND "createdAt" >= ${since}
      GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
    db.$queryRaw<CampaignRow[]>`
      SELECT "utmSource" AS "source", COALESCE("utmCampaign", '—') AS "campaign", COUNT(*)::int AS "sessions"
      FROM "AnalyticsEvent"
      WHERE "type" = 'VIEW' AND "isEntry" AND "utmSource" IS NOT NULL AND "createdAt" >= ${since}
      GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 10`,
    db.$queryRaw<NameCount[]>`
      SELECT "path" AS "name", COUNT(*)::int AS "sessions"
      FROM "AnalyticsEvent"
      WHERE "type" = 'VIEW' AND "isEntry" AND "createdAt" >= ${since}
      GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
    db.$queryRaw<NameCount[]>`
      SELECT COALESCE("device", '—') AS "name", COUNT(*)::int AS "sessions"
      FROM "AnalyticsEvent"
      WHERE "type" = 'VIEW' AND "isEntry" AND "createdAt" >= ${since}
      GROUP BY 1 ORDER BY 2 DESC`,
    db.$queryRaw<NameCount[]>`
      SELECT COALESCE("prevKind", 'EXTERNAL') AS "name", COUNT(*)::int AS "sessions"
      FROM "AnalyticsEvent"
      WHERE "type" = 'VIEW' AND "kind" = 'PRODUCT' AND "createdAt" >= ${since}
      GROUP BY 1 ORDER BY 2 DESC`,
    db.$queryRaw<ProductRaw[]>`
      SELECT "productId" AS "id",
             COUNT(*) FILTER (WHERE "type" = 'VIEW')::int AS "views",
             COUNT(DISTINCT "visitorId") FILTER (WHERE "type" = 'VIEW')::int AS "visitors",
             COUNT(*) FILTER (WHERE "type" = 'ADD_TO_CART')::int AS "carts"
      FROM "AnalyticsEvent"
      WHERE "productId" IS NOT NULL AND "createdAt" >= ${since}
      GROUP BY 1 ORDER BY 2 DESC, 4 DESC LIMIT 20`,
    db.$queryRaw<ArticleRaw[]>`
      SELECT "articleId" AS "id",
             COUNT(*) FILTER (WHERE "type" = 'VIEW')::int AS "views",
             COUNT(DISTINCT "visitorId") FILTER (WHERE "type" = 'VIEW')::int AS "visitors",
             COUNT(*) FILTER (WHERE "type" = 'VIEW' AND "isEntry")::int AS "entries",
             COUNT(*) FILTER (WHERE "type" = 'LEAVE')::int AS "reads",
             (AVG("durationSec") FILTER (WHERE "type" = 'LEAVE'))::float AS "avgSec",
             (AVG("scrollPct") FILTER (WHERE "type" = 'LEAVE'))::float AS "avgScroll",
             COUNT(*) FILTER (WHERE "type" = 'LEAVE' AND "scrollPct" >= 75)::int AS "finished"
      FROM "AnalyticsEvent"
      WHERE "articleId" IS NOT NULL AND "createdAt" >= ${since}
      GROUP BY 1 ORDER BY 2 DESC LIMIT 20`,
    db.$queryRaw<{ id: string; clicks: number }[]>`
      SELECT "fromArticleId" AS "id", COUNT(*)::int AS "clicks"
      FROM "AnalyticsEvent"
      WHERE "fromArticleId" IS NOT NULL AND "type" = 'VIEW' AND "createdAt" >= ${since}
      GROUP BY 1`,
    db.order.groupBy({ by: ["status"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    db.orderStatusHistory.groupBy({
      by: ["note"],
      where: { to: "CANCELED", createdAt: { gte: since } },
      _count: { _all: true },
    }),
    db.payment.count({ where: { status: "FAILED", createdAt: { gte: since } } }),
    db.cartItem.findMany({ where: { updatedAt: { lt: abandonedBefore } }, distinct: ["userId"], select: { userId: true } }),
    db.cartItem.groupBy({
      by: ["productId"],
      where: { updatedAt: { lt: abandonedBefore } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 8,
    }),
  ]);

  const productIds = [...new Set([...productRaw.map((p) => p.id), ...abandonedGroups.map((g) => g.productId)])];
  const articleIds = articleRaw.map((a) => a.id);

  const [productRows, soldGroups, articleRows] = await Promise.all([
    db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, slug: true } }),
    db.orderItem.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds }, order: { createdAt: { gte: since }, status: { in: ACTIVE_STATUSES } } },
      _sum: { quantity: true },
    }),
    db.article.findMany({ where: { id: { in: articleIds } }, select: { id: true, title: true, slug: true } }),
  ]);

  const productById = new Map(productRows.map((p) => [p.id, p]));
  const soldById = new Map(soldGroups.map((g) => [g.productId, g._sum.quantity ?? 0]));
  const articleById = new Map(articleRows.map((a) => [a.id, a]));
  const clicksByArticle = new Map(articleClicks.map((c) => [c.id, c.clicks]));

  const countOf = (status: OrderStatus) => orderGroups.find((g) => g.status === status)?._count._all ?? 0;
  const placed = orderGroups.reduce((sum, g) => sum + g._count._all, 0);
  const active = ACTIVE_STATUSES.reduce((sum, status) => sum + countOf(status), 0);

  let canceledExpiredPayment = 0;
  let canceledExpiredConfirmation = 0;
  let canceledOther = 0;
  for (const group of cancelNotes) {
    const count = group._count._all;
    if (group.note === "انقضای مهلت پرداخت") canceledExpiredPayment += count;
    else if (group.note === "انقضای مهلت تأیید تلفنی") canceledExpiredConfirmation += count;
    else canceledOther += count;
  }

  return {
    days,
    totals: totalsRows[0] ?? { visitors: 0, newVisitors: 0, sessions: 0, views: 0 },
    bounce: bounceRows[0] ?? { sessions: 0, bounced: 0, avgPages: null },
    funnel: funnelRows[0] ?? { sessions: 0, productView: 0, cart: 0, checkout: 0 },
    orders: {
      placed,
      active,
      pendingPayment: countOf("PENDING_PAYMENT"),
      pendingConfirmation: countOf("PENDING_CONFIRMATION"),
      canceled: countOf("CANCELED"),
      returned: countOf("RETURNED"),
      canceledExpiredPayment,
      canceledExpiredConfirmation,
      canceledOther,
      failedPayments,
    },
    abandonedCartUsers: abandonedUsers.length,
    abandonedProducts: abandonedGroups.flatMap((group) => {
      const product = productById.get(group.productId);
      return product ? [{ id: product.id, name: product.name, slug: product.slug, quantity: group._sum.quantity ?? 0 }] : [];
    }),
    daily,
    sources,
    referrers,
    campaigns,
    landing,
    devices,
    productPrev,
    products: productRaw.flatMap((row) => {
      const product = productById.get(row.id);
      return product
        ? [{ ...row, name: product.name, slug: product.slug, sold: soldById.get(row.id) ?? 0 }]
        : [];
    }),
    articles: articleRaw.flatMap((row) => {
      const article = articleById.get(row.id);
      return article ? [{ ...row, title: article.title, slug: article.slug, productClicks: clicksByArticle.get(row.id) ?? 0 }] : [];
    }),
  };
}
