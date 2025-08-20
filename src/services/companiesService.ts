import { config } from "@/config/env";
import axios from "axios";

// Типы для API компаний
export interface CompanyRequest {
  name: string;
  domain?: string;
  axetna_login: string;
  axetna_password: string;

  // Интеграция с Битрикс24
  bitrix24_webhook_url?: string;
  bitrix24_client_id?: string;
  bitrix24_client_secret?: string;

  // Контактная информация
  contact_email?: string;
  contact_phone?: string;
  contact_person?: string;

  // Адрес
  address?: string;
  city?: string;
  country?: string;

  // Настройки
  max_users?: number;
  max_objects?: number;
  storage_quota?: number;
  language?: string;
  timezone?: string;
  currency?: string;
}

export interface CompanyResponse {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  database_schema: string;
  domain: string;

  // Контактная информация
  contact_email: string;
  contact_phone: string;
  contact_person: string;

  // Адрес
  address: string;
  city: string;
  country: string;

  // Настройки и статус
  is_active: boolean;
  max_users: number;
  max_objects: number;
  storage_quota: number;
  language: string;
  timezone: string;
  currency: string;

  // Статистика использования
  usage_stats?: CompanyUsageStats;
}

export interface CompanyUsageStats {
  users_count: number;
  objects_count: number;
  storage_used_mb: number;
  last_activity?: string;
}

export interface CompanyListParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  include_usage?: boolean;
}

export interface CompanyListResponse {
  companies: CompanyResponse[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    per_page: number;
  };
}

export interface TestConnectionResponse {
  connection_success: boolean;
  message: string;
}

class CompaniesService {
  private readonly basePath = "/admin/accounts";

  private apiClient = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: config.apiTimeout,
  });

  constructor() {
    // Добавляем интерцептор для автоматического добавления токена авторизации
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem("axenta_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Получить список компаний с фильтрацией
   */
  async getCompanies(
    params: CompanyListParams = {}
  ): Promise<CompanyListResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.is_active !== undefined)
      queryParams.append("is_active", params.is_active.toString());
    if (params.include_usage) queryParams.append("include_usage", "true");

    const query = queryParams.toString();
    const url = query ? `${this.basePath}?${query}` : this.basePath;

    const response = await this.apiClient.get(url);
    return response.data.data;
  }

  /**
   * Получить компанию по ID
   */
  async getCompany(id: number, includeUsage = false): Promise<CompanyResponse> {
    const url = includeUsage
      ? `${this.basePath}/${id}?include_usage=true`
      : `${this.basePath}/${id}`;

    const response = await this.apiClient.get(url);
    return response.data.data;
  }

  /**
   * Создать новую компанию
   */
  async createCompany(data: CompanyRequest): Promise<CompanyResponse> {
    const response = await this.apiClient.post(this.basePath, data);
    return response.data.data;
  }

  /**
   * Обновить компанию
   */
  async updateCompany(
    id: number,
    data: CompanyRequest
  ): Promise<CompanyResponse> {
    const response = await this.apiClient.put(`${this.basePath}/${id}`, data);
    return response.data.data;
  }

  /**
   * Удалить компанию
   */
  async deleteCompany(id: number): Promise<void> {
    await this.apiClient.delete(`${this.basePath}/${id}`);
  }

  /**
   * Активировать компанию
   */
  async activateCompany(id: number): Promise<CompanyResponse> {
    const response = await this.apiClient.put(`${this.basePath}/${id}/activate`);
    return response.data.data;
  }

  /**
   * Деактивировать компанию
   */
  async deactivateCompany(id: number): Promise<CompanyResponse> {
    const response = await this.apiClient.put(`${this.basePath}/${id}/deactivate`);
    return response.data.data;
  }

  /**
   * Получить статистику использования компании
   */
  async getCompanyUsage(id: number): Promise<CompanyUsageStats> {
    const response = await apiClient.get(`${this.basePath}/${id}/usage`);
    return response.data.data;
  }

  /**
   * Тестировать подключение к Axenta API
   */
  async testConnection(id: number): Promise<TestConnectionResponse> {
    const response = await this.apiClient.post(
      `${this.basePath}/${id}/test-connection`
    );
    return response.data.data;
  }

  /**
   * Получить статистику всех компаний для дашборда
   */
  async getCompaniesStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    total_users: number;
    total_objects: number;
  }> {
    const companies = await this.getCompanies({ include_usage: true });

    let totalUsers = 0;
    let totalObjects = 0;

    companies.companies.forEach((company) => {
      if (company.usage_stats) {
        totalUsers += company.usage_stats.users_count;
        totalObjects += company.usage_stats.objects_count;
      }
    });

    return {
      total: companies.companies.length,
      active: companies.companies.filter((c) => c.is_active).length,
      inactive: companies.companies.filter((c) => !c.is_active).length,
      total_users: totalUsers,
      total_objects: totalObjects,
    };
  }

  /**
   * Экспорт списка компаний в CSV
   */
  async exportCompanies(params: CompanyListParams = {}): Promise<Blob> {
    const companies = await this.getCompanies({ ...params, limit: 1000 });

    const csvContent = this.convertToCSV(companies.companies);
    return new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  }

  /**
   * Преобразование данных компаний в CSV формат
   */
  private convertToCSV(companies: CompanyResponse[]): string {
    const headers = [
      "ID",
      "Название",
      "Домен",
      "Схема БД",
      "Активна",
      "Контактное лицо",
      "Email",
      "Телефон",
      "Город",
      "Страна",
      "Макс. пользователей",
      "Макс. объектов",
      "Квота хранилища (МБ)",
      "Язык",
      "Часовой пояс",
      "Валюта",
      "Дата создания",
      "Дата обновления",
    ];

    const rows = companies.map((company) => [
      company.id,
      company.name,
      company.domain || "",
      company.database_schema,
      company.is_active ? "Да" : "Нет",
      company.contact_person || "",
      company.contact_email || "",
      company.contact_phone || "",
      company.city || "",
      company.country || "",
      company.max_users,
      company.max_objects,
      company.storage_quota,
      company.language,
      company.timezone,
      company.currency,
      new Date(company.created_at).toLocaleDateString("ru-RU"),
      new Date(company.updated_at).toLocaleDateString("ru-RU"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return csvContent;
  }

  /**
   * Валидация данных компании
   */
  validateCompanyData(data: Partial<CompanyRequest>): string[] {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push("Название компании обязательно для заполнения");
    }

    if (data.name && data.name.length > 100) {
      errors.push("Название компании не должно превышать 100 символов");
    }

    if (!data.axetna_login || data.axetna_login.trim().length === 0) {
      errors.push("Логин Axenta обязателен для заполнения");
    }

    if (!data.axetna_password || data.axetna_password.trim().length === 0) {
      errors.push("Пароль Axenta обязателен для заполнения");
    }

    if (
      data.contact_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact_email)
    ) {
      errors.push("Некорректный формат email");
    }

    if (data.domain && !/^[a-zA-Z0-9.-]+$/.test(data.domain)) {
      errors.push("Некорректный формат домена");
    }

    if (data.max_users && data.max_users < 1) {
      errors.push("Максимальное количество пользователей должно быть больше 0");
    }

    if (data.max_objects && data.max_objects < 1) {
      errors.push("Максимальное количество объектов должно быть больше 0");
    }

    if (data.storage_quota && data.storage_quota < 1) {
      errors.push("Квота хранилища должна быть больше 0 МБ");
    }

    return errors;
  }
}

export const companiesService = new CompaniesService();
export default companiesService;
