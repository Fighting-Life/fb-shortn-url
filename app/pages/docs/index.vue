<script setup lang="ts">
const route = useRoute();

definePageMeta({
  layout: "default",
});
useSeoMeta({
  title: "Dokumentasi - LinkMask",
  description: "Dokumentasi - LinkMask - Secure URL Shortener & Link Cloaker",
  ogTitle: "Dokumentasi - LinkMask",
  ogDescription: "Dokumentasi - LinkMask - Secure URL Shortener & Link Cloaker",
  robots: "noindex, nofollow",
  ogImage: "/logo.png",
  ogUrl: route.fullPath,
  twitterCard: "summary_large_image",
  twitterTitle: "Dokumentasi - LinkMask",
  twitterDescription: "Dokumentasi - LinkMask - Secure URL Shortener & Link Cloaker",
  twitterImage: "/logo.png",
  twitterSite: "@forge_ai",
  twitterCreator: "@forge_ai",
});

const sections = [
  {
    title: 'Memulai',
    body: 'Hubungkan domain Anda, buat campaign pertama, dan pahami struktur short URL.',
    code: 'GET /r/:shortCode'
  },
  {
    title: 'Membuat campaign',
    body: 'Tentukan targetUrl, blockedUrl, jadwal aktif, dan domain yang diizinkan sebelum campaign dipublikasikan.',
    code: 'POST /api/campaigns'
  },
  {
    title: 'Rule device, negara, IP',
    body: 'Definisikan allow, exclude, dan fallback. Rule yang tidak lengkap akan fail closed ke blockedUrl.',
    code: 'ruleConfig: { allow, exclude, fallback }'
  },
  {
    title: 'Membaca analytics',
    body: 'Ambil ringkasan klik, outcome, dan tren melalui endpoint analytics dengan permission check bawaan.',
    code: 'GET /api/analytics/campaigns/:id'
  }
]
</script>

<template>
  <section class="mx-auto max-w-4xl px-6 py-20">
    <h1 class="font-display text-4xl tracking-tight">Dokumentasi</h1>
    <p class="mt-4 text-[var(--page-muted)] prose-measure">
      Panduan ringkas untuk mengintegrasikan campaign, rule redirect, dan analytics LinkRoute ke alur kerja Anda.
    </p>

    <div class="mt-12 space-y-10">
      <div v-for="s in sections" :key="s.title"
        class="border-t border-[var(--page-border)] pt-6 grid sm:grid-cols-3 gap-6">
        <div class="sm:col-span-1">
          <h2 class="font-medium">{{ s.title }}</h2>
        </div>
        <div class="sm:col-span-2">
          <p class="text-[var(--page-muted)] prose-measure">{{ s.body }}</p>
          <pre
            class="mt-3 rounded-md border border-[var(--page-border)] bg-[var(--page-surface)] px-4 py-3 text-sm font-mono-data overflow-x-auto">
            {{ s.code }}</pre>
        </div>
      </div>
    </div>

    <div class="mt-14 border-t border-[var(--page-border)] pt-8">
      <p class="text-[var(--page-muted)]">
        Butuh referensi API lengkap atau bantuan integrasi? <NuxtLink to="/contact"
          class="underline text-[var(--page-ink)]">Hubungi tim kami</NuxtLink>.
      </p>
    </div>
  </section>
</template>
