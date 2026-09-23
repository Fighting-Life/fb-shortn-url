import { getRouterParam, sendRedirect, setHeader } from "h3";
import { appendAllowedAttribution, getRedirectContext, shouldUseBlockedDestination } from "../../utils/redirect";

export default defineEventHandler(async (event) => {
  const shortCode = getRouterParam(event, "shortCode")?.trim();

  if (!shortCode || !/^[0-9A-Za-z]{4,32}$/.test(shortCode)) {
    throw createError({ statusCode: 404, statusMessage: "Short link not found" });
  }

  const campaign = await prisma.campaign.findFirst({
    where: {
      short_code: shortCode,
      deleted_at: null,
    },
    select: {
      target_url: true,
      blocked_url: true,
      status: true,
      starts_at: true,
      expires_at: true,
      rule_config: true,
    },
  });

  if (!campaign || campaign.status !== "active") {
    throw createError({ statusCode: 404, statusMessage: "Short link not found" });
  }

  const now = Date.now();
  const outsideSchedule =
    (campaign.starts_at && now < campaign.starts_at.getTime()) ||
    (campaign.expires_at && now >= campaign.expires_at.getTime());
  const context = getRedirectContext(event);
  const useBlockedDestination =
    Boolean(outsideSchedule) ||
    shouldUseBlockedDestination(campaign.rule_config, context);
  const selectedTarget = useBlockedDestination
    ? campaign.blocked_url
    : campaign.target_url;
  const destination = appendAllowedAttribution(selectedTarget, event);

  setHeader(event, "Cache-Control", "no-store, max-age=0");
  setHeader(event, "Referrer-Policy", "strict-origin-when-cross-origin");

  return sendRedirect(event, destination, 302);
});
