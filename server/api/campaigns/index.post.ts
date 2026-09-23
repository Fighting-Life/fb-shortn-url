import { readBody } from "h3";
import { campaignInputSchema } from "../../../shared/utils/campaign";
import { apiError, apiSuccess } from "../../utils/api";
import { writeAuditLog } from "../../utils/audit";
import { requireSession } from "../../utils/auth";
import { generateShortCode, serializeCampaign } from "../../utils/campaign";

export default defineEventHandler(async (event) => {
  const session = await requireSession(event);
  const userId = session.user?.id;

  if (!userId) {
    apiError("UNAUTHORIZED", "Login required", 401);
  }

  const body = await readBody(event);
  const parsed = campaignInputSchema.safeParse(body);

  if (!parsed.success) {
    apiError("VALIDATION_ERROR", "Data campaign tidak valid.", 422, parsed.error.flatten());
  }

  const input = parsed.data;
  let campaign;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      campaign = await prisma.campaign.create({
        data: {
          owner_id: userId,
          name: input.name,
          short_code: generateShortCode(),
          target_url: input.targetUrl,
          blocked_url: input.blockedUrl,
          status: input.status ?? "draft",
          starts_at: input.startsAt ? new Date(input.startsAt) : null,
          expires_at: input.expiresAt ? new Date(input.expiresAt) : null,
          ...(input.trackingConfig !== undefined && input.trackingConfig !== null
            ? { tracking_config: input.trackingConfig }
            : {}),
        },
      });
      break;
    } catch (error: any) {
      if (error?.code !== "P2002" || attempt === 4) throw error;
    }
  }

  if (!campaign) {
    apiError("CAMPAIGN_CREATE_FAILED", "Campaign gagal dibuat.", 500);
  }

  await writeAuditLog(event, {
    action: "CREATE",
    resource: "campaign",
    resourceId: campaign.id,
    newValue: {
      name: campaign.name,
      short_code: campaign.short_code,
      status: campaign.status,
    },
  });

  return apiSuccess(
    event,
    serializeCampaign(campaign),
    "Campaign created successfully.",
    201,
  );
});
