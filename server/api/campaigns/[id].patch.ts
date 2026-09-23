import { getRouterParam, readBody } from "h3";
import { campaignPatchSchema } from "../../../shared/utils/campaign";
import { apiError, apiSuccess } from "../../utils/api";
import { writeAuditLog } from "../../utils/audit";
import { requireSession } from "../../utils/auth";
import { campaignScope, serializeCampaign } from "../../utils/campaign";
import { invalidateRedirectCampaignCache } from "../../utils/campaign-cache";

export default defineEventHandler(async (event) => {
  const session = await requireSession(event);
  const id = getRouterParam(event, "id");
  const userId = session.user?.id;

  if (!id || !userId) {
    apiError("INVALID_REQUEST", "Campaign ID is required.", 400);
  }

  const existing = await prisma.campaign.findFirst({
    where: {
      id,
      deleted_at: null,
      ...campaignScope(userId, session.user?.role ?? undefined),
    },
  });

  if (!existing) {
    apiError("CAMPAIGN_NOT_FOUND", "Campaign tidak ditemukan.", 404);
  }

  const body = await readBody(event);
  const parsed = campaignPatchSchema.safeParse(body);

  if (!parsed.success) {
    apiError("VALIDATION_ERROR", "Data campaign tidak valid.", 422, parsed.error.flatten());
  }

  const input = parsed.data;
  const campaign = await prisma.campaign.update({
    where: { id: existing.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.deviceHost !== undefined ? { device_host: input.deviceHost } : {}),
      ...(input.targetUrls !== undefined
        ? { target_url: input.targetUrls[0], target_urls: input.targetUrls }
        : input.targetUrl !== undefined
          ? { target_url: input.targetUrl, target_urls: [input.targetUrl] }
          : {}),
      ...(input.blockedUrl !== undefined ? { blocked_url: input.blockedUrl } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.startsAt !== undefined
        ? { starts_at: input.startsAt ? new Date(input.startsAt) : null }
        : {}),
      ...(input.expiresAt !== undefined
        ? { expires_at: input.expiresAt ? new Date(input.expiresAt) : null }
        : {}),
      ...(input.ruleConfig !== undefined
        ? { rule_config: input.ruleConfig }
        : {}),
      ...(input.trackingConfig !== undefined && input.trackingConfig !== null
        ? { tracking_config: input.trackingConfig }
        : {}),
    },
  });

  await invalidateRedirectCampaignCache(event, existing.short_code);

  await writeAuditLog(event, {
    action: "UPDATE",
    resource: "campaign",
    resourceId: campaign.id,
    oldValue: {
      name: existing.name,
      target_url: existing.target_url,
      target_urls: existing.target_urls,
      blocked_url: existing.blocked_url,
      status: existing.status,
      rule_config: existing.rule_config,
      tracking_config: existing.tracking_config,
    },
    newValue: {
      name: campaign.name,
      target_url: campaign.target_url,
      target_urls: campaign.target_urls,
      blocked_url: campaign.blocked_url,
      status: campaign.status,
      rule_config: campaign.rule_config,
      tracking_config: campaign.tracking_config,
    },
  });

  return apiSuccess(event, serializeCampaign(campaign), "Campaign updated successfully.");
});
