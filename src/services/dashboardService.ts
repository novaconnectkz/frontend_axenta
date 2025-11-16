// import { useAuth } from "@/context/auth"; // Временно отключаем
import { config } from "@/config/env";
import type {
  ActivityItem,
  ChartData,
  DashboardLayout,
  DashboardStats,
  NotificationItem,
} from "@/types/dashboard";
import axios from "axios";
import { ObjectsService } from "./objectsService";
import { usersService } from "./usersService";
import {
  getMockWidgetData,
  mockChartData,
  mockDashboardLayouts,
  mockDashboardStats,
  mockNotifications,
  mockRecentActivity,
  simulateDelay,
} from "./mockDashboardData";

class DashboardService {
  // private auth = useAuth(); // Временно отключаем

  // Флаг для использования mock-данных (временно включен)
  private useMockData = true;
  // Ключ и TTL для персистентного кэша в localStorage
  private persistentCacheTTL = 5 * 60 * 1000; // 5 минут
  private getPersistentKey(): string {
    // Пытаемся привязать к компании, если она сохранена в auth-хранилище
    try {
      const companyRaw = localStorage.getItem("axenta_company");
      if (companyRaw) {
        const company = JSON.parse(companyRaw);
        if (company && (company.id || company.company_id)) {
          const id = company.id ?? company.company_id;
          return `axenta_dashboard_stats_${id}`;
        }
      }
    } catch {
      // noop — если парсинг не удался, падаем на общий ключ
    }
    return "axenta_dashboard_stats";
  }
  private readPersistentCache():
    | { data: DashboardStats; timestamp: number }
    | null {
    try {
      const raw = localStorage.getItem(this.getPersistentKey());
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed === "object" &&
        parsed.data &&
        typeof parsed.timestamp === "number"
      ) {
        return parsed;
      }
    } catch {
      // игнорируем битые данные
    }
    return null;
  }
  private writePersistentCache(data: DashboardStats): void {
    try {
      const payload = JSON.stringify({
        data,
        timestamp: Date.now(),
      });
      localStorage.setItem(this.getPersistentKey(), payload);
    } catch {
      // Если localStorage недоступен/переполнен — безопасно игнорируем
    }
  }
  
  // Флаг для использования реальных данных объектов
  private useRealObjectsData = true;
  
  // Флаг для использования реальных данных пользователей
  private useRealUsersData = true;

  // Кеширование статистики
  private statsCache: {
    data: DashboardStats | null;
    timestamp: number;
    ttl: number; // Время жизни кеша в миллисекундах (10 секунд)
  } = {
    data: null,
    timestamp: 0,
    ttl: 10000, // 10 секунд
  };

  // Дедупликация запросов - храним активные Promise'ы
  private pendingStatsRequest: Promise<DashboardStats> | null = null;

  // Простой API клиент без auth зависимостей
  private get apiClient() {
    const token = localStorage.getItem("axenta_token");
    return axios.create({
      baseURL: config.apiBaseUrl,
      timeout: config.apiTimeout,
      headers: {
        "Content-Type": "application/json",
        ...(token && { authorization: `Token ${token}` }),
      },
    });
  }

  // Получение общей статистики для Dashboard с кешированием и дедупликацией
  async getStats(forceRefresh: boolean = false): Promise<DashboardStats> {
    // 1) Проверяем in-memory кеш, если не требуется принудительное обновление
    if (!forceRefresh && this.statsCache.data) {
      const now = Date.now();
      const age = now - this.statsCache.timestamp;
      
      if (age < this.statsCache.ttl) {
        console.log(`📦 Используем кешированные данные статистики (возраст: ${Math.round(age / 1000)}с)`);
        return this.statsCache.data;
      }
    }

    // 2) Если нет актуального in-memory кэша — пробуем persistent (localStorage)
    if (!forceRefresh) {
      const persisted = this.readPersistentCache();
      if (persisted) {
        const now = Date.now();
        const age = now - persisted.timestamp;
        // Возвращаем сохранённые данные сразу (даже если устарели), а обновление запустим в фоне
        if (!this.statsCache.data) {
          // Синхронизируем быстрый in-memory, чтобы компоненты имели реактивные данные
          this.statsCache.data = persisted.data;
          this.statsCache.timestamp = persisted.timestamp;
        }
        // Стартуем фоновое обновление, если данные старше TTL персистентного кэша
        if (age >= this.persistentCacheTTL) {
          // Не ждём результата — обновление в фоне с дедупликацией
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          this.getStats(true);
        }
        console.log(
          `💾 Возвращаем данные из persistent-кэша (возраст: ${Math.round(age / 1000)}с)`
        );
        return persisted.data;
      }
    }

    // Если запрос уже выполняется, возвращаем тот же Promise
    if (this.pendingStatsRequest) {
      console.log("🔄 Запрос статистики уже выполняется, используем существующий Promise");
      return this.pendingStatsRequest;
    }
    // Создаем новый Promise для запроса
    this.pendingStatsRequest = (async () => {
      try {
        // Если полностью используем mock-данные, возвращаем их
        if (this.useMockData && !this.useRealObjectsData && !this.useRealUsersData) {
          await simulateDelay(100); // Небольшая задержка для реалистичности
          const result = mockDashboardStats;
          this.updateCache(result);
          return result;
        }

        let objectsStats;
        let usersStats;
        
        // Получаем данные об объектах
        if (this.useRealObjectsData) {
          console.log("📊 Loading real objects data...");
          const objectsService = ObjectsService.getInstance();
          const realObjectsStats = await objectsService.getObjectsStats();
          console.log("📊 Real objects stats:", realObjectsStats);
          console.log("🗑️ Количество удаленных объектов для дашборда:", realObjectsStats.deleted);
          
          objectsStats = {
            total: realObjectsStats.total,
            active: realObjectsStats.active,
            inactive: realObjectsStats.inactive,
            scheduled_for_deletion: realObjectsStats.scheduled_for_delete,
            deleted: realObjectsStats.deleted
          };
          
          console.log("📊 Objects stats для дашборда:", objectsStats);
        } else {
          objectsStats = mockDashboardStats.objects;
        }
        
        // Получаем данные о пользователях
        if (this.useRealUsersData) {
          console.log("📊 Loading real users data...");
          const realUsersStats = await usersService.getUsersStats();
          console.log("📊 Real users stats:", realUsersStats);
          
          usersStats = {
            total: realUsersStats.total,
            active: realUsersStats.active,
            inactive: realUsersStats.inactive,
            admins: realUsersStats.admins,
            regular_users: realUsersStats.regular_users
          };
        } else {
          usersStats = mockDashboardStats.users;
        }
        
        // Собираем итоговую статистику
        const dashboardStats: DashboardStats = {
          objects: objectsStats,
          users: usersStats,
          // Для остальных разделов пока используем mock данные
          billing: mockDashboardStats.billing,
          installations: mockDashboardStats.installations,
          warehouse: mockDashboardStats.warehouse
        };
        
        // Обновляем кеш
        this.updateCache(dashboardStats);
        
        return dashboardStats;
      } catch (error) {
        console.error("Ошибка получения статистики:", error);
        // В случае ошибки возвращаем mock данные как fallback
        console.warn("🔄 Fallback to mock data for dashboard stats");
        const fallbackStats = mockDashboardStats;
        this.updateCache(fallbackStats);
        return fallbackStats;
      } finally {
        // Очищаем pending запрос после завершения
        this.pendingStatsRequest = null;
      }
    })();

    return this.pendingStatsRequest;
  }

  // Обновление кеша
  private updateCache(data: DashboardStats): void {
    this.statsCache = {
      data,
      timestamp: Date.now(),
      ttl: this.statsCache.ttl,
    };
    // Так же обновляем persistent-кэш
    this.writePersistentCache(data);
  }

  // Очистка кеша (для принудительного обновления)
  clearStatsCache(): void {
    this.statsCache = {
      data: null,
      timestamp: 0,
      ttl: this.statsCache.ttl,
    };
    console.log("🗑️ Кеш статистики очищен");
  }

  // Установка времени жизни кеша
  setCacheTTL(ttlMs: number): void {
    this.statsCache.ttl = ttlMs;
    console.log(`⏱️ TTL кеша статистики установлен: ${ttlMs}мс`);
  }

  // Получение последней активности
  async getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
    if (this.useMockData) {
      await simulateDelay(50);
      return mockRecentActivity.slice(0, limit);
    }

    try {
      const response = await this.apiClient.get(
        `/dashboard/activity?limit=${limit}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Ошибка получения активности:", error);
      throw error;
    }
  }

  // Получение уведомлений
  async getNotifications(
    limit: number = 5,
    unreadOnly: boolean = false
  ): Promise<NotificationItem[]> {
    if (this.useMockData) {
      await simulateDelay(30);
      let notifications = mockNotifications;
      if (unreadOnly) {
        notifications = notifications.filter((n) => !n.read);
      }
      return notifications.slice(0, limit);
    }

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(unreadOnly && { unread_only: "true" }),
      });

      const response = await this.apiClient.get(`/notifications?${params}`);
      return response.data.data;
    } catch (error) {
      console.error("Ошибка получения уведомлений:", error);
      throw error;
    }
  }

  // Отметка уведомления как прочитанного
  async markNotificationAsRead(notificationId: string): Promise<void> {
    if (this.useMockData) {
      await simulateDelay(20);
      // В mock режиме просто симулируем успешную операцию
      return;
    }

    try {
      await this.apiClient.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error("Ошибка отметки уведомления:", error);
      throw error;
    }
  }

  // Получение данных для графиков
  async getChartData(
    type: string,
    range: string = "month"
  ): Promise<ChartData> {
    if (this.useMockData) {
      await simulateDelay(50);
      const chartKey = `${type}-${range}`;
      return mockChartData[chartKey] || mockChartData["objects-monthly"];
    }

    try {
      const response = await this.apiClient.get(
        `/dashboard/charts/${type}?range=${range}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Ошибка получения данных графика:", error);
      throw error;
    }
  }

  // Сохранение конфигурации Dashboard
  async saveLayout(layout: DashboardLayout): Promise<DashboardLayout> {
    if (this.useMockData) {
      await simulateDelay(100);
      // В mock режиме просто возвращаем макет с ID если его нет
      const savedLayout = {
        ...layout,
        id: layout.id || `layout-${Date.now()}`,
      };
      return savedLayout;
    }

    try {
      if (layout.id) {
        const response = await this.apiClient.put(
          `/dashboard/layouts/${layout.id}`,
          layout
        );
        return response.data.data;
      } else {
        const response = await this.apiClient.post(
          "/dashboard/layouts",
          layout
        );
        return response.data.data;
      }
    } catch (error) {
      console.error("Ошибка сохранения макета:", error);
      throw error;
    }
  }

  // Получение сохраненных макетов
  async getLayouts(): Promise<DashboardLayout[]> {
    if (this.useMockData) {
      await simulateDelay(30);
      return mockDashboardLayouts;
    }

    try {
      const response = await this.apiClient.get("/dashboard/layouts");
      return response.data.data;
    } catch (error) {
      console.error("Ошибка получения макетов:", error);
      throw error;
    }
  }

  // Получение макета по умолчанию
  async getDefaultLayout(): Promise<DashboardLayout | null> {
    if (this.useMockData) {
      await simulateDelay(20);
      return (
        mockDashboardLayouts.find((layout) => layout.isDefault) ||
        mockDashboardLayouts[0] ||
        null
      );
    }

    try {
      const response = await this.apiClient.get("/dashboard/layouts/default");
      return response.data.data;
    } catch (error) {
      console.error("Ошибка получения макета по умолчанию:", error);
      return null;
    }
  }

  // Установка макета по умолчанию
  async setDefaultLayout(layoutId: string): Promise<void> {
    if (this.useMockData) {
      await simulateDelay(50);
      // В mock режиме просто симулируем успешную операцию
      return;
    }

    try {
      await this.apiClient.put(`/dashboard/layouts/${layoutId}/default`);
    } catch (error) {
      console.error("Ошибка установки макета по умолчанию:", error);
      throw error;
    }
  }

  // Удаление макета
  async deleteLayout(layoutId: string): Promise<void> {
    if (this.useMockData) {
      await simulateDelay(50);
      // В mock режиме просто симулируем успешную операцию
      return;
    }

    try {
      await this.apiClient.delete(`/dashboard/layouts/${layoutId}`);
    } catch (error) {
      console.error("Ошибка удаления макета:", error);
      throw error;
    }
  }

  // Получение данных для конкретного виджета
  async getWidgetData(widgetType: string, config: any = {}): Promise<any> {
    if (this.useMockData) {
      await simulateDelay(50);
      return getMockWidgetData(widgetType, config);
    }

    try {
      const response = await this.apiClient.post(
        `/dashboard/widgets/${widgetType}/data`,
        config
      );
      return response.data.data;
    } catch (error) {
      console.error(`Ошибка получения данных виджета ${widgetType}:`, error);
      throw error;
    }
  }

  // Публичный метод для переключения режима mock-данных
  setMockMode(enabled: boolean): void {
    this.useMockData = enabled;
  }

  // Получение текущего состояния mock-режима
  isMockMode(): boolean {
    return this.useMockData;
  }

  // Публичный метод для переключения режима реальных данных объектов
  setRealObjectsDataMode(enabled: boolean): void {
    this.useRealObjectsData = enabled;
  }

  // Получение текущего состояния режима реальных данных объектов
  isRealObjectsDataMode(): boolean {
    return this.useRealObjectsData;
  }

  // Публичный метод для переключения режима реальных данных пользователей
  setRealUsersDataMode(enabled: boolean): void {
    this.useRealUsersData = enabled;
  }

  // Получение текущего состояния режима реальных данных пользователей
  isRealUsersDataMode(): boolean {
    return this.useRealUsersData;
  }
}

export const dashboardService = new DashboardService();
