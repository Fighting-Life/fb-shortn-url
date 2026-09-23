<script setup lang="ts">
const route = useRoute();
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
  title: "Reset Password",
  description: "Reset your password",
  ogTitle: "Reset Password",
  ogDescription: "Reset your password",
  robots: "noindex, nofollow",
  ogImage: "/logo.png",
  ogUrl: route.fullPath,
  twitterCard: "summary_large_image",
  twitterTitle: "Reset Password",
  twitterDescription: "Reset your password",
  twitterImage: "/logo.png",
  twitterSite: "@forge_ai",
  twitterCreator: "@forge_ai",
});

const toast = useToast();

const { errors, isSubmitting, validateField, handleSubmit, resetForm } =
  useForm({
    validationSchema: ResetPasswordSchema,
    initialValues: {
      token: "",
      new_password: "",
      confirm_password: "",
    },
  });

const token = computed(() => route.query.token as string);

const inputPassword = ref<"password" | "text">("password");
const inputConfirmPassword = ref<"password" | "text">("password");

const { value: tokenField } = useField<string>("token");
const { value: password } = useField<string>("new_password");
const { value: confirmPassword } = useField<string>("confirm_password");

watch(
  token,
  (value) => {
    tokenField.value = value;
  },
  { immediate: true },
);

const submit = handleSubmit(async (values) => {
  try {
    await $fetch("/api/auth/reset", {
      method: "POST",
      body: {
        ...values,
        token: token.value,
      },
    });
    resetForm();

    toast.add({
      title: "Success",
      description: "Password updated. Please login.",
      closeIcon: "material-symbols:close-small",
      close: true,
      color: "success",
    });
    await navigateTo("/signin");
  } catch (error: any) {
    const statusMessage =
      error?.data?.statusMessage || error?.statusMessage || error?.message;
    toast.add({
      title: "Failed",
      description: statusMessage || "Failed to reset password",
      closeIcon: "material-symbols:close-small",
      close: true,
      color: "error",
    });
  }
});
</script>

<template>
  <div class="flex w-full flex-col items-center justify-center">
    <UPageCard variant="solid" class="w-full max-w-lg bg-neutral-50 shadow-2xl dark:bg-neutral-900" spotlight
      spotlight-color="primary">
      <div class="flex flex-col items-center justify-center">
        <h3 class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
          Reset Password
        </h3>
        <p class="text-sm text-neutral-600 dark:text-neutral-400">
          Reset your password
        </p>
        <form class="w-full space-y-4" @submit.prevent="submit">
          <div class="grid w-full gap-2 pb-4">
            <UFormField label="Password" required class="w-full" :error="errors.new_password">
              <UInput v-model="password" :type="inputPassword" name="password" placeholder="Enter your password"
                class="w-full" variant="outline" icon="material-symbols:lock" autocomplete="new-password"
                :loading="isSubmitting" loading-icon="i-lucide-loader" :disabled="isSubmitting" color="neutral"
                @blur="validateField('new_password')">
                <template #trailing>
                  <UButton variant="link" color="neutral" class="w-full text-sm" @click="
                    inputPassword =
                    inputPassword === 'password' ? 'text' : 'password'
                    ">
                    {{ inputPassword === "password" ? "Show" : "Hide" }}
                  </UButton>
                </template>
              </UInput>
            </UFormField>
          </div>
          <div class="grid w-full gap-2 pb-4">
            <UFormField label="Confirm Password" required class="w-full" :error="errors.confirm_password">
              <UInput v-model="confirmPassword" :type="inputConfirmPassword" name="confirmPassword"
                placeholder="Enter your confirm password" class="w-full" variant="outline" icon="material-symbols:lock"
                autocomplete="current-password" :loading="isSubmitting" loading-icon="i-lucide-loader"
                :disabled="isSubmitting" color="neutral" @blur="validateField('confirm_password')">
                <template #trailing>
                  <UButton variant="link" color="neutral" class="w-full text-sm" @click="
                    inputConfirmPassword =
                    inputConfirmPassword === 'password'
                      ? 'text'
                      : 'password'
                    ">
                    {{ inputConfirmPassword === "password" ? "Show" : "Hide" }}
                  </UButton>
                </template>
              </UInput>
            </UFormField>
          </div>

          <UButton type="submit" color="neutral" class="mt-4 flex w-full items-center justify-center"
            trailing-icon="i-lucide-arrow-right" :trailing="!isSubmitting" :loading="isSubmitting"
            :disabled="isSubmitting">
            Reset Password
          </UButton>
        </form>
        <div class="mt-4 text-center text-sm text-neutral-600 dark:text-neutral-400">
          Remember your password?
          <NuxtLink to="/login" class="text-primary hover:underline">
            Login
          </NuxtLink>
        </div>
      </div>
    </UPageCard>
  </div>
</template>

<style scoped></style>
