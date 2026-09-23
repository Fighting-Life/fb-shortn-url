import type { H3Event } from "h3";
import { useRedis } from "./redis";

type RedirectCampaign = {
  id: string;
  target_url: string;
  blocked_url: string;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  rule_config: unknown;
};

function cacheKey(shortCode: string) {
  const config = useRuntimeConfig();
  const prefix = config.CACHE_PREFIX || "shortn";
  return `${prefix}:campaign:redirect:${shortCode}`;
}

function cacheTtl() {
  const value = Number(useRuntimeConfig().CACHE_TTL || 60);
  return Number.isFinite(value) && value > 0 ? Math.min(value, 3600) : 60;
}

export async function getRedirectCampaign(
  event: H3Event,
  shortCode: string,
): Promise<RedirectCampaign | null> {
  const key = cacheKey(shortCode);
  const { getCache, setCache } = useRedis(event);

  try {
    const cached = await getCache<RedirectCampaign>(key);
    if (cached) return cached;
  } catch (error) {
    console.warn("Campaign cache read failed; using database", error);
  }

  const campaign = await prisma.campaign.findFirst({
    where: { short_code: shortCode, deleted_at: null },
    select: {
      id: true,
      target_url: true,
      blocked_url: true,
      status: true,
      starts_at: true,
      expires_at: true,
      rule_config: true,
    },
  });

  if (!campaign) return null;

  const value: RedirectCampaign = {
    ...campaign,
    starts_at: campaign.starts_at?.toISOString() ?? null,
    expires_at: campaign.expires_at?.toISOString() ?? null,
  };

  try {
    await setCache(key, value, cacheTtl());
  } catch (error) {
    console.warn("Campaign cache write failed", error);
  }

  return value;
}

export async function invalidateRedirectCampaignCache(event: H3Event, shortCode: string) {
  try {
    await useRedis(event).deleteCache(cacheKey(shortCode));
  } catch (error) {
    console.warn("Campaign cache invalidation failed", error);
  }
}
