const baseUrl = (process.env.SMOKE_BASE_URL || "").replace(/\/$/, "");
const healthToken = process.env.SMOKE_HEALTH_TOKEN || "";

if (!baseUrl) {
  console.error("SMOKE_BASE_URL is required, for example https://preview.example.com");
  process.exit(1);
}

async function check(path, expectedStatuses, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    ...options,
  });

  if (!expectedStatuses.includes(response.status)) {
    throw new Error(`${path} returned HTTP ${response.status}`);
  }

  return response;
}

try {
  const robots = await check("/robots.txt", [200]);
  const robotsBody = await robots.text();
  if (!robotsBody.includes("User-agent:")) {
    throw new Error("/robots.txt does not contain a User-agent directive");
  }

  await check("/signin", [200]);
  await check("/r/__smoke_not_found__", [404]);

  if (healthToken) {
    await check("/api/internal/health", [200, 503], {
      headers: { "x-internal-health-token": healthToken },
    });
  } else {
    await check("/api/internal/health", [401]);
  }

  console.log(`Smoke test passed for ${baseUrl}`);
} catch (error) {
  console.error(`Smoke test failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
