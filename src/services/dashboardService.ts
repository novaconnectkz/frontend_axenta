// import { useAuth } from "@/context/auth"; // Временно отключаем
import axios from 'axios';
import { config } from '@/config/env';
import type {
  ActivityItem,
  ChartData,
  DashboardLayout,
  DashboardStats,
  NotificationItem,
} from "@/types/dashboard";

class DashboardService {
  // private auth = useAuth(); // Временно отключаем
  
  // Простой API клиент без auth зависимостей
  private get apiClient() {
    const token = localStorage.getItem('axenta_token');
    return axios.create({
      baseURL: config.apiBaseUrl,
      timeout: config.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'authorization': `Token ${token}` })
      }
    });
  }

  // Получение общей статистики для Dashboard
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await this.apiClient.get("/api/dashboard/stats");
      return response.data.data;
    } catch (error) {
      console.error("Ошибка получения статистики:", error);
      throw error;
    }
  }

  // Получение последней активности
  async getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
    try {
      const response = await this.apiClient.get(
        `/api/dashboard/activity?limit=${limit}`
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
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(unreadOnly && { unread_only: "true" }),
      });

      const response = await this.apiClient.get(
        `/api/notifications?${params}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Ошибка получения уведомлений:", error);
      throw error;
    }
  }

  // Отметка уведомления как прочитанного
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await this.apiClient.put(
        `/api/notifications/${notificationId}/read`
      );
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
    try {
      const response = await this.apiClient.get(
        `/api/dashboard/charts/${type}?range=${range}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Ошибка получения данных графика:", error);
      throw error;
    }
  }

  // Сохранение конфигурации Dashboard
  async saveLayout(layout: DashboardLayout): Promise<DashboardLayout> {
    try {
      if (layout.id) {
        const response = await this.apiClient.put(
          `/api/dashboard/layouts/${layout.id}`,
          layout
        );
        return response.data.data;
      } else {
        const response = await this.apiClient.post(
          "/api/dashboard/layouts",
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
    try {
      const response = await this.apiClient.get("/api/dashboard/layouts");
      return response.data.data;
    } catch (error) {
      console.error("Ошибка получения макетов:", error);
      throw error;
    }
  }

  // Получение макета по умолчанию
  async getDefaultLayout(): Promise<DashboardLayout | null> {
    try {
      const response = await this.apiClient.get(
        "/api/dashboard/layouts/default"
      );
      return response.data.data;
    } catch (error) {
      console.error("Ошибка получения макета по умолчанию:", error);
      return null;
    }
  }

  // Установка макета по умолчанию
  async setDefaultLayout(layoutId: string): Promise<void> {
    try {
      await this.apiClient.put(
        `/api/dashboard/layouts/${layoutId}/default`
      );
    } catch (error) {
      console.error("Ошибка установки макета по умолчанию:", error);
      throw error;
    }
  }

  // Удаление макета
  async deleteLayout(layoutId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/api/dashboard/layouts/${layoutId}`);
    } catch (error) {
      console.error("Ошибка удаления макета:", error);
      throw error;
    }
  }

  // Получение данных для конкретного виджета
  async getWidgetData(widgetType: string, config: any = {}): Promise<any> {
    try {
      const response = await this.apiClient.post(
        `/api/dashboard/widgets/${widgetType}/data`,
        config
      );
      return response.data.data;
    } catch (error) {
      console.error(`Ошибка получения данных виджета ${widgetType}:`, error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
