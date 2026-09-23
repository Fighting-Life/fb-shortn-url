<script setup lang="ts">
const route = useRoute();

definePageMeta({
  layout: "default",
});
useSeoMeta({
  title: "Terms of Service - LinkMask",
  description: "Terms of Service - LinkMask - Secure URL Shortener & Link Cloaker",
  ogTitle: "Terms of Service - LinkMask",
  ogDescription: "Terms of Service - LinkMask - Secure URL Shortener & Link Cloaker",
  robots: "noindex, nofollow",
  ogImage: "/logo.png",
  ogUrl: route.fullPath,
  twitterCard: "summary_large_image",
  twitterTitle: "Terms of Service - LinkMask",
  twitterDescription: "Terms of Service - LinkMask - Secure URL Shortener & Link Cloaker",
  twitterImage: "/logo.png",
  twitterSite: "@forge_ai",
  twitterCreator: "@forge_ai",
});

</script>

<template>
  <section class="mx-auto max-w-3xl px-6 py-20">
    <h1 class="font-display text-4xl tracking-tight">Terms of Service</h1>
    <p class="mt-3 text-sm text-[var(--page-muted)]">Terakhir diperbarui: 23 September 2026</p>

    <div class="mt-10 space-y-8 text-[var(--page-muted)]">
      <div>
        <h2 class="font-medium text-[var(--page-ink)]">1. Penggunaan layanan</h2>
        <p class="mt-2">
          LinkRoute disediakan sebagai layanan short-link, redirect, attribution, dan analytics untuk digunakan
          pada domain yang Anda kendalikan sendiri. Anda bertanggung jawab atas konten dan tujuan setiap
          campaign yang dibuat melalui akun Anda.
        </p>
      </div>
      <div>
        <h2 class="font-medium text-[var(--page-ink)]">2. Batasan penggunaan</h2>
        <p class="mt-2">
          Anda dilarang menggunakan layanan untuk menyamarkan tujuan URL, memalsukan host atau platform,
          melewati sistem keamanan pihak ketiga, atau melakukan cloaking berbasis crawler-versus-manusia
          untuk menipu pengguna maupun platform. Pelanggaran dapat mengakibatkan suspend atau penghentian akun.
        </p>
      </div>
      <div>
        <h2 class="font-medium text-[var(--page-ink)]">3. Kepatuhan pihak ketiga</h2>
        <p class="mt-2">
          Anda tetap bertanggung jawab mematuhi Terms of Service platform pihak ketiga (termasuk Meta),
          kebijakan iklan yang berlaku, dan hukum privasi di yurisdiksi Anda saat menjalankan campaign
          melalui LinkRoute.
        </p>
      </div>
      <div>
        <h2 class="font-medium text-[var(--page-ink)]">4. Ketersediaan dan perubahan layanan</h2>
        <p class="mt-2">
          Kami dapat memperbarui fitur, batas rate-limit, atau kebijakan retensi analytics dari waktu ke waktu.
          Perubahan material akan diinformasikan melalui email atau dashboard.
        </p>
      </div>
      <div>
        <h2 class="font-medium text-[var(--page-ink)]">5. Penghentian akun</h2>
        <p class="mt-2">
          Kami berhak menangguhkan atau menghentikan akun yang terbukti melanggar kebijakan anti-abuse,
          termasuk penggunaan redirect untuk phishing, malware, atau pelanggaran hukum lainnya.
        </p>
      </div>
      <div>
        <h2 class="font-medium text-[var(--page-ink)]">6. Kontak</h2>
        <p class="mt-2">
          Pertanyaan terkait ketentuan ini dapat dikirim melalui halaman
          <NuxtLink to="/contact" class="underline text-[var(--page-ink)]">Kontak</NuxtLink>.
        </p>
      </div>
    </div>
  </section>
</template>
