<script setup lang="ts">
const colorMode = useColorMode();
const config = useRuntimeConfig();

const nextTheme = computed(() =>
  colorMode.value === "dark" ? "light" : "dark",
);

const switchTheme = () => {
  colorMode.preference = nextTheme.value;
};
const startViewTransition = (event: MouseEvent) => {
  if (!document.startViewTransition) {
    switchTheme();
    return;
  }

  const x = event.clientX;
  const y = event.clientY;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const transition = document.startViewTransition(() => {
    switchTheme();
  });

  transition.ready.then(() => {
    const duration = 600;
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: duration,
        easing: "cubic-bezier(.76,.32,.29,.99)",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  });
};
</script>

<template>
  <div
    class="relative m-auto flex min-h-screen w-full flex-col items-center justify-center gap-6 overflow-hidden bg-white p-4 text-black dark:bg-[#050508] dark:text-white"
  >
    <!-- Background decorations -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        class="absolute -top-32 left-1/3 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl dark:bg-indigo-500/8"
      />
      <div
        class="absolute -bottom-16 right-1/4 h-80 w-80 rounded-full bg-violet-500/5 blur-3xl dark:bg-violet-500/6"
      />
    </div>

    <div class="absolute top-3 right-3 z-30">
      <ThemeSwitcher />
    </div>
    <NuxtLink
      to="/"
      class="relative flex flex-col items-center justify-center gap-2 transition-opacity hover:opacity-80"
    >
      <nuxt-img
        src="/logo.png"
        class="h-12 w-auto object-fill"
        loading="lazy"
        decoding="auto"
      />
      <h1 class="text-xl font-semibold tracking-tight">
        {{ config.public.APP_NAME }}
      </h1>
    </NuxtLink>

    <div class="relative w-full">
      <nuxt-page />
    </div>

    <div class="relative text-xs text-neutral-400 dark:text-neutral-500">
      Copyright &copy; {{ new Date().getFullYear() }}
      {{ config.public.APP_NAME }}
    </div>
  </div>
</template>

<style scoped></style>
