<script setup lang="ts">
const route = useRoute();

definePageMeta({
  layout: "auth",
  middleware: ["auth"]
});
useSeoMeta({
  title: "Accounts - LinkMask",
  description: "Manage your LinkMask accounts profile.",
  robots: "noindex, nofollow",
  ogImage: "/logo.png",
  ogUrl: route.fullPath,
});

</script>

<template>
  <AppAccountLayout>
    <div>

    </div>
  </AppAccountLayout>
</template>

<style scoped></style>
