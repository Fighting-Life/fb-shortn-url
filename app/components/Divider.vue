<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
  }>(),
  {
    label: "",
  },
);
</script>
<template>
  <div class="relative flex py-5 items-center">
    <div class="grow border-t border-neutral-200 dark:border-neutral-700"></div>
    <span
      v-if="label"
      class="text-center shrink mx-4 text-sm text-neutral-500 dark:text-neutral-400"
    >
      {{ label }}
    </span>
    <div class="grow border-t border-neutral-200 dark:border-neutral-700"></div>
  </div>
</template>
<style scoped></style>
