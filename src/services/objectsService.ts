// Сервис для работы с объектами мониторинга

import { useAuth } from "@/context/auth";
import type {
  CompanyInfo,
  ObjectFilters,
  ObjectForm,
  ObjectTemplate,
  ObjectWithRelations,
  ObjectsResponse,
  ScheduleDeleteForm,
} from "@/types/objects";

export class ObjectsService {
  private static instance: ObjectsService;
  private auth: ReturnType<typeof useAuth> | null = null;

  constructor() {
    console.log("🔧 ObjectsService constructor called");
    try {
      this.auth = useAuth();
      console.log("🔧 Auth context successfully initialized");
    } catch (error) {
      console.warn(
        "🚨 Auth context not available in ObjectsService constructor:",
        error
      );
      this.auth = null;
    }
  }

  private getAuth(): ReturnType<typeof useAuth> {
    if (!this.auth) {
      try {
        this.auth = useAuth();
      } catch (error) {
        throw new Error(
          "Auth context not available. Make sure you are using ObjectsService within a component that has access to auth context."
        );
      }
    }
    return this.auth;
  }

  static getInstance(): ObjectsService {
    if (!ObjectsService.instance) {
      ObjectsService.instance = new ObjectsService();
    }
    return ObjectsService.instance;
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
      // Пробуем аутентифицированный эндпоинт
      const response = await this.getAuth().apiClient.get(
        `/auth/objects?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      console.log("🔍 Error in getObjects:", error.response?.status, error.message);
      // Если аутентификация не прошла или сервер недоступен, используем публичный эндпоинт
      if (error.response?.status === 401 || error.response?.status === 404 || error.response?.status === 500) {
        console.warn("🔄 Fallback to public endpoint for objects");
        try {
          const response = await this.getAuth().apiClient.get(
            `/objects?${params.toString()}`
          );
          console.log("✅ Fallback successful for objects");
          return response.data;
        } catch (fallbackError: any) {
          console.error("❌ Fallback failed for objects:", fallbackError);
          throw fallbackError;
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
      const response = await this.getAuth().apiClient.get(`/auth/objects/${id}`);
      return response.data;
    } catch (error: any) {
      // Если аутентификация не прошла или сервер недоступен, используем публичный эндпоинт
      if (error.response?.status === 401 || error.response?.status === 404 || error.response?.status === 500) {
        console.warn("🔄 Fallback to public endpoint for object");
        const response = await this.getAuth().apiClient.get(`/objects/${id}`);
        return response.data;
      }
      throw error;
    }
  }

  // Создание объекта
  async createObject(
    object: ObjectForm
  ): Promise<{ status: string; data: ObjectWithRelations; error?: string }> {
    const response = await this.getAuth().apiClient.post(
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
    const response = await this.getAuth().apiClient.put(
      `/auth/objects/${id}`,
      object
    );
    return response.data;
  }

  // Удаление объекта (мягкое)
  async deleteObject(
    id: number
  ): Promise<{ status: string; message: string; error?: string }> {
    const response = await this.getAuth().apiClient.delete(
      `/auth/objects/${id}`
    );
    return response.data;
  }

  // Плановое удаление объекта
  async scheduleObjectDelete(
    id: number,
    data: ScheduleDeleteForm
  ): Promise<{ status: string; message: string; data: any; error?: string }> {
    const response = await this.getAuth().apiClient.put(
      `/auth/objects/${id}/schedule-delete`,
      data
    );
    return response.data;
  }

  // Отмена планового удаления
  async cancelScheduledDelete(
    id: number
  ): Promise<{ status: string; message: string; data: any; error?: string }> {
    const response = await this.getAuth().apiClient.put(
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

    const response = await this.getAuth().apiClient.get(
      `/auth/objects-trash?${params.toString()}`
    );
    return response.data;
  }

  // Восстановление объекта из корзины
  async restoreObject(
    id: number
  ): Promise<{ status: string; message: string; data: any; error?: string }> {
    const response = await this.getAuth().apiClient.put(
      `/auth/objects/${id}/restore`
    );
    return response.data;
  }

  // Окончательное удаление объекта
  async permanentDeleteObject(
    id: number
  ): Promise<{ status: string; message: string; error?: string }> {
    const response = await this.getAuth().apiClient.delete(
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

    const response = await this.getAuth().apiClient.get(
      `/object-templates?${params.toString()}`
    );
    return response.data;
  }

  // Получение одного шаблона
  async getObjectTemplate(
    id: number
  ): Promise<{ status: string; data: ObjectTemplate; error?: string }> {
    const response = await this.getAuth().apiClient.get(
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
    const response = await this.getAuth().apiClient.post(
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
    const response = await this.getAuth().apiClient.put(
      `/object-templates/${id}`,
      template
    );
    return response.data;
  }

  // Удаление шаблона
  async deleteObjectTemplate(
    id: number
  ): Promise<{ status: string; message: string; error?: string }> {
    const response = await this.getAuth().apiClient.delete(
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
      // Пробуем аутентифицированный эндпоинт
      const response = await this.getAuth().apiClient.get("/auth/objects/stats");
      return response.data.data;
    } catch (error: any) {
      console.log("🔍 Error in getObjectsStats:", error.response?.status, error.message);
      // Если аутентификация не прошла или сервер недоступен, используем публичный эндпоинт
      if (error.response?.status === 401 || error.response?.status === 404 || error.response?.status === 500) {
        console.warn("🔄 Fallback to public endpoint for objects stats");
        try {
          const response = await this.getAuth().apiClient.get("/objects/stats");
          console.log("✅ Fallback successful for objects stats");
          return response.data.data;
        } catch (fallbackError: any) {
          console.error("❌ Fallback failed for objects stats:", fallbackError);
          throw fallbackError;
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

    const response = await this.getAuth().apiClient.get(
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
      const response = await this.getAuth().apiClient.get("/admin/accounts/list");
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
