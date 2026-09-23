import * as z from "zod";
import { trackingConfigSchema } from "./tracking";

export const redirectDeviceSchema = z.enum([
  "desktop",
  "mobile",
  "tablet",
  "ios",
  "android",
  "unknown",
]);

const ipv4Part = "(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
const ipv4Pattern = new RegExp(`^${ipv4Part}(?:\\.${ipv4Part}){3}$`);
const ipv4CidrPattern = new RegExp(`^${ipv4Part}(?:\\.${ipv4Part}){3}\\/(?:[0-9]|[12]\\d|3[0-2])$`);

const ipOrCidrSchema = z.string().trim().refine(
  (value) => ipv4Pattern.test(value) || ipv4CidrPattern.test(value),
  "IP harus berupa IPv4 atau IPv4 CIDR yang valid.",
);

const countryCodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "Country harus ISO alpha-2.");

const ruleListSchema = z.object({
  allow: z.array(z.string().trim().min(1)).max(200).default([]),
  exclude: z.array(z.string().trim().min(1)).max(200).default([]),
});

export const ruleConfigSchema = z.object({
  device: ruleListSchema.extend({
    allow: z.array(redirectDeviceSchema).max(6).default([]),
    exclude: z.array(redirectDeviceSchema).max(6).default([]),
  }).default({}),
  country: ruleListSchema.extend({
    allow: z.array(countryCodeSchema).max(200).default([]),
    exclude: z.array(countryCodeSchema).max(200).default([]),
  }).default({}),
  ip: ruleListSchema.extend({
    allow: z.array(ipOrCidrSchema).max(200).default([]),
    exclude: z.array(ipOrCidrSchema).max(200).default([]),
  }).default({}),
  blockBots: z.boolean().default(false),
});

export type CampaignRuleConfig = z.infer<typeof ruleConfigSchema>;

const PRIVATE_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.google.com",
]);

const PRIVATE_IPV4_RANGES = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^0\./,
];

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (PRIVATE_HOSTNAMES.has(host) || host.endsWith(".local")) return true;
  if (PRIVATE_IPV4_RANGES.some((pattern) => pattern.test(host))) return true;
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd")) {
    return true;
  }

  return false;
}

export function normalizeSafeUrl(value: string): string {
  const input = value.trim();
  if (!input) throw new Error("URL wajib diisi.");

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error("URL tidak valid.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("URL harus menggunakan HTTPS.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("URL dengan username atau password tidak diizinkan.");
  }

  if (isPrivateHostname(parsed.hostname)) {
    throw new Error("URL menuju host lokal atau jaringan private tidak diizinkan.");
  }

  return parsed.toString();
}

export const safeUrlSchema = z.string().trim()
  .superRefine((value, context) => {
    try {
      normalizeSafeUrl(value);
    } catch (error) {
      context.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "URL tidak valid.",
      });
    }
  })
  .transform((value) => new URL(value).toString());

const targetUrlsSchema = z.array(safeUrlSchema).min(1, "Minimal satu target URL wajib diisi.").max(50, "Maksimal 50 target URL per campaign.");

const validateCampaignDates = (
  value: { startsAt?: string | null; expiresAt?: string | null },
  context: z.RefinementCtx,
) => {
  if (value.startsAt && value.expiresAt) {
    const startsAt = new Date(value.startsAt);
    const expiresAt = new Date(value.expiresAt);

    if (expiresAt <= startsAt) {
      context.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "Waktu berakhir harus setelah waktu mulai.",
      });
    }
  }
};

export const campaignInputBaseSchema = z.object({
  name: z.string().trim().min(2, "Nama campaign minimal 2 karakter.").max(160),
  deviceHost: z.enum(["desktop", "mobile", "ios", "android", "lite", "web", "messenger"]).default("desktop"),
  targetUrl: safeUrlSchema,
  targetUrls: targetUrlsSchema.optional(),
  blockedUrl: safeUrlSchema,
  startsAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  status: z.enum(["draft", "active", "paused", "archived", "blocked"]).optional(),
  ruleConfig: ruleConfigSchema.optional(),
  trackingConfig: trackingConfigSchema,
});

export const campaignInputSchema = campaignInputBaseSchema.superRefine(
  (value, context) => {
    validateCampaignDates(value, context);
    if (value.targetUrls?.[0] && value.targetUrls[0] !== value.targetUrl) {
      context.addIssue({
        code: "custom",
        path: ["targetUrls"],
        message: "Target URL utama harus sama dengan URL pertama pada daftar.",
      });
    }
  },
);

export const campaignPatchSchema = campaignInputBaseSchema
  .partial()
  .superRefine(validateCampaignDates);

export type CampaignInput = z.infer<typeof campaignInputSchema>;
