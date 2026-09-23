import { getRouterParam } from "h3";
import { apiSuccess } from "../../utils/api";
import { requireSession } from "../../utils/auth";
import { campaignScope, serializeCampaign } from "../../utils/campaign";

export default defineEventHandler(async (event) => {
  const session = await requireSession(event);
  const id = getRouterParam(event, "id");
  const userId = session.user?.id;

  if (!id || !userId) {
    throw createError({ statusCode: 400, statusMessage: "Campaign ID is required" });
  }

  const campaign = await prisma.campaign.findFirst({
    where: {
      id,
      deleted_at: null,
      ...campaignScope(userId, session.user?.role ?? undefined),
    },
  });

  if (!campaign) {
    throw createError({ statusCode: 404, statusMessage: "Campaign not found" });
  }

  return apiSuccess(event, serializeCampaign(campaign), "Campaign loaded successfully.");
});
