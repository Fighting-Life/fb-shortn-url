<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from "@nuxt/ui";
import { Link } from "@lucide/vue";

const open = ref(true);

const config = useRuntimeConfig();
const colorMode = useColorMode();
</script>

<template>
  <div class="flex flex-1">
    <USidebar
      v-model:open="open"
      collapsible="icon"
      rail
      :ui="{
        container: 'h-full',
        inner: 'bg-elevated/25 divide-transparent',
        body: 'py-0',
      }"
    >
      <template #header>
        <NuxtLink to="/app" class="flex items-center gap-2.5 group">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-600/30 transition-all group-hover:shadow-indigo-500/50 group-hover:scale-105"
          >
            <Link class="h-4 w-4 text-white" />
          </div>
          <span
            :class="
              cn(
                'text-lg font-semibold tracking-tight text-neutral-900 dark:text-white',
                open
                  ? 'block transition-all duration-300 animate-fade-in'
                  : 'hidden transition-all duration-300 animate-fade-out',
              )
            "
          >
            {{ config.public.APP_NAME }}
          </span>
        </NuxtLink>
      </template>
    </USidebar>
    <div class="flex items-center justify-between w-full">
      <div class="flex-1 flex flex-col">
        <div
          class="h-(--ui-header-height) shrink-0 flex items-center px-4 border-b border-default"
        >
          <UButton
            icon="i-lucide-panel-left"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Toggle sidebar"
            @click="open = !open"
          />
        </div>
      </div>
      <ThemeSwitcher />
    </div>
    <div class="flex-1 p-4 overflow-hidden">
      <nuxt-page />
    </div>
  </div>
</template>

<style scoped></style>
