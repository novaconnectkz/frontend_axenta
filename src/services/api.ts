// Простой HTTP клиент для API запросов
import axios from "axios";
import { config } from "@/config/env";

// Создаем экземпляр axios с базовой конфигурацией
export const apiClient = axios.create({
  baseURL: config.apiBaseUrl, // Используем конфигурацию из env
  timeout: config.apiTimeout, // Используем таймаут из конфигурации (по умолчанию 180 секунд)
  headers: {
    "Content-Type": "application/json",
  },
});

// Интерцептор для добавления токена авторизации
apiClient.interceptors.request.use(
  (config) => {
    // Получаем токен из localStorage
    const token = localStorage.getItem("axenta_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Добавляем заголовок тенанта если есть
    const tenantId = localStorage.getItem("tenant_id");
    if (tenantId) {
      config.headers["X-Tenant-ID"] = tenantId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ответов
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Используем улучшенный обработчик ошибок
    import("@/utils/errorHandler").then(({ globalErrorHandler }) => {
      globalErrorHandler.handleError(error);
    }).catch((err) => {
      console.warn("Cannot access error handler:", err);
      // Fallback для обработки ошибок авторизации
      if (error.response?.status === 401) {
        localStorage.removeItem("axenta_token");
        localStorage.removeItem("tenant_id");
        window.location.href = "/login";
      }
    });

    return Promise.reject(error);
  }
);

export default apiClient;
