import { getQuery } from "h3";
import { publicTrackingConfig } from "../../../shared/utils/tracking";

export default defineEventHandler(async (event) => {
  const shortCode = getQuery(event).shortCode;
  if (typeof shortCode !== "string" || !/^[0-9A-Za-z]{4,32}$/.test(shortCode)) {
    throw createError({ statusCode: 400, statusMessage: "Short code is required" });
  }

  const campaign = await prisma.campaign.findFirst({
    where: { short_code: shortCode, status: "active", deleted_at: null },
    select: { tracking_config: true },
  });

  if (!campaign) throw createError({ statusCode: 404, statusMessage: "Campaign not found" });
  return { status: 200, success: true, message: "Tracking config loaded.", data: publicTrackingConfig(campaign.tracking_config) };
});
