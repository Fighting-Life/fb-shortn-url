<script lang="ts" setup>

const route = useRoute();

definePageMeta({
  layout: "default",
});
useSeoMeta({
  title: "Privacy Policy - LinkMask",
  description: "Privacy Policy - LinkMask - Secure URL Shortener & Link Cloaker",
  ogTitle: "Privacy Policy - LinkMask",
  ogDescription: "Privacy Policy - LinkMask - Secure URL Shortener & Link Cloaker",
  robots: "noindex, nofollow",
  ogImage: "/logo.png",
  ogUrl: route.fullPath,
  twitterCard: "summary_large_image",
  twitterTitle: "Privacy Policy - LinkMask",
  twitterDescription: "Privacy Policy - LinkMask - Secure URL Shortener & Link Cloaker",
  twitterImage: "/logo.png",
  twitterSite: "@forge_ai",
  twitterCreator: "@forge_ai",
});


</script>
<template>
  <section class="mx-auto max-w-3xl px-6 py-20">
    <h1 class="font-display text-4xl tracking-tight">Privacy Policy</h1>
    <p class="mt-3 text-sm text-[var(--page-muted)]">Terakhir diperbarui: 23 September 2026</p>

    <div class="mt-10 space-y-8 text-[var(--page-muted)]">
      <div>
        <h2 class="font-medium text-[var(--page-ink)]">1. Data yang kami kumpulkan</h2>
        <p class="mt-2">
          Kami mengumpulkan data akun (nama, email), data campaign yang Anda buat, dan event redirect
          minimal (waktu, outcome, device, negara agregat). Kami meminimalkan penyimpanan raw IP,
          user-agent, dan parameter attribution seperti <code class="font-mono-data">fbclid</code>
          — jika disimpan, data ini di-hash atau di-salt dan memiliki batas retensi.
        </p>
      </div>
      <div>
        <h2 class="font-medium text-[var(--page-ink)]">2. Dasar dan tujuan pemrosesan</h2>
        <p class="mt-2">
          Data diproses untuk menjalankan redirect, menghasilkan analytics agregat, mencegah abuse,
          dan memenuhi kewajiban kontraktual dengan Anda sebagai pengguna layanan.
        </p>
      </div>
      <div>
        <h2 class="font-medium text-[var(--page-ink)]">3. Retensi data</h2>
        <p class="mt-2">
          Event klik detail disimpan dalam jangka pendek untuk kebutuhan operasional, kemudian
          diagregasi menjadi metrik harian. Jangka retensi spesifik dikonfigurasi di pengaturan akun.
        </p>
      </div>
      <div>
        <h2 class="font-medium text-[var(--page-ink)]">4. Berbagi data</h2>
        <p class="mt-2">
          Kami tidak menjual data pribadi. Integrasi tracking pihak ketiga (GA4, Meta, TikTok) bersifat
          opt-in per campaign dan hanya aktif sesuai konfigurasi serta persetujuan yang Anda tetapkan.
        </p>
      </div>
      <div>
        <h2 class="font-medium text-[var(--page-ink)]">5. Hak Anda</h2>
        <p class="mt-2">
          Anda dapat meminta akses, koreksi, atau penghapusan data akun dan campaign Anda melalui
          <NuxtLink to="/contact" class="underline text-[var(--page-ink)]">halaman Kontak</NuxtLink>.
        </p>
      </div>
      <div>
        <h2 class="font-medium text-[var(--page-ink)]">6. Keamanan</h2>
        <p class="mt-2">
          Sesi login menggunakan cookie HttpOnly dan Secure, dan seluruh mutasi penting tercatat
          dalam audit log internal untuk mendukung investigasi bila diperlukan.
        </p>
      </div>
    </div>
  </section>
</template>
