// Сервис для работы с настройками системы
import axios from 'axios';
import { config } from "@/config/env";
import type {
  ConnectionStatus,
  IntegrationLog,
  IntegrationStats,
  IntegrationStatusResponse,
  IntegrationWithSettings,
  IntegrationsResponse,
  NotificationChannelSettings,
  NotificationChannelsResponse,
  NotificationTemplate,
  ObjectTemplate,
  SystemSettings,
  SystemSettingsForm,
  TemplatesResponse,
  UserTemplate,
} from "@/types/settings";
import {
  INTEGRATION_STATUSES,
  INTEGRATION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENTS,
  TEMPLATE_TYPES,
} from "@/types/settings";

// API базовый URL
const API_BASE_URL = config.backendUrl;

// Получение токена авторизации
const getAuthToken = (): string | null => {
  return localStorage.getItem('axenta_token');
};

// Создание заголовков для API запросов
const createHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  
  return headers;
};

// Демо данные для интеграций
const demoIntegrations: IntegrationWithSettings[] = [
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
];

// Демо данные для каналов уведомлений
const demoNotificationChannels: NotificationChannelSettings[] = [
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
const demoObjectTemplates: ObjectTemplate[] = [
  {
    id: "1",
    type: TEMPLATE_TYPES.OBJECT,
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

const demoUserTemplates: UserTemplate[] = [
  {
    id: "3",
    type: TEMPLATE_TYPES.USER,
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

const demoNotificationTemplates: NotificationTemplate[] = [
  {
    id: "5",
    type: TEMPLATE_TYPES.NOTIFICATION,
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
const demoSystemSettings: SystemSettings = {
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
const demoConnectionStatuses: ConnectionStatus[] = [
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
const demoIntegrationStats: IntegrationStats[] = [
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
const demoIntegrationLogs: IntegrationLog[] = [
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

class SettingsService {
  private baseUrl = config.apiBaseUrl;
  private apiClient = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 30000,
  });

  constructor() {
    // Добавляем interceptor для токена
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem('axenta_token');
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
      
      const companyRaw = localStorage.getItem('axenta_company');
      if (companyRaw) {
        try {
          const company = JSON.parse(companyRaw);
          const companyId = company?.id;
          if (companyId) {
            config.headers['X-Tenant-ID'] = String(companyId);
          }
        } catch (error) {
          console.error('Error parsing company data:', error);
        }
      }
      
      return config;
    });
  }

  private getCompanyId(): number | null {
    try {
      const companyRaw = localStorage.getItem('axenta_company');
      if (companyRaw) {
        const company = JSON.parse(companyRaw);
        return company?.id || null;
      }
    } catch (error) {
      console.error('Error getting company ID:', error);
    }
    return null;
  }

  // === ИНТЕГРАЦИИ ===

  async getIntegrations(): Promise<IntegrationsResponse> {
    // Имитация API запроса
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      integrations: demoIntegrations,
      total: demoIntegrations.length,
    };
  }

  async getIntegration(id: string): Promise<IntegrationWithSettings> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const integration = demoIntegrations.find((i) => i.id === id);
    if (!integration) {
      throw new Error("Интеграция не найдена");
    }

    return integration;
  }

  async updateIntegration(
    id: string,
    data: Partial<IntegrationWithSettings>
  ): Promise<IntegrationWithSettings> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const index = demoIntegrations.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error("Интеграция не найдена");
    }

    demoIntegrations[index] = {
      ...demoIntegrations[index],
      ...data,
      updated_at: new Date(),
    };

    return demoIntegrations[index];
  }

  async testIntegrationConnection(
    id: string
  ): Promise<{ success: boolean; message: string; response_time?: number }> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const integration = demoIntegrations.find((i) => i.id === id);
    if (!integration) {
      throw new Error("Интеграция не найдена");
    }

    // Имитируем тестирование подключения
    const isSuccess = Math.random() > 0.3; // 70% успешных тестов

    if (isSuccess) {
      return {
        success: true,
        message: "Подключение успешно установлено",
        response_time: Math.floor(Math.random() * 500) + 100,
      };
    } else {
      return {
        success: false,
        message: "Ошибка подключения: таймаут соединения",
      };
    }
  }

  // === УВЕДОМЛЕНИЯ ===

  async getNotificationChannels(): Promise<NotificationChannelsResponse> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    return {
      channels: demoNotificationChannels,
      total: demoNotificationChannels.length,
    };
  }

  async updateNotificationChannel(
    id: string,
    data: Partial<NotificationChannelSettings>
  ): Promise<NotificationChannelSettings> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const index = demoNotificationChannels.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error("Канал уведомлений не найден");
    }

    demoNotificationChannels[index] = {
      ...demoNotificationChannels[index],
      ...data,
    };

    return demoNotificationChannels[index];
  }

  async testNotificationChannel(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const channel = demoNotificationChannels.find((c) => c.id === id);
    if (!channel) {
      throw new Error("Канал уведомлений не найден");
    }

    const isSuccess = Math.random() > 0.2; // 80% успешных тестов

    if (isSuccess) {
      return {
        success: true,
        message: `Тестовое уведомление успешно отправлено через ${channel.name}`,
      };
    } else {
      return {
        success: false,
        message: "Ошибка отправки тестового уведомления",
      };
    }
  }

  // === ШАБЛОНЫ ===

  async getTemplates(type?: string, system?: string): Promise<TemplatesResponse> {
    try {
      const headers = createHeaders();
      let url = '';
      
      // Определяем URL в зависимости от типа шаблона
      if (type === 'report') {
        url = `${API_BASE_URL}/api/reports/templates`;
        if (system) {
          url += `?system=${system}`;
        }
      } else if (type === 'user') {
        url = `${API_BASE_URL}/api/user-templates`;
        if (system) {
          url += `?system=${system}`;
        }
      } else if (type === 'object') {
        url = `${API_BASE_URL}/api/object-templates`;
        if (system) {
          url += `?system=${system}`;
        }
      } else {
        // Если тип не указан, возвращаем пустой массив
        // В будущем можно сделать запросы ко всем типам и объединить
        return { templates: [], total: 0 };
      }

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки шаблонов: ${response.statusText}`);
      }

      let templates: (ObjectTemplate | UserTemplate | NotificationTemplate | ReportTemplate)[] = [];
      
      if (type === 'report') {
        const data = await response.json();
        // Преобразуем данные бэкенда в формат фронтенда
        templates = Array.isArray(data) ? data.map((t: any) => this.mapReportTemplateFromBackend(t)) : [];
      } else if (type === 'user') {
        const data = await response.json();
        if (data.status === 'success' && data.data) {
          templates = Array.isArray(data.data.items) 
            ? data.data.items.map((t: any) => this.mapUserTemplateFromBackend(t))
            : [];
        }
      } else if (type === 'object') {
        const data = await response.json();
        if (data.status === 'success' && data.data) {
          templates = Array.isArray(data.data.items) 
            ? data.data.items.map((t: any) => this.mapObjectTemplateFromBackend(t))
            : [];
        }
      }

      // Фильтруем по системе, если указана
      if (system) {
        templates = templates.filter((t) => t.system === system);
      }

      return {
        templates,
        total: templates.length,
      };
    } catch (error) {
      console.error('Ошибка загрузки шаблонов:', error);
      // В случае ошибки возвращаем пустой массив
      return { templates: [], total: 0 };
    }
  }

  // Маппинг шаблона отчета из формата бэкенда в формат фронтенда
  private mapReportTemplateFromBackend(data: any): ReportTemplate {
    let config: any = {};
    try {
      if (data.config && typeof data.config === 'string') {
        config = JSON.parse(data.config);
      } else if (data.config) {
        config = data.config;
      }
    } catch (e) {
      console.warn('Ошибка парсинга config шаблона отчета:', e);
    }

    // Извлекаем system из config или используем значение по умолчанию
    const system = config.system || data.system || 'axenta';

    return {
      id: data.id?.toString() || '',
      type: 'report',
      system: system,
      name: data.name || '',
      description: data.description || '',
      category: data.category,
      is_system: data.is_system || false,
      is_active: data.is_active !== undefined ? data.is_active : true,
      usage_count: data.usage_count || 0,
      created_at: data.created_at ? new Date(data.created_at) : new Date(),
      updated_at: data.updated_at ? new Date(data.updated_at) : new Date(),
      // Сохраняем content и settings из config
      content: config.content,
      settings: config.settings,
      sql_query: data.sql_query,
      parameters: data.parameters ? (typeof data.parameters === 'string' ? JSON.parse(data.parameters) : data.parameters) : undefined,
      headers: data.headers ? (typeof data.headers === 'string' ? JSON.parse(data.headers) : data.headers) : undefined,
      formatting: data.formatting ? (typeof data.formatting === 'string' ? JSON.parse(data.formatting) : data.formatting) : undefined,
    };
  }

  // Маппинг шаблона пользователя из формата бэкенда в формат фронтенда
  private mapUserTemplateFromBackend(data: any): UserTemplate {
    return {
      id: data.id?.toString() || '',
      type: 'user',
      system: data.system || 'axenta',
      name: data.name || '',
      description: data.description || '',
      category: data.category,
      is_system: data.is_system || false,
      is_active: data.is_active !== undefined ? data.is_active : true,
      usage_count: data.usage_count || 0,
      created_at: data.created_at ? new Date(data.created_at) : new Date(),
      updated_at: data.updated_at ? new Date(data.updated_at) : new Date(),
      role_id: data.role_id?.toString() || '',
      permissions: data.permissions || [],
      default_settings: data.settings ? (typeof data.settings === 'string' ? JSON.parse(data.settings) : data.settings) : {},
    };
  }

  // Маппинг шаблона объекта из формата бэкенда в формат фронтенда
  private mapObjectTemplateFromBackend(data: any): ObjectTemplate {
    return {
      id: data.id?.toString() || '',
      type: 'object',
      system: data.system || 'axenta',
      name: data.name || '',
      description: data.description || '',
      category: data.category,
      is_system: data.is_system || false,
      is_active: data.is_active !== undefined ? data.is_active : true,
      usage_count: data.usage_count || 0,
      created_at: data.created_at ? new Date(data.created_at) : new Date(),
      updated_at: data.updated_at ? new Date(data.updated_at) : new Date(),
      fields: data.fields || [],
      default_values: data.default_settings ? (typeof data.default_settings === 'string' ? JSON.parse(data.default_settings) : data.default_settings) : {},
    };
  }

  async getTemplate(
    id: string
  ): Promise<ObjectTemplate | UserTemplate | NotificationTemplate | ReportTemplate> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const allTemplates = [
      ...demoObjectTemplates,
      ...demoUserTemplates,
      ...demoNotificationTemplates,
    ];
    const template = allTemplates.find((t) => t.id === id);

    if (!template) {
      throw new Error("Шаблон не найден");
    }

    return template;
  }

  async deleteTemplate(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const template = [
      ...demoObjectTemplates,
      ...demoUserTemplates,
      ...demoNotificationTemplates,
    ].find((t) => t.id === id);

    if (!template) {
      throw new Error("Шаблон не найден");
    }

    if (template.is_system) {
      throw new Error("Системные шаблоны нельзя удалять");
    }

    // В реальном приложении здесь был бы API вызов
    console.log(`Шаблон ${id} удален`);
  }

  async createTemplate(templateData: any): Promise<{ status: string; data?: any; error?: string }> {
    try {
      const headers = createHeaders();
      let url = '';
      let body: any = {};

      // Определяем URL и формат тела запроса в зависимости от типа шаблона
      if (templateData.type === 'report') {
        url = `${API_BASE_URL}/api/reports/templates`;
        // Для отчетов Axenta сохраняем content и settings в config
        const config: any = {};
        if (templateData.content) {
          config.content = templateData.content;
        }
        if (templateData.settings) {
          config.settings = templateData.settings;
        }
        
        body = {
          name: templateData.name,
          description: templateData.description || '',
          type: templateData.report_type || 'objects', // Тип отчета для бэкенда (должен быть одним из: objects, users, billing, installations, warehouse, contracts, general)
          system: templateData.system || 'axenta', // Система шаблона
          config: config,
          sql_query: templateData.sql_query || '',
          parameters: templateData.parameters || {},
          headers: templateData.headers || [],
          formatting: templateData.formatting || {},
          is_public: templateData.is_public || false,
        };
      } else if (templateData.type === 'user') {
        url = `${API_BASE_URL}/api/user-templates`;
        body = {
          name: templateData.name,
          description: templateData.description || '',
          role_id: parseInt(templateData.role_id) || 1,
          system: templateData.system || 'axenta', // Система шаблона
          settings: JSON.stringify(templateData.default_settings || {}),
          is_active: templateData.is_active !== undefined ? templateData.is_active : true,
        };
      } else if (templateData.type === 'object') {
        url = `${API_BASE_URL}/api/object-templates`;
        body = {
          name: templateData.name,
          description: templateData.description || '',
          category: templateData.category || '',
          system: templateData.system || 'axenta', // Система шаблона
          config: JSON.stringify(templateData.config || {}),
          default_settings: JSON.stringify(templateData.default_values || {}),
          is_active: templateData.is_active !== undefined ? templateData.is_active : true,
        };
      } else {
        return { status: 'error', error: 'Неподдерживаемый тип шаблона' };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Ошибка создания шаблона: ${response.statusText}`;
        console.error('Детали ошибки создания шаблона:', errorData);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Преобразуем ответ в формат фронтенда
      let mappedTemplate: any;
      if (templateData.type === 'report') {
        mappedTemplate = this.mapReportTemplateFromBackend(data);
      } else if (templateData.type === 'user') {
        mappedTemplate = this.mapUserTemplateFromBackend(data.data || data);
      } else if (templateData.type === 'object') {
        mappedTemplate = this.mapObjectTemplateFromBackend(data.data || data);
      }

      return { status: 'success', data: mappedTemplate };
    } catch (error) {
      console.error('Ошибка создания шаблона:', error);
      return { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Ошибка создания шаблона' 
      };
    }
  }

  async updateTemplate(id: string, templateData: any): Promise<{ status: string; data?: any; error?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const template = [
        ...demoObjectTemplates,
        ...demoUserTemplates,
        ...demoNotificationTemplates,
      ].find((t) => t.id === id);

      if (!template) {
        return { status: 'error', error: 'Шаблон не найден' };
      }

      if (template.is_system) {
        return { status: 'error', error: 'Системные шаблоны нельзя изменять' };
      }

      // В реальном приложении здесь был бы API вызов
      const updatedTemplate = {
        ...template,
        ...templateData,
        updated_at: new Date(),
      };

      console.log('Обновлен шаблон:', updatedTemplate);
      return { status: 'success', data: updatedTemplate };
    } catch (error) {
      console.error('Ошибка обновления шаблона:', error);
      return { status: 'error', error: 'Ошибка обновления шаблона' };
    }
  }

  // === СИСТЕМНЫЕ НАСТРОЙКИ ===

  async getSystemSettings(): Promise<SystemSettings> {
    const companyId = this.getCompanyId();
    if (!companyId) {
      throw new Error('Company ID not found');
    }

    try {
      const response = await this.apiClient.get(`/auth/system/settings`, {
        params: { company_id: companyId }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error loading system settings:', error);
      // Возвращаем демо данные в случае ошибки
      return demoSystemSettings;
    }
  }

  async updateSystemSettings(
    data: Partial<SystemSettingsForm>
  ): Promise<SystemSettings> {
    const companyId = this.getCompanyId();
    if (!companyId) {
      throw new Error('Company ID not found');
    }

    try {
      const response = await this.apiClient.put(`/auth/system/settings`, data, {
        params: { company_id: companyId }
      });
      
      console.log('✅ Системные настройки обновлены:', response.data.data);
      
      // Если обновлены настройки НДС, они автоматически синхронизированы с billing_settings на бэкенде
      if (data.vat_rate_preset !== undefined || data.vat_rate_custom !== undefined) {
        console.log('✅ Настройки НДС синхронизированы с биллингом');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  // === МОНИТОРИНГ ИНТЕГРАЦИЙ ===

  async getIntegrationStatus(): Promise<IntegrationStatusResponse> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    return {
      statuses: demoConnectionStatuses,
      stats: demoIntegrationStats,
    };
  }

  async getIntegrationLogs(
    integrationId?: string,
    limit = 50
  ): Promise<IntegrationLog[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    let logs = demoIntegrationLogs;

    if (integrationId) {
      logs = logs.filter((log) => log.integration_id === integrationId);
    }

    return logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async clearIntegrationLogs(integrationId?: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (integrationId) {
      // Удаляем логи конкретной интеграции
      const index = demoIntegrationLogs.findIndex(
        (log) => log.integration_id === integrationId
      );
      if (index !== -1) {
        demoIntegrationLogs.splice(index, 1);
      }
    } else {
      // Очищаем все логи
      demoIntegrationLogs.length = 0;
    }

    console.log("Логи интеграций очищены");
  }

  // === ЭКСПОРТ/ИМПОРТ НАСТРОЕК ===

  async exportSettings(): Promise<Blob> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const settings = {
      integrations: demoIntegrations,
      notification_channels: demoNotificationChannels,
      templates: [
        ...demoObjectTemplates,
        ...demoUserTemplates,
        ...demoNotificationTemplates,
      ],
      system_settings: demoSystemSettings,
      exported_at: new Date().toISOString(),
    };

    const json = JSON.stringify(settings, null, 2);
    return new Blob([json], { type: "application/json" });
  }

  async importSettings(
    file: File
  ): Promise<{ success: boolean; message: string; imported_count: number }> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Валидация структуры файла
      if (!data.integrations || !data.system_settings) {
        throw new Error("Неверная структура файла настроек");
      }

      // В реальном приложении здесь была бы валидация и импорт данных
      const importedCount =
        (data.integrations?.length || 0) +
        (data.notification_channels?.length || 0) +
        (data.templates?.length || 0) +
        1; // system_settings

      return {
        success: true,
        message: "Настройки успешно импортированы",
        imported_count: importedCount,
      };
    } catch (error) {
      return {
        success: false,
        message: `Ошибка импорта: ${
          error instanceof Error ? error.message : "Неизвестная ошибка"
        }`,
        imported_count: 0,
      };
    }
  }

  // ===== Axenta Cloud Integration API =====

  // Получение конфигурации Axenta интеграции
  async getAxentaIntegrationConfig(): Promise<IntegrationWithSettings | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/axenta/config`, {
        method: 'GET',
        headers: createHeaders(),
      });

      // 404 означает, что интеграция не настроена - это нормально, не логируем
      if (response.status === 404) {
        return null;
      }

      // Проверяем тип ответа перед парсингом JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Тихо игнорируем неожиданный формат ответа
        return null;
      }

      if (!response.ok) {
        // Не логируем 404, так как это ожидаемое поведение
        // Для других ошибок также не логируем, чтобы не засорять консоль
        return null;
      }

      const data = await response.json();
      
      // Преобразуем ответ в формат IntegrationWithSettings
      return {
        id: data.integration.id.toString(),
        type: INTEGRATION_TYPES.AXENTA,
        name: data.integration.name,
        description: data.integration.description,
        status: data.integration.is_active ? INTEGRATION_STATUSES.ACTIVE : INTEGRATION_STATUSES.INACTIVE,
        enabled: data.integration.is_active,
        lastSync: data.integration.last_sync_at ? new Date(data.integration.last_sync_at) : null,
        created_at: new Date(data.integration.created_at),
        updated_at: new Date(data.integration.updated_at),
        settings: {
          api_url: data.config.api_url,
          username: data.config.username,
          password: data.config.password, // Уже замаскирован на бэкенде
          sync_interval: data.config.sync_interval,
          auto_sync_enabled: data.config.auto_sync_enabled,
          retry_attempts: data.config.retry_attempts,
          timeout: data.config.timeout,
        },
      };
    } catch (error) {
      // Тихо обрабатываем ошибки сети - не логируем и не пробрасываем
      // Это нормальное поведение, если интеграция не настроена или сервер недоступен
      return null;
    }
  }

  // Настройка Axenta интеграции
  async setupAxentaIntegration(settings: any): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/axenta/setup`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({
          api_url: settings.api_url,
          username: settings.username,
          password: settings.password,
          sync_interval: settings.sync_interval || 15,
          auto_sync_enabled: settings.auto_sync_enabled || false,
          retry_attempts: settings.retry_attempts || 3,
          timeout: settings.timeout || 30,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка настройки интеграции');
      }

      return {
        success: true,
        message: data.message || 'Интеграция успешно настроена',
      };
    } catch (error) {
      console.error('Ошибка настройки Axenta интеграции:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  // Обновление настроек Axenta интеграции
  async updateAxentaIntegration(settings: any): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/axenta/setup`, {
        method: 'PUT',
        headers: createHeaders(),
        body: JSON.stringify({
          api_url: settings.api_url,
          username: settings.username,
          password: settings.password,
          sync_interval: settings.sync_interval || 15,
          auto_sync_enabled: settings.auto_sync_enabled || false,
          retry_attempts: settings.retry_attempts || 3,
          timeout: settings.timeout || 30,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка обновления интеграции');
      }

      return {
        success: true,
        message: data.message || 'Настройки интеграции обновлены',
      };
    } catch (error) {
      console.error('Ошибка обновления Axenta интеграции:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  // === NOVACONNECT ИНТЕГРАЦИЯ ===

  // Настройка интеграции NovaConnect
  async setupNovaConnectIntegration(settings: any): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/novaconnect/setup`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({
          api_url: settings.api_url || 'https://api.novaconnect.kz/api',
          token: settings.token,
          language: settings.language || 'ru',
          webhook_url: settings.webhook_url || '',
          webhook_enabled: settings.webhook_enabled || false,
          sync_interval: settings.sync_interval || 15,
          auto_sync_enabled: settings.auto_sync_enabled || false,
          enabled: settings.enabled || false,
        }),
      });

      // Проверяем тип ответа перед парсингом JSON
      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Неожиданный формат ответа:', text);
        throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Ошибка настройки интеграции: ${response.status}`);
      }

      return {
        success: true,
        message: data.message || 'Интеграция успешно настроена',
      };
    } catch (error) {
      console.error('Ошибка настройки NovaConnect интеграции:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  // Обновление настроек NovaConnect интеграции
  async updateNovaConnectIntegration(settings: any): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/novaconnect/setup`, {
        method: 'PUT',
        headers: createHeaders(),
        body: JSON.stringify({
          api_url: settings.api_url || 'https://api.novaconnect.kz/api',
          token: settings.token,
          language: settings.language || 'ru',
          webhook_url: settings.webhook_url || '',
          webhook_enabled: settings.webhook_enabled || false,
          sync_interval: settings.sync_interval || 15,
          auto_sync_enabled: settings.auto_sync_enabled || false,
          enabled: settings.enabled || false,
        }),
      });

      // Проверяем тип ответа перед парсингом JSON
      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Неожиданный формат ответа:', text);
        throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}`);
      }

      // Если интеграция не найдена (404), пробуем создать новую
      if (response.status === 404) {
        console.log('Интеграция не найдена, создаем новую...');
        return await this.setupNovaConnectIntegration(settings);
      }

      if (!response.ok) {
        throw new Error(data.error || `Ошибка обновления интеграции: ${response.status}`);
      }

      return {
        success: true,
        message: data.message || 'Настройки интеграции обновлены',
      };
    } catch (error) {
      console.error('Ошибка обновления NovaConnect интеграции:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  // === TELEGRAM ИНТЕГРАЦИЯ ===

  // Настройка Telegram интеграции
  async setupTelegramIntegration(settings: any): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram/setup`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({
          bot_token: settings.bot_token,
          default_chat_id: settings.default_chat_id || '',
          parse_mode: settings.parse_mode || 'HTML',
          disable_notifications: settings.disable_notifications || false,
          quiet_hours_start: settings.quiet_hours_start || '',
          quiet_hours_end: settings.quiet_hours_end || '',
          quiet_hours_enabled: settings.quiet_hours_enabled || false,
        }),
      });

      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Ошибка настройки интеграции: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Ошибка настройки интеграции: ${response.status}`);
      }

      return {
        success: true,
        message: data.message || 'Интеграция с Telegram успешно настроена',
      };
    } catch (error) {
      console.error('Ошибка настройки Telegram интеграции:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  // Обновление Telegram интеграции
  async updateTelegramIntegration(settings: any): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram/setup`, {
        method: 'PUT',
        headers: createHeaders(),
        body: JSON.stringify({
          bot_token: settings.bot_token,
          default_chat_id: settings.default_chat_id || '',
          parse_mode: settings.parse_mode || 'HTML',
          disable_notifications: settings.disable_notifications || false,
          quiet_hours_start: settings.quiet_hours_start || '',
          quiet_hours_end: settings.quiet_hours_end || '',
          quiet_hours_enabled: settings.quiet_hours_enabled || false,
        }),
      });

      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Ошибка обновления интеграции: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Ошибка обновления интеграции: ${response.status}`);
      }

      return {
        success: true,
        message: data.message || 'Настройки интеграции обновлены',
      };
    } catch (error) {
      console.error('Ошибка обновления Telegram интеграции:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  // Получение конфигурации Telegram интеграции
  async getTelegramConfig(): Promise<{
    bot_token?: string;
    default_chat_id?: string;
    parse_mode?: string;
    disable_notifications?: boolean;
    quiet_hours_start?: string;
    quiet_hours_end?: string;
    quiet_hours_enabled?: boolean;
    enabled?: boolean;
    is_active?: boolean;
  } | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram/config`, {
        method: 'GET',
        headers: createHeaders(),
      });

      // 404 означает, что интеграция не настроена - это нормально
      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Ошибка получения конфигурации: ${response.status}`);
      }

      const data = await response.json();
      return {
        bot_token: data.config?.bot_token || '',
        default_chat_id: data.config?.default_chat_id || '',
        parse_mode: data.config?.parse_mode || 'HTML',
        disable_notifications: data.config?.disable_notifications || false,
        quiet_hours_start: data.config?.quiet_hours_start || '',
        quiet_hours_end: data.config?.quiet_hours_end || '',
        quiet_hours_enabled: data.config?.quiet_hours_enabled || false,
        enabled: data.integration?.is_active || false,
        is_active: data.integration?.is_active || false,
      };
    } catch (error) {
      console.error('Ошибка получения конфигурации Telegram:', error);
      return null;
    }
  }

  // Тестирование подключения Telegram
  async testTelegramConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram/test-connection`, {
        method: 'POST',
        headers: createHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.details || data.error || 'Ошибка подключения',
        };
      }

      return {
        success: true,
        message: data.message || 'Подключение успешно',
      };
    } catch (error) {
      console.error('Ошибка тестирования Telegram подключения:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  // Получение конфигурации NovaConnect интеграции
  async getNovaConnectConfig(): Promise<{
    api_url?: string;
    token?: string;
    language?: string;
    webhook_url?: string;
    webhook_enabled?: boolean;
    sync_interval?: number;
    auto_sync_enabled?: boolean;
    enabled?: boolean;
    has_token?: boolean;
    is_active?: boolean;
  } | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/novaconnect/config`, {
        method: 'GET',
        headers: createHeaders(),
      });

      // 404 означает, что интеграция не настроена - это нормально, не логируем
      if (response.status === 404) {
        return null;
      }

      // Проверяем тип ответа перед парсингом JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (response.status === 404) {
          return null;
        }
        const text = await response.text();
        console.warn('Неожиданный формат ответа от /api/novaconnect/config:', text);
        return null;
      }

      if (!response.ok) {
        // Не логируем 404, так как это ожидаемое поведение
        if (response.status !== 404) {
          console.warn(`Ошибка получения конфигурации NovaConnect: ${response.status}`);
        }
        return null;
      }

      return await response.json();
    } catch (error) {
      // Игнорируем ошибки сети и 404 - просто возвращаем null
      // Не логируем, так как это ожидаемое поведение для ненастроенных интеграций
      return null;
    }
  }

  // Проверка статуса Axenta интеграции
  async checkAxentaIntegrationStatus(): Promise<{ 
    isConfigured: boolean; 
    isActive: boolean; 
    needsPassword: boolean;
    lastSync?: Date;
    errorMessage?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/axenta/status`, {
        method: 'GET',
        headers: createHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            isConfigured: false,
            isActive: false,
            needsPassword: true
          };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        isConfigured: data.configured || false,
        isActive: data.active || false,
        needsPassword: !data.configured || !data.active,
        lastSync: data.last_sync ? new Date(data.last_sync) : undefined,
        errorMessage: data.error_message
      };
    } catch (error) {
      console.error('Ошибка проверки статуса Axenta интеграции:', error);
      return {
        isConfigured: false,
        isActive: false,
        needsPassword: true,
        errorMessage: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  }

  // Тестирование подключения к Axenta Cloud
  async testAxentaConnection(settings: AxentaIntegrationSettings): Promise<{ success: boolean; message: string; connected: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/axenta/test-connection`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(settings), // Передаем настройки в теле запроса
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.details || data.error || 'Ошибка тестирования подключения',
          connected: false,
        };
      }

      return {
        success: true,
        message: data.message || 'Подключение успешно',
        connected: data.connected || true,
      };
    } catch (error) {
      console.error('Ошибка тестирования подключения Axenta:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
        connected: false,
      };
    }
  }

  // Синхронизация объектов с Axenta Cloud
  async syncAxentaObjects(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/axenta/sync/objects`, {
        method: 'POST',
        headers: createHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Ошибка синхронизации');
      }

      return {
        success: true,
        message: data.message || 'Синхронизация завершена успешно',
      };
    } catch (error) {
      console.error('Ошибка синхронизации объектов Axenta:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  // Получение статуса Axenta интеграции
  async getAxentaIntegrationStatus(): Promise<IntegrationStatusResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/axenta/status`, {
        method: 'GET',
        headers: createHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Интеграция не настроена
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        is_active: data.status.is_active,
        last_sync_at: data.status.last_sync_at ? new Date(data.status.last_sync_at) : null,
        last_error_at: data.status.last_error_at ? new Date(data.status.last_error_at) : null,
        error_message: data.status.error_message,
        sync_count: data.status.sync_count,
        error_count: data.status.error_count,
        success_count: data.status.success_count,
        success_rate: data.status.success_rate,
        next_sync_at: data.status.next_sync_at ? new Date(data.status.next_sync_at) : null,
      };
    } catch (error) {
      console.error('Ошибка получения статуса Axenta:', error);
      throw error;
    }
  }

  // Удаление Axenta интеграции
  async deleteAxentaIntegration(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/axenta/setup`, {
        method: 'DELETE',
        headers: createHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка удаления интеграции');
      }

      return {
        success: true,
        message: data.message || 'Интеграция удалена',
      };
    } catch (error) {
      console.error('Ошибка удаления Axenta интеграции:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }
}

export const settingsService = new SettingsService();
export default settingsService;
