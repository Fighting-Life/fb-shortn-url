<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-[var(--page-border)] mt-24">
    <div class="mx-auto max-w-6xl px-6 py-12 grid gap-10 sm:grid-cols-2 md:grid-cols-4 text-sm">
      <div class="md:col-span-1">
        <div class="flex items-center gap-2 mb-3">
          <span class="w-2.5 h-2.5 rounded-full bg-pine-500" aria-hidden="true" />
          <span class="font-display text-base">Link Mask</span>
        </div>
        <p class="text-[var(--page-muted)] prose-measure">
          Shortlink, redirect, dan attribution di domain milik Anda sendiri — transparan dan teraudit.
        </p>
      </div>

      <div>
        <p class="font-medium mb-3">Produk</p>
        <ul class="space-y-2 text-[var(--page-muted)]">
          <li>
            <NuxtLink to="/#features" class="hover:text-[var(--page-ink)]">Fitur</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/docs" class="hover:text-[var(--page-ink)]">Docs</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/blog" class="hover:text-[var(--page-ink)]">Blog</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/faq" class="hover:text-[var(--page-ink)]">FAQ</NuxtLink>
          </li>
        </ul>
      </div>

      <div>
        <p class="font-medium mb-3">Perusahaan</p>
        <ul class="space-y-2 text-[var(--page-muted)]">
          <li>
            <NuxtLink to="/about" class="hover:text-[var(--page-ink)]">Tentang</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/contact" class="hover:text-[var(--page-ink)]">Kontak</NuxtLink>
          </li>
        </ul>
      </div>

      <div>
        <p class="font-medium mb-3">Legal</p>
        <ul class="space-y-2 text-[var(--page-muted)]">
          <li>
            <NuxtLink to="/terms" class="hover:text-[var(--page-ink)]">Terms of Service</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/privacy" class="hover:text-[var(--page-ink)]">Privacy Policy</NuxtLink>
          </li>
        </ul>
      </div>
    </div>

    <div class="border-t border-[var(--page-border)]">
      <div
        class="mx-auto max-w-6xl px-6 py-5 text-xs text-[var(--page-muted)] flex flex-col sm:flex-row gap-2 justify-between">
        <span>© {{ year }} Link Mask. Seluruh hak cipta dilindungi.</span>
        <span>Dibangun untuk redirect yang jujur dan dapat diaudit.</span>
      </div>
    </div>
  </footer>
</template>
