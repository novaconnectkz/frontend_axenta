import "@mdi/font/css/materialdesignicons.css";
import { createPinia } from "pinia";
import { createApp, nextTick } from "vue";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "vuetify/dist/vuetify.css";
import { aliases, mdi } from "vuetify/iconsets/mdi";

// Apple Design System
import "./styles/apple-design-system.css";
import "./styles/browser-compatibility.css";
import appleTheme from "./styles/vuetify-apple-theme";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

// Настройка Vuetify с Apple темой
const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: "apple-light",
    themes: {
      "apple-light": appleTheme.light,
      "apple-dark": appleTheme.dark,
    },
  },
  defaults: appleTheme.components,
  display: {
    mobileBreakpoint: 'sm',
    thresholds: {
      xs: 0,
      sm: 480,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },
});

// Простой обработчик ошибок
app.config.errorHandler = (err, instance, info) => {
  console.error("Vue error:", err, info);
};

// Обработчик необработанных промисов
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  event.preventDefault();
});

// Обработчик общих ошибок JavaScript
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
});

// Инициализация Pinia
const pinia = createPinia();

// Настройка приложения - важен порядок!
app.use(pinia);  // Сначала Pinia для store
app.use(vuetify); // Затем UI библиотека
// Router подключаем в последнюю очередь, чтобы auth context был готов
app.use(router);

// Монтируем приложение
const mountedApp = app.mount("#app");

// Скрываем загрузочный экран после монтирования
nextTick(() => {
  // Даем время на первичный рендеринг
  setTimeout(() => {
    if (window.hideLoadingScreen) {
      window.hideLoadingScreen();
    }
  }, 100);
});
