import type { Id, ToastOptions, ToastType } from "vue3-toastify";
import { toast } from "vue3-toastify";

type ToastyType = ToastType | "loading";
type ToastPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "bottom-center";

interface AdvancedToastOptions extends ToastOptions {
  timeout?: number;
  icon?: string | boolean;
  hideProgressBar?: boolean;
  closeOnClick?: boolean;
  toastClassName?: string;
  bodyClassName?: string;
}

export default function useAppToast() {
  /**
   * Show toast notification
   * @param type - Type of toast (error, success, loading, info, warning)
   * @param message - Message to display (can contain HTML)
   * @param options - Advanced options (optional)
   */
  const showToast = (
    type: ToastyType,
    message: string,
    options?: AdvancedToastOptions,
  ) => {
    const baseOptions: ToastOptions = {
      theme: "auto",
      type: type as ToastType, // Type assertion for loading
      position: "top-right",
      transition: "zoom",
      dangerouslyHTMLString: true,
      autoClose: type === "loading" ? false : 5000,
      hideProgressBar: options?.hideProgressBar ?? false,
      closeOnClick: options?.closeOnClick ?? true,
      toastClassName: options?.toastClassName || "",
      bodyClassName: options?.bodyClassName || "",
      ...options,
    };

    // Custom loading icon
    if (type === "loading") {
      baseOptions.icon = options?.icon ?? "⏳";
      baseOptions.autoClose = false;
    }

    return toast(message, baseOptions);
  };

  /**
   * Shortcut methods for common toast types
   */
  const toastShortcuts = {
    error: (message: string, options?: AdvancedToastOptions) =>
      showToast("error", message, options),
    success: (message: string, options?: AdvancedToastOptions) =>
      showToast("success", message, options),
    loading: (message: string, options?: AdvancedToastOptions) =>
      showToast("loading", message, options),
    info: (message: string, options?: AdvancedToastOptions) =>
      showToast("info", message, options),
    warning: (message: string, options?: AdvancedToastOptions) =>
      showToast("warning", message, options),
    dismiss: (id?: Id) => toast.done(id as Id),
  };

  return {
    show: showToast,
    ...toastShortcuts,
  };
}
