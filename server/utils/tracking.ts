import { randomUUID } from "node:crypto";
import { trackingConfigSchema } from "../../shared/utils/tracking";

export type TrackingEventName = "page_view" | "conversion" | "lead" | "purchase";

export async function dispatchTrackingEvent(params: {
  configValue: unknown;
  eventName: TrackingEventName;
  shortCode: string;
  requestOrigin: string;
}): Promise<Record<string, "sent" | "skipped" | "failed">> {
  const parsed = trackingConfigSchema.safeParse(params.configValue);
  const config = parsed.success ? parsed.data : null;
  if (!config?.enabled) return {};

  const runtime = useRuntimeConfig();
  const results: Record<string, "sent" | "skipped" | "failed"> = {};
  const eventId = randomUUID();

  if (config.ga4MeasurementId && runtime.GA4_API_SECRET) {
    try {
      await $fetch("https://www.google-analytics.com/mp/collect", {
        method: "POST",
        query: {
          measurement_id: config.ga4MeasurementId,
          api_secret: runtime.GA4_API_SECRET,
        },
        body: {
          client_id: eventId,
          events: [{ name: params.eventName, params: { campaign_code: params.shortCode } }],
        },
      });
      results.ga4 = "sent";
    } catch (error) {
      console.error("GA4 tracking failed", error);
      results.ga4 = "failed";
    }
  } else if (config.ga4MeasurementId) {
    results.ga4 = "skipped";
  }

  if (config.metaPixelId && runtime.META_CAPI_ACCESS_TOKEN) {
    try {
      const graphVersion = runtime.META_GRAPH_VERSION || "v20.0";
      await $fetch(`https://graph.facebook.com/${graphVersion}/${config.metaPixelId}/events`, {
        method: "POST",
        query: { access_token: runtime.META_CAPI_ACCESS_TOKEN },
        body: {
          data: [{
            event_name: params.eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventId,
            action_source: "website",
            event_source_url: `${params.requestOrigin}/r/${params.shortCode}`,
          }],
        },
      });
      results.meta = "sent";
    } catch (error) {
      console.error("Meta CAPI tracking failed", error);
      results.meta = "failed";
    }
  } else if (config.metaPixelId) {
    results.meta = "skipped";
  }

  if (config.tiktokPixelId && runtime.TIKTOK_ACCESS_TOKEN) {
    try {
      const tiktokBody = {
        event_source: "web",
        event_source_id: config.tiktokPixelId,
        data: [
          {
            event: params.eventName,
            event_id: eventId,
            timestamp: new Date().toISOString(),
          },
        ],
      };
      await $fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
        method: "POST",
        headers: { "Access-Token": runtime.TIKTOK_ACCESS_TOKEN },
        body: tiktokBody,
      });
      results.tiktok = "sent";
    } catch (error) {
      console.error("TikTok tracking failed", error);
      results.tiktok = "failed";
    }
  } else if (config.tiktokPixelId) {
    results.tiktok = "skipped";
  }
  if (config.histatsId) results.histats = "skipped";

  return results;
}
