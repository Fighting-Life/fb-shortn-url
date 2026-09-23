import { getAnalyticsRange } from "../../utils/analytics-query";
import { apiSuccess } from "../../utils/api";
import { requireSession } from "../../utils/auth";
import { campaignScope } from "../../utils/campaign";

export default defineEventHandler(async (event) => {
  const session = await requireSession(event);
  const userId = session.user?.id;

  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: "Login required" });
  }

  const { from, to } = getAnalyticsRange(event);
  const scope = campaignScope(userId, session.user?.role ?? undefined);
  const campaigns = await prisma.campaign.findMany({
    where: { deleted_at: null, ...scope },
    select: { id: true, name: true, short_code: true },
  });
  const campaignIds = campaigns.map((campaign) => campaign.id);

  if (!campaignIds.length) {
    return apiSuccess(event, {
      range: { from: from.toISOString(), to: to.toISOString() },
      totals: { clicks: 0, target_clicks: 0, blocked_clicks: 0, bot_clicks: 0, expired_clicks: 0 },
      daily: [],
      top_campaigns: [],
    }, "Analytics loaded successfully.");
  }

  const metrics = await prisma.dailyCampaignMetric.findMany({
    where: {
      campaign_id: { in: campaignIds },
      metric_date: { gte: from, lte: to },
    },
    orderBy: { metric_date: "asc" },
  });

  const campaignById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
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

  const dailyMap = new Map<string, { date: string; clicks: number; target_clicks: number; blocked_clicks: number }>();
  const topMap = new Map<string, { campaign_id: string; name: string; short_code: string; clicks: number; blocked_clicks: number }>();

  for (const metric of metrics) {
    const date = metric.metric_date.toISOString().slice(0, 10);
    const daily = dailyMap.get(date) ?? { date, clicks: 0, target_clicks: 0, blocked_clicks: 0 };
    daily.clicks += metric.clicks;
    daily.target_clicks += metric.target_clicks;
    daily.blocked_clicks += metric.blocked_clicks;
    dailyMap.set(date, daily);

    const campaign = campaignById.get(metric.campaign_id);
    if (!campaign) continue;
    const top = topMap.get(metric.campaign_id) ?? {
      campaign_id: campaign.id,
      name: campaign.name,
      short_code: campaign.short_code,
      clicks: 0,
      blocked_clicks: 0,
    };
    top.clicks += metric.clicks;
    top.blocked_clicks += metric.blocked_clicks;
    topMap.set(metric.campaign_id, top);
  }

  return apiSuccess(event, {
    range: { from: from.toISOString(), to: to.toISOString() },
    totals,
    daily: [...dailyMap.values()],
    top_campaigns: [...topMap.values()].sort((a, b) => b.clicks - a.clicks).slice(0, 10),
  }, "Analytics loaded successfully.");
});
