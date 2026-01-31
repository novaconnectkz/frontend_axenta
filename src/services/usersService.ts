// Сервис для работы с пользователями

import { config } from "@/config/env";
import type {
    Permission,
    Role,
    UserFilters,
    UserForm,
    UsersResponse,
    UserStats,
    UserTemplate,
    UserWithRelations,
} from "@/types/users";
import axios from "axios";
import {
    mockRoles,
    mockTemplates
} from "./mockUsersData";

export class UsersService {
  private static instance: UsersService;
  private useMockData = false; // Флаг для использования демо данных
  private apiClient = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 30000,
  });

  // Кеширование статистики пользователей
  private statsCache: {
    data: UserStats | null;
    timestamp: number;
    ttl: number; // Время жизни кеша в миллисекундах (10 секунд)
  } = {
    data: null,
    timestamp: 0,
    ttl: 10000, // 10 секунд
  };

  // Дедупликация запросов статистики
  private pendingStatsRequest: Promise<UserStats> | null = null;

  // Кеширование ролей
  private rolesCache: {
    data: Role[] | null;
    timestamp: number;
    ttl: number; // Время жизни кеша в миллисекундах (5 минут)
  } = {
    data: null,
    timestamp: 0,
    ttl: 300000, // 5 минут
  };

  // Дедупликация запросов ролей
  private pendingRolesRequest: Promise<Role[]> | null = null;

  // Кеширование шаблонов пользователей
  private templatesCache: {
    data: UserTemplate[] | null;
    timestamp: number;
    ttl: number; // Время жизни кеша в миллисекундах (5 минут)
  } = {
    data: null,
    timestamp: 0,
    ttl: 300000, // 5 минут
  };

  // Дедупликация запросов шаблонов
  private pendingTemplatesRequest: Promise<UserTemplate[]> | null = null;

  constructor() {
    // Настраиваем interceptors для токена
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem("axenta_token");
      const company = localStorage.getItem("axenta_company");

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

      console.log("📡 UsersService request:", {
        url: config.url,
        method: config.method,
        hasToken: !!token,
        tenantId: config.headers["X-Tenant-ID"] || "none",
      });

      return config;
    });

    // Добавляем обработчик ошибок
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("❌ UsersService error:", {
          url: error.config?.url,
          status: error.response?.status,
          message: error.response?.data?.error || error.message,
        });

        // Если получили 401, автоматически переключаемся на mock данные
        if (error.response?.status === 401) {
          console.warn("🔄 Switching to mock data due to authentication error");
          this.enableMockData();
        }

        return Promise.reject(error);
      }
    );
  }

  static getInstance(): UsersService {
    if (!UsersService.instance) {
      UsersService.instance = new UsersService();
    }
    return UsersService.instance;
  }

  // Метод для включения режима демо данных
  enableMockData(): void {
    this.useMockData = true;
    console.log("Режим демо данных включен для UsersService");
  }

  // Метод для отключения режима демо данных
  disableMockData(): void {
    this.useMockData = false;
    console.log("Режим демо данных отключен для UsersService");
  }

  // Проверка статуса режима демо данных
  isMockDataEnabled(): boolean {
    return this.useMockData;
  }

  // === ПОЛЬЗОВАТЕЛИ ===

  // Получение списка пользователей с фильтрацией
  async getUsers(
    page = 1,
    limit = 20,
    filters: UserFilters = {}
  ): Promise<UsersResponse> {

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Добавляем фильтры
      if (filters.search) params.append("search", filters.search);
      if (filters.role) params.append("role", filters.role);
      if (filters.active !== undefined)
        params.append("active", filters.active.toString());
      if (filters.user_type) params.append("user_type", filters.user_type);
      if (filters.external_source)
        params.append("external_source", filters.external_source);
      if (filters.template_id)
        params.append("template_id", filters.template_id.toString());
      if (filters.ordering) params.append("ordering", filters.ordering);

      const url = `/auth/users?${params.toString()}`;
      console.log('📡 Users API URL:', url);
      console.log('📊 Users API параметры:', Object.fromEntries(params.entries()));
      console.log('🎭 Фильтр роли:', filters.role, 'тип:', typeof filters.role);
      
      const response = await this.apiClient.get(url);
      console.log('📡 Users API response status:', response.status);
      return response.data;
    } catch (error: any) {
      console.error("❌ Ошибка загрузки пользователей с Axenta API:", error);
      
      // Возвращаем ошибку вместо переключения на mock данные
      return {
        status: "error",
        data: {
          items: [],
          total: 0,
          page,
          limit,
          pages: 0,
        },
        error: error.response?.data?.error || error.message || "Ошибка загрузки пользователей",
      };
    }
  }

  // Получение унифицированного списка пользователей (Axenta + Wialon)
  async getUnifiedUsers(
    page = 1,
    limit = 20,
    filters: UserFilters & { source?: string | null } = {}
  ): Promise<{
    status: string;
    data: {
      items: UserWithRelations[];
      total: number;
      page: number;
      per_page: number;
      total_pages: number;
      stats: {
        axenta_total: number;
        axenta_active: number;
        wialon_total: number;
        wialon_active: number;
      };
    };
    error?: string;
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Добавляем фильтры
      if (filters.search) params.append("search", filters.search);
      if (filters.role) params.append("role", filters.role);
      if (filters.active !== undefined) params.append("active", filters.active.toString());
      if (filters.source) params.append("source", filters.source);
      if (filters.ordering) params.append("ordering", filters.ordering);

      const url = `/auth/unified/users?${params.toString()}`;
      console.log('📡 Unified Users API URL:', url);
      
      const response = await this.apiClient.get(url);
      console.log('📡 Unified Users API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Ошибка загрузки унифицированного списка пользователей:", error);
      
      return {
        status: "error",
        data: {
          items: [],
          total: 0,
          page,
          per_page: limit,
          total_pages: 0,
          stats: {
            axenta_total: 0,
            axenta_active: 0,
            wialon_total: 0,
            wialon_active: 0,
          },
        },
        error: error.response?.data?.error || error.message || "Ошибка загрузки пользователей",
      };
    }
  }

  // Получение одного пользователя
  async getUser(
    id: number
  ): Promise<{ status: string; data: UserWithRelations; error?: string }> {
    const response = await this.apiClient.get(`/auth/users/${id}`);
    return response.data;
  }

  // Создание пользователя
  async createUser(
    user: UserForm
  ): Promise<{ status: string; data: UserWithRelations; error?: string }> {
    const response = await this.apiClient.post("/auth/users", user);
    return response.data;
  }

  // Обновление пользователя
  async updateUser(
    id: number,
    user: Partial<UserForm>
  ): Promise<{ status: string; data: UserWithRelations; error?: string }> {
    const response = await this.apiClient.put(`/auth/users/${id}`, user);
    return response.data;
  }

  // Удаление пользователя (мягкое)
  async deleteUser(
    id: number
  ): Promise<{ status: string; message: string; error?: string }> {
    const response = await this.apiClient.delete(`/auth/users/${id}`);
    return response.data;
  }

  // Деактивация пользователя
  async deactivateUser(id: number): Promise<void> {
    try {
      console.log(`🔄 Деактивация пользователя ${id}`);
      
      const response = await this.apiClient.post(`/cms/users/${id}/activate/`, {
        state: false
      });
      
      console.log(`✅ Пользователь ${id} деактивирован:`, response.data);
      
      if (response.status !== 201) {
        throw new Error('Ошибка деактивации пользователя');
      }
    } catch (error: any) {
      console.error(`❌ Ошибка деактивации пользователя ${id}:`, error);
      throw error;
    }
  }

  // Активация пользователя
  async activateUser(id: number): Promise<void> {
    try {
      console.log(`🔄 Активация пользователя ${id}`);
      
      const response = await this.apiClient.post(`/cms/users/${id}/activate/`, {
        state: true
      });
      
      console.log(`✅ Пользователь ${id} активирован:`, response.data);
      
      if (response.status !== 201) {
        throw new Error('Ошибка активации пользователя');
      }
    } catch (error: any) {
      console.error(`❌ Ошибка активации пользователя ${id}:`, error);
      throw error;
    }
  }

  // Переключить статус пользователя (активация/деактивация)
  async toggleUserStatus(id: number, isActive: boolean): Promise<void> {
    if (isActive) {
      await this.activateUser(id);
    } else {
      await this.deactivateUser(id);
    }
  }

  // Массовая деактивация пользователей
  async deactivateUsers(userIds: number[]): Promise<{
    status: string;
    message: string;
    updated: number;
    error?: string;
  }> {
    const response = await this.apiClient.post("/auth/users/bulk-deactivate", {
      user_ids: userIds,
    });
    return response.data;
  }

  // Массовое удаление пользователей
  async deleteUsers(userIds: number[]): Promise<{
    status: string;
    message: string;
    deleted: number;
    error?: string;
  }> {
    // Если включен режим демо данных, возвращаем mock ответ
    if (this.useMockData) {
      console.log('Mock bulk delete for users:', userIds);
      return {
        status: "success",
        message: "Users deleted successfully (demo mode)",
        deleted: userIds.length,
      };
    }

    try {
      const response = await this.apiClient.post("/auth/users/bulk-delete", {
        user_ids: userIds,
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Ошибка массового удаления пользователей:", error);
      return {
        status: "error",
        message: error.response?.data?.error || error.message || "Ошибка удаления пользователей",
        deleted: 0,
      };
    }
  }

  // Сброс пароля пользователя
  async resetUserPassword(
    id: number,
    newPassword: string
  ): Promise<{ status: string; message: string; error?: string }> {
    const response = await this.apiClient.post(`/auth/users/${id}/reset-password`, {
      password: newPassword,
    });
    return response.data;
  }

  // Смена пароля пользователя администратором
  async updateUserPassword(
    userId: number,
    newPassword: string,
    confirmNewPassword: string
  ): Promise<{ status: string; message: string; error?: string }> {
    try {
      const response = await this.apiClient.post("/auth/cms/update_user_password/", {
        userId,
        newPassword,
        confirmNewPassword,
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Ошибка смены пароля пользователя:", error);
      return {
        status: "error",
        message: error.response?.data?.error || error.message || "Ошибка смены пароля",
      };
    }
  }

  // Отправка ссылки сброса пароля на email
  async sendPasswordResetEmail(
    email: string,
    username: string
  ): Promise<{ status: string; message?: string; passwordToken?: string; error?: string }> {
    // Если включен режим демо данных, возвращаем mock ответ
    if (this.useMockData) {
      console.log('Mock password reset email for:', { email, username });
      return {
        status: "success",
        message: "Ссылка для сброса пароля отправлена на email (демо режим)",
        passwordToken: "demo_token_" + Date.now(),
      };
    }

    try {
      const response = await this.apiClient.post("/cms/password_reset/", {
        email,
        username,
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Ошибка отправки ссылки сброса пароля:", error);
      return {
        status: "error",
        message: error.response?.data?.error || error.message || "Ошибка отправки ссылки сброса пароля",
        passwordToken: null,
      };
    }
  }

  // === РОЛИ ===

  // Получение списка ролей
  async getRoles(
    page = 1,
    limit = 100,
    filters: { search?: string; active_only?: boolean } = {},
    forceRefresh: boolean = false
  ): Promise<{
    status: string;
    data: {
      items: Role[];
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
    error?: string;
  }> {
    // Кешируем только для стандартного запроса (active_only: true, без поиска, первая страница)
    const isStandardRequest = page === 1 && limit === 100 && filters.active_only === true && !filters.search;
    
    if (isStandardRequest && !forceRefresh && this.rolesCache.data) {
      const now = Date.now();
      const age = now - this.rolesCache.timestamp;
      
      if (age < this.rolesCache.ttl) {
        console.log(`📦 Используем кешированные роли (возраст: ${Math.round(age / 1000)}с)`);
        return {
          status: "success",
          data: {
            items: this.rolesCache.data,
            total: this.rolesCache.data.length,
            page: 1,
            limit: 100,
            pages: 1,
          },
        };
      }
    }

    // Если запрос уже выполняется для стандартного запроса, возвращаем тот же Promise
    if (isStandardRequest && this.pendingRolesRequest) {
      console.log("🔄 Запрос ролей уже выполняется, используем существующий Promise");
      const cached = await this.pendingRolesRequest;
      return {
        status: "success",
        data: {
          items: cached,
          total: cached.length,
          page: 1,
          limit: 100,
          pages: 1,
        },
      };
    }

    // Если включен режим демо данных, возвращаем mock роли
    if (this.useMockData) {
      let filteredRoles = [...mockRoles];

      if (filters.active_only) {
        filteredRoles = filteredRoles.filter((role) => role.is_active);
      }

      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredRoles = filteredRoles.filter(
          (role) =>
            role.name.toLowerCase().includes(search) ||
            role.display_name.toLowerCase().includes(search)
        );
      }

      const result = {
        status: "success" as const,
        data: {
          items: filteredRoles,
          total: filteredRoles.length,
          page,
          limit,
          pages: Math.ceil(filteredRoles.length / limit),
        },
      };

      // Кешируем mock данные для стандартного запроса
      if (isStandardRequest) {
        this.updateRolesCache(filteredRoles);
      }

      return result;
    }

    // Создаем Promise для стандартного запроса
    const requestPromise = (async () => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (filters.search) params.append("search", filters.search);
        if (filters.active_only !== undefined) {
          params.append("active_only", filters.active_only.toString());
        }

        const response = await this.apiClient.get(`/public/roles?${params.toString()}`);
        const result = response.data;

        // Кешируем для стандартного запроса
        if (isStandardRequest && result.status === "success") {
          this.updateRolesCache(result.data.items);
        }

        return result;
      } catch (error: any) {
        console.error("❌ Ошибка загрузки ролей с Axenta API:", error);
        
        // Возвращаем роли по умолчанию в случае ошибки
        const defaultRoles = [
          {
          id: 1,
          name: "partner",
          display_name: "Партнер",
          description: "Роль партнера из Axenta",
          color: "#2196F3",
          priority: 100,
          is_active: true,
          is_system: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: "client",
          display_name: "Клиент",
          description: "Роль клиента из Axenta",
          color: "#4CAF50",
          priority: 50,
          is_active: true,
          is_system: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 3,
          name: "user",
          display_name: "Пользователь",
          description: "Локальный пользователь системы",
          color: "#FF9800",
          priority: 25,
          is_active: true,
          is_system: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

        console.log("🔄 Используем роли по умолчанию из-за ошибки API");
        
        const errorResult = {
          status: "success" as const, // Возвращаем success с fallback данными
          data: {
            items: defaultRoles,
            total: defaultRoles.length,
            page,
            limit,
            pages: 1,
          },
        };

        // Кешируем fallback данные для стандартного запроса
        if (isStandardRequest) {
          this.updateRolesCache(defaultRoles);
        }

        return errorResult;
      } finally {
        // Очищаем pending запрос после завершения (только для стандартного запроса)
        if (isStandardRequest) {
          this.pendingRolesRequest = null;
        }
      }
    })();

    // Сохраняем Promise для стандартного запроса
    if (isStandardRequest) {
      this.pendingRolesRequest = requestPromise.then(result => result.data.items);
    }

    return requestPromise;
  }

  // Обновление кеша ролей
  private updateRolesCache(data: Role[]): void {
    this.rolesCache = {
      data,
      timestamp: Date.now(),
      ttl: this.rolesCache.ttl,
    };
  }

  // Очистка кеша ролей
  clearRolesCache(): void {
    this.rolesCache = {
      data: null,
      timestamp: 0,
      ttl: this.rolesCache.ttl,
    };
    console.log("🗑️ Кеш ролей очищен");
  }

  // Установка времени жизни кеша ролей
  setRolesCacheTTL(ttlMs: number): void {
    this.rolesCache.ttl = ttlMs;
    console.log(`⏱️ TTL кеша ролей установлен: ${ttlMs}мс`);
  }

  // Получение одной роли
  async getRole(
    id: number
  ): Promise<{ status: string; data: Role; error?: string }> {
    const response = await this.apiClient.get(`/auth/roles/${id}`);
    return response.data;
  }

  // Создание роли
  async createRole(
    role: Omit<Role, "id" | "created_at" | "updated_at" | "permissions">
  ): Promise<{ status: string; data: Role; error?: string }> {
    const response = await this.apiClient.post("/auth/roles", role);
    return response.data;
  }

  // Обновление роли
  async updateRole(
    id: number,
    role: Partial<Role>
  ): Promise<{ status: string; data: Role; error?: string }> {
    const response = await this.apiClient.put(`/auth/roles/${id}`, role);
    return response.data;
  }

  // Удаление роли
  async deleteRole(
    id: number
  ): Promise<{ status: string; message: string; error?: string }> {
    const response = await this.apiClient.delete(`/auth/roles/${id}`);
    return response.data;
  }

  // Получение разрешений роли
  async getRolePermissions(
    id: number
  ): Promise<{ status: string; data: Permission[]; error?: string }> {
    const response = await this.apiClient.get(`/auth/roles/${id}/permissions`);
    return response.data;
  }

  // Обновление разрешений роли
  async updateRolePermissions(
    id: number,
    permissionIds: number[]
  ): Promise<{ status: string; data: Permission[]; error?: string }> {
    const response = await this.apiClient.put(`/auth/roles/${id}/permissions`, {
      permission_ids: permissionIds,
    });
    return response.data;
  }

  // === РАЗРЕШЕНИЯ ===

  // Получение списка разрешений
  async getPermissions(
    page = 1,
    limit = 100,
    filters: { category?: string; resource?: string; search?: string } = {}
  ): Promise<{
    status: string;
    data: {
      items: Permission[];
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
    error?: string;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters.category) params.append("category", filters.category);
    if (filters.resource) params.append("resource", filters.resource);
    if (filters.search) params.append("search", filters.search);

    const response = await this.apiClient.get(
      `/auth/permissions?${params.toString()}`
    );
    return response.data;
  }

  // === ШАБЛОНЫ ПОЛЬЗОВАТЕЛЕЙ ===

  // Получение списка шаблонов пользователей
  async getUserTemplates(
    page = 1,
    limit = 100,
    filters: { search?: string; active_only?: boolean } = {},
    forceRefresh: boolean = false
  ): Promise<{
    status: string;
    data: {
      items: UserTemplate[];
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
    error?: string;
  }> {
    // Кешируем только для стандартного запроса (active_only: true, без поиска, первая страница)
    const isStandardRequest = page === 1 && limit === 100 && filters.active_only === true && !filters.search;
    
    if (isStandardRequest && !forceRefresh && this.templatesCache.data) {
      const now = Date.now();
      const age = now - this.templatesCache.timestamp;
      
      if (age < this.templatesCache.ttl) {
        console.log(`📦 Используем кешированные шаблоны пользователей (возраст: ${Math.round(age / 1000)}с)`);
        return {
          status: "success",
          data: {
            items: this.templatesCache.data,
            total: this.templatesCache.data.length,
            page: 1,
            limit: 100,
            pages: 1,
          },
        };
      }
    }

    // Если запрос уже выполняется для стандартного запроса, возвращаем тот же Promise
    if (isStandardRequest && this.pendingTemplatesRequest) {
      console.log("🔄 Запрос шаблонов пользователей уже выполняется, используем существующий Promise");
      const cached = await this.pendingTemplatesRequest;
      return {
        status: "success",
        data: {
          items: cached,
          total: cached.length,
          page: 1,
          limit: 100,
          pages: 1,
        },
      };
    }

    // Если включен режим демо данных, возвращаем mock шаблоны
    if (this.useMockData) {
      let filteredTemplates = [...mockTemplates];

      if (filters.active_only) {
        filteredTemplates = filteredTemplates.filter(
          (template) => template.is_active
        );
      }

      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredTemplates = filteredTemplates.filter(
          (template) =>
            template.name.toLowerCase().includes(search) ||
            (template.description &&
              template.description.toLowerCase().includes(search))
        );
      }

      const result = {
        status: "success" as const,
        data: {
          items: filteredTemplates,
          total: filteredTemplates.length,
          page,
          limit,
          pages: Math.ceil(filteredTemplates.length / limit),
        },
      };

      // Кешируем mock данные для стандартного запроса
      if (isStandardRequest) {
        this.updateTemplatesCache(filteredTemplates);
      }

      return result;
    }

    // Создаем Promise для стандартного запроса
    const requestPromise = (async () => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (filters.search) params.append("search", filters.search);
        if (filters.active_only !== undefined) {
          params.append("active_only", filters.active_only.toString());
        }

        const response = await this.apiClient.get(
          `/public/user-templates?${params.toString()}`
        );
        const result = response.data;

        // Кешируем для стандартного запроса
        if (isStandardRequest && result.status === "success") {
          this.updateTemplatesCache(result.data.items);
        }

        return result;
      } catch (error: any) {
        console.error("❌ Ошибка загрузки шаблонов пользователей с Axenta API:", error);
        const errorResult = {
          status: "error" as const,
          data: {
            items: [] as UserTemplate[],
            total: 0,
            page,
            limit,
            pages: 0,
          },
          error: error.response?.data?.error || error.message || "Ошибка загрузки шаблонов",
        };

        // Кешируем пустой результат для стандартного запроса (чтобы не делать повторные запросы при ошибке)
        if (isStandardRequest) {
          this.updateTemplatesCache([]);
        }

        return errorResult;
      } finally {
        // Очищаем pending запрос после завершения (только для стандартного запроса)
        if (isStandardRequest) {
          this.pendingTemplatesRequest = null;
        }
      }
    })();

    // Сохраняем Promise для стандартного запроса
    if (isStandardRequest) {
      this.pendingTemplatesRequest = requestPromise.then(result => 
        result.status === "success" ? result.data.items : []
      );
    }

    return requestPromise;
  }

  // Обновление кеша шаблонов
  private updateTemplatesCache(data: UserTemplate[]): void {
    this.templatesCache = {
      data,
      timestamp: Date.now(),
      ttl: this.templatesCache.ttl,
    };
  }

  // Очистка кеша шаблонов
  clearTemplatesCache(): void {
    this.templatesCache = {
      data: null,
      timestamp: 0,
      ttl: this.templatesCache.ttl,
    };
    console.log("🗑️ Кеш шаблонов пользователей очищен");
  }

  // Установка времени жизни кеша шаблонов
  setTemplatesCacheTTL(ttlMs: number): void {
    this.templatesCache.ttl = ttlMs;
    console.log(`⏱️ TTL кеша шаблонов пользователей установлен: ${ttlMs}мс`);
  }

  // Получение одного шаблона
  async getUserTemplate(
    id: number
  ): Promise<{ status: string; data: UserTemplate; error?: string }> {
    const response = await this.apiClient.get(`/auth/user-templates/${id}`);
    return response.data;
  }

  // Создание шаблона пользователя
  async createUserTemplate(
    template: Omit<
      UserTemplate,
      "id" | "created_at" | "updated_at" | "usage_count" | "role"
    >
  ): Promise<{ status: string; data: UserTemplate; error?: string }> {
    const response = await this.apiClient.post("/auth/user-templates", template);
    return response.data;
  }

  // Обновление шаблона пользователя
  async updateUserTemplate(
    id: number,
    template: Partial<UserTemplate>
  ): Promise<{ status: string; data: UserTemplate; error?: string }> {
    const response = await this.apiClient.put(
      `/auth/user-templates/${id}`,
      template
    );
    return response.data;
  }

  // Удаление шаблона пользователя
  async deleteUserTemplate(
    id: number
  ): Promise<{ status: string; message: string; error?: string }> {
    const response = await this.apiClient.delete(`/auth/user-templates/${id}`);
    return response.data;
  }

  // === СТАТИСТИКА ===

  // Получение статистики пользователей
  async getUsersStats(forceRefresh: boolean = false): Promise<UserStats> {
    // Проверяем кеш, если не требуется принудительное обновление
    if (!forceRefresh && this.statsCache.data) {
      const now = Date.now();
      const age = now - this.statsCache.timestamp;
      
      if (age < this.statsCache.ttl) {
        console.log(`📦 Используем кешированную статистику пользователей (возраст: ${Math.round(age / 1000)}с)`);
        return this.statsCache.data;
      }
    }

    // Если запрос уже выполняется, возвращаем тот же Promise
    if (this.pendingStatsRequest) {
      console.log("🔄 Запрос статистики пользователей уже выполняется, используем существующий Promise");
      return this.pendingStatsRequest;
    }

    // Создаем новый Promise для запроса
    this.pendingStatsRequest = (async () => {
      try {
        console.log("📊 Загрузка статистики пользователей из API...");
        const response = await this.apiClient.get("/auth/users/stats");
        
        if (response.data.status === "success") {
          const stats = response.data.data;
          console.log("📊 Получена статистика пользователей:", stats);
          
          // Преобразуем данные в нужный формат
          const userStats: UserStats = {
            total: stats.total || stats.total_users || 0,
            active: stats.active || stats.active_users || 0,
            inactive: stats.inactive || stats.inactive_users || 0,
            admins: stats.admins || 0,
            regular_users: stats.regular_users || 0,
            active_users: stats.active_users || stats.active || 0,
            inactive_users: stats.inactive_users || stats.inactive || 0,
            total_users: stats.total_users || stats.total || 0,
            recent_users: stats.recent_users || 0,
            recent_logins: stats.recent_logins || 0,
            by_role: stats.by_role || {},
            by_type: stats.by_type || {},
            role_stats: stats.role_stats || [],
            last_updated: stats.last_updated
          };
          
          // Обновляем кеш
          this.updateStatsCache(userStats);
          
          return userStats;
        } else {
          throw new Error(response.data.error || "Неизвестная ошибка API");
        }
      } catch (error: any) {
        console.error("❌ Ошибка загрузки статистики пользователей:", error);
        
        // Если включен режим демо данных, возвращаем mock статистику
        if (this.useMockData) {
          console.log("🔄 Используем демо данные для статистики пользователей");
          const mockStats: UserStats = {
            total: 28,
            active: 25,
            inactive: 3,
            admins: 4,
            regular_users: 24,
            active_users: 25,
            inactive_users: 3,
            total_users: 28,
            recent_users: 5,
            recent_logins: 12,
            by_role: {
              "Администратор": 4,
            "Пользователь": 20,
            "Клиент": 4
          },
          by_type: {
            "active": 25,
            "inactive": 3,
            "admin": 4,
            "regular": 24
          },
          role_stats: [
            { role_name: "Администратор", count: 4 },
            { role_name: "Пользователь", count: 20 },
            { role_name: "Клиент", count: 4 }
          ],
          last_updated: new Date().toISOString()
        };
        
        // Обновляем кеш для mock данных
        this.updateStatsCache(mockStats);
        return mockStats;
      }
      
      // Возвращаем пустую статистику при ошибке
      const emptyStats: UserStats = {
        total: 0,
        active: 0,
        inactive: 0,
        admins: 0,
        regular_users: 0,
        active_users: 0,
        inactive_users: 0,
        total_users: 0,
        recent_users: 0,
        recent_logins: 0,
        by_role: {},
        by_type: {},
        role_stats: []
      };
      
      // Обновляем кеш для пустой статистики
      this.updateStatsCache(emptyStats);
      return emptyStats;
    } finally {
      // Очищаем pending запрос после завершения
      this.pendingStatsRequest = null;
    }
    })();

    return this.pendingStatsRequest;
  }

  // Обновление кеша статистики
  private updateStatsCache(data: UserStats): void {
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
    console.log("🗑️ Кеш статистики пользователей очищен");
  }

  // Установка времени жизни кеша статистики
  setStatsCacheTTL(ttlMs: number): void {
    this.statsCache.ttl = ttlMs;
    console.log(`⏱️ TTL кеша статистики пользователей установлен: ${ttlMs}мс`);
  }

  // === ЭКСПОРТ ===

  // Экспорт пользователей
  async exportUsers(
    format: "csv" | "excel" | "json",
    filters: UserFilters = {}
  ): Promise<Blob> {
    const params = new URLSearchParams({ format });

    // Добавляем фильтры
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await this.apiClient.get(
      `/auth/users/export?${params.toString()}`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  }
}

// Экспортируем singleton instance
export const usersService = UsersService.getInstance();
export default usersService;
