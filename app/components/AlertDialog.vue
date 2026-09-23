<script lang="ts" setup>
interface Props {
  open?: boolean;
  type?: "success" | "error" | "warning" | "info";
  title?: string;
  message?: string;
  isAction?: boolean;
  labelAction?: string;
  labelClose?: string;
}
const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "onclose"): void;
  (e: "onaction"): void;
}>();
const props = withDefaults(defineProps<Props>(), {
  open: false,
  type: "info",
  title: "Modal Title",
  message: "Modal Message",
  isAction: false,
  labelAction: "OK",
  labelClose: "CLOSE",
});

const isOpen = useVModel(props, "open", emit, {
  passive: true,
});

const close = () => {
  emit("onclose");
};
const action = () => {
  emit("onaction");
};
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :description="message"
    :close="{
      color: 'neutral',
      variant: 'outline',
    }"
    close-icon="i-heroicons:x-mark-24-solid"
    @update:open="isOpen = $event"
  >
    <template #content>
      <div class="mx-auto flex w-full flex-col items-center gap-5 py-12">
        <div class="flex flex-col items-center gap-1">
          <div
            class="flex h-16 w-16 items-center justify-center rounded-full p-px"
          >
            <UIcon
              v-if="type === 'warning'"
              name="fluent-color:warning-48"
              class="h-full w-full"
            />
            <UIcon
              v-else-if="type === 'info'"
              name="flat-color-icons:info"
              class="h-full w-full"
            />
            <UIcon
              v-else-if="type === 'error'"
              name="fluent-color:dismiss-circle-48"
              class="h-full w-full"
            />
            <UIcon
              v-else-if="type === 'success'"
              name="fluent-color:checkmark-circle-48"
              class="h-full w-full"
            />
            <UIcon v-else name="flat-color-icons:info" class="h-full w-full" />
          </div>
          <div
            :class="
              cn(
                'text-center text-xl font-bold',
                type === 'warning'
                  ? 'text-yellow-500'
                  : type === 'info'
                    ? 'text-blue-600'
                    : type === 'error'
                      ? 'text-red-600'
                      : type === 'success'
                        ? 'text-green-600'
                        : 'text-blue-600',
              )
            "
          >
            {{ title }}
          </div>
        </div>
        <div
          class="line-clamp-3 max-w-[320px] text-center text-sm text-gray-600 dark:text-gray-200"
        >
          {{ message }}
        </div>
        <div class="flex items-center justify-center gap-2">
          <UButton
            v-if="isAction"
            :color="type"
            class="px-4 text-white"
            @click="action"
          >
            {{ labelAction }}
          </UButton>
          <UButton class="px-4" color="neutral" @click="close">
            {{ labelClose }}
          </UButton>
        </div>
      </div>
    </template>
    <template #footer> </template>
  </UModal>
</template>
