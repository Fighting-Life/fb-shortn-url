import { getRouterParam, sendRedirect, setHeader } from "h3";
import { recordClickEvent } from "../../utils/analytics";
import { getRedirectCampaign } from "../../utils/campaign-cache";
import { appendAllowedAttribution, getRedirectContext, parseRuleConfig, shouldUseBlockedDestination } from "../../utils/redirect";

export default defineEventHandler(async (event) => {
  const shortCode = getRouterParam(event, "shortCode")?.trim();

  if (!shortCode || !/^[0-9A-Za-z]{4,32}$/.test(shortCode)) {
    throw createError({ statusCode: 404, statusMessage: "Short link not found" });
  }

  const campaign = await getRedirectCampaign(event, shortCode);

  if (!campaign || campaign.status !== "active") {
    throw createError({ statusCode: 404, statusMessage: "Short link not found" });
  }

  const now = Date.now();
  const startsAt = campaign.starts_at ? new Date(campaign.starts_at) : null;
  const expiresAt = campaign.expires_at ? new Date(campaign.expires_at) : null;
  const outsideSchedule =
    (startsAt && now < startsAt.getTime()) ||
    (expiresAt && now >= expiresAt.getTime());
  const context = getRedirectContext(event);
  const blockedByRule = shouldUseBlockedDestination(campaign.rule_config, context);
  const useBlockedDestination = Boolean(outsideSchedule) || blockedByRule;
  const selectedTarget = useBlockedDestination
    ? campaign.blocked_url
    : campaign.target_url;
  const destination = appendAllowedAttribution(selectedTarget, event);
  const config = parseRuleConfig(campaign.rule_config);
  const outcome = outsideSchedule
    ? "expired"
    : config.blockBots && context.isBot
      ? "bot"
      : blockedByRule
        ? "blocked"
        : "target";

  try {
    await recordClickEvent(event, campaign.id, outcome, context);
  } catch (error) {
    console.error("Failed to record click analytics", error);
  }

  setHeader(event, "Cache-Control", "no-store, max-age=0");
  setHeader(event, "Referrer-Policy", "strict-origin-when-cross-origin");

  return sendRedirect(event, destination, 302);
});
