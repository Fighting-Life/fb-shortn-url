import type { H3Event } from "h3";
import { createHmac, randomBytes, randomInt } from "node:crypto";
import { ruleConfigSchema, safeUrlSchema } from "../../shared/utils/campaign";

export type RedirectDevice = "desktop" | "mobile" | "tablet" | "ios" | "android" | "unknown";

export const DEVICE_MAP: Record<DeviceType, string> = {
  desktop: "desktop.facebook.com",
  android: "app.android.facebook.com",
  ios: "app.ios.facebook.com",
  mobile: "m.facebook.com",
  lite: "lite.facebook.com",
  web: "l.facebook.com",
  messenger: "messenger.facebook.com",
};

interface RuleList {
  allow?: unknown;
  exclude?: unknown;
}

export interface RedirectRuleConfig {
  device?: RuleList;
  country?: RuleList;
  ip?: RuleList;
  blockBots?: boolean;
}

export interface RedirectContext {
  device: RedirectDevice;
  country: string | null;
  ip: string;
  userAgent: string;
  isBot: boolean;
}

const ATTRIBUTION_PARAMS = [
  "fbclid",
  "gclid",
  "msclkid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

const BOT_PATTERN = /bot|crawler|spider|slurp|headless|preview|facebookexternalhit/i;

export function detectDevice(userAgent: string): RedirectDevice {
  const ua = userAgent.toLowerCase();

  if (/ipad|tablet|playbook|silk/.test(ua)) return "tablet";
  if (/iphone|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/mobile|opera mini|iemobile/.test(ua)) return "mobile";
  if (/windows|macintosh|linux|cros/.test(ua)) return "desktop";

  return "unknown";
}

export function getRedirectContext(event: H3Event): RedirectContext {
  const userAgent = getHeader(event, "user-agent") || "";
  const ip =
    getHeader(event, "x-forwarded-for")?.split(",")[0]?.trim() ||
    getHeader(event, "x-real-ip") ||
    event.node.req.socket.remoteAddress ||
    "0.0.0.0";
  const country =
    getHeader(event, "x-vercel-ip-country") ||
    getHeader(event, "cf-ipcountry") ||
    null;

  return {
    device: detectDevice(userAgent),
    country: country?.toUpperCase() || null,
    ip,
    userAgent,
    isBot: BOT_PATTERN.test(userAgent),
  };
}

function asRuleValues(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function matchesIpv4Cidr(ip: string, rule: string): boolean {
  const [network, prefixText] = rule.split("/");
  if (!network || !prefixText || !/^\d{1,2}$/.test(prefixText)) {
    return ip === rule;
  }

  const prefix = Number(prefixText);
  if (prefix < 0 || prefix > 32) return false;

  const ipParts = ip.split(".").map(Number);
  const networkParts = network.split(".").map(Number);
  if (
    ipParts.length !== 4 ||
    networkParts.length !== 4 ||
    ipParts.some((part) => !Number.isInteger(part) || part < 0 || part > 255) ||
    networkParts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }

  const ipNumber = ipParts.reduce((value, part) => value * 256 + part, 0) >>> 0;
  const networkNumber = networkParts.reduce((value, part) => value * 256 + part, 0) >>> 0;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;

  return (ipNumber & mask) === (networkNumber & mask);
}

function matchesRuleValue(value: string, ruleValues: string[], type: "ip" | "plain") {
  if (type === "ip") return ruleValues.some((rule) => matchesIpv4Cidr(value, rule));
  return ruleValues.includes(value.toLowerCase());
}

function isBlockedByRule(value: string | null, rule: RuleList | undefined, type: "ip" | "plain") {
  if (!rule) return false;

  const normalizedValue = value?.toLowerCase() || "";
  const allow = asRuleValues(rule.allow);
  const exclude = asRuleValues(rule.exclude);

  // An allow-list is fail-closed when the request context is unavailable.
  if (allow.length && (!value || !matchesRuleValue(normalizedValue, allow, type))) return true;
  if (value && matchesRuleValue(normalizedValue, exclude, type)) return true;

  return false;
}

export function parseRuleConfig(value: unknown): RedirectRuleConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as CampaignRuleConfig;
}

export function shouldUseBlockedDestination(
  configValue: unknown,
  context: RedirectContext,
): boolean {
  if (configValue !== null && configValue !== undefined) {
    const parsed = ruleConfigSchema.safeParse(configValue);
    if (!parsed.success) return true;
  }

  const config = parseRuleConfig(configValue);

  if (config.blockBots && context.isBot) return true;
  if (isBlockedByRule(context.device, config.device, "plain")) return true;
  if (isBlockedByRule(context.country, config.country, "plain")) return true;
  if (isBlockedByRule(context.ip, config.ip, "ip")) return true;

  return false;
}

export function selectRotatedTarget(
  targets: unknown,
  fallback: string,
  chooseIndex: (max: number) => number = randomInt,
): string {
  const safeTargets = Array.isArray(targets)
    ? targets.flatMap((target) => {
      if (typeof target !== "string") return [];
      try {
        const parsed = safeUrlSchema.safeParse(target);
        return parsed.success ? [parsed.data] : [];
      } catch {
        return [];
      }
    })
    : [];

  if (safeTargets.length) {
    const index = chooseIndex(safeTargets.length);
    return safeTargets[index] ?? safeTargets[0]!;
  }

  return safeUrlSchema.parse(fallback);
}

export function appendAllowedAttribution(target: string, event: H3Event): string {
  const destination = new URL(target);
  const requestUrl = getRequestURL(event);

  for (const key of ATTRIBUTION_PARAMS) {
    const value = requestUrl.searchParams.get(key);
    if (value && value.length <= 512) destination.searchParams.set(key, value);
  }

  return destination.toString();
}


export function generateHmacToken(
  seed: string,
  secret: string,
  length = 64,
): string {
  return createHmac("sha256", secret)
    .update(seed)
    .digest("base64url")
    .slice(0, length);
}

export function generateRandomToken(length = 64): string {
  return randomBytes(Math.ceil(length * 0.75))
    .toString("base64url")
    .slice(0, length);
}

export function buildFbUrl(params: BuildFacebookUrlParams): GeneratedUrl {
  const { device, url, fbclid, fbtoken, hToken, extraParams = {} } = params;

  const host = DEVICE_MAP[device];
  if (!host) {
    throw new Error(
      `❌ Device not valid: "${device}". Valid options: ${Object.keys(DEVICE_MAP).join(", ")}`,
    );
  }

  if (!url || !/^https?:\/\//i.test(url)) {
    throw new Error(`❌ URL tidak valid: "${url}"`);
  }

  if (!fbclid || fbclid.trim() === "") {
    throw new Error("❌ fbclid wajib diisi");
  }

  const token = fbclid || fbtoken || "";
  if (!token) {
    throw new Error("❌ fbclid or fbtoken required");
  }

  const target = `${url}?fbclid=${fbclid}`;
  const encodedTarget = encodeURIComponent(target);

  let finalUrl = `https://${host}/l.php?u=${encodedTarget}`;

  if (hToken && hToken.trim() !== "") {
    finalUrl += `&h=${encodeURIComponent(hToken)}`;
  }

  for (const [key, value] of Object.entries(extraParams)) {
    finalUrl += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }

  return { device, host, finalUrl, encodedTarget, fbclid, hToken };
}

export function generateRandomFbclid(): string {
  const prefix = "IwAR";
  const randomPart = randomBytes(64).toString("base64url");
  return `${prefix}${randomPart}`.slice(0, 96);
}
export function generateRandomHToken(): string {
  const prefix = "AUA";
  const randomPart = randomBytes(64).toString("base64url");
  return `${prefix}${randomPart}`.slice(0, 96);
}

export function generateDeterministicFbclid(
  seed: string,
  secret: string,
): string {
  const hash = createHmac("sha256", secret).update(seed).digest("base64url");
  return `IwAR${hash}`.slice(0, 96);
}

export function generateFreshClickUrl(
  options: GenerateClickUrlOptions,
): GeneratedUrl & { generatedAt: number } {
  const {
    device,
    targetUrl,
    campaignId,
    context,
    deterministic = false,
    extraParams,
  } = options;

  const config = useRuntimeConfig();
  const secret = String(
    config.TRACKING_SECRET || process.env.TRACKING_SECRET || "fallback-secret",
  );

  const generatedAt = Date.now();

  const fbclid = deterministic
    ? generateDeterministicFbclid(
      `${campaignId}:${context.ip}:${Math.floor(generatedAt / 60000)}`,
      secret,
    )
    : generateRandomFbclid();

  const hToken = generateRandomHToken();

  const result = buildFbUrl({
    device,
    url: targetUrl,
    fbclid,
    hToken,
    extraParams: {
      __tn__: "H-R",
      ...extraParams,
    },
  });

  return { ...result, generatedAt };
}
