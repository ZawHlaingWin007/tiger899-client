import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["tiger899-logo.png", "apple-touch-icon.png", "pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        id: "/",
        name: "Tiger899",
        short_name: "Tiger899",
        description: "Tiger899 - Myanmar Slot Games | Online Casino",
        theme_color: "#511799",
        background_color: "#16062B",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        lang: "my",
        categories: ["games", "entertainment"],
        icons: [
          {
            src: "tiger899-logo.png",
            sizes: "1280x1280",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "tiger899-logo.png",
            sizes: "1280x1280",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "tiger899-logo.png",
            sizes: "1280x1280",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}"],
        navigateFallback: "index.html",
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  server: {
    port: 8080,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("vue") || id.includes("vuex") || id.includes("vue-router")) {
              return "vue";
            }
            if (id.includes("vant")) return "vant";
            if (id.includes("swiper")) return "swiper";
            if (id.includes("axios")) return "axios";
            if (id.includes("moment") || id.includes("luxon")) return "date";
            return "vendor";
          }
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
