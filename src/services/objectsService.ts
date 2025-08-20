// Сервис для работы с объектами мониторинга

import { useAuth } from "@/context/auth";
import type {
  ObjectFilters,
  ObjectForm,
  ObjectTemplate,
  ObjectWithRelations,
  ObjectsResponse,
  ScheduleDeleteForm,
} from "@/types/objects";

export class ObjectsService {
  private static instance: ObjectsService;
  private auth: ReturnType<typeof useAuth>;

  constructor() {
    this.auth = useAuth();
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

    const response = await this.auth.apiClient.get(
      `/cms/objects/?${params.toString()}`
    );
    return response.data;
  }

  // Получение одного объекта
  async getObject(
    id: number
  ): Promise<{ status: string; data: ObjectWithRelations; error?: string }> {
    const response = await this.auth.apiClient.get(`/cms/objects/${id}/`);
    return response.data;
  }

  // Создание объекта
  async createObject(
    object: ObjectForm
  ): Promise<{ status: string; data: ObjectWithRelations; error?: string }> {
    const response = await this.auth.apiClient.post("/cms/objects/", object);
    return response.data;
  }

  // Обновление объекта
  async updateObject(
    id: number,
    object: Partial<ObjectForm>
  ): Promise<{ status: string; data: ObjectWithRelations; error?: string }> {
    const response = await this.auth.apiClient.put(
      `/cms/objects/${id}/`,
      object
    );
    return response.data;
  }

  // Удаление объекта (мягкое)
  async deleteObject(
    id: number
  ): Promise<{ status: string; message: string; error?: string }> {
    const response = await this.auth.apiClient.delete(`/cms/objects/${id}/`);
    return response.data;
  }

  // Плановое удаление объекта
  async scheduleObjectDelete(
    id: number,
    data: ScheduleDeleteForm
  ): Promise<{ status: string; message: string; data: any; error?: string }> {
    const response = await this.auth.apiClient.put(
      `/cms/objects/${id}/schedule-delete/`,
      data
    );
    return response.data;
  }

  // Отмена планового удаления
  async cancelScheduledDelete(
    id: number
  ): Promise<{ status: string; message: string; data: any; error?: string }> {
    const response = await this.auth.apiClient.put(
      `/cms/objects/${id}/cancel-delete/`
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

    const response = await this.auth.apiClient.get(
      `/cms/objects-trash/?${params.toString()}`
    );
    return response.data;
  }

  // Восстановление объекта из корзины
  async restoreObject(
    id: number
  ): Promise<{ status: string; message: string; data: any; error?: string }> {
    const response = await this.auth.apiClient.put(
      `/cms/objects/${id}/restore/`
    );
    return response.data;
  }

  // Окончательное удаление объекта
  async permanentDeleteObject(
    id: number
  ): Promise<{ status: string; message: string; error?: string }> {
    const response = await this.auth.apiClient.delete(
      `/cms/objects/${id}/permanent/`
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

    const response = await this.auth.apiClient.get(
      `/cms/object-templates/?${params.toString()}`
    );
    return response.data;
  }

  // Получение одного шаблона
  async getObjectTemplate(
    id: number
  ): Promise<{ status: string; data: ObjectTemplate; error?: string }> {
    const response = await this.auth.apiClient.get(
      `/cms/object-templates/${id}/`
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
    const response = await this.auth.apiClient.post(
      "/cms/object-templates/",
      template
    );
    return response.data;
  }

  // Обновление шаблона
  async updateObjectTemplate(
    id: number,
    template: Partial<ObjectTemplate>
  ): Promise<{ status: string; data: ObjectTemplate; error?: string }> {
    const response = await this.auth.apiClient.put(
      `/cms/object-templates/${id}/`,
      template
    );
    return response.data;
  }

  // Удаление шаблона
  async deleteObjectTemplate(
    id: number
  ): Promise<{ status: string; message: string; error?: string }> {
    const response = await this.auth.apiClient.delete(
      `/cms/object-templates/${id}/`
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
    const response = await this.auth.apiClient.get("/cms/objects/stats/");
    return response.data.data;
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

    const response = await this.auth.apiClient.get(
      `/cms/objects/export/?${params.toString()}`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  }
}

// Экспортируем singleton instance
export const objectsService = ObjectsService.getInstance();
export default objectsService;
