import { readBody } from "h3";
import { apiError, apiSuccess } from "../../../utils/api";
import { writeAuditLog } from "../../../utils/audit";
import { requireAdmin } from "../../../utils/auth";
import { ADMIN_SETTING_DEFAULTS, isAdminSettingKey } from "../../../utils/settings";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const body = await readBody<Record<string, unknown>>(event);
  const values = body?.values;

  if (!values || typeof values !== "object" || Array.isArray(values)) {
    apiError("VALIDATION_ERROR", "Settings payload tidak valid.", 422);
  }

  const entries = Object.entries(values as Record<string, unknown>);
  const invalidKey = entries.find(([key]) => !isAdminSettingKey(key));
  if (invalidKey) apiError("SETTING_NOT_ALLOWED", `Setting tidak diizinkan: ${invalidKey[0]}`, 422);

  const previous = await prisma.setting.findMany({ where: { group_name: "admin" } });
  const previousMap = Object.fromEntries(previous.map((item) => [item.key, item.value]));
  const saved: Record<string, string> = { ...ADMIN_SETTING_DEFAULTS };

  for (const [key, rawValue] of entries) {
    if (typeof rawValue !== "string" && typeof rawValue !== "number" && typeof rawValue !== "boolean") {
      apiError("VALIDATION_ERROR", `Value tidak valid untuk setting: ${key}`, 422);
    }
    const value = String(rawValue).trim();
    if (key === "analytics_retention_days" || key === "rate_limit_per_minute") {
      const numberValue = Number(value);
      if (!Number.isInteger(numberValue) || numberValue < 1 || numberValue > 100000) {
        apiError("VALIDATION_ERROR", `Value numerik tidak valid untuk setting: ${key}`, 422);
      }
    }
    if (key === "default_redirect_status" && !["302", "307"].includes(value)) {
      apiError("VALIDATION_ERROR", "Redirect status hanya boleh 302 atau 307.", 422);
    }
    if (["tracking_consent_required", "maintenance_mode"].includes(key) && !["true", "false"].includes(value.toLowerCase())) {
      apiError("VALIDATION_ERROR", `Value boolean tidak valid untuk setting: ${key}`, 422);
    }

    await prisma.setting.upsert({
      where: { setting_key_group_name_unique: { key, group_name: "admin" } },
      create: { key, group_name: "admin", value },
      update: { value },
    });
    saved[key] = value;
  }

  await writeAuditLog(event, {
    action: "UPDATE",
    resource: "setting",
    newValue: saved,
    oldValue: previousMap,
  });

  return apiSuccess(event, { group: "admin", values: saved }, "Settings updated successfully.");
});
