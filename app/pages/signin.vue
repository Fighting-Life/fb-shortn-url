<script setup lang="ts">
definePageMeta({
  layout: "guest",
  middleware: "guest",
});

useSeoMeta({
  title: "Sign In",
  description: "Sign in to your account",
  robots: "index, follow",
  ogTitle: "Sign In",
  ogDescription: "Sign in to your account",
  twitterCard: "summary_large_image",
  twitterSite: "@agcforge",
  twitterCreator: "@agcforge",
});

const { openInPopup } = useUserSession();
const toast = useToast();
const { handleSubmit, errors, isSubmitting, validateField } = useForm({
  validationSchema: LoginSchema,
  initialValues: {
    email: "",
    password: "",
    remember_me: false,
  },
});

const passwordInput = ref<"password" | "text">("password");
const emailInput = ref<any>(null);
const { value: email } = useField<string>("email");
const { value: password } = useField<string>("password");
const { value: remember_me } = useField<boolean>("remember_me");
const isResending = ref(false);
const needsEmailVerification = ref(false);

watch(
  needsEmailVerification,
  async (value) => {
    if (!value) return;
    if (!import.meta.client) return;

    await nextTick();

    const el: any =
      emailInput.value?.input ||
      emailInput.value?.$el?.querySelector?.("input") ||
      emailInput.value;

    if (el?.scrollIntoView)
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el?.focus) el.focus();
  },
  { flush: "post" },
);

const submit = handleSubmit(async (values) => {
  try {
    const result = await $fetch("/api/auth/login", {
      method: "POST",
      body: values,
    });
    if (!result.success) throw new Error(result.message || "Login failed.");

    const { fetch } = useUserSession();
    await fetch();
    await navigateTo("/app");
  } catch (error: any) {
    console.error("Login error:", error);

    let errorMessage =
      "Login failed. Please double-check your email/username and password.";

    const statusMessage =
      error?.data?.statusMessage || error?.statusMessage || error?.message;

    if (statusMessage?.includes("Invalid login credentials")) {
      errorMessage = "Email/Username or password is incorrect!";
    } else if (statusMessage?.includes("Email not confirmed")) {
      errorMessage = "Email not confirmed. Please check your email inbox.";
      needsEmailVerification.value = true;
    } else if (statusMessage?.includes("User not found")) {
      errorMessage = "User not found!";
      needsEmailVerification.value = false;
    } else if (statusMessage) {
      errorMessage = statusMessage;
      needsEmailVerification.value = false;
    }
  }
});

async function resendVerification() {
  try {
    const emailValue = (email.value || "").trim();
    if (!emailValue) {
      toast.add({
        title: "Email Required",
        description: "Please enter your email first.",
        color: "error",
        close: true,
      });
      return;
    }

    isResending.value = true;
    const result = await $fetch("/api/auth/resend", {
      method: "POST",
      body: { email: emailValue },
    });
    if (!result.success) {
      throw new Error(result.message || "Failed to resend verification email.");
    }

    toast.add({
      title: "Sent",
      description: "If the account exists, we sent a new verification link.",
      color: "success",
    });
  } catch (error: any) {
    const statusMessage =
      error?.data?.statusMessage || error?.statusMessage || error?.message;
    toast.add({
      title: "Failed",
      description: statusMessage || "Failed to resend verification email",
      color: "error",
    });
  } finally {
    isResending.value = false;
  }
}
</script>

<template>
  <div class="flex w-full flex-col items-center justify-center">
    <UPageCard
      variant="solid"
      class="w-full max-w-md bg-neutral-50 shadow-2xl dark:bg-neutral-900"
      spotlight
      spotlight-color="primary"
    >
      <div class="flex flex-col items-center justify-center">
        <h3 class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
          LOGIN
        </h3>
        <p class="text-sm text-neutral-600 dark:text-neutral-400">
          Login into your account
        </p>
        <div class="mt-4 grid w-full gap-2">
          <UButton
            color="neutral"
            variant="outline"
            class="w-full justify-center"
            icon="material-icon-theme:google"
            @click="openInPopup('/auth/google')"
          >
            Continue with Google
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            class="w-full justify-center"
            icon="skill-icons:github-dark"
            @click="openInPopup('/auth/github')"
          >
            Continue with GitHub
          </UButton>
          <Divider label="OR" />
        </div>
        <form class="w-full space-y-4" @submit.prevent="submit">
          <div class="grid w-full gap-2 pb-4">
            <UFormField
              label="Email"
              required
              class="w-full"
              :error="errors.email"
            >
              <UInput
                ref="emailInput"
                v-model="email"
                type="text"
                name="email"
                placeholder="Enter your email"
                class="w-full"
                variant="outline"
                icon="material-symbols:mail"
                autocomplete="username email"
                :loading="isSubmitting"
                loading-icon="i-lucide-loader"
                :disabled="isSubmitting"
                color="neutral"
                @blur="validateField('email')"
              />
            </UFormField>
          </div>

          <div class="grid w-full gap-2 pb-4">
            <UFormField
              :label="
                passwordInput === 'password' ? 'Password' : 'Show Password'
              "
              required
              class="w-full"
              :error="errors.password"
            >
              <UInput
                v-model="password"
                :type="passwordInput"
                name="password"
                placeholder="Enter your password"
                class="w-full"
                variant="outline"
                :icon="
                  passwordInput === 'password'
                    ? 'material-symbols:lock'
                    : 'material-symbols:visibility'
                "
                autocomplete="current-password"
                :loading="isSubmitting"
                loading-icon="i-lucide-loader"
                :disabled="isSubmitting"
                color="neutral"
                :ui="{ trailing: 'pe-1' }"
                @blur="validateField('password')"
              >
                <template #trailing>
                  <UButton
                    variant="link"
                    color="neutral"
                    class="w-full text-sm"
                    @click="
                      passwordInput =
                        passwordInput === 'password' ? 'text' : 'password'
                    "
                  >
                    {{ passwordInput === "password" ? "Show" : "Hide" }}
                  </UButton>
                </template>
              </UInput>
            </UFormField>
            <div class="flex items-center justify-between text-xs">
              <button
                type="button"
                class="text-neutral-600 hover:text-blue-600 hover:underline dark:text-neutral-200"
                :disabled="isSubmitting || isResending"
                @click="resendVerification"
              >
                Resend verification email
              </button>
              <NuxtLink
                to="/forgot"
                class="text-neutral-600 hover:text-blue-600 hover:underline dark:text-neutral-200"
              >
                Forgot Password?
              </NuxtLink>
            </div>
          </div>

          <div
            v-if="needsEmailVerification"
            class="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-900 dark:border-yellow-900/40 dark:bg-yellow-950/30 dark:text-yellow-200"
          >
            <p class="font-medium">Email belum terverifikasi.</p>
            <p class="mt-1 opacity-90">
              Klik resend untuk kirim ulang link verifikasi ke email kamu.
            </p>
            <div class="mt-3 flex items-center gap-2">
              <UButton
                type="button"
                color="neutral"
                variant="outline"
                size="xs"
                :loading="isResending"
                :disabled="isSubmitting || isResending"
                @click="resendVerification"
              >
                Resend verification
              </UButton>
              <NuxtLink
                to="/register"
                class="text-yellow-900 hover:underline dark:text-yellow-200"
              >
                Register ulang
              </NuxtLink>
            </div>
          </div>

          <UCheckbox
            v-model="remember_me"
            id="remember_me"
            label="Remember me"
          />

          <UButton
            type="submit"
            color="neutral"
            class="mt-4 flex w-full items-center justify-center"
            trailing-icon="i-lucide-arrow-right"
            :trailing="!isSubmitting"
            :loading="isSubmitting"
            :disabled="isSubmitting"
          >
            Login
          </UButton>
        </form>
        <div class="mt-4 flex items-center justify-center">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Don't have an account?
            <NuxtLink to="/signup" class="text-primary hover:underline">
              Sign up
            </NuxtLink>
          </p>
        </div>
      </div>
    </UPageCard>
  </div>
</template>

<style scoped></style>
