<script setup lang="ts"></script>

<template>
  <div class="min-h-screen flex flex-col bg-[var(--page-bg)] text-[var(--page-ink)] transition-colors">
    <HomeHeader />
    <main class="flex-1">
      <nuxt-page />
    </main>
    <HomeFooter />
  </div>
</template>
