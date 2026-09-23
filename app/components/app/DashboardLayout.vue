<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { ClassNameValue } from "tailwind-merge";
import type { HTMLAttributes } from "vue";

const props = withDefaults(
  defineProps<{
    id?: string;
    title?: string;
    root?: ClassNameValue;
    body?: ClassNameValue;
    handle?: ClassNameValue;
    class?: HTMLAttributes["class"];
  }>(),
  {
    id: "dashboard",
    title: "Dashboard",
  },
);

const { user, clear } = useUserSession();

const classValue = computed(() => cn(props.class));

const userMenuItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: user.value?.name ?? "User",
      avatar: {
        src: user.value?.avatar_url || undefined,
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
</script>
<template>
  <div class="flex h-screen w-full flex-col">
    <UDashboardPanel :id="id" :ui="{
      root: root,
      body: body,
      handle: handle,
    }" :class="classValue">
      <template #header>
        <UDashboardNavbar :title="title">
          <template #leading>
            <UDashboardSidebarCollapse size="md" />
            <slot name="leading"></slot>
          </template>

          <template #right="{ sidebarOpen }">
            <!-- <CustomersAddModal /> -->
            <ColorModeButton />
            <UButton icon="material-symbols:notifications" color="neutral" variant="ghost" size="md" shadow
              class="text-warning" />
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
            <slot name="right"></slot>
          </template>
          <slot name="toolbar"></slot>
        </UDashboardNavbar>
      </template>
      <template #body>
        <div class="mx-auto h-full w-full flex-1 overflow-hidden">
          <div class="h-full overflow-y-auto px-2">
            <div class="mx-auto w-full space-x-3 pb-20 md:pb-10">
              <slot name="content"></slot>
            </div>
          </div>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
