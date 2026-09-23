<script setup lang="ts">
const emits = defineEmits<{
  (e: "refresh"): Promise<void>;
}>();
withDefaults(
  defineProps<{
    error?: string;
  }>(),
  {
    error: "",
  },
);
</script>

<template>
  <div class="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-400 dark:bg-red-600/10">
    <div class="flex items-center">
      <svg class="mr-3 h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
          Error
        </h3>
        <p class="mt-1 text-sm text-red-700 dark:text-red-400">
          {{ error }}
        </p>
      </div>
    </div>
    <UButton variant="solid" color="error" class="mt-4 px-4 py-2 text-white" size="md" @click="emits('refresh')">
      Coba Lagi
    </UButton>
  </div>
</template>
