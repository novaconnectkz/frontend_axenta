// Demo-данные для settingsService (вынесено для уменьшения размера основного файла)
import type {
  ConnectionStatus,
  IntegrationLog,
  IntegrationStats,
  IntegrationWithSettings,
  NotificationChannelSettings,
  NotificationTemplate,
  ObjectTemplate,
  SystemSettings,
  UserTemplate,
} from "@/types/settings";
import {
  INTEGRATION_STATUSES,
  INTEGRATION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENTS,
  TEMPLATE_SYSTEMS,
  TEMPLATE_TYPES,
} from "@/types/settings";

// Демо данные для интеграций
export const demoIntegrations: IntegrationWithSettings[] = [
  {
    id: "1",
    type: INTEGRATION_TYPES.AXENTA,
    name: "Axenta Cloud API",
    description:
      "Основная интеграция с облачным сервисом Axenta для синхронизации объектов мониторинга",
    status: INTEGRATION_STATUSES.ACTIVE,
    enabled: true,
    lastSync: new Date("2024-01-15T14:30:00"),
    created_at: new Date("2024-01-01T10:00:00"),
    updated_at: new Date("2024-01-15T14:30:00"),
    settings: {
      api_url: "https://api.axenta.cloud",
      api_key: "*********************",
      username: "company_user",
      password: "*********************",
      sync_interval: 15,
      auto_sync_enabled: true,
      retry_attempts: 3,
      timeout: 30,
    },
  },
  {
    id: "2",
    type: INTEGRATION_TYPES.BITRIX24,
    name: "Битрикс24 CRM",
    description: "Синхронизация клиентов и сделок с системой Битрикс24",
    status: INTEGRATION_STATUSES.ACTIVE,
    enabled: true,
    lastSync: new Date("2024-01-15T13:45:00"),
    created_at: new Date("2024-01-05T09:00:00"),
    updated_at: new Date("2024-01-15T13:45:00"),
    settings: {
      domain: "company.bitrix24.ru",
      client_id: "local.app_client_id",
      client_secret: "*********************",
      access_token: "*********************",
      refresh_token: "*********************",
      webhook_url: "https://company.bitrix24.ru/rest/webhook/123/abc",
      sync_contacts: true,
      sync_deals: true,
      sync_companies: true,
      auto_create_deals: false,
    },
  },
  {
    id: "3",
    type: INTEGRATION_TYPES.ONEC,
    name: "1С:Предприятие 8.3",
    description: "Экспорт реестров платежей и импорт справочника контрагентов",
    status: INTEGRATION_STATUSES.INACTIVE,
    enabled: false,
    lastError: "Не удается подключиться к серверу 1С",
    created_at: new Date("2024-01-10T11:00:00"),
    updated_at: new Date("2024-01-14T16:20:00"),
    settings: {
      server_url: "http://1c-server:8080/accounting/hs/api",
      database_name: "Accounting",
      username: "1c_user",
      password: "*********************",
      export_format: "xml" as const,
      auto_export_enabled: false,
      export_schedule: "0 0 9 * * MON-FRI",
      include_payments: true,
      include_counterparties: true,
    },
  },
  {
    id: "4",
    type: INTEGRATION_TYPES.TELEGRAM,
    name: "Telegram Bot",
    description: "Отправка уведомлений через Telegram бота",
    status: INTEGRATION_STATUSES.ACTIVE,
    enabled: true,
    lastSync: new Date("2024-01-15T15:00:00"),
    created_at: new Date("2024-01-03T14:00:00"),
    updated_at: new Date("2024-01-15T15:00:00"),
    settings: {
      bot_token: "*********************",
      chat_id: "-1001234567890",
      parse_mode: "HTML" as const,
      disable_web_page_preview: true,
      silent_hours_start: "22:00",
      silent_hours_end: "08:00",
    },
  },
  {
    id: "5",
    type: INTEGRATION_TYPES.EMAIL,
    name: "Email SMTP",
    description: "Отправка email уведомлений через SMTP сервер",
    status: INTEGRATION_STATUSES.ERROR,
    enabled: true,
    lastError: "Ошибка аутентификации SMTP",
    created_at: new Date("2024-01-02T12:00:00"),
    updated_at: new Date("2024-01-15T10:15:00"),
    settings: {
      smtp_host: "smtp.gmail.com",
      smtp_port: 587,
      smtp_username: "notifications@company.com",
      smtp_password: "*********************",
      smtp_secure: true,
      from_email: "notifications@company.com",
      from_name: "CRM Система",
      template_header: '<div style="background: #f8f9fa; padding: 20px;">',
      template_footer: "<p>С уважением,<br>Команда CRM</p></div>",
    },
  },
  {
    id: "6",
    type: INTEGRATION_TYPES.WIALON,
    name: "Wialon Hosting",
    description: "Интеграция с системой GPS-мониторинга Wialon для получения данных о транспорте, датчиках и техобслуживании",
    status: INTEGRATION_STATUSES.INACTIVE,
    enabled: false,
    created_at: new Date("2024-01-15T10:00:00"),
    updated_at: new Date("2024-01-15T10:00:00"),
    settings: {
      api_url: "https://hst-api.wialon.com",
      token: "",
      data_center: "com" as const,
      auto_sync_enabled: false,
      sync_interval: 5,
      sync_vehicles: true,
      sync_sensors: true,
      sync_maintenance: true,
      sync_drivers: true,
      sync_geozones: true,
    },
  },
];

// Демо данные для каналов уведомлений
export const demoNotificationChannels: NotificationChannelSettings[] = [
  {
    id: "1",
    channel: NOTIFICATION_CHANNELS.TELEGRAM,
    name: "Основной Telegram канал",
    enabled: true,
    settings: {
      bot_token: "1234567890:ABCdefGHIjklMNOpqrsTUVwxyz",
      chat_id: "-1001234567890",
      parse_mode: "HTML" as const,
      disable_web_page_preview: true,
      silent_hours_start: "22:00",
      silent_hours_end: "08:00",
    },
    events: [
      NOTIFICATION_EVENTS.INSTALLATION_CREATED,
      NOTIFICATION_EVENTS.INSTALLATION_COMPLETED,
      NOTIFICATION_EVENTS.LOW_STOCK_ALERT,
      NOTIFICATION_EVENTS.SYSTEM_ERROR,
    ],
  },
  {
    id: "2",
    channel: NOTIFICATION_CHANNELS.EMAIL,
    name: "Email уведомления",
    enabled: true,
    settings: {
      smtp_host: "smtp.gmail.com",
      smtp_port: 587,
      smtp_username: "notifications@company.com",
      smtp_password: "app_password_here",
      smtp_secure: true,
      from_email: "notifications@company.com",
      from_name: "CRM Система",
    },
    events: [
      NOTIFICATION_EVENTS.CONTRACT_EXPIRING,
      NOTIFICATION_EVENTS.PAYMENT_OVERDUE,
      NOTIFICATION_EVENTS.SYNC_ERROR,
    ],
  },
  {
    id: "3",
    channel: NOTIFICATION_CHANNELS.SMS,
    name: "SMS уведомления",
    enabled: false,
    settings: {
      provider: "sms_ru" as const,
      api_key: "your_sms_ru_api_key",
      sender_name: "CRM",
      test_mode: true,
    },
    events: [
      NOTIFICATION_EVENTS.INSTALLATION_CANCELLED,
      NOTIFICATION_EVENTS.SYSTEM_ERROR,
    ],
  },
];

// Демо данные для шаблонов
export const demoObjectTemplates: ObjectTemplate[] = [
  {
    id: "1",
    type: TEMPLATE_TYPES.OBJECT,
    system: TEMPLATE_SYSTEMS.AXENTA,
    name: "Стандартный объект мониторинга",
    description:
      "Базовый шаблон для создания объектов мониторинга с обязательными полями",
    category: "Стандартные",
    is_system: true,
    is_active: true,
    usage_count: 156,
    created_at: new Date("2024-01-01T00:00:00"),
    updated_at: new Date("2024-01-10T14:30:00"),
    fields: [
      {
        name: "name",
        label: "Название объекта",
        type: "text",
        required: true,
        validation: { min: 3, max: 100 },
      },
      {
        name: "address",
        label: "Адрес",
        type: "textarea",
        required: true,
      },
      {
        name: "contact_person",
        label: "Контактное лицо",
        type: "text",
        required: false,
      },
      {
        name: "phone",
        label: "Телефон",
        type: "text",
        required: false,
        validation: { pattern: "^\\+?[1-9]\\d{1,14}$" },
      },
      {
        name: "object_type",
        label: "Тип объекта",
        type: "select",
        required: true,
        options: [
          "Офис",
          "Склад",
          "Производство",
          "Торговая точка",
          "Жилой дом",
        ],
      },
      {
        name: "installation_date",
        label: "Дата установки",
        type: "date",
        required: false,
      },
      {
        name: "is_priority",
        label: "Приоритетный объект",
        type: "boolean",
        required: false,
        default_value: false,
      },
    ],
    default_values: {
      object_type: "Офис",
      is_priority: false,
    },
  },
  {
    id: "2",
    type: TEMPLATE_TYPES.OBJECT,
    system: TEMPLATE_SYSTEMS.AXENTA,
    name: "Промышленный объект",
    description: "Шаблон для промышленных и производственных объектов",
    category: "Специализированные",
    is_system: false,
    is_active: true,
    usage_count: 23,
    created_at: new Date("2024-01-05T10:00:00"),
    updated_at: new Date("2024-01-12T16:45:00"),
    fields: [
      {
        name: "name",
        label: "Название предприятия",
        type: "text",
        required: true,
      },
      {
        name: "industry",
        label: "Отрасль",
        type: "select",
        required: true,
        options: [
          "Машиностроение",
          "Химическая",
          "Пищевая",
          "Текстильная",
          "Металлургия",
        ],
      },
      {
        name: "area",
        label: "Площадь (м²)",
        type: "number",
        required: false,
        validation: { min: 1 },
      },
      {
        name: "employees_count",
        label: "Количество сотрудников",
        type: "number",
        required: false,
        validation: { min: 1 },
      },
      {
        name: "hazard_class",
        label: "Класс опасности",
        type: "select",
        required: true,
        options: [
          "I (чрезвычайно опасные)",
          "II (высоко опасные)",
          "III (умеренно опасные)",
          "IV (малоопасные)",
          "V (практически неопасные)",
        ],
      },
    ],
    default_values: {
      hazard_class: "IV (малоопасные)",
    },
  },
];

export const demoUserTemplates: UserTemplate[] = [
  {
    id: "3",
    type: TEMPLATE_TYPES.USER,
    system: TEMPLATE_SYSTEMS.AXENTA,
    name: "Менеджер по продажам",
    description:
      "Шаблон для создания пользователей с ролью менеджера по продажам",
    category: "Продажи",
    is_system: true,
    is_active: true,
    usage_count: 12,
    created_at: new Date("2024-01-01T00:00:00"),
    updated_at: new Date("2024-01-08T11:20:00"),
    role_id: "manager",
    permissions: [
      "objects.read",
      "objects.create",
      "objects.update",
      "contracts.read",
      "contracts.create",
      "contracts.update",
      "users.read",
    ],
    default_settings: {
      dashboard_layout: "sales_focused",
      notifications: {
        email: true,
        telegram: true,
        sms: false,
      },
      theme: "light",
    },
  },
  {
    id: "4",
    type: TEMPLATE_TYPES.USER,
    system: TEMPLATE_SYSTEMS.AXENTA,
    name: "Технический специалист",
    description: "Шаблон для монтажников и технических специалистов",
    category: "Техническая поддержка",
    is_system: true,
    is_active: true,
    usage_count: 8,
    created_at: new Date("2024-01-02T00:00:00"),
    updated_at: new Date("2024-01-09T09:15:00"),
    role_id: "tech",
    permissions: [
      "objects.read",
      "installations.read",
      "installations.create",
      "installations.update",
      "warehouse.read",
      "warehouse.update",
    ],
    default_settings: {
      dashboard_layout: "technical",
      notifications: {
        email: false,
        telegram: true,
        sms: true,
      },
      theme: "auto",
    },
  },
];

export const demoNotificationTemplates: NotificationTemplate[] = [
  {
    id: "5",
    type: TEMPLATE_TYPES.NOTIFICATION,
    system: TEMPLATE_SYSTEMS.AXENTA,
    name: "Уведомление о новом монтаже",
    description: "Шаблон уведомления при создании нового монтажа",
    category: "Монтажи",
    is_system: true,
    is_active: true,
    usage_count: 89,
    created_at: new Date("2024-01-01T00:00:00"),
    updated_at: new Date("2024-01-11T13:25:00"),
    subject_template: "Новый монтаж: {{object_name}}",
    body_template: `
<b>Создан новый монтаж</b>

📍 Объект: {{object_name}}
📅 Дата: {{installation_date}}
👤 Монтажник: {{installer_name}}
🔧 Тип работ: {{installation_type}}

{{#if notes}}
📝 Примечания: {{notes}}
{{/if}}

Статус: {{status}}
    `,
    variables: [
      "object_name",
      "installation_date",
      "installer_name",
      "installation_type",
      "notes",
      "status",
    ],
    channels: [NOTIFICATION_CHANNELS.TELEGRAM, NOTIFICATION_CHANNELS.EMAIL],
  },
  {
    id: "6",
    type: TEMPLATE_TYPES.NOTIFICATION,
    system: TEMPLATE_SYSTEMS.AXENTA,
    name: "Предупреждение о низких остатках",
    description: "Уведомление о критически низких остатках на складе",
    category: "Склад",
    is_system: true,
    is_active: true,
    usage_count: 34,
    created_at: new Date("2024-01-03T00:00:00"),
    updated_at: new Date("2024-01-13T10:40:00"),
    subject_template: "⚠️ Низкие остатки: {{equipment_name}}",
    body_template: `
<b>⚠️ Предупреждение о низких остатках</b>

📦 Оборудование: {{equipment_name}}
📊 Текущий остаток: {{current_stock}} шт.
⚠️ Минимальный остаток: {{min_stock}} шт.
📍 Локация: {{location}}

Необходимо пополнить запасы!
    `,
    variables: ["equipment_name", "current_stock", "min_stock", "location"],
    channels: [
      NOTIFICATION_CHANNELS.TELEGRAM,
      NOTIFICATION_CHANNELS.EMAIL,
      NOTIFICATION_CHANNELS.SMS,
    ],
  },
];

// Демо данные для системных настроек
export const demoSystemSettings: SystemSettings = {
  id: "1",
  company_name: 'ООО "Технические Системы"',
  company_logo: "/logos/company-logo.png",
  timezone: "Europe/Moscow",
  date_format: "DD.MM.YYYY",
  currency: "RUB",
  language: "ru",
  theme: "light",
  session_timeout: 480, // 8 часов
  password_min_length: 8,
  password_require_special: true,
  max_login_attempts: 5,
  email_notifications_enabled: true,
  sms_notifications_enabled: false,
  telegram_notifications_enabled: true,
  vat_rate_preset: "russia",
  vat_rate_custom: 20,
  backup_enabled: true,
  backup_schedule: "0 2 * * *", // каждый день в 2:00
  backup_retention_days: 30,
  created_at: new Date("2024-01-01T00:00:00"),
  updated_at: new Date("2024-01-15T12:00:00"),
};

// Демо данные для статуса подключений
export const demoConnectionStatuses: ConnectionStatus[] = [
  {
    integration_id: "1",
    status: INTEGRATION_STATUSES.ACTIVE,
    last_check: new Date("2024-01-15T15:30:00"),
    response_time: 245,
    success_rate: 99.2,
  },
  {
    integration_id: "2",
    status: INTEGRATION_STATUSES.ACTIVE,
    last_check: new Date("2024-01-15T15:29:00"),
    response_time: 1230,
    success_rate: 97.8,
  },
  {
    integration_id: "3",
    status: INTEGRATION_STATUSES.DISCONNECTED,
    last_check: new Date("2024-01-15T15:25:00"),
    error_message: "Таймаут подключения к серверу 1С",
    success_rate: 45.2,
  },
  {
    integration_id: "4",
    status: INTEGRATION_STATUSES.ACTIVE,
    last_check: new Date("2024-01-15T15:30:00"),
    response_time: 89,
    success_rate: 100,
  },
  {
    integration_id: "5",
    status: INTEGRATION_STATUSES.ERROR,
    last_check: new Date("2024-01-15T15:28:00"),
    error_message: "Ошибка аутентификации SMTP: 535 Authentication failed",
    success_rate: 23.1,
  },
];

// Демо данные для статистики интеграций
export const demoIntegrationStats: IntegrationStats[] = [
  {
    integration_id: "1",
    total_requests: 2456,
    successful_requests: 2438,
    failed_requests: 18,
    average_response_time: 267,
    last_24h_requests: 143,
    uptime_percentage: 99.8,
    errors_by_type: {
      timeout: 12,
      connection_error: 4,
      auth_error: 2,
    },
  },
  {
    integration_id: "2",
    total_requests: 892,
    successful_requests: 873,
    failed_requests: 19,
    average_response_time: 1456,
    last_24h_requests: 67,
    uptime_percentage: 97.9,
    errors_by_type: {
      rate_limit: 15,
      invalid_token: 3,
      api_error: 1,
    },
  },
  {
    integration_id: "3",
    total_requests: 234,
    successful_requests: 106,
    failed_requests: 128,
    average_response_time: 0,
    last_24h_requests: 0,
    uptime_percentage: 45.3,
    errors_by_type: {
      connection_refused: 89,
      timeout: 39,
    },
  },
  {
    integration_id: "4",
    total_requests: 1567,
    successful_requests: 1567,
    failed_requests: 0,
    average_response_time: 92,
    last_24h_requests: 89,
    uptime_percentage: 100,
    errors_by_type: {},
  },
  {
    integration_id: "5",
    total_requests: 456,
    successful_requests: 105,
    failed_requests: 351,
    average_response_time: 2340,
    last_24h_requests: 12,
    uptime_percentage: 23.0,
    errors_by_type: {
      auth_failed: 298,
      smtp_error: 53,
    },
  },
];

// Демо данные для логов интеграций
export const demoIntegrationLogs: IntegrationLog[] = [
  {
    id: "1",
    integration_id: "1",
    level: "info",
    message: "Успешная синхронизация объектов",
    details: { synced_objects: 23, duration: 245 },
    timestamp: new Date("2024-01-15T15:30:00"),
  },
  {
    id: "2",
    integration_id: "2",
    level: "warning",
    message: "Превышен лимит запросов к API",
    details: { rate_limit: 1000, current_usage: 1000 },
    timestamp: new Date("2024-01-15T14:45:00"),
  },
  {
    id: "3",
    integration_id: "3",
    level: "error",
    message: "Не удается подключиться к серверу 1С",
    details: {
      error: "Connection refused",
      server: "1c-server:8080",
      retry_count: 3,
    },
    timestamp: new Date("2024-01-15T14:20:00"),
  },
  {
    id: "4",
    integration_id: "4",
    level: "info",
    message: "Отправлено уведомление в Telegram",
    details: { chat_id: "-1001234567890", message_id: 1234 },
    timestamp: new Date("2024-01-15T15:25:00"),
  },
  {
    id: "5",
    integration_id: "5",
    level: "error",
    message: "Ошибка аутентификации SMTP",
    details: {
      error: "535 Authentication failed",
      server: "smtp.gmail.com:587",
    },
    timestamp: new Date("2024-01-15T15:10:00"),
  },
];
