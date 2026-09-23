<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

defineProps<{
  collapsed?: boolean;
}>();

const { user, clear } = useUserSession();

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      type: "label",
      label: user.value?.name ?? "",
      avatar: {
        src: user.value?.avatar_url || undefined,
        alt: user.value?.name ?? "",
      },
    },
  ],
  [
    {
      label: "Profile",
      icon: "i-lucide-user",
      to: "/app/accounts",
    },
    {
      label: "Security",
      icon: "i-lucide-lock",
      to: "/app/accounts/security",
    },
  ],
  [
    {
      label: "Log out",
      icon: "i-lucide-log-out",
      class: "text-error",
      onSelect: async () => {
        await clear();
        await navigateTo("/signin");
      },
    },
  ],
]);
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'center', collisionPadding: 12 }" :ui="{
    content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)',
  }">
    <UButton :label="collapsed ? undefined : (user?.name ?? '')"
      :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'" :avatar="{
        src: user?.avatar_url || undefined,
        alt: user?.name ?? '',
      }" color="neutral" variant="ghost" block :square="collapsed" class="data-[state=open]:bg-elevated text-sm" :ui="{
        trailingIcon: 'text-dimmed',
      }" />

    <template #chip-leading="{ item }">
      <span :style="{
        '--chip-light': `var(--color-${(item as any).chip}-500)`,
        '--chip-dark': `var(--color-${(item as any).chip}-400)`,
      }" class="ms-0.5 size-2 rounded-full bg-(--chip-light) dark:bg-(--chip-dark)" />
    </template>
  </UDropdownMenu>
</template>
