<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'

const route = useRoute();

definePageMeta({
  layout: "default",
});
useSeoMeta({
  title: "Contact LinkMask",
  description: "Contact LinkMask - Secure URL Shortener & Link Cloaker",
  ogTitle: "Contact LinkMask",
  ogDescription: "Contact LinkMask - Secure URL Shortener & Link Cloaker",
  robots: "index, follow",
  ogImage: "/logo.png",
  ogUrl: route.fullPath,
  twitterCard: "summary_large_image",
  twitterTitle: "Contact LinkMask",
  twitterDescription: "Contact LinkMask - Secure URL Shortener & Link Cloaker",
  twitterImage: "/logo.png",
  twitterSite: "@forge_ai",
  twitterCreator: "@forge_ai",
});


const toast = useToast()

const { defineField, handleSubmit, errors, isSubmitting, resetForm } = useForm({
  validationSchema: toTypedSchema(contactSchema),
  initialValues: { name: '', email: '', company: '', message: '' }
})

const [name, nameAttrs] = defineField('name')
const [email, emailAttrs] = defineField('email')
const [company, companyAttrs] = defineField('company')
const [message, messageAttrs] = defineField('message')

const submitted = ref(false)

const onSubmit = handleSubmit(async (values) => {
  try {
    await $fetch('/api/contact', { method: 'POST', body: values })
    submitted.value = true
    resetForm()
  } catch {
    toast.add({ title: 'Gagal mengirim pesan', description: 'Coba lagi sebentar lagi.', color: 'error' })
  }
})
</script>

<template>
  <section class="mx-auto max-w-3xl px-6 py-20">
    <h1 class="font-display text-4xl tracking-tight">Hubungi kami</h1>
    <p class="mt-4 text-[var(--page-muted)]">
      Ceritakan kebutuhan campaign atau pertanyaan teknis Anda — tim kami akan membalas dalam 1–2 hari kerja.
    </p>

    <div v-if="submitted" class="mt-10 border border-[var(--page-border)] rounded-lg p-6 bg-[var(--page-surface)]">
      <p class="font-medium">Pesan terkirim.</p>
      <p class="mt-1 text-sm text-[var(--page-muted)]">Terima kasih, kami akan segera menghubungi Anda kembali.</p>
    </div>

    <form v-else class="mt-10 space-y-6" novalidate @submit="onSubmit">
      <UFormField label="Nama" :error="errors.name">
        <UInput v-model="name" v-bind="nameAttrs" placeholder="Nama lengkap" class="w-full" />
      </UFormField>

      <UFormField label="Email" :error="errors.email">
        <UInput v-model="email" v-bind="emailAttrs" type="email" placeholder="nama@perusahaan.com" class="w-full" />
      </UFormField>

      <UFormField label="Perusahaan (opsional)" :error="errors.company">
        <UInput v-model="company" v-bind="companyAttrs" placeholder="Nama perusahaan" class="w-full" />
      </UFormField>

      <UFormField label="Pesan" :error="errors.message">
        <UTextarea v-model="message" v-bind="messageAttrs" :rows="5" placeholder="Ceritakan kebutuhan Anda"
          class="w-full" />
      </UFormField>

      <UButton type="submit" color="primary" size="lg" :loading="isSubmitting">
        Kirim pesan
      </UButton>
    </form>
  </section>
</template>
