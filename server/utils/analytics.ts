import type { ClickOutcome } from "@prisma/client";
import type { H3Event } from "h3";
import { createHmac } from "node:crypto";
import type { RedirectContext } from "./redirect";

function trackingSecret(): string {
  const config = useRuntimeConfig();
  return String(
    config.TRACKING_SECRET ||
    config.NUXT_SESSION_PASSWORD ||
    process.env.TRACKING_SECRET ||
    "tracking-secret-not-configured",
  );
}

export function hashAnalyticsValue(value: string | null | undefined): string | null {
  if (!value) return null;
  return createHmac("sha256", trackingSecret()).update(value).digest("hex");
}

function referrerHost(event: H3Event): string | null {
  const referrer = getHeader(event, "referer") || getHeader(event, "referrer");
  if (!referrer) return null;

  try {
    return new URL(referrer).hostname.slice(0, 255) || null;
  } catch {
    return null;
  }
}

function metricDate(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function recordClickEvent(
  event: H3Event,
  campaignId: string,
  outcome: ClickOutcome,
  context: RedirectContext,
  generated?: { fbclid?: string; hToken?: string },
): Promise<void> {
  const now = new Date();
  const metricDay = metricDate(now);
  const requestUrl = getRequestURL(event);
  const attribution = requestUrl.searchParams.get("fbclid");
  const ipHash = hashAnalyticsValue(context.ip);
  const attributionHash = hashAnalyticsValue(attribution);

  const increments = {
    clicks: { increment: 1 },
    target_clicks: { increment: outcome === "target" ? 1 : 0 },
    blocked_clicks: { increment: outcome === "blocked" ? 1 : 0 },
    bot_clicks: { increment: outcome === "bot" ? 1 : 0 },
    expired_clicks: { increment: outcome === "expired" ? 1 : 0 },
  };

  await prisma.$transaction([
    prisma.clickEvent.create({
      data: {
        campaign_id: campaignId,
        outcome,
        device: context.device,
        country: context.country,
        referrer_host: referrerHost(event),
        ip_hash: ipHash,
        attribution_hash: attributionHash,
        generated_fbclid: generated?.fbclid ?? null,
        generated_htoken: generated?.hToken ?? null,
        occurred_at: now,
      },
    }),
    prisma.dailyCampaignMetric.upsert({
      where: {
        daily_campaign_metric_campaign_date_unique: {
          campaign_id: campaignId,
          metric_date: metricDay,
        },
      },
      create: {
        campaign_id: campaignId,
        metric_date: metricDay,
        clicks: 1,
        target_clicks: outcome === "target" ? 1 : 0,
        blocked_clicks: outcome === "blocked" ? 1 : 0,
        bot_clicks: outcome === "bot" ? 1 : 0,
        expired_clicks: outcome === "expired" ? 1 : 0,
      },
      update: increments,
    }),
  ]);
}
