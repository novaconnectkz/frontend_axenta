// Сервис для работы с объектами мониторинга

import { config } from "@/config/env";
import type {
  CompanyInfo,
  ObjectFilters,
  ObjectForm,
  ObjectWithRelations,
  ObjectsResponse,
  ScheduleDeleteForm,
} from "@/types/objects";
import { logger } from "@/utils/logger";
import axios from "axios";

export class ObjectsService {
  private static instance: ObjectsService;
  private apiClient = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 30000,
  });

  // Кеширование статистики объектов
  private statsCache: {
    data: {
      total: number;
      active: number;
      inactive: number;
      scheduled_for_delete: number;
      deleted: number;
      by_type: Record<string, number>;
      by_status: Record<string, number>;
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
    inactive: number;
    scheduled_for_delete: number;
    deleted: number;
    by_type: Record<string, number>;
    by_status: Record<string, number>;
  }> | null = null;

  constructor() {
    logger.debug("🔧 ObjectsService constructor called");
    
    // Настраиваем interceptors для токена
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem("axenta_token");
      const company = localStorage.getItem("axenta_company");

      logger.debug("📡 ObjectsService request:", {
        url: config.url,
        method: config.method,
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : "ОТСУТСТВУЕТ",
        company: company ? "EXISTS" : "MISSING",
      });

      if (!token) {
        console.error("❌ КРИТИЧЕСКАЯ ОШИБКА: Токен отсутствует в localStorage!");
        console.error("Проверьте, что пользователь авторизован");
      } else {
        config.headers["authorization"] = `Token ${token}`;
        config.headers["Authorization"] = `Token ${token}`;
        logger.debug("✅ Токен добавлен в заголовки запроса");
      }

      if (company) {
        try {
          const companyData = JSON.parse(company);
          config.headers["X-Tenant-ID"] = companyData.id;
        } catch (e) {
          logger.warn("Invalid company data in localStorage");
        }
      }

      return config;
    });

    // Добавляем обработчик ошибок
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.debug("ObjectsService API error:", {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
        });

        // Если получили 401, обрабатываем ошибку авторизации
        if (error.response?.status === 401) {
          const token = localStorage.getItem("axenta_token");
          if (!token) {
            console.error("❌ Ошибка 401: Токен отсутствует в localStorage");
          } else {
            console.error("❌ Ошибка 401: Токен присутствует, но недействителен");
            console.error("Длина токена:", token.length);
            console.error("Начало токена:", token.substring(0, 30));
          }
          
          // Очищаем все данные авторизации
          logger.debug("🧹 Очистка данных авторизации из-за ошибки 401");
          localStorage.removeItem("axenta_token");
          localStorage.removeItem("axenta_user");
          localStorage.removeItem("axenta_company");
          localStorage.removeItem("axenta_token_expiry");
          
          // Перенаправляем на страницу входа
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            logger.debug("🔄 Перенаправление на страницу входа из ObjectsService...");
            
            // Сохраняем текущий путь для редиректа после входа
            const currentPath = window.location.pathname;
            if (currentPath !== '/login' && currentPath !== '/' && currentPath !== '/dashboard') {
              localStorage.setItem('redirect_after_login', currentPath);
            }
            
            setTimeout(() => {
              window.location.href = '/login?reason=session_expired';
            }, 100);
          }
        }

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
      accountId: obj.accountId, // Сохраняем accountId для фильтрации
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
      company_id: obj.accountId || 0,
      contract_id: 0, // contract_id должен быть 0 для объектов без договора
      location_id: obj.accountId || 0,
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

  // Получение единого списка объектов из всех источников (Axenta + WH + WL).
  // Использует /api/auth/unified/objects (read-path: snapshot Axenta + Redis cache Wialon).
  async getUnifiedObjects(
    page = 1,
    per_page = 50,
    filters: ObjectFilters & { source?: string | null } = {}
  ): Promise<{
    status: "success" | "error";
    data: {
      items: any[];
      total: number;
      page: number;
      per_page: number;
      total_pages: number;
      stats: {
        axenta_total: number;
        axenta_active: number;
        axenta_inactive: number;
        axenta_deleted: number;
        axenta_scheduled_delete: number;
        wialon_total: number;
        wialon_active: number;
        wialon_wh_total: number;
        wialon_wh_active: number;
        wialon_wl_total: number;
        wialon_wl_active: number;
      };
    };
    error?: string;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
    });
    if (filters.search) params.append("search", filters.search);
    if (filters.is_active !== undefined) params.append("active", filters.is_active.toString());
    if (filters.source) params.append("source", filters.source);
    if (filters.ordering) params.append("ordering", filters.ordering);

    const response = await this.apiClient.get(`/auth/unified/objects?${params.toString()}`);
    return response.data;
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
    if (filters.accountId) params.append("accountId", filters.accountId.toString());
    if (filters.creatorName) params.append("creatorName", filters.creatorName);
    if (filters.deviceTypeName)
      params.append("deviceTypeName", filters.deviceTypeName);
    if (filters.uniqueId) params.append("uniqueId", filters.uniqueId);

    try {
      logger.debug("🚀 ObjectsService.getObjects called with:", { page, per_page, filters });
      logger.debug("📡 Request URL params:", params.toString());
      const requestUrl = `/auth/cms/objects/?${params.toString()}`;
      logger.debug("🔗 Full request URL:", requestUrl);
      
      // Используем аутентифицированный CMS API endpoint
      const response = await this.apiClient.get(requestUrl);
      logger.debug("✅ Backend objects API response:", {
        status: response.status,
        itemsCount: response.data?.data?.items?.length || response.data?.results?.length || 0,
        total: response.data?.data?.total || response.data?.count || 0
      });
      
      // Проверяем структуру ответа
      if (response.data.count !== undefined && response.data.results) {
        logger.debug("🔄 Converting Axenta Cloud data to local format...");
        const convertedItems = this.convertAxentaObjectsToLocal(response.data.results);
        logger.debug("📊 Converted items:", convertedItems.length, "objects");
        
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
        
        logger.debug("📋 Final adapted response:", adaptedResponse);
        return adaptedResponse;
      } else {
        logger.debug("📋 Using backend response as-is");
        return response.data;
      }
    } catch (error: any) {
      logger.debug("🔍 Error in getObjects (backend auth):", error.response?.status, error.message);
      
      // Если аутентифицированный endpoint недоступен, пробуем fallback endpoints
      if (error.response?.status === 401 || error.response?.status === 404 || error.response?.status === 500) {
        logger.warn("🔄 Fallback to direct Axenta Cloud API");
        try {
          // Получаем токен текущего пользователя
          const userToken = localStorage.getItem("axenta_token");
          if (!userToken) {
            throw new Error("Токен пользователя не найден");
          }
          
          // Прямое обращение к Axenta Cloud API с токеном пользователя
          const axentaClient = axios.create({
            baseURL: "https://axenta.cloud/api",
            timeout: 30000,
          });
          
          const response = await axentaClient.get(
            `/cms/objects/?${params.toString()}`,
            {
              headers: {
                'Authorization': `Token ${userToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          logger.debug("✅ Direct Axenta Cloud API successful");
          
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
          logger.warn("🔄 Fallback to backend /objects endpoint");
          try {
            const response = await this.apiClient.get(
              `/objects?${params.toString()}`
            );
            logger.debug("✅ Fallback to backend /objects successful");
            
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
        logger.warn("🔄 Fallback to public endpoint for object");
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

    try {
      logger.debug("🚀 ObjectsService.getDeletedObjects called with:", { page, per_page, search });
      
      // Используем API корзины из Axenta Cloud
      const response = await this.apiClient.get(
        `/auth/cms/trash/?${params.toString()}`
      );
      logger.debug("✅ Backend trash API response:", response.data);
      
      // API корзины с авторизацией возвращает структуру {"count": number, "results": [...]}
      // Без авторизации возвращает {"detail": [...]}
      if (response.data.count !== undefined && response.data.results) {
        logger.debug("🔄 Converting Axenta Cloud trash data (auth) to local format...");
        const convertedItems = this.convertAxentaObjectsToLocal(response.data.results);
        logger.debug("📊 Converted trash items:", convertedItems.length, "objects");
        
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
        
        logger.debug("📋 Final adapted trash response:", adaptedResponse);
        return adaptedResponse;
      } else if (response.data.detail !== undefined) {
        logger.debug("🔄 Converting Axenta Cloud trash data (no-auth) to local format...");
        const convertedItems = this.convertAxentaObjectsToLocal(response.data.detail);
        logger.debug("📊 Converted trash items:", convertedItems.length, "objects");
        
        const adaptedResponse = {
          status: "success" as const,
          data: {
            items: convertedItems,
            total: response.data.detail.length,
            page: page,
            per_page: per_page,
            total_pages: Math.ceil(response.data.detail.length / per_page)
          }
        };
        
        logger.debug("📋 Final adapted trash response:", adaptedResponse);
        return adaptedResponse;
      } else {
        logger.debug("📋 Using backend trash response as-is");
        return response.data;
      }
    } catch (error: any) {
      logger.debug("❌ ObjectsService.getDeletedObjects error:", error);
      logger.debug("🔍 Error status:", error.response?.status);
      logger.debug("🔍 Error message:", error.message);
      
      // Если локальный API не работает, пробуем Axenta Cloud API
      if (error.response?.status === 401 || error.response?.status === 404 || error.response?.status === 500 || error.message?.includes('database')) {
        logger.warn("🔄 Fallback to direct Axenta Cloud API for trash");
        try {
          // Получаем токен текущего пользователя
          const userToken = localStorage.getItem("axenta_token");
          if (!userToken) {
            throw new Error("Токен пользователя не найден");
          }
          
          // Прямое обращение к Axenta Cloud API с токеном пользователя
          const axentaClient = axios.create({
            baseURL: "https://axenta.cloud/api",
            timeout: 30000,
          });
          
          const response = await axentaClient.get(
            `/cms/trash/?${params.toString()}`,
            {
              headers: {
                'Authorization': `Token ${userToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          logger.debug("✅ Direct Axenta Cloud trash API successful");
          
          // Проверяем структуру ответа от Axenta Cloud
          if (response.data.count !== undefined && response.data.results) {
            const convertedItems = this.convertAxentaObjectsToLocal(response.data.results);
            return {
              status: "success" as const,
              data: {
                items: convertedItems,
                total: response.data.count,
                page: page,
                per_page: per_page,
                total_pages: Math.ceil(response.data.count / per_page)
              }
            };
          } else if (response.data.detail !== undefined) {
            const convertedItems = this.convertAxentaObjectsToLocal(response.data.detail);
            return {
              status: "success" as const,
              data: {
                items: convertedItems,
                total: response.data.detail.length,
                page: page,
                per_page: per_page,
                total_pages: Math.ceil(response.data.detail.length / per_page)
              }
            };
          } else {
            return response.data;
          }
        } catch (axentaError: any) {
          logger.warn("❌ Axenta Cloud trash API also failed:", axentaError);
          // Возвращаем пустую корзину вместо ошибки
          return {
            status: "success" as const,
            data: {
              items: [],
              total: 0,
              page: page,
              per_page: per_page,
              total_pages: 0
            }
          };
        }
      }
      
      // Fallback к старому API
      try {
        const response = await this.apiClient.get(
          `/auth/objects-trash?${params.toString()}`
        );
        return response.data;
      } catch (fallbackError: any) {
        logger.debug("❌ Fallback trash API also failed:", fallbackError);
        // Возвращаем пустую корзину вместо ошибки
        return {
          status: "success" as const,
          data: {
            items: [],
            total: 0,
            page: page,
            per_page: per_page,
            total_pages: 0
          }
        };
      }
    }
  }

  // Получение статистики корзины
  async getTrashStats(): Promise<{ count: number }> {
    try {
      logger.debug("🚀 ObjectsService.getTrashStats called - UPDATED VERSION");
      
      // Используем API корзины из Axenta Cloud с большим количеством элементов
      // чтобы получить максимально точное количество
      const response = await this.apiClient.get(
        `/auth/cms/trash/?page=1&per_page=1000`
      );
      logger.debug("✅ Backend trash stats API response:", response.data);
      
      // API возвращает {"data": {"total": number, "items": [...]}, "status": "success"}
      let count = 0;
      
      if (response.data.data && response.data.data.total !== undefined) {
        // Наш локальный API
        count = response.data.data.total;
        logger.debug("📊 Trash count from local API:", count);
      } else if (response.data.count !== undefined) {
        // Axenta Cloud API
        count = response.data.count;
        logger.debug("📊 Trash count from Axenta API:", count);
      } else if (response.data.detail) {
        // Неавторизованный API
        count = response.data.detail.length;
        logger.debug("📊 Trash count from no-auth API:", count);
      }
      
      logger.debug("📊 Final trash count calculated:", count);
      
      return {
        count: count
      };
    } catch (error: any) {
      logger.debug("❌ ObjectsService.getTrashStats error:", error);
      logger.debug("🔍 Error status:", error.response?.status);
      logger.debug("🔍 Error message:", error.message);
      
      // Если локальный API не работает, пробуем Axenta Cloud API
      if (error.response?.status === 401 || error.response?.status === 404 || error.response?.status === 500 || error.message?.includes('database')) {
        logger.warn("🔄 Fallback to direct Axenta Cloud API for trash stats");
        try {
          // Получаем токен текущего пользователя
          const userToken = localStorage.getItem("axenta_token");
          if (!userToken) {
            throw new Error("Токен пользователя не найден");
          }
          
          // Прямое обращение к Axenta Cloud API с токеном пользователя
          const axentaClient = axios.create({
            baseURL: "https://axenta.cloud/api",
            timeout: 30000,
          });
          
          const response = await axentaClient.get(
            `/cms/trash/?page=1&per_page=1000`,
            {
              headers: {
                'Authorization': `Token ${userToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          logger.debug("✅ Direct Axenta Cloud trash stats API successful");
          
          let count = 0;
          if (response.data.count !== undefined) {
            count = response.data.count;
          } else if (response.data.detail) {
            count = response.data.detail.length;
          }
          
          return { count: count };
        } catch (axentaError: any) {
          logger.warn("❌ Axenta Cloud trash stats API also failed:", axentaError);
          // Возвращаем 0 если все API недоступны
          return { count: 0 };
        }
      }
      
      // Fallback - возвращаем 0 если API недоступен
      return { count: 0 };
    }
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

  // === ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ===

  // Получение статистики объектов с кешированием и дедупликацией
  async getObjectsStats(forceRefresh: boolean = false): Promise<{
    total: number;
    active: number;
    inactive: number;
    scheduled_for_delete: number;
    deleted: number;
    by_type: Record<string, number>;
    by_status: Record<string, number>;
  }> {
    // КРИТИЧЕСКАЯ ПРОВЕРКА: Проверяем наличие токена перед любым запросом
    const token = localStorage.getItem("axenta_token");
    if (!token) {
      console.error("❌ КРИТИЧЕСКАЯ ОШИБКА в getObjectsStats: Токен отсутствует!");
      console.error("Убедитесь, что пользователь авторизован перед вызовом getObjectsStats");
      throw new Error("Токен авторизации отсутствует. Пожалуйста, войдите в систему.");
    }

    // Проверяем кеш, если не требуется принудительное обновление
    if (!forceRefresh && this.statsCache.data) {
      const now = Date.now();
      const age = now - this.statsCache.timestamp;
      
      if (age < this.statsCache.ttl) {
        logger.debug(`📦 Используем кешированную статистику объектов (возраст: ${Math.round(age / 1000)}с)`, this.statsCache.data);
        return this.statsCache.data;
      } else {
        logger.debug(`🔄 Кеш устарел (возраст: ${Math.round(age / 1000)}с), запрашиваем новые данные`);
      }
    }

    // Если запрос уже выполняется, возвращаем тот же Promise
    if (this.pendingStatsRequest) {
      logger.debug("🔄 Запрос статистики объектов уже выполняется, используем существующий Promise");
      return this.pendingStatsRequest;
    }

    // Создаем новый Promise для запроса
    this.pendingStatsRequest = (async () => {
      try {
        logger.debug("🚀 Выполняем запрос статистики объектов к /auth/cms/objects/stats");
        logger.debug("🔐 Токен доступен, длина:", token.length);
        
        // Пробуем аутентифицированный эндпоинт для статистики
        const response = await this.apiClient.get("/auth/cms/objects/stats");
      logger.debug("✅ Backend objects stats API response:", response.data);
      
      const stats = response.data.data || response.data;
      logger.debug("📊 Полученная статистика объектов:", stats);
      logger.debug("🗑️ Количество удаленных объектов из API:", stats.deleted);
      
      // Если API не возвращает правильное количество удаленных объектов, получаем его отдельно
      if (stats.deleted === 0 || stats.deleted === undefined) {
        logger.debug("🔄 API вернул 0 удаленных объектов, получаем реальную статистику корзины...");
        try {
          const trashStats = await this.getTrashStats();
          stats.deleted = trashStats.count;
          logger.debug("🗑️ Обновленное количество удаленных объектов:", stats.deleted);
        } catch (trashError) {
          logger.warn("Не удалось получить статистику корзины для основного API:", trashError);
        }
      }
      
      // Обновляем кеш
      this.updateStatsCache(stats);
      return stats;
    } catch (error: any) {
      logger.debug("🔍 Error in getObjectsStats (backend):", error.response?.status, error.message);
      
      // Если бэкенд недоступен, пробуем fallback endpoints
      if (error.response?.status === 401 || error.response?.status === 404 || error.response?.status === 500) {
        logger.warn("🔄 Fallback to direct Axenta Cloud API for stats");
        try {
          // Получаем токен текущего пользователя
          const userToken = localStorage.getItem("axenta_token");
          if (!userToken) {
            throw new Error("Токен пользователя не найден для статистики");
          }
          
          // Прямое обращение к Axenta Cloud API для статистики с токеном пользователя
          const axentaClient = axios.create({
            baseURL: "https://axenta.cloud/api",
            timeout: 30000,
          });
          
          const response = await axentaClient.get(
            `/cms/objects/?page=1&per_page=1`,
            {
              headers: {
                'Authorization': `Token ${userToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          logger.debug("✅ Direct Axenta Cloud API successful for stats");
          
          // Возвращаем статистику на основе общего количества объектов
          const total = response.data.count || 0;
          
          // Получаем количество объектов в корзине
          let deletedCount = 0;
          try {
            logger.debug("🗑️ Получаем статистику корзины для fallback...");
            const trashStats = await this.getTrashStats();
            deletedCount = trashStats.count;
            logger.debug("🗑️ Статистика корзины получена:", deletedCount);
          } catch (trashError) {
            logger.warn("Не удалось получить статистику корзины:", trashError);
          }
          
          const fallbackStats = {
            total: total,
            active: total, // Предполагаем, что большинство активны
            inactive: 0,
            scheduled_for_delete: 0,
            deleted: deletedCount,
            by_type: {
              vehicle: total
            },
            by_status: {
              active: total
            }
          };
          
          // Обновляем кеш
          this.updateStatsCache(fallbackStats);
          return fallbackStats;
        } catch (axentaError: any) {
          logger.warn("🔄 Fallback to backend /objects/stats endpoint");
          try {
            const response = await this.apiClient.get("/objects/stats");
            logger.debug("✅ Fallback to backend /objects/stats successful");
            const fallbackStats = response.data.data || response.data;
            this.updateStatsCache(fallbackStats);
            return fallbackStats;
          } catch (fallbackError: any) {
            console.error("❌ All fallbacks failed for objects stats:", fallbackError);
            
            // Получаем количество объектов в корзине даже при ошибке основной статистики
            let deletedCount = 0;
            try {
              logger.debug("🗑️ Получаем статистику корзины для основного fallback...");
              const trashStats = await this.getTrashStats();
              deletedCount = trashStats.count;
              logger.debug("🗑️ Статистика корзины получена в fallback:", deletedCount);
            } catch (trashError) {
              logger.warn("Не удалось получить статистику корзины в fallback:", trashError);
            }
            
            // Возвращаем пустую статистику вместо ошибки
            const emptyStats = {
              total: 0,
              active: 0,
              inactive: 0,
              scheduled_for_delete: 0,
              deleted: deletedCount,
              by_type: {},
              by_status: {}
            };
            this.updateStatsCache(emptyStats);
            return emptyStats;
          }
        }
      }
      throw error;
    } finally {
      // Очищаем pending запрос после завершения
      this.pendingStatsRequest = null;
    }
    })();

    return this.pendingStatsRequest;
  }

  // Обновление кеша статистики
  private updateStatsCache(data: {
    total: number;
    active: number;
    inactive: number;
    scheduled_for_delete: number;
    deleted: number;
    by_type: Record<string, number>;
    by_status: Record<string, number>;
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
    logger.debug("🗑️ Кеш статистики объектов очищен");
  }

  // Установка времени жизни кеша статистики
  setStatsCacheTTL(ttlMs: number): void {
    this.statsCache.ttl = ttlMs;
    logger.debug(`⏱️ TTL кеша статистики объектов установлен: ${ttlMs}мс`);
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
  logger.debug("🔧 Creating ObjectsService instance...");
  return ObjectsService.getInstance();
};
export default getObjectsService;
