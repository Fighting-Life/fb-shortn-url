export default defineNuxtPlugin(async (nuxtApp) => {
  const { data: settingDataState, syncFromAsyncData: syncSettingState } =
    useSettingState();

  if (import.meta.server) {
    const serverSettingData = nuxtApp?.ssrContext?.event.context?.settings;
    if (serverSettingData) {
      syncSettingState({
        ...serverSettingData,
      });
    }
  }
  return {
    provide: {
      settings: settingDataState.value,
    },
  };
});
