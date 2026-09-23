<script setup lang="ts">

const route = useRoute();

definePageMeta({
  layout: "default",
});
useSeoMeta({
  title: "FAQ - LinkMask",
  description: "FAQ - LinkMask - Secure URL Shortener & Link Cloaker",
  ogTitle: "FAQ - LinkMask",
  ogDescription: "FAQ - LinkMask - Secure URL Shortener & Link Cloaker",
  robots: "noindex, nofollow",
  ogImage: "/logo.png",
  ogUrl: route.fullPath,
  twitterCard: "summary_large_image",
  twitterTitle: "FAQ - LinkMask",
  twitterDescription: "FAQ - LinkMask - Secure URL Shortener & Link Cloaker",
  twitterImage: "/logo.png",
  twitterSite: "@forge_ai",
  twitterCreator: "@forge_ai",
});

const items = [
  {
    label: 'Apakah LinkRoute bisa memakai domain saya sendiri?',
    content: 'Ya. LinkRoute dirancang untuk dijalankan di subdomain atau domain yang Anda kendalikan sendiri, misalnya go.perusahaananda.com — bukan domain pihak ketiga.'
  },
  {
    label: 'Apakah redirect bisa menyamarkan tujuan URL?',
    content: 'Tidak. Setiap redirect bersifat transparan dan tervalidasi. LinkRoute tidak mendukung penyamaran host, cloaking bot-vs-manusia, atau upaya melewati sistem keamanan platform.'
  },
  {
    label: 'Data apa saja yang disimpan dari setiap klik?',
    content: 'Secara default kami menyimpan event minimal (waktu, outcome, device, negara agregat) dan mengagregasinya harian. Raw IP dan parameter seperti fbclid di-hash bila memang perlu disimpan.'
  },
  {
    label: 'Bagaimana cara kerja rule device/negara/IP?',
    content: 'Anda menentukan allowlist atau exclude list per campaign. Jika data tidak tersedia atau rule tidak jelas, sistem fail closed dan mengarahkan ke blocked URL, bukan meneruskan begitu saja.'
  },
  {
    label: 'Apakah tersedia audit log?',
    content: 'Ya. Setiap perubahan campaign dan tindakan admin — termasuk perubahan role, suspend user, dan perubahan setting — tercatat di audit log yang dapat ditinjau.'
  },
  {
    label: 'Apakah integrasi tracking (GA4, Meta, TikTok) wajib?',
    content: 'Tidak. Semua integrasi tracking bersifat opt-in per campaign dan mengikuti model consent yang Anda tetapkan.'
  }
]
</script>

<template>
  <section class="mx-auto max-w-3xl px-6 py-20">
    <h1 class="font-display text-4xl tracking-tight">Pertanyaan yang sering diajukan</h1>
    <p class="mt-4 text-[var(--page-muted)]">
      Tidak menemukan jawaban? <NuxtLink to="/contact" class="underline text-[var(--page-ink)]">Hubungi kami</NuxtLink>
      langsung.
    </p>

    <UAccordion :items="items" class="mt-10" />
  </section>
</template>
