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

      console.log("BillingService API request:", {
        url: config.url,
        token: token ? "EXISTS" : "MISSING",
        company: company ? "EXISTS" : "MISSING",
      });

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
    // Используем простой эндпоинт для отладки (без авторизации)
    try {
      const response: AxiosResponse<BillingPlansResponse> =
        await this.apiClient.get("/billing-plans-simple");
      return response.data.data || [];
    } catch (error) {
      console.error("Ошибка при загрузке планов:", error);
      // Возвращаем пустой массив вместо fallback к защищенному эндпоинту
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
  async createBillingPlan(data: CreateBillingPlanData): Promise<BillingPlan> {
    const response: AxiosResponse<BillingPlanResponse> =
      await this.apiClient.post("/auth/billing/plans", data);
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
    data: UpdateBillingPlanData
  ): Promise<BillingPlan> {
    const response: AxiosResponse<BillingPlanResponse> =
      await this.apiClient.put(`/auth/billing/plans/${id}`, data);
    if (!response.data.data) {
      throw new Error("Ошибка обновления тарифного плана");
    }
    return response.data.data;
  }

  /**
   * Удалить тарифный план
   */
  async deleteBillingPlan(id: number): Promise<void> {
    await this.apiClient.delete(`/auth/billing/plans/${id}`);
  }

  // ========== ПОДПИСКИ ==========

  /**
   * Получить список подписок компании
   */
  async getSubscriptions(companyId: number): Promise<Subscription[]> {
    // Используем простой эндпоинт для отладки (без авторизации)
    try {
      const response: AxiosResponse<SubscriptionsResponse> =
        await this.apiClient.get("/subscriptions-simple");
      return response.data.data || [];
    } catch (error) {
      console.error("Ошибка при загрузке подписок:", error);
      // Возвращаем пустой массив вместо fallback к защищенному эндпоинту
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
    // Используем простой эндпоинт для отладки (без авторизации)
    try {
      const response: AxiosResponse<BillingSettingsResponse> =
        await this.apiClient.get("/billing-settings-simple");
      if (!response.data.data) {
        throw new Error("Настройки биллинга не найдены");
      }
      return response.data.data;
    } catch (error) {
      console.error("Ошибка при загрузке настроек:", error);
      // Fallback к защищенному эндпоинту (если нужен)
      const response: AxiosResponse<BillingSettingsResponse> =
        await this.apiClient.get("/auth/billing/settings", {
          params: { company_id: companyId },
        });
      if (!response.data.data) {
        throw new Error("Настройки биллинга не найдены");
      }
      return response.data.data;
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
   */
  async getBillingDashboardData(
    companyId: number
  ): Promise<BillingDashboardData> {
    // Временно возвращаем заглушку для отладки
    console.log("Loading billing dashboard data for company:", companyId);

    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      // Пробуем получить простые данные
      const [plans, subscriptions] = await Promise.all([
        this.getBillingPlans(companyId),
        this.getSubscriptions(companyId),
      ]);

      // Создаем заглушку для дашборда
      return this.createMockDashboardData(plans, subscriptions);
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
          value: 50000,
          currency: "RUB",
          format: "currency",
          change: {
            value: 12.5,
            period: "за месяц",
            trend: "up",
          },
        },
        monthly_revenue: {
          title: "Доход за месяц",
          value: 15000,
          currency: "RUB",
          format: "currency",
        },
        outstanding_amount: {
          title: "К оплате",
          value: 8000,
          currency: "RUB",
          format: "currency",
        },
        overdue_amount: {
          title: "Просрочено",
          value: 2000,
          currency: "RUB",
          format: "currency",
        },
        active_subscriptions: {
          title: "Активные подписки",
          value: activeSubscriptions || 3,
          format: "number",
        },
        overdue_invoices: {
          title: "Просроченные счета",
          value: 1,
          format: "number",
        },
      },
      recent_invoices: [],
      revenue_chart: {
        labels: ["Янв", "Фев", "Мар", "Апр", "Май"],
        datasets: [
          {
            label: "Доходы",
            data: [10000, 12000, 15000, 13000, 16000],
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgba(54, 162, 235, 1)",
          },
        ],
      },
      invoices_by_status: [
        { status: "paid", count: 15, amount: "45000" },
        { status: "sent", count: 3, amount: "8000" },
        { status: "overdue", count: 1, amount: "2000" },
      ],
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
