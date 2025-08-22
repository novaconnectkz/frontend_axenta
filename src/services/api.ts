// Простой HTTP клиент для API запросов
import axios from "axios";

// Создаем экземпляр axios с базовой конфигурацией
export const apiClient = axios.create({
  baseURL: "/api", // Базовый URL для API
  timeout: 10000, // Таймаут 10 секунд
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
    // Обработка ошибок авторизации
    if (error.response?.status === 401) {
      // Токен истек или невалиден
      localStorage.removeItem("axenta_token");
      localStorage.removeItem("tenant_id");
      // Можно добавить редирект на страницу входа
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default apiClient;
