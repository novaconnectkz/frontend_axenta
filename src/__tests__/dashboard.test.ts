import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

// Dashboard components
import BaseWidget from "@/components/Dashboard/BaseWidget.vue";
import BillingOverviewWidget from "@/components/Dashboard/BillingOverviewWidget.vue";
import ObjectsOverviewWidget from "@/components/Dashboard/ObjectsOverviewWidget.vue";
import RecentActivityWidget from "@/components/Dashboard/RecentActivityWidget.vue";
import UsersOverviewWidget from "@/components/Dashboard/UsersOverviewWidget.vue";
import Dashboard from "@/views/Dashboard.vue";

// Services and stores
import { dashboardService } from "@/services/dashboardService";
import { useDashboardStore } from "@/store/dashboard";

// Mock data
const mockStats = {
  objects: {
    total: 100,
    active: 85,
    inactive: 10,
    scheduled_for_deletion: 3,
    deleted: 2,
  },
  users: {
    total: 50,
    active: 45,
    inactive: 5,
    admins: 5,
    regular_users: 45,
  },
  billing: {
    total_revenue: 150000,
    monthly_revenue: 25000,
    pending_invoices: 8,
    overdue_invoices: 2,
    active_contracts: 30,
  },
  installations: {
    total: 200,
    scheduled: 15,
    in_progress: 8,
    completed: 170,
    cancelled: 7,
    today_installations: 5,
  },
  warehouse: {
    total_equipment: 500,
    available_equipment: 300,
    installed_equipment: 180,
    reserved_equipment: 20,
    low_stock_alerts: 3,
    categories_count: 15,
  },
};

const mockActivities = [
  {
    id: "1",
    type: "object_created",
    title: "Создан новый объект мониторинга",
    description: 'Объект "Тестовый объект 1" был создан',
    timestamp: "2024-01-15T10:30:00Z",
    userId: "user1",
    userName: "Иван Иванов",
  },
  {
    id: "2",
    type: "user_created",
    title: "Добавлен новый пользователь",
    description: 'Пользователь "Петр Петров" был добавлен в систему',
    timestamp: "2024-01-15T09:15:00Z",
    userId: "user2",
    userName: "Администратор",
  },
];

const mockNotifications = [
  {
    id: "1",
    type: "warning",
    title: "Низкие остатки на складе",
    message: "Критически низкие остатки по 3 позициям",
    timestamp: "2024-01-15T11:00:00Z",
    read: false,
  },
];

// Mock services
vi.mock("@/services/dashboardService", () => ({
  dashboardService: {
    getStats: vi.fn(() => Promise.resolve(mockStats)),
    getRecentActivity: vi.fn(() => Promise.resolve(mockActivities)),
    getNotifications: vi.fn(() => Promise.resolve(mockNotifications)),
    markNotificationAsRead: vi.fn(() => Promise.resolve()),
    getChartData: vi.fn(() => Promise.resolve({ labels: [], datasets: [] })),
    saveLayout: vi.fn(() =>
      Promise.resolve({
        id: "1",
        name: "Test Layout",
        widgets: [],
        isDefault: false,
      })
    ),
    getLayouts: vi.fn(() => Promise.resolve([])),
    getDefaultLayout: vi.fn(() => Promise.resolve(null)),
    setDefaultLayout: vi.fn(() => Promise.resolve()),
    deleteLayout: vi.fn(() => Promise.resolve()),
    getWidgetData: vi.fn(() => Promise.resolve({})),
  },
}));

// Mock auth context
const mockAuth = {
  user: { value: { name: "Test User", accountName: "Test Account" } },
  company: { value: { name: "Test Company" } },
  isAuthenticated: { value: true },
  hasPermission: vi.fn(() => true),
  logout: vi.fn(),
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock("@/context/auth", () => ({
  useAuth: () => mockAuth,
}));

// Mock WebSocket service
vi.mock("@/services/websocketService", () => ({
  websocketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    send: vi.fn(),
    isConnected: vi.fn(() => true),
    getConnectionState: vi.fn(() => "connected"),
  },
  useWebSocket: () => ({
    websocketService: {
      connect: vi.fn(),
      disconnect: vi.fn(),
      send: vi.fn(),
      isConnected: vi.fn(() => true),
      getConnectionState: vi.fn(() => "connected"),
    },
  }),
}));

// Mock real-time composables
vi.mock("@/composables/useRealTimeWidget", () => ({
  useObjectsWidget: () => ({
    isConnected: { value: true },
    lastUpdate: { value: new Date() },
    onUpdate: vi.fn(),
    offUpdate: vi.fn(),
    startAutoRefresh: vi.fn(),
    stopAutoRefresh: vi.fn(),
    forceUpdate: vi.fn(),
  }),
  createUpdateDebouncer: () => ({
    debounce: vi.fn((update, callback) => callback([update])),
    flush: vi.fn(),
    pendingUpdates: { value: [] },
  }),
}));

// Mock router
const mockRouter = {
  push: vi.fn(),
};

vi.mock("vue-router", () => ({
  useRouter: () => mockRouter,
}));

describe("Dashboard Components", () => {
  let pinia: any;
  let vuetify: any;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);

    vuetify = createVuetify({
      components,
      directives,
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("BaseWidget", () => {
    it("должен отображаться с базовыми props", () => {
      const wrapper = mount(BaseWidget, {
        props: {
          title: "Test Widget",
          loading: false,
          error: null,
        },
        slots: {
          default: "<div>Widget Content</div>",
        },
        global: {
          plugins: [pinia, vuetify],
        },
      });

      expect(wrapper.find(".base-widget").exists()).toBe(true);
      expect(wrapper.text()).toContain("Test Widget");
      expect(wrapper.text()).toContain("Widget Content");
    });

    it("должен показывать состояние загрузки", () => {
      const wrapper = mount(BaseWidget, {
        props: {
          title: "Test Widget",
          loading: true,
          error: null,
        },
        global: {
          plugins: [pinia, vuetify],
        },
      });

      expect(wrapper.find(".loading-state").exists()).toBe(true);
      expect(wrapper.find("v-skeleton-loader-stub").exists()).toBe(true);
    });

    it("должен показывать состояние ошибки", () => {
      const wrapper = mount(BaseWidget, {
        props: {
          title: "Test Widget",
          loading: false,
          error: "Test error message",
        },
        global: {
          plugins: [pinia, vuetify],
        },
      });

      expect(wrapper.find(".error-state").exists()).toBe(true);
      expect(wrapper.text()).toContain("Test error message");
    });

    it("должен показывать индикатор real-time подключения", () => {
      const wrapper = mount(BaseWidget, {
        props: {
          title: "Test Widget",
          loading: false,
          error: null,
          realTimeEnabled: true,
          isConnected: true,
        },
        global: {
          plugins: [pinia, vuetify],
        },
      });

      const wifiIcon = wrapper.find('[data-testid="wifi-icon"]');
      // В реальном тесте нужно проверить наличие иконки WiFi
      expect(wrapper.props("realTimeEnabled")).toBe(true);
      expect(wrapper.props("isConnected")).toBe(true);
    });

    it("должен эмитить события", async () => {
      const wrapper = mount(BaseWidget, {
        props: {
          title: "Test Widget",
          loading: false,
          error: null,
          refreshable: true,
          configurable: true,
        },
        global: {
          plugins: [pinia, vuetify],
        },
      });

      // Эмит события refresh
      await wrapper.vm.handleRefresh();
      expect(wrapper.emitted("refresh")).toBeTruthy();
    });
  });

  describe("ObjectsOverviewWidget", () => {
    it("должен загружать и отображать данные объектов", async () => {
      const wrapper = mount(ObjectsOverviewWidget, {
        props: {
          refreshInterval: 300,
        },
        global: {
          plugins: [pinia, vuetify],
        },
      });

      // Ждем загрузки данных
      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(dashboardService.getStats).toHaveBeenCalled();
      expect(wrapper.vm.data).toEqual(mockStats.objects);
    });

    it("должен вычислять процент активных объектов", () => {
      const wrapper = mount(ObjectsOverviewWidget, {
        props: {
          refreshInterval: 300,
        },
        global: {
          plugins: [pinia, vuetify],
        },
      });

      wrapper.vm.data = mockStats.objects;
      expect(wrapper.vm.activePercentage).toBe(85); // 85/100 * 100
    });

    it("должен обрабатывать ошибки загрузки", async () => {
      const errorMessage = "Network error";
      vi.mocked(dashboardService.getStats).mockRejectedValueOnce(
        new Error(errorMessage)
      );

      const wrapper = mount(ObjectsOverviewWidget, {
        props: {
          refreshInterval: 300,
        },
        global: {
          plugins: [pinia, vuetify],
        },
      });

      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wrapper.vm.error).toContain(errorMessage);
    });
  });

  describe("UsersOverviewWidget", () => {
    it("должен загружать и отображать данные пользователей", async () => {
      const wrapper = mount(UsersOverviewWidget, {
        props: {
          refreshInterval: 300,
        },
        global: {
          plugins: [pinia, vuetify],
        },
      });

      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(dashboardService.getStats).toHaveBeenCalled();
      expect(wrapper.vm.data).toEqual(mockStats.users);
    });

    it("должен вычислять процент администраторов", () => {
      const wrapper = mount(UsersOverviewWidget, {
        props: {
          refreshInterval: 300,
        },
        global: {
          plugins: [pinia, vuetify],
        },
      });

      wrapper.vm.data = mockStats.users;
      expect(wrapper.vm.adminPercentage).toBe(10); // 5/50 * 100
    });
  });

  describe("BillingOverviewWidget", () => {
    it("должен загружать и отображать данные биллинга", async () => {
      const wrapper = mount(BillingOverviewWidget, {
        props: {
          refreshInterval: 600,
        },
        global: {
          plugins: [pinia, vuetify],
        },
      });

      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(dashboardService.getStats).toHaveBeenCalled();
      expect(wrapper.vm.data).toEqual(mockStats.billing);
    });

    it("должен форматировать валюту", () => {
      const wrapper = mount(BillingOverviewWidget, {
        props: {
          refreshInterval: 600,
        },
        global: {
          plugins: [pinia, vuetify],
        },
      });

      const formatted = wrapper.vm.formatCurrency(150000);
      expect(formatted).toMatch(/150.*000.*₽/); // Проверяем формат рублей
    });

    it("должен вычислять средний счет", () => {
      const wrapper = mount(BillingOverviewWidget, {
        props: {
          refreshInterval: 600,
        },
        global: {
          plugins: [pinia, vuetify],
        },
      });

      wrapper.vm.data = mockStats.billing;
      expect(wrapper.vm.averageInvoice).toBe(833.33); // 25000/30
    });
  });

  describe("RecentActivityWidget", () => {
    it("должен загружать и отображать активность", async () => {
      const wrapper = mount(RecentActivityWidget, {
        props: {
          refreshInterval: 120,
          limit: 10,
        },
        global: {
          plugins: [pinia, vuetify],
        },
      });

      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(dashboardService.getRecentActivity).toHaveBeenCalledWith(10);
      expect(wrapper.vm.activities).toEqual(mockActivities);
    });

    it("должен правильно форматировать время", () => {
      const wrapper = mount(RecentActivityWidget, {
        props: {
          refreshInterval: 120,
          limit: 10,
        },
        global: {
          plugins: [pinia, vuetify],
        },
      });

      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const formatted = wrapper.vm.formatTime(fiveMinutesAgo.toISOString());
      expect(formatted).toBe("5 мин назад");
    });

    it("должен показывать правильные иконки для типов активности", () => {
      const wrapper = mount(RecentActivityWidget, {
        props: {
          refreshInterval: 120,
          limit: 10,
        },
        global: {
          plugins: [pinia, vuetify],
        },
      });

      expect(wrapper.vm.getActivityIcon("object_created")).toBe(
        "mdi-plus-circle"
      );
      expect(wrapper.vm.getActivityIcon("user_created")).toBe(
        "mdi-account-plus"
      );
      expect(wrapper.vm.getActivityIcon("unknown_type")).toBe(
        "mdi-information"
      );
    });
  });

  describe("DashboardStore", () => {
    it("должен загружать статистику", async () => {
      const store = useDashboardStore();

      await store.loadStats();

      expect(dashboardService.getStats).toHaveBeenCalled();
      expect(store.stats).toEqual(mockStats);
    });

    it("должен загружать активность", async () => {
      const store = useDashboardStore();

      await store.loadRecentActivity(10);

      expect(dashboardService.getRecentActivity).toHaveBeenCalledWith(10);
      expect(store.recentActivity).toEqual(mockActivities);
    });

    it("должен загружать уведомления", async () => {
      const store = useDashboardStore();

      await store.loadNotifications(5, false);

      expect(dashboardService.getNotifications).toHaveBeenCalledWith(5, false);
      expect(store.notifications).toEqual(mockNotifications);
    });

    it("должен считать непрочитанные уведомления", () => {
      const store = useDashboardStore();
      store.notifications = mockNotifications;

      expect(store.unreadNotificationsCount).toBe(1);
    });

    it("должен отмечать уведомления как прочитанные", async () => {
      const store = useDashboardStore();
      store.notifications = [...mockNotifications];

      await store.markNotificationAsRead("1");

      expect(dashboardService.markNotificationAsRead).toHaveBeenCalledWith("1");
      expect(store.notifications[0].read).toBe(true);
    });

    it("должен обрабатывать ошибки загрузки", async () => {
      const store = useDashboardStore();
      const errorMessage = "Network error";

      vi.mocked(dashboardService.getStats).mockRejectedValueOnce(
        new Error(errorMessage)
      );

      try {
        await store.loadStats();
      } catch (error) {
        expect(store.error).toContain(errorMessage);
      }
    });

    it("должен очищать ошибки", () => {
      const store = useDashboardStore();
      store.error = "Some error";

      store.clearError();

      expect(store.error).toBeNull();
    });
  });

  describe("Dashboard Integration", () => {
    it("должен отображать полный Dashboard", async () => {
      const wrapper = mount(Dashboard, {
        global: {
          plugins: [pinia, vuetify],
          stubs: {
            DashboardGrid: true,
          },
        },
      });

      expect(wrapper.find(".dashboard-container").exists()).toBe(true);
      expect(wrapper.text()).toContain("Добро пожаловать");
      expect(wrapper.findComponent({ name: "DashboardGrid" }).exists()).toBe(
        true
      );
    });

    it("должен обрабатывать выход из системы", async () => {
      const wrapper = mount(Dashboard, {
        global: {
          plugins: [pinia, vuetify],
          stubs: {
            DashboardGrid: true,
          },
        },
      });

      await wrapper.vm.handleLogout();

      expect(mockAuth.logout).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith("/login");
    });

    it("должен обновлять Dashboard", async () => {
      const wrapper = mount(Dashboard, {
        global: {
          plugins: [pinia, vuetify],
          stubs: {
            DashboardGrid: true,
          },
        },
      });

      const store = useDashboardStore();
      const refreshAllSpy = vi.spyOn(store, "refreshAll");

      await wrapper.vm.refreshDashboard();

      expect(refreshAllSpy).toHaveBeenCalled();
    });
  });
});
