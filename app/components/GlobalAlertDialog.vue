<script setup lang="ts">
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
} from "@lucide/vue";

const {
  isOpen,
  currentAlert,
  currentConfig,
  handleConfirm,
  handleCancel,
  handleOpenChange,
} = useGlobalAlert();

const ICON_MAP = {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
} as const;

const IconComponent = computed(() => {
  if (!currentConfig.value) return null;
  return (
    ICON_MAP[currentConfig.value.icon as keyof typeof ICON_MAP] ?? AlertCircle
  );
});
</script>

<template>
  <UModal v-model:open="isOpen" :title="currentAlert?.title"
    :description="currentAlert?.description ? currentAlert?.description : ''" :close="{
      color: 'neutral',
      variant: 'outline',
    }" close-icon="i-heroicons:x-mark-24-solid" @update:open="isOpen = $event">
    <template #content>
      <div class="mx-auto flex w-full flex-col items-center gap-5 py-12">
        <div class="flex flex-col items-center gap-1">
          <div class="flex h-16 w-16 items-center justify-center rounded-full p-px">
            <UIcon v-if="currentAlert?.type === 'warning'" name="fluent-color:warning-48" class="h-full w-full" />
            <UIcon v-else-if="currentAlert?.type === 'info'" name="flat-color-icons:info" class="h-full w-full" />
            <UIcon v-else-if="currentAlert?.type === 'error'" name="fluent-color:dismiss-circle-48"
              class="h-full w-full" />
            <UIcon v-else-if="currentAlert?.type === 'success'" name="fluent-color:checkmark-circle-48"
              class="h-full w-full" />
            <UIcon v-else name="flat-color-icons:info" class="h-full w-full" />
          </div>
          <div :class="cn(
            'text-center text-xl font-bold',
            currentAlert?.type === 'warning'
              ? 'text-yellow-500'
              : currentAlert?.type === 'info'
                ? 'text-blue-600'
                : currentAlert?.type === 'error'
                  ? 'text-red-600'
                  : currentAlert?.type === 'success'
                    ? 'text-green-600'
                    : 'text-blue-600',
          )
            ">
            {{ currentAlert?.title }}
          </div>
        </div>
        <div class="line-clamp-3 max-w-[320px] text-center text-sm text-neutral-600 dark:text-neutral-200">
          {{ currentAlert?.description ? currentAlert?.description : "" }}
        </div>
        <div class="flex items-center justify-center gap-2">
          <UButton v-if="currentAlert && !currentAlert.persistent" class="px-4" color="neutral" @click="handleCancel">
            {{ currentAlert.cancelLabel }}
          </UButton>
          <UButton v-if="currentAlert" :color="currentConfig?.confirmVariant === 'error' ? 'error' : 'primary'
            " :class="cn(
              'cursor-pointer active:scale-95 text-white px-4',
              currentAlert.confirmClass,
            )
              " @click="handleConfirm">
            {{ currentAlert.confirmLabel }}
          </UButton>
        </div>
      </div>
    </template>
    <template #footer> </template>
  </UModal>
</template>
