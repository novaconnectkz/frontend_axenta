// Типы для управления учетными записями (компаниями)

export interface Company {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  database_schema: string;
  domain: string;

  // Контактная информация
  contact_email: string;
  contact_phone: string;
  contact_person: string;

  // Адрес
  address: string;
  city: string;
  country: string;

  // Настройки и статус
  is_active: boolean;
  max_users: number;
  max_objects: number;
  storage_quota: number;
  language: string;
  timezone: string;
  currency: string;

  // Статистика использования
  usage_stats?: CompanyUsageStats;
}

export interface CompanyUsageStats {
  users_count: number;
  objects_count: number;
  storage_used_mb: number;
  last_activity?: string;
}

export interface CompanyFormData {
  name: string;
  domain: string;
  axetna_login: string;
  axetna_password: string;

  // Интеграция с Битрикс24
  bitrix24_webhook_url: string;
  bitrix24_client_id: string;
  bitrix24_client_secret: string;

  // Контактная информация
  contact_email: string;
  contact_phone: string;
  contact_person: string;

  // Адрес
  address: string;
  city: string;
  country: string;

  // Настройки
  max_users: number;
  max_objects: number;
  storage_quota: number;
  language: string;
  timezone: string;
  currency: string;
}

export interface CompanyFilters {
  search: string;
  is_active: boolean | null;
  city: string;
  country?: string;
  language?: string;
  currency?: string;
  page: number;
  limit: number;
  include_usage: boolean;
}

export interface CompanyStats {
  total: number;
  active: number;
  inactive: number;
  total_users: number;
  total_objects: number;
}

export interface CompanyConnectionTest {
  connection_success: boolean;
  message: string;
}

// Константы для форм
export const COMPANY_FORM_DEFAULTS: CompanyFormData = {
  name: "",
  domain: "",
  axetna_login: "",
  axetna_password: "",

  bitrix24_webhook_url: "",
  bitrix24_client_id: "",
  bitrix24_client_secret: "",

  contact_email: "",
  contact_phone: "",
  contact_person: "",

  address: "",
  city: "",
  country: "Russia",

  max_users: 10,
  max_objects: 100,
  storage_quota: 1024,
  language: "ru",
  timezone: "Europe/Moscow",
  currency: "RUB",
};

export const COMPANY_FILTERS_DEFAULTS: CompanyFilters = {
  search: "",
  is_active: null,
  city: "",
  page: 1,
  limit: 10,
  include_usage: true,
};

// Опции для селектов
export const LANGUAGE_OPTIONS = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

export const CURRENCY_OPTIONS = [
  { value: "RUB", label: "Российский рубль (RUB)" },
  { value: "USD", label: "Доллар США (USD)" },
  { value: "EUR", label: "Евро (EUR)" },
];

export const TIMEZONE_OPTIONS = [
  { value: "Europe/Moscow", label: "Москва (UTC+3)" },
  { value: "Europe/Samara", label: "Самара (UTC+4)" },
  { value: "Asia/Yekaterinburg", label: "Екатеринбург (UTC+5)" },
  { value: "Asia/Omsk", label: "Омск (UTC+6)" },
  { value: "Asia/Krasnoyarsk", label: "Красноярск (UTC+7)" },
  { value: "Asia/Irkutsk", label: "Иркутск (UTC+8)" },
  { value: "Asia/Yakutsk", label: "Якутск (UTC+9)" },
  { value: "Asia/Vladivostok", label: "Владивосток (UTC+10)" },
  { value: "Asia/Magadan", label: "Магадан (UTC+11)" },
  { value: "Asia/Kamchatka", label: "Камчатка (UTC+12)" },
];

export const COUNTRY_OPTIONS = [
  { value: "Russia", label: "Россия" },
  { value: "Belarus", label: "Беларусь" },
  { value: "Kazakhstan", label: "Казахстан" },
  { value: "Ukraine", label: "Украина" },
];
