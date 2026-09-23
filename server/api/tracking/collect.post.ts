import { readBody } from "h3";
import { publicTrackingConfig } from "../../../shared/utils/tracking";
import { apiError, apiSuccess, checkReliableRateLimit, getClientIp } from "../../utils/api";
import { dispatchTrackingEvent, type TrackingEventName } from "../../utils/tracking";

const eventNames = ["page_view", "conversion", "lead", "purchase"] as const;

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event);
  const shortCode = typeof body.shortCode === "string" ? body.shortCode.trim() : "";
  const consent = body.consent === true;
  const eventName = typeof body.eventName === "string" ? body.eventName : "page_view";

  if (!(await checkReliableRateLimit(event, `tracking:${getClientIp(event)}:${shortCode}`, 60, 60_000))) {
    apiError("RATE_LIMITED", "Too many tracking events.", 429);
  }

  if (!/^[0-9A-Za-z]{4,32}$/.test(shortCode)) apiError("INVALID_SHORT_CODE", "Short code tidak valid.", 422);
  if (!eventNames.includes(eventName as (typeof eventNames)[number])) apiError("INVALID_EVENT", "Tracking event tidak valid.", 422);

  const campaign = await prisma.campaign.findFirst({
    where: { short_code: shortCode, status: "active", deleted_at: null },
    select: { tracking_config: true },
  });
  if (!campaign) apiError("CAMPAIGN_NOT_FOUND", "Campaign tidak ditemukan.", 404);

  const config = publicTrackingConfig(campaign.tracking_config);
  if (!config?.enabled) {
    return apiSuccess(event, { accepted: false, reason: "tracking_disabled" }, "Tracking disabled.");
  }
  if (config.consentRequired && !consent) {
    return apiSuccess(event, { accepted: false, reason: "consent_required" }, "Consent required.");
  }

  const results = await dispatchTrackingEvent({
    configValue: campaign.tracking_config,
    eventName: eventName as TrackingEventName,
    shortCode,
    requestOrigin: getRequestURL(event).origin,
  });

  return apiSuccess(event, { accepted: true, providers: results }, "Tracking event accepted.");
});
