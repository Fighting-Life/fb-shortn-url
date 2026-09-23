export const usePageLoader = () => {
  const isLoading = useState<boolean>("page-loader", () => false);
  const loadingMessage = useState<string>(
    "page-loader-message",
    () => "Loading...",
  );
  const loadingProgress = useState<number>("page-loader-progress", () => 0);

  let progressInterval: NodeJS.Timeout | null = null;

  /**
   * Start loading with optional message
   */
  const startLoading = (message: string = "Loading...") => {
    isLoading.value = true;
    loadingMessage.value = message;
    loadingProgress.value = 0;

    // Simulate progress
    if (progressInterval) clearInterval(progressInterval);

    progressInterval = setInterval(() => {
      if (loadingProgress.value < 90) {
        loadingProgress.value += Math.random() * 15;
      }
    }, 300);
  };

  /**
   * Stop loading
   */
  const stopLoading = () => {
    loadingProgress.value = 100;

    // Delay untuk smooth animation
    setTimeout(() => {
      isLoading.value = false;
      loadingProgress.value = 0;
      loadingMessage.value = "Loading...";

      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
    }, 400);
  };

  /**
   * Wrap async function dengan loader
   */
  const withLoading = async <T>(
    fn: () => Promise<T>,
    message?: string,
  ): Promise<T> => {
    try {
      startLoading(message);
      const result = await fn();
      return result;
    } finally {
      stopLoading();
    }
  };

  return {
    isLoading: readonly(isLoading),
    loadingMessage: readonly(loadingMessage),
    loadingProgress: readonly(loadingProgress),
    startLoading,
    stopLoading,
    withLoading,
  };
};
