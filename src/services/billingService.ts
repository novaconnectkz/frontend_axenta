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
  InvoiceStatus,
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


      if (token) {
        config.headers["authorization"] = `Token ${token}`;
      }

      if (company) {
        try {
          const companyData = JSON.parse(company);
          config.headers["X-Tenant-ID"] = companyData.id;
        } catch (e) {
          // Invalid company data in localStorage
        }
      }

      return config;
    });

    // Добавляем interceptor для обработки ошибок
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Перенаправляем на страницу входа при ошибке авторизации
          localStorage.removeItem("axenta_token");
          localStorage.removeItem("axenta_user");
          localStorage.removeItem("axenta_company");
          localStorage.removeItem("axenta_token_expiry");
          
          // Используем роутер для навигации вместо window.location.href
          // Это предотвращает полную перезагрузку страницы
          if (typeof window !== 'undefined' && window.location) {
            // Проверяем, не находимся ли мы уже на странице логина
            if (window.location.pathname !== '/login') {
              // Используем replace, чтобы не создавать запись в истории
              window.location.replace('/login');
            }
          }
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
    await this.apiClient.delete(`/auth/billing/plans/${id}`, { params });
  }

  // ========== ПОДПИСКИ ==========

  /**
   * Получить список подписок компании
   */
  async getSubscriptions(companyId: number): Promise<Subscription[]> {
    try {
      const response: AxiosResponse<SubscriptionsResponse> =
        await this.apiClient.get("/auth/billing/subscriptions", {
          params: { 
            company_id: companyId,
            _t: Date.now() // Предотвращаем кеширование
          }
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
   * Удалить счет
   */
  async deleteInvoice(invoiceId: number): Promise<void> {
    await this.apiClient.delete(`/auth/billing/invoices/${invoiceId}`);
  }

  /**
   * Отправить счет клиенту (изменить статус с draft на sent)
   */
  async sendInvoice(
    invoiceId: number,
    data: SendInvoiceData
  ): Promise<Invoice> {
    const response: AxiosResponse<InvoiceResponse> = await this.apiClient.post(
      `/auth/billing/invoices/${invoiceId}/send`,
      data
    );
    if (!response.data.data) {
      throw new Error("Ошибка отправки счета");
    }
    return response.data.data;
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
      console.error("Ошибка при загрузке настроек биллинга:", error);
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
   * @param invoices - Опционально: уже загруженные счета (чтобы избежать дублирования запросов)
   * @param activeContractsCount - Опционально: количество активных договоров для расчета среднего дохода
   */
  async getBillingDashboardData(
    companyId: number,
    plans?: BillingPlan[],
    subscriptions?: Subscription[],
    invoices?: Invoice[],
    activeContractsCount?: number
  ): Promise<BillingDashboardData> {
    try {
      // Если данные не переданы, загружаем их
      const [loadedPlans, loadedSubscriptions, loadedInvoices] = await Promise.all([
        plans ? Promise.resolve(plans) : this.getBillingPlans(companyId),
        subscriptions ? Promise.resolve(subscriptions) : this.getSubscriptions(companyId),
        invoices ? Promise.resolve(invoices) : this.getInvoices({ company_id: companyId }).then(r => r.invoices),
      ]);

      // Рассчитываем реальные данные на основе счетов
      return this.calculateDashboardData(loadedPlans, loadedSubscriptions, loadedInvoices, activeContractsCount);
    } catch (error) {
      console.error("Ошибка загрузки данных дашборда:", error);
      return this.createMockDashboardData([], []);
    }
  }

  private calculateDashboardData(
    plans: BillingPlan[],
    subscriptions: Subscription[],
    invoices: Invoice[],
    activeContractsCount?: number
  ): BillingDashboardData {
    const activeSubscriptions = subscriptions.filter(
      (s) => s.status === "active"
    ).length;

    // Рассчитываем метрики на основе счетов
    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let outstandingAmount = 0;
    let overdueAmount = 0;
    let overdueInvoicesCount = 0;
    let paidInvoicesCount = 0;
    let sentInvoicesCount = 0;
    let partiallyPaidAmount = 0;
    let partiallyPaidCount = 0;
    let invoicesToSendCount = 0;
    let invoicesWithoutContractCount = 0;
    let totalPaymentDays = 0;
    let paidInvoicesWithDates = 0;
    let paymentActivity7d = 0;
    let paymentActivity30d = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Группируем счета по статусам (счет и сумма)
    const invoicesByStatus: Record<string, { count: number; amount: number }> = {
      draft: { count: 0, amount: 0 },
      sent: { count: 0, amount: 0 },
      partially_paid: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      overdue: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 },
    };

    // Получаем последние 10 счетов для recent_invoices
    const recentInvoices = [...invoices]
      .sort((a, b) => {
        const dateA = new Date(a.invoice_date || a.created_at).getTime();
        const dateB = new Date(b.invoice_date || b.created_at).getTime();
        return dateB - dateA;
      })
      .slice(0, 10);

    invoices.forEach((invoice) => {
      const totalAmount = parseFloat(invoice.total_amount) || 0;
      const paidAmount = parseFloat(invoice.paid_amount) || 0;
      const status = invoice.status || "draft";

      // Подсчитываем счета по статусам
      if (invoicesByStatus.hasOwnProperty(status)) {
        invoicesByStatus[status].count++;
        invoicesByStatus[status].amount += totalAmount;
      }

      // Общий доход - сумма оплаченных счетов
      if (status === "paid") {
        totalRevenue += totalAmount;
        paidInvoicesCount++;
        
        // Доход за текущий месяц
        const invoiceDate = invoice.invoice_date ? new Date(invoice.invoice_date) : new Date(invoice.created_at);
        if (invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear) {
          monthlyRevenue += totalAmount;
        }

        // Средний срок оплаты
        if (invoice.invoice_date && invoice.paid_at) {
          const invoiceDateObj = new Date(invoice.invoice_date);
          const paidDateObj = new Date(invoice.paid_at);
          const daysDiff = Math.floor((paidDateObj.getTime() - invoiceDateObj.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff >= 0) {
            totalPaymentDays += daysDiff;
            paidInvoicesWithDates++;
          }
        }

        // Активность платежей
        if (invoice.paid_at) {
          const paidDate = new Date(invoice.paid_at);
          if (paidDate >= sevenDaysAgo) {
            paymentActivity7d++;
          }
          if (paidDate >= thirtyDaysAgo) {
            paymentActivity30d++;
          }
        }
      }

      // Счета к отправке
      if (status === "draft") {
        invoicesToSendCount++;
      }

      // Отправленные счета
      if (status === "sent") {
        sentInvoicesCount++;
      }

      // Частично оплаченные
      if (status === "partially_paid") {
        partiallyPaidAmount += (totalAmount - paidAmount);
        partiallyPaidCount++;
      }

      // Счета без договора
      if (!invoice.contract_id) {
        invoicesWithoutContractCount++;
      }

      // Сумма к оплате - неоплаченные счета (не cancelled и не полностью оплаченные)
      if (status !== "paid" && status !== "cancelled") {
        const amountToPay = totalAmount - paidAmount;
        outstandingAmount += amountToPay;

        // Просроченные счета
        if (status === "overdue") {
          overdueAmount += amountToPay;
          overdueInvoicesCount++;
        }
      }
    });

    // Дополнительные расчеты
    const averageInvoiceAmount = paidInvoicesCount > 0 ? totalRevenue / paidInvoicesCount : 0;
    const paymentConversionRate = sentInvoicesCount > 0 ? (paidInvoicesCount / sentInvoicesCount) * 100 : 0;
    const averagePaymentDays = paidInvoicesWithDates > 0 ? totalPaymentDays / paidInvoicesWithDates : 0;
    
    // Ожидаемый доход (сумма активных подписок)
    const expectedRevenue = subscriptions
      .filter(s => s.status === "active")
      .reduce((sum, s) => {
        const planPrice = s.billing_plan?.price || 0;
        return sum + planPrice;
      }, 0);

    // Новые подписки за текущий месяц
    const newSubscriptions = subscriptions.filter(s => {
      const createdDate = new Date(s.created_at);
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
    }).length;

    // Средний доход с договора
    // Используем переданное количество активных договоров или активные подписки как приближение
    const contractsForAverage = activeContractsCount || activeSubscriptions;
    const averageRevenuePerContract = contractsForAverage > 0 ? totalRevenue / contractsForAverage : 0;

    // Процент просрочки
    const overduePercentage = outstandingAmount > 0 ? (overdueAmount / outstandingAmount) * 100 : 0;

    return {
      widgets: {
        // Основные метрики
        total_revenue: {
          title: "Общий доход",
          value: totalRevenue,
          currency: "RUB",
          format: "currency",
        },
        monthly_revenue: {
          title: "Доход за месяц",
          value: monthlyRevenue,
          currency: "RUB",
          format: "currency",
        },
        outstanding_amount: {
          title: "К оплате",
          value: outstandingAmount,
          currency: "RUB",
          format: "currency",
        },
        overdue_amount: {
          title: "Просрочено",
          value: overdueAmount,
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
          value: overdueInvoicesCount,
          format: "number",
        },
        
        // Критичные метрики
        average_invoice_amount: {
          title: "Средний чек",
          value: averageInvoiceAmount,
          currency: "RUB",
          format: "currency",
        },
        payment_conversion_rate: {
          title: "Конверсия оплат",
          value: paymentConversionRate,
          format: "percentage",
        },
        average_payment_days: {
          title: "Средний срок оплаты",
          value: Math.round(averagePaymentDays),
          format: "number",
        },
        expected_revenue: {
          title: "Ожидаемый доход",
          value: expectedRevenue,
          currency: "RUB",
          format: "currency",
        },
        
        // Важные метрики
        invoices_to_send: {
          title: "Счета к отправке",
          value: invoicesToSendCount,
          format: "number",
        },
        partially_paid_amount: {
          title: "Частично оплачено",
          value: partiallyPaidAmount,
          currency: "RUB",
          format: "currency",
        },
        partially_paid_count: {
          title: "Частично оплаченные",
          value: partiallyPaidCount,
          format: "number",
        },
        new_subscriptions: {
          title: "Новые подписки",
          value: newSubscriptions,
          format: "number",
        },
        
        // Полезные метрики
        average_revenue_per_contract: {
          title: "Средний доход с договора",
          value: averageRevenuePerContract,
          currency: "RUB",
          format: "currency",
        },
        overdue_percentage: {
          title: "Процент просрочки",
          value: overduePercentage,
          format: "percentage",
        },
        invoices_without_contract: {
          title: "Счета без договора",
          value: invoicesWithoutContractCount,
          format: "number",
        },
        payment_activity_7d: {
          title: "Платежи за 7 дней",
          value: paymentActivity7d,
          format: "number",
        },
        payment_activity_30d: {
          title: "Платежи за 30 дней",
          value: paymentActivity30d,
          format: "number",
        },
      },
      recent_invoices: recentInvoices,
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
      invoices_by_status: Object.entries(invoicesByStatus).map(([status, data]) => ({
        status: status as InvoiceStatus,
        count: data.count,
        amount: data.amount.toFixed(2),
      })),
    };
  }

  private createMockDashboardData(
    plans: BillingPlan[],
    subscriptions: Subscription[]
  ): BillingDashboardData {
    // Возвращаем пустые данные со всеми виджетами
    return {
      widgets: {
        // Основные метрики
        total_revenue: { title: "Общий доход", value: 0, currency: "RUB", format: "currency" },
        monthly_revenue: { title: "Доход за месяц", value: 0, currency: "RUB", format: "currency" },
        outstanding_amount: { title: "К оплате", value: 0, currency: "RUB", format: "currency" },
        overdue_amount: { title: "Просрочено", value: 0, currency: "RUB", format: "currency" },
        active_subscriptions: { title: "Активные подписки", value: 0, format: "number" },
        overdue_invoices: { title: "Просроченные счета", value: 0, format: "number" },
        
        // Критичные метрики
        average_invoice_amount: { title: "Средний чек", value: 0, currency: "RUB", format: "currency" },
        payment_conversion_rate: { title: "Конверсия оплат", value: 0, format: "percentage" },
        average_payment_days: { title: "Средний срок оплаты", value: 0, format: "number" },
        expected_revenue: { title: "Ожидаемый доход", value: 0, currency: "RUB", format: "currency" },
        
        // Важные метрики
        invoices_to_send: { title: "Счета к отправке", value: 0, format: "number" },
        partially_paid_amount: { title: "Частично оплачено", value: 0, currency: "RUB", format: "currency" },
        partially_paid_count: { title: "Частично оплаченные", value: 0, format: "number" },
        new_subscriptions: { title: "Новые подписки", value: 0, format: "number" },
        
        // Полезные метрики
        average_revenue_per_contract: { title: "Средний доход с договора", value: 0, currency: "RUB", format: "currency" },
        overdue_percentage: { title: "Процент просрочки", value: 0, format: "percentage" },
        invoices_without_contract: { title: "Счета без договора", value: 0, format: "number" },
        payment_activity_7d: { title: "Платежи за 7 дней", value: 0, format: "number" },
        payment_activity_30d: { title: "Платежи за 30 дней", value: 0, format: "number" },
      },
      recent_invoices: [],
      revenue_chart: {
        labels: [],
        datasets: [{
          label: "Доходы",
          data: [],
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
        }],
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
