<script setup lang="ts">
const route = useRoute();

definePageMeta({
  layout: "default",
});
useSeoMeta({
  title: "About LinkMask",
  description: "About LinkMask - Secure URL Shortener & Link Cloaker",
  ogTitle: "About LinkMask",
  ogDescription: "About LinkMask - Secure URL Shortener & Link Cloaker",
  robots: "index, follow",
  ogImage: "/logo.png",
  ogUrl: route.fullPath,
  twitterCard: "summary_large_image",
  twitterTitle: "About LinkMask",
  twitterDescription: "About LinkMask - Secure URL Shortener & Link Cloaker",
  twitterImage: "/logo.png",
  twitterSite: "@forge_ai",
  twitterCreator: "@forge_ai",
});

const principles = [
  { title: 'Fail closed, bukan fail silent', body: 'Rule yang tidak jelas diarahkan ke blocked, bukan diteruskan begitu saja ke target.' },
  { title: 'Auditable by default', body: 'Setiap tindakan admin dan perubahan campaign tercatat, bukan opsional di roadmap.' },
  { title: 'Data seminimal mungkin', body: 'Kami menyimpan agregat, bukan raw IP atau fingerprint, kecuali benar-benar diperlukan dan berbatas waktu.' }
]
</script>

<template>
  <section class="mx-auto max-w-3xl px-6 py-20">
    <h1 class="font-display text-4xl tracking-tight">Tentang LinkRoute</h1>
    <p class="mt-5 text-[var(--page-muted)] text-lg">
      LinkRoute dibangun karena kebanyakan tool shortlink memperlakukan redirect sebagai kotak hitam.
      Kami percaya tim marketing dan engineering berhak tahu persis ke mana visitor mereka diarahkan,
      berdasarkan rule apa, dan siapa yang mengubahnya.
    </p>

    <div class="mt-12 space-y-8">
      <div v-for="p in principles" :key="p.title" class="border-t border-[var(--page-border)] pt-5">
        <h2 class="font-medium">{{ p.title }}</h2>
        <p class="mt-2 text-[var(--page-muted)]">{{ p.body }}</p>
      </div>
    </div>

    <div class="mt-14 border-t border-[var(--page-border)] pt-8">
      <h2 class="font-display text-2xl tracking-tight">Untuk siapa</h2>
      <p class="mt-3 text-[var(--page-muted)]">
        Tim performance marketing yang menjalankan campaign berbayar, tim growth yang perlu attribution
        yang bersih, dan tim engineering yang bertanggung jawab menjaga redirect tetap cepat dan aman
        di domain milik perusahaan sendiri.
      </p>
    </div>
  </section>
</template>
