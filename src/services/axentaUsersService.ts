// Сервис для работы с ролями пользователей Axenta

import { config } from "@/config/env";
import type {
  AxentaUsersResponse,
  AxentaUsersStats,
  AxentaUsersStatsResponse,
  LocalUserForm,
  SyncAxentaUserForm,
  UpdateAxentaRoleForm,
  UserWithRelations,
} from "@/types/users";
import axios from "axios";

export class AxentaUsersService {
  private static instance: AxentaUsersService;
  private useMockData = false; // Флаг для использования демо данных
  private apiClient = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 30000,
  });

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

      console.log("📡 AxentaUsersService request:", {
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
        console.error("❌ AxentaUsersService error:", {
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

  static getInstance(): AxentaUsersService {
    if (!AxentaUsersService.instance) {
      AxentaUsersService.instance = new AxentaUsersService();
    }
    return AxentaUsersService.instance;
  }

  // Метод для включения режима демо данных
  enableMockData(): void {
    this.useMockData = true;
    console.log("Режим демо данных включен для AxentaUsersService");
  }

  // Метод для отключения режима демо данных
  disableMockData(): void {
    this.useMockData = false;
    console.log("Режим демо данных отключен для AxentaUsersService");
  }

  // Проверка статуса режима демо данных
  isMockDataEnabled(): boolean {
    return this.useMockData;
  }

  // === ПОЛУЧЕНИЕ ПОЛЬЗОВАТЕЛЕЙ AXENTA ===

  // Получение пользователей по типу (partner, client, local, all)
  async getAxentaUsers(type: "partner" | "client" | "local" | "all" = "all"): Promise<AxentaUsersResponse> {
    if (this.useMockData) {
      return this.getMockAxentaUsers(type);
    }

    try {
      const response = await this.apiClient.get(`/auth/axenta-users?type=${type}`);
      return response.data;
    } catch (error: any) {
      console.error("❌ Ошибка загрузки пользователей Axenta:", error);
      return {
        status: "error",
        data: [],
        count: 0,
        type,
        error: error.response?.data?.error || error.message || "Ошибка загрузки пользователей Axenta",
      };
    }
  }

  // Получение статистики пользователей по типам Axenta
  async getAxentaUsersStats(): Promise<AxentaUsersStatsResponse> {
    if (this.useMockData) {
      return this.getMockAxentaUsersStats();
    }

    try {
      const response = await this.apiClient.get("/auth/axenta-users/stats");
      return response.data;
    } catch (error: any) {
      console.error("❌ Ошибка загрузки статистики пользователей Axenta:", error);
      return {
        status: "error",
        data: {
          partners: { count: 0, users: [] },
          clients: { count: 0, users: [] },
          local: { count: 0, users: [] },
          total: 0,
        },
        error: error.response?.data?.error || error.message || "Ошибка загрузки статистики",
      };
    }
  }

  // === СОЗДАНИЕ И УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ===

  // Проверка доступности имени пользователя
  async checkUsername(username: string): Promise<{
    status: string;
    data?: {
      available: boolean;
      message: string;
      source?: string;
    };
    error?: string;
  }> {
    if (this.useMockData) {
      // Мок-данные для тестирования
      return {
        status: "success",
        data: {
          available: username !== "admin" && username !== "test",
          message: username !== "admin" && username !== "test" 
            ? "Имя пользователя доступно" 
            : "Пользователь с таким именем уже существует",
          source: username === "admin" ? "crm" : undefined,
        },
      };
    }

    try {
      const response = await this.apiClient.post("/auth/local/users/check-username", {
        username,
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Ошибка проверки имени пользователя:", error);
      return {
        status: "error",
        error: error.response?.data?.error || error.message || "Ошибка проверки имени пользователя",
      };
    }
  }

  // Создание локального пользователя
  async createLocalUser(user: LocalUserForm): Promise<{
    status: string;
    data?: UserWithRelations;
    error?: string;
  }> {
    if (this.useMockData) {
      return this.getMockCreateLocalUser(user);
    }

    try {
      const response = await this.apiClient.post("/auth/axenta-users/local", user);
      return response.data;
    } catch (error: any) {
      console.error("❌ Ошибка создания локального пользователя:", error);
      return {
        status: "error",
        error: error.response?.data?.error || error.message || "Ошибка создания пользователя",
      };
    }
  }

  // Обновление роли Axenta пользователя
  async updateUserAxentaRole(userId: number, roleData: UpdateAxentaRoleForm): Promise<{
    status: string;
    data?: UserWithRelations;
    error?: string;
  }> {
    if (this.useMockData) {
      return this.getMockUpdateUserAxentaRole(userId, roleData);
    }

    try {
      const response = await this.apiClient.put(`/auth/axenta-users/${userId}/role`, roleData);
      return response.data;
    } catch (error: any) {
      console.error("❌ Ошибка обновления роли Axenta пользователя:", error);
      return {
        status: "error",
        error: error.response?.data?.error || error.message || "Ошибка обновления роли",
      };
    }
  }

  // Синхронизация пользователя с Axenta
  async syncUserWithAxenta(syncData: SyncAxentaUserForm): Promise<{
    status: string;
    data?: UserWithRelations;
    error?: string;
  }> {
    if (this.useMockData) {
      return this.getMockSyncUserWithAxenta(syncData);
    }

    try {
      const response = await this.apiClient.post("/auth/axenta-users/sync", syncData);
      return response.data;
    } catch (error: any) {
      console.error("❌ Ошибка синхронизации пользователя с Axenta:", error);
      return {
        status: "error",
        error: error.response?.data?.error || error.message || "Ошибка синхронизации",
      };
    }
  }

  // Создание ролей по умолчанию
  async ensureAxentaRoles(): Promise<{
    status: string;
    message?: string;
    error?: string;
  }> {
    if (this.useMockData) {
      return {
        status: "success",
        message: "Роли по умолчанию созданы (демо режим)",
      };
    }

    try {
      const response = await this.apiClient.post("/auth/axenta-users/ensure-roles");
      return response.data;
    } catch (error: any) {
      console.error("❌ Ошибка создания ролей по умолчанию:", error);
      return {
        status: "error",
        error: error.response?.data?.error || error.message || "Ошибка создания ролей",
      };
    }
  }

  // Синхронизация всех пользователей из Axenta
  async syncAllAxentaUsers(): Promise<{
    status: string;
    message?: string;
    data?: {
      total_users: number;
      synced_count: number;
      error_count: number;
      errors: string[];
    };
    error?: string;
  }> {
    if (this.useMockData) {
      return {
        status: "success",
        message: "Синхронизация завершена: 3 успешно, 0 ошибок (демо режим)",
        data: {
          total_users: 3,
          synced_count: 3,
          error_count: 0,
          errors: [],
        },
      };
    }

    try {
      const response = await this.apiClient.post("/auth/axenta-users/sync-all");
      return response.data;
    } catch (error: any) {
      console.error("❌ Ошибка синхронизации всех пользователей:", error);
      return {
        status: "error",
        error: error.response?.data?.error || error.message || "Ошибка синхронизации",
      };
    }
  }

  // Получение синхронизированных пользователей из локальной базы данных
  async getSyncedUsers(
    page = 1,
    limit = 20,
    filters: {
      axenta_type?: string;
      is_axenta_user?: boolean;
      search?: string;
    } = {}
  ): Promise<{
    status: string;
    data?: {
      items: UserWithRelations[];
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
    error?: string;
  }> {
    if (this.useMockData) {
      // Возвращаем mock данные синхронизированных пользователей
      const mockData = this.getMockAxentaUsers("all");
      return {
        status: "success",
        data: {
          items: mockData.data,
          total: mockData.count,
          page,
          limit,
          pages: Math.ceil(mockData.count / limit),
        },
      };
    }

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters.axenta_type) params.append("axenta_type", filters.axenta_type);
      if (filters.is_axenta_user !== undefined) {
        params.append("is_axenta_user", filters.is_axenta_user.toString());
      }
      if (filters.search) params.append("search", filters.search);

      const response = await this.apiClient.get(`/auth/users/synced?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error("❌ Ошибка загрузки синхронизированных пользователей:", error);
      return {
        status: "error",
        error: error.response?.data?.error || error.message || "Ошибка загрузки пользователей",
      };
    }
  }

  // === MOCK DATA METHODS ===

  private getMockAxentaUsers(type: string): AxentaUsersResponse {
    const mockUsers: UserWithRelations[] = [
      {
        id: 1,
        username: "partner_user1",
        email: "partner1@example.com",
        first_name: "Партнер",
        last_name: "Один",
        is_active: true,
        user_type: "partner",
        role_id: 1,
        login_count: 15,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-20T15:30:00Z",
        axenta_user_type: "partner",
        axenta_user_id: "123",
        is_axenta_user: true,
        external_source: "axenta",
        role: {
          id: 1,
          name: "partner",
          display_name: "Партнер",
          description: "Роль партнера из Axenta",
          color: "#2196F3",
          priority: 100,
          is_active: true,
          is_system: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      },
      {
        id: 2,
        username: "client_user1",
        email: "client1@example.com",
        first_name: "Клиент",
        last_name: "Первый",
        is_active: true,
        user_type: "client",
        role_id: 2,
        login_count: 8,
        created_at: "2024-01-16T11:00:00Z",
        updated_at: "2024-01-21T16:30:00Z",
        axenta_user_type: "client",
        axenta_user_id: "456",
        is_axenta_user: true,
        external_source: "axenta",
        role: {
          id: 2,
          name: "client",
          display_name: "Клиент",
          description: "Роль клиента из Axenta",
          color: "#4CAF50",
          priority: 50,
          is_active: true,
          is_system: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      },
      {
        id: 3,
        username: "local_user1",
        email: "local1@example.com",
        first_name: "Локальный",
        last_name: "Пользователь",
        is_active: true,
        user_type: "user",
        role_id: 3,
        login_count: 25,
        created_at: "2024-01-10T09:00:00Z",
        updated_at: "2024-01-22T14:15:00Z",
        axenta_user_type: "local",
        is_axenta_user: false,
        role: {
          id: 3,
          name: "user",
          display_name: "Пользователь",
          description: "Локальный пользователь системы",
          color: "#FF9800",
          priority: 25,
          is_active: true,
          is_system: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      },
    ];

    let filteredUsers = mockUsers;
    if (type !== "all") {
      if (type === "local") {
        filteredUsers = mockUsers.filter(u => !u.is_axenta_user || u.axenta_user_type === "local");
      } else {
        filteredUsers = mockUsers.filter(u => u.axenta_user_type === type);
      }
    }

    return {
      status: "success",
      data: filteredUsers,
      count: filteredUsers.length,
      type,
    };
  }

  private getMockAxentaUsersStats(): AxentaUsersStatsResponse {
    const mockData = this.getMockAxentaUsers("all");
    const users = mockData.data;

    const partners = users.filter(u => u.axenta_user_type === "partner");
    const clients = users.filter(u => u.axenta_user_type === "client");
    const local = users.filter(u => !u.is_axenta_user || u.axenta_user_type === "local");

    return {
      status: "success",
      data: {
        partners: { count: partners.length, users: partners },
        clients: { count: clients.length, users: clients },
        local: { count: local.length, users: local },
        total: users.length,
      },
    };
  }

  private getMockCreateLocalUser(user: LocalUserForm): Promise<{
    status: string;
    data?: UserWithRelations;
    error?: string;
  }> {
    return Promise.resolve({
      status: "success",
      data: {
        id: Date.now(),
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        is_active: true,
        user_type: "user",
        role_id: user.role_id,
        login_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        axenta_user_type: "local",
        is_axenta_user: false,
        role: {
          id: user.role_id,
          name: "user",
          display_name: "Пользователь",
          description: "Локальный пользователь системы",
          color: "#FF9800",
          priority: 25,
          is_active: true,
          is_system: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      },
    });
  }

  private getMockUpdateUserAxentaRole(userId: number, roleData: UpdateAxentaRoleForm): Promise<{
    status: string;
    data?: UserWithRelations;
    error?: string;
  }> {
    return Promise.resolve({
      status: "success",
      data: {
        id: userId,
        username: `user_${userId}`,
        email: `user${userId}@example.com`,
        first_name: "Обновленный",
        last_name: "Пользователь",
        is_active: true,
        user_type: roleData.axenta_user_type === "local" ? "user" : roleData.axenta_user_type,
        role_id: 1,
        login_count: 5,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: new Date().toISOString(),
        axenta_user_type: roleData.axenta_user_type,
        axenta_user_id: roleData.axenta_user_id,
        is_axenta_user: roleData.is_axenta_user,
        external_source: roleData.is_axenta_user ? "axenta" : undefined,
      },
    });
  }

  private getMockSyncUserWithAxenta(syncData: SyncAxentaUserForm): Promise<{
    status: string;
    data?: UserWithRelations;
    error?: string;
  }> {
    return Promise.resolve({
      status: "success",
      data: {
        id: Date.now(),
        username: syncData.username,
        email: `${syncData.username}@axenta.example.com`,
        first_name: "Синхронизированный",
        last_name: "Пользователь",
        is_active: true,
        user_type: "partner",
        role_id: 1,
        login_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        axenta_user_type: "partner",
        axenta_user_id: "sync_" + Date.now(),
        is_axenta_user: true,
        external_source: "axenta",
        role: {
          id: 1,
          name: "partner",
          display_name: "Партнер",
          description: "Роль партнера из Axenta",
          color: "#2196F3",
          priority: 100,
          is_active: true,
          is_system: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      },
    });
  }
}

// Экспортируем singleton instance
export const axentaUsersService = AxentaUsersService.getInstance();
export default axentaUsersService;
