import { API_BASE_URL } from "@/config/env";
import type {
  EquipmentBase,
  EquipmentCategory,
  EquipmentFilters,
  EquipmentForm,
  EquipmentInstallForm,
  EquipmentResponse,
  EquipmentStats,
  EquipmentTransferForm,
  LowStockItem,
  StockAlert,
  StockAlertFilters,
  StockAlertForm,
  StockAlertResponse,
  WarehouseOperation,
  WarehouseOperationFilters,
  WarehouseOperationForm,
  WarehouseOperationResponse,
} from "@/types/warehouse";
import type { WarehouseStats } from "@/types/dashboard";
import {
  getMockEquipment,
  getMockStockAlerts,
  getMockWarehouseOperations,
  mockEquipmentCategories,
  mockWarehouseStats,
  simulateDelay,
} from "./mockWarehouseData";

class WarehouseService {
  private apiUrl = `${API_BASE_URL}/api`;
  private useMockData = true; // Переключатель для использования mock данных

  // === ОБОРУДОВАНИЕ ===

  // Получить список оборудования
  async getEquipment(filters: EquipmentFilters = {}): Promise<EquipmentResponse> {
    if (this.useMockData) {
      await simulateDelay();
      const filteredEquipment = getMockEquipment(filters);
      
      // Простая пагинация для mock данных
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedData = filteredEquipment.slice(start, end);

      return {
        data: paginatedData,
        pagination: {
          page,
          limit,
          total: filteredEquipment.length,
          pages: Math.ceil(filteredEquipment.length / limit),
        },
      };
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${this.apiUrl}/equipment?${params}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка загрузки оборудования: ${response.statusText}`);
    }

    return response.json();
  }

  // Получить оборудование по ID
  async getEquipmentById(id: number): Promise<EquipmentBase> {
    if (this.useMockData) {
      await simulateDelay();
      const equipment = getMockEquipment().find(eq => eq.id === id);
      if (!equipment) {
        throw new Error("Оборудование не найдено");
      }
      return equipment;
    }

    const response = await fetch(`${this.apiUrl}/equipment/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка загрузки оборудования: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // Создать оборудование
  async createEquipment(equipment: EquipmentForm): Promise<EquipmentBase> {
    if (this.useMockData) {
      await simulateDelay();
      // Симуляция создания
      const newEquipment: EquipmentBase = {
        id: Date.now(),
        ...equipment,
        imei: equipment.imei || "",
        phone_number: equipment.phone_number || "",
        mac_address: equipment.mac_address || "",
        qr_code: equipment.qr_code || `EQ-${Date.now()}-${equipment.serial_number}`,
        status: equipment.status || "in_stock",
        condition: equipment.condition || "new",
        object_id: null,
        specifications: equipment.specifications || "{}",
        notes: equipment.notes || "",
        last_maintenance_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: equipment.category_id 
          ? mockEquipmentCategories.find(c => c.id === equipment.category_id)
          : undefined,
      };
      return newEquipment;
    }

    const response = await fetch(`${this.apiUrl}/equipment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
      body: JSON.stringify(equipment),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Ошибка создания оборудования: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // Обновить оборудование
  async updateEquipment(id: number, equipment: Partial<EquipmentForm>): Promise<EquipmentBase> {
    if (this.useMockData) {
      await simulateDelay();
      // Симуляция обновления
      const existingEquipment = getMockEquipment().find(eq => eq.id === id);
      if (!existingEquipment) {
        throw new Error("Оборудование не найдено");
      }
      return {
        ...existingEquipment,
        ...equipment,
        updated_at: new Date().toISOString(),
      };
    }

    const response = await fetch(`${this.apiUrl}/equipment/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
      body: JSON.stringify(equipment),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Ошибка обновления оборудования: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // Удалить оборудование
  async deleteEquipment(id: number): Promise<void> {
    if (this.useMockData) {
      await simulateDelay();
      // Симуляция удаления
      return;
    }

    const response = await fetch(`${this.apiUrl}/equipment/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Ошибка удаления оборудования: ${response.statusText}`);
    }
  }

  // Установить оборудование на объект
  async installEquipment(id: number, data: EquipmentInstallForm): Promise<EquipmentBase> {
    if (this.useMockData) {
      await simulateDelay();
      const equipment = getMockEquipment().find(eq => eq.id === id);
      if (!equipment) {
        throw new Error("Оборудование не найдено");
      }
      return {
        ...equipment,
        status: "installed",
        object_id: data.object_id,
        warehouse_location: "",
        updated_at: new Date().toISOString(),
      };
    }

    const response = await fetch(`${this.apiUrl}/equipment/${id}/install`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Ошибка установки оборудования: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // Снять оборудование с объекта
  async uninstallEquipment(id: number): Promise<EquipmentBase> {
    if (this.useMockData) {
      await simulateDelay();
      const equipment = getMockEquipment().find(eq => eq.id === id);
      if (!equipment) {
        throw new Error("Оборудование не найдено");
      }
      return {
        ...equipment,
        status: "in_stock",
        object_id: null,
        warehouse_location: "A1-01",
        updated_at: new Date().toISOString(),
      };
    }

    const response = await fetch(`${this.apiUrl}/equipment/${id}/uninstall`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Ошибка снятия оборудования: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // Получить статистику оборудования
  async getEquipmentStats(): Promise<EquipmentStats> {
    if (this.useMockData) {
      await simulateDelay();
      const equipment = getMockEquipment();
      
      // Подсчитываем статистику из mock данных
      const stats: EquipmentStats = {
        total: equipment.length,
        in_stock: equipment.filter(eq => eq.status === "in_stock").length,
        installed: equipment.filter(eq => eq.status === "installed").length,
        maintenance: equipment.filter(eq => eq.status === "maintenance").length,
        broken: equipment.filter(eq => eq.status === "broken").length,
        retired: equipment.filter(eq => eq.status === "disposed").length,
        needs_maintenance: equipment.filter(eq => 
          eq.last_maintenance_at && 
          new Date(eq.last_maintenance_at) < new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
        ).length,
        expired_warranty: equipment.filter(eq => 
          eq.warranty_until && new Date(eq.warranty_until) < new Date()
        ).length,
        by_type: {},
        by_manufacturer: {},
      };

      // Группировка по типам
      equipment.forEach(eq => {
        stats.by_type[eq.type] = (stats.by_type[eq.type] || 0) + 1;
        stats.by_manufacturer[eq.brand] = (stats.by_manufacturer[eq.brand] || 0) + 1;
      });

      return stats;
    }

    const response = await fetch(`${this.apiUrl}/equipment/statistics`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка загрузки статистики: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // Получить оборудование с низкими остатками
  async getLowStockEquipment(threshold: number = 5): Promise<LowStockItem[]> {
    if (this.useMockData) {
      await simulateDelay();
      // Симуляция низких остатков
      return [
        {
          type: "IP-camera",
          model: "DS-2CD2043G2-I",
          manufacturer: "Hikvision",
          in_stock: 3,
          total: 15,
          threshold: 10,
        },
        {
          type: "Cable",
          model: "UTP Cat6",
          manufacturer: "CommScope",
          in_stock: 2,
          total: 8,
          threshold: 50,
        },
      ];
    }

    const response = await fetch(`${this.apiUrl}/equipment/low-stock?threshold=${threshold}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка загрузки данных о низких остатках: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // Поиск по QR коду
  async searchByQRCode(qrCode: string): Promise<EquipmentBase> {
    if (this.useMockData) {
      await simulateDelay();
      const equipment = getMockEquipment().find(eq => eq.qr_code === qrCode);
      if (!equipment) {
        throw new Error("Оборудование с таким QR кодом не найдено");
      }
      return equipment;
    }

    const response = await fetch(`${this.apiUrl}/equipment/qr/${encodeURIComponent(qrCode)}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Ошибка поиска по QR коду: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // === КАТЕГОРИИ ОБОРУДОВАНИЯ ===

  // Получить категории оборудования
  async getEquipmentCategories(activeOnly: boolean = false): Promise<EquipmentCategory[]> {
    if (this.useMockData) {
      await simulateDelay();
      let categories = [...mockEquipmentCategories];
      if (activeOnly) {
        categories = categories.filter(cat => cat.is_active);
      }
      return categories;
    }

    const params = activeOnly ? "?active=true" : "";
    const response = await fetch(`${this.apiUrl}/equipment/categories${params}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка загрузки категорий: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // Создать категорию
  async createEquipmentCategory(category: Omit<EquipmentCategory, "id" | "created_at" | "updated_at">): Promise<EquipmentCategory> {
    if (this.useMockData) {
      await simulateDelay();
      const newCategory: EquipmentCategory = {
        id: Date.now(),
        ...category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return newCategory;
    }

    const response = await fetch(`${this.apiUrl}/equipment/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
      body: JSON.stringify(category),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Ошибка создания категории: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // Обновить категорию
  async updateEquipmentCategory(id: number, category: Partial<EquipmentCategory>): Promise<EquipmentCategory> {
    if (this.useMockData) {
      await simulateDelay();
      const existingCategory = mockEquipmentCategories.find(cat => cat.id === id);
      if (!existingCategory) {
        throw new Error("Категория не найдена");
      }
      return {
        ...existingCategory,
        ...category,
        updated_at: new Date().toISOString(),
      };
    }

    const response = await fetch(`${this.apiUrl}/equipment/categories/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
      body: JSON.stringify(category),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Ошибка обновления категории: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // Удалить категорию
  async deleteEquipmentCategory(id: number): Promise<void> {
    if (this.useMockData) {
      await simulateDelay();
      return;
    }

    const response = await fetch(`${this.apiUrl}/equipment/categories/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Ошибка удаления категории: ${response.statusText}`);
    }
  }

  // === СКЛАДСКИЕ ОПЕРАЦИИ ===

  // Получить складские операции
  async getWarehouseOperations(filters: WarehouseOperationFilters = {}): Promise<WarehouseOperationResponse> {
    if (this.useMockData) {
      await simulateDelay();
      const filteredOperations = getMockWarehouseOperations(filters);
      
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedData = filteredOperations.slice(start, end);

      return {
        data: paginatedData,
        pagination: {
          page,
          limit,
          total: filteredOperations.length,
          pages: Math.ceil(filteredOperations.length / limit),
        },
      };
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${this.apiUrl}/warehouse/operations?${params}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка загрузки операций: ${response.statusText}`);
    }

    return response.json();
  }

  // Создать складскую операцию
  async createWarehouseOperation(operation: WarehouseOperationForm): Promise<WarehouseOperation> {
    if (this.useMockData) {
      await simulateDelay();
      const newOperation: WarehouseOperation = {
        id: Date.now(),
        ...operation,
        quantity: operation.quantity || 1,
        from_location: operation.from_location || "",
        document_number: operation.document_number || `DOC-${Date.now()}`,
        notes: operation.notes || "",
        installation_id: operation.installation_id || null,
        status: "completed",
        company_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return newOperation;
    }

    const response = await fetch(`${this.apiUrl}/warehouse/operations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
      body: JSON.stringify(operation),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Ошибка создания операции: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // Перемещение оборудования
  async transferEquipment(data: EquipmentTransferForm): Promise<WarehouseOperation> {
    if (this.useMockData) {
      await simulateDelay();
      const operation: WarehouseOperation = {
        id: Date.now(),
        type: "transfer",
        description: "Перемещение оборудования",
        status: "completed",
        equipment_id: data.equipment_id,
        quantity: 1,
        from_location: data.from_location,
        to_location: data.to_location,
        user_id: data.user_id,
        document_number: `TRN-${Date.now()}`,
        notes: data.notes || "",
        installation_id: null,
        company_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return operation;
    }

    const response = await fetch(`${this.apiUrl}/warehouse/transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Ошибка перемещения оборудования: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // === УВЕДОМЛЕНИЯ ===

  // Получить уведомления склада
  async getStockAlerts(filters: StockAlertFilters = {}): Promise<StockAlertResponse> {
    if (this.useMockData) {
      await simulateDelay();
      const filteredAlerts = getMockStockAlerts(filters);
      
      return {
        data: filteredAlerts,
      };
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${this.apiUrl}/warehouse/alerts?${params}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка загрузки уведомлений: ${response.statusText}`);
    }

    return response.json();
  }

  // Создать уведомление
  async createStockAlert(alert: StockAlertForm): Promise<StockAlert> {
    if (this.useMockData) {
      await simulateDelay();
      const newAlert: StockAlert = {
        id: Date.now(),
        ...alert,
        equipment_id: alert.equipment_id || null,
        equipment_category_id: alert.equipment_category_id || null,
        status: "active",
        read_at: null,
        resolved_at: null,
        assigned_user_id: alert.assigned_user_id || null,
        metadata: alert.metadata || "{}",
        company_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return newAlert;
    }

    const response = await fetch(`${this.apiUrl}/warehouse/alerts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
      body: JSON.stringify(alert),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Ошибка создания уведомления: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // Отметить уведомление как прочитанное
  async acknowledgeStockAlert(id: number): Promise<StockAlert> {
    if (this.useMockData) {
      await simulateDelay();
      const alert = getMockStockAlerts().find(a => a.id === id);
      if (!alert) {
        throw new Error("Уведомление не найдено");
      }
      return {
        ...alert,
        status: "acknowledged",
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const response = await fetch(`${this.apiUrl}/warehouse/alerts/${id}/acknowledge`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Ошибка обновления уведомления: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // Разрешить уведомление
  async resolveStockAlert(id: number): Promise<StockAlert> {
    if (this.useMockData) {
      await simulateDelay();
      const alert = getMockStockAlerts().find(a => a.id === id);
      if (!alert) {
        throw new Error("Уведомление не найдено");
      }
      return {
        ...alert,
        status: "resolved",
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const response = await fetch(`${this.apiUrl}/warehouse/alerts/${id}/resolve`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Ошибка разрешения уведомления: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // === СТАТИСТИКА ===

  // Получить статистику склада
  async getWarehouseStats(): Promise<WarehouseStats> {
    if (this.useMockData) {
      await simulateDelay();
      return { ...mockWarehouseStats };
    }

    const response = await fetch(`${this.apiUrl}/warehouse/statistics`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantId") || "",
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка загрузки статистики склада: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // === УТИЛИТЫ ===

  // Переключить использование mock данных
  setUseMockData(useMock: boolean): void {
    this.useMockData = useMock;
  }

  // Проверить, используются ли mock данные
  isUsingMockData(): boolean {
    return this.useMockData;
  }
}

// Экспортируем экземпляр сервиса
export const warehouseService = new WarehouseService();
