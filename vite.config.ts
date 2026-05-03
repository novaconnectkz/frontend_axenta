import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { execSync } from "node:child_process";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  
  // Генерируем информацию о сборке
  const buildTime = new Date().toISOString();
  
  // Получаем хеш коммита с приоритетом по источникам
  let commitHash = 'unknown';
  let commitCount = 0;

  if (process.env.GITHUB_SHA) {
    commitHash = process.env.GITHUB_SHA.substring(0, 7);
  } else if (process.env.VERCEL_GIT_COMMIT_SHA) {
    commitHash = process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7);
  } else if (process.env.GIT_COMMIT_SHA) {
    commitHash = process.env.GIT_COMMIT_SHA.substring(0, 7);
  } else {
    try {
      const gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
      if (gitHash && gitHash !== 'HEAD') {
        commitHash = gitHash;
      }
    } catch (error) {
      console.warn('[vite.config] git rev-parse failed:', (error as Error).message);
      commitHash = Math.floor(Date.now() / 1000).toString(36);
    }
  }

  // Кол-во коммитов = build-номер (авто-инкремент)
  try {
    const count = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();
    commitCount = parseInt(count, 10) || 0;
  } catch (error) {
    console.warn('[vite.config] git rev-list failed:', (error as Error).message);
    commitCount = 0;
  }

  console.log(`[vite.config] version: 1.0.${commitCount} (${commitHash})`);

  return {
    plugins: [
      vue(),
      {
        name: "git-version-watch",
        configureServer(server) {
          // Polling по hash каждые 5с — надёжнее чем file-watch на .git/refs/heads/main
          // (refs могут попадать в packed-refs, тогда отдельного файла нет и fswatch не срабатывает).
          let lastHash = '';
          try {
            lastHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
          } catch {}
          const interval = setInterval(() => {
            try {
              const cur = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
              if (cur && cur !== lastHash) {
                console.log(`[git-version-watch] HEAD changed ${lastHash.slice(0,7)} → ${cur.slice(0,7)}, restart`);
                lastHash = cur;
                server.restart();
              }
            } catch {}
          }, 5000);
          server.httpServer?.on('close', () => clearInterval(interval));
        },
      },
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
            "vendor-excel": ["exceljs"],
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
      // Отключаем прокси для API - фронтенд будет обращаться напрямую к бэкенду
      // proxy: {
      //   // Проксируем API запросы на backend
      //   "/api": {
      //     target: env.VITE_BACKEND_URL || "http://localhost:8080",
      //     changeOrigin: true,
      //     secure: false,
      //   },
      //   // Проксируем WebSocket соединения
      //   "/ws": {
      //     target: env.VITE_WS_BASE_URL || "ws://localhost:8080",
      //     ws: true,
      //     changeOrigin: true,
      //   },
      // },
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
      "__COMMIT_COUNT__": JSON.stringify(commitCount),
    },

    // Настройки для совместимости с Node.js модулями
    optimizeDeps: {
      include: ["vue", "vue-router", "pinia", "vuetify", "axios"],
      exclude: ["@vitejs/client"],
    },

    // Настройки для предотвращения parser-blocking скриптов
    esbuild: {
      // В prod-сборке делаем console.log/debug/info side-effect-free → esbuild minify их выкинет.
      // console.error и console.warn остаются для диагностики.
      // Чистит ~700+ debug-сообщений из usersService/accountsService/настройки.
      pure: mode === "production" ? ["console.log", "console.debug", "console.info"] : [],
      drop: mode === "production" ? ["debugger"] : [],
      // Мягкая блокировка document.write только для внешних скриптов
      banner: `
        // Мягкая блокировка document.write только для внешних скриптов
        if (typeof document !== 'undefined' && document.write) {
          const originalWrite = document.write;
          document.write = function(content) {
            // Разрешаем document.write для локальных скриптов
            if (typeof content === 'string' && !content.includes('yastatic.net') && !content.includes('googleapis.com')) {
              return originalWrite.apply(document, arguments);
            }
            console.warn('Blocked external document.write for performance');
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
