-- CreateEnum
CREATE TYPE "ClickOutcome" AS ENUM ('target', 'blocked', 'expired', 'bot');

-- CreateTable
CREATE TABLE "click_events" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "outcome" "ClickOutcome" NOT NULL,
    "device" VARCHAR(32),
    "country" CHAR(2),
    "referrer_host" VARCHAR(255),
    "ip_hash" CHAR(64),
    "attribution_hash" CHAR(64),
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "click_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_campaign_metrics" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "metric_date" DATE NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "target_clicks" INTEGER NOT NULL DEFAULT 0,
    "blocked_clicks" INTEGER NOT NULL DEFAULT 0,
    "bot_clicks" INTEGER NOT NULL DEFAULT 0,
    "expired_clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "daily_campaign_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "click_event_campaign_time_idx" ON "click_events"("campaign_id", "occurred_at");

-- CreateIndex
CREATE INDEX "click_event_outcome_time_idx" ON "click_events"("outcome", "occurred_at");

-- CreateIndex
CREATE INDEX "click_event_country_time_idx" ON "click_events"("country", "occurred_at");

-- CreateIndex
CREATE INDEX "daily_campaign_metric_date_idx" ON "daily_campaign_metrics"("metric_date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_campaign_metrics_campaign_id_metric_date_key" ON "daily_campaign_metrics"("campaign_id", "metric_date");

-- AddForeignKey
ALTER TABLE "click_events" ADD CONSTRAINT "click_events_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_campaign_metrics" ADD CONSTRAINT "daily_campaign_metrics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
