<script setup lang="ts">

const { loggedIn } = useUserSession()
const colorMode = useColorMode()
const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (v) => { colorMode.preference = v ? 'dark' : 'light' }
})

const nav = [
  { label: 'Beranda', to: '/' },
  { label: 'Tentang', to: '/about' },
  { label: 'Docs', to: '/docs' },
  { label: 'Blog', to: '/blog' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Kontak', to: '/contact' }
]

const mobileOpen = ref(false)
</script>

<template>
  <header class="border-b border-(--page-border) sticky top-0 z-40 bg-(--page-bg)/90 backdrop-blur">
    <div class="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
      <NuxtLink to="/" class="flex items-center gap-2 shrink-0">
        <span class="w-2.5 h-2.5 rounded-full bg-pine-500" aria-hidden="true" />
        <span class="font-display text-lg tracking-tight">Link Mask</span>
      </NuxtLink>

      <nav class="hidden md:flex items-center gap-7 text-sm">
        <NuxtLink v-for="item in nav" :key="item.to" :to="item.to"
          class="text-(--page-muted) hover:text-[var(--page-ink)] transition-colors"
          active-class="text-[var(--page-ink)] font-medium">
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="flex items-center gap-2">
        <UButton :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'" color="neutral" variant="ghost"
          aria-label="Ubah tema gelap/terang" @click="isDark = !isDark" />
        <UButton v-if="!loggedIn" to="/signup" color="primary" size="sm" class="hidden sm:inline-flex">
          Mulai
        </UButton>
        <UButton v-if="loggedIn" to="/app" color="primary" size="sm" class="hidden sm:inline-flex">
          Dashboard
        </UButton>
        <UButton class="md:hidden" icon="i-lucide-menu" color="neutral" variant="ghost" aria-label="Buka menu"
          @click="mobileOpen = !mobileOpen" />
      </div>
    </div>

    <div v-if="mobileOpen" class="md:hidden border-t border-[var(--page-border)] px-6 py-4 flex flex-col gap-4 text-sm">
      <NuxtLink v-for="item in nav" :key="item.to" :to="item.to" class="text-[var(--page-muted)]"
        @click="mobileOpen = false">
        {{ item.label }}
      </NuxtLink>
    </div>
  </header>
</template>
