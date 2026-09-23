import type { H3Event } from "h3";

export type RedirectDevice = "desktop" | "mobile" | "tablet" | "ios" | "android" | "unknown";

interface RuleList {
  allow?: unknown;
  exclude?: unknown;
}

export interface CampaignRuleConfig {
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
  if (!rule || !value) return false;

  const normalizedValue = value.toLowerCase();
  const allow = asRuleValues(rule.allow);
  const exclude = asRuleValues(rule.exclude);

  if (allow.length && !matchesRuleValue(normalizedValue, allow, type)) return true;
  if (matchesRuleValue(normalizedValue, exclude, type)) return true;

  return false;
}

export function parseRuleConfig(value: unknown): CampaignRuleConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as CampaignRuleConfig;
}

export function shouldUseBlockedDestination(
  configValue: unknown,
  context: RedirectContext,
): boolean {
  const config = parseRuleConfig(configValue);

  if (config.blockBots && context.isBot) return true;
  if (isBlockedByRule(context.device, config.device, "plain")) return true;
  if (isBlockedByRule(context.country, config.country, "plain")) return true;
  if (isBlockedByRule(context.ip, config.ip, "ip")) return true;

  return false;
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
