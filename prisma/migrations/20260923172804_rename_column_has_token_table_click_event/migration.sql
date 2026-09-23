/*
  Warnings:

  - You are about to drop the column `hash_code` on the `click_events` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `click_events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "click_events" DROP COLUMN "hash_code",
DROP COLUMN "token",
ADD COLUMN     "generated_fbclid" VARCHAR(128),
ADD COLUMN     "generated_htoken" VARCHAR(128);
