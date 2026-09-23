<script setup lang="ts">
definePageMeta({ middleware: ["auth", "admin"] });

type AuditItem = { id: string; action: string; resource: string; resource_id: string | null; user: { name: string; email: string }; created_at: string };
const settings = reactive<Record<string, string>>({});
const logs = ref<AuditItem[]>([]);
const loading = ref(true);
const saving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

async function loadData() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const [settingsResponse, logsResponse] = await Promise.all([
      $fetch<ApiResponse<{ values: Record<string, string> }>>("/api/admin/settings"),
      $fetch<ApiResponse<{ items: AuditItem[] }>>("/api/admin/audit-logs?limit=20"),
    ]);
    Object.assign(settings, settingsResponse.data?.values ?? {});
    logs.value = logsResponse.data?.items ?? [];
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.statusMessage || "Settings gagal dimuat.";
  } finally {
    loading.value = false;
  }
}

async function saveSettings() {
  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  try {
    await $fetch("/api/admin/settings", { method: "PATCH", body: { values: settings } });
    successMessage.value = "Settings berhasil disimpan.";
    await loadData();
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.statusMessage || "Settings gagal disimpan.";
  } finally {
    saving.value = false;
  }
}

function formatDate(value: string) { return new Date(value).toLocaleString(); }
onMounted(loadData);
</script>

<template>
  <AppDashboardLayout id="settings" title="Settings">
    <template #content>
      <div class="space-y-6 p-4 sm:p-6">
        <div>
          <h1 class="text-xl font-semibold text-highlighted">Admin settings</h1>
          <p class="text-sm text-muted">Konfigurasi global redirect, rate limit, consent, dan retention.</p>
        </div>
        <UAlert v-if="errorMessage" color="error" title="Request gagal" :description="errorMessage" />
        <UAlert v-if="successMessage" color="success" title="Berhasil" :description="successMessage" />
        <div v-if="loading" class="py-10 text-center text-sm text-muted">Loading settings...</div>
        <template v-else>
          <UCard>
            <form class="grid gap-4 md:grid-cols-2" @submit.prevent="saveSettings">
              <UFormField label="Default redirect status"><select v-model="settings.default_redirect_status"
                  class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm">
                  <option value="302">302</option>
                  <option value="307">307</option>
                </select></UFormField>
              <UFormField label="Allowed target schemes">
                <UInput v-model="settings.allowed_target_schemes" class="w-full" />
              </UFormField>
              <UFormField label="Analytics retention (days)">
                <UInput v-model="settings.analytics_retention_days" class="w-full" type="number" min="1" />
              </UFormField>
              <UFormField label="Rate limit per minute">
                <UInput v-model="settings.rate_limit_per_minute" class="w-full" type="number" min="1" />
              </UFormField>
              <UFormField label="GeoIP provider">
                <UInput v-model="settings.geoip_provider" class="w-full" />
              </UFormField>
              <UFormField label="Abuse contact email">
                <UInput v-model="settings.abuse_contact_email" class="w-full" type="email" />
              </UFormField>
              <UFormField label="Tracking consent required"><select v-model="settings.tracking_consent_required"
                  class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm">
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select></UFormField>
              <UFormField label="Maintenance mode"><select v-model="settings.maintenance_mode"
                  class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm">
                  <option value="false">Disabled</option>
                  <option value="true">Enabled</option>
                </select></UFormField>
              <div class="md:col-span-2">
                <UButton type="submit" label="Save settings" :loading="saving" />
              </div>
            </form>
          </UCard>
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="font-semibold">Recent audit logs</h2>
                  <p class="text-xs text-muted">Perubahan admin terakhir</p>
                </div>
                <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" aria-label="Refresh"
                  @click="loadData" />
              </div>
            </template>
            <div v-if="!logs.length" class="py-8 text-center text-sm text-muted">Belum ada audit log.</div>
            <div v-else class="overflow-x-auto">
              <table class="w-full min-w-160 text-left text-sm">
                <thead class="border-b border-default text-muted">
                  <tr>
                    <th class="px-3 py-3">Time</th>
                    <th class="px-3 py-3">Actor</th>
                    <th class="px-3 py-3">Action</th>
                    <th class="px-3 py-3">Resource</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="log in logs" :key="log.id" class="border-b border-default last:border-0">
                    <td class="px-3 py-3 text-muted">{{ formatDate(log.created_at) }}</td>
                    <td class="px-3 py-3">{{ log.user.name }}<div class="text-xs text-muted">{{ log.user.email }}</div>
                    </td>
                    <td class="px-3 py-3">
                      <UBadge color="neutral" variant="subtle">{{ log.action }}</UBadge>
                    </td>
                    <td class="px-3 py-3">{{ log.resource }}<span v-if="log.resource_id"
                        class="ml-1 text-xs text-muted">({{
                        log.resource_id }})</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </UCard>
        </template>
      </div>
    </template>
  </AppDashboardLayout>
</template>
