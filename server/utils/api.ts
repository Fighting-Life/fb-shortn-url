import type { H3Event } from "h3";
import { H3Error } from "h3";

export const handleRequestError = (error: unknown) => {
  if (error instanceof H3Error) {
    return createError({
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      data: error.data,
    });
  }
  return createError({
    statusCode: 500,
    statusMessage: "Server Error",
    data: {
      code: "SERVER_ERROR",
    },
  });
};
export const setSecurityHeaders = (event: H3Event): void => {
  setHeader(event, "Cache-Control", "no-store, max-age=0");
  setHeader(
    event,
    "CDN-Cache-Control",
    "max-age=60, stale-while-revalidate=300",
  );
};

const store = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}
export function getClientIp(event: H3Event): string {
  return (
    getHeader(event, "x-forwarded-for")?.split(",")[0]?.trim() ||
    getHeader(event, "x-real-ip") ||
    "0.0.0.0"
  );
}

interface ClientLocation {
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  lat?: string;
  lon?: string;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
  query?: string;
}
export const getAllHeaderIdentifiers = async (event: H3Event) => {
  const clientIp =
    getHeader(event, "x-forwarded-for")?.split(",")[0]?.trim() ||
    getHeader(event, "x-real-ip") ||
    event.node.req.socket.remoteAddress ||
    "0.0.0.0";
  const userAgent = getHeader(event, "user-agent") || "Unknown";
  const locationHeader = getHeader(event, "location") || "Unknown";

  let locationClient: ClientLocation = {
    country: "Unknown",
    countryCode: "Unknown",
    region: "Unknown",
    regionName: "Unknown",
    city: "Unknown",
    zip: "Unknown",
    lat: "Unknown",
    lon: "Unknown",
    timezone: "Unknown",
    isp: "Unknown",
    org: "Unknown",
    as: "Unknown",
    query: "Unknown",
  };
  try {
    locationClient = await $fetch<ClientLocation>(
      `http://ip-api.com/${clientIp}`,
    );
  } catch (error) {
    console.error("Failed to fetch geolocation", error);
  }

  return {
    clientIp,
    userAgent,
    locationHeader,
    locationClient,
  };
};
export function safeSerialize<T>(value: T): any {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => safeSerialize(item));
  }

  if (typeof value === "object") {
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = safeSerialize(val);
    }
    return result;
  }

  return value;
}
