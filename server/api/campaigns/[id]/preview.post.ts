import { getRouterParam } from "h3";
import { apiSuccess } from "../../../utils/api";
import { requireSession } from "../../../utils/auth";
import { campaignScope } from "../../../utils/campaign";

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
    select: {
      id: true,
      name: true,
      short_code: true,
      target_url: true,
      blocked_url: true,
      status: true,
    },
  });

  if (!campaign) {
    throw createError({ statusCode: 404, statusMessage: "Campaign not found" });
  }

  const baseUrl =
    useRuntimeConfig().public.PUBLIC_SITE_URL || getRequestURL(event).origin;

  return apiSuccess(event, {
    ...campaign,
    short_url: `${baseUrl.replace(/\/$/, "")}/r/${campaign.short_code}`,
  }, "Campaign preview generated successfully.");
});
