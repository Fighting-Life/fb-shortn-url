<script setup lang="ts">
const route = useRoute();
definePageMeta({
  layout: "guest",
  middleware: "guest",
});
useSeoMeta({
  title: "Forgot Password",
  description: "Forgot your password",
  ogTitle: "Forgot Password",
  ogDescription: "Forgot your password",
  robots: "noindex, nofollow",
  ogImage: "/logo.png",
  ogUrl: route.fullPath,
  twitterCard: "summary_large_image",
  twitterTitle: "Forgot Password",
  twitterDescription: "Forgot your password",
  twitterImage: "/logo.png",
  twitterSite: "@forge_ai",
  twitterCreator: "@forge_ai",
});

const toast = useToast();

const { errors, isSubmitting, validateField, handleSubmit, resetForm } =
  useForm({
    validationSchema: ForgotPasswordSchema,
    initialValues: {
      email: "",
    },
  });

const { value: email } = useField<string>("email");

const submit = handleSubmit(async (values) => {
  try {
    await $fetch("/api/auth/forgot", {
      method: "POST",
      body: values,
    });
    resetForm();

    toast.add({
      title: "Success",
      description: "Reset password link sent to your email",
      closeIcon: "material-symbols:close-small",
      close: true,
      color: "success",
    });
    await navigateTo("/login");
  } catch (error: any) {
    const statusMessage =
      error?.data?.statusMessage || error?.statusMessage || error?.message;
    toast.add({
      title: "Failed",
      description: statusMessage || "Failed to send reset password link",
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
          Forgot Password
        </h3>
        <p class="text-sm text-neutral-600 dark:text-neutral-400">
          Send a reset password link to your email
        </p>
        <form class="w-full space-y-4" @submit.prevent="submit">
          <div class="grid w-full gap-2 pb-4">
            <UFormField label="Email" required class="w-full" :error="errors.email">
              <UInput v-model="email" type="email" name="email" placeholder="Enter your email" class="w-full"
                variant="outline" icon="i-heroicons-envelope" autocomplete="email" :loading="isSubmitting"
                loading-icon="i-lucide-loader" :disabled="isSubmitting" color="neutral"
                @blur="validateField('email')" />
            </UFormField>
          </div>

          <UButton type="submit" color="neutral" class="mt-4 flex w-full items-center justify-center"
            trailing-icon="i-lucide-arrow-right" :trailing="!isSubmitting" :loading="isSubmitting"
            :disabled="isSubmitting">
            Send Reset Link
          </UButton>
        </form>
        <div class="mt-4 text-center text-sm text-neutral-600 dark:text-neutral-400">
          Remember your password?
          <NuxtLink to="/signin" class="text-primary hover:underline">
            Login
          </NuxtLink>
        </div>
      </div>
    </UPageCard>
  </div>
</template>

<style scoped></style>
