import type { Ref } from "vue";

const defaultPublicSettings: PublicSettings = {
  site_name: "Link Mask",
  site_description: "Shorten, hide, and protect your destination links. Cloakify offers secure URL cloaking, advanced link tracking, and seamless redirects for marketers",
  site_keywords: "Shorten, hide, protect links",
  site_icon: "/logo.png",
  site_logo: "/logo.png",
  site_favicon: "/favicon.ico",
  site_theme: "dark",
  enable_register: true,
  enable_github_provider: true,
  enable_google_provider: true,
  max_upload_size_mb: 50,
  max_upload_image_mb: 10,
  max_upload_video_mb: 500,
  max_upload_audio_mb: 50,
  max_upload_document_mb: 20,
  max_upload_code_mb: 5,
  max_upload_archive_mb: 100,
  default_redirect_status: "302",
  allowed_target_schemes: "https",
  analytics_retention_days: "90",
  rate_limit_per_minute: "120",
  geoip_provider: "vercel",
  tracking_consent_required: true,
  maintenance_mode: false,
  abuse_contact_email: "",
};

export const useSettingState = (): {
  data: Ref<PublicSettings | null>;
  setData: (newData: Partial<PublicSettings>) => void;
  syncFromAsyncData: (asyncData: PublicSettings) => void;
  loadingData: Ref<boolean>;
  setLoad: (val: boolean) => void;
} => {
  const settingState = useState<PublicSettings | null>(
    "setting-data-state",
    () => ({ ...defaultPublicSettings }),
  );
  const loadingData = useState<boolean>("loading-setting-data", () => true);

  const setData = (newData: Partial<PublicSettings>) => {
    const currentDataJson = JSON.stringify(settingState.value);
    const newDataJson = JSON.stringify({ ...settingState.value, ...newData });

    if (currentDataJson !== newDataJson) {
      settingState.value = {
        ...settingState.value,
        ...newData,
      } as PublicSettings;
    }
  };

  const syncFromAsyncData = (asyncData: PublicSettings) => {
    setData(asyncData);
  };

  const setLoadStatus = (val: boolean) => {
    loadingData.value = val;
  };

  return {
    data: settingState,
    setData,
    syncFromAsyncData,
    loadingData: loadingData,
    setLoad: setLoadStatus,
  };
};
export const useSettingAsyncData = (
  apiPath: string = "/api/public/settings",
): {
  data: Ref<PublicSettings | null>;
  refresh: () => Promise<PublicSettings>;
  pending: Ref<boolean>;
  error: Ref<Error | null | undefined>;
} => {
  const {
    data: settingState,
    syncFromAsyncData: syncFromAsyncDataSetting,
    loadingData: loadingSetting,
    setLoad: setLoadStatusSetting,
  } = useSettingState();

  const fetchKey = `setting-data-state:${apiPath}`;
  const { data: cacheData } = useNuxtData<PublicSettings | null>(fetchKey);

  const fetchData = async (): Promise<PublicSettings> => {
    try {
      const response = await $fetch<PublicSettings>(apiPath);
      return {
        ...defaultPublicSettings,
        ...(response ?? {}),
      };
    } catch (err: any) {
      throw createError({
        status: 500,
        statusText: err.data?.message || err.message,
      });
    }
  };

  const {
    data: asyncData,
    pending,
    error,
    refresh: asyncRefresh,
  } = useAsyncData<PublicSettings>(
    fetchKey,
    async (nuxtApp) => {
      setLoadStatusSetting(true);
      if (import.meta.server) {
        const serverData = nuxtApp?.ssrContext?.event.context?.settings;
        if (serverData && apiPath === "/api/public/settings") {
          return {
            ...defaultPublicSettings,
            ...(serverData ?? {}),
          };
        }
        return await fetchData();
      } else {
        if (cacheData.value && Object.keys(cacheData.value).length > 0) {
          return {
            ...defaultPublicSettings,
            ...cacheData.value,
          };
        }
        const freshData = await fetchData();

        cacheData.value = freshData;

        return freshData;
      }
    },
    {
      server: true,
      immediate: true,
      default: () => ({ ...defaultPublicSettings }),
      transform: (data) => {
        const normalized = {
          ...defaultPublicSettings,
          ...(data ?? {}),
        };
        cacheData.value = normalized;
        syncFromAsyncDataSetting(normalized);
        setLoadStatusSetting(false);
        return normalized;
      },
      getCachedData: (key, nuxtApp, ctx) => {
        const data = nuxtApp.isHydrating
          ? nuxtApp.payload.data[key]
          : nuxtApp.static.data[key];
        if (
          !data ||
          Object.keys(data as Record<string, unknown>).length === 0
        ) {
          return undefined;
        }

        if (
          ctx.cause === "initial" ||
          ctx.cause === "watch" ||
          ctx.cause === "refresh:hook" ||
          ctx.cause === "refresh:manual"
        ) {
          return data;
        }

        const normalized = {
          ...defaultPublicSettings,
          ...(data as PublicSettings),
        };
        cacheData.value = normalized;
        return normalized;
      },
    },
  );

  watch(
    asyncData,
    (newVal) => {
      if (!newVal) return;
      cacheData.value = newVal as PublicSettings;
      syncFromAsyncDataSetting(newVal as PublicSettings);
    },
    { immediate: true },
  );

  watch(
    pending,
    (newPendingStatus) => {
      setLoadStatusSetting(newPendingStatus);
    },
    { immediate: true },
  );

  const refresh = async () => {
    try {
      setLoadStatusSetting(true);
      cacheData.value = null;

      const newData = await fetchData();
      cacheData.value = newData;

      await asyncRefresh();

      setLoadStatusSetting(false);
      return newData;
    } catch (err) {
      setLoadStatusSetting(false);
      throw createError({
        status: 500,
        statusText: "Refresh failed",
      });
    }
  };

  return {
    data: settingState,
    refresh,
    pending: loadingSetting,
    error,
  };
};

export function usePublicSettings() {
  return useFetch<PublicSettings>("/api/public/settings", {
    key: "public-settings",
    server: true,
    lazy: false,
    default: () => ({ ...defaultPublicSettings }),
    transform: (input: PublicSettings | null | undefined): PublicSettings => ({
      ...defaultPublicSettings,
      ...(input ?? {}),
    }),
    getCachedData: (key, nuxtApp) => {
      const data = nuxtApp.isHydrating
        ? nuxtApp.payload.data[key]
        : nuxtApp.static.data[key];
      if (!data || Object.keys(data as Record<string, unknown>).length === 0) {
        return undefined;
      }
      return {
        ...defaultPublicSettings,
        ...(data as PublicSettings),
      };
    },
  });
}

export function useSetting<K extends keyof PublicSettings>(key: K) {
  const { data, pending, error, refresh } = usePublicSettings();

  return {
    value: computed(() => (data.value ?? defaultPublicSettings)[key]),
    pending,
    error,
    refresh,
  };
}

export function useAdminSettingsMap() {
  return useFetch<{ groups: SettingsGroupMap }>("/api/settings/map", {
    key: "admin-settings-map",
  });
}

export function useAdminSetting(group_name: string, key: string) {
  const { data, pending, error, refresh } = useAdminSettingsMap();

  return {
    value: computed(() => data.value?.groups?.[group_name]?.[key]),
    pending,
    error,
    refresh,
  };
}

export async function updateSettings(
  updates:
    | {
      key: string;
      value: string | number | boolean | null;
      group_name?: string;
    }
    | {
      updates: {
        key: string;
        value: string | number | boolean | null;
        group_name?: string;
      }[];
    },
) {
  return await $fetch<{ success: true; message: "OK" }>("/api/settings", {
    method: "PUT",
    body: updates,
  });
}
