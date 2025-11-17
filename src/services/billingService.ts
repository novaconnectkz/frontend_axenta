/**
 * Сервис для работы с API биллинга
 */

import { config } from "@/config/env";
import type {
  BillingCalculation,
  BillingCalculationResponse,
  BillingDashboardData,
  BillingHistory,
  BillingHistoryFilter,
  BillingHistoryResponse,
  BillingPlan,
  BillingPlanResponse,
  BillingPlansResponse,
  BillingSettings,
  BillingSettingsResponse,
  BillingStatistics,
  BillingStatisticsResponse,
  CancelInvoiceData,
  CreateBillingPlanData,
  CreateSubscriptionData,
  GenerateInvoiceData,
  Invoice,
  InvoiceResponse,
  InvoicesFilter,
  InvoicesResponse,
  ProcessPaymentData,
  Subscription,
  SubscriptionResponse,
  SubscriptionsResponse,
  UpdateBillingPlanData,
  UpdateBillingSettingsData,
  UpdateSubscriptionData,
} from "@/types/billing";
import axios, { type AxiosResponse } from "axios";

class BillingService {
  private apiClient = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 30000,
  });

  constructor() {
    // Добавляем interceptor для автоматического добавления токена авторизации
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem("axenta_token");
      const company = localStorage.getItem("axenta_company");

      // Логирование только в режиме разработки
      if (import.meta.env.DEV) {
        console.debug("BillingService API request:", {
          url: config.url,
          method: config.method,
          token: token ? "EXISTS" : "MISSING",
        });
      }

      if (token) {
        config.headers["authorization"] = `Token ${token}`;
      }

      if (company) {
        try {
          const companyData = JSON.parse(company);
          config.headers["X-Tenant-ID"] = companyData.id;
        } catch (e) {
          console.warn("Invalid company data in localStorage");
        }
      }

      return config;
    });

    // Добавляем interceptor для обработки ошибок
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.log("BillingService API error:", {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
        });

        if (error.response?.status === 401) {
          console.log("401 error - clearing auth and redirecting to login");
          // Перенаправляем на страницу входа при ошибке авторизации
          localStorage.removeItem("axenta_token");
          localStorage.removeItem("axenta_user");
          localStorage.removeItem("axenta_company");
          localStorage.removeItem("axenta_token_expiry");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  // ========== ТАРИФНЫЕ ПЛАНЫ ==========

  /**
   * Получить список тарифных планов
   */
  async getBillingPlans(companyId?: number): Promise<BillingPlan[]> {
    try {
      const params = companyId ? { company_id: companyId } : {};
      const response: AxiosResponse<BillingPlansResponse> =
        await this.apiClient.get("/auth/billing/plans", { params });
      
      const plans = response.data.data || [];
      
      // Конвертируем price из строки в число, если нужно (decimal.Decimal сериализуется как строка)
      const normalizedPlans = plans.map(plan => {
        // decimal.Decimal сериализуется как строка, нужно конвертировать
        let price: number = 0;
        if (typeof plan.price === 'string') {
          price = parseFloat(plan.price.replace(',', '.')) || 0;
        } else if (typeof plan.price === 'number') {
          price = plan.price;
        } else {
          // Если это объект (редкий случай), пытаемся извлечь значение
          price = Number(plan.price) || 0;
        }
        
        return {
          ...plan,
          price: price,
          max_devices: Number(plan.max_devices) || 0,
          max_users: Number(plan.max_users) || 0,
          max_storage: Number(plan.max_storage) || 0,
        };
      });
      
      return normalizedPlans;
    } catch (error) {
      console.error("Ошибка при загрузке планов:", error);
      return [];
    }
  }

  /**
   * Получить тарифный план по ID
   */
  async getBillingPlan(id: number): Promise<BillingPlan> {
    const response: AxiosResponse<BillingPlanResponse> =
      await this.apiClient.get(`/auth/billing/plans/${id}`);
    if (!response.data.data) {
      throw new Error("Тарифный план не найден");
    }
    return response.data.data;
  }

  /**
   * Создать новый тарифный план
   */
  async createBillingPlan(data: CreateBillingPlanData, companyId?: number): Promise<BillingPlan> {
    const params = companyId ? { company_id: companyId } : {};
    const response: AxiosResponse<BillingPlanResponse> =
      await this.apiClient.post("/auth/billing/plans", data, { params });
    if (!response.data.data) {
      throw new Error("Ошибка создания тарифного плана");
    }
    return response.data.data;
  }

  /**
   * Обновить тарифный план
   */
  async updateBillingPlan(
    id: number,
    data: UpdateBillingPlanData,
    companyId?: number
  ): Promise<BillingPlan> {
    const params = companyId ? { company_id: companyId } : {};
    const response: AxiosResponse<BillingPlanResponse> =
      await this.apiClient.put(`/auth/billing/plans/${id}`, data, { params });
    if (!response.data.data) {
      throw new Error("Ошибка обновления тарифного плана");
    }
    return response.data.data;
  }

  /**
   * Удалить тарифный план
   */
  async deleteBillingPlan(id: number, companyId?: number): Promise<void> {
    const params = companyId ? { company_id: companyId } : {};
    console.log('deleteBillingPlan: удаление плана', { id, companyId, params });
    try {
      await this.apiClient.delete(`/auth/billing/plans/${id}`, { params });
    } catch (error: any) {
      console.error('deleteBillingPlan: ошибка удаления', {
        id,
        companyId,
        params,
        error: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  // ========== ПОДПИСКИ ==========

  /**
   * Получить список подписок компании
   */
  async getSubscriptions(companyId: number): Promise<Subscription[]> {
    try {
      const response: AxiosResponse<SubscriptionsResponse> =
        await this.apiClient.get("/auth/billing/subscriptions", {
          params: { company_id: companyId }
        });
      return response.data.data || [];
    } catch (error) {
      console.error("Ошибка при загрузке подписок:", error);
      return [];
    }
  }

  /**
   * Создать новую подписку
   */
  async createSubscription(
    data: CreateSubscriptionData
  ): Promise<Subscription> {
    const response: AxiosResponse<SubscriptionResponse> =
      await this.apiClient.post("/auth/billing/subscriptions", data);
    if (!response.data.data) {
      throw new Error("Ошибка создания подписки");
    }
    return response.data.data;
  }

  /**
   * Обновить подписку
   */
  async updateSubscription(
    id: number,
    data: UpdateSubscriptionData
  ): Promise<Subscription> {
    const response: AxiosResponse<SubscriptionResponse> =
      await this.apiClient.put(`/auth/billing/subscriptions/${id}`, data);
    if (!response.data.data) {
      throw new Error("Ошибка обновления подписки");
    }
    return response.data.data;
  }

  /**
   * Удалить подписку
   */
  async deleteSubscription(id: number): Promise<void> {
    await this.apiClient.delete(`/auth/billing/subscriptions/${id}`);
  }

  // ========== РАСЧЕТЫ И СЧЕТА ==========

  /**
   * Рассчитать биллинг для договора
   */
  async calculateBilling(
    contractId: number,
    periodStart?: string,
    periodEnd?: string
  ): Promise<BillingCalculation> {
    const params: any = {};
    if (periodStart) params.period_start = periodStart;
    if (periodEnd) params.period_end = periodEnd;

    const response: AxiosResponse<BillingCalculationResponse> =
      await this.apiClient.get(`/auth/billing/contracts/${contractId}/calculate`, {
        params,
      });
    if (!response.data.data) {
      throw new Error("Ошибка расчета биллинга");
    }
    return response.data.data;
  }

  /**
   * Сгенерировать счет для договора
   */
  async generateInvoice(
    contractId: number,
    data: GenerateInvoiceData
  ): Promise<Invoice> {
    const response: AxiosResponse<InvoiceResponse> = await this.apiClient.post(
      `/auth/billing/contracts/${contractId}/invoice`,
      data
    );
    if (!response.data.data) {
      throw new Error("Ошибка генерации счета");
    }
    return response.data.data;
  }

  /**
   * Получить список счетов
   */
  async getInvoices(
    filter?: InvoicesFilter
  ): Promise<{ invoices: Invoice[]; total: number }> {
    const response: AxiosResponse<InvoicesResponse> = await this.apiClient.get(
      "/auth/billing/invoices",
      {
        params: filter,
      }
    );
    return {
      invoices: response.data.data || [],
      total: response.data.total || 0,
    };
  }

  /**
   * Получить счет по ID
   */
  async getInvoice(id: number): Promise<Invoice> {
    const response: AxiosResponse<InvoiceResponse> = await this.apiClient.get(
      `/auth/billing/invoices/${id}`
    );
    if (!response.data.data) {
      throw new Error("Счет не найден");
    }
    return response.data.data;
  }

  /**
   * Обработать платеж по счету
   */
  async processPayment(
    invoiceId: number,
    data: ProcessPaymentData
  ): Promise<Invoice> {
    const response: AxiosResponse<InvoiceResponse> = await this.apiClient.post(
      `/auth/billing/invoices/${invoiceId}/payment`,
      data
    );
    if (!response.data.data) {
      throw new Error("Ошибка обработки платежа");
    }
    return response.data.data;
  }

  /**
   * Отменить счет
   */
  async cancelInvoice(
    invoiceId: number,
    data: CancelInvoiceData
  ): Promise<void> {
    await this.apiClient.post(`/auth/billing/invoices/${invoiceId}/cancel`, data);
  }

  /**
   * Получить просроченные счета
   */
  async getOverdueInvoices(companyId?: number): Promise<Invoice[]> {
    const params = companyId ? { company_id: companyId } : {};
    const response: AxiosResponse<InvoicesResponse> = await this.apiClient.get(
      "/auth/billing/invoices/overdue",
      { params }
    );
    return response.data.data || [];
  }

  /**
   * Получить счета за период
   */
  async getInvoicesByPeriod(
    startDate: string,
    endDate: string,
    companyId?: number
  ): Promise<Invoice[]> {
    const params: any = { start_date: startDate, end_date: endDate };
    if (companyId) params.company_id = companyId;

    const response: AxiosResponse<InvoicesResponse> = await this.apiClient.get(
      "/auth/billing/invoices/period",
      { params }
    );
    return response.data.data || [];
  }

  // ========== ИСТОРИЯ БИЛЛИНГА ==========

  /**
   * Получить историю биллинга
   */
  async getBillingHistory(
    filter: BillingHistoryFilter
  ): Promise<{ history: BillingHistory[]; total: number }> {
    const response: AxiosResponse<BillingHistoryResponse> =
      await this.apiClient.get("/auth/billing/history", {
        params: filter,
      });
    return {
      history: response.data.data || [],
      total: response.data.total || 0,
    };
  }

  // ========== НАСТРОЙКИ БИЛЛИНГА ==========

  /**
   * Получить настройки биллинга компании
   */
  async getBillingSettings(companyId: number): Promise<BillingSettings> {
    try {
      const response: AxiosResponse<BillingSettingsResponse> =
        await this.apiClient.get("/auth/billing/settings", {
          params: { company_id: companyId },
        });
      if (!response.data.data) {
        throw new Error("Настройки биллинга не найдены");
      }
      return response.data.data;
    } catch (error) {
      console.error("Ошибка при загрузке настроек:", error);
      throw error;
    }
  }

  /**
   * Обновить настройки биллинга
   */
  async updateBillingSettings(
    companyId: number,
    data: UpdateBillingSettingsData
  ): Promise<BillingSettings> {
    const response: AxiosResponse<BillingSettingsResponse> =
      await this.apiClient.put("/auth/billing/settings", data, {
        params: { company_id: companyId },
      });
    if (!response.data.data) {
      throw new Error("Ошибка обновления настроек биллинга");
    }
    return response.data.data;
  }

  // ========== СТАТИСТИКА И ОТЧЕТЫ ==========

  /**
   * Получить статистику биллинга
   */
  async getBillingStatistics(
    companyId: number,
    year: number,
    month?: number
  ): Promise<BillingStatistics> {
    const params: any = { company_id: companyId, year };
    if (month) params.month = month;

    const response: AxiosResponse<BillingStatisticsResponse> =
      await this.apiClient.get("/auth/billing/statistics", { params });
    if (!response.data.data) {
      throw new Error("Ошибка получения статистики");
    }
    return response.data.data;
  }

  /**
   * Получить данные для дашборда биллинга
   * @param companyId - ID компании
   * @param plans - Опционально: уже загруженные планы (чтобы избежать дублирования запросов)
   * @param subscriptions - Опционально: уже загруженные подписки (чтобы избежать дублирования запросов)
   */
  async getBillingDashboardData(
    companyId: number,
    plans?: BillingPlan[],
    subscriptions?: Subscription[]
  ): Promise<BillingDashboardData> {
    try {
      // Если данные не переданы, загружаем их
      const [loadedPlans, loadedSubscriptions] = await Promise.all([
        plans ? Promise.resolve(plans) : this.getBillingPlans(companyId),
        subscriptions ? Promise.resolve(subscriptions) : this.getSubscriptions(companyId),
      ]);

      // Создаем заглушку для дашборда
      return this.createMockDashboardData(loadedPlans, loadedSubscriptions);
    } catch (error) {
      console.warn("Failed to load real dashboard data, using mock:", error);
      return this.createMockDashboardData([], []);
    }
  }

  private createMockDashboardData(
    plans: BillingPlan[],
    subscriptions: Subscription[]
  ): BillingDashboardData {
    const activeSubscriptions = subscriptions.filter(
      (s) => s.status === "active"
    ).length;

    return {
      widgets: {
        total_revenue: {
          title: "Общий доход",
          value: 0,
          currency: "RUB",
          format: "currency",
        },
        monthly_revenue: {
          title: "Доход за месяц",
          value: 0,
          currency: "RUB",
          format: "currency",
        },
        outstanding_amount: {
          title: "К оплате",
          value: 0,
          currency: "RUB",
          format: "currency",
        },
        overdue_amount: {
          title: "Просрочено",
          value: 0,
          currency: "RUB",
          format: "currency",
        },
        active_subscriptions: {
          title: "Активные подписки",
          value: activeSubscriptions,
          format: "number",
        },
        overdue_invoices: {
          title: "Просроченные счета",
          value: 0,
          format: "number",
        },
      },
      recent_invoices: [],
      revenue_chart: {
        labels: [],
        datasets: [
          {
            label: "Доходы",
            data: [],
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgba(54, 162, 235, 1)",
          },
        ],
      },
      invoices_by_status: [],
    };
  }

  // ========== АВТОМАТИЗАЦИЯ ==========

  /**
   * Автоматически сгенерировать счета за месяц
   */
  async autoGenerateInvoices(year: number, month: number): Promise<void> {
    await this.apiClient.post("/auth/billing/auto-generate", null, {
      params: { year, month },
    });
  }

  /**
   * Обработать плановые удаления объектов
   */
  async processScheduledDeletions(): Promise<void> {
    await this.apiClient.post("/auth/billing/process-deletions");
  }

  // ========== ЭКСПОРТ ДАННЫХ ==========

  /**
   * Экспортировать счета в Excel
   */
  async exportInvoices(filter?: InvoicesFilter): Promise<Blob> {
    const response = await this.apiClient.get("/auth/billing/invoices/export", {
      params: filter,
      responseType: "blob",
    });
    return response.data;
  }

  /**
   * Экспортировать историю биллинга в Excel
   */
  async exportBillingHistory(filter: BillingHistoryFilter): Promise<Blob> {
    const response = await this.apiClient.get("/auth/billing/history/export", {
      params: filter,
      responseType: "blob",
    });
    return response.data;
  }

  /**
   * Экспортировать статистику в PDF
   */
  async exportBillingReport(
    companyId: number,
    year: number,
    month?: number
  ): Promise<Blob> {
    const params: any = { company_id: companyId, year };
    if (month) params.month = month;

    const response = await this.apiClient.get("/auth/billing/report/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  }

  // ========== УТИЛИТЫ ==========

  // ========== ДОП. МЕТОДЫ ДЛЯ «НАСТРОЕК» ==========

  /**
   * Dry-run генерации счетов (без фактического создания)
   */
  async dryRunInvoices(payload: import("@/types/billing").DryRunInvoicesRequest) {
    const response = await this.apiClient.post(
      "/auth/billing/invoices/dry-run",
      payload
    );
    return response.data
      .data as import("@/types/billing").DryRunInvoicesResponse;
  }

  /**
   * Отправить тестовое уведомление по выбранному каналу
   */
  async testNotification(payload: import("@/types/billing").TestNotificationRequest) {
    const response = await this.apiClient.post(
      "/auth/billing/notifications/test",
      payload
    );
    return response.data
      .data as import("@/types/billing").TestNotificationResponse;
  }

  /**
   * Предпросмотр номера по шаблону нумератора
   */
  async previewNumerator(
    context: import("@/types/billing").NumeratorContext,
    query: import("@/types/billing").PreviewNumeratorQuery
  ) {
    try {
      const response = await this.apiClient.get(
        `/auth/billing/numerators/${context}/preview`,
        {
          params: query,
        }
      );
      return response.data
        .data as import("@/types/billing").PreviewNumeratorResponse;
    } catch (e) {
      // Fallback: локальный предпросмотр по шаблону
      const date = new Date();
      const year = String(date.getFullYear());
      const yearShort = year.slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const seq = "001"; // Для предпросмотра фиксированное значение
      const random2 = String(Math.floor(Math.random() * 100)).padStart(2, "0");

      // 1) Обрабатываем плейсхолдеры в префиксе формата {YEAR} и т.п.
      let prefix = (query.prefix || "")
        .replace("{YEAR}", year)
        .replace("{YEAR_SHORT}", yearShort)
        .replace("{MONTH}", month)
        .replace("{DAY}", day)
        .replace("{SEQ}", seq)
        .replace("{RANDOM}", random2);

      // Также поддержим printf/strftime-подобные токены в префиксе
      // %Y, %y, %m, %d; а также экранированный процент %%
      prefix = prefix
        .replace(/%%/g, "%")
        .replace(/%Y/g, year)
        .replace(/%y/g, yearShort)
        .replace(/%m/g, month)
        .replace(/%d/g, day);

      // 2) Формируем предпросмотр по шаблону
      let template = query.template || "{PREFIX}{SEQ}";

      // Сначала поддержим формат с фигурными скобками
      let preview = template
        .replace("{PREFIX}", prefix)
        .replace("{SEQ}", seq)
        .replace("{YEAR}", year)
        .replace("{YEAR_SHORT}", yearShort)
        .replace("{MONTH}", month)
        .replace("{DAY}", day)
        .replace("{RANDOM}", random2);

      // 3) Если остались printf-плейсхолдеры — обработаем их:
      // - %%  -> %
      // - %s  -> prefix
      // - %0Nd -> seq с N нулями (например, %04d)
      // - %d  -> seq без дополнения
      // - %Y, %y, %m, %d (в контексте даты) — как выше
      // Выполним аккуратно, чтобы не разрушить уже подставленные значения
      const padSeq = (n: number) => String(parseInt(seq, 10)).padStart(n, "0");
      // %0Nd
      preview = preview.replace(/%0(\d+)d/g, (_m, p1) => padSeq(Number(p1) || 1));
      // %d
      preview = preview.replace(/%d/g, String(parseInt(seq, 10)));
      // %s
      preview = preview.replace(/%s/g, prefix);
      // Датовые токены (на случай, если остались)
      preview = preview
        .replace(/%Y/g, year)
        .replace(/%y/g, yearShort)
        .replace(/%m/g, month)
        .replace(/%d/g, day);
      // Экранированный процент в самом конце
      preview = preview.replace(/%%/g, "%");

      return { preview } as import("@/types/billing").PreviewNumeratorResponse;
    }
  }

  // -----------------------------

  /**
   * Форматировать денежную сумму
   */
  formatCurrency(amount: string | number, currency = "RUB"): string {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: currency,
    }).format(value || 0);
  }

  /**
   * Форматировать дату
   */
  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString("ru-RU");
  }

  /**
   * Получить цвет статуса счета
   */
  getInvoiceStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: "grey",
      sent: "blue",
      partially_paid: "orange",
      paid: "green",
      overdue: "red",
      cancelled: "grey",
    };
    return colors[status] || "grey";
  }

  /**
   * Получить локализованное название статуса счета
   */
  getInvoiceStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: "Черновик",
      sent: "Отправлен",
      partially_paid: "Частично оплачен",
      paid: "Оплачен",
      overdue: "Просрочен",
      cancelled: "Отменен",
    };
    return labels[status] || status;
  }
}

// Создаем единственный экземпляр сервиса
export const billingService = new BillingService();
export default billingService;
