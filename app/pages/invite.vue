<script setup lang="ts">
definePageMeta({ layout: "guest", middleware: "guest" });

useSeoMeta({
  title: "Invite",
  description: "Invite Confirmation",
  robots: "noindex, nofollow",
  ogTitle: "Invite",
  ogDescription: "Invite Confirmation",
  twitterCard: "summary_large_image",
  twitterSite: "@agcforge",
  twitterCreator: "@agcforge",
});


const route = useRoute();
const token = computed(() => typeof route.query.token === "string" ? route.query.token : "");
const password = ref("");
const confirmation = ref("");
const loading = ref(false);
const errorMessage = ref("");

async function acceptInvitation() {
  errorMessage.value = "";
  if (!token.value) { errorMessage.value = "Invitation token tidak ditemukan."; return; }
  if (password.value.length < 8) { errorMessage.value = "Password minimal 8 karakter."; return; }
  if (password.value !== confirmation.value) { errorMessage.value = "Konfirmasi password tidak sama."; return; }

  loading.value = true;
  try {
    await $fetch("/api/auth/invitations/accept", { method: "POST", body: { token: token.value, password: password.value } });
    await navigateTo("/app");
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.statusMessage || "Invitation gagal diproses.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-screen w-full max-w-md items-center justify-center p-6">
    <UCard class="w-full">
      <template #header>
        <h1 class="text-xl font-semibold">Accept invitation</h1>
      </template>
      <div class="space-y-4">
        <p class="text-sm text-muted">Buat password untuk mengaktifkan akun Anda.</p>
        <UAlert v-if="errorMessage" color="error" title="Tidak dapat melanjutkan" :description="errorMessage" />
        <form class="space-y-4" @submit.prevent="acceptInvitation">
          <UFormField label="Password" required>
            <UInput v-model="password" type="password" minlength="8" class="w-full" required />
          </UFormField>
          <UFormField label="Confirm password" required>
            <UInput v-model="confirmation" type="password" minlength="8" class="w-full" required />
          </UFormField>
          <UButton type="submit" block label="Activate account" :loading="loading" />
        </form>
      </div>
    </UCard>
  </div>
</template>
