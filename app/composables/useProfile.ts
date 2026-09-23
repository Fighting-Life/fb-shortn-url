import type { User } from "@prisma/client";

type UserSession = User

export const useProfile = () => {
  const currentProfile = ref<UserSession | null>(null);
  const toast = useToast();

  const getCurrentProfile = async () => {
    try {
      const res = await $fetch<ApiResponse<UserSession | null>>("/api/user/me");
      if (!res.success)
        throw new Error(res.message || "Failed to get user profile.");

      currentProfile.value = res.data as UserSession | null;
    } catch (error) {
      return null;
    }
  };

  const updateAvatar = async (avatar: string) => {
    try {
      const res = await $fetch<ApiResponse<{ avatarUrl: string | null }>>(
        "/api/user/avatar",
        {
          method: "PUT",
          body: {
            avatar,
          },
        },
      );
      if (!res.success) {
        throw new Error(res.message || "Failed to update avatar.");
      }

      toast.add({
        title: "Avatar diupdate!",
        color: "success",
        icon: "i-heroicons-check-circle",
      });

      return res.data;
    } catch (error) {
      toast.add({
        title: "Failed to update avatar!",
        color: "error",
        icon: "i-heroicons-x-circle",
      });
      return null;
    }
  };

  const updateProfile = async (profile: UpdateProfileInput) => {
    try {
      const res = await $fetch<ApiResponse<{ message: string }>>(
        "/api/user/profile",
        {
          method: "PUT",
          body: profile,
        },
      );
      if (!res.success) {
        throw new Error(res.message || "Failed to update profile.");
      }

      toast.add({
        title: "Profile diupdate!",
        color: "success",
        icon: "i-heroicons-check-circle",
      });

      return res.message;
    } catch (error) {
      toast.add({
        title: "Failed to update profile!",
        color: "error",
        icon: "i-heroicons-x-circle",
      });
      return null;
    }
  };

  const updatePassword = async (data: UpdatePasswordInput) => {
    try {
      const res = await $fetch<ApiResponse<{ message: string }>>(
        "/api/user/password",
        {
          method: "PUT",
          body: data,
        },
      );
      if (!res.success) {
        throw new Error(res.message || "Failed to update password.");
      }

      toast.add({
        title: "Password diupdate!",
        color: "success",
        icon: "i-heroicons-check-circle",
      });

      return res.message;
    } catch (error) {
      toast.add({
        title: "Failed to update password!",
        color: "error",
        icon: "i-heroicons-x-circle",
      });
      return null;
    }
  };

  const deleteAccount = async () => {
    try {
      const res = await $fetch<ApiResponse<{ message: string }>>(
        "/api/user/delete",
        {
          method: "DELETE",
        },
      );
      if (!res.success) {
        throw new Error(res.message || "Failed to delete account.");
      }

      toast.add({
        title: "Account dihapus!",
        color: "success",
        icon: "i-heroicons-check-circle",
      });

      return res.message;
    } catch (error) {
      toast.add({
        title: "Failed to delete account!",
        color: "error",
        icon: "i-heroicons-x-circle",
      });
      return null;
    }
  };

  return {
    currentProfile,
    getCurrentProfile,
    updateAvatar,
    updateProfile,
    updatePassword,
    deleteAccount,
  };
};
