<script setup lang="ts">
const route = useRoute();

definePageMeta({
  layout: "default",
});
useSeoMeta({
  title: "Blog - LinkMask",
  description: "Blog - LinkMask - Secure URL Shortener & Link Cloaker",
  ogTitle: "Blog - LinkMask",
  ogDescription: "Blog - LinkMask - Secure URL Shortener & Link Cloaker",
  robots: "noindex, nofollow",
  ogImage: "/logo.png",
  ogUrl: route.fullPath,
  twitterCard: "summary_large_image",
  twitterTitle: "Blog - LinkMask",
  twitterDescription: "Blog - LinkMask - Secure URL Shortener & Link Cloaker",
  twitterImage: "/logo.png",
  twitterSite: "@forge_ai",
  twitterCreator: "@forge_ai",
});

const posts = [
  {
    title: 'Kenapa redirect Anda harus fail closed',
    date: '15 Sep 2026',
    excerpt: 'Rule yang tidak lengkap seharusnya diarahkan ke blocked, bukan diteruskan diam-diam ke target. Berikut alasannya.'
  },
  {
    title: 'Attribution tanpa menyimpan data mentah',
    date: '2 Sep 2026',
    excerpt: 'Cara menghitung click attribution yang berguna tanpa menahan raw IP atau fbclid lebih lama dari perlu.'
  },
  {
    title: 'Menjaga redirect tetap cepat di serverless',
    date: '20 Agu 2026',
    excerpt: 'Pola pemisahan redirect path dari proses analytics berat agar latensi tetap rendah di Vercel Functions.'
  }
]
</script>

<template>
  <section class="mx-auto max-w-3xl px-6 py-20">
    <h1 class="font-display text-4xl tracking-tight">Blog</h1>
    <p class="mt-4 text-[var(--page-muted)]">Catatan teknis dan praktik seputar redirect, attribution, dan governance.
    </p>

    <div class="mt-12 space-y-10">
      <article v-for="p in posts" :key="p.title" class="border-t border-[var(--page-border)] pt-6">
        <p class="text-xs font-mono-data text-[var(--page-muted)]">{{ p.date }}</p>
        <h2 class="mt-2 font-display text-2xl tracking-tight">{{ p.title }}</h2>
        <p class="mt-2 text-[var(--page-muted)] prose-measure">{{ p.excerpt }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped></style>
