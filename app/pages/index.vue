<script setup lang="ts">
const route = useRoute();

definePageMeta({
  layout: "default",
});
useSeoMeta({
  title: "Link Mask - Secure URL Shortener & Link Cloaker",
  description: "Shorten, hide, and protect your destination links. Cloakify offers secure URL cloaking, advanced link tracking, and seamless redirects for marketers.",
  ogTitle: "Link Mask",
  ogDescription: "Secure URL shortener and link cloaker",
  robots: "noindex, nofollow",
  ogImage: "/logo.png",
  ogUrl: route.fullPath,
  twitterCard: "summary_large_image",
  twitterTitle: "Link Mask",
  twitterDescription: "Secure URL shortener and link cloaker",
  twitterImage: "/logo.png",
  twitterSite: "@forge_ai",
  twitterCreator: "@forge_ai",
});

const features = [
  {
    title: 'Campaign shortlink',
    body: 'Buat, jadwalkan, pause, dan arsipkan short URL per campaign. Setiap perubahan tercatat di audit log.'
  },
  {
    title: 'Rule device, negara, IP',
    body: 'Arahkan visitor berdasarkan allowlist atau exclude list yang terdokumentasi, dengan fallback yang jelas.'
  },
  {
    title: 'Analytics agregat',
    body: 'Klik, unique click, dan blocked click ditampilkan sebagai tren — tanpa menahan raw IP lebih lama dari perlu.'
  },
  {
    title: 'Governance bawaan',
    body: 'Role admin/user, abuse report, dan kill switch tersedia sejak awal, bukan tempelan di akhir.'
  }
]

const steps = [
  { n: '1', title: 'Buat shortlink', body: 'Tentukan target URL dan blocked URL di domain Anda sendiri, lalu validasi otomatis mencegah open redirect.' },
  { n: '2', title: 'Atur rule', body: 'Set kebijakan device, negara, dan IP — fail closed untuk kondisi yang tidak dikenal.' },
  { n: '3', title: 'Pantau hasil', body: 'Lihat outcome redirect dan attribution di dashboard, diperbarui tanpa memperlambat kecepatan redirect.' }
]
</script>


<template>
  <div>
    <!-- Hero -->
    <section class="mx-auto max-w-6xl px-6 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
      <div>
        <h1 class="font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight">
          Redirect yang bisa Anda pertanggungjawabkan.
        </h1>
        <p class="mt-5 text-(--page-muted) text-lg prose-measure">
          Link Mask mengelola shortlink, rule redirect, dan attribution di domain milik Anda sendiri —
          setiap tujuan tervalidasi, setiap keputusan rule dapat diaudit.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <UButton to="/signup" size="lg" color="primary">Mulai gunakan</UButton>
          <UButton to="/docs" size="lg" color="neutral" variant="outline">Baca dokumentasi</UButton>
        </div>
        <p class="mt-6 text-sm font-mono-data text-(--page-muted)">
          go.domainanda.com/r/8fQ2xK
        </p>
      </div>
      <HomeRouteDiagram class="text-pine-500" />
    </section>

    <!-- Compliance strip -->
    <section class="border-y border-(--page-border) bg-(--page-surface)">
      <div class="mx-auto max-w-6xl px-6 py-6 flex flex-col sm:flex-row gap-3 sm:gap-8 text-sm text-(--page-muted)">
        <p class="prose-measure">
          Dijalankan di domain yang Anda kendalikan sendiri. Tidak ada cloaking bot-vs-manusia,
          tidak ada penyamaran host tujuan — setiap redirect transparan dan sesuai kebijakan platform.
        </p>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="mx-auto max-w-6xl px-6 py-20">
      <h2 class="font-display text-3xl tracking-tight max-w-md">
        Satu dashboard untuk seluruh siklus redirect.
      </h2>
      <div class="mt-10 grid sm:grid-cols-2 gap-x-10 gap-y-10">
        <div v-for="f in features" :key="f.title" class="border-t border-(--page-border) pt-4">
          <h3 class="font-medium">{{ f.title }}</h3>
          <p class="mt-2 text-sm text-(--page-muted) prose-measure">{{ f.body }}</p>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="mx-auto max-w-6xl px-6 py-20 border-t border-[var(--page-border)]">
      <h2 class="font-display text-3xl tracking-tight max-w-md">Cara kerjanya.</h2>
      <div class="mt-10 grid md:grid-cols-3 gap-10">
        <div v-for="s in steps" :key="s.n">
          <span class="font-mono-data text-sm text-pine-500">{{ s.n }}</span>
          <h3 class="mt-2 font-medium">{{ s.title }}</h3>
          <p class="mt-2 text-sm text-[var(--page-muted)] prose-measure">{{ s.body }}</p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="mx-auto max-w-6xl px-6 py-20 border-t border-[var(--page-border)]">
      <div
        class="rounded-lg border border-[var(--page-border)] bg-[var(--page-surface)] px-8 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 class="font-display text-2xl tracking-tight">Siap memindahkan campaign ke domain sendiri?</h2>
          <p class="mt-2 text-[var(--page-muted)] prose-measure">Hubungi tim kami untuk onboarding, atau langsung baca
            panduan integrasinya.</p>
        </div>
        <div class="flex gap-3 shrink-0">
          <UButton to="/signup" color="primary">Hubungi kami</UButton>
          <UButton to="/faq" color="neutral" variant="ghost">Lihat FAQ</UButton>
        </div>
      </div>
    </section>
  </div>
</template>
