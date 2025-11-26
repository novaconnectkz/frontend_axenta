import { dashboardService } from "@/services/dashboardService";
import type {
  ActivityItem,
  DashboardLayout,
  DashboardStats,
  NotificationItem,
  QuickAction,
  Widget,
} from "@/types/dashboard";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useDashboardStore = defineStore("dashboard", () => {
  // State
  const stats = ref<DashboardStats | null>(null);
  const currentLayout = ref<DashboardLayout | null>(null);
  const availableLayouts = ref<DashboardLayout[]>([]);
  const recentActivity = ref<ActivityItem[]>([]);
  const notifications = ref<NotificationItem[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const lastRefresh = ref<Date | null>(null);
  const quickActionsPosition = ref<'top' | 'bottom'>('bottom');

  // Quick Actions Configuration
  const quickActions = ref<QuickAction[]>([
    {
      id: "create-object",
      title: "Создать объект",
      icon: "mdi-plus-circle",
      color: "primary",
      route: "/objects?action=create",
      permission: "objects.create",
    },
    {
      id: "create-user",
      title: "Добавить пользователя",
      icon: "mdi-account-plus",
      color: "success",
      route: "/users/create",
      permission: "users.create",
    },
    {
      id: "schedule-installation",
      title: "Запланировать монтаж",
      icon: "mdi-calendar-plus",
      color: "warning",
      route: "/installations/create",
      permission: "installations.create",
    },
    {
      id: "add-equipment",
      title: "Добавить оборудование",
      icon: "mdi-package-variant-plus",
      color: "info",
      route: "/warehouse/equipment/create",
      permission: "warehouse.create",
    },
    {
      id: "generate-report",
      title: "Создать отчет",
      icon: "mdi-file-chart",
      color: "secondary",
      route: "/reports/create",
      permission: "reports.create",
    },
    {
      id: "view-analytics",
      title: "Аналитика",
      icon: "mdi-chart-line",
      color: "purple",
      route: "/analytics",
      permission: "analytics.view",
    },
    {
      id: "settings",
      title: "Настройки",
      icon: "mdi-cog",
      color: "grey",
      route: "/settings",
      permission: "settings.manage",
    },
  ]);

  // Getters
  const unreadNotificationsCount = computed(
    () => notifications.value.filter((n) => !n.read).length
  );

  const hasRecentActivity = computed(() => recentActivity.value.length > 0);

  const isStatsLoaded = computed(() => stats.value !== null);

  const isLayoutLoaded = computed(() => currentLayout.value !== null);

  // Actions
  const loadStats = async () => {
    try {
      // Убираем loading состояние, чтобы не было размытия экрана
      // if (!dashboardService.isMockMode()) {
      //   isLoading.value = true;
      // }
      error.value = null;
      stats.value = await dashboardService.getStats();
      lastRefresh.value = new Date();
    } catch (err: any) {
      error.value = err.message || "Ошибка загрузки статистики";
      throw err;
    } finally {
      // isLoading.value = false; // Убираем, чтобы не было loading состояний
    }
  };

  const loadRecentActivity = async (limit: number = 10) => {
    try {
      recentActivity.value = await dashboardService.getRecentActivity(limit);
    } catch (err: any) {
      console.error("Ошибка загрузки активности:", err);
    }
  };

  const loadNotifications = async (
    limit: number = 5,
    unreadOnly: boolean = false
  ) => {
    try {
      notifications.value = await dashboardService.getNotifications(
        limit,
        unreadOnly
      );
    } catch (err: any) {
      console.error("Ошибка загрузки уведомлений:", err);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await dashboardService.markNotificationAsRead(notificationId);
      const notification = notifications.value.find(
        (n) => n.id === notificationId
      );
      if (notification) {
        notification.read = true;
      }
    } catch (err: any) {
      console.error("Ошибка отметки уведомления:", err);
    }
  };

  const loadLayouts = async () => {
    try {
      availableLayouts.value = await dashboardService.getLayouts();

      // Если нет текущего макета, загружаем макет по умолчанию
      if (!currentLayout.value) {
        const defaultLayout = await dashboardService.getDefaultLayout();
        if (defaultLayout) {
          currentLayout.value = defaultLayout;
        } else if (availableLayouts.value.length > 0) {
          currentLayout.value = availableLayouts.value[0];
        } else {
          // Создаем макет по умолчанию
          currentLayout.value = createDefaultLayout();
        }
      }
      
      // Загружаем сохраненные позиции виджетов, порядок быстрых действий и позицию блока
      loadWidgetPositions();
      loadQuickActionsOrder();
      loadQuickActionsPosition();
    } catch (err: any) {
      console.error("Ошибка загрузки макетов:", err);
      // Создаем макет по умолчанию при ошибке
      currentLayout.value = createDefaultLayout();
      loadWidgetPositions();
      loadQuickActionsOrder();
      loadQuickActionsPosition();
    }
  };

  const saveCurrentLayout = async () => {
    if (!currentLayout.value) return;

    try {
      const savedLayout = await dashboardService.saveLayout(
        currentLayout.value
      );
      currentLayout.value = savedLayout;

      // Обновляем список доступных макетов
      const existingIndex = availableLayouts.value.findIndex(
        (l) => l.id === savedLayout.id
      );
      if (existingIndex >= 0) {
        availableLayouts.value[existingIndex] = savedLayout;
      } else {
        availableLayouts.value.push(savedLayout);
      }
    } catch (err: any) {
      error.value = err.message || "Ошибка сохранения макета";
      throw err;
    }
  };

  const switchLayout = async (layoutId: string) => {
    const layout = availableLayouts.value.find((l) => l.id === layoutId);
    if (layout) {
      currentLayout.value = layout;
    }
  };

  const setDefaultLayout = async (layoutId: string) => {
    try {
      await dashboardService.setDefaultLayout(layoutId);

      // Обновляем флаги в локальных данных
      availableLayouts.value.forEach((layout) => {
        layout.isDefault = layout.id === layoutId;
      });

      if (currentLayout.value) {
        currentLayout.value.isDefault = currentLayout.value.id === layoutId;
      }
    } catch (err: any) {
      error.value = err.message || "Ошибка установки макета по умолчанию";
      throw err;
    }
  };

  const deleteLayout = async (layoutId: string) => {
    try {
      await dashboardService.deleteLayout(layoutId);
      availableLayouts.value = availableLayouts.value.filter(
        (l) => l.id !== layoutId
      );

      // Если удаляем текущий макет, переключаемся на другой
      if (currentLayout.value?.id === layoutId) {
        if (availableLayouts.value.length > 0) {
          currentLayout.value = availableLayouts.value[0];
        } else {
          currentLayout.value = createDefaultLayout();
        }
      }
    } catch (err: any) {
      error.value = err.message || "Ошибка удаления макета";
      throw err;
    }
  };

  const updateWidget = (widgetId: string, updates: Partial<Widget>) => {
    if (!currentLayout.value) return;

    const widgetIndex = currentLayout.value.widgets.findIndex(
      (w) => w.id === widgetId
    );
    if (widgetIndex >= 0) {
      currentLayout.value.widgets[widgetIndex] = {
        ...currentLayout.value.widgets[widgetIndex],
        ...updates,
      };
    }
  };


  const updateWidgetOrder = (newOrder: Widget[]) => {
    if (!currentLayout.value) return;
    
    currentLayout.value.widgets = newOrder;
    // Автоматически сохраняем изменения в localStorage
    saveWidgetPositions();
  };

  const saveWidgetPositions = () => {
    if (!currentLayout.value) return;
    
    try {
      const positions = currentLayout.value.widgets.map(widget => ({
        id: widget.id,
        position: widget.position,
        dimensions: widget.dimensions,
        visible: widget.visible
      }));
      
      localStorage.setItem(`dashboard-positions-${currentLayout.value.id}`, JSON.stringify(positions));
    } catch (error) {
      console.error('Ошибка сохранения позиций виджетов:', error);
    }
  };

  const saveQuickActionsOrder = (newOrder: QuickAction[]) => {
    try {
      const orderIds = newOrder.map(action => action.id);
      localStorage.setItem('dashboard-quick-actions-order', JSON.stringify(orderIds));
      quickActions.value = newOrder;
    } catch (error) {
      console.error('Ошибка сохранения порядка быстрых действий:', error);
    }
  };

  const loadQuickActionsOrder = () => {
    try {
      const savedOrder = localStorage.getItem('dashboard-quick-actions-order');
      if (savedOrder) {
        const orderIds = JSON.parse(savedOrder);
        
        // Переупорядочиваем быстрые действия согласно сохраненному порядку
        const orderedActions: QuickAction[] = [];
        const remainingActions = [...quickActions.value];
        
        // Сначала добавляем действия в сохраненном порядке
        orderIds.forEach((id: string) => {
          const actionIndex = remainingActions.findIndex(action => action.id === id);
          if (actionIndex >= 0) {
            orderedActions.push(remainingActions.splice(actionIndex, 1)[0]);
          }
        });
        
        // Добавляем оставшиеся действия (новые, которых не было в сохраненном порядке)
        orderedActions.push(...remainingActions);
        
        quickActions.value = orderedActions;
      }
    } catch (error) {
      console.error('Ошибка загрузки порядка быстрых действий:', error);
    }
  };

  const saveQuickActionsPosition = (position: 'top' | 'bottom') => {
    try {
      console.log('Сохранение позиции быстрых действий:', position);
      localStorage.setItem('dashboard-quick-actions-position', position);
      quickActionsPosition.value = position;
      console.log('Позиция сохранена, новое значение:', quickActionsPosition.value);
    } catch (error) {
      console.error('Ошибка сохранения позиции блока быстрых действий:', error);
    }
  };

  const loadQuickActionsPosition = () => {
    try {
      const savedPosition = localStorage.getItem('dashboard-quick-actions-position') as 'top' | 'bottom' | null;
      if (savedPosition && (savedPosition === 'top' || savedPosition === 'bottom')) {
        quickActionsPosition.value = savedPosition;
      }
    } catch (error) {
      console.error('Ошибка загрузки позиции блока быстрых действий:', error);
    }
  };

  const toggleQuickActionsPosition = () => {
    const newPosition = quickActionsPosition.value === 'top' ? 'bottom' : 'top';
    console.log('Переключение позиции быстрых действий:', quickActionsPosition.value, '->', newPosition);
    saveQuickActionsPosition(newPosition);
  };

  const loadWidgetPositions = () => {
    if (!currentLayout.value) return;
    
    try {
      const savedPositions = localStorage.getItem(`dashboard-positions-${currentLayout.value.id}`);
      if (savedPositions) {
        const positions = JSON.parse(savedPositions);
        
        // Обновляем позиции виджетов из сохраненных данных
        positions.forEach((savedPos: any) => {
          const widgetIndex = currentLayout.value!.widgets.findIndex(w => w.id === savedPos.id);
          if (widgetIndex >= 0) {
            currentLayout.value!.widgets[widgetIndex].position = savedPos.position;
            if (savedPos.dimensions) {
              currentLayout.value!.widgets[widgetIndex].dimensions = savedPos.dimensions;
            }
            currentLayout.value!.widgets[widgetIndex].visible = savedPos.visible;
          }
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки позиций виджетов:', error);
    }
  };

  const addWidget = (widget: Widget) => {
    if (!currentLayout.value) return;

    currentLayout.value.widgets.push(widget);
  };

  const removeWidget = (widgetId: string) => {
    if (!currentLayout.value) return;

    currentLayout.value.widgets = currentLayout.value.widgets.filter(
      (w) => w.id !== widgetId
    );
  };



  const refreshAll = async () => {
    try {
      // ✅ Приоритизированная загрузка для лучшей производительности
      
      // 1. КРИТИЧНО: Загружаем основную статистику первой
      //    Это покажет основные виджеты пользователю быстрее
      console.log('📊 Step 1: Loading critical stats...');
      await loadStats();
      
      // 2. НЕКРИТИЧНО: Загружаем остальные данные параллельно
      //    Используем allSettled чтобы одна ошибка не блокировала остальные
      console.log('📊 Step 2: Loading non-critical data...');
      const results = await Promise.allSettled([
        loadRecentActivity(),
        loadNotifications(),
        loadLayouts(),
      ]);
      
      // Логируем ошибки, но не прерываем работу
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const names = ['recentActivity', 'notifications', 'layouts'];
          console.warn(`⚠️ Failed to load ${names[index]}:`, result.reason);
        }
      });
      
      console.log('✅ Dashboard refresh complete');
      
    } catch (error) {
      // Обрабатываем только критические ошибки (loadStats)
      console.error('❌ Critical dashboard refresh error:', error);
      // Не выбрасываем ошибку - даем пользователю работать с тем что есть
    }
  };

  const clearError = () => {
    error.value = null;
  };

  // Инициализация mock-данных
  const initializeMockData = () => {
    if (dashboardService.isMockMode()) {
      // Сразу загружаем mock-данные без ожидания
      stats.value = {
        objects: {
          total: 156,
          active: 142,
          inactive: 12,
          scheduled_for_deletion: 2,
          deleted: 0,
        },
        users: {
          total: 28,
          active: 25,
          inactive: 3,
          admins: 4,
          regular_users: 24,
        },
        accounts: {
          total: 45,
          active: 38,
          blocked: 7,
          clients: 35,
          partners: 10,
        },
        billing: {
          total_revenue: 2850000,
          monthly_revenue: 485000,
          pending_invoices: 8,
          overdue_invoices: 2,
          active_contracts: 142,
        },
        installations: {
          total: 89,
          scheduled: 12,
          in_progress: 5,
          completed: 68,
          cancelled: 4,
          today_installations: 3,
        },
        warehouse: {
          total_equipment: 1247,
          available_equipment: 856,
          installed_equipment: 312,
          reserved_equipment: 79,
          low_stock_alerts: 5,
          categories_count: 15,
        },
      };

      currentLayout.value = {
        id: "default-layout",
        name: "Макет по умолчанию",
        isDefault: true,
        widgets: [
          {
            id: "objects-overview",
            title: "Обзор объектов",
            type: "objects-overview",
            size: "medium",
            position: { row: 0, col: 0, width: 6, height: 4 },
            config: { refreshInterval: 300 },
            visible: true,
          },
          {
            id: "accounts-overview",
            title: "Статистика Учетные записи",
            type: "accounts-overview",
            size: "medium",
            position: { row: 0, col: 6, width: 6, height: 4 },
            config: { refreshInterval: 300 },
            visible: true,
          },
          {
            id: "billing-overview",
            title: "Обзор биллинга",
            type: "billing-overview",
            size: "large",
            position: { row: 4, col: 0, width: 8, height: 4 },
            config: { refreshInterval: 600 },
            visible: true,
          },
          {
            id: "recent-activity",
            title: "Последняя активность",
            type: "recent-activity",
            size: "medium",
            position: { row: 4, col: 8, width: 4, height: 8 },
            config: { refreshInterval: 120 },
            visible: true,
          },
          {
            id: "installations-overview",
            title: "Обзор монтажей",
            type: "installations-overview",
            size: "medium",
            position: { row: 8, col: 0, width: 6, height: 4 },
            config: { refreshInterval: 300 },
            visible: true,
          },
          {
            id: "warehouse-overview",
            title: "Обзор склада",
            type: "warehouse-overview",
            size: "medium",
            position: { row: 8, col: 6, width: 6, height: 4 },
            config: { refreshInterval: 600 },
            visible: true,
          },
        ],
      };

      lastRefresh.value = new Date();
    }
  };

  // Helper function to create default layout
  const createDefaultLayout = (): DashboardLayout => ({
    id: "",
    name: "Макет по умолчанию",
    isDefault: true,
    widgets: [
      {
        id: "objects-overview",
        title: "Обзор объектов",
        type: "objects-overview",
        size: "medium",
        position: { row: 0, col: 0, width: 6, height: 4 },
        config: { refreshInterval: 300 },
        visible: true,
      },
      {
        id: "accounts-overview",
        title: "Статистика Учетные записи",
        type: "accounts-overview",
        size: "medium",
        position: { row: 0, col: 6, width: 6, height: 4 },
        config: { refreshInterval: 300 },
        visible: true,
      },
      {
        id: "billing-overview",
        title: "Обзор биллинга",
        type: "billing-overview",
        size: "large",
        position: { row: 4, col: 0, width: 8, height: 4 },
        config: { refreshInterval: 600 },
        visible: true,
      },
      {
        id: "recent-activity",
        title: "Последняя активность",
        type: "recent-activity",
        size: "medium",
        position: { row: 4, col: 8, width: 4, height: 8 },
        config: { refreshInterval: 120 },
        visible: true,
      },
      {
        id: "installations-overview",
        title: "Обзор монтажей",
        type: "installations-overview",
        size: "medium",
        position: { row: 8, col: 0, width: 6, height: 4 },
        config: { refreshInterval: 300 },
        visible: true,
      },
      {
        id: "warehouse-overview",
        title: "Обзор склада",
        type: "warehouse-overview",
        size: "medium",
        position: { row: 8, col: 6, width: 6, height: 4 },
        config: { refreshInterval: 600 },
        visible: true,
      },
    ],
  });

  return {
    // State
    stats,
    currentLayout,
    availableLayouts,
    recentActivity,
    notifications,
    quickActions,
    quickActionsPosition,
    isLoading,
    error,
    lastRefresh,

    // Getters
    unreadNotificationsCount,
    hasRecentActivity,
    isStatsLoaded,
    isLayoutLoaded,

    // Actions
    loadStats,
    loadRecentActivity,
    loadNotifications,
    markNotificationAsRead,
    loadLayouts,
    saveCurrentLayout,
    switchLayout,
    setDefaultLayout,
    deleteLayout,
    updateWidget,
    updateWidgetOrder,
    saveWidgetPositions,
    loadWidgetPositions,
    saveQuickActionsOrder,
    loadQuickActionsOrder,
    saveQuickActionsPosition,
    loadQuickActionsPosition,
    toggleQuickActionsPosition,
    addWidget,
    removeWidget,
    refreshAll,
    clearError,
    initializeMockData,
  };
});

// Инициализация mock-данных при создании store
export const useDashboardStoreWithInit = () => {
  const store = useDashboardStore();

  // Инициализируем mock-данные если включен mock режим
  if (dashboardService.isMockMode() && !store.isStatsLoaded) {
    store.initializeMockData();
  }

  return store;
};

export type DashboardStore = ReturnType<typeof useDashboardStore>;
