import { ref, computed } from 'vue';
import { getObjectsService } from './objectsService';
import { dashboardService } from './dashboardService';
import { useAuth } from '@/context/auth';

interface RefreshConfig {
  enabled: boolean;
  interval: number; // в миллисекундах
  lastUpdate: Date | null;
  errorCount: number;
  maxErrors: number;
}

interface RefreshStats {
  totalRefreshes: number;
  successfulRefreshes: number;
  failedRefreshes: number;
  lastSuccessfulRefresh: Date | null;
  lastError: string | null;
}

class AxentaAutoRefreshService {
  private static instance: AxentaAutoRefreshService;
  
  private refreshTimer: NodeJS.Timeout | null = null;
  private config = ref<RefreshConfig>({
    enabled: false,
    interval: 30000, // 30 секунд по умолчанию
    lastUpdate: null,
    errorCount: 0,
    maxErrors: 5
  });
  
  private stats = ref<RefreshStats>({
    totalRefreshes: 0,
    successfulRefreshes: 0,
    failedRefreshes: 0,
    lastSuccessfulRefresh: null,
    lastError: null
  });
  
  private subscribers = new Set<() => void>();
  private auth: ReturnType<typeof useAuth> | null = null;

  static getInstance(): AxentaAutoRefreshService {
    if (!AxentaAutoRefreshService.instance) {
      AxentaAutoRefreshService.instance = new AxentaAutoRefreshService();
    }
    return AxentaAutoRefreshService.instance;
  }

  private constructor() {
    // Загружаем настройки из localStorage
    this.loadConfig();
    
    // Автоматически запускаем, если было включено
    if (this.config.value.enabled) {
      this.start();
    }
  }

  // Ленивая инициализация auth контекста
  private getAuth() {
    if (!this.auth) {
      try {
        this.auth = useAuth();
      } catch (error) {
        console.warn('⚠️ Auth context не доступен, автообновление будет пропущено');
        return null;
      }
    }
    return this.auth;
  }

  // Геттеры для реактивных данных
  get isEnabled() {
    return computed(() => this.config.value.enabled);
  }

  get interval() {
    return computed(() => this.config.value.interval);
  }

  get lastUpdate() {
    return computed(() => this.config.value.lastUpdate);
  }

  get refreshStats() {
    return computed(() => this.stats.value);
  }

  get nextRefreshIn() {
    return computed(() => {
      if (!this.config.value.enabled || !this.config.value.lastUpdate) {
        return null;
      }
      
      const nextRefresh = new Date(this.config.value.lastUpdate.getTime() + this.config.value.interval);
      const now = new Date();
      const diff = nextRefresh.getTime() - now.getTime();
      
      return diff > 0 ? Math.ceil(diff / 1000) : 0;
    });
  }

  // Запуск автоматического обновления
  start() {
    if (this.refreshTimer) {
      this.stop();
    }

    this.config.value.enabled = true;
    this.config.value.errorCount = 0;
    this.saveConfig();

    console.log('🔄 Запуск автоматического обновления данных Axenta каждые', this.config.value.interval / 1000, 'секунд');

    this.refreshTimer = setInterval(() => {
      this.performRefresh();
    }, this.config.value.interval);

    // Выполняем первое обновление сразу
    this.performRefresh();
    
    this.notifySubscribers();
  }

  // Остановка автоматического обновления
  stop() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.config.value.enabled = false;
    this.saveConfig();

    console.log('⏹️ Автоматическое обновление данных Axenta остановлено');
    
    this.notifySubscribers();
  }

  // Установка интервала обновления
  setInterval(intervalSeconds: number) {
    const intervalMs = intervalSeconds * 1000;
    
    if (intervalMs < 5000) { // Минимум 5 секунд
      throw new Error('Минимальный интервал обновления: 5 секунд');
    }
    
    if (intervalMs > 300000) { // Максимум 5 минут
      throw new Error('Максимальный интервал обновления: 5 минут');
    }

    this.config.value.interval = intervalMs;
    this.saveConfig();

    // Перезапускаем с новым интервалом, если было включено
    if (this.config.value.enabled) {
      this.start();
    }

    console.log('⏱️ Интервал обновления изменен на', intervalSeconds, 'секунд');
    
    this.notifySubscribers();
  }

  // Принудительное обновление
  async forceRefresh(): Promise<boolean> {
    console.log('🔄 Принудительное обновление данных Axenta');
    return await this.performRefresh();
  }

  // Выполнение обновления данных
  private async performRefresh(): Promise<boolean> {
    try {
      // Проверяем, авторизован ли пользователь
      const auth = this.getAuth();
      if (!auth || !auth.isAuthenticated.value) {
        console.log('⚠️ Пользователь не авторизован или auth контекст недоступен, пропускаем обновление');
        return false;
      }

      this.stats.value.totalRefreshes++;
      this.config.value.lastUpdate = new Date();

      console.log('🔄 Обновление данных Axenta...');

      // Обновляем данные объектов
      await this.refreshObjectsData();
      
      // Обновляем статистику дашборда
      await this.refreshDashboardData();

      // Успешное обновление
      this.stats.value.successfulRefreshes++;
      this.stats.value.lastSuccessfulRefresh = new Date();
      this.stats.value.lastError = null;
      this.config.value.errorCount = 0;

      console.log('✅ Данные Axenta успешно обновлены');
      
      this.saveConfig();
      this.notifySubscribers();
      
      return true;

    } catch (error: any) {
      console.error('❌ Ошибка обновления данных Axenta:', error);
      
      this.stats.value.failedRefreshes++;
      this.stats.value.lastError = error.message || 'Неизвестная ошибка';
      this.config.value.errorCount++;

      // Останавливаем автообновление при превышении лимита ошибок
      if (this.config.value.errorCount >= this.config.value.maxErrors) {
        console.error('🛑 Превышен лимит ошибок, автообновление остановлено');
        this.stop();
      }

      this.saveConfig();
      this.notifySubscribers();
      
      return false;
    }
  }

  // Обновление данных объектов
  private async refreshObjectsData() {
    try {
      // Получаем текущие фильтры из localStorage или используем базовые
      const savedFilters = localStorage.getItem('objects_filters');
      const filters = savedFilters ? JSON.parse(savedFilters) : {};
      
      // Обновляем список объектов
      const objectsService = getObjectsService();
      await objectsService.getObjects(1, 50, filters);
      
      console.log('📋 Данные объектов обновлены');
    } catch (error) {
      console.error('Ошибка обновления данных объектов:', error);
      throw error;
    }
  }

  // Обновление данных дашборда
  private async refreshDashboardData() {
    try {
      // Обновляем статистику дашборда
      await dashboardService.getStats();
      
      console.log('📊 Данные дашборда обновлены');
    } catch (error) {
      console.error('Ошибка обновления данных дашборда:', error);
      throw error;
    }
  }

  // Подписка на изменения
  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Уведомление подписчиков
  private notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Ошибка в подписчике автообновления:', error);
      }
    });
  }

  // Сохранение конфигурации
  private saveConfig() {
    try {
      const configToSave = {
        enabled: this.config.value.enabled,
        interval: this.config.value.interval,
        lastUpdate: this.config.value.lastUpdate?.toISOString(),
        errorCount: this.config.value.errorCount,
        maxErrors: this.config.value.maxErrors
      };
      
      localStorage.setItem('axenta_auto_refresh_config', JSON.stringify(configToSave));
      
      const statsToSave = {
        ...this.stats.value,
        lastSuccessfulRefresh: this.stats.value.lastSuccessfulRefresh?.toISOString()
      };
      
      localStorage.setItem('axenta_auto_refresh_stats', JSON.stringify(statsToSave));
    } catch (error) {
      console.error('Ошибка сохранения конфигурации автообновления:', error);
    }
  }

  // Загрузка конфигурации
  private loadConfig() {
    try {
      const savedConfig = localStorage.getItem('axenta_auto_refresh_config');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        this.config.value = {
          ...this.config.value,
          ...config,
          lastUpdate: config.lastUpdate ? new Date(config.lastUpdate) : null
        };
      }

      const savedStats = localStorage.getItem('axenta_auto_refresh_stats');
      if (savedStats) {
        const stats = JSON.parse(savedStats);
        this.stats.value = {
          ...this.stats.value,
          ...stats,
          lastSuccessfulRefresh: stats.lastSuccessfulRefresh ? new Date(stats.lastSuccessfulRefresh) : null
        };
      }
    } catch (error) {
      console.error('Ошибка загрузки конфигурации автообновления:', error);
    }
  }

  // Сброс статистики
  resetStats() {
    this.stats.value = {
      totalRefreshes: 0,
      successfulRefreshes: 0,
      failedRefreshes: 0,
      lastSuccessfulRefresh: null,
      lastError: null
    };
    
    this.saveConfig();
    this.notifySubscribers();
    
    console.log('📊 Статистика автообновления сброшена');
  }

  // Получение информации о состоянии
  getStatus() {
    return {
      enabled: this.config.value.enabled,
      interval: this.config.value.interval,
      lastUpdate: this.config.value.lastUpdate,
      nextRefreshIn: this.nextRefreshIn.value,
      stats: this.stats.value,
      errorCount: this.config.value.errorCount,
      maxErrors: this.config.value.maxErrors
    };
  }
}

// Экспортируем функцию для получения singleton instance (ленивая инициализация)
export const getAxentaAutoRefreshService = () => AxentaAutoRefreshService.getInstance();

// Экспортируем composable для использования в компонентах
export function useAxentaAutoRefresh() {
  const service = getAxentaAutoRefreshService();
  
  return {
    isEnabled: service.isEnabled,
    interval: service.interval,
    lastUpdate: service.lastUpdate,
    nextRefreshIn: service.nextRefreshIn,
    refreshStats: service.refreshStats,
    
    start: () => service.start(),
    stop: () => service.stop(),
    setInterval: (seconds: number) => service.setInterval(seconds),
    forceRefresh: () => service.forceRefresh(),
    resetStats: () => service.resetStats(),
    getStatus: () => service.getStatus(),
    subscribe: (callback: () => void) => service.subscribe(callback)
  };
}
