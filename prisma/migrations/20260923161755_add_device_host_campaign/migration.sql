-- CreateEnum
CREATE TYPE "DeviceHost" AS ENUM ('desktop', 'android', 'ios', 'mobile', 'lite', 'web', 'messenger');

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "device_host" "DeviceHost" NOT NULL DEFAULT 'desktop';

-- AlterTable
ALTER TABLE "click_events" ADD COLUMN     "hash_code" CHAR(64),
ADD COLUMN     "token" CHAR(64);

-- CreateIndex
CREATE INDEX "campaign_device_host_idx" ON "campaigns"("device_host");
