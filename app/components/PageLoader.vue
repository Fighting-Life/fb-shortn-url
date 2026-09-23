<script setup lang="ts">
const { isLoading, loadingMessage, loadingProgress } = usePageLoader();
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isLoading"
        class="fixed inset-0 z-9999 flex items-center justify-center bg-black/20 backdrop-blur-sm dark:bg-black/40"
      >
        <div class="relative">
          <!-- Loader Card -->
          <div
            class="max-w-md min-w-70 rounded-2xl bg-white p-8 shadow-2xl dark:bg-neutral-800"
          >
            <!-- Spinner -->
            <div class="mb-6 flex justify-center">
              <div class="relative">
                <!-- Outer Ring -->
                <div
                  class="h-16 w-16 rounded-full border-4 border-neutral-200 dark:border-neutral-700"
                ></div>

                <!-- Spinning Ring -->
                <div
                  class="border-t-primary-500 absolute top-0 left-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent"
                ></div>

                <!-- Inner Pulse -->
                <div
                  class="bg-primary-500/20 absolute top-1/2 left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full"
                ></div>
              </div>
            </div>

            <!-- Message -->
            <p
              class="mb-4 text-center font-medium text-neutral-700 dark:text-neutral-200"
            >
              {{ loadingMessage }}
            </p>

            <!-- Progress Bar -->
            <div
              class="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
            >
              <div
                class="from-primary-500 to-primary-600 h-full rounded-full bg-linear-to-r transition-all duration-300 ease-out"
                :style="{ width: `${loadingProgress}%` }"
              ></div>
            </div>

            <!-- Progress Percentage -->
            <p
              class="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400"
            >
              {{ Math.round(loadingProgress) }}%
            </p>
          </div>

          <!-- Decorative Rings -->
          <div
            class="bg-primary-500/10 absolute -top-4 -right-4 h-24 w-24 animate-pulse rounded-full blur-2xl"
          ></div>
          <div
            class="absolute -bottom-4 -left-4 h-32 w-32 animate-pulse rounded-full bg-blue-500/10 blur-3xl delay-300"
          ></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
