import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
// import { createId } from '@paralleldrive/cuid2';

const prismaClientSingleton = () => {
  const pool = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter: pool });
};
type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

async function main() {
  console.log("\n⚙️  Creating default settings...");
  const settings = [
    // General
    { key: "site_name", value: "Link Mask", group_name: "general" },
    {
      key: "site_description",
      value: "Shorten, hide, and protect your destination links. Cloakify offers secure URL cloaking, advanced link tracking, and seamless redirects for marketers.",
      group_name: "general",
    },
    { key: "site_keywords", value: "Shorten, hide, protect links", group_name: "general" },
    { key: "site_icon", value: "/logo.png", group_name: "general" },
    { key: "site_logo", value: "/logo.png", group_name: "general" },
    { key: "site_favicon", value: "/favicon.ico", group_name: "general" },
    { key: "site_theme", value: "dark", group_name: "general" },
    // Auth
    { key: "enable_register", value: "true", group_name: "auth" },
    { key: "enable_github_provider", value: "true", group_name: "auth" },
    { key: "enable_google_provider", value: "true", group_name: "auth" },
    // Storage
    { key: "max_upload_size_mb", value: "50", group_name: "storage" },
    { key: "max_upload_image_mb", value: "10", group_name: "storage" },
    { key: "max_upload_video_mb", value: "500", group_name: "storage" },
    { key: "max_upload_audio_mb", value: "50", group_name: "storage" },
    { key: "max_upload_document_mb", value: "20", group_name: "storage" },
    { key: "max_upload_code_mb", value: "5", group_name: "storage" },
    { key: "max_upload_archive_mb", value: "100", group_name: "storage" },
    // Campaign
    { key: "default_redirect_status", value: "302", group_name: "campaign" },
    { key: "allowed_target_schemes", value: "https", group_name: "campaign" },
    { key: "analytics_retention_days", value: "90", group_name: "campaign" },
    { key: "rate_limit_per_minute", value: "120", group_name: "campaign" },
    { key: "geoip_provider", value: "vercel", group_name: "campaign" },
    { key: "tracking_consent_required", value: "true", group_name: "campaign" },
    { key: "maintenance_mode", value: "false", group_name: "campaign" },
    { key: "abuse_contact_email", value: "", group_name: "campaign" },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: {
        setting_key_group_name_unique: {
          key: setting.key,
          group_name: setting.group_name,
        },
      },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log(`  ✅ ${settings.length} settings dibuat`);
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  }).finally(async () => {
    await prisma.$disconnect();
  });
