import { getRouterParam, sendRedirect, setHeader } from "h3";


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
  const rotatedTarget = selectRotatedTarget(campaign.target_urls, campaign.target_url);
  const selectedTarget = useBlockedDestination
    ? campaign.blocked_url
    : rotatedTarget;

  const config = parseRuleConfig(campaign.rule_config);
  let outcome: "target" | "blocked" | "expired" | "bot" = outsideSchedule
    ? "expired"
    : config.blockBots && context.isBot
      ? "bot"
      : blockedByRule
        ? "blocked"
        : "target";


  if (outcome === "target") {
    const rateCheck = await checkClickRateLimit(event, context.ip);
    if (!rateCheck.allowed) {
      outcome = "bot";
    }
  }

  let destination: string;
  if (outcome === "target") {
    const trackingConfig = (campaign.tracking_config as any) ?? {};

    const deviceHost: DeviceType =
      campaign.device_host ?? mapContextToDeviceHost(context.device);

    const baseTarget = appendAllowedAttribution(selectedTarget, event);

    const requestUrl = getRequestURL(event);
    const fbclid =
      requestUrl.searchParams.get("fbclid") ??
      requestUrl.searchParams.get("fbtoken") ??
      undefined;

    const secret =
      String(useRuntimeConfig().TRACKING_SECRET || "default-secret");
    const hToken = fbclid
      ? generateHmacToken(`${campaign.id}:${fbclid}:${now}`, secret, 64)
      : undefined;

    const rateCheck = await checkClickRateLimit(event, context.ip);
    if (!rateCheck.allowed && outcome === "target") {
      outcome = "bot";
      destination = campaign.blocked_url;
    }

    try {
      const generated = generateFreshClickUrl({
        device: deviceHost,
        targetUrl: baseTarget,
        campaignId: campaign.id,
        context: {
          ip: context.ip,
          userAgent: context.userAgent,
          country: context.country,
        },
        deterministic: trackingConfig.deterministicFbclid ?? false,
        extraParams: {
          __tn__: "H-R",
          ...(trackingConfig.extraParams ?? {}),
        },
      });
      destination = generated.finalUrl;
    } catch (err) {
      console.error("buildFbUrl failed, fallback ke target asli", err);
      destination = baseTarget;
    }
  } else {
    // destination = appendAllowedAttribution(selectedTarget, event);
    destination = campaign.blocked_url;
  }

  try {
    await recordClickEvent(event, campaign.id, outcome, context);
  } catch (error) {
    console.error("Failed to record click analytics", error);
  }

  setHeader(event, "Cache-Control", "no-store, max-age=0");
  setHeader(event, "Referrer-Policy", "strict-origin-when-cross-origin");

  return sendRedirect(event, destination, 302);
});

function mapContextToDeviceHost(device: string): DeviceType {
  switch (device) {
    case "desktop": return "desktop";
    case "mobile": return "mobile";
    case "tablet": return "mobile";
    case "ios": return "ios";
    case "android": return "android";
    default: return "web";
  }
}
