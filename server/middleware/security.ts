import { getHeader, setHeader } from "h3";
import { randomUUID } from "node:crypto";

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  const requestId = getHeader(event, "x-request-id") || randomUUID();

  setHeader(event, "x-request-id", requestId);
  setHeader(event, "X-Content-Type-Options", "nosniff");
  setHeader(event, "X-Frame-Options", "DENY");
  setHeader(event, "Referrer-Policy", "strict-origin-when-cross-origin");
  setHeader(
    event,
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  setHeader(event, "Cross-Origin-Opener-Policy", "same-origin");

  const isProduction = String(config.NODE_ENV || process.env.NODE_ENV) === "production";
  const siteUrl = String(config.PUBLIC_SITE_URL || "");

  if (isProduction && siteUrl.startsWith("https://")) {
    setHeader(
      event,
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }
});
