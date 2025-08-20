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
import { getMockUsersData, mockRoles, mockStats, mockTemplates } from "./mockUsersData";
import axios from "axios";

export class UsersService {
  private static instance: UsersService;
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
    console.log('Режим демо данных включен для UsersService');
  }

  // Метод для отключения режима демо данных
  disableMockData(): void {
    this.useMockData = false;
    console.log('Режим демо данных отключен для UsersService');
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
    // Если включен режим демо данных, возвращаем mock данные
    if (this.useMockData) {
      const mockData = getMockUsersData(page, limit, filters);
      return {
        status: "success",
        data: mockData
      };
    }

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

      const response = await this.apiClient.get(`/users?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.warn('Ошибка загрузки пользователей с сервера, переключаемся на демо данные:', error);
      // Включаем режим демо данных при ошибке
      this.useMockData = true;
      const mockData = getMockUsersData(page, limit, filters);
      return {
        status: "success",
        data: mockData
      };
    }
  }

  // Получение одного пользователя
  async getUser(
    id: number
  ): Promise<{ status: string; data: UserWithRelations; error?: string }> {
    const response = await this.apiClient.get(`/users/${id}`);
    return response.data;
  }

  // Создание пользователя
  async createUser(
    user: UserForm
  ): Promise<{ status: string; data: UserWithRelations; error?: string }> {
    const response = await this.apiClient.post("/users", user);
    return response.data;
  }

  // Обновление пользователя
  async updateUser(
    id: number,
    user: Partial<UserForm>
  ): Promise<{ status: string; data: UserWithRelations; error?: string }> {
    const response = await this.apiClient.put(`/users/${id}`, user);
    return response.data;
  }

  // Удаление пользователя (мягкое)
  async deleteUser(
    id: number
  ): Promise<{ status: string; message: string; error?: string }> {
    const response = await this.apiClient.delete(`/users/${id}`);
    return response.data;
  }

  // Деактивация пользователя
  async deactivateUser(
    id: number
  ): Promise<{ status: string; data: UserWithRelations; error?: string }> {
    return this.updateUser(id, { is_active: false });
  }

  // Активация пользователя
  async activateUser(
    id: number
  ): Promise<{ status: string; data: UserWithRelations; error?: string }> {
    return this.updateUser(id, { is_active: true });
  }

  // Массовая деактивация пользователей
  async deactivateUsers(userIds: number[]): Promise<{
    status: string;
    message: string;
    updated: number;
    error?: string;
  }> {
    const response = await this.apiClient.post("/users/bulk-deactivate", {
      user_ids: userIds,
    });
    return response.data;
  }

  // Сброс пароля пользователя
  async resetUserPassword(
    id: number,
    newPassword: string
  ): Promise<{ status: string; message: string; error?: string }> {
    const response = await this.apiClient.post(`/users/${id}/reset-password`, {
      password: newPassword,
    });
    return response.data;
  }

  // === РОЛИ ===

  // Получение списка ролей
  async getRoles(
    page = 1,
    limit = 100,
    filters: { search?: string; active_only?: boolean } = {}
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
    // Если включен режим демо данных, возвращаем mock роли
    if (this.useMockData) {
      let filteredRoles = [...mockRoles];
      
      if (filters.active_only) {
        filteredRoles = filteredRoles.filter(role => role.is_active);
      }
      
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredRoles = filteredRoles.filter(role => 
          role.name.toLowerCase().includes(search) ||
          role.display_name.toLowerCase().includes(search)
        );
      }

      return {
        status: "success",
        data: {
          items: filteredRoles,
          total: filteredRoles.length,
          page,
          limit,
          pages: Math.ceil(filteredRoles.length / limit)
        }
      };
    }

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters.search) params.append("search", filters.search);
      if (filters.active_only !== undefined) {
        params.append("active_only", filters.active_only.toString());
      }

      const response = await this.apiClient.get(`/roles?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.warn('Ошибка загрузки ролей с сервера, переключаемся на демо данные:', error);
      // Включаем режим демо данных при ошибке
      this.useMockData = true;
      
      let filteredRoles = [...mockRoles];
      
      if (filters.active_only) {
        filteredRoles = filteredRoles.filter(role => role.is_active);
      }
      
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredRoles = filteredRoles.filter(role => 
          role.name.toLowerCase().includes(search) ||
          role.display_name.toLowerCase().includes(search)
        );
      }

      return {
        status: "success",
        data: {
          items: filteredRoles,
          total: filteredRoles.length,
          page,
          limit,
          pages: Math.ceil(filteredRoles.length / limit)
        }
      };
    }
  }

  // Получение одной роли
  async getRole(
    id: number
  ): Promise<{ status: string; data: Role; error?: string }> {
    const response = await this.apiClient.get(`/roles/${id}`);
    return response.data;
  }

  // Создание роли
  async createRole(
    role: Omit<Role, "id" | "created_at" | "updated_at" | "permissions">
  ): Promise<{ status: string; data: Role; error?: string }> {
    const response = await this.apiClient.post("/roles", role);
    return response.data;
  }

  // Обновление роли
  async updateRole(
    id: number,
    role: Partial<Role>
  ): Promise<{ status: string; data: Role; error?: string }> {
    const response = await this.apiClient.put(`/roles/${id}`, role);
    return response.data;
  }

  // Удаление роли
  async deleteRole(
    id: number
  ): Promise<{ status: string; message: string; error?: string }> {
    const response = await this.apiClient.delete(`/roles/${id}`);
    return response.data;
  }

  // Получение разрешений роли
  async getRolePermissions(
    id: number
  ): Promise<{ status: string; data: Permission[]; error?: string }> {
    const response = await this.apiClient.get(`/roles/${id}/permissions`);
    return response.data;
  }

  // Обновление разрешений роли
  async updateRolePermissions(
    id: number,
    permissionIds: number[]
  ): Promise<{ status: string; data: Permission[]; error?: string }> {
    const response = await this.apiClient.put(`/roles/${id}/permissions`, {
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
      `/api/permissions?${params.toString()}`
    );
    return response.data;
  }

  // === ШАБЛОНЫ ПОЛЬЗОВАТЕЛЕЙ ===

  // Получение списка шаблонов пользователей
  async getUserTemplates(
    page = 1,
    limit = 100,
    filters: { search?: string; active_only?: boolean } = {}
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
    // Если включен режим демо данных, возвращаем mock шаблоны
    if (this.useMockData) {
      let filteredTemplates = [...mockTemplates];
      
      if (filters.active_only) {
        filteredTemplates = filteredTemplates.filter(template => template.is_active);
      }
      
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredTemplates = filteredTemplates.filter(template => 
          template.name.toLowerCase().includes(search) ||
          (template.description && template.description.toLowerCase().includes(search))
        );
      }

      return {
        status: "success",
        data: {
          items: filteredTemplates,
          total: filteredTemplates.length,
          page,
          limit,
          pages: Math.ceil(filteredTemplates.length / limit)
        }
      };
    }

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
        `/user-templates?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.warn('Ошибка загрузки шаблонов пользователей с сервера, переключаемся на демо данные:', error);
      // Включаем режим демо данных при ошибке
      this.useMockData = true;
      
      let filteredTemplates = [...mockTemplates];
      
      if (filters.active_only) {
        filteredTemplates = filteredTemplates.filter(template => template.is_active);
      }
      
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredTemplates = filteredTemplates.filter(template => 
          template.name.toLowerCase().includes(search) ||
          (template.description && template.description.toLowerCase().includes(search))
        );
      }

      return {
        status: "success",
        data: {
          items: filteredTemplates,
          total: filteredTemplates.length,
          page,
          limit,
          pages: Math.ceil(filteredTemplates.length / limit)
        }
      };
    }
  }

  // Получение одного шаблона
  async getUserTemplate(
    id: number
  ): Promise<{ status: string; data: UserTemplate; error?: string }> {
    const response = await this.apiClient.get(`/user-templates/${id}`);
    return response.data;
  }

  // Создание шаблона пользователя
  async createUserTemplate(
    template: Omit<
      UserTemplate,
      "id" | "created_at" | "updated_at" | "usage_count" | "role"
    >
  ): Promise<{ status: string; data: UserTemplate; error?: string }> {
    const response = await this.apiClient.post("/user-templates", template);
    return response.data;
  }

  // Обновление шаблона пользователя
  async updateUserTemplate(
    id: number,
    template: Partial<UserTemplate>
  ): Promise<{ status: string; data: UserTemplate; error?: string }> {
    const response = await this.apiClient.put(
      `/user-templates/${id}`,
      template
    );
    return response.data;
  }

  // Удаление шаблона пользователя
  async deleteUserTemplate(
    id: number
  ): Promise<{ status: string; message: string; error?: string }> {
    const response = await this.apiClient.delete(`/user-templates/${id}`);
    return response.data;
  }

  // === СТАТИСТИКА ===

  // Получение статистики пользователей
  async getUsersStats(): Promise<UserStats> {
    // Если включен режим демо данных, возвращаем mock статистику
    if (this.useMockData) {
      return mockStats;
    }

    try {
      const response = await this.apiClient.get("/users/stats");
      return response.data.data;
    } catch (error) {
      console.warn('Ошибка загрузки статистики пользователей с сервера, переключаемся на демо данные:', error);
      // Включаем режим демо данных при ошибке
      this.useMockData = true;
      return mockStats;
    }
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
      `/users/export?${params.toString()}`,
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
