import type {
  ActivityItem,
  ChartData,
  DashboardLayout,
  DashboardStats,
  NotificationItem,
} from "@/types/dashboard";

// Mock статистика для Dashboard
export const mockDashboardStats: DashboardStats = {
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

// Mock последняя активность
export const mockRecentActivity: ActivityItem[] = [
  {
    id: "1",
    type: "object_created",
    title: "Создан новый объект",
    description: "Объект 'ТЦ Галерея' добавлен в систему",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    userId: "user1",
    userName: "Иван Петров",
    metadata: { objectId: "obj_123", objectName: "ТЦ Галерея" },
  },
  {
    id: "2",
    type: "installation_scheduled",
    title: "Запланирован монтаж",
    description: "Монтаж оборудования на объекте 'Офис Центр'",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    userId: "user2",
    userName: "Мария Сидорова",
    metadata: { installationId: "inst_456", objectName: "Офис Центр" },
  },
  {
    id: "3",
    type: "payment_received",
    title: "Получен платеж",
    description: "Оплата по счету №12345 на сумму 125,000 руб.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    userId: "system",
    userName: "Система",
    metadata: { invoiceId: "inv_12345", amount: 125000 },
  },
  {
    id: "4",
    type: "user_created",
    title: "Добавлен пользователь",
    description: "Новый пользователь 'Алексей Козлов' зарегистрирован",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    userId: "admin1",
    userName: "Администратор",
    metadata: { newUserId: "user_789", newUserName: "Алексей Козлов" },
  },
  {
    id: "5",
    type: "object_updated",
    title: "Обновлен объект",
    description: "Изменена конфигурация объекта 'Склад №3'",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    userId: "user3",
    userName: "Сергей Волков",
    metadata: { objectId: "obj_789", objectName: "Склад №3" },
  },
  {
    id: "6",
    type: "invoice_generated",
    title: "Создан счет",
    description: "Выставлен счет №12346 на сумму 89,500 руб.",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    userId: "billing_system",
    userName: "Биллинг система",
    metadata: { invoiceId: "inv_12346", amount: 89500 },
  },
  {
    id: "7",
    type: "object_deleted",
    title: "Удален объект",
    description: "Объект 'Временная точка' удален из системы",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    userId: "admin2",
    userName: "Главный администратор",
    metadata: { objectId: "obj_temp", objectName: "Временная точка" },
  },
];

// Mock уведомления
export const mockNotifications: NotificationItem[] = [
  {
    id: "notif_1",
    type: "warning",
    title: "Низкий уровень запасов",
    message: "На складе заканчивается оборудование: IP-камеры (осталось 3 шт.)",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    read: false,
    actionUrl: "/warehouse",
    actionText: "Перейти на склад",
  },
  {
    id: "notif_2",
    type: "info",
    title: "Плановое обслуживание",
    message: "Завтра с 02:00 до 04:00 запланировано обслуживание серверов",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
    actionUrl: "/maintenance",
    actionText: "Подробнее",
  },
  {
    id: "notif_3",
    type: "error",
    title: "Просроченные счета",
    message: "Обнаружено 2 просроченных счета на общую сумму 234,500 руб.",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    read: true,
    actionUrl: "/billing",
    actionText: "Просмотреть счета",
  },
  {
    id: "notif_4",
    type: "success",
    title: "Монтаж завершен",
    message: "Успешно завершен монтаж на объекте 'Торговый центр Мега'",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    read: true,
    actionUrl: "/installations",
    actionText: "Просмотреть детали",
  },
  {
    id: "notif_5",
    type: "info",
    title: "Новое обновление",
    message: "Доступна новая версия системы с улучшениями безопасности",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    read: true,
    actionUrl: "/updates",
    actionText: "Обновить",
  },
];

// Mock данные для графиков
export const mockChartData: Record<string, ChartData> = {
  "objects-monthly": {
    labels: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн"],
    datasets: [
      {
        label: "Новые объекты",
        data: [12, 19, 8, 15, 22, 18],
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2,
      },
    ],
  },
  "revenue-monthly": {
    labels: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн"],
    datasets: [
      {
        label: "Выручка (тыс. руб.)",
        data: [420, 485, 398, 512, 467, 485],
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 2,
      },
    ],
  },
  "installations-weekly": {
    labels: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    datasets: [
      {
        label: "Монтажи",
        data: [3, 5, 2, 8, 4, 1, 0],
        backgroundColor: "rgba(255, 206, 86, 0.2)",
        borderColor: "rgba(255, 206, 86, 1)",
        borderWidth: 2,
      },
    ],
  },
  "warehouse-categories": {
    labels: ["IP-камеры", "DVR", "Кабели", "Датчики", "Прочее"],
    datasets: [
      {
        label: "Количество",
        data: [245, 89, 156, 78, 134],
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(255, 206, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
          "rgba(153, 102, 255, 0.2)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  },
};

// Mock макеты Dashboard
export const mockDashboardLayouts: DashboardLayout[] = [
  {
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
        id: "users-overview",
        title: "Обзор пользователей",
        type: "users-overview",
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
  },
];

// Функция для получения mock данных виджетов
export const getMockWidgetData = (
  widgetType: string,
  config: any = {}
): any => {
  switch (widgetType) {
    case "objects-overview":
      return {
        stats: mockDashboardStats.objects,
        recentObjects: [
          {
            id: "1",
            name: "ТЦ Галерея",
            status: "active",
            lastUpdate: new Date(),
          },
          {
            id: "2",
            name: "Офис Центр",
            status: "active",
            lastUpdate: new Date(),
          },
          {
            id: "3",
            name: "Склад №3",
            status: "inactive",
            lastUpdate: new Date(),
          },
        ],
      };

    case "users-overview":
      return {
        stats: mockDashboardStats.users,
        recentUsers: [
          {
            id: "1",
            name: "Иван Петров",
            role: "admin",
            lastLogin: new Date(),
          },
          {
            id: "2",
            name: "Мария Сидорова",
            role: "user",
            lastLogin: new Date(),
          },
          {
            id: "3",
            name: "Алексей Козлов",
            role: "user",
            lastLogin: new Date(),
          },
        ],
      };

    case "billing-overview":
      return {
        stats: mockDashboardStats.billing,
        chartData: mockChartData["revenue-monthly"],
        recentInvoices: [
          {
            id: "inv_12345",
            amount: 125000,
            status: "paid",
            dueDate: new Date(),
          },
          {
            id: "inv_12346",
            amount: 89500,
            status: "pending",
            dueDate: new Date(),
          },
        ],
      };

    case "installations-overview":
      return {
        stats: mockDashboardStats.installations,
        chartData: mockChartData["installations-weekly"],
        todayInstallations: [
          {
            id: "1",
            objectName: "ТЦ Мега",
            time: "10:00",
            status: "in_progress",
          },
          {
            id: "2",
            objectName: "Офис Плаза",
            time: "14:00",
            status: "scheduled",
          },
          {
            id: "3",
            objectName: "Склад №5",
            time: "16:30",
            status: "scheduled",
          },
        ],
      };

    case "warehouse-overview":
      return {
        stats: mockDashboardStats.warehouse,
        chartData: mockChartData["warehouse-categories"],
        lowStockItems: [
          { id: "1", name: "IP-камера 4MP", quantity: 3, minQuantity: 10 },
          { id: "2", name: "Кабель UTP Cat6", quantity: 15, minQuantity: 50 },
          { id: "3", name: "Датчик движения", quantity: 8, minQuantity: 20 },
        ],
      };

    case "recent-activity":
      return {
        activities: mockRecentActivity.slice(0, config.limit || 10),
      };

    default:
      return {};
  }
};

// Функция для симуляции задержки (можно использовать для имитации загрузки)
export const simulateDelay = (ms: number = 0): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
