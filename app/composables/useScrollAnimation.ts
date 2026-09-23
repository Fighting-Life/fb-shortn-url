export const useScrollAnimation = () => {
  const observer = ref<IntersectionObserver | null>(null);

  const initScrollAnimation = () => {
    try {
      // Hapus observer lama jika ada
      if (observer.value) {
        observer.value.disconnect();
        observer.value = null;
      }

      // Pastikan code berjalan di client side
      if (typeof window === "undefined") return;

      // Buat Intersection Observer
      observer.value = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: "0px 0px -50px 0px",
        },
      );

      // Observe elements dengan error handling
      const animatedElements = document.querySelectorAll(
        ".fade-in-down, .fade-in-up, .fade-in-left, .fade-in-right, .zoom-in",
      );

      animatedElements.forEach((element) => {
        if (observer.value) {
          observer.value.observe(element);
        }
      });
    } catch (error) {
      console.warn("Scroll animation initialization failed:", error);
    }
  };

  const destroyScrollAnimation = () => {
    if (observer.value) {
      observer.value.disconnect();
      observer.value = null;
    }
  };

  // Auto cleanup
  onUnmounted(destroyScrollAnimation);

  return {
    initScrollAnimation,
    destroyScrollAnimation,
  };
};
