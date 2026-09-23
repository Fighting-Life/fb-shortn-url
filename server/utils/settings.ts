export const ADMIN_SETTING_DEFAULTS = {
  default_redirect_status: "302",
  allowed_target_schemes: "https",
  analytics_retention_days: "90",
  rate_limit_per_minute: "120",
  geoip_provider: "vercel",
  tracking_consent_required: "true",
  maintenance_mode: "false",
  abuse_contact_email: "",
} as const;

export type AdminSettingKey = keyof typeof ADMIN_SETTING_DEFAULTS;

export function isAdminSettingKey(value: string): value is AdminSettingKey {
  return Object.prototype.hasOwnProperty.call(ADMIN_SETTING_DEFAULTS, value);
}
