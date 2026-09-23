const baseUrl = (process.env.SMOKE_BASE_URL || "").replace(/\/$/, "");
const email = process.env.SMOKE_EMAIL || "";
const password = process.env.SMOKE_PASSWORD || "";

if (!baseUrl || !email || !password) {
  console.error("SMOKE_BASE_URL, SMOKE_EMAIL, and SMOKE_PASSWORD are required");
  process.exit(1);
}

let cookie = "";

function updateCookie(response) {
  const setCookies = response.headers.getSetCookie?.() || [];
  if (setCookies.length) {
    cookie = setCookies
      .map((value) => value.split(";", 1)[0])
      .join("; ");
  }
}

async function request(path, options = {}, expectedStatuses = [200]) {
  const headers = new Headers(options.headers || {});
  if (cookie) headers.set("cookie", cookie);
  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    redirect: "manual",
  });
  updateCookie(response);

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!expectedStatuses.includes(response.status)) {
    throw new Error(`${options.method || "GET"} ${path} returned HTTP ${response.status}`);
  }

  return { response, body };
}

let campaignId = "";

try {
  await request(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password, remember_me: false }),
    },
    [200],
  );

  await request("/api/campaigns?limit=1", {}, [200]);

  const created = await request(
    "/api/campaigns",
    {
      method: "POST",
      body: JSON.stringify({
        name: `Vercel smoke ${Date.now()}`,
        targetUrl: "https://example.com/target",
        targetUrls: [
          "https://example.com/target",
          "https://example.net/alternate-target",
        ],
        blockedUrl: "https://example.com/blocked",
        status: "draft",
        ruleConfig: {
          device: { allow: ["mobile"], exclude: [] },
          country: { allow: ["ID"], exclude: ["US"] },
          ip: { allow: [], exclude: ["198.51.100.0/24"] },
          blockBots: true,
        },
        trackingConfig: { enabled: false, consentRequired: true },
      }),
    },
    [201],
  );

  campaignId = created.body?.data?.id || "";
  if (!campaignId) throw new Error("Campaign create response did not include an id");
  if (created.body?.data?.rule_config?.blockBots !== true) {
    throw new Error("Campaign create response did not persist rule_config");
  }
  if (created.body?.data?.target_urls?.length !== 2) {
    throw new Error("Campaign create response did not persist the target URL pool");
  }

  await request(`/api/campaigns/${campaignId}`, {}, [200]);
  const preview = await request(`/api/campaigns/${campaignId}/preview`, {
    method: "POST",
  }, [200]);

  if (!preview.body?.data?.short_url) {
    throw new Error("Campaign preview response did not include short_url");
  }

  await request(`/api/campaigns/${campaignId}`, { method: "DELETE" }, [200]);
  console.log(`Authenticated API smoke test passed for ${baseUrl}`);
} catch (error) {
  if (campaignId) {
    try {
      await request(`/api/campaigns/${campaignId}`, { method: "DELETE" }, [200]);
    } catch {
      // Preserve the original smoke-test error.
    }
  }

  console.error(
    `Authenticated API smoke test failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}
