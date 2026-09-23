import * as z from "zod";

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

export const safeUrlSchema = z.string().trim().transform(normalizeSafeUrl);

export const campaignInputSchema = z.object({
  name: z.string().trim().min(2, "Nama campaign minimal 2 karakter.").max(160),
  targetUrl: safeUrlSchema,
  blockedUrl: safeUrlSchema,
  startsAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  status: z.enum(["draft", "active", "paused", "archived", "blocked"]).optional(),
}).superRefine((value, context) => {
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
});

export type CampaignInput = z.infer<typeof campaignInputSchema>;
