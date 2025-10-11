/**
 * Сервис для работы с API учетных записей Axenta
 */

import { config } from "@/config/env";
import axios from "axios";

export interface Account {
  id: number;
  name: string;
  type: "client" | "partner";
  adminFullname: string;
  adminId: number;
  adminIsActive: boolean;
  parentAccountName: string;
  objectsActive: number;
  objectsTotal: number;
  objectsDeleted: number;
  comment: string | null;
  isActive: boolean;
  blockingDatetime: string | null;
  hierarchy: string;
  daysBeforeBlocking: number | null;
  creationDatetime: string;
}

export interface AccountsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Account[];
}

export interface AccountsFilters {
  page?: number;
  per_page?: number;
  ordering?: string;
  search?: string;
  type?: "client" | "partner";
  is_active?: boolean;
}

class AccountsService {
  private static instance: AccountsService;
  private apiClient = axios.create({
    baseURL: config.apiBaseUrl, // Используем наш бэкенд как прокси
    timeout: 30000,
  });

  constructor() {
    // Добавляем interceptor для автоматического добавления токена авторизации
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem("axenta_token");
      const company = localStorage.getItem("axenta_company");

      console.log("AccountsService API request:", {
        url: config.url,
        token: token ? "EXISTS" : "MISSING",
        company: company ? "EXISTS" : "MISSING",
      });

      if (token) {
        config.headers["authorization"] = `Token ${token}`;
        config.headers["Authorization"] = `Token ${token}`;
      }

      if (company) {
        try {
          const companyData = JSON.parse(company);
          config.headers["X-Tenant-ID"] = companyData.id;
        } catch (e) {
          console.warn("Invalid company data in localStorage");
        }
      }

      return config;
    });

    // Добавляем interceptor для обработки ошибок
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.log("AccountsService API error:", {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
        });

        if (error.response?.status === 401) {
          console.log("401 error - clearing auth and redirecting to login");
          // Перенаправляем на страницу входа при ошибке авторизации
          localStorage.removeItem("axenta_token");
          localStorage.removeItem("axenta_user");
          localStorage.removeItem("axenta_company");
          localStorage.removeItem("axenta_token_expiry");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  static getInstance(): AccountsService {
    if (!AccountsService.instance) {
      AccountsService.instance = new AccountsService();
    }
    return AccountsService.instance;
  }

  /**
   * Получить список учетных записей
   */
  async getAccounts(filters: AccountsFilters = {}): Promise<AccountsResponse> {
    try {
      const params = {
        page: filters.page || 1,
        per_page: filters.per_page || 50,
        ordering: filters.ordering || "name",
        ...filters,
      };

      console.log("📡 Запрос учетных записей:", params);

      const response = await this.apiClient.get<AccountsResponse>(
        "/auth/accounts/", // Используем наш прокси эндпоинт
        { params }
      );

      console.log("✅ Получены учетные записи:", {
        count: response.data.count,
        results: response.data.results.length,
        hasNext: !!response.data.next,
        totalFromAPI: response.data.count,
      });

      // Убеждаемся, что count правильно передается
      if (!response.data.count || response.data.count === 0) {
        console.error("⚠️ API не вернул правильный count:", response.data);
      }

      return response.data;
    } catch (error) {
      console.error("❌ Ошибка получения учетных записей:", error);
      throw error;
    }
  }

  /**
   * Получить учетную запись по ID
   */
  async getAccount(id: number): Promise<Account> {
    try {
      const response = await this.apiClient.get<Account>(
        `/auth/accounts/${id}/` // Используем наш прокси эндпоинт
      );
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка получения учетной записи ${id}:`, error);
      throw error;
    }
  }

  /**
   * Поиск учетных записей
   */
  async searchAccounts(query: string, filters: AccountsFilters = {}): Promise<AccountsResponse> {
    return this.getAccounts({
      ...filters,
      search: query,
    });
  }

  /**
   * Получить статистику учетных записей
   */
  async getAccountsStats(): Promise<{
    total: number;
    active: number;
    blocked: number;
    clients: number;
    partners: number;
  }> {
    try {
      // Получаем первую страницу для общей статистики
      const response = await this.getAccounts({ per_page: 1 });
      
      // Для детальной статистики можно сделать дополнительные запросы
      const activeResponse = await this.getAccounts({ 
        per_page: 1, 
        is_active: true 
      });
      
      const clientsResponse = await this.getAccounts({ 
        per_page: 1, 
        type: "client" 
      });
      
      const partnersResponse = await this.getAccounts({ 
        per_page: 1, 
        type: "partner" 
      });

      return {
        total: response.count,
        active: activeResponse.count,
        blocked: response.count - activeResponse.count,
        clients: clientsResponse.count,
        partners: partnersResponse.count,
      };
    } catch (error) {
      console.error("❌ Ошибка получения статистики учетных записей:", error);
      throw error;
    }
  }
}

// Экспортируем singleton instance
export const accountsService = AccountsService.getInstance();
export default accountsService;
