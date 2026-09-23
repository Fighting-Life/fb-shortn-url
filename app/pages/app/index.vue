<script setup lang="ts">
type AnalyticsOverview = {
  range: { from: string; to: string };
  totals: {
    clicks: number;
    target_clicks: number;
    blocked_clicks: number;
    bot_clicks: number;
    expired_clicks: number;
  };
  daily: Array<{
    date: string;
    clicks: number;
    target_clicks: number;
    blocked_clicks: number;
  }>;
  top_campaigns: Array<{
    campaign_id: string;
    name: string;
    short_code: string;
    clicks: number;
    blocked_clicks: number;
  }>;
};

const analytics = ref<AnalyticsOverview | null>(null);
const loading = ref(true);
const errorMessage = ref("");

const maxDailyClicks = computed(() =>
  Math.max(...(analytics.value?.daily.map((item) => item.clicks) ?? [1]), 1),
);

const statCards = computed(() => {
  const totals = analytics.value?.totals;
  return [
    { label: "Total clicks", value: totals?.clicks ?? 0, icon: "i-lucide-mouse-pointer-click" },
    { label: "Target redirects", value: totals?.target_clicks ?? 0, icon: "i-lucide-arrow-up-right", color: "text-success" },
    { label: "Blocked redirects", value: totals?.blocked_clicks ?? 0, icon: "i-lucide-shield-alert", color: "text-warning" },
    { label: "Bot clicks", value: totals?.bot_clicks ?? 0, icon: "i-lucide-bot", color: "text-error" },
  ];
});

async function loadAnalytics() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await $fetch<ApiResponse<AnalyticsOverview>>("/api/analytics/overview");
    analytics.value = response.data ?? null;
  } catch (error: any) {
    errorMessage.value =
      error?.data?.message || error?.statusMessage || "Analytics gagal dimuat.";
  } finally {
    loading.value = false;
  }
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

onMounted(loadAnalytics);
</script>

<template>
  <AppDashboardLayout id="dashboard" title="Dashboard">
    <template #content>
      <div class="space-y-6 p-4 sm:p-6">
        <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 class="text-xl font-semibold text-highlighted">Analytics overview</h1>
            <p class="text-sm text-muted">Ringkasan performa campaign selama 30 hari terakhir.</p>
          </div>
          <UButton icon="i-lucide-refresh-cw" label="Refresh" color="neutral" variant="outline" :loading="loading"
            @click="loadAnalytics" />
        </div>

        <UAlert v-if="errorMessage" color="error" title="Analytics unavailable" :description="errorMessage" />

        <div v-if="loading" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <USkeleton v-for="item in 4" :key="item" class="h-28 rounded-xl" />
        </div>

        <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <UCard v-for="card in statCards" :key="card.label">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted">{{ card.label }}</span>
              <UIcon :name="card.icon" class="size-5" :class="card.color || 'text-primary'" />
            </div>
            <div class="mt-3 text-2xl font-semibold text-highlighted">{{ card.value.toLocaleString() }}</div>
          </UCard>
        </div>

        <div class="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <UCard>
            <template #header>
              <div>
                <h2 class="font-semibold">Click trend</h2>
                <p class="text-xs text-muted">Daily aggregated clicks</p>
              </div>
            </template>

            <div v-if="!analytics?.daily.length" class="py-12 text-center text-sm text-muted">
              Belum ada data click.
            </div>
            <div v-else class="flex h-64 items-end gap-2 overflow-x-auto pb-7 pt-4">
              <div v-for="item in analytics.daily" :key="item.date"
                class="group flex h-full min-w-7 flex-1 flex-col items-center justify-end gap-2">
                <span class="text-[10px] text-muted opacity-0 transition-opacity group-hover:opacity-100">
                  {{ item.clicks }}
                </span>
                <div class="w-full min-w-4 rounded-t bg-primary transition-all group-hover:bg-primary/70"
                  :style="{ height: `${Math.max((item.clicks / maxDailyClicks) * 85, item.clicks ? 5 : 1)}%` }"
                  :title="`${item.clicks} clicks`" />
                <span class="whitespace-nowrap text-[10px] text-muted">{{ formatDate(item.date) }}</span>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div>
                <h2 class="font-semibold">Redirect outcomes</h2>
                <p class="text-xs text-muted">Target vs blocked traffic</p>
              </div>
            </template>
            <div class="space-y-4">
              <div>
                <div class="mb-1 flex justify-between text-sm">
                  <span>Target</span>
                  <span class="font-medium">{{ analytics?.totals.target_clicks ?? 0 }}</span>
                </div>
                <div class="h-2 rounded-full bg-elevated">
                  <div class="h-2 rounded-full bg-success"
                    :style="{ width: `${analytics?.totals.clicks ? ((analytics.totals.target_clicks / analytics.totals.clicks) * 100) : 0}%` }" />
                </div>
              </div>
              <div>
                <div class="mb-1 flex justify-between text-sm">
                  <span>Blocked</span>
                  <span class="font-medium">{{ analytics?.totals.blocked_clicks ?? 0 }}</span>
                </div>
                <div class="h-2 rounded-full bg-elevated">
                  <div class="h-2 rounded-full bg-warning"
                    :style="{ width: `${analytics?.totals.clicks ? ((analytics.totals.blocked_clicks / analytics.totals.clicks) * 100) : 0}%` }" />
                </div>
              </div>
              <div class="border-t border-default pt-4 text-xs text-muted">
                Expired: {{ analytics?.totals.expired_clicks ?? 0 }} · Bots: {{ analytics?.totals.bot_clicks ?? 0 }}
              </div>
            </div>
          </UCard>
        </div>

        <UCard>
          <template #header>
            <div>
              <h2 class="font-semibold">Top campaigns</h2>
              <p class="text-xs text-muted">Campaign dengan click terbanyak pada periode ini</p>
            </div>
          </template>
          <div v-if="!analytics?.top_campaigns.length" class="py-10 text-center text-sm text-muted">
            Belum ada campaign analytics.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-160 text-left text-sm">
              <thead class="border-b border-default text-muted">
                <tr>
                  <th class="px-3 py-3 font-medium">Campaign</th>
                  <th class="px-3 py-3 font-medium">Short code</th>
                  <th class="px-3 py-3 text-right font-medium">Clicks</th>
                  <th class="px-3 py-3 text-right font-medium">Blocked</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="campaign in analytics.top_campaigns" :key="campaign.campaign_id"
                  class="border-b border-default last:border-0">
                  <td class="px-3 py-3 font-medium text-highlighted">{{ campaign.name }}</td>
                  <td class="px-3 py-3 font-mono text-xs text-muted">{{ campaign.short_code }}</td>
                  <td class="px-3 py-3 text-right">{{ campaign.clicks.toLocaleString() }}</td>
                  <td class="px-3 py-3 text-right">
                    <UBadge color="warning" variant="subtle">{{ campaign.blocked_clicks.toLocaleString() }}</UBadge>
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
