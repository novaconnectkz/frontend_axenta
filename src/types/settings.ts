// Типы для настроек и интеграций системы

// === ИНТЕГРАЦИИ ===

// Статусы интеграций
export const INTEGRATION_STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ERROR: "error",
  CONNECTING: "connecting",
  DISCONNECTED: "disconnected",
} as const;

export type IntegrationStatus =
  (typeof INTEGRATION_STATUSES)[keyof typeof INTEGRATION_STATUSES];

// Типы интеграций
export const INTEGRATION_TYPES = {
  AXENTA: "axenta",
  BITRIX24: "bitrix24",
  ONEC: "1c",
  TELEGRAM: "telegram",
  EMAIL: "email",
  SMS: "sms",
  WIALON: "wialon",
  NOVACONNECT: "novaconnect",
  MAX: "max",
} as const;

export type IntegrationType =
  (typeof INTEGRATION_TYPES)[keyof typeof INTEGRATION_TYPES];

// Базовый интерфейс интеграции
export interface IntegrationBase {
  id: string;
  type: IntegrationType;
  name: string;
  description: string;
  status: IntegrationStatus;
  enabled: boolean;
  lastSync?: Date | null;
  lastError?: string;
  created_at: Date;
  updated_at: Date;
}

// Настройки интеграции с Axenta
export interface AxentaIntegrationSettings {
  api_url: string;
  api_key: string;
  username: string;
  password: string;
  sync_interval: number; // в минутах
  auto_sync_enabled: boolean;
  retry_attempts: number;
  timeout: number; // в секундах
}

// Настройки интеграции с Bitrix24
export interface Bitrix24IntegrationSettings {
  domain: string;
  client_id: string;
  client_secret: string;
  access_token?: string;
  refresh_token?: string;
  webhook_url?: string;
  sync_contacts: boolean;
  sync_deals: boolean;
  sync_companies: boolean;
  auto_create_deals: boolean;
}

// Настройки интеграции с 1С
export interface OneCIntegrationSettings {
  server_url: string;
  database_name: string;
  username: string;
  password: string;
  export_format: "xml" | "json";
  auto_export_enabled: boolean;
  export_schedule: string; // cron expression
  include_payments: boolean;
  include_counterparties: boolean;
}

// Настройки интеграции с Wialon Hosting
export interface WialonIntegrationSettings {
  api_url: string; // URL API хоста (например, https://hst-api.wialon.com)
  token: string; // Токен авторизации (72 символа)
  data_center: "com" | "us" | "eu" | "org"; // Дата-центр Wialon
  auto_sync_enabled: boolean;
  sync_interval: number; // Интервал синхронизации в минутах
  sync_vehicles: boolean; // Синхронизировать объекты/транспорт
  sync_sensors: boolean; // Синхронизировать датчики
  sync_maintenance: boolean; // Синхронизировать интервалы ТО
  sync_drivers: boolean; // Синхронизировать водителей
  sync_geozones: boolean; // Синхронизировать геозоны
}

// Интеграция с настройками
export interface IntegrationWithSettings extends IntegrationBase {
  settings:
  | AxentaIntegrationSettings
  | Bitrix24IntegrationSettings
  | OneCIntegrationSettings
  | WialonIntegrationSettings
  | TelegramIntegrationSettings
  | EmailIntegrationSettings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | Record<string, any>; // Для расширяемости других интеграций
}

// Настройки Telegram интеграции (для карточки интеграций)
export interface TelegramIntegrationSettings {
  bot_token: string;
  default_chat_id?: string;
  parse_mode: "HTML" | "Markdown" | "MarkdownV2";
  disable_notifications?: boolean;
  silent_hours_start?: string;
  silent_hours_end?: string;
}

// Настройки Email интеграции (для карточки интеграций)
export interface EmailIntegrationSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_use_tls: boolean;
  smtp_from_email: string;
  smtp_from_name: string;
}

// === УВЕДОМЛЕНИЯ ===

// Типы каналов уведомлений
export const NOTIFICATION_CHANNELS = {
  TELEGRAM: "telegram",
  EMAIL: "email",
  SMS: "sms",
  PUSH: "push",
} as const;

export type NotificationChannel =
  (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];

// Типы событий для уведомлений
export const NOTIFICATION_EVENTS = {
  INSTALLATION_CREATED: "installation_created",
  INSTALLATION_COMPLETED: "installation_completed",
  INSTALLATION_CANCELLED: "installation_cancelled",
  LOW_STOCK_ALERT: "low_stock_alert",
  CONTRACT_EXPIRING: "contract_expiring",
  PAYMENT_OVERDUE: "payment_overdue",
  SYSTEM_ERROR: "system_error",
  SYNC_ERROR: "sync_error",
} as const;

export type NotificationEvent =
  (typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS];

// Настройки канала уведомлений
export interface NotificationChannelSettings {
  id: string;
  channel: NotificationChannel;
  name: string;
  enabled: boolean;
  settings: TelegramSettings | EmailSettings | SmsSettings;
  events: NotificationEvent[];
}

// Настройки Telegram
export interface TelegramSettings {
  bot_token: string;
  chat_id?: string;
  parse_mode: "HTML" | "Markdown";
  disable_web_page_preview: boolean;
  silent_hours_start?: string; // HH:mm
  silent_hours_end?: string; // HH:mm
}

// Настройки Email
export interface EmailSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_secure: boolean;
  from_email: string;
  from_name: string;
  template_header?: string;
  template_footer?: string;
}

// Настройки SMS
export interface SmsSettings {
  provider: "sms_ru" | "smsc" | "twilio";
  api_key: string;
  sender_name?: string;
  test_mode: boolean;
}

// === ШАБЛОНЫ ===

// Типы систем для шаблонов
export const TEMPLATE_SYSTEMS = {
  AXENTA: "axenta",
  BITRIX24: "bitrix24",
  ONEC: "1c",
} as const;

export type TemplateSystem = (typeof TEMPLATE_SYSTEMS)[keyof typeof TEMPLATE_SYSTEMS];

// Маппинг типов интеграций на системы шаблонов
// Только интеграции, которые поддерживают шаблоны
export const INTEGRATION_TO_TEMPLATE_SYSTEM_MAP: Record<string, TemplateSystem> = {
  [INTEGRATION_TYPES.AXENTA]: TEMPLATE_SYSTEMS.AXENTA,
  [INTEGRATION_TYPES.BITRIX24]: TEMPLATE_SYSTEMS.BITRIX24,
  [INTEGRATION_TYPES.ONEC]: TEMPLATE_SYSTEMS.ONEC,
};

// Типы шаблонов
export const TEMPLATE_TYPES = {
  OBJECT: "object",
  USER: "user",
  NOTIFICATION: "notification",
  REPORT: "report",
} as const;

export type TemplateType = (typeof TEMPLATE_TYPES)[keyof typeof TEMPLATE_TYPES];

// Базовый интерфейс шаблона
export interface TemplateBase {
  id: string;
  type: TemplateType;
  system: TemplateSystem; // Система, для которой предназначен шаблон
  name: string;
  description: string;
  category?: string;
  is_system: boolean;
  is_active: boolean;
  usage_count: number;
  created_at: Date;
  updated_at: Date;
}

// Шаблон объекта
export interface ObjectTemplate extends TemplateBase {
  type: "object";
  fields: ObjectTemplateField[];
  default_values: Record<string, any>;
}

// Поле шаблона объекта
export interface ObjectTemplateField {
  name: string;
  label: string;
  type: "text" | "number" | "boolean" | "select" | "date" | "textarea";
  required: boolean;
  default_value?: any;
  options?: string[]; // для select
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// Шаблон пользователя
export interface UserTemplate extends TemplateBase {
  type: "user";
  role_id: string;
  permissions: string[];
  default_settings: Record<string, any>;
}

// Шаблон уведомления
export interface NotificationTemplate extends TemplateBase {
  type: "notification";
  subject_template: string;
  body_template: string;
  variables: string[];
  channels: NotificationChannel[];
}

// Шаблон отчета (расширенная версия для Axenta)
export interface ReportTemplate extends TemplateBase {
  type: "report";
  // Для стандартных отчетов
  sql_query?: string;
  parameters?: Record<string, any>;
  headers?: Record<string, any>;
  formatting?: Record<string, any>;
  // Для отчетов Axenta с content и settings
  content?: Array<{
    name: string;
    type: string;
    columns?: Array<{
      name: string;
      title?: string;
      type?: string;
      isActive?: boolean;
    }>;
    settings?: Record<string, any>;
    typeContent?: string;
  }>;
  settings?: {
    description?: string;
    mainSettings?: Record<string, any>;
    mapSettings?: Record<string, any>;
    markersSettings?: Record<string, any>;
    addressSettings?: Record<string, any>;
    shiftSettings?: any[];
    binds?: any[];
  };
}

// === СИСТЕМНЫЕ НАСТРОЙКИ ===

// Общие настройки системы
export interface SystemSettings {
  id: string;
  company_name: string;
  company_logo?: string;
  timezone: string;
  date_format: string;
  currency: string;
  language: string;
  theme: "light" | "dark" | "auto";

  // Настройки безопасности
  session_timeout: number; // в минутах
  password_min_length: number;
  password_require_special: boolean;
  max_login_attempts: number;

  // Настройки уведомлений
  email_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
  telegram_notifications_enabled: boolean;

  // Налоговые настройки
  vat_rate_preset?: "russia" | "kazakhstan" | "none" | "custom";
  vat_rate_custom?: number;
  default_tax_rate?: number;
  tax_included?: boolean;

  // Настройки резервного копирования
  backup_enabled: boolean;
  backup_schedule: string; // cron expression
  backup_retention_days: number;

  created_at: Date;
  updated_at: Date;
}

// === МОНИТОРИНГ ИНТЕГРАЦИЙ ===

// Статус подключения
export interface ConnectionStatus {
  integration_id: string;
  status: IntegrationStatus;
  last_check: Date;
  response_time?: number; // в миллисекундах
  error_message?: string;
  success_rate: number; // процент успешных запросов за последние 24 часа
}

// Статистика интеграции
export interface IntegrationStats {
  integration_id: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  last_24h_requests: number;
  uptime_percentage: number;
  errors_by_type: Record<string, number>;
}

// Лог интеграции
export interface IntegrationLog {
  id: string;
  integration_id: string;
  level: "info" | "warning" | "error";
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// === ФОРМЫ ===

// Форма настроек интеграции
export interface IntegrationForm {
  name: string;
  description: string;
  enabled: boolean;
  settings: Record<string, any>;
}

// Форма настроек уведомлений
export interface NotificationSettingsForm {
  channel: NotificationChannel;
  name: string;
  enabled: boolean;
  settings: Record<string, any>;
  events: NotificationEvent[];
}

// Форма шаблона
export interface TemplateForm {
  name: string;
  description: string;
  category?: string;
  is_active: boolean;
  content: Record<string, any>;
}

// Форма системных настроек
export interface SystemSettingsForm {
  company_name: string;
  timezone: string;
  date_format: string;
  currency: string;
  language: string;
  theme: "light" | "dark" | "auto";
  session_timeout: number;
  password_min_length: number;
  password_require_special: boolean;
  max_login_attempts: number;
  email_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
  telegram_notifications_enabled: boolean;
  vat_rate_preset?: "russia" | "kazakhstan" | "none" | "custom";
  vat_rate_custom?: number;
  default_tax_rate?: number;
  tax_included?: boolean;
  backup_enabled: boolean;
  backup_schedule: string;
  backup_retention_days: number;
}

// === ОТВЕТЫ API ===

export interface IntegrationsResponse {
  integrations: IntegrationWithSettings[];
  total: number;
}

export interface NotificationChannelsResponse {
  channels: NotificationChannelSettings[];
  total: number;
}

export interface TemplatesResponse {
  templates: (ObjectTemplate | UserTemplate | NotificationTemplate | ReportTemplate)[];
  total: number;
}

export interface IntegrationStatusResponse {
  statuses: ConnectionStatus[];
  stats: IntegrationStats[];
}

// === КОНСТАНТЫ ===

// Опции часовых поясов
export const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC (UTC+0)" },
  { value: "Europe/Berlin", label: "UTC+1" },
  { value: "Europe/Kaliningrad", label: "Калининград (UTC+2)" },
  { value: "Europe/Moscow", label: "Москва (UTC+3)" },
  { value: "Europe/Samara", label: "Самара (UTC+4)" },
  { value: "Asia/Yekaterinburg", label: "Екатеринбург (UTC+5)" },
  { value: "Asia/Omsk", label: "Омск (UTC+6)" },
  { value: "Asia/Krasnoyarsk", label: "Красноярск (UTC+7)" },
  { value: "Asia/Irkutsk", label: "Иркутск (UTC+8)" },
  { value: "Asia/Yakutsk", label: "Якутск (UTC+9)" },
  { value: "Asia/Vladivostok", label: "Владивосток (UTC+10)" },
  { value: "Asia/Magadan", label: "Магадан (UTC+11)" },
  { value: "Asia/Kamchatka", label: "Петропавловск-Камчатский (UTC+12)" },
];

// Опции валют
export const CURRENCY_OPTIONS = [
  { value: "RUB", label: "₽ Российский рубль" },
  { value: "USD", label: "$ Доллар США" },
  { value: "EUR", label: "€ Евро" },
  { value: "KZT", label: "₸ Тенге" },
  { value: "BYN", label: "Br Белорусский рубль" },
];

// Опции языков
export const LANGUAGE_OPTIONS = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "kk", label: "Қазақша" },
  { value: "be", label: "Беларуская" },
];

// Опции форматов даты
export const DATE_FORMAT_OPTIONS = [
  { value: "DD.MM.YYYY", label: "ДД.ММ.ГГГГ" },
  { value: "MM/DD/YYYY", label: "ММ/ДД/ГГГГ" },
  { value: "YYYY-MM-DD", label: "ГГГГ-ММ-ДД" },
  { value: "DD MMM YYYY", label: "ДД МММ ГГГГ" },
];

// Цвета статусов интеграций
export const INTEGRATION_STATUS_COLORS = {
  [INTEGRATION_STATUSES.ACTIVE]: "success",
  [INTEGRATION_STATUSES.INACTIVE]: "grey",
  [INTEGRATION_STATUSES.ERROR]: "error",
  [INTEGRATION_STATUSES.CONNECTING]: "warning",
  [INTEGRATION_STATUSES.DISCONNECTED]: "error",
} as const;

// Метки статусов интеграций
export const INTEGRATION_STATUS_LABELS = {
  [INTEGRATION_STATUSES.ACTIVE]: "Активна",
  [INTEGRATION_STATUSES.INACTIVE]: "Неактивна",
  [INTEGRATION_STATUSES.ERROR]: "Ошибка",
  [INTEGRATION_STATUSES.CONNECTING]: "Подключение",
  [INTEGRATION_STATUSES.DISCONNECTED]: "Отключена",
} as const;

// Метки типов интеграций
export const INTEGRATION_TYPE_LABELS = {
  [INTEGRATION_TYPES.AXENTA]: "Axenta Cloud",
  [INTEGRATION_TYPES.BITRIX24]: "Битрикс24",
  [INTEGRATION_TYPES.ONEC]: "1С:Предприятие",
  [INTEGRATION_TYPES.TELEGRAM]: "Telegram Bot",
  [INTEGRATION_TYPES.EMAIL]: "Email SMTP",
  [INTEGRATION_TYPES.SMS]: "SMS Gateway",
  [INTEGRATION_TYPES.WIALON]: "Wialon Hosting",
  [INTEGRATION_TYPES.NOVACONNECT]: "NovaConnect API",
  [INTEGRATION_TYPES.MAX]: "MAX Messenger",
} as const;

// Метки каналов уведомлений
export const NOTIFICATION_CHANNEL_LABELS = {
  [NOTIFICATION_CHANNELS.TELEGRAM]: "Telegram",
  [NOTIFICATION_CHANNELS.EMAIL]: "Email",
  [NOTIFICATION_CHANNELS.SMS]: "SMS",
  [NOTIFICATION_CHANNELS.PUSH]: "Push-уведомления",
} as const;

// Метки событий уведомлений
export const NOTIFICATION_EVENT_LABELS = {
  [NOTIFICATION_EVENTS.INSTALLATION_CREATED]: "Создан монтаж",
  [NOTIFICATION_EVENTS.INSTALLATION_COMPLETED]: "Монтаж завершен",
  [NOTIFICATION_EVENTS.INSTALLATION_CANCELLED]: "Монтаж отменен",
  [NOTIFICATION_EVENTS.LOW_STOCK_ALERT]: "Низкий остаток на складе",
  [NOTIFICATION_EVENTS.CONTRACT_EXPIRING]: "Истекает договор",
  [NOTIFICATION_EVENTS.PAYMENT_OVERDUE]: "Просроченный платеж",
  [NOTIFICATION_EVENTS.SYSTEM_ERROR]: "Системная ошибка",
  [NOTIFICATION_EVENTS.SYNC_ERROR]: "Ошибка синхронизации",
} as const;

// Метки систем для шаблонов
export const TEMPLATE_SYSTEM_LABELS = {
  [TEMPLATE_SYSTEMS.AXENTA]: "Axenta",
  [TEMPLATE_SYSTEMS.BITRIX24]: "Битрикс24",
  [TEMPLATE_SYSTEMS.ONEC]: "1С:Предприятие",
} as const;
