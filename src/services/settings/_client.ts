// Общие утилиты для модулей settingsService (apiClient, headers, helpers).
// Используются разделёнными доменными файлами в settings/.
import { config } from "@/config/env";
import axios from "axios";

// Базовый URL backend (без /api на конце)
export const API_BASE_URL = config.backendUrl;

// Получить токен авторизации из localStorage
export const getAuthToken = (): string | null => {
  return localStorage.getItem("axenta_token");
};

// Создать заголовки для fetch-запросов
export const createHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Token ${token}`;
  }
  return headers;
};

// Получить ID компании из localStorage (axenta_company)
export const getCompanyId = (): number | null => {
  try {
    const companyRaw = localStorage.getItem("axenta_company");
    if (companyRaw) {
      const company = JSON.parse(companyRaw);
      return company?.id || null;
    }
  } catch (error) {
    console.error("Error getting company ID:", error);
  }
  return null;
};

// Конфигурированный axios клиент с авторизацией и tenant-ID
export const settingsApiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 30000,
});

// fetchIntegrationsList — общий запрос списка всех интеграций компании.
// Используется доменными модулями (axenta/novaconnect) для проверки
// наличия интеграции до setup/update вызовов.
export async function fetchIntegrationsList(): Promise<
  { type: string; configured: boolean; is_active: boolean }[]
> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/integrations`, {
      method: "GET",
      headers: createHeaders(),
    });
    if (!response.ok) {
      console.error("Ошибка получения списка интеграций:", response.status);
      return [];
    }
    const data = await response.json();
    return data.integrations || [];
  } catch (error) {
    console.error("Ошибка получения списка интеграций:", error);
    return [];
  }
}

settingsApiClient.interceptors.request.use((cfg) => {
  const token = getAuthToken();
  if (token) {
    cfg.headers.Authorization = `Token ${token}`;
  }
  const companyRaw = localStorage.getItem("axenta_company");
  if (companyRaw) {
    try {
      const company = JSON.parse(companyRaw);
      const companyId = company?.id;
      if (companyId) {
        cfg.headers["X-Tenant-ID"] = String(companyId);
      }
    } catch (error) {
      console.error("Error parsing company data:", error);
    }
  }
  return cfg;
});
