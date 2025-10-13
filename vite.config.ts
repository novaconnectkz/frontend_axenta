import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  
  // Генерируем информацию о сборке
  const buildTime = new Date().toISOString();
  const commitHash = process.env.GITHUB_SHA?.substring(0, 7) || 'dev';

  return {
    plugins: [
      vue(),
      {
        name: "html-transform",
        transformIndexHtml(html) {
          // Заменяем все переменные окружения в HTML
          return html
            .replace(
              "%VITE_BACKEND_URL%",
              env.VITE_BACKEND_URL || "https://api.axenta.glonass-saratov.ru"
            )
            .replace(
              "%VITE_WS_BASE_URL%",
              env.VITE_WS_BASE_URL || "wss://api.axenta.glonass-saratov.ru"
            )
            .replace("%VITE_APP_NAME%", env.VITE_APP_NAME || "Axenta CRM")
            .replace("%VITE_API_VERSION%", env.VITE_API_VERSION || "v1")
            .replace("%VITE_APP_ENV%", env.VITE_APP_ENV || "production");
        },
      },
    ],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },

    // Настройки для SPA
    build: {
      target: "es2015",
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: mode === "development",
      minify: mode === "production" ? "esbuild" : false,
      rollupOptions: {
        output: {
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]",
          manualChunks: {
            // Разделяем vendor библиотеки для лучшего кэширования
            "vendor-vue": ["vue", "vue-router", "pinia"],
            "vendor-vuetify": ["vuetify"],
            "vendor-utils": ["axios"],
          },
        },
      },
    },

    // Настройки для статических файлов
    publicDir: "public",

    // Настройки dev сервера для SPA
    server: {
      port: 3001,
      host: true,
      // История API для SPA маршрутизации
      historyApiFallback: {
        index: "/index.html",
        rewrites: [
          // Перенаправляем все маршруты на index.html для SPA
          { from: /^\/(?!api).*$/, to: "/index.html" },
        ],
      },
      proxy: {
        // Проксируем API запросы на backend
        "/api": {
          target: env.VITE_BACKEND_URL || "http://localhost:8080",
          changeOrigin: true,
          secure: false,
        },
        // Проксируем WebSocket соединения
        "/ws": {
          target: env.VITE_WS_BASE_URL || "ws://localhost:8080",
          ws: true,
          changeOrigin: true,
        },
      },
    },

    // Настройки preview для продакшена
    preview: {
      port: 3001,
      host: true,
      // История API для preview режима
      historyApiFallback: {
        index: "/index.html",
      },
    },

    // CSS настройки
    css: {
      devSourcemap: mode === "development",
      preprocessorOptions: {
        scss: {
          additionalData: `
            @import "vuetify/styles";
          `,
        },
      },
    },

    // Переменные окружения и полифиллы
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: mode === "development",
      // Node.js полифиллы для браузера
      global: "globalThis",
      // Определяем переменные окружения с дефолтными значениями
      "process.env.VITE_BACKEND_URL": JSON.stringify(
        env.VITE_BACKEND_URL || "https://api.axenta.glonass-saratov.ru"
      ),
      "process.env.VITE_WS_BASE_URL": JSON.stringify(
        env.VITE_WS_BASE_URL || "wss://api.axenta.glonass-saratov.ru"
      ),
      "process.env.VITE_API_VERSION": JSON.stringify(
        env.VITE_API_VERSION || "v1"
      ),
      "process.env.VITE_APP_ENV": JSON.stringify(
        env.VITE_APP_ENV || "production"
      ),
      "process.env.VITE_APP_NAME": JSON.stringify(
        env.VITE_APP_NAME || "Axenta CRM"
      ),
      // Информация о сборке
      "__BUILD_TIME__": JSON.stringify(buildTime),
      "__COMMIT_HASH__": JSON.stringify(commitHash),
    },

    // Настройки для совместимости с Node.js модулями
    optimizeDeps: {
      include: ["vue", "vue-router", "pinia", "vuetify", "axios"],
      exclude: ["@vitejs/client"],
    },

    // Настройки для предотвращения parser-blocking скриптов
    esbuild: {
      // Отключаем document.write в режиме разработки
      banner: `
        // Отключаем document.write для предотвращения parser-blocking
        if (typeof document !== 'undefined') {
          const originalWrite = document.write;
          document.write = function() {
            console.warn('document.write blocked for performance');
          };
        }
      `,
    },

    // Настройки для тестов
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/__tests__/setup.ts"],
      deps: {
        inline: ["vuetify"],
      },
      server: {
        deps: {
          inline: ["vuetify"],
        },
      },
    },
  };
});
