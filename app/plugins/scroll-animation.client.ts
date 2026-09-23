export default defineNuxtPlugin((nuxtApp) => {
  if (typeof IntersectionObserver === "undefined") return;

  let observer: IntersectionObserver | null = null;

  const initScrollAnimation = () => {
    // Hapus observer lama
    if (observer) {
      observer.disconnect();
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            // Optional: unobserve setelah element terlihat
            // observer?.unobserve(entry.target)
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      },
    );

    // Observe elements
    const animatedElements = document.querySelectorAll(
      ".fade-in-down, .fade-in-up, .fade-in-left, .fade-in-right, .zoom-in",
    );

    animatedElements.forEach((element) => {
      observer!.observe(element);
    });
  };

  // Initialize on route change
  nuxtApp.hook("page:start", () => {
    // Reset animations
    const animatedElements = document.querySelectorAll(
      ".fade-in-down, .fade-in-up, .fade-in-left, .fade-in-right, .zoom-in",
    );
    animatedElements.forEach((element) => {
      element.classList.remove("is-visible");
    });
  });

  nuxtApp.hook("page:finish", () => {
    setTimeout(initScrollAnimation, 100);
  });

  // Initialize on first load
  setTimeout(initScrollAnimation, 500);
});
