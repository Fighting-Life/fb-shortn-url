import type { Setting } from "@prisma/client";
import type { H3Error, H3Event } from "h3";
import { z } from "zod";

export const appSettingsSchema = z.object({
  site_name: z.string().min(1).max(100),
  site_description: z.string().max(500).optional().or(z.literal("")),
  site_keywords: z.string().max(255).optional().or(z.literal("")),
  site_icon: z.string().url().optional().or(z.literal("")),
  site_logo: z.string().url().optional().or(z.literal("")),
  site_favicon: z.string().url().optional().or(z.literal("")),
  site_theme: z.enum(["light", "dark", "system"]).default("dark"),
  enable_register: z.boolean(),
  enable_github_provider: z.boolean(),
  enable_google_provider: z.boolean(),
  max_upload_size_mb: z.number().int().positive(),
  max_upload_image_mb: z.number().int().positive(),
  max_upload_video_mb: z.number().int().positive(),
  max_upload_audio_mb: z.number().int().positive(),
  max_upload_document_mb: z.number().int().positive(),
  max_upload_code_mb: z.number().int().positive(),
  max_upload_archive_mb: z.number().int().positive(),
  default_redirect_status: z.string().min(1).max(3),
  allowed_target_schemes: z.string().min(1).max(100),
  analytics_retention_days: z.string().min(1).max(100),
  rate_limit_per_minute: z.string().min(1).max(100),
  geoip_provider: z.string().min(1).max(100),
  tracking_consent_required: z.boolean(),
  maintenance_mode: z.boolean(),
  abuse_contact_email: z.string().max(255),
});
export type AppSettingsInput = z.infer<typeof appSettingsSchema>;

export const ADMIN_SETTING_DEFAULTS = {
  site_name: "Link Mask",
  site_description: "Shorten, hide, and protect your destination links. Cloakify offers secure URL cloaking, advanced link tracking, and seamless redirects for marketers",
  site_keywords: "Shorten, hide, protect links",
  site_icon: "/logo.png",
  site_logo: "/logo.png",
  site_favicon: "/favicon.ico",
  site_theme: "dark",
  enable_register: true,
  enable_github_provider: true,
  enable_google_provider: true,
  max_upload_size_mb: 50,
  max_upload_image_mb: 10,
  max_upload_video_mb: 500,
  max_upload_audio_mb: 50,
  max_upload_document_mb: 20,
  max_upload_code_mb: 5,
  max_upload_archive_mb: 100,
  default_redirect_status: "302",
  allowed_target_schemes: "https",
  analytics_retention_days: "90",
  rate_limit_per_minute: "120",
  geoip_provider: "vercel",
  tracking_consent_required: true,
  maintenance_mode: false,
  abuse_contact_email: "",
} as const;

export type AdminSettingKey = keyof typeof ADMIN_SETTING_DEFAULTS;

export function isAdminSettingKey(value: string): value is AdminSettingKey {
  return Object.prototype.hasOwnProperty.call(ADMIN_SETTING_DEFAULTS, value);
}

export const getSettings = async (): Promise<SettingRow[]> => {
  try {
    return (await prisma.setting.findMany({
      select: { key: true, value: true, updated_at: true },
    })) as SettingRow[];
  } catch (error) {
    console.error(`Failed to get app settings: ${error}`);
    return [];
  }
};
export const findByKey = async (
  key: string,
): Promise<Pick<Setting, "key" | "value"> | null> => {
  try {
    return await prisma.setting.findFirst({
      where: { key },
      orderBy: { updated_at: "desc" },
      select: { key: true, value: true },
    });
  } catch (error) {
    console.error(`Failed to get app setting: ${error}`);
    return null;
  }
};
export const updateByKey = async (
  key: string,
  value: string,
): Promise<void | H3Error> => {
  try {
    const res = await prisma.setting.updateMany({
      where: { key },
      data: { value },
    });
    if (res.count === 0) {
      await prisma.setting.create({
        data: { key, value, group_name: "default" },
      });
    }
  } catch (error) {
    console.error(`Failed to update setting: ${error}`);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update setting.",
    });
  }
};
export const getSetupConfig = async (): Promise<SettingConfig> => {
  const rows = await getSettings();
  const m = buildSettingMap(rows);
  return {
    site_name: getSetting(m, "site_name") ?? ADMIN_SETTING_DEFAULTS.site_name,
    site_description:
      getSetting(m, "site_description") ?? ADMIN_SETTING_DEFAULTS.site_description,
    site_keywords:
      getSetting(m, "site_keywords") ?? ADMIN_SETTING_DEFAULTS.site_keywords,
    site_icon: getSetting(m, "site_icon") ?? ADMIN_SETTING_DEFAULTS.site_icon,
    site_logo: getSetting(m, "site_logo") ?? ADMIN_SETTING_DEFAULTS.site_logo,
    site_favicon:
      getSetting(m, "site_favicon") ?? ADMIN_SETTING_DEFAULTS.site_favicon,
    site_theme: getSetting(m, "site_theme") ?? ADMIN_SETTING_DEFAULTS.site_theme,
    enable_register: parseBool(
      getSetting(m, "enable_register"),
      ADMIN_SETTING_DEFAULTS.enable_register,
    ),
    enable_github_provider: parseBool(
      getSetting(m, "enable_github_provider"),
      ADMIN_SETTING_DEFAULTS.enable_github_provider,
    ),
    enable_google_provider: parseBool(
      getSetting(m, "enable_google_provider"),
      ADMIN_SETTING_DEFAULTS.enable_google_provider,
    ),
    max_upload_size_mb: parseIntSafe(
      getSetting(m, "max_upload_size_mb"),
      ADMIN_SETTING_DEFAULTS.max_upload_size_mb,
    ),
    max_upload_image_mb: parseIntSafe(
      getSetting(m, "max_upload_image_mb"),
      ADMIN_SETTING_DEFAULTS.max_upload_image_mb,
    ),
    max_upload_video_mb: parseIntSafe(
      getSetting(m, "max_upload_video_mb"),
      ADMIN_SETTING_DEFAULTS.max_upload_video_mb,
    ),
    max_upload_audio_mb: parseIntSafe(
      getSetting(m, "max_upload_audio_mb"),
      ADMIN_SETTING_DEFAULTS.max_upload_audio_mb,
    ),
    max_upload_document_mb: parseIntSafe(
      getSetting(m, "max_upload_document_mb"),
      ADMIN_SETTING_DEFAULTS.max_upload_document_mb,
    ),
    max_upload_code_mb: parseIntSafe(
      getSetting(m, "max_upload_code_mb"),
      ADMIN_SETTING_DEFAULTS.max_upload_code_mb,
    ),
    max_upload_archive_mb: parseIntSafe(
      getSetting(m, "max_upload_archive_mb"),
      ADMIN_SETTING_DEFAULTS.max_upload_archive_mb,
    ),
    default_redirect_status: getSetting(m, "default_redirect_status") ?? ADMIN_SETTING_DEFAULTS.default_redirect_status,
    allowed_target_schemes: getSetting(m, "allowed_target_schemes") ?? ADMIN_SETTING_DEFAULTS.allowed_target_schemes,
    analytics_retention_days: getSetting(m, "analytics_retention_days") ?? ADMIN_SETTING_DEFAULTS.analytics_retention_days,
    rate_limit_per_minute: getSetting(m, "rate_limit_per_minute") ?? ADMIN_SETTING_DEFAULTS.rate_limit_per_minute,
    geoip_provider: getSetting(m, "geoip_provider") ?? ADMIN_SETTING_DEFAULTS.geoip_provider,
    tracking_consent_required: parseBool(
      getSetting(m, "tracking_consent_required"),
      ADMIN_SETTING_DEFAULTS.tracking_consent_required,
    ),
    maintenance_mode: parseBool(
      getSetting(m, "maintenance_mode"),
      ADMIN_SETTING_DEFAULTS.maintenance_mode,
    ),
    abuse_contact_email: getSetting(m, "abuse_contact_email") ?? ADMIN_SETTING_DEFAULTS.abuse_contact_email,
  };
};
export async function getSettingsAction(
  event: H3Event,
): Promise<SettingResult<Record<string, string>>> {
  try {
    await requireAdmin(event);

    const settings = await prisma.setting.findMany();
    const map: Record<string, string> = {};
    settings.forEach((s) => {
      map[s.key] = s.value;
    });

    return { success: true, data: map };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Failed to get settings." };
  }
}
export async function updateAppSettingsAction(
  event: H3Event,
  data: AppSettingsInput,
): Promise<SettingResult> {
  try {
    await requireAdmin(event);

    const parsed = appSettingsSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const settingsToUpdate = [
      { key: "site_name", value: parsed.data.site_name, group_name: "general" },
      {
        key: "site_description",
        value: parsed.data.site_description ?? "",
        group_name: "general",
      },
      {
        key: "enable_register",
        value: String(parsed.data.enable_register),
        group_name: "auth",
      },
      {
        key: "enable_github_provider",
        value: String(parsed.data.enable_github_provider),
        group_name: "auth",
      },
      {
        key: "enable_google_provider",
        value: String(parsed.data.enable_google_provider),
        group_name: "auth",
      },
    ];

    await prisma.$transaction(
      settingsToUpdate.map((s) =>
        prisma.setting.upsert({
          where: {
            setting_key_group_name_unique: {
              key: s.key,
              group_name: s.group_name,
            },
          },
          update: { value: s.value },
          create: s,
        }),
      ),
    );

    return { success: true, message: "Settings saved successfully." };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Failed to save settings." };
  }
}
export async function getSettingAction(
  key: string,
  group_name = "general",
): Promise<string | null> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { setting_key_group_name_unique: { key, group_name } },
    });
    return setting?.value ?? null;
  } catch (error) {
    console.error(`Failed to get app setting (${group_name}.${key}): ${error}`);
    return null;
  }
}
export const buildSettingMap = (rows: SettingRow[]): Map<string, string> => {
  const sorted = [...rows].sort((a, b) => {
    const ta = a.updated_at?.getTime() ?? 0;
    const tb = b.updated_at?.getTime() ?? 0;
    return ta - tb;
  });
  return new Map(sorted.map((r) => [r.key, r.value] as [string, string]));
};
export const getSetting = (
  m: Map<string, string>,
  key: string,
): string | undefined => {
  const defaultValue = (
    ADMIN_SETTING_DEFAULTS as unknown as Record<string, unknown>
  )[key];
  return normalizeScalar(m.get(key) ?? (defaultValue as string | undefined));
};
