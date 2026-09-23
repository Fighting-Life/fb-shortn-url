// app/router.options.ts
import type { RouterConfig } from "@nuxt/schema";

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    // Jika ini adalah navigasi pertama (halaman baru dimuat)
    if (from.name === undefined) {
      return { top: 0, behavior: "smooth" };
    }

    // Jika ada hash (anchor link)
    if (to.hash) {
      return {
        el: to.hash,
        behavior: "smooth",
        top: 80, // offset untuk header fixed jika ada
      };
    }

    // Jika ada savedPosition (misalnya saat back/forward navigation)
    if (savedPosition) {
      return savedPosition;
    }

    // Default: scroll ke atas
    return { top: 0, behavior: "smooth" };
  },
};
