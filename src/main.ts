import "@mdi/font/css/materialdesignicons.css";
import { createPinia } from "pinia";
import { createApp } from "vue";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "vuetify/dist/vuetify.css";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

// Настройка Vuetify с темой
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: "light",
    themes: {
      light: {
        colors: {
          primary: "#1976d2",
          secondary: "#424242",
          accent: "#82b1ff",
          error: "#ff5252",
          info: "#2196f3",
          success: "#4caf50",
          warning: "#ffc107",
        },
      },
      dark: {
        colors: {
          primary: "#2196f3",
          secondary: "#424242",
          accent: "#ff4081",
          error: "#ff5252",
          info: "#2196f3",
          success: "#4caf50",
          warning: "#ffc107",
        },
      },
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

// Настройка приложения
app.use(pinia);
app.use(vuetify);
app.use(router);

app.mount("#app");
