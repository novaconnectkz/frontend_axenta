import type {
  CacheMetrics,
  CacheStats,
  RealTimeMetrics,
} from "@/types/performance";
import { isDemoModeEnabled } from "@/utils/demoMode";
import { apiClient as api } from "./api";
import {
  cacheConfig,
  generateCacheHistoryData,
  generateRealTimeMetrics,
  mockCacheEvents,
  mockCacheKeyTypes,
  mockCacheMetrics,
  mockCacheStats,
  mockTopCacheKeys,
  updateCacheMetrics,
} from "./mockCacheData";

class CacheService {
  private metricsCache: CacheMetrics = mockCacheMetrics;
  private realTimeInterval: number | null = null;
  private subscribers: ((metrics: CacheMetrics) => void)[] = [];

  // Получение метрик кэша
  async getCacheMetrics(): Promise<CacheMetrics> {
    if (isDemoModeEnabled()) {
      return this.metricsCache;
    }

    try {
      const response = await api.get("/performance/cache/metrics");
      return response.data;
    } catch (error) {
      console.error("Ошибка получения метрик кэша:", error);
      return mockCacheMetrics;
    }
  }

  // Получение статистики кэша
  async getCacheStats(): Promise<CacheStats> {
    if (isDemoModeEnabled()) {
      return mockCacheStats;
    }

    try {
      const response = await api.get("/performance/cache/stats");
      return response.data;
    } catch (error) {
      console.error("Ошибка получения статистики кэша:", error);
      return mockCacheStats;
    }
  }

  // Получение исторических данных
  async getCacheHistory(period: "1h" | "24h" | "7d" | "30d" = "24h") {
    if (isDemoModeEnabled()) {
      return generateCacheHistoryData();
    }

    try {
      const response = await api.get(
        `/performance/cache/history?period=${period}`
      );
      return response.data;
    } catch (error) {
      console.error("Ошибка получения истории кэша:", error);
      return generateCacheHistoryData();
    }
  }

  // Получение топ ключей
  async getTopCacheKeys(limit: number = 10) {
    if (isDemoModeEnabled()) {
      return mockTopCacheKeys.slice(0, limit);
    }

    try {
      const response = await api.get(
        `/performance/cache/top-keys?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Ошибка получения топ ключей:", error);
      return mockTopCacheKeys.slice(0, limit);
    }
  }

  // Получение статистики по типам ключей
  async getCacheKeyTypes() {
    if (isDemoModeEnabled()) {
      return mockCacheKeyTypes;
    }

    try {
      const response = await api.get("/performance/cache/key-types");
      return response.data;
    } catch (error) {
      console.error("Ошибка получения типов ключей:", error);
      return mockCacheKeyTypes;
    }
  }

  // Получение событий кэша
  async getCacheEvents(limit: number = 20) {
    if (isDemoModeEnabled()) {
      return mockCacheEvents.slice(0, limit);
    }

    try {
      const response = await api.get(
        `/performance/cache/events?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Ошибка получения событий кэша:", error);
      return mockCacheEvents.slice(0, limit);
    }
  }

  // Прогрев кэша
  async warmupCache(): Promise<{ success: boolean; message: string }> {
    if (isDemoModeEnabled()) {
      // Симуляция прогрева
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Обновляем метрики после прогрева
      this.metricsCache = {
        ...this.metricsCache,
        hit_rate: Math.min(98, this.metricsCache.hit_rate + 2),
        key_count:
          this.metricsCache.key_count + Math.floor(Math.random() * 100) + 50,
      };

      this.notifySubscribers();

      return {
        success: true,
        message:
          "Кэш успешно прогрет. Загружено основных ключей: " +
          (Math.floor(Math.random() * 500) + 200),
      };
    }

    try {
      const response = await api.post("/performance/cache/warmup");
      return response.data;
    } catch (error) {
      console.error("Ошибка прогрева кэша:", error);
      return {
        success: false,
        message: "Ошибка при прогреве кэша",
      };
    }
  }

  // Очистка кэша
  async clearCache(): Promise<{ success: boolean; message: string }> {
    if (isDemoModeEnabled()) {
      // Симуляция очистки
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Сбрасываем метрики после очистки
      this.metricsCache = {
        ...this.metricsCache,
        hit_count: 0,
        miss_count: 0,
        hit_rate: 0,
        key_count: 0,
        memory_usage: "0.0 MB",
      };

      this.notifySubscribers();

      return {
        success: true,
        message: "Кэш успешно очищен",
      };
    }

    try {
      const response = await api.post("/performance/cache/clear");
      return response.data;
    } catch (error) {
      console.error("Ошибка очистки кэша:", error);
      return {
        success: false,
        message: "Ошибка при очистке кэша",
      };
    }
  }

  // Удаление конкретного ключа
  async deleteKey(key: string): Promise<{ success: boolean; message: string }> {
    if (isDemoModeEnabled()) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Уменьшаем количество ключей
      this.metricsCache = {
        ...this.metricsCache,
        key_count: Math.max(0, this.metricsCache.key_count - 1),
      };

      this.notifySubscribers();

      return {
        success: true,
        message: `Ключ "${key}" успешно удален`,
      };
    }

    try {
      const response = await api.delete(
        `/performance/cache/keys/${encodeURIComponent(key)}`
      );
      return response.data;
    } catch (error) {
      console.error("Ошибка удаления ключа:", error);
      return {
        success: false,
        message: "Ошибка при удалении ключа",
      };
    }
  }

  // Получение информации о конкретном ключе
  async getKeyInfo(key: string) {
    if (isDemoModeEnabled()) {
      const mockKey = mockTopCacheKeys.find((k) =>
        k.key.includes(key.split(":")[0])
      );
      return (
        mockKey || {
          key,
          hits: Math.floor(Math.random() * 1000),
          size: `${(Math.random() * 10).toFixed(1)} MB`,
          ttl: `${Math.floor(Math.random() * 120)}m`,
          type: "string",
        }
      );
    }

    try {
      const response = await api.get(
        `/performance/cache/keys/${encodeURIComponent(key)}`
      );
      return response.data;
    } catch (error) {
      console.error("Ошибка получения информации о ключе:", error);
      return null;
    }
  }

  // Установка TTL для ключа
  async setKeyTTL(
    key: string,
    ttl: number
  ): Promise<{ success: boolean; message: string }> {
    if (isDemoModeEnabled()) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        success: true,
        message: `TTL для ключа "${key}" установлен на ${ttl} секунд`,
      };
    }

    try {
      const response = await api.post(
        `/performance/cache/keys/${encodeURIComponent(key)}/ttl`,
        { ttl }
      );
      return response.data;
    } catch (error) {
      console.error("Ошибка установки TTL:", error);
      return {
        success: false,
        message: "Ошибка при установке TTL",
      };
    }
  }

  // Получение метрик в реальном времени
  getRealTimeMetrics(): RealTimeMetrics {
    if (isDemoModeEnabled()) {
      return generateRealTimeMetrics();
    }

    // В реальном приложении здесь был бы WebSocket или Server-Sent Events
    return generateRealTimeMetrics();
  }

  // Подписка на обновления метрик
  subscribeToMetrics(callback: (metrics: CacheMetrics) => void) {
    this.subscribers.push(callback);

    if (isDemoModeEnabled() && !this.realTimeInterval) {
      this.startRealTimeUpdates();
    }

    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }

      if (this.subscribers.length === 0 && this.realTimeInterval) {
        this.stopRealTimeUpdates();
      }
    };
  }

  // Запуск обновлений в реальном времени (только для демо)
  private startRealTimeUpdates() {
    if (!isDemoModeEnabled()) return;

    this.realTimeInterval = window.setInterval(() => {
      this.metricsCache = updateCacheMetrics(this.metricsCache);
      this.notifySubscribers();
    }, cacheConfig.updateInterval);
  }

  // Остановка обновлений в реальном времени
  private stopRealTimeUpdates() {
    if (this.realTimeInterval) {
      clearInterval(this.realTimeInterval);
      this.realTimeInterval = null;
    }
  }

  // Уведомление подписчиков об обновлении
  private notifySubscribers() {
    this.subscribers.forEach((callback) => callback(this.metricsCache));
  }

  // Экспорт статистики кэша
  async exportCacheStats(format: "json" | "csv" = "json") {
    const metrics = await this.getCacheMetrics();
    const history = await this.getCacheHistory();
    const topKeys = await this.getTopCacheKeys(50);
    const events = await this.getCacheEvents(100);

    const exportData = {
      timestamp: new Date().toISOString(),
      metrics,
      history,
      topKeys,
      events,
      keyTypes: await this.getCacheKeyTypes(),
    };

    if (format === "json") {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cache-stats-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === "csv") {
      // Простой CSV экспорт основных метрик
      const csvData = [
        ["Метрика", "Значение"],
        ["Hit Count", metrics.hit_count.toString()],
        ["Miss Count", metrics.miss_count.toString()],
        ["Hit Rate", `${metrics.hit_rate}%`],
        ["Key Count", metrics.key_count.toString()],
        ["Memory Usage", metrics.memory_usage],
        ["Status", metrics.status],
      ];

      const csvContent = csvData.map((row) => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cache-metrics-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  // Проверка здоровья кэша
  async checkCacheHealth() {
    if (isDemoModeEnabled()) {
      return {
        status: "healthy" as const,
        checks: {
          connection: { status: true, latency: Math.random() * 5 + 1 },
          memory: { status: true, usage: Math.random() * 80 + 10 },
          performance: { status: true, hit_rate: this.metricsCache.hit_rate },
        },
      };
    }

    try {
      const response = await api.get("/performance/cache/health");
      return response.data;
    } catch (error) {
      console.error("Ошибка проверки здоровья кэша:", error);
      return {
        status: "unhealthy" as const,
        checks: {
          connection: { status: false, error: "Connection failed" },
          memory: { status: false, error: "Memory check failed" },
          performance: { status: false, error: "Performance check failed" },
        },
      };
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;
