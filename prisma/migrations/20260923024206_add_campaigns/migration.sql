-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'active', 'paused', 'archived', 'blocked');

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "short_code" VARCHAR(32) NOT NULL,
    "target_url" TEXT NOT NULL,
    "blocked_url" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "starts_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "rule_config" JSONB,
    "tracking_config" JSONB,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_short_code_key" ON "campaigns"("short_code");

-- CreateIndex
CREATE INDEX "campaign_owner_status_idx" ON "campaigns"("owner_id", "status");

-- CreateIndex
CREATE INDEX "campaign_status_created_idx" ON "campaigns"("status", "created_at");

-- CreateIndex
CREATE INDEX "campaign_deleted_idx" ON "campaigns"("deleted_at");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
