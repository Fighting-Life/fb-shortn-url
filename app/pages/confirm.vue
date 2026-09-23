<script setup lang="ts">
const route = useRoute();
const router = useRouter();
definePageMeta({
  layout: "guest",
  middleware: "guest",
  validate(route) {
    if (!route.query.token) {
      throw new Error("Token is required");
    }
    return true;
  },
});
useSeoMeta({
  title: "Verify Email",
  description: "Verify your email",
  ogTitle: "Verify Email",
  ogDescription: "Verify your email",
  robots: "noindex, nofollow",
  ogImage: "/logo.png",
  ogUrl: route.fullPath,
  twitterCard: "summary_large_image",
  twitterTitle: "Verify Email",
  twitterDescription: "Verify your email",
  twitterImage: "/logo.png",
  twitterSite: "@forge_ai",
  twitterCreator: "@forge_ai",
});
const toast = useToast();

const token = computed(() => route.query.token as string);

const status = ref<"loading" | "success" | "error">("loading");
const errorMessage = ref("");
const countdown = ref(3);
const resendEmail = ref("");
const isResending = ref(false);
const resendEmailInput = ref<any>(null);

onMounted(async () => {
  try {
    await $fetch("/api/auth/confirm", {
      method: "POST",
      body: { token: token.value },
    });

    status.value = "success";
    const interval = window.setInterval(async () => {
      countdown.value -= 1;
      if (countdown.value <= 0) {
        window.clearInterval(interval);
        await navigateTo("/login");
      }
    }, 1000);
  } catch (error: any) {
    console.error("Verification error:", error);
    status.value = "error";
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      "Verification failed";
  }
});

watch(
  status,
  async (value) => {
    if (value !== "error") return;
    if (!import.meta.client) return;

    await nextTick();
    const el: any =
      resendEmailInput.value?.input ||
      resendEmailInput.value?.$el?.querySelector?.("input") ||
      resendEmailInput.value;

    if (el?.focus) el.focus();
  },
  { flush: "post" },
);

async function resendVerification() {
  try {
    const email = resendEmail.value.trim();
    if (!email) {
      toast.add({
        title: "Email Required",
        description: "Please enter your email.",
        color: "error",
        close: true,
      });
      return;
    }

    isResending.value = true;
    await $fetch("/api/auth/resend", {
      method: "POST",
      body: { email },
    });

    toast.add({
      title: "Sent",
      description: "If the account exists, we sent a new verification link.",
      color: "success",
      close: true,
    });
  } catch (error: any) {
    const statusMessage =
      error?.data?.statusMessage || error?.statusMessage || error?.message;
    toast.add({
      title: "Failed",
      description: statusMessage || "Failed to resend verification email",
      color: "error",
      close: true,
    });
  } finally {
    isResending.value = false;
  }
}

const handleBackToHome = () => {
  router.push("/");
};
</script>

<template>
  <div class="flex w-full flex-col items-center justify-center">
    <UPageCard variant="solid" class="w-full max-w-lg bg-neutral-50 shadow-2xl dark:bg-neutral-900" spotlight
      spotlight-color="primary">
      <div>
        <Transition name="fade" mode="out-in">
          <div v-if="status === 'loading'" class="space-y-6 text-center">
            <div class="relative inline-flex">
              <div class="absolute inset-0 animate-pulse rounded-full bg-yellow-500/20 blur-2xl"></div>
              <div class="relative rounded-full border border-neutral-800 bg-neutral-900 p-6">
                <Loader2 class="h-12 w-12 animate-spin text-yellow-400" />
              </div>
            </div>

            <div class="space-y-3">
              <h1 class="text-2xl font-bold text-neutral-100">
                Verifying Your Email
              </h1>
              <p class="text-sm text-neutral-400">
                Please wait, we are processing the verification...
              </p>
            </div>

            <div class="flex items-center justify-center gap-1.5">
              <div class="h-2 w-2 animate-bounce rounded-full bg-yellow-400 [animation-delay:-0.3s]"></div>
              <div class="h-2 w-2 animate-bounce rounded-full bg-yellow-400 [animation-delay:-0.15s]"></div>
              <div class="h-2 w-2 animate-bounce rounded-full bg-yellow-400"></div>
            </div>
          </div>

          <!-- Success State -->
          <div v-else-if="status === 'success'" class="space-y-6 text-center">
            <div class="relative inline-flex">
              <div class="absolute inset-0 rounded-full bg-yellow-500/20 blur-2xl"></div>
              <div class="relative rounded-full bg-linear-to-br from-yellow-500 to-yellow-600 p-6">
                <CheckCircle2 class="animate-scale-in h-12 w-12 text-white" />
              </div>
            </div>

            <div class="animate-fade-in-up space-y-3">
              <h1 class="text-2xl font-bold text-neutral-100">
                Your Email Is Verified!
              </h1>
              <p class="text-sm text-neutral-400">
                Your account has been verified. Welcome to Forge AI!
              </p>
            </div>

            <div
              class="animate-fade-in-up rounded-lg border border-neutral-800 bg-neutral-900 p-4 [animation-delay:0.2s]">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="rounded-lg bg-yellow-400/10 p-2">
                    <Mail class="h-5 w-5 text-yellow-400" />
                  </div>
                  <div class="text-left">
                    <p class="text-xs text-neutral-500">
                      Redirect automatically in
                    </p>
                    <p class="text-lg font-bold text-yellow-400">
                      {{ countdown }} seconds
                    </p>
                  </div>
                </div>
                <button
                  class="cursor-pointer rounded-lg bg-linear-to-br from-yellow-500 to-yellow-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-yellow-400 hover:to-yellow-500 active:scale-95"
                  @click="handleBackToHome">
                  Back to Home
                </button>
              </div>
            </div>

            <div class="animate-fade-in-up border-t border-neutral-800 pt-4 [animation-delay:0.4s]">
              <p class="text-xs text-neutral-500">
                Thank you for verifying your email!
              </p>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="status === 'error'" class="space-y-6 text-center">
            <div class="relative inline-flex">
              <div class="absolute inset-0 rounded-full bg-red-500/20 blur-2xl"></div>
              <div class="relative rounded-full border border-red-900 bg-neutral-900 p-6">
                <XCircle class="animate-scale-in h-12 w-12 text-red-500" />
              </div>
            </div>

            <div class="animate-fade-in-up space-y-3">
              <h1 class="text-2xl font-bold text-neutral-100">
                Verification Failed
              </h1>
              <p class="text-sm text-neutral-400">{{ errorMessage }}</p>
            </div>

            <div
              class="animate-fade-in-up space-y-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4 [animation-delay:0.2s]">
              <div class="text-sm text-neutral-400">
                <p class="mb-2">Possible causes:</p>
                <ul class="list-inside list-disc space-y-1 text-left text-xs">
                  <li>The verification link has expired</li>
                  <li>Link already used</li>
                  <li>Link not valid</li>
                </ul>
              </div>

              <div class="grid gap-3">
                <UFormField label="Email" class="w-full">
                  <UInput ref="resendEmailInput" v-model="resendEmail" type="email" name="email"
                    placeholder="Enter your email" class="w-full" variant="outline" icon="material-symbols:mail"
                    :disabled="isResending" color="neutral" />
                </UFormField>
                <UButton color="neutral" variant="outline" class="w-full justify-center" :loading="isResending"
                  :disabled="isResending" @click="resendVerification">
                  Resend verification email
                </UButton>
              </div>

              <button
                class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-br from-yellow-500 to-yellow-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:from-yellow-400 hover:to-yellow-500 active:scale-95"
                @click="handleBackToHome">
                <ArrowLeft class="h-4 w-4" />
                Back to Home
              </button>
            </div>

            <div class="animate-fade-in-up border-t border-neutral-800 pt-4 [animation-delay:0.4s]">
              <p class="text-xs text-neutral-500">
                Need help? Contact customer service team
              </p>
            </div>
          </div>
        </Transition>
      </div>
    </UPageCard>
  </div>
</template>

<style scoped>
.\[animation-delay\:0\.2s\] {
  animation-delay: 0.2s;
}

.\[animation-delay\:0\.4s\] {
  animation-delay: 0.4s;
}

.\[animation-delay\:-0\.3s\] {
  animation-delay: -0.3s;
}

.\[animation-delay\:-0\.15s\] {
  animation-delay: -0.15s;
}
</style>
