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

export class UsersService {
  private static instance: UsersService;
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

  // === ПОЛЬЗОВАТЕЛИ ===

  // Получение списка пользователей с фильтрацией
  async getUsers(
    page = 1,
    limit = 20,
    filters: UserFilters = {}
  ): Promise<UsersResponse> {
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
    const response = await this.apiClient.get("/users/stats");
    return response.data.data;
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
