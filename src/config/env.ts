// Конфигурация переменных окружения для Axenta Frontend

/**
 * Получает переменную окружения с fallback значением
 */
function getEnvVar(key: string, defaultValue: string): string {
  return import.meta.env[key] || defaultValue;
}

/**
 * Конфигурация приложения
 */
export const config = {
  // URL бэкенда - используем Axenta Cloud для реальных данных
  backendUrl: getEnvVar("VITE_BACKEND_URL", "https://axenta.cloud"),

  // WebSocket URL для реального времени
  wsBaseUrl: getEnvVar("VITE_WS_BASE_URL", "ws://localhost:8080"),

  // Название приложения
  appName: getEnvVar("VITE_APP_NAME", "Axenta CRM"),

  // Версия API
  apiVersion: getEnvVar("VITE_API_VERSION", "v1"),

  // Режим приложения
  appEnv: getEnvVar("VITE_APP_ENV", "development"),

  // Таймаут для API запросов
  apiTimeout: parseInt(getEnvVar("VITE_API_TIMEOUT", "30000")),

  // Базовый URL API
  get apiBaseUrl() {
    // Всегда добавляем /api к базовому URL
    // Например: https://api.axenta.glonass-saratov.ru + /api = https://api.axenta.glonass-saratov.ru/api
    return `${this.backendUrl}/api`;
  },

  // Проверка режима разработки
  get isDevelopment() {
    return this.appEnv === "development" || import.meta.env.DEV;
  },

  // Проверка продакшена
  get isProduction() {
    return this.appEnv === "production" || import.meta.env.PROD;
  },
};

export default config;
