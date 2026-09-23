<script lang="ts" setup>
const colorMode = useColorMode();

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
  <client-only>
    <UButton
      variant="ghost"
      :class="
        cn(
          'rounded-full shadow-md p-0.5',
          colorMode.preference === 'dark' ? 'text-yellow-500' : 'text-sky-600',
        )
      "
      size="md"
      @click="startViewTransition"
    >
      <UIcon
        :name="
          colorMode.preference === 'dark'
            ? 'line-md:moon-filled-to-sunny-filled-loop-transition'
            : 'line-md:moon-filled-alt-loop'
        "
      />
    </UButton>
  </client-only>
</template>

<style scoped></style>
