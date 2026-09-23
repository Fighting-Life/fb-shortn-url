<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
  }>(),
  {
    title: "No data available",
    description: "No data available",
  },
);
</script>

<template>
  <UCard variant="outline" class="w-full p-12" :ui="{
    root: 'shadow-md border border-neutral-200 dark:border-neutral-700',
  }">
    <div class="text-center">
      <svg class="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-300" fill="none" stroke="currentColor"
        viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-50">
        {{ title }}
      </h3>
      <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        {{ description }}
      </p>
      <div class="mt-6">
        <slot name="action-button" />
      </div>
    </div>
  </UCard>
</template>
