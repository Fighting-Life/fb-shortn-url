
export const DEVICE_MAP: Record<DeviceType, string> = {
  desktop: "desktop.facebook.com",
  android: "app.android.facebook.com",
  ios: "app.ios.facebook.com",
  mobile: "m.facebook.com",
  lite: "lite.facebook.com",
  web: "l.facebook.com",
  messenger: "messenger.facebook.com",
};

export const deviceMap: Record<DeviceType, string> = DEVICE_MAP;


export function buildFbUrl(params: BuildFacebookUrlParams): GeneratedUrl {
  const {
    device,
    url,
    fbclid,
    hToken,
    fbtoken,
    extraParams = {},
  } = params;

  const host = DEVICE_MAP[device];
  if (!host) {
    throw new Error(
      `❌ Device tidak valid: "${device}". Pilihan: ${Object.keys(DEVICE_MAP).join(", ")}`
    );
  }

  if (!url || !/^https?:\/\//i.test(url)) {
    throw new Error(`❌ URL tidak valid: "${url}" (harus diawali http:// atau https://)`);
  }

  const token = fbclid || fbtoken || "";
  if (!token) {
    throw new Error("❌ fbclid atau fbtoken wajib diisi");
  }

  const target = `${url}?fbclid=${token}`;

  const encodedTarget = encodeURIComponent(target);

  let finalUrl = `https://${host}/l.php?u=${encodedTarget}`;

  if (hToken && hToken.trim() !== "") {
    finalUrl += `&h=${encodeURIComponent(hToken)}`;
  }

  for (const [key, value] of Object.entries(extraParams)) {
    finalUrl += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }

  return { device, host, finalUrl, encodedTarget };
}


export function buildAllDevices(
  params: Omit<BuildFacebookUrlParams, "device">
): GeneratedUrl[] {
  return (Object.keys(DEVICE_MAP) as DeviceType[]).map((device) =>
    buildFbUrl({ ...params, device })
  );
}

export function batchBuild(
  inputs: BatchUrlInput[],
  defaultDevice: DeviceType = "web"
): GeneratedUrl[] {
  return inputs.map((item) =>
    buildFbUrl({
      device: item.device ?? defaultDevice,
      url: item.url,
      fbclid: item.fbclid,
      hToken: item.hToken,
    })
  );
}

export function parseFbUrl(fbUrl: string): {
  url?: string;
  fbclid?: string;
  hToken?: string;
} {
  try {
    const parsed = new URL(fbUrl);
    const u = parsed.searchParams.get("u");
    const h = parsed.searchParams.get("h") ?? undefined;

    if (!u) return { hToken: h };

    const decoded = decodeURIComponent(u);
    const [targetUrl, query] = decoded.split("?");
    const params = new URLSearchParams(query || "");
    const fbclid = params.get("fbclid") ?? undefined;

    return { url: targetUrl, fbclid, hToken: h };
  } catch {
    return {};
  }
}

export function formatOutput(results: GeneratedUrl[]): string {
  return results
    .map(
      (r) =>
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📱 Device : ${r.device.toUpperCase()}\n` +
        `🌐 Host   : ${r.host}\n` +
        `🔗 URL    : ${r.finalUrl}\n`
    )
    .join("\n");
}
