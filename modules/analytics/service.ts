import "server-only";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { isStaffRole } from "@/modules/auth/constants";
import { classifyPath, classifySource, detectDevice, parseUtm, type PathInfo } from "./classify";
import { SESSION_COOKIE, VISITOR_COOKIE, validId } from "./cookie";

export type PageEventInput = {
  type: "VIEW" | "LEAVE";
  path: string;
  prevPath: string;
  referrer: string;
  search: string;
  durationSec?: number;
  scrollPct?: number;
  viewport?: number;
  visitorId: string;
  sessionId: string;
  isEntry: boolean;
  newVisitor: boolean;
  userId: string | null;
  userAgent: string | null;
  ownHost: string | null;
};

type Entity = { productId?: string; articleId?: string; categoryId?: string };

/** اسلاگ → شناسه. اسلاگ ناموجود = رویداد نادیده (جلوی مسیرهای ساختگی/اسپم را هم می‌گیرد). */
async function resolveEntity(info: PathInfo): Promise<Entity | null> {
  const { kind, slug } = info;
  if (!slug) return {};

  if (kind === "PRODUCT") {
    const row = await db.product.findUnique({ where: { slug }, select: { id: true } });
    return row ? { productId: row.id } : null;
  }
  if (kind === "ARTICLE") {
    const row = await db.article.findFirst({ where: { slug, status: "PUBLISHED" }, select: { id: true } });
    return row ? { articleId: row.id } : null;
  }
  if (kind === "CATEGORY") {
    const row = await db.category.findUnique({ where: { slug }, select: { id: true } });
    return row ? { categoryId: row.id } : null;
  }

  return {};
}

/** ثبت بازدید صفحه (VIEW) یا ماندگاری/اسکرول (LEAVE) برای مقاله و محصول. */
export async function recordPageEvent(input: PageEventInput): Promise<void> {
  const info = classifyPath(input.path);
  if (!info) return;

  const isLeave = input.type === "LEAVE";
  if (isLeave && info.kind !== "PRODUCT" && info.kind !== "ARTICLE") return;

  const entity = await resolveEntity(info);
  if (!entity) return;

  const prev = !isLeave && input.prevPath ? classifyPath(input.prevPath) : null;
  let fromArticleId: string | null = null;
  if (prev?.kind === "ARTICLE" && prev.slug && info.kind === "PRODUCT") {
    const article = await db.article.findFirst({ where: { slug: prev.slug }, select: { id: true } });
    fromArticleId = article?.id ?? null;
  }

  const entry = !isLeave && input.isEntry;
  const utm = entry ? parseUtm(input.search) : null;
  const origin = entry
    ? classifySource({
        referrer: input.referrer,
        utmSource: utm?.source ?? null,
        ownHost: input.ownHost,
        userAgent: input.userAgent,
      })
    : null;

  await db.analyticsEvent.create({
    data: {
      type: input.type,
      kind: info.kind,
      path: info.path,
      visitorId: input.visitorId,
      sessionId: input.sessionId,
      userId: input.userId,
      productId: entity.productId ?? null,
      articleId: entity.articleId ?? null,
      categoryId: entity.categoryId ?? null,
      isEntry: entry,
      newVisitor: entry && input.newVisitor,
      source: origin?.source ?? null,
      referrerHost: origin?.referrerHost ?? null,
      utmSource: utm?.source ?? null,
      utmMedium: utm?.medium ?? null,
      utmCampaign: utm?.campaign ?? null,
      prevKind: prev?.kind ?? null,
      fromArticleId,
      device: isLeave ? null : detectDevice(input.userAgent, input.viewport),
      durationSec: isLeave ? (input.durationSec ?? null) : null,
      scrollPct: isLeave ? (input.scrollPct ?? null) : null,
    },
  });
}

/**
 * «افزودن به سبد» از Server Action (هر خطایی بلعیده می‌شود تا سبد هرگز به‌خاطر آنالیتیکس خراب نشود).
 * اگر کوکی‌های آنالیتیکس نیست (ردیاب اجرا نشده/DNT) چیزی ثبت نمی‌شود.
 */
export async function trackAddToCart(productId: string): Promise<void> {
  try {
    const store = await cookies();
    const visitorId = validId(store.get(VISITOR_COOKIE)?.value);
    const sessionId = validId(store.get(SESSION_COOKIE)?.value);
    if (!visitorId || !sessionId) return;

    const user = await getCurrentUser();
    if (user && isStaffRole(user.role)) return;

    await db.analyticsEvent.create({
      data: { type: "ADD_TO_CART", kind: "PRODUCT", path: "/", visitorId, sessionId, userId: user?.id ?? null, productId },
    });
  } catch {
    // عمداً نادیده
  }
}
