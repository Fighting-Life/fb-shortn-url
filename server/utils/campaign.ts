import { randomBytes } from "node:crypto";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generateShortCode(length = 8): string {
  const bytes = randomBytes(length);
  let code = "";

  for (const byte of bytes) {
    code += ALPHABET[byte % ALPHABET.length];
  }

  return code;
}

export function campaignScope(userId: string, role?: string) {
  return role === "admin" ? {} : { owner_id: userId };
}

export function serializeCampaign<T extends Record<string, any>>(campaign: T) {
  return {
    ...campaign,
    starts_at: campaign.starts_at?.toISOString?.() ?? campaign.starts_at ?? null,
    expires_at: campaign.expires_at?.toISOString?.() ?? campaign.expires_at ?? null,
    deleted_at: campaign.deleted_at?.toISOString?.() ?? campaign.deleted_at ?? null,
    created_at: campaign.created_at?.toISOString?.() ?? campaign.created_at,
    updated_at: campaign.updated_at?.toISOString?.() ?? campaign.updated_at,
  };
}
