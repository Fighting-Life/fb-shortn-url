<script setup lang="ts">
import type { NavigationMenuItem, DropdownMenuItem } from "@nuxt/ui";

const { user, clear } = useUserSession();

const userMenuItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: user.value?.name ?? "User",
      avatar: {
        src: user.value?.avatar || undefined,
        alt: user.value?.name ?? "User",
        size: "xs",
        color: "primary",
        loading: "lazy",
        ui: {
          root: "bg-indigo-600 dark:bg-indigo-500",
          fallback: "text-white",
        },
      },
      type: "label",
      slot: "badge" as const,
    },
  ],
  [
    {
      label: "Profile",
      icon: "i-heroicons-user",
      to: "/app/accounts",
    },
    {
      label: "Security",
      to: "/app/accounts/security",
      icon: "material-symbols:security",
    },
  ],
  [
    {
      label: "Logout",
      icon: "i-heroicons-arrow-right-on-rectangle",
      color: "error" as const,
      onSelect: async () => {
        await clear();
        await navigateTo("/signin");
      },
    },
  ],
]);
const links = [
  [
    {
      label: "Profile",
      icon: "i-lucide-user",
      to: "/app/accounts",
      exact: true,
    },
    {
      label: "Security",
      icon: "mdi:shield",
      to: "/app/accounts/security",
      exact: true,
    },
  ],
] satisfies NavigationMenuItem[][];
</script>
<template>
  <div class="flex h-screen w-full flex-col">
    <UDashboardPanel id="" :ui="{
      body: 'lg:py-12 flex-1',
      root: 'h-full flex flex-col',
    }" class="flex-1">
      <template #header>
        <UDashboardNavbar title="Account">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <ThemeSwitcher />
            <UDropdownMenu :items="userMenuItems">
              <button
                class="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all text-left cursor-pointer">
                <UAvatar :alt="user?.name ?? user?.email ?? 'U'" color="primary" size="xs" :ui="{
                  root: 'bg-indigo-600 dark:bg-indigo-500',
                  fallback: 'text-white',
                }" />
              </button>
              <template #badge-trailing>
                <UBadge type="primary" size="xs" :label="user?.role ?? 'user'" class="text-white font-semibold" />
              </template>
            </UDropdownMenu>
          </template>
        </UDashboardNavbar>

        <UDashboardToolbar>
          <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
        </UDashboardToolbar>
      </template>

      <template #body>
        <div class="mx-auto h-full w-full flex-1 overflow-hidden">
          <div class="h-full overflow-y-auto px-4 sm:px-6 lg:px-8">
            <div class="mx-auto max-w-4xl py-4 sm:py-6 lg:py-8 pb-20 md:pb-10">
              <slot />
            </div>
          </div>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
<style scoped></style>
