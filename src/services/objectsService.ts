// Сервис для работы с объектами мониторинга

import { config } from "@/config/env";
import type {
  CompanyInfo,
  ObjectFilters,
  ObjectForm,
  ObjectTemplate,
  ObjectWithRelations,
  ObjectsResponse,
  ScheduleDeleteForm,
} from "@/types/objects";
import axios from "axios";

export class ObjectsService {
  private static instance: ObjectsService;
  private apiClient = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 30000,
  });

  constructor() {
    console.log("🔧 ObjectsService constructor called");
    
    // Настраиваем interceptors для токена
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem("axenta_token");
      const company = localStorage.getItem("axenta_company");

      console.log("📡 ObjectsService request:", {
        url: config.url,
        method: config.method,
        hasToken: !!token,
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

    // Добавляем обработчик ошибок
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.log("ObjectsService API error:", {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
        });

        // Не перенаправляем на логин при 401 - пусть fallback сработает
        return Promise.reject(error);
      }
    );
  }

  static getInstance(): ObjectsService {
    if (!ObjectsService.instance) {
      ObjectsService.instance = new ObjectsService();
    }
    return ObjectsService.instance;
  }

  // Конвертация объектов Axenta Cloud в локальную структуру
  private convertAxentaObjectsToLocal(axentaObjects: any[]): ObjectWithRelations[] {
    return axentaObjects.map(obj => ({
      // Основные поля
      id: obj.id,
      name: obj.name,
      type: this.determineObjectType(obj.deviceTypeName),
      description: `${obj.deviceTypeName} - ${obj.accountName}`,
      created_at: obj.createdAt,
      updated_at: obj.createdAt,
      
      // Новые поля из Axenta Cloud
      accountName: obj.accountName,
      creatorName: obj.creatorName,
      deviceTypeName: obj.deviceTypeName,
      phoneNumbers: obj.phoneNumbers,
      createdAt: obj.createdAt,
      lastMessageDatetime: obj.lastMessageDatetime,
      uniqueId: obj.uniqueId,
      
      // Статус и активность
      status: obj.isActive ? "active" as const : "inactive" as const,
      is_active: obj.isActive,
      
      // Заглушки для обязательных полей
      address: obj.accountName || "Не указан",
      imei: obj.uniqueId || "",
      phone_number: obj.phoneNumbers?.[0] || "",
      serial_number: obj.uniqueId || "",
      company_id: obj.accountId,
      contract_id: obj.accountId,
      location_id: obj.accountId,
      settings: "{}",
      tags: [obj.deviceTypeName, obj.accountType].filter(Boolean),
      notes: `Создатель: ${obj.creatorName}`,
      external_id: obj.uniqueId || "",
      
      // Дополнительная информация
      company: {
        id: obj.accountId,
        name: obj.accountName
      }
    }));
  }

  // Определение типа объекта по названию устройства
  private determineObjectType(deviceTypeName: string): string {
    const deviceType = deviceTypeName?.toLowerCase() || "";
    
    if (deviceType.includes("omnicomm") || deviceType.includes("wialon") || deviceType.includes("galileosky")) {
      return "vehicle";
    } else if (deviceType.includes("навтелеком") || deviceType.includes("умка")) {
      return "equipment";
    } else if (deviceType.includes("arnavi")) {
      return "asset";
    }
    
    return "vehicle"; // По умолчанию
  }

  // Получение списка объектов с фильтрацией
  async getObjects(
    page = 1,
    per_page = 50,
    filters: ObjectFilters = {}
  ): Promise<ObjectsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
      ordering: filters.ordering || "name", // Сортировка по имени по умолчанию
    });

    // Добавляем фильтры
    if (filters.status) params.append("status", filters.status);
    if (filters.type) params.append("type", filters.type);
    if (filters.search) params.append("search", filters.search);
    if (filters.contract_id)
      params.append("contract_id", filters.contract_id.toString());
    if (filters.location_id)
      params.append("location_id", filters.location_id.toString());
    if (filters.template_id)
      params.append("template_id", filters.template_id.toString());
    if (filters.has_scheduled_delete !== undefined) {
      params.append(
        "has_scheduled_delete",
        filters.has_scheduled_delete.toString()
      );
    }
    if (filters.is_active !== undefined) {
      params.append("is_active", filters.is_active.toString());
    }

    // Новые фильтры
    if (filters.accountName) params.append("accountName", filters.accountName);
    if (filters.creatorName) params.append("creatorName", filters.creatorName);
    if (filters.deviceTypeName)
      params.append("deviceTypeName", filters.deviceTypeName);
    if (filters.uniqueId) params.append("uniqueId", filters.uniqueId);

    try {
      console.log("🚀 ObjectsService.getObjects called with:", { page, per_page, filters });
      
      // Используем Axenta Cloud CMS API endpoint (прямое обращение)
      const response = await this.apiClient.get(
        `/cms/objects/?${params.toString()}`
      );
      console.log("✅ Backend objects API response:", response.data);
      
      // Проверяем структуру ответа
      if (response.data.count !== undefined && response.data.results) {
        console.log("🔄 Converting Axenta Cloud data to local format...");
        const convertedItems = this.convertAxentaObjectsToLocal(response.data.results);
        console.log("📊 Converted items:", convertedItems.length, "objects");
        
        const adaptedResponse = {
          status: "success" as const,
          data: {
            items: convertedItems,
            total: response.data.count,
            page: page,
            per_page: per_page,
            total_pages: Math.ceil(response.data.count / per_page)
          }
        };
        
        console.log("📋 Final adapted response:", adaptedResponse);
        return adaptedResponse;
      } else {
        console.log("📋 Using backend response as-is");
        return response.data;
      }
    } catch (error: any) {
      console.log("🔍 Error in getObjects (backend auth):", error.response?.status, error.message);
      
      // Если аутентифицированный endpoint недоступен, пробуем fallback endpoints
      if (error.response?.status === 401 || error.response?.status === 404 || error.response?.status === 500) {
        console.warn("🔄 Fallback to direct Axenta Cloud API");
        try {
          // Прямое обращение к Axenta Cloud API
          const axentaClient = axios.create({
            baseURL: "https://axenta.cloud/api",
            timeout: 30000,
          });
          
          const response = await axentaClient.get(
            `/cms/objects/?${params.toString()}`,
            {
              headers: {
                'Authorization': 'Token 5e515a8f2874fc78f31c74af45260333f2c84c35',
                'Content-Type': 'application/json'
              }
            }
          );
          console.log("✅ Direct Axenta Cloud API successful");
          
          // Проверяем структуру ответа от Axenta Cloud
          if (response.data.count !== undefined && response.data.results) {
            return {
              status: "success" as const,
              data: {
                items: this.convertAxentaObjectsToLocal(response.data.results),
                total: response.data.count,
                page: page,
                per_page: per_page,
                total_pages: Math.ceil(response.data.count / per_page)
              }
            };
          } else {
            return response.data;
          }
        } catch (axentaError: any) {
          console.warn("🔄 Fallback to backend /objects endpoint");
          try {
            const response = await this.apiClient.get(
              `/objects?${params.toString()}`
            );
            console.log("✅ Fallback to backend /objects successful");
            
            // Проверяем структуру ответа от бэкенда
            if (response.data.status === "success" && response.data.data) {
              return response.data;
            } else if (response.data.count !== undefined && response.data.results) {
              return {
                status: "success" as const,
                data: {
                  items: this.convertAxentaObjectsToLocal(response.data.results),
                  total: response.data.count,
                  page: page,
                  per_page: per_page,
                  total_pages: Math.ceil(response.data.count / per_page)
                }
              };
            } else {
              return response.data;
            }
          } catch (fallbackError: any) {
            console.error("❌ All fallbacks failed for objects:", fallbackError);
            throw fallbackError;
          }
        }
      }
      throw error;
    }
  }

  // Получение одного объекта
  async getObject(
    id: number
  ): Promise<{ status: string; data: ObjectWithRelations; error?: string }> {
    try {
      // Пробуем аутентифицированный эндпоинт
      const response = await this.apiClient.get(`/auth/objects/${id}`);
      return response.data;
    } catch (error: any) {
      // Если аутентификация не прошла или сервер недоступен, используем публичный эндпоинт
      if (error.response?.status === 401 || error.response?.status === 404 || error.response?.status === 500) {
        console.warn("🔄 Fallback to public endpoint for object");
        const response = await this.apiClient.get(`/objects/${id}`);
        return response.data;
      }
      throw error;
    }
  }

  // Создание объекта
  async createObject(
    object: ObjectForm
  ): Promise<{ status: string; data: ObjectWithRelations; error?: string }> {
    const response = await this.apiClient.post(
      "/auth/objects",
      object
    );
    return response.data;
  }

  // Обновление объекта
  async updateObject(
    id: number,
    object: Partial<ObjectForm>
  ): Promise<{ status: string; data: ObjectWithRelations; error?: string }> {
    const response = await this.apiClient.put(
      `/auth/objects/${id}`,
      object
    );
    return response.data;
  }

  // Удаление объекта (мягкое)
  async deleteObject(
    id: number
  ): Promise<{ status: string; message: string; error?: string }> {
    const response = await this.apiClient.delete(
      `/auth/objects/${id}`
    );
    return response.data;
  }

  // Плановое удаление объекта
  async scheduleObjectDelete(
    id: number,
    data: ScheduleDeleteForm
  ): Promise<{ status: string; message: string; data: any; error?: string }> {
    const response = await this.apiClient.put(
      `/auth/objects/${id}/schedule-delete`,
      data
    );
    return response.data;
  }

  // Отмена планового удаления
  async cancelScheduledDelete(
    id: number
  ): Promise<{ status: string; message: string; data: any; error?: string }> {
    const response = await this.apiClient.put(
      `/auth/objects/${id}/cancel-delete`
    );
    return response.data;
  }

  // Получение удаленных объектов (корзина)
  async getDeletedObjects(
    page = 1,
    per_page = 50,
    search?: string
  ): Promise<ObjectsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
      ordering: "name",
    });

    if (search) params.append("search", search);

    const response = await this.apiClient.get(
      `/auth/objects-trash?${params.toString()}`
    );
    return response.data;
  }

  // Восстановление объекта из корзины
  async restoreObject(
    id: number
  ): Promise<{ status: string; message: string; data: any; error?: string }> {
    const response = await this.apiClient.put(
      `/auth/objects/${id}/restore`
    );
    return response.data;
  }

  // Окончательное удаление объекта
  async permanentDeleteObject(
    id: number
  ): Promise<{ status: string; message: string; error?: string }> {
    const response = await this.apiClient.delete(
      `/auth/objects/${id}/permanent`
    );
    return response.data;
  }

  // === ШАБЛОНЫ ОБЪЕКТОВ ===

  // Получение списка шаблонов
  async getObjectTemplates(
    page = 1,
    per_page = 50,
    filters: { category?: string; search?: string; active_only?: boolean } = {}
  ): Promise<{
    status: string;
    data: {
      items: ObjectTemplate[];
      total: number;
      page: number;
      per_page: number;
      total_pages: number;
    };
    error?: string;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
      ordering: "name",
    });

    if (filters.category) params.append("category", filters.category);
    if (filters.search) params.append("search", filters.search);
    if (filters.active_only !== undefined)
      params.append("active_only", filters.active_only.toString());

    const response = await this.apiClient.get(
      `/object-templates?${params.toString()}`
    );
    return response.data;
  }

  // Получение одного шаблона
  async getObjectTemplate(
    id: number
  ): Promise<{ status: string; data: ObjectTemplate; error?: string }> {
    const response = await this.apiClient.get(
      `/object-templates/${id}`
    );
    return response.data;
  }

  // Создание шаблона
  async createObjectTemplate(
    template: Omit<
      ObjectTemplate,
      "id" | "created_at" | "updated_at" | "usage_count"
    >
  ): Promise<{ status: string; data: ObjectTemplate; error?: string }> {
    const response = await this.apiClient.post(
      "/object-templates",
      template
    );
    return response.data;
  }

  // Обновление шаблона
  async updateObjectTemplate(
    id: number,
    template: Partial<ObjectTemplate>
  ): Promise<{ status: string; data: ObjectTemplate; error?: string }> {
    const response = await this.apiClient.put(
      `/object-templates/${id}`,
      template
    );
    return response.data;
  }

  // Удаление шаблона
  async deleteObjectTemplate(
    id: number
  ): Promise<{ status: string; message: string; error?: string }> {
    const response = await this.apiClient.delete(
      `/object-templates/${id}`
    );
    return response.data;
  }

  // === ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ===

  // Получение статистики объектов
  async getObjectsStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    scheduled_for_delete: number;
    by_type: Record<string, number>;
    by_status: Record<string, number>;
  }> {
    try {
      // Пробуем аутентифицированный эндпоинт для статистики
      const response = await this.apiClient.get("/auth/objects/stats");
      console.log("✅ Backend objects stats API response:", response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.log("🔍 Error in getObjectsStats (backend):", error.response?.status, error.message);
      
      // Если бэкенд недоступен, пробуем fallback endpoints
      if (error.response?.status === 401 || error.response?.status === 404 || error.response?.status === 500) {
        console.warn("🔄 Fallback to direct Axenta Cloud API for stats");
        try {
          // Прямое обращение к Axenta Cloud API для статистики
          const axentaClient = axios.create({
            baseURL: "https://axenta.cloud/api",
            timeout: 30000,
          });
          
          const response = await axentaClient.get(
            `/cms/objects/?page=1&per_page=1`,
            {
              headers: {
                'Authorization': 'Token 5e515a8f2874fc78f31c74af45260333f2c84c35',
                'Content-Type': 'application/json'
              }
            }
          );
          console.log("✅ Direct Axenta Cloud API successful for stats");
          
          // Возвращаем статистику на основе общего количества объектов
          const total = response.data.count || 0;
          return {
            total: total,
            active: total, // Предполагаем, что большинство активны
            inactive: 0,
            scheduled_for_delete: 0,
            by_type: {
              vehicle: total
            },
            by_status: {
              active: total
            }
          };
        } catch (axentaError: any) {
          console.warn("🔄 Fallback to backend /objects/stats endpoint");
          try {
            const response = await this.apiClient.get("/objects/stats");
            console.log("✅ Fallback to backend /objects/stats successful");
            return response.data.data || response.data;
          } catch (fallbackError: any) {
            console.error("❌ All fallbacks failed for objects stats:", fallbackError);
            // Возвращаем пустую статистику вместо ошибки
            return {
              total: 0,
              active: 0,
              inactive: 0,
              scheduled_for_delete: 0,
              by_type: {},
              by_status: {}
            };
          }
        }
      }
      throw error;
    }
  }

  // Экспорт объектов
  async exportObjects(
    format: "csv" | "excel" | "json",
    filters: ObjectFilters = {}
  ): Promise<Blob> {
    const params = new URLSearchParams({ format });

    // Добавляем фильтры
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await this.apiClient.get(
      `/auth/objects/export?${params.toString()}`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  }

  // Проверка демо режима
  // Создание шаблона на основе объекта
  async createTemplateFromObject(
    objectId: number,
    templateData: {
      name: string;
      description: string;
      category: string;
      icon: string;
      color: string;
    }
  ): Promise<{ status: string; data?: any; error?: string }> {
    try {
      const response = await fetch(`/api/objects/${objectId}/create-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка создания шаблона:', error);
      return { status: 'error', error: 'Ошибка создания шаблона' };
    }
  }

  isMockDataEnabled(): boolean {
    return localStorage.getItem('objects_demo_mode') === 'true';
  }

  // Получение списка компаний для селектора
  async getCompanies(): Promise<{ status: string; data: CompanyInfo[]; error?: string }> {
    try {
      const response = await this.apiClient.get("/admin/accounts/list");
      return {
        status: response.data.status,
        data: response.data.data || [], // Обеспечиваем, что data всегда массив
        error: response.data.error
      };
    } catch (error: any) {
      console.error("Ошибка получения списка компаний:", error);
      return {
        status: "error",
        data: [],
        error: error.response?.data?.error || "Ошибка получения списка компаний"
      };
    }
  }

  // Включение демо режима
  enableMockData(): void {
    localStorage.setItem('objects_demo_mode', 'true');
  }

  // Отключение демо режима
  disableMockData(): void {
    localStorage.removeItem('objects_demo_mode');
  }
}

// Экспортируем функцию для получения instance (ленивая инициализация)
export const getObjectsService = () => {
  console.log("🔧 Creating ObjectsService instance...");
  return ObjectsService.getInstance();
};
export default getObjectsService;
