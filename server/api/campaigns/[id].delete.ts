import { getRouterParam } from "h3";
import { apiSuccess } from "../../utils/api";
import { writeAuditLog } from "../../utils/audit";
import { requireSession } from "../../utils/auth";
import { campaignScope } from "../../utils/campaign";
import { invalidateRedirectCampaignCache } from "../../utils/campaign-cache";

export default defineEventHandler(async (event) => {
  const session = await requireSession(event);
  const id = getRouterParam(event, "id");
  const userId = session.user?.id;

  if (!id || !userId) {
    throw createError({ statusCode: 400, statusMessage: "Campaign ID is required" });
  }

  const existing = await prisma.campaign.findFirst({
    where: {
      id,
      deleted_at: null,
      ...campaignScope(userId, session.user?.role ?? undefined),
    },
  });

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Campaign not found" });
  }

  await prisma.campaign.update({
    where: { id: existing.id },
    data: {
      status: "archived",
      deleted_at: new Date(),
    },
  });

  await invalidateRedirectCampaignCache(event, existing.short_code);

  await writeAuditLog(event, {
    action: "ARCHIVE",
    resource: "campaign",
    resourceId: existing.id,
    oldValue: {
      name: existing.name,
      status: existing.status,
    },
    newValue: {
      status: "archived",
    },
  });

  return apiSuccess(event, null, "Campaign archived successfully.");
});
