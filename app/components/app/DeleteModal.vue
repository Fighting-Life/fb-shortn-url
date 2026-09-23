<script setup lang="ts">
const emits = defineEmits<{
  (ev: "submit"): Promise<void>;
}>();
withDefaults(
  defineProps<{
    count?: number;
    label?: string;
  }>(),
  {
    count: 0,
    label: "user",
  },
);

const open = ref(false);
async function onSubmit() {
  await emits("submit");
}
</script>
<template>
  <UModal v-model:open="open" :title="`Delete ${count} ${label} ${count > 1 ? 's' : ''}`"
    :description="`Are you sure, this action cannot be undone.`">
    <slot />

    <template #body>
      <div class="flex justify-end gap-2">
        <UButton label="Cancel" color="neutral" variant="subtle" @click="open = false" />
        <UButton label="Delete" color="error" variant="solid" loading-auto @click="onSubmit" />
      </div>
    </template>
  </UModal>
</template>
