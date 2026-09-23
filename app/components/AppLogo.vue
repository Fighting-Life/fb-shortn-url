<script setup lang="ts">
defineProps<{
  collapsed?: boolean;
}>();

const config = useRuntimeConfig();
</script>
<template>
  <div class="flex items-center justify-center gap-2 px-2 transition-all duration-300">
    <img src="/logo.png" alt="App Logo" :class="cn('h-8 w-auto', collapsed ? 'hidden' : '')" loading="lazy"
      decoding="async" />
    <UIcon name="mingcute:exchange-baht-fill" :class="cn('text-xl text-green-600', collapsed ? '' : 'hidden')"
      size="24" />
    <div class="text-default text-base font-bold" :class="collapsed ? 'hidden' : ''">
      {{ config.public.APP_NAME }}
    </div>
  </div>
</template>
