/// <reference types="node" />

import assert from "node:assert/strict";
import test from "node:test";
import { hasMinRole } from "../../server/utils/auth";
import { campaignScope, generateShortCode } from "../../server/utils/campaign";
import {
  shouldUseBlockedDestination,
  type RedirectContext,
} from "../../server/utils/redirect";
import { campaignInputSchema } from "../../shared/utils/campaign";
import { loginSchema } from "../../shared/utils/validator";

const baseContext: RedirectContext = {
  device: "desktop",
  country: "ID",
  ip: "203.0.113.10",
  userAgent: "Mozilla/5.0",
  isBot: false,
};

test("campaign URLs only allow safe HTTPS destinations", () => {
  const valid = campaignInputSchema.parse({
    name: "Production campaign",
    targetUrl: "https://example.com/landing",
    blockedUrl: "https://example.com/blocked",
    trackingConfig: {},
  });

  assert.equal(valid.targetUrl, "https://example.com/landing");
  assert.throws(() => campaignInputSchema.parse({
    name: "HTTP campaign",
    targetUrl: "http://example.com/landing",
    blockedUrl: "https://example.com/blocked",
    trackingConfig: {},
  }));
  assert.throws(() => campaignInputSchema.parse({
    name: "Private campaign",
    targetUrl: "https://127.0.0.1/admin",
    blockedUrl: "https://example.com/blocked",
    trackingConfig: {},
  }));
  assert.throws(() => campaignInputSchema.parse({
    name: "Credential campaign",
    targetUrl: "https://user:password@example.com/landing",
    blockedUrl: "https://example.com/blocked",
    trackingConfig: {},
  }));
});

test("redirect rules block excluded values and non-allowed values", () => {
  assert.equal(
    shouldUseBlockedDestination(
      { device: { exclude: ["desktop"] } },
      baseContext,
    ),
    true,
  );

  assert.equal(
    shouldUseBlockedDestination(
      { country: { allow: ["US", "GB"] } },
      baseContext,
    ),
    true,
  );

  assert.equal(
    shouldUseBlockedDestination(
      { ip: { exclude: ["203.0.113.0/24"] } },
      baseContext,
    ),
    true,
  );
});

test("redirect rules identify bots and allow matching values", () => {
  const botContext = {
    ...baseContext,
    userAgent: "Mozilla/5.0 facebookexternalhit/1.1",
    isBot: true,
  };

  assert.equal(
    shouldUseBlockedDestination({ blockBots: true }, botContext),
    true,
  );
  assert.equal(
    shouldUseBlockedDestination(
      { device: { allow: ["desktop"] }, country: { allow: ["ID"] } },
      baseContext,
    ),
    false,
  );
});

test("login schema accepts valid credentials and rejects weak passwords", () => {
  assert.equal(
    loginSchema.safeParse({
      email: "user@example.com",
      password: "secret123",
      remember_me: false,
    }).success,
    true,
  );
  assert.equal(
    loginSchema.safeParse({
      email: "user@example.com",
      password: "short",
    }).success,
    false,
  );
});

test("authorization scope prevents cross-user campaign access", () => {
  assert.deepEqual(campaignScope("user-a", "user"), { owner_id: "user-a" });
  assert.deepEqual(campaignScope("admin-a", "admin"), {});
  assert.equal(hasMinRole("user", "admin"), false);
  assert.equal(hasMinRole("admin", "admin"), true);
  assert.equal(hasMinRole("admin", "user"), true);
});

test("short codes use the expected opaque format", () => {
  const code = generateShortCode(32);

  assert.equal(code.length, 32);
  assert.match(code, /^[0-9A-Za-z]+$/);
});
