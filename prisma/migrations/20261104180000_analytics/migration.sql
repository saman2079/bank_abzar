-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "productId" TEXT,
    "articleId" TEXT,
    "categoryId" TEXT,
    "isEntry" BOOLEAN NOT NULL DEFAULT false,
    "newVisitor" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "referrerHost" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "prevKind" TEXT,
    "fromArticleId" TEXT,
    "device" TEXT,
    "durationSec" INTEGER,
    "scrollPct" INTEGER,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_type_kind_createdAt_idx" ON "AnalyticsEvent"("type", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_productId_type_createdAt_idx" ON "AnalyticsEvent"("productId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_articleId_type_createdAt_idx" ON "AnalyticsEvent"("articleId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_visitorId_createdAt_idx" ON "AnalyticsEvent"("visitorId", "createdAt");
