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
  objectsDeactivated?: number; // Деактивированные объекты (для Wialon)
  comment: string | null;
  isActive: boolean;
  blockingDatetime: string | null;
  hierarchy: string;
  daysBeforeBlocking: number | null;
  creationDatetime: string;
  // Поля для Wialon источников
  dealer_rights?: boolean; // Права дилера (для Wialon)
  source?: string; // Источник данных (axenta, WL|Профмонитор и т.д.)
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
  type?: "client" | "partner" | null;
  is_active?: boolean | null;
}

class AccountsService {
  private static instance: AccountsService;
  private apiClient = axios.create({
    baseURL: config.backendUrl, // Используем переменную из .env
    timeout: config.apiTimeout, // Используем таймаут из конфигурации
  });

  // Отдельный клиент для Axenta Cloud API
  private axentaCloudClient = axios.create({
    baseURL: "https://axenta.cloud",
    timeout: config.apiTimeout, // Используем таймаут из конфигурации
  });

  // Кеширование статистики
  private statsCache: {
    data: {
      total: number;
      active: number;
      blocked: number;
      clients: number;
      partners: number;
    } | null;
    timestamp: number;
    ttl: number; // Время жизни кеша в миллисекундах (10 секунд)
  } = {
      data: null,
      timestamp: 0,
      ttl: 10000, // 10 секунд
    };

  // Дедупликация запросов статистики
  private pendingStatsRequest: Promise<{
    total: number;
    active: number;
    blocked: number;
    clients: number;
    partners: number;
  }> | null = null;

  // Кеширование родительских аккаунтов
  private parentAccountsCache: {
    data: Account[] | null;
    timestamp: number;
    ttl: number; // Время жизни кеша в миллисекундах (5 минут)
  } = {
      data: null,
      timestamp: 0,
      ttl: 300000, // 5 минут
    };

  // Дедупликация запросов родительских аккаунтов
  private pendingParentAccountsRequest: Promise<Account[]> | null = null;


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

      // X-Tenant-ID нужен для backend ToggleAccountStatus / RefreshAccount —
      // без него запись пишется в public, а UI читает из tenant_<id> → расхождение.
      // CORS уже разрешает X-Tenant-ID (см. middleware/cors.go AllowedHeaders).
      if (company) {
        try {
          const companyData = JSON.parse(company);
          if (companyData.id) {
            config.headers["X-Tenant-ID"] = String(companyData.id);
          }
        } catch (e) {
          console.warn("Invalid company data in localStorage:", e);
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

          // Используем replace, чтобы не создавать запись в истории
          if (typeof window !== 'undefined' && window.location) {
            if (window.location.pathname !== '/login') {
              window.location.replace('/login');
            }
          }
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
        if ((params as any)[key] === undefined) {
          delete (params as any)[key];
        }
      });

      // Возможно, API Axenta Cloud использует другое название параметра
      // Попробуем разные варианты для фильтрации по статусу
      if (params.is_active !== undefined) {
        // Дублируем параметр под разными именами для совместимости
        (params as any).active = params.is_active;
        (params as any).status = params.is_active ? 'active' : 'inactive';
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
        const statusSample = response.data.results.slice(0, 5).map((account: any) => ({
          name: account.name,
          isActive: account.isActive || account.is_active,
          status: account.status
        }));
        console.log("📊 Статусы первых записей:", statusSample);
      }

      // Работаем напрямую с данными от Axenta Cloud API
      const accounts = response.data.results || [];
      const count = response.data.count || 0;

      // Логируем первую учетную запись для проверки структуры данных
      if (accounts.length > 0) {
        console.log('🔍 DEBUG: Первая учетная запись из API (сырые данные):', {
          rawAccount: accounts[0],
          objectsActive: accounts[0].objectsActive,
          objectsTotal: accounts[0].objectsTotal,
          objects_active: accounts[0].objects_active,
          objects_total: accounts[0].objects_total,
          allKeys: Object.keys(accounts[0])
        });
      }

      // Преобразуем данные аккаунтов в формат Account
      const results: Account[] = accounts.map((account: any) => {
        // Используем правильное извлечение полей с учетом разных вариантов названий
        const objectsActive = account.objectsActive ?? account.objects_active ?? account.objectsActive ?? 0;
        const objectsTotal = account.objectsTotal ?? account.objects_total ?? account.objectsTotal ?? 0;
        const objectsDeleted = account.objectsDeleted ?? account.objects_deleted ?? 0;

        // Логируем для первой учетной записи
        if (accounts.indexOf(account) === 0) {
          console.log('🔍 DEBUG: Маппинг первой учетной записи:', {
            name: account.name,
            objectsActiveSource: account.objectsActive,
            objectsTotalSource: account.objectsTotal,
            objectsActiveMapped: objectsActive,
            objectsTotalMapped: objectsTotal
          });
        }

        return {
          id: account.id,
          name: account.name,
          type: account.type === "partner" ? "partner" : "client",
          adminFullname: account.adminFullname || "Не указано",
          adminId: account.adminId || 0,
          adminIsActive: account.adminIsActive !== false,
          parentAccountName: account.parentAccountName || "",
          objectsActive: objectsActive,
          objectsTotal: objectsTotal,
          objectsDeleted: objectsDeleted,
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
      });

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
    const startTime = performance.now();
    try {
      console.log(`📡 Запрос к API: GET /api/auth/accounts/${id}`);
      const response = await this.apiClient.get<any>(
        `/api/auth/accounts/${id}` // Используем локальный эндпоинт
      );
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      // Преобразуем данные аккаунта
      const account = response.data;
      const result: Account = {
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

      console.log(`✅ API ответ получен за ${duration}ms для учетной записи ${id}`);

      // Предупреждение о медленной загрузке
      if (endTime - startTime > 2000) {
        console.warn(`⚠️ Медленный ответ API: ${duration}ms для учетной записи ${id}`);
      }

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      console.error(`❌ Ошибка получения учетной записи ${id} (${duration}ms):`, error);
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
   * Активировать учетную запись.
   * Идём через наш backend-proxy /api/cms/accounts/:id/activate (см. main.go +
   * api/accounts.go:ToggleAccountStatus). Backend проксирует в Axenta + триггерит
   * SnapshotInvalidator → snapshot обновляется через 5-10s, /accounts UI видит новый is_active.
   * Раньше шли напрямую в axenta.cloud → snapshot оставался устаревшим до cron (10 мин).
   */
  async activateAccount(id: number): Promise<void> {
    try {
      console.log(`🔄 Активация учетной записи ${id}`);

      // Сначала очищаем дату блокировки, если она есть
      await this.clearBlockingDatetime(id);

      const response = await this.apiClient.post<any>(
        `/api/cms/accounts/${id}/activate`,
        { state: true }
      );

      console.log(`✅ Учетная запись ${id} активирована:`, response.data);

      if (response.status >= 400) {
        throw new Error('Ошибка активации учетной записи');
      }
    } catch (error) {
      console.error(`❌ Ошибка активации учетной записи ${id}:`, error);
      throw error;
    }
  }

  /**
   * Деактивировать учетную запись (через наш backend-proxy, см. activateAccount).
   */
  async deactivateAccount(id: number): Promise<void> {
    try {
      console.log(`🔄 Деактивация учетной записи ${id}`);

      const response = await this.apiClient.post<any>(
        `/api/cms/accounts/${id}/activate`,
        { state: false }
      );

      console.log(`✅ Учетная запись ${id} деактивирована:`, response.data);

      if (response.status >= 400) {
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
   * Точечный re-fetch axenta-аккаунта из Axenta Cloud в наш snapshot.
   * Используется когда юзер изменил статус снаружи (cms.axenta.cloud) и хочет
   * увидеть актуальные данные в ACRM не дожидаясь cron (10 мин).
   *
   * Backend: POST /api/auth/accounts/:id/refresh → дёргает GET /cms/accounts/:id
   * + UPDATE axenta_account_snapshots. ~200ms.
   *
   * Returns обновлённую запись { id, name, isActive }.
   */
  async refreshAxentaAccount(id: number): Promise<{ id: number; name: string; isActive: boolean }> {
    const response = await this.apiClient.post<any>(`/api/auth/accounts/${id}/refresh`);
    if (response.status >= 400) {
      throw new Error(response.data?.error || 'Ошибка обновления аккаунта');
    }
    return response.data?.data || { id, name: '', isActive: false };
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
   * Удалить учетную запись
   */
  async deleteAccount(id: number): Promise<void> {
    try {
      console.log(`🗑️ Удаление учетной записи ${id}`);

      const response = await this.axentaCloudClient.delete(
        `/api/cms/accounts/${id}/`
      );

      console.log(`✅ Учетная запись ${id} успешно удалена:`, response.status);

      if (response.status !== 204) {
        throw new Error('Ошибка удаления учетной записи');
      }
    } catch (error: any) {
      console.error(`❌ Ошибка удаления учетной записи ${id}:`, error);

      let errorMessage = 'Ошибка удаления учетной записи';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Получить статистику учетных записей
   */
  async getAccountsStats(forceRefresh: boolean = false): Promise<{
    total: number;
    active: number;
    blocked: number;
    clients: number;
    partners: number;
  }> {
    // Проверяем кеш, если не требуется принудительное обновление
    if (!forceRefresh && this.statsCache.data) {
      const now = Date.now();
      const age = now - this.statsCache.timestamp;

      if (age < this.statsCache.ttl) {
        console.log(`📦 Используем кешированную статистику учетных записей (возраст: ${Math.round(age / 1000)}с)`);
        return this.statsCache.data;
      }
    }

    // Если запрос уже выполняется, возвращаем тот же Promise
    if (this.pendingStatsRequest) {
      console.log("🔄 Запрос статистики учетных записей уже выполняется, используем существующий Promise");
      return this.pendingStatsRequest;
    }

    // Создаем новый Promise для запроса
    this.pendingStatsRequest = (async () => {
      try {
        // Один endpoint /api/auth/accounts/stats возвращает все 5 чисел из snapshot одним COUNT FILTER запросом.
        // Раньше были 4 параллельных запроса с per_page=1 — каждый платил middleware overhead ~1.5с.
        const res = await this.apiClient.get<{
          total: number;
          active: number;
          blocked: number;
          clients: number;
          partners: number;
        }>("/api/auth/accounts/stats");

        const stats = {
          total: res.data.total || 0,
          active: res.data.active || 0,
          blocked: res.data.blocked || 0,
          clients: res.data.clients || 0,
          partners: res.data.partners || 0,
        };

        this.updateStatsCache(stats);
        return stats;
      } catch (error) {
        console.error("❌ Ошибка получения статистики учетных записей:", error);
        throw error;
      } finally {
        this.pendingStatsRequest = null;
      }
    })();

    return this.pendingStatsRequest;
  }

  // Обновление кеша статистики
  private updateStatsCache(data: {
    total: number;
    active: number;
    blocked: number;
    clients: number;
    partners: number;
  }): void {
    this.statsCache = {
      data,
      timestamp: Date.now(),
      ttl: this.statsCache.ttl,
    };
  }

  // Очистка кеша статистики (для принудительного обновления)
  clearStatsCache(): void {
    this.statsCache = {
      data: null,
      timestamp: 0,
      ttl: this.statsCache.ttl,
    };
    console.log("🗑️ Кеш статистики учетных записей очищен");
  }

  // Установка времени жизни кеша статистики
  setStatsCacheTTL(ttlMs: number): void {
    this.statsCache.ttl = ttlMs;
    console.log(`⏱️ TTL кеша статистики учетных записей установлен: ${ttlMs}мс`);
  }

  /**
   * Получить список уникальных родительских аккаунтов с кешированием
   */
  async getParentAccounts(forceRefresh: boolean = false): Promise<string[]> {
    // Проверяем кеш, если не требуется принудительное обновление
    if (!forceRefresh && this.parentAccountsCache.data) {
      const now = Date.now();
      const age = now - this.parentAccountsCache.timestamp;

      if (age < this.parentAccountsCache.ttl) {
        console.log(`📦 Используем кешированные родительские аккаунты (возраст: ${Math.round(age / 1000)}с)`);
        return this.parentAccountsCache.data.map(account => account.parentAccountName).filter(Boolean);
      }
    }

    // Если запрос уже выполняется, возвращаем тот же Promise
    if (this.pendingParentAccountsRequest) {
      console.log("🔄 Запрос родительских аккаунтов уже выполняется, используем существующий Promise");
      const cached = await this.pendingParentAccountsRequest;
      return cached.map(account => account.parentAccountName).filter(Boolean);
    }

    // Создаем новый Promise для запроса
    this.pendingParentAccountsRequest = (async () => {
      try {
        // Загружаем все записи для извлечения уникальных родителей
        const response = await this.getAccounts({
          page: 1,
          per_page: 1000, // Загружаем большое количество для получения полного списка родителей
          ordering: "name",
        });

        // Обновляем кеш
        this.updateParentAccountsCache(response.results);

        return response.results;
      } catch (error) {
        console.error("❌ Ошибка получения родительских аккаунтов:", error);
        throw error;
      } finally {
        // Очищаем pending запрос после завершения
        this.pendingParentAccountsRequest = null;
      }
    })();

    const result = await this.pendingParentAccountsRequest;
    return result.map(account => account.parentAccountName).filter(Boolean);
  }

  // Обновление кеша родительских аккаунтов
  private updateParentAccountsCache(data: Account[]): void {
    this.parentAccountsCache = {
      data,
      timestamp: Date.now(),
      ttl: this.parentAccountsCache.ttl,
    };
  }

  // Очистка кеша родительских аккаунтов
  clearParentAccountsCache(): void {
    this.parentAccountsCache = {
      data: null,
      timestamp: 0,
      ttl: this.parentAccountsCache.ttl,
    };
    console.log("🗑️ Кеш родительских аккаунтов очищен");
  }

  // Установка времени жизни кеша родительских аккаунтов
  setParentAccountsCacheTTL(ttlMs: number): void {
    this.parentAccountsCache.ttl = ttlMs;
    console.log(`⏱️ TTL кеша родительских аккаунтов установлен: ${ttlMs}мс`);
  }

  /**
   * Переместить учетную запись к другому партнеру
   */
  async moveAccount(accountId: number, targetAccountId: number): Promise<void> {
    try {
      console.log(`🔄 Перемещение учетной записи ${accountId} к партнеру ${targetAccountId}`);

      const response = await this.axentaCloudClient.post<any>(
        `/api/cms/accounts/change_account/`,
        {
          accountId: accountId,
          targetAccountId: targetAccountId
        }
      );

      console.log("✅ Учетная запись успешно перемещена:", response);
    } catch (error) {
      console.error(`❌ Ошибка перемещения учетной записи ${accountId}:`, error);
      throw error;
    }
  }

  /**
   * Войти в CMS или мониторинг с токеном другого пользователя
   */
  async loginAs(userId: number, type: 'cms' | 'monitoring'): Promise<{ redirectUrl: string }> {
    try {
      console.log(`🔐 Вход в ${type} для пользователя ${userId}`);

      const response = await this.axentaCloudClient.post<any>(
        `/api/cms/users/login_as/`,
        {
          userId: userId,
          type: type
        }
      );

      console.log(`✅ Получен URL для входа в ${type}:`, response.data);

      if (!response.data.redirectUrl) {
        throw new Error('Не получен URL для перенаправления');
      }

      return {
        redirectUrl: response.data.redirectUrl
      };
    } catch (error) {
      console.error(`❌ Ошибка входа в ${type} для пользователя ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Экспорт учетных записей в Excel
   * POST /api/cms/accounts/excel/
   */
  async exportAccounts(filters: AccountsFilters = {}): Promise<Blob> {
    try {
      console.log("📤 Экспорт учетных записей в Excel:", filters);

      // Формируем данные для запроса
      const requestData: any = {};

      // Добавляем фильтры если они указаны
      if (filters.search) {
        requestData.search = filters.search;
      }
      if (filters.type) {
        requestData.type = filters.type;
      }
      if (filters.is_active !== undefined && filters.is_active !== null) {
        requestData.is_active = filters.is_active;
      }

      const response = await this.axentaCloudClient.post(
        "/api/cms/accounts/excel/",
        requestData,
        {
          responseType: "blob",
        }
      );

      console.log("✅ Excel файл получен, размер:", response.data.size, "байт");

      return response.data;
    } catch (error: any) {
      console.error("❌ Ошибка экспорта учетных записей в Excel:", error);
      throw error;
    }
  }
}

// Экспортируем singleton instance
export const accountsService = AccountsService.getInstance();
export default accountsService;
