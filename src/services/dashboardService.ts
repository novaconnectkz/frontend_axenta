// import { useAuth } from "@/context/auth"; // Временно отключаем
import { config } from "@/config/env";
import API_TIMEOUTS from "@/config/timeouts";
import { retryWithBackoff } from "@/utils/apiRetry";
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
import { accountsService } from "./accountsService";
import {
  getMockWidgetData,
  mockChartData,
  mockDashboardLayouts,
  mockDashboardStats,
  mockNotifications,
  mockRecentActivity,
  simulateDelay,
} from "../mocks/mockDashboardData";

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
  
  // Флаг для использования реальных данных учетных записей
  private useRealAccountsData = true;
  
  // Флаг для использования реальных данных биллинга
  private useRealBillingData = true;

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
      timeout: API_TIMEOUTS.QUICK, // Используем таймаут для быстрых операций (статистика)
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

        // ✅ Используем Promise.all с retry для параллельной загрузки данных
        const [objectsStats, usersStats, accountsStats] = await Promise.all([
          // Получаем данные об объектах с retry
          this.useRealObjectsData 
            ? retryWithBackoff(
                async () => {
                  console.log("📊 Loading real objects data for dashboard...");
                  const objectsService = ObjectsService.getInstance();
                  const realObjectsStats = await objectsService.getObjectsStats(forceRefresh);
                  console.log("📊 Real objects stats:", realObjectsStats);
                  console.log("🗑️ Количество удаленных объектов для дашборда:", realObjectsStats.deleted);
                  return {
                    total: realObjectsStats.total,
                    active: realObjectsStats.active,
                    inactive: realObjectsStats.inactive,
                    scheduled_for_deletion: realObjectsStats.scheduled_for_delete,
                    deleted: realObjectsStats.deleted
                  };
                },
                {
                  maxRetries: 2,
                  baseDelay: 500,
                  onRetry: (attempt) => {
                    console.log(`⚠️ Retry ${attempt} for objects stats`);
                  }
                }
              )
            : Promise.resolve(mockDashboardStats.objects),
          
          // Получаем данные о пользователях с retry
          this.useRealUsersData
            ? retryWithBackoff(
                async () => {
                  console.log("📊 Loading real users data...");
                  const realUsersStats = await usersService.getUsersStats();
                  console.log("📊 Real users stats:", realUsersStats);
                  return {
                    total: realUsersStats.total,
                    active: realUsersStats.active,
                    inactive: realUsersStats.inactive,
                    admins: realUsersStats.admins,
                    regular_users: realUsersStats.regular_users
                  };
                },
                {
                  maxRetries: 2,
                  baseDelay: 500,
                  onRetry: (attempt) => {
                    console.log(`⚠️ Retry ${attempt} for users stats`);
                  }
                }
              )
            : Promise.resolve(mockDashboardStats.users),
          
          // Получаем данные об учетных записях с retry
          this.useRealAccountsData
            ? retryWithBackoff(
                async () => {
                  console.log("📊 Loading real accounts data...");
                  const realAccountsStats = await accountsService.getAccountsStats(forceRefresh);
                  console.log("📊 Real accounts stats:", realAccountsStats);
                  return {
                    total: realAccountsStats.total,
                    active: realAccountsStats.active,
                    blocked: realAccountsStats.blocked,
                    clients: realAccountsStats.clients,
                    partners: realAccountsStats.partners
                  };
                },
                {
                  maxRetries: 2,
                  baseDelay: 500,
                  onRetry: (attempt) => {
                    console.log(`⚠️ Retry ${attempt} for accounts stats`);
                  }
                }
              )
            : Promise.resolve({
                total: 0,
                active: 0,
                blocked: 0,
                clients: 0,
                partners: 0
              })
        ]);
        
        // Получаем данные биллинга с retry
        let billingStats;
        if (this.useRealBillingData) {
          console.log("📊 Loading real billing data...");
          console.log("🔧 useRealBillingData flag:", this.useRealBillingData);
          billingStats = await retryWithBackoff(
            () => this.getRealBillingStats(),
            {
              maxRetries: 2,
              baseDelay: 500,
              onRetry: (attempt) => {
                console.log(`⚠️ Retry ${attempt} for billing stats`);
              }
            }
          );
          console.log("✅ Real billing stats loaded:", billingStats);
        } else {
          console.log("⚠️ Используются mock данные биллинга (useRealBillingData = false)");
          billingStats = mockDashboardStats.billing;
        }
        
        // Собираем итоговую статистику
        const dashboardStats: DashboardStats = {
          objects: objectsStats,
          users: usersStats,
          accounts: accountsStats,
          billing: billingStats,
          // Для остальных разделов пока используем mock данные
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

  // Получение последней активности (всегда используем реальные данные)
  // sources - опциональный массив источников для фильтрации (objects, users, invoices, contracts, installations, subscriptions)
  async getRecentActivity(limit: number = 10, sources?: string[]): Promise<ActivityItem[]> {
    try {
      console.log("📊 Loading real activity data...");
      const params: any = { limit };
      if (sources && sources.length > 0) {
        params.sources = sources.join(",");
      }
      
      const response = await this.apiClient.get("/auth/dashboard/activity", { params });
      const activities = response.data.data || [];
      console.log("✅ Real activity data loaded:", activities.length, "items", sources ? `(sources: ${sources.join(", ")})` : "");
      return activities;
    } catch (error: any) {
      console.error("❌ Ошибка получения активности:", error);
      // В случае ошибки возвращаем пустой массив вместо mock данных
      console.warn("🔄 Возвращаем пустой массив активности из-за ошибки");
      return [];
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

      const response = await this.apiClient.get(`/auth/notifications?${params}`);
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
      await this.apiClient.put(`/auth/notifications/${notificationId}/read`);
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
        `/auth/dashboard/charts/${type}?range=${range}`
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
          `/auth/dashboard/layouts/${layout.id}`,
          layout
        );
        return response.data.data;
      } else {
        const response = await this.apiClient.post(
          "/auth/dashboard/layouts",
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
      const response = await this.apiClient.get("/auth/dashboard/layouts");
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
      const response = await this.apiClient.get("/auth/dashboard/layouts/default");
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
      await this.apiClient.put(`/auth/dashboard/layouts/${layoutId}/default`);
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
      await this.apiClient.delete(`/auth/dashboard/layouts/${layoutId}`);
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
        `/auth/dashboard/widgets/${widgetType}/data`,
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

  // Публичный метод для переключения режима реальных данных учетных записей
  setRealAccountsDataMode(enabled: boolean): void {
    this.useRealAccountsData = enabled;
  }

  // Получение текущего состояния режима реальных данных учетных записей
  isRealAccountsDataMode(): boolean {
    return this.useRealAccountsData;
  }

  // Получение реальных данных биллинга с API
  private async getRealBillingStats(): Promise<BillingStats> {
    console.log("🔍 Начинаем загрузку реальных данных биллинга...");
    
    // Проверяем наличие токена
    const token = localStorage.getItem("axenta_token");
    if (!token) {
      console.error("❌ Токен не найден в localStorage");
      throw new Error("Требуется авторизация для получения данных биллинга");
    }
    
    // Получаем company_id из localStorage
    let companyId: string | null = null;
    try {
      const companyRaw = localStorage.getItem("axenta_company");
      console.log("📦 Company data from localStorage:", companyRaw);
      if (companyRaw) {
        const company = JSON.parse(companyRaw);
        console.log("📦 Parsed company:", company);
        if (company && (company.id || company.company_id)) {
          companyId = company.id ?? company.company_id;
          console.log("✅ Company ID найден:", companyId);
        }
      }
    } catch (err) {
      console.error("❌ Ошибка получения company_id из localStorage:", err);
    }

    if (!companyId) {
      console.error("❌ company_id не найден в localStorage");
      throw new Error("company_id не найден в localStorage");
    }

    const companyIdNum = parseInt(companyId, 10);
    if (isNaN(companyIdNum)) {
      console.error("❌ Неверный формат company_id:", companyId);
      throw new Error("Неверный формат company_id");
    }
    
    console.log("🔢 Company ID (number):", companyIdNum);

    try {
      console.log("🌐 Отправляем запросы к API...");
      
      // Параллельно запрашиваем данные биллинга и количество счетов
      const [dashboardResponse, sentInvoicesResponse, draftInvoicesResponse, overdueInvoicesResponse] = await Promise.all([
        // Запрос к API /api/dashboard?company_id=
        this.apiClient.get("/dashboard", {
          params: {
            company_id: companyId,
            demo: 0 // Явно указываем, что нужны реальные данные
          }
        }).catch((err) => {
          console.error("❌ Ошибка запроса /dashboard:", err);
          console.error("Response:", err.response?.data);
          throw err;
        }),
        // Запрос количества счетов со статусом "sent"
        this.apiClient.get("/auth/billing/invoices", {
          params: {
            company_id: companyIdNum,
            status: "sent",
            limit: 1,
            offset: 0
          }
        }).catch(() => ({ data: { total: 0 } })), // В случае ошибки используем 0
        // Запрос количества счетов со статусом "draft"
        this.apiClient.get("/auth/billing/invoices", {
          params: {
            company_id: companyIdNum,
            status: "draft",
            limit: 1,
            offset: 0
          }
        }).catch(() => ({ data: { total: 0 } })), // В случае ошибки используем 0
        // Запрос количества просроченных счетов
        this.apiClient.get("/auth/billing/invoices/overdue", {
          params: {
            company_id: companyIdNum
          }
        }).catch(() => ({ data: { data: [] } })) // В случае ошибки используем пустой массив
      ]);

      console.log("✅ Получены ответы от API");
      console.log("📊 Dashboard response:", dashboardResponse.data);
      console.log("📊 Sent invoices response:", sentInvoicesResponse.data);
      console.log("📊 Draft invoices response:", draftInvoicesResponse.data);
      console.log("📊 Overdue invoices response:", overdueInvoicesResponse.data);
      
      // Бэкенд возвращает в двух форматах:
      // 1. Demo режим: { status: "success", data: {...}, demo_notice: "..." }
      // 2. Реальный режим: { revenue_total, subscriptions_active, payable, overdue }
      const backendData = dashboardResponse.data.data || dashboardResponse.data;
      console.log("📊 Backend data:", backendData);
      
      // Проверяем, не вернулись ли demo данные
      if (dashboardResponse.data.demo_notice) {
        console.warn("⚠️ Получены demo данные вместо реальных!");
        throw new Error("Получены demo данные. Проверьте параметр demo=0");
      }
      
      // Преобразуем decimal значения в числа
      // decimal.Decimal сериализуется как строка или число
      const parseDecimal = (value: any): number => {
        if (value === null || value === undefined) return 0;
        if (typeof value === "number") return value;
        if (typeof value === "string") {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? 0 : parsed;
        }
        // Если это объект decimal, пытаемся получить значение
        if (typeof value === "object" && "String" in value) {
          return parseFloat(value.String() || "0");
        }
        return 0;
      };
      
      // Получаем количество счетов
      const sentInvoicesCount = sentInvoicesResponse.data?.total || 0;
      const draftInvoicesCount = draftInvoicesResponse.data?.total || 0;
      const pendingInvoicesCount = sentInvoicesCount + draftInvoicesCount;
      console.log("📊 Pending invoices count:", pendingInvoicesCount, "(sent:", sentInvoicesCount, ", draft:", draftInvoicesCount, ")");
      
      // Обрабатываем ответ от /auth/billing/invoices/overdue
      // Может быть массивом или объектом с полем data
      let overdueInvoices: any[] = [];
      if (Array.isArray(overdueInvoicesResponse.data)) {
        overdueInvoices = overdueInvoicesResponse.data;
      } else if (overdueInvoicesResponse.data?.data && Array.isArray(overdueInvoicesResponse.data.data)) {
        overdueInvoices = overdueInvoicesResponse.data.data;
      }
      const overdueInvoicesCount = overdueInvoices.length;
      console.log("📊 Overdue invoices count:", overdueInvoicesCount);
      
      const billingStats: BillingStats = {
        total_revenue: parseDecimal(backendData.revenue_total),
        monthly_revenue: 0, // Бэкенд не предоставляет месячную выручку, можно добавить отдельный запрос
        pending_invoices: pendingInvoicesCount,
        overdue_invoices: overdueInvoicesCount,
        active_contracts: parseInt(backendData.subscriptions_active?.toString() || "0", 10)
      };
      
      console.log("✅ Итоговые данные биллинга:", billingStats);

      return billingStats;
    } catch (error: any) {
      console.error("Ошибка получения данных биллинга с API:", error);
      throw error;
    }
  }

  // Публичный метод для переключения режима реальных данных биллинга
  setRealBillingDataMode(enabled: boolean): void {
    this.useRealBillingData = enabled;
  }

  // Получение текущего состояния режима реальных данных биллинга
  isRealBillingDataMode(): boolean {
    return this.useRealBillingData;
  }

  // Очистка кеша биллинга при переключении на реальные данные
  clearBillingCache(): void {
    // Очищаем in-memory кеш
    if (this.statsCache.data) {
      const cachedData = { ...this.statsCache.data };
      cachedData.billing = {
        total_revenue: 0,
        monthly_revenue: 0,
        pending_invoices: 0,
        overdue_invoices: 0,
        active_contracts: 0
      };
      this.statsCache.data = cachedData;
    }
    // Очищаем persistent кеш
    try {
      const key = this.getPersistentKey();
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.data) {
          parsed.data.billing = {
            total_revenue: 0,
            monthly_revenue: 0,
            pending_invoices: 0,
            overdue_invoices: 0,
            active_contracts: 0
          };
          localStorage.setItem(key, JSON.stringify(parsed));
        }
      }
    } catch (err) {
      console.warn("Ошибка очистки persistent кеша биллинга:", err);
    }
    console.log("🗑️ Кеш биллинга очищен");
  }
}

export const dashboardService = new DashboardService();
