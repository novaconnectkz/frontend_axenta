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
  // URL бэкенда
  backendUrl: getEnvVar("VITE_BACKEND_URL", "http://localhost:8080"),

  // Название приложения
  appName: getEnvVar("VITE_APP_NAME", "Axenta CRM"),

  // Версия API
  apiVersion: getEnvVar("VITE_API_VERSION", "v1"),

  // Базовый URL API
  get apiBaseUrl() {
    return `${this.backendUrl}/api`;
  },
};

export default config;
