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

  // Получение общей статистики для Dashboard
  async getStats(): Promise<DashboardStats> {
    if (this.useMockData) {
      await simulateDelay(100); // Небольшая задержка для реалистичности
      return mockDashboardStats;
    }

    try {
      const response = await this.apiClient.get("/dashboard/stats");
      return response.data.data;
    } catch (error) {
      console.error("Ошибка получения статистики:", error);
      throw error;
    }
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
}

export const dashboardService = new DashboardService();
