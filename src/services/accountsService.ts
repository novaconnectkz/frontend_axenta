/**
 * Сервис для работы с API учетных записей Axenta
 */

import { config } from "@/config/env";
import axios from "axios";

// Интерфейс для ответа от бэкенда
interface BackendCompany {
  id: number;
  name: string;
  database_schema: string;
  domain: string;
  contact_email: string;
  contact_phone: string;
  contact_person: string;
  address: string;
  city: string;
  country: string;
  is_active: boolean;
  max_users: number;
  max_objects: number;
  storage_quota: number;
  language: string;
  timezone: string;
  currency: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  subscription_id: number | null;
}

interface BackendPagination {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

interface BackendAccountsResponse {
  data: {
    companies: BackendCompany[];
    pagination: BackendPagination;
  };
  status: string;
}

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
  // Дополнительные поля из API
  country?: string;
  city?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  language?: string;
  timezone?: string;
  currency?: string;
  maxUsers?: number;
  storageQuota?: number;
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
    baseURL: "http://localhost:8080", // Используем локальный API
    timeout: 30000,
  });

  // Отдельный клиент для Axenta Cloud API
  private axentaCloudClient = axios.create({
    baseURL: "https://axenta.cloud",
    timeout: 30000,
  });


  constructor() {
    // Добавляем interceptor для автоматического добавления токена авторизации
    this.apiClient.interceptors.request.use((config) => {
      // Проверяем разные ключи для токена (для совместимости)
      const token = localStorage.getItem("axenta_token") || 
                   localStorage.getItem("token") ||
                   localStorage.getItem("authToken");
      
      const company = localStorage.getItem("axenta_company") || 
                     localStorage.getItem("company");

      console.log("AccountsService API request:", {
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        token: token ? `EXISTS (${token.substring(0, 10)}...)` : "MISSING",
        company: company ? "EXISTS" : "MISSING",
        headers: {
          authorization: config.headers["authorization"] ? "Token ***" : "none",
          tenantId: "DISABLED (CORS issue)"
        }
      });

      if (token) {
        // Поддерживаем разные форматы токенов
        if (token.startsWith('Token ') || token.startsWith('Bearer ')) {
          config.headers["authorization"] = token;
          config.headers["Authorization"] = token;
        } else {
          config.headers["authorization"] = `Token ${token}`;
          config.headers["Authorization"] = `Token ${token}`;
        }
      }

      // Временно отключаем X-Tenant-ID из-за CORS ограничений
      // if (company) {
      //   try {
      //     const companyData = JSON.parse(company);
      //     if (companyData.id) {
      //       config.headers["X-Tenant-ID"] = companyData.id;
      //     }
      //   } catch (e) {
      //     console.warn("Invalid company data in localStorage:", e);
      //   }
      // }

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

    // Добавляем interceptor для Axenta Cloud API
    this.axentaCloudClient.interceptors.request.use((config) => {
      // Используем токен для Axenta Cloud
      const token = localStorage.getItem("axenta_token") || 
                   localStorage.getItem("token") ||
                   localStorage.getItem("authToken");
      
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
      
      return config;
    });
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

      // Удаляем undefined значения, чтобы они не передавались как строки
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      // Возможно, API Axenta Cloud использует другое название параметра
      // Попробуем разные варианты для фильтрации по статусу
      if (params.is_active !== undefined) {
        // Дублируем параметр под разными именами для совместимости
        params.active = params.is_active;
        params.status = params.is_active ? 'active' : 'inactive';
        console.log("📡 Фильтрация по статусу:", params.is_active ? 'Активные' : 'Заблокированные');
      }

      console.log("📡 Запрос учетных записей:", params);

      const response = await this.apiClient.get<any>(
        "/api/auth/accounts", // Используем локальный эндпоинт
        { params }
      );

      console.log("✅ Получен ответ от Axenta Cloud API:", {
        count: response.data.count,
        resultsCount: response.data.results?.length,
        next: response.data.next,
        previous: response.data.previous,
      });

      // Логируем статусы первых нескольких записей для проверки фильтрации
      if (response.data.results && response.data.results.length > 0) {
        const statusSample = response.data.results.slice(0, 5).map(account => ({
          name: account.name,
          isActive: account.isActive || account.is_active,
          status: account.status
        }));
        console.log("📊 Статусы первых записей:", statusSample);
      }

      // Работаем напрямую с данными от Axenta Cloud API
      const accounts = response.data.results || [];
      const count = response.data.count || 0;
      
      // Преобразуем данные аккаунтов в формат Account
      const results: Account[] = accounts.map((account: any) => ({
        id: account.id,
        name: account.name,
        type: account.type === "partner" ? "partner" : "client",
        adminFullname: account.adminFullname || "Не указано",
        adminId: account.adminId || 0,
        adminIsActive: account.adminIsActive !== false,
        parentAccountName: account.parentAccountName || "",
        objectsActive: account.objectsActive || 0,
        objectsTotal: account.objectsTotal || 0,
        objectsDeleted: account.objectsDeleted || 0,
        comment: account.comment || null,
        isActive: account.isActive !== false,
        blockingDatetime: account.blockingDatetime || null,
        hierarchy: account.hierarchy || "",
        daysBeforeBlocking: account.daysBeforeBlocking || null,
        creationDatetime: account.creationDatetime || new Date().toISOString(),
        // Дополнительные поля из API
        country: account.country,
        city: account.city,
        address: account.address,
        contactEmail: account.contactEmail,
        contactPhone: account.contactPhone,
        language: account.language,
        timezone: account.timezone,
        currency: account.currency,
        maxUsers: account.maxUsers,
        storageQuota: account.storageQuota,
      }));

      // Формируем ответ в том же формате, что и от API
      const finalResponse = {
        count: count,
        next: response.data.next,
        previous: response.data.previous,
        results,
      };

      console.log("✅ Финальный ответ:", {
        count: finalResponse.count,
        results: finalResponse.results.length,
        hasNext: !!finalResponse.next,
      });

      // Логируем hierarchy и type для отладки
      if (results.length > 0) {
        console.log("🔧 DEBUG: First account data:", {
          name: results[0].name,
          type: results[0].type,
          hierarchy: results[0].hierarchy,
          creationDatetime: results[0].creationDatetime
        });
        console.log("🔧 DEBUG: All accounts with type and hierarchy:", 
          results.map(acc => ({ name: acc.name, type: acc.type, hierarchy: acc.hierarchy }))
        );
      }

      return finalResponse;
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
      const response = await this.apiClient.get<any>(
        `/api/auth/accounts/${id}` // Используем локальный эндпоинт
      );
      
      // Преобразуем данные аккаунта
      const account = response.data;
      return {
        id: account.id,
        name: account.name,
        type: account.type === "partner" ? "partner" : "client",
        adminFullname: account.adminFullname || "Не указано",
        adminId: account.adminId || 0,
        adminIsActive: account.adminIsActive !== false,
        parentAccountName: account.parentAccountName || "",
        objectsActive: account.objectsActive || 0,
        objectsTotal: account.objectsTotal || 0,
        objectsDeleted: account.objectsDeleted || 0,
        comment: account.comment || null,
        isActive: account.isActive !== false,
        blockingDatetime: account.blockingDatetime || null,
        hierarchy: account.hierarchy || "",
        daysBeforeBlocking: account.daysBeforeBlocking || null,
        creationDatetime: account.creationDatetime || new Date().toISOString(),
        // Дополнительные поля из API
        country: account.country,
        city: account.city,
        address: account.address,
        contactEmail: account.contactEmail,
        contactPhone: account.contactPhone,
        language: account.language,
        timezone: account.timezone,
        currency: account.currency,
        maxUsers: account.maxUsers,
        storageQuota: account.storageQuota,
      };
    } catch (error) {
      console.error(`❌ Ошибка получения учетной записи ${id}:`, error);
      throw error;
    }
  }

  /**
   * Очистить дату блокировки аккаунта
   */
  async clearBlockingDatetime(id: number): Promise<void> {
    try {
      console.log(`🔄 Очистка даты блокировки для аккаунта ${id}`);
      
      const response = await this.axentaCloudClient.patch<any>(
        `/api/cms/accounts/${id}/`,
        { blockingDatetime: null }
      );
      
      console.log(`✅ Дата блокировки очищена для аккаунта ${id}:`, response.data);
      
      if (response.status !== 200) {
        throw new Error('Ошибка очистки даты блокировки');
      }
    } catch (error) {
      console.error(`❌ Ошибка очистки даты блокировки для аккаунта ${id}:`, error);
      throw error;
    }
  }

        /**
         * Активировать учетную запись
         */
        async activateAccount(id: number): Promise<void> {
          try {
            console.log(`🔄 Активация учетной записи ${id}`);
            
            // Сначала очищаем дату блокировки, если она есть
            await this.clearBlockingDatetime(id);
            
            // Затем активируем аккаунт через POST метод к /activate/ эндпоинту
            const response = await this.axentaCloudClient.post<any>(
              `/api/cms/accounts/${id}/activate/`,
              { state: true }
            );
            
            console.log(`✅ Учетная запись ${id} активирована:`, response.data);
            
            if (response.status !== 201) {
              throw new Error('Ошибка активации учетной записи');
            }
          } catch (error) {
            console.error(`❌ Ошибка активации учетной записи ${id}:`, error);
            throw error;
          }
        }

        /**
         * Деактивировать учетную запись
         */
        async deactivateAccount(id: number): Promise<void> {
          try {
            console.log(`🔄 Деактивация учетной записи ${id}`);
            
            // Используем правильный POST метод к /activate/ эндпоинту
            const response = await this.axentaCloudClient.post<any>(
              `/api/cms/accounts/${id}/activate/`,
              { state: false }
            );
            
            console.log(`✅ Учетная запись ${id} деактивирована:`, response.data);
            
            if (response.status !== 201) {
              throw new Error('Ошибка деактивации учетной записи');
            }
          } catch (error) {
            console.error(`❌ Ошибка деактивации учетной записи ${id}:`, error);
            throw error;
          }
        }

  /**
   * Переключить статус учетной записи (активация/деактивация)
   */
  async toggleAccountStatus(id: number, isActive: boolean): Promise<void> {
    if (isActive) {
      await this.activateAccount(id);
    } else {
      await this.deactivateAccount(id);
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
   * Создать новую учетную запись
   */
  async createAccount(accountData: {
    name: string;
    type: 'client' | 'partner';
    comment?: string | null;
    blockingDatetime?: string | null;
    adminId?: number | null;
    admin: {
      name: string;
      username: string;
      email: string;
      password: string;
      confirmPassword: string;
      visibleTabsNames: string[];
    };
  }): Promise<{ status: string; data: Account; error?: string }> {
    try {
      console.log("📡 Создание учетной записи:", accountData);

      // Подготавливаем данные для API, исключая adminId если он не указан
      const apiData: any = {
        name: accountData.name,
        type: accountData.type,
        comment: accountData.comment,
        blockingDatetime: accountData.blockingDatetime,
        admin: accountData.admin,
      };

      // Добавляем adminId только если он указан
      if (accountData.adminId) {
        apiData.adminId = accountData.adminId;
      }

      const response = await this.apiClient.post<any>(
        "/api/auth/accounts",
        apiData
      );

      console.log("✅ Учетная запись создана:", response.data);

      // Преобразуем данные аккаунта
      const account = response.data;
      const createdAccount: Account = {
        id: account.id,
        name: account.name,
        type: account.type === "partner" ? "partner" : "client",
        adminFullname: account.adminFullname || "Не указано",
        adminId: account.adminId || 0,
        adminIsActive: account.adminIsActive !== false,
        parentAccountName: account.parentAccountName || "",
        objectsActive: account.objectsActive || 0,
        objectsTotal: account.objectsTotal || 0,
        objectsDeleted: account.objectsDeleted || 0,
        comment: account.comment || null,
        isActive: account.isActive !== false,
        blockingDatetime: account.blockingDatetime || null,
        hierarchy: account.hierarchy || "",
        daysBeforeBlocking: account.daysBeforeBlocking || null,
        creationDatetime: account.creationDatetime || new Date().toISOString(),
        // Дополнительные поля из API
        country: account.country,
        city: account.city,
        address: account.address,
        contactEmail: account.contactEmail,
        contactPhone: account.contactPhone,
        language: account.language,
        timezone: account.timezone,
        currency: account.currency,
        maxUsers: account.maxUsers,
        storageQuota: account.storageQuota,
      };

      return {
        status: 'success',
        data: createdAccount,
      };
    } catch (error: any) {
      console.error("❌ Ошибка создания учетной записи:", error);
      
      let errorMessage = 'Ошибка создания учетной записи';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      return {
        status: 'error',
        data: {} as Account,
        error: errorMessage,
      };
    }
  }

  /**
   * Обновить учетную запись
   */
  async updateAccount(id: number, accountData: Partial<{
    name: string;
    type: 'client' | 'partner';
    comment?: string | null;
    blockingDatetime?: string | null;
    adminId?: number | null;
    admin?: {
      name: string;
      username: string;
      email: string;
      password: string;
      confirmPassword: string;
      visibleTabsNames: string[];
    };
  }>): Promise<{ status: string; data: Account; error?: string }> {
    try {
      console.log("📡 Обновление учетной записи:", id, accountData);

      const response = await this.apiClient.put<any>(
        `/api/auth/accounts/${id}`,
        accountData
      );

      console.log("✅ Учетная запись обновлена:", response.data);

      // Преобразуем данные аккаунта
      const account = response.data;
      const updatedAccount: Account = {
        id: account.id,
        name: account.name,
        type: account.type === "partner" ? "partner" : "client",
        adminFullname: account.adminFullname || "Не указано",
        adminId: account.adminId || 0,
        adminIsActive: account.adminIsActive !== false,
        parentAccountName: account.parentAccountName || "",
        objectsActive: account.objectsActive || 0,
        objectsTotal: account.objectsTotal || 0,
        objectsDeleted: account.objectsDeleted || 0,
        comment: account.comment || null,
        isActive: account.isActive !== false,
        blockingDatetime: account.blockingDatetime || null,
        hierarchy: account.hierarchy || "",
        daysBeforeBlocking: account.daysBeforeBlocking || null,
        creationDatetime: account.creationDatetime || new Date().toISOString(),
        // Дополнительные поля из API
        country: account.country,
        city: account.city,
        address: account.address,
        contactEmail: account.contactEmail,
        contactPhone: account.contactPhone,
        language: account.language,
        timezone: account.timezone,
        currency: account.currency,
        maxUsers: account.maxUsers,
        storageQuota: account.storageQuota,
      };

      return {
        status: 'success',
        data: updatedAccount,
      };
    } catch (error: any) {
      console.error("❌ Ошибка обновления учетной записи:", error);
      
      let errorMessage = 'Ошибка обновления учетной записи';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      return {
        status: 'error',
        data: {} as Account,
        error: errorMessage,
      };
    }
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
