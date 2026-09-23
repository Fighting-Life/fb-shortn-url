<script setup lang="ts">
const route = useRoute();
definePageMeta({
  layout: "guest",
  middleware: "guest",
});
useSeoMeta({
  title: "Register",
  description: "Register into your account",
  ogTitle: "Register",
  ogDescription: "Register into your account",
  robots: "index, follow",
  ogImage: "/logo.png",
  ogUrl: route.fullPath,
  twitterCard: "summary_large_image",
  twitterTitle: "Register",
  twitterDescription: "Register into your account",
  twitterImage: "/logo.png",
  twitterSite: "@forge_ai",
  twitterCreator: "@forge_ai",
});

const { loggedIn, openInPopup } = useUserSession();
const toast = useToast();
const inputPassword = ref<"password" | "text">("password");
const inputConfirmPassword = ref<"password" | "text">("password");

const { handleSubmit, errors, isSubmitting, resetForm, validateField } =
  useForm({
    validationSchema: RegisterSchema,
    initialValues: {
      full_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

const { value: full_name } = useField<string>("full_name");
const { value: email } = useField<string>("email");
const { value: password } = useField<string>("password");
const { value: confirm_password } = useField<string>("confirm_password");

watch(
  loggedIn,
  async (value) => {
    if (!value) return;
    const redirect =
      typeof route.query.redirect === "string" ? route.query.redirect : "/";
    await navigateTo(redirect);
  },
  { immediate: true },
);

const submit = handleSubmit(async (values) => {
  try {
    await $fetch("/api/auth/register", {
      method: "POST",
      body: values,
    });

    resetForm();

    toast.add({
      title: "Registration Successful!",
      description: "Please check your email to verify your account.",
      color: "success",
    });

    await navigateTo("/signin");
  } catch (error) {
    console.error("Register error:", error);
    const statusMessage =
      (error as any)?.data?.statusMessage ||
      (error as any)?.statusMessage ||
      (error as any)?.message;
    toast.add({
      title: "Registration Failed! Please try again",
      description:
        typeof statusMessage === "string" && statusMessage.length
          ? statusMessage
          : "Unknown error",
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
          REGISTER
        </h3>
        <p class="text-sm text-neutral-600 dark:text-neutral-400">
          Register into your account
        </p>
        <div class="mt-4 grid w-full gap-2">
          <UButton color="neutral" variant="outline" class="w-full justify-center" icon="material-icon-theme:google"
            @click="openInPopup('/auth/google')">
            Continue with Google
          </UButton>
          <UButton color="neutral" variant="outline" class="w-full justify-center" icon="skill-icons:github-dark"
            @click="openInPopup('/auth/github')">
            Continue with GitHub
          </UButton>
          <Divider label="OR" />
        </div>
        <form class="w-full space-y-4" @submit.prevent="submit">
          <div class="grid w-full gap-2 pb-4">
            <UFormField label="Full Name" required class="w-full" :error="errors.full_name">
              <UInput v-model="full_name" type="text" name="name" placeholder="Enter your full name" class="w-full"
                variant="outline" icon="material-symbols:person" autocomplete="username email" :loading="isSubmitting"
                loading-icon="i-lucide-loader" :disabled="isSubmitting" color="neutral"
                @blur="validateField('full_name')" />
            </UFormField>
          </div>
          <div class="grid w-full gap-2 pb-4">
            <UFormField label="Email" required class="w-full" :error="errors.email">
              <UInput v-model="email" type="email" name="email" placeholder="Enter your email" class="w-full"
                variant="outline" icon="material-symbols:mail" autocomplete="email" :loading="isSubmitting"
                loading-icon="i-lucide-loader" :disabled="isSubmitting" color="neutral"
                @blur="validateField('email')" />
            </UFormField>
          </div>
          <div class="grid w-full gap-2 pb-4">
            <UFormField label="Password" required class="w-full" :error="errors.password">
              <UInput v-model="password" :type="inputPassword" name="password" placeholder="Enter your password"
                class="w-full" variant="outline" icon="material-symbols:lock" autocomplete="new-password"
                :loading="isSubmitting" loading-icon="i-lucide-loader" :disabled="isSubmitting" color="neutral"
                @blur="validateField('password')">
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
              <UInput v-model="confirm_password" :type="inputConfirmPassword" name="confirm_password"
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
            Register
          </UButton>
        </form>
        <div class="mt-4 flex items-center justify-center">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Already have an account?
            <NuxtLink to="/signin" class="text-primary hover:underline">
              Login
            </NuxtLink>
          </p>
        </div>
      </div>
    </UPageCard>
  </div>
</template>

<style scoped></style>
