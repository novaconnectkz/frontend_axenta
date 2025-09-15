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
import "./styles/scroll-fixes.css"; // Исправления прокрутки для продакшена
import "./styles/mobile-fixes.css"; // Исправления для мобильных устройств
import appleTheme from "./styles/vuetify-apple-theme";

import App from "./App.vue";
import router from "./router";
import { initDemoMode } from "./utils/demoMode";
import "./utils/themeDebug"; // Утилиты отладки темы

const app = createApp(App);

// Настройка Vuetify с Apple темой
const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: "mdi",
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
    mobileBreakpoint: "sm",
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
app.use(pinia); // Сначала Pinia для store
app.use(vuetify); // Затем UI библиотека
// Router подключаем в последнюю очередь, чтобы auth context был готов
app.use(router);

// Инициализируем демо режим
initDemoMode();

// Устанавливаем светлую тему по умолчанию, если не выбрана
if (!document.body.hasAttribute("data-theme")) {
  document.body.setAttribute("data-theme", "light");
}

// Принудительно исправляем прокрутку для продакшена
const forceScrollFix = () => {
  console.log('🔧 Applying scroll fixes for production...');
  
  // Добавляем классы для принудительного исправления прокрутки
  document.documentElement.classList.add('force-scroll-fix');
  document.body.classList.add('force-scroll-fix');
  
  // Убеждаемся, что основные элементы имеют правильные стили прокрутки
  const elementsToFix = ['html', 'body', '#app', '.v-application'];
  
  elementsToFix.forEach(selector => {
    const element = document.querySelector(selector);
    if (element) {
      (element as HTMLElement).style.overflowY = 'auto';
      (element as HTMLElement).style.overflowX = 'hidden';
      (element as HTMLElement).style.height = 'auto';
      (element as HTMLElement).style.minHeight = '100vh';
    }
  });
  
  console.log('✅ Scroll fixes applied');
};

// Применяем исправления прокрутки
forceScrollFix();

// Монтируем приложение
const mountedApp = app.mount("#app");

// Скрываем загрузочный экран после монтирования
nextTick(() => {
  // Даем время на первичный рендеринг и инициализацию
  setTimeout(() => {
    console.log('🚀 App mounted, hiding loading screen...');
    if (window.hideLoadingScreen) {
      window.hideLoadingScreen();
    } else {
      console.warn('⚠️ hideLoadingScreen function not available');
      // Fallback - скрываем загрузочный экран напрямую
      const loadingScreen = document.getElementById('app-loading');
      const app = document.getElementById('app');
      if (loadingScreen) {
        loadingScreen.style.display = 'none';
      }
      if (app) {
        app.style.opacity = '1';
      }
    }
  }, 300); // Увеличиваем время для более надежной инициализации
});
