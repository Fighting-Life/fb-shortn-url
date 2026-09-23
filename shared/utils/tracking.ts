import * as z from "zod";

const providerId = z.string().trim().max(128).optional().nullable();

export const trackingConfigSchema = z.object({
  enabled: z.boolean().optional(),
  consentRequired: z.boolean().optional(),
  ga4MeasurementId: providerId,
  metaPixelId: providerId,
  tiktokPixelId: providerId,
  histatsId: providerId,
}).optional().nullable();

export type TrackingConfig = z.infer<typeof trackingConfigSchema>;

export function publicTrackingConfig(value: unknown) {
  const parsed = trackingConfigSchema.safeParse(value);
  if (!parsed.success || !parsed.data) return null;

  return {
    enabled: parsed.data.enabled === true,
    consentRequired: parsed.data.consentRequired !== false,
    ga4MeasurementId: parsed.data.ga4MeasurementId || null,
    metaPixelId: parsed.data.metaPixelId || null,
    tiktokPixelId: parsed.data.tiktokPixelId || null,
    histatsId: parsed.data.histatsId || null,
  };
}
