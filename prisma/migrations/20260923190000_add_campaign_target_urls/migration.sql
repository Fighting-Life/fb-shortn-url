-- Add optional destination pool while preserving target_url for backwards compatibility.
ALTER TABLE "campaigns" ADD COLUMN "target_urls" JSONB;

-- Backfill existing campaigns into a one-item destination pool.
UPDATE "campaigns"
SET "target_urls" = jsonb_build_array("target_url")
WHERE "target_urls" IS NULL;
