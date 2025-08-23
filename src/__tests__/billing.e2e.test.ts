/**
 * E2E тесты для биллинговых операций
 */

import { billingService } from "@/services/billingService";
import type {
  BillingDashboardData,
  BillingPlan,
  BillingSettings,
  Invoice,
  Subscription,
} from "@/types/billing";
import Billing from "@/views/Billing.vue";
import { mount } from "@vue/test-utils";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createVuetify } from "vuetify";

// Мокаем billingService
vi.mock("@/services/billingService", () => ({
  billingService: {
    getBillingDashboardData: vi.fn(),
    getBillingPlans: vi.fn(),
    getSubscriptions: vi.fn(),
    getInvoices: vi.fn(),
    getBillingSettings: vi.fn(),
    createBillingPlan: vi.fn(),
    updateBillingPlan: vi.fn(),
    deleteBillingPlan: vi.fn(),
    createSubscription: vi.fn(),
    updateSubscription: vi.fn(),
    processPayment: vi.fn(),
    cancelInvoice: vi.fn(),
    updateBillingSettings: vi.fn(),
    formatCurrency: vi.fn().mockImplementation((amount, currency = "RUB") => {
      const value = typeof amount === "string" ? parseFloat(amount) : amount;
      return new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: currency,
      }).format(value || 0);
    }),
    formatDate: vi.fn().mockImplementation((date) => {
      return new Date(date).toLocaleDateString("ru-RU");
    }),
    getInvoiceStatusColor: vi.fn().mockReturnValue("blue"),
    getInvoiceStatusLabel: vi.fn().mockReturnValue("Активен"),
  },
}));

const vuetify = createVuetify();

// Тестовые данные
const mockDashboardData: BillingDashboardData = {
  widgets: {
    total_revenue: {
      title: "Общий доход",
      value: 50000,
      currency: "RUB",
      format: "currency",
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
      value: 5,
      format: "number",
    },
    overdue_invoices: {
      title: "Просроченные счета",
      value: 2,
      format: "number",
    },
  },
  recent_invoices: [],
  revenue_chart: {
    labels: ["Янв", "Фев", "Мар"],
    datasets: [
      {
        label: "Доходы",
        data: [10000, 12000, 15000],
      },
    ],
  },
  invoices_by_status: [],
};

const mockBillingPlans: BillingPlan[] = [
  {
    id: 1,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    name: "Базовый план",
    description: "Базовый тарифный план",
    price: 1000,
    currency: "RUB",
    billing_period: "monthly",
    max_devices: 10,
    max_users: 5,
    max_storage: 100,
    has_analytics: false,
    has_api: false,
    has_support: true,
    has_custom_domain: false,
    is_active: true,
    is_popular: false,
  },
  {
    id: 2,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    name: "Премиум план",
    description: "Премиум тарифный план",
    price: 2500,
    currency: "RUB",
    billing_period: "monthly",
    max_devices: 0,
    max_users: 0,
    max_storage: 0,
    has_analytics: true,
    has_api: true,
    has_support: true,
    has_custom_domain: true,
    is_active: true,
    is_popular: true,
  },
];

const mockSubscriptions: Subscription[] = [
  {
    id: 1,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    company_id: 1,
    billing_plan_id: 1,
    billing_plan: mockBillingPlans[0],
    start_date: "2024-01-01",
    status: "active",
    is_auto_renew: true,
    next_payment_date: "2024-02-01",
    payment_method: "bank_transfer",
  },
];

const mockInvoices: Invoice[] = [
  {
    id: 1,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    number: "INV-2024-01-0001",
    title: "Счет за январь 2024",
    description: "",
    invoice_date: "2024-01-01",
    due_date: "2024-01-15",
    company_id: 1,
    contract_id: 1,
    tariff_plan_id: 1,
    billing_period_start: "2024-01-01",
    billing_period_end: "2024-01-31",
    subtotal_amount: "1000.00",
    tax_rate: "20.00",
    tax_amount: "200.00",
    total_amount: "1200.00",
    currency: "RUB",
    status: "sent",
    paid_amount: "0.00",
    notes: "",
    external_id: "",
    items: [
      {
        id: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        invoice_id: 1,
        name: 'Подписка "Базовый план"',
        description: "",
        item_type: "subscription",
        quantity: "1.000",
        unit_price: "1000.00",
        amount: "1000.00",
        notes: "",
      },
    ],
  },
];

const mockBillingSettings: BillingSettings = {
  id: 1,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  company_id: 1,
  auto_generate_invoices: true,
  invoice_generation_day: 1,
  invoice_payment_term_days: 14,
  default_tax_rate: "20.00",
  tax_included: false,
  notify_before_invoice: 3,
  notify_before_due: 3,
  notify_overdue: 1,
  invoice_number_prefix: "INV",
  invoice_number_format: "%s-%04d",
  currency: "RUB",
  default_payment_method: "bank_transfer",
  allow_partial_payments: true,
  require_payment_confirm: false,
  enable_inactive_discounts: true,
  inactive_discount_ratio: "0.50",
};

describe("Billing E2E Tests", () => {
  beforeAll(() => {
    // Моки уже настроены в setup.ts
  });

  beforeEach(() => {
    // Сбрасываем все моки
    vi.clearAllMocks();

    // Устанавливаем базовые возвращаемые значения
    vi.mocked(billingService.getBillingDashboardData).mockResolvedValue(
      mockDashboardData
    );
    vi.mocked(billingService.getBillingPlans).mockResolvedValue(
      mockBillingPlans
    );
    vi.mocked(billingService.getSubscriptions).mockResolvedValue(
      mockSubscriptions
    );
    vi.mocked(billingService.getInvoices).mockResolvedValue({
      invoices: mockInvoices,
      total: 1,
    });
    vi.mocked(billingService.getBillingSettings).mockResolvedValue(
      mockBillingSettings
    );
  });

  describe("Инициализация страницы", () => {
    it("должна загружать и отображать данные дашборда", async () => {
      const wrapper = mount(Billing, {
        global: {
          plugins: [vuetify],
        },
      });

      // Ждем загрузки данных
      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Проверяем, что сервисы были вызваны
      expect(billingService.getBillingDashboardData).toHaveBeenCalledWith(1);
      expect(billingService.getBillingPlans).toHaveBeenCalledWith(1);
      expect(billingService.getSubscriptions).toHaveBeenCalledWith(1);

      // Проверяем отображение статистических карточек
      const cards = wrapper.findAll(".v-card");
      expect(cards.length).toBeGreaterThan(4); // 4 статистические карточки + другие карточки

      // Проверяем наличие основных элементов
      expect(wrapper.find("h1").text()).toContain("Биллинг");
      expect(wrapper.find(".v-tabs").exists()).toBe(true);
    });

    it("должна отображать вкладки биллинга", async () => {
      const wrapper = mount(Billing, {
        global: {
          plugins: [vuetify],
        },
      });

      await wrapper.vm.$nextTick();

      const tabs = wrapper.findAll(".v-tab");
      expect(tabs).toHaveLength(4); // plans, subscriptions, invoices, settings

      const tabTexts = tabs.map((tab) => tab.text());
      expect(tabTexts).toContain("Тарифные планы");
      expect(tabTexts).toContain("Подписки");
      expect(tabTexts).toContain("Счета");
      expect(tabTexts).toContain("Настройки");
    });
  });

  describe("Управление тарифными планами", () => {
    it("должна отображать список тарифных планов", async () => {
      const wrapper = mount(Billing, {
        global: {
          plugins: [vuetify],
        },
      });

      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Проверяем, что планы загружены
      expect(wrapper.vm.plans).toHaveLength(2);
      expect(wrapper.vm.plans[0].name).toBe("Базовый план");
      expect(wrapper.vm.plans[1].name).toBe("Премиум план");
    });

    it("должна открывать диалог создания плана", async () => {
      const wrapper = mount(Billing, {
        global: {
          plugins: [vuetify],
        },
      });

      await wrapper.vm.$nextTick();

      // Находим и кликаем кнопку "Добавить план"
      const addButton = wrapper.find('[data-test="add-plan-button"]');
      if (addButton.exists()) {
        await addButton.trigger("click");
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.planDialog).toBe(true);
      }
    });

    it("должна создавать новый тарифный план", async () => {
      vi.mocked(billingService.createBillingPlan).mockResolvedValue({
        ...mockBillingPlans[0],
        id: 3,
        name: "Новый план",
      });

      const wrapper = mount(Billing, {
        global: {
          plugins: [vuetify],
        },
      });

      await wrapper.vm.$nextTick();

      // Устанавливаем данные для нового плана
      wrapper.vm.editingPlan = {
        name: "Новый план",
        description: "Описание нового плана",
        price: 1500,
        currency: "RUB",
        billing_period: "monthly",
        max_devices: 20,
        max_users: 10,
        max_storage: 200,
        has_analytics: true,
        has_api: false,
        has_support: true,
        has_custom_domain: false,
        is_active: true,
        is_popular: false,
      };

      wrapper.vm.planFormValid = true;

      // Вызываем метод сохранения
      await wrapper.vm.savePlan();

      expect(billingService.createBillingPlan).toHaveBeenCalledWith({
        name: "Новый план",
        description: "Описание нового плана",
        price: 1500,
        currency: "RUB",
        billing_period: "monthly",
        max_devices: 20,
        max_users: 10,
        max_storage: 200,
        has_analytics: true,
        has_api: false,
        has_support: true,
        has_custom_domain: false,
        is_active: true,
        is_popular: false,
      });
    });
  });

  describe("Управление подписками", () => {
    it("должна отображать список подписок", async () => {
      const wrapper = mount(Billing, {
        global: {
          plugins: [vuetify],
        },
      });

      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wrapper.vm.subscriptions).toHaveLength(1);
      expect(wrapper.vm.subscriptions[0].billing_plan?.name).toBe(
        "Базовый план"
      );
    });

    it("должна создавать новую подписку", async () => {
      vi.mocked(billingService.createSubscription).mockResolvedValue({
        ...mockSubscriptions[0],
        id: 2,
        billing_plan_id: 2,
      });

      const wrapper = mount(Billing, {
        global: {
          plugins: [vuetify],
        },
      });

      await wrapper.vm.$nextTick();

      wrapper.vm.editingSubscription = {
        company_id: 1,
        billing_plan_id: 2,
        start_date: "2024-02-01",
        status: "active",
        is_auto_renew: true,
      };

      wrapper.vm.subscriptionFormValid = true;

      await wrapper.vm.saveSubscription();

      expect(billingService.createSubscription).toHaveBeenCalledWith({
        company_id: 1,
        billing_plan_id: 2,
        start_date: "2024-02-01",
        status: "active",
        is_auto_renew: true,
      });
    });
  });

  describe("Управление счетами", () => {
    it("должна загружать счета при переключении на вкладку", async () => {
      const wrapper = mount(Billing, {
        global: {
          plugins: [vuetify],
        },
      });

      await wrapper.vm.$nextTick();

      // Переключаемся на вкладку счетов
      wrapper.vm.activeTab = "invoices";
      await wrapper.vm.$nextTick();

      expect(billingService.getInvoices).toHaveBeenCalledWith({
        company_id: 1,
      });
    });

    it("должна обрабатывать платеж по счету", async () => {
      vi.mocked(billingService.processPayment).mockResolvedValue({
        ...mockInvoices[0],
        status: "paid",
        paid_amount: "1200.00",
      });

      const wrapper = mount(Billing, {
        global: {
          plugins: [vuetify],
        },
      });

      await wrapper.vm.$nextTick();

      wrapper.vm.selectedInvoice = mockInvoices[0];
      wrapper.vm.paymentData = {
        amount: "1200.00",
        payment_method: "bank_transfer",
        notes: "Оплата по банковскому переводу",
      };

      await wrapper.vm.processPayment();

      expect(billingService.processPayment).toHaveBeenCalledWith(1, {
        amount: "1200.00",
        payment_method: "bank_transfer",
        notes: "Оплата по банковскому переводу",
      });
    });

    it("должна отменять счет", async () => {
      vi.mocked(billingService.cancelInvoice).mockResolvedValue();

      // Мокаем prompt
      const mockPrompt = vi.fn().mockReturnValue("Ошибка в счете");
      window.prompt = mockPrompt;

      const wrapper = mount(Billing, {
        global: {
          plugins: [vuetify],
        },
      });

      await wrapper.vm.$nextTick();

      await wrapper.vm.cancelInvoice(mockInvoices[0]);

      expect(mockPrompt).toHaveBeenCalledWith("Укажите причину отмены счета:");
      expect(billingService.cancelInvoice).toHaveBeenCalledWith(1, {
        reason: "Ошибка в счете",
      });
    });
  });

  describe("Настройки биллинга", () => {
    it("должна загружать настройки при переключении на вкладку", async () => {
      const wrapper = mount(Billing, {
        global: {
          plugins: [vuetify],
        },
      });

      await wrapper.vm.$nextTick();

      // Переключаемся на вкладку настроек
      wrapper.vm.activeTab = "settings";
      await wrapper.vm.$nextTick();

      expect(billingService.getBillingSettings).toHaveBeenCalledWith(1);
    });

    it("должна сохранять настройки биллинга", async () => {
      vi.mocked(billingService.updateBillingSettings).mockResolvedValue(
        mockBillingSettings
      );

      const wrapper = mount(Billing, {
        global: {
          plugins: [vuetify],
        },
      });

      await wrapper.vm.$nextTick();

      wrapper.vm.billingSettings = {
        ...mockBillingSettings,
        auto_generate_invoices: false,
        invoice_payment_term_days: 30,
      };

      await wrapper.vm.saveSettings();

      expect(billingService.updateBillingSettings).toHaveBeenCalledWith(1, {
        ...mockBillingSettings,
        auto_generate_invoices: false,
        invoice_payment_term_days: 30,
      });
    });
  });

  describe("Фильтрация и поиск", () => {
    it("должна фильтровать тарифные планы по поисковому запросу", async () => {
      const wrapper = mount(Billing, {
        global: {
          plugins: [vuetify],
        },
      });

      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Устанавливаем поисковый запрос
      wrapper.vm.planSearchQuery = "Базовый";

      expect(wrapper.vm.filteredPlans).toHaveLength(1);
      expect(wrapper.vm.filteredPlans[0].name).toBe("Базовый план");
    });

    it("должна фильтровать тарифные планы по статусу", async () => {
      const wrapper = mount(Billing, {
        global: {
          plugins: [vuetify],
        },
      });

      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Добавляем неактивный план
      wrapper.vm.plans.push({
        ...mockBillingPlans[0],
        id: 3,
        name: "Неактивный план",
        is_active: false,
      });

      // Фильтруем только активные планы
      wrapper.vm.planStatusFilter = true;

      expect(wrapper.vm.filteredPlans).toHaveLength(2);
      expect(wrapper.vm.filteredPlans.every((plan) => plan.is_active)).toBe(
        true
      );
    });

    it("должна фильтровать счета по статусу", async () => {
      const wrapper = mount(Billing, {
        global: {
          plugins: [vuetify],
        },
      });

      await wrapper.vm.$nextTick();

      // Добавляем счета с разными статусами
      wrapper.vm.invoices = [
        ...mockInvoices,
        {
          ...mockInvoices[0],
          id: 2,
          status: "paid",
        },
      ];

      // Фильтруем только отправленные счета
      wrapper.vm.invoiceStatusFilter = "sent";

      expect(wrapper.vm.filteredInvoices).toHaveLength(1);
      expect(wrapper.vm.filteredInvoices[0].status).toBe("sent");
    });
  });

  describe("Обработка ошибок", () => {
    it("должна обрабатывать ошибки при загрузке данных", async () => {
      vi.mocked(billingService.getBillingPlans).mockRejectedValue(
        new Error("Network error")
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const wrapper = mount(Billing, {
        global: {
          plugins: [vuetify],
        },
      });

      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(consoleSpy).toHaveBeenCalledWith(
        "Ошибка при загрузке планов:",
        expect.any(Error)
      );
      expect(wrapper.vm.loadingPlans).toBe(false);

      consoleSpy.mockRestore();
    });

    it("должна обрабатывать ошибки при сохранении плана", async () => {
      vi.mocked(billingService.createBillingPlan).mockRejectedValue(
        new Error("Validation error")
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const wrapper = mount(Billing, {
        global: {
          plugins: [vuetify],
        },
      });

      await wrapper.vm.$nextTick();

      wrapper.vm.editingPlan = { name: "Test Plan", price: 1000 };
      wrapper.vm.planFormValid = true;

      await wrapper.vm.savePlan();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Ошибка при сохранении плана:",
        expect.any(Error)
      );
      expect(wrapper.vm.savingPlan).toBe(false);

      consoleSpy.mockRestore();
    });
  });
});
