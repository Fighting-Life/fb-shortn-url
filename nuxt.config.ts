import { fileURLToPath } from "node:url";
import { defineNuxtConfig } from "nuxt/config";

const isProd = process.env.NODE_ENV === "production";
const isDev = !isProd;

export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@nuxt/image",
    "@nuxt/scripts",
    "nuxt-nodemailer",
    "nuxt-headlessui",
    "@vueuse/nuxt",
    "@vee-validate/nuxt",
    "@pinia/nuxt",
    "nuxt-auth-utils",
  ],
  devtools: {
    enabled: false,
  },
  css: ["~/assets/css/main.css"],
  compatibilityDate: "2026-06-30",
  vite: {
    build: {
      sourcemap: isProd,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          sourcemapExcludeSources: true,
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              if (id.includes("lodash")) return "vendor-lodash";
              return "vendor";
            }
            if (id.includes("assets/css")) {
              return "styles";
            }
          },
        },
        plugins: [],
        external: ["sharp"],
      },
      chunkSizeWarningLimit: 2000,
    },
    css: {
      preprocessorMaxWorkers: true,
      devSourcemap: false,
    },
    plugins: [
      {
        apply: "build",
        name: "vite-plugin-ignore-sourcemap-warnings",
        configResolved(config) {
          const originalOnWarn = config.build.rollupOptions.onwarn;
          config.build.rollupOptions.onwarn = (warning, warn) => {
            if (
              warning.code === "SOURCEMAP_BROKEN" &&
              warning.plugin === "@tailwindcss/vite:generate:build"
            ) {
              return;
            }

            if (originalOnWarn) {
              originalOnWarn(warning, warn);
            } else {
              warn(warning);
            }
          };
        },
      },
    ],
    server: {
      ...(isDev ? { ws: { port: 24679 } } : {}),
      allowedHosts: true,
      // Jangan pre-transform semua dep saat startup — hemat memory dev
      preTransformRequests: false,
    },
    resolve: {
      alias: [],
    },
    define: {
      global: "globalThis",
    },
    vue: {
      script: {
        globalTypeFiles: [
          fileURLToPath(new URL("./shared/types/index.d.ts", import.meta.url)),
        ],
      },
    },
    optimizeDeps: {
      include: [
        "date-fns",
        "clsx",
        "vee-validate",
        "@vee-validate/zod",
        "zod",
        "mitt",
        "pinia",
        "vue",
        "@vueuse/core",
        "@morev/vue-transitions",
      ],
      holdUntilCrawlEnd: false,
    },
  },
  nitro: {
    preset: 'vercel',
    compressPublicAssets: isProd
      ? {
        gzip: true,
        brotli: true,
      }
      : true,
    experimental: {
      websocket: true,
      wasm: false,
    },
    future: {
      nativeSWR: true,
    },
    prerender: {
      crawlLinks: false,
      failOnError: false,
      ignore: ["/api/**", "/app/**", "/__sitemap__/style.xsl"],
    },
    minify: isProd,
    ...(isDev && {
      devHandlers: [],
      devProxy: {
        // Proxy config jika perlu
      },
    }),
    ...(isProd && {
      timing: false, // Disable timing headers di prod
    }),
  },
  hooks: {
    "vite:extendConfig": (config) => {
      // if (typeof config.server!.hmr === "object") {
      // 	config.server!.hmr.protocol = "wss";
      // }
    },
  },
  routeRules: {
    "/": { prerender: false },
    "/sitemap.xml": {
      isr: 3600,
      headers: {
        "Content-Type": "application/xml",
      },
    },

    "/.well-known/**": {
      static: true,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=604800",
      },
    },
    "/_nuxt/**": isProd
      ? {
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      }
      : {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    "/api/**": {
      cache: false,
    },
  },
  app: {
    baseURL: "/",
    buildAssetsDir: "/_nuxt/",
    cdnURL: isDev ? "" : undefined,
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      htmlAttrs: {
        lang: "en",
      },
      meta: [
        { name: "format-detection", content: "telephone=no" },
        { name: "robots", content: "index,follow" },
      ],
      link: [
        {
          rel: "icon",
          type: "image/png",
          href: "/favicon-96x96.png",
          sizes: "96x96",
        },
        {
          rel: "icon",
          type: "image/png",
          href: "/favicon-32x32.png",
          sizes: "32x32",
        },
        {
          rel: "icon",
          type: "image/png",
          href: "/favicon-16x16.png",
          sizes: "16x16",
        },
        {
          rel: "icon",
          type: "image/svg+xml",
          href: "/favicon.svg",
        },
        {
          rel: "icon",
          type: "image/png",
          href: "/android-chrome-512x512.png",
          sizes: "512x512",
        },
        {
          rel: "icon",
          type: "image/png",
          href: "/android-chrome-192x192.png",
          sizes: "192x192",
        },
        {
          rel: "apple-touch-icon",
          type: "image/png",
          href: "/apple-touch-icon.png",
          sizes: "180x180",
        },
      ],
      bodyAttrs: {},
    },
    pageTransition: { name: "page", mode: "out-in" },
  },
  typescript: {
    shim: false,
    // typeCheck: false,
  },
  imports: {
    dirs: ["types"],
  },
  eslint: {
    config: {
      stylistic: {
        commaDangle: "never",
        braceStyle: "1tbs",
      },
    },
  },
  colorMode: {
    preference: "dark",
    classSuffix: "",
    storage: "cookie",
    storageKey: "socialforge-color-mode",
    dataValue: "theme",
  },
  nodemailer: {
    from: '"Link Mask" <id.tubexxi@gmail.com>',
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.NUXT_NODEMAILER_AUTH_EMAIL,
      pass: process.env.NUXT_NODEMAILER_AUTH_PASS,
    },
  },
  icon: {
    clientBundle: {
      scan: true,
      sizeLimitKb: 256,
    },
    fetchTimeout: 2000,
    serverBundle: "local",
  },
  image: {
    provider: 'none',
    quality: 80,
    format: ["avif", "webp", "jpeg", "jpg", "png", "gif"],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
      "2xl": 1536,
    },
  },
  runtimeConfig: {
    APP_NAME: process.env.APP_NAME,
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    HOST: process.env.HOST,
    PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    CLOUDAMQP_URL: process.env.CLOUDAMQP_URL,
    NUXT_BETTER_AUTH_SECRET: process.env.NUXT_BETTER_AUTH_SECRET,
    ENABLE_REGISTRATION: process.env.ENABLE_REGISTRATION,
    DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL,
    DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD,
    NUXT_SESSION_PASSWORD: process.env.NUXT_SESSION_PASSWORD,
    APP_CLIENT_SECRET: process.env.APP_CLIENT_SECRET,
    TRACKING_SECRET: process.env.TRACKING_SECRET,
    GA4_API_SECRET: process.env.GA4_API_SECRET,
    META_CAPI_ACCESS_TOKEN: process.env.META_CAPI_ACCESS_TOKEN,
    META_GRAPH_VERSION: process.env.META_GRAPH_VERSION || "v20.0",
    TIKTOK_ACCESS_TOKEN: process.env.TIKTOK_ACCESS_TOKEN,
    BCRYPT_COST: process.env.BCRYPT_COST,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRE_HOURS: process.env.JWT_EXPIRE_HOURS,
    JWT_REFRESH_EXPIRE_HOURS: process.env.JWT_REFRESH_EXPIRE_HOURS,
    NUXT_NODEMAILER_AUTH_EMAIL: process.env.NUXT_NODEMAILER_AUTH_EMAIL,
    NUXT_NODEMAILER_AUTH_PASS: process.env.NUXT_NODEMAILER_AUTH_PASS,
    NUXT_OAUTH_GOOGLE_CLIENT_ID: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
    NUXT_OAUTH_GOOGLE_CLIENT_SECRET:
      process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET,
    NUXT_OAUTH_GITHUB_CLIENT_ID: process.env.NUXT_OAUTH_GITHUB_CLIENT_ID,
    NUXT_OAUTH_GITHUB_CLIENT_SECRET:
      process.env.NUXT_OAUTH_GITHUB_CLIENT_SECRET,
    SANITY_PROJECT_ID: process.env.SANITY_PROJECT_ID,
    SANITY_DATASET: process.env.SANITY_DATASET,
    NUXT_SANITY_TOKEN: process.env.NUXT_SANITY_TOKEN,
    OG_IMAGE_SECRET: process.env.OG_IMAGE_SECRET,
    RATE_LIMIT_REQUESTS: process.env.RATE_LIMIT_REQUESTS,
    RATE_LIMIT_DURATION: process.env.RATE_LIMIT_DURATION,
    SESSION_LIFETIME: process.env.SESSION_LIFETIME,
    SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
    SESSION_SECURE: process.env.SESSION_SECURE,
    SESSION_HTTP_ONLY: process.env.SESSION_HTTP_ONLY,
    INTERNAL_HEALTH_TOKEN: process.env.INTERNAL_HEALTH_TOKEN,
    CACHE_TTL: process.env.CACHE_TTL,
    CACHE_PREFIX: process.env.CACHE_PREFIX,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET,
    public: {
      APP_NAME: process.env.APP_NAME,
      NODE_ENV: process.env.NODE_ENV,
      PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL,
    },
  },
  build: {
    transpile: [],
  },
});
