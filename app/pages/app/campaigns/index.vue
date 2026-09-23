<script setup lang="ts">
const route = useRoute();

definePageMeta({
  layout: "auth",
  middleware: ["auth"]
});
useSeoMeta({
  title: "Campaigns - LinkMask",
  description: "Campaigns - LinkMask",
  robots: "noindex, nofollow",
  ogImage: "/logo.png",
  ogUrl: route.fullPath,
});

type CampaignStatus = "draft" | "active" | "paused" | "archived" | "blocked";

type CampaignRow = {
  id: string;
  name: string;
  short_code: string;
  target_url: string;
  blocked_url: string;
  status: CampaignStatus;
  starts_at: string | null;
  expires_at: string | null;
  tracking_config?: {
    enabled?: boolean;
    consentRequired?: boolean;
    ga4MeasurementId?: string | null;
    metaPixelId?: string | null;
    tiktokPixelId?: string | null;
    histatsId?: string | null;
  } | null;
  created_at: string;
};

type CampaignForm = {
  name: string;
  targetUrl: string;
  blockedUrl: string;
  status: CampaignStatus;
  startsAt: string;
  expiresAt: string;
  trackingEnabled: boolean;
  consentRequired: boolean;
  ga4MeasurementId: string;
  metaPixelId: string;
  tiktokPixelId: string;
  histatsId: string;
};

const emptyForm = (): CampaignForm => ({
  name: "",
  targetUrl: "",
  blockedUrl: "",
  status: "draft",
  startsAt: "",
  expiresAt: "",
  trackingEnabled: false,
  consentRequired: true,
  ga4MeasurementId: "",
  metaPixelId: "",
  tiktokPixelId: "",
  histatsId: "",
});

const campaigns = ref<CampaignRow[]>([]);
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const editingId = ref<string | null>(null);
const previewUrl = ref("");
const form = reactive<CampaignForm>(emptyForm());

const isEditing = computed(() => Boolean(editingId.value));

function resetForm() {
  Object.assign(form, emptyForm());
  editingId.value = null;
  previewUrl.value = "";
}

function toIsoOrNull(value: string) {
  return value ? new Date(value).toISOString() : null;
}

async function loadCampaigns() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await $fetch<ApiResponse<{ items: CampaignRow[] }>>(
      "/api/campaigns",
    );
    campaigns.value = response.data?.items ?? [];
  } catch (error: any) {
    errorMessage.value =
      error?.data?.message || error?.statusMessage || "Campaign gagal dimuat.";
  } finally {
    loading.value = false;
  }
}

function editCampaign(campaign: CampaignRow) {
  editingId.value = campaign.id;
  form.name = campaign.name;
  form.targetUrl = campaign.target_url;
  form.blockedUrl = campaign.blocked_url;
  form.status = campaign.status;
  form.startsAt = campaign.starts_at?.slice(0, 16) ?? "";
  form.expiresAt = campaign.expires_at?.slice(0, 16) ?? "";
  form.trackingEnabled = campaign.tracking_config?.enabled === true;
  form.consentRequired = campaign.tracking_config?.consentRequired !== false;
  form.ga4MeasurementId = campaign.tracking_config?.ga4MeasurementId ?? "";
  form.metaPixelId = campaign.tracking_config?.metaPixelId ?? "";
  form.tiktokPixelId = campaign.tracking_config?.tiktokPixelId ?? "";
  form.histatsId = campaign.tracking_config?.histatsId ?? "";
  previewUrl.value = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function saveCampaign() {
  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  const payload = {
    name: form.name,
    targetUrl: form.targetUrl,
    blockedUrl: form.blockedUrl,
    status: form.status,
    startsAt: toIsoOrNull(form.startsAt),
    expiresAt: toIsoOrNull(form.expiresAt),
    trackingConfig: {
      enabled: form.trackingEnabled,
      consentRequired: form.consentRequired,
      ga4MeasurementId: form.ga4MeasurementId || null,
      metaPixelId: form.metaPixelId || null,
      tiktokPixelId: form.tiktokPixelId || null,
      histatsId: form.histatsId || null,
    },
  };

  try {
    if (editingId.value) {
      await $fetch(`/api/campaigns/${editingId.value}`, {
        method: "PATCH",
        body: payload,
      });
      successMessage.value = "Campaign berhasil diperbarui.";
    } else {
      await $fetch("/api/campaigns", {
        method: "POST",
        body: payload,
      });
      successMessage.value = "Campaign berhasil dibuat.";
    }

    resetForm();
    await loadCampaigns();
  } catch (error: any) {
    errorMessage.value =
      error?.data?.message || error?.statusMessage || "Campaign gagal disimpan.";
  } finally {
    saving.value = false;
  }
}

async function archiveCampaign(campaign: CampaignRow) {
  if (!window.confirm(`Arsipkan campaign “${campaign.name}”?`)) return;

  try {
    await $fetch(`/api/campaigns/${campaign.id}`, { method: "DELETE" });
    successMessage.value = "Campaign berhasil diarsipkan.";
    await loadCampaigns();
  } catch (error: any) {
    errorMessage.value =
      error?.data?.message || error?.statusMessage || "Campaign gagal diarsipkan.";
  }
}

async function previewCampaign(campaign: CampaignRow) {
  try {
    const response = await $fetch<
      ApiResponse<{ short_url: string; target_url: string; blocked_url: string }>
    >(`/api/campaigns/${campaign.id}/preview`, { method: "POST" });
    previewUrl.value = response.data?.short_url ?? "";
  } catch (error: any) {
    errorMessage.value =
      error?.data?.message || error?.statusMessage || "Preview gagal dibuat.";
  }
}

function statusColor(status: CampaignStatus) {
  if (status === "active") return "success";
  if (status === "paused") return "warning";
  if (status === "blocked") return "error";
  return "neutral";
}

onMounted(loadCampaigns);
</script>

<template>
  <AppDashboardLayout id="campaigns" title="Campaigns">
    <template #content>
      <div class="space-y-6 p-4 sm:p-6">
        <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 class="text-xl font-semibold text-highlighted">Campaign URLs</h1>
            <p class="text-sm text-muted">Kelola short URL dan destination campaign.</p>
          </div>
          <UButton v-if="isEditing" label="Cancel edit" color="neutral" variant="outline" @click="resetForm" />
        </div>

        <UAlert v-if="errorMessage" color="error" title="Request gagal" :description="errorMessage" />
        <UAlert v-if="successMessage" color="success" title="Berhasil" :description="successMessage" />

        <UCard>
          <template #header>
            <h2 class="font-semibold">{{ isEditing ? "Edit campaign" : "Create campaign" }}</h2>
          </template>

          <form class="grid gap-4 md:grid-cols-2" @submit.prevent="saveCampaign">
            <UFormField label="Campaign name" required>
              <UInput v-model="form.name" class="w-full" placeholder="Spring promotion" required />
            </UFormField>
            <UFormField label="Status">
              <select v-model="form.status"
                class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="blocked">Blocked</option>
              </select>
            </UFormField>
            <UFormField label="Target URL" required>
              <UInput v-model="form.targetUrl" class="w-full" type="url" placeholder="https://example.com/landing"
                required />
            </UFormField>
            <UFormField label="Blocked destination URL" required>
              <UInput v-model="form.blockedUrl" class="w-full" type="url" placeholder="https://example.com/unavailable"
                required />
            </UFormField>
            <UFormField label="Start at">
              <input v-model="form.startsAt" type="datetime-local"
                class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm" />
            </UFormField>
            <UFormField label="Expires at">
              <input v-model="form.expiresAt" type="datetime-local"
                class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm" />
            </UFormField>
            <div class="rounded-lg border border-default p-4 md:col-span-2">
              <div class="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 class="font-medium">Tracking integrations</h3>
                  <p class="text-xs text-muted">Provider hanya diproses setelah consent visitor.</p>
                </div>
                <label class="flex items-center gap-2 text-sm"><input v-model="form.trackingEnabled" type="checkbox"
                    class="rounded border-default" /> Enable</label>
              </div>
              <div v-if="form.trackingEnabled" class="grid gap-3 md:grid-cols-2">
                <label class="flex items-center gap-2 text-sm md:col-span-2"><input v-model="form.consentRequired"
                    type="checkbox" class="rounded border-default" /> Require consent before sending events</label>
                <UFormField label="GA4 Measurement ID">
                  <UInput v-model="form.ga4MeasurementId" class="w-full" placeholder="G-XXXXXXXXXX" />
                </UFormField>
                <UFormField label="Meta Pixel ID">
                  <UInput v-model="form.metaPixelId" class="w-full" placeholder="Pixel ID" />
                </UFormField>
                <UFormField label="TikTok Pixel ID">
                  <UInput v-model="form.tiktokPixelId" class="w-full" placeholder="Pixel ID" />
                </UFormField>
                <UFormField label="Histats ID">
                  <UInput v-model="form.histatsId" class="w-full" placeholder="Counter ID" />
                </UFormField>
              </div>
            </div>
            <div class="flex items-end md:col-span-2">
              <UButton type="submit" :loading="saving" :label="isEditing ? 'Save changes' : 'Create campaign'" />
            </div>
          </form>
        </UCard>

        <UCard v-if="previewUrl">
          <div class="flex flex-col gap-2 text-sm">
            <span class="font-medium">Short URL preview</span>
            <a :href="previewUrl" target="_blank" rel="noopener noreferrer"
              class="break-all text-primary hover:underline">
              {{ previewUrl }}
            </a>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <h2 class="font-semibold">Your campaigns</h2>
              <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" :loading="loading"
                aria-label="Refresh" @click="loadCampaigns" />
            </div>
          </template>

          <div v-if="loading" class="py-10 text-center text-sm text-muted">Loading campaigns...</div>
          <div v-else-if="!campaigns.length" class="py-10 text-center text-sm text-muted">Belum ada campaign.</div>
          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-190 text-left text-sm">
              <thead class="border-b border-default text-muted">
                <tr>
                  <th class="px-3 py-3 font-medium">Name</th>
                  <th class="px-3 py-3 font-medium">Short code</th>
                  <th class="px-3 py-3 font-medium">Status</th>
                  <th class="px-3 py-3 font-medium">Created</th>
                  <th class="px-3 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="campaign in campaigns" :key="campaign.id" class="border-b border-default last:border-0">
                  <td class="px-3 py-3">
                    <div class="font-medium text-highlighted">{{ campaign.name }}</div>
                    <div class="max-w-xs truncate text-xs text-muted">{{ campaign.target_url }}</div>
                  </td>
                  <td class="px-3 py-3 font-mono text-xs">{{ campaign.short_code }}</td>
                  <td class="px-3 py-3">
                    <UBadge :color="statusColor(campaign.status)" variant="subtle">{{ campaign.status }}</UBadge>
                  </td>
                  <td class="px-3 py-3 text-muted">{{ new Date(campaign.created_at).toLocaleDateString() }}</td>
                  <td class="px-3 py-3">
                    <div class="flex justify-end gap-1">
                      <UButton label="Preview" size="xs" color="neutral" variant="ghost"
                        @click="previewCampaign(campaign)" />
                      <UButton label="Edit" size="xs" color="primary" variant="ghost" @click="editCampaign(campaign)" />
                      <UButton label="Archive" size="xs" color="error" variant="ghost"
                        @click="archiveCampaign(campaign)" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>
    </template>
  </AppDashboardLayout>
</template>
