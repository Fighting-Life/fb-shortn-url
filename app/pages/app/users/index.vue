<script setup lang="ts">
definePageMeta({ middleware: ["auth", "admin"] });

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "inactive" | "suspended";
  is_active: boolean;
  created_at: string;
};

const users = ref<AdminUser[]>([]);
const loading = ref(false);
const savingId = ref<string | null>(null);
const inviting = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const inviteForm = reactive({ name: "", email: "", role: "user" as "admin" | "user" });

async function loadUsers() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const response = await $fetch<ApiResponse<{ items: AdminUser[] }>>("/api/admin/users");
    users.value = response.data?.items ?? [];
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.statusMessage || "Users gagal dimuat.";
  } finally {
    loading.value = false;
  }
}

async function inviteUser() {
  inviting.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  try {
    const response = await $fetch<ApiResponse<{ email_sent: boolean }>>("/api/admin/invitations", {
      method: "POST",
      body: inviteForm,
    });
    successMessage.value = response.message;
    inviteForm.name = "";
    inviteForm.email = "";
    inviteForm.role = "user";
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.statusMessage || "Invitation gagal dibuat.";
  } finally {
    inviting.value = false;
  }
}

async function saveUser(user: AdminUser) {
  savingId.value = user.id;
  errorMessage.value = "";
  successMessage.value = "";
  try {
    await $fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      body: { name: user.name, role: user.role, status: user.status, is_active: user.is_active },
    });
    successMessage.value = `User ${user.email} berhasil diperbarui.`;
    await loadUsers();
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.statusMessage || "User gagal diperbarui.";
  } finally {
    savingId.value = null;
  }
}

async function deactivateUser(user: AdminUser) {
  if (!window.confirm(`Nonaktifkan user ${user.email}?`)) return;
  savingId.value = user.id;
  try {
    await $fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    successMessage.value = "User berhasil dinonaktifkan.";
    await loadUsers();
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.statusMessage || "User gagal dinonaktifkan.";
  } finally {
    savingId.value = null;
  }
}

onMounted(loadUsers);
</script>

<template>
  <AppDashboardLayout id="users" title="Users">
    <template #content>
      <div class="space-y-6 p-4 sm:p-6">
        <div>
          <h1 class="text-xl font-semibold text-highlighted">User management</h1>
          <p class="text-sm text-muted">Invite, update role, suspend, dan nonaktifkan user.</p>
        </div>

        <UAlert v-if="errorMessage" color="error" title="Request gagal" :description="errorMessage" />
        <UAlert v-if="successMessage" color="success" title="Berhasil" :description="successMessage" />

        <UCard>
          <template #header>
            <h2 class="font-semibold">Invite user</h2>
          </template>
          <form class="grid gap-4 md:grid-cols-4" @submit.prevent="inviteUser">
            <UFormField label="Name" required>
              <UInput v-model="inviteForm.name" class="w-full" required />
            </UFormField>
            <UFormField label="Email" required>
              <UInput v-model="inviteForm.email" class="w-full" type="email" required />
            </UFormField>
            <UFormField label="Role">
              <select v-model="inviteForm.role"
                class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </UFormField>
            <div class="flex items-end">
              <UButton type="submit" label="Send invitation" :loading="inviting" />
            </div>
          </form>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold">Users</h2>
              <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" :loading="loading"
                aria-label="Refresh" @click="loadUsers" />
            </div>
          </template>
          <div v-if="loading" class="py-10 text-center text-sm text-muted">Loading users...</div>
          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-200 text-left text-sm">
              <thead class="border-b border-default text-muted">
                <tr>
                  <th class="px-3 py-3">Name</th>
                  <th class="px-3 py-3">Email</th>
                  <th class="px-3 py-3">Role</th>
                  <th class="px-3 py-3">Status</th>
                  <th class="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id" class="border-b border-default last:border-0">
                  <td class="px-3 py-3">
                    <UInput v-model="user.name" size="sm" />
                  </td>
                  <td class="px-3 py-3 text-muted">{{ user.email }}</td>
                  <td class="px-3 py-3"><select v-model="user.role"
                      class="rounded-md border border-default bg-default px-2 py-1 text-sm">
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select></td>
                  <td class="px-3 py-3"><select v-model="user.status"
                      class="rounded-md border border-default bg-default px-2 py-1 text-sm">
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="inactive">Inactive</option>
                    </select></td>
                  <td class="px-3 py-3">
                    <div class="flex justify-end gap-1">
                      <UButton label="Save" size="xs" @click="saveUser(user)" :loading="savingId === user.id" />
                      <UButton label="Deactivate" size="xs" color="error" variant="ghost"
                        :disabled="savingId === user.id" @click="deactivateUser(user)" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>
    </template>
  </AppDashboardLayout>
</template>
