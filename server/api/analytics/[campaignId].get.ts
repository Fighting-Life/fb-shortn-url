import { getRouterParam } from "h3";
import { getAnalyticsRange } from "../../utils/analytics-query";
import { apiSuccess } from "../../utils/api";
import { requireSession } from "../../utils/auth";
import { campaignScope } from "../../utils/campaign";

export default defineEventHandler(async (event) => {
  const session = await requireSession(event);
  const campaignId = getRouterParam(event, "campaignId");
  const userId = session.user?.id;

  if (!campaignId || !userId) {
    throw createError({ statusCode: 400, statusMessage: "Campaign ID is required" });
  }

  const { from, to } = getAnalyticsRange(event);
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      deleted_at: null,
      ...campaignScope(userId, session.user?.role ?? undefined),
    },
    select: { id: true, name: true, short_code: true },
  });

  if (!campaign) {
    throw createError({ statusCode: 404, statusMessage: "Campaign not found" });
  }

  const [metrics, events] = await prisma.$transaction([
    prisma.dailyCampaignMetric.findMany({
      where: { campaign_id: campaign.id, metric_date: { gte: from, lte: to } },
      orderBy: { metric_date: "asc" },
    }),
    prisma.clickEvent.findMany({
      where: { campaign_id: campaign.id, occurred_at: { gte: from, lte: to } },
      select: { outcome: true, device: true, country: true },
      take: 10000,
    }),
  ]);

  const totals = metrics.reduce(
    (result, metric) => {
      result.clicks += metric.clicks;
      result.target_clicks += metric.target_clicks;
      result.blocked_clicks += metric.blocked_clicks;
      result.bot_clicks += metric.bot_clicks;
      result.expired_clicks += metric.expired_clicks;
      return result;
    },
    { clicks: 0, target_clicks: 0, blocked_clicks: 0, bot_clicks: 0, expired_clicks: 0 },
  );

  const deviceMap = new Map<string, number>();
  const countryMap = new Map<string, number>();
  for (const click of events) {
    if (click.device) deviceMap.set(click.device, (deviceMap.get(click.device) ?? 0) + 1);
    if (click.country) countryMap.set(click.country, (countryMap.get(click.country) ?? 0) + 1);
  }

  return apiSuccess(event, {
    campaign,
    range: { from: from.toISOString(), to: to.toISOString() },
    totals,
    daily: metrics.map((metric) => ({
      date: metric.metric_date.toISOString().slice(0, 10),
      clicks: metric.clicks,
      target_clicks: metric.target_clicks,
      blocked_clicks: metric.blocked_clicks,
    })),
    by_device: [...deviceMap.entries()].map(([device, clicks]) => ({ device, clicks })).sort((a, b) => b.clicks - a.clicks),
    by_country: [...countryMap.entries()].map(([country, clicks]) => ({ country, clicks })).sort((a, b) => b.clicks - a.clicks),
  }, "Campaign analytics loaded successfully.");
});
