// Типы и константы для договоров

// Статусы договоров
export const CONTRACT_STATUSES = {
  DRAFT: "draft",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  EXPIRED: "expired",
  TERMINATED: "terminated",
} as const;

export type ContractStatus =
  (typeof CONTRACT_STATUSES)[keyof typeof CONTRACT_STATUSES];

// Лейблы статусов договоров
export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  [CONTRACT_STATUSES.DRAFT]: "Черновик",
  [CONTRACT_STATUSES.ACTIVE]: "Активный",
  [CONTRACT_STATUSES.SUSPENDED]: "Приостановлен",
  [CONTRACT_STATUSES.EXPIRED]: "Истек",
  [CONTRACT_STATUSES.TERMINATED]: "Расторгнут",
};

// Цвета статусов договоров
export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  [CONTRACT_STATUSES.DRAFT]: "grey",
  [CONTRACT_STATUSES.ACTIVE]: "success",
  [CONTRACT_STATUSES.SUSPENDED]: "warning",
  [CONTRACT_STATUSES.EXPIRED]: "error",
  [CONTRACT_STATUSES.TERMINATED]: "error",
};

// Статусы приложений к договорам
export const CONTRACT_APPENDIX_STATUSES = {
  DRAFT: "draft",
  ACTIVE: "active",
  CANCELLED: "cancelled",
} as const;

export type ContractAppendixStatus =
  (typeof CONTRACT_APPENDIX_STATUSES)[keyof typeof CONTRACT_APPENDIX_STATUSES];

// Лейблы статусов приложений
export const CONTRACT_APPENDIX_STATUS_LABELS: Record<
  ContractAppendixStatus,
  string
> = {
  [CONTRACT_APPENDIX_STATUSES.DRAFT]: "Черновик",
  [CONTRACT_APPENDIX_STATUSES.ACTIVE]: "Активное",
  [CONTRACT_APPENDIX_STATUSES.CANCELLED]: "Отменено",
};

// Цвета статусов приложений
export const CONTRACT_APPENDIX_STATUS_COLORS: Record<
  ContractAppendixStatus,
  string
> = {
  [CONTRACT_APPENDIX_STATUSES.DRAFT]: "grey",
  [CONTRACT_APPENDIX_STATUSES.ACTIVE]: "success",
  [CONTRACT_APPENDIX_STATUSES.CANCELLED]: "error",
};

// Валюты
export const CURRENCY_OPTIONS = [
  { value: "RUB", title: "Рубль (₽)" },
  { value: "USD", title: "Доллар ($)" },
  { value: "EUR", title: "Евро (€)" },
] as const;

// Периоды уведомления об истечении договора
export const NOTIFICATION_PERIOD_OPTIONS = [
  { value: 7, title: "7 дней" },
  { value: 14, title: "14 дней" },
  { value: 30, title: "30 дней" },
  { value: 60, title: "60 дней" },
  { value: 90, title: "90 дней" },
] as const;

// Типы договоров
export const CONTRACT_TYPES = {
  CLIENT: "client",
  PARTNER: "partner",
} as const;

export type ContractType =
  (typeof CONTRACT_TYPES)[keyof typeof CONTRACT_TYPES];

// Лейблы типов договоров
export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  [CONTRACT_TYPES.CLIENT]: "Клиент",
  [CONTRACT_TYPES.PARTNER]: "Партнер",
};

// Цвета типов договоров
export const CONTRACT_TYPE_COLORS: Record<ContractType, string> = {
  [CONTRACT_TYPES.CLIENT]: "primary",
  [CONTRACT_TYPES.PARTNER]: "purple",
};

// Типы скидок для партнерских договоров
export const DISCOUNT_TYPES = {
  NONE: "none",
  MANUAL_PERCENT: "manual_percent",
  MANUAL_FIXED: "manual_fixed",
  AUTO: "auto",
} as const;

export type DiscountType =
  (typeof DISCOUNT_TYPES)[keyof typeof DISCOUNT_TYPES];

// Лейблы типов скидок
export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  [DISCOUNT_TYPES.NONE]: "Без скидки",
  [DISCOUNT_TYPES.MANUAL_PERCENT]: "Процент (%)",
  [DISCOUNT_TYPES.MANUAL_FIXED]: "Фиксированная (₽)",
  [DISCOUNT_TYPES.AUTO]: "Автоматическая",
};

// Опции типов скидок
export const DISCOUNT_TYPE_OPTIONS = [
  { value: DISCOUNT_TYPES.NONE, title: DISCOUNT_TYPE_LABELS[DISCOUNT_TYPES.NONE] },
  { value: DISCOUNT_TYPES.MANUAL_PERCENT, title: DISCOUNT_TYPE_LABELS[DISCOUNT_TYPES.MANUAL_PERCENT] },
  { value: DISCOUNT_TYPES.MANUAL_FIXED, title: DISCOUNT_TYPE_LABELS[DISCOUNT_TYPES.MANUAL_FIXED] },
  { value: DISCOUNT_TYPES.AUTO, title: DISCOUNT_TYPE_LABELS[DISCOUNT_TYPES.AUTO] },
] as const;

// Опции типов договоров
export const CONTRACT_TYPE_OPTIONS = [
  { value: CONTRACT_TYPES.CLIENT, title: CONTRACT_TYPE_LABELS[CONTRACT_TYPES.CLIENT] },
  { value: CONTRACT_TYPES.PARTNER, title: CONTRACT_TYPE_LABELS[CONTRACT_TYPES.PARTNER] },
] as const;

// Типы клиентов
export const CLIENT_TYPES = {
  ORGANIZATION: "organization",
  INDIVIDUAL_ENTREPRENEUR: "individual_entrepreneur",
  PHYSICAL_PERSON: "physical_person",
} as const;

export type ClientType =
  (typeof CLIENT_TYPES)[keyof typeof CLIENT_TYPES];

// Лейблы типов клиентов
export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  [CLIENT_TYPES.ORGANIZATION]: "Организация",
  [CLIENT_TYPES.INDIVIDUAL_ENTREPRENEUR]: "Индивидуальный предприниматель (ИП)",
  [CLIENT_TYPES.PHYSICAL_PERSON]: "Физическое лицо",
};

// Опции типов клиентов
export const CLIENT_TYPE_OPTIONS = [
  { value: CLIENT_TYPES.ORGANIZATION, title: CLIENT_TYPE_LABELS[CLIENT_TYPES.ORGANIZATION] },
  { value: CLIENT_TYPES.INDIVIDUAL_ENTREPRENEUR, title: CLIENT_TYPE_LABELS[CLIENT_TYPES.INDIVIDUAL_ENTREPRENEUR] },
  { value: CLIENT_TYPES.PHYSICAL_PERSON, title: CLIENT_TYPE_LABELS[CLIENT_TYPES.PHYSICAL_PERSON] },
] as const;

// Базовый интерфейс договора
export interface ContractBase {
  id: number;
  number: string;
  sequential_number?: number; // Порядковый номер договора
  title: string;
  description?: string;
  company_id: number;
  contract_type?: ContractType; // Тип договора: клиентский или партнерский
  partner_company_id?: number; // Для партнерских договоров - ID учетной записи партнера
  client_type?: ClientType; // Тип клиента
  client_name: string;
  client_short_name?: string; // Сокращенное название с ОПФ (для организаций)
  client_contact?: string;
  client_inn?: string;
  client_kpp?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  client_legal_address?: string; // Юридический адрес (для организаций)
  client_postal_address?: string; // Почтовый адрес (для организаций)
  
  // Дополнительные реквизиты для организаций
  client_ogrn?: string; // ОГРН (для организаций)
  client_okpo?: string; // ОКПО (для организаций)
  client_director?: string; // Генеральный директор / Руководитель
  client_based_on?: string; // Действует на основании
  
  // Поля для физических лиц и ИП
  client_passport_series?: string; // Серия паспорта
  client_passport_number?: string; // Номер паспорта
  client_passport_issued_by?: string; // Кем выдан паспорт
  client_passport_issue_date?: string; // Дата выдачи паспорта
  client_passport_department_code?: string; // Код подразделения
  client_registration_address?: string; // Адрес регистрации (для ИП и физических лиц)
  client_actual_address?: string; // Адрес фактического проживания (для физических лиц)
  client_snils?: string; // СНИЛС (для физических лиц)
  client_ogrnip?: string; // ОГРНИП (для ИП)
  client_website?: string; // Сайт (для ИП и организаций)
  
  // Банковские реквизиты
  client_bank_name?: string; // Наименование банка
  client_bank_bik?: string; // БИК
  client_bank_correspondent_account?: string; // Корреспондентский счёт
  client_bank_account?: string; // Расчётный счёт
  client_bank_recipient?: string; // Получатель
  
  start_date: string;
  end_date: string;
  status: ContractStatus;
  monthly_fee: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Договор с дополнительными полями
export interface Contract extends ContractBase {
  objects_count?: number;
  total_revenue?: string;
  last_payment_date?: string;
  next_payment_date?: string;
}

// Форма договора
export interface ContractForm {
  number: string;
  title: string;
  description?: string;
  contract_type?: ContractType; // Тип договора: клиентский или партнерский
  partner_company_id?: number; // Для партнерских договоров - ID учетной записи партнера
  client_type?: ClientType; // Тип клиента: организация, ИП, физическое лицо
  client_name: string;
  client_short_name?: string; // Сокращенное название с ОПФ (для организаций)
  client_inn?: string;
  client_kpp?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  client_legal_address?: string; // Юридический адрес (для организаций)
  client_postal_address?: string; // Почтовый адрес (для организаций)
  
  // Дополнительные реквизиты для организаций
  client_ogrn?: string; // ОГРН (для организаций)
  client_okpo?: string; // ОКПО (для организаций)
  client_director?: string; // Генеральный директор / Руководитель
  client_based_on?: string; // Действует на основании (Устав, доверенность и т.д.)
  
  // Поля для физических лиц и ИП
  client_passport_series?: string; // Серия паспорта
  client_passport_number?: string; // Номер паспорта
  client_passport_issued_by?: string; // Кем выдан паспорт
  client_passport_issue_date?: string; // Дата выдачи паспорта
  client_passport_department_code?: string; // Код подразделения
  client_registration_address?: string; // Адрес регистрации (для ИП и физических лиц)
  client_actual_address?: string; // Адрес фактического проживания (для физических лиц)
  client_snils?: string; // СНИЛС (для физических лиц)
  client_ogrnip?: string; // ОГРНИП (для ИП)
  client_website?: string; // Сайт (для ИП и организаций)
  
  // Банковские реквизиты (для всех типов клиентов)
  client_bank_name?: string; // Наименование банка
  client_bank_bik?: string; // БИК
  client_bank_correspondent_account?: string; // Корреспондентский счёт
  client_bank_account?: string; // Расчётный счёт
  client_bank_recipient?: string; // Получатель
  
  start_date?: string; // Опционально, будет установлено через подписку
  end_date?: string; // Опционально, будет установлено через подписку
  tariff_plan_id?: number; // Опционально, будет привязан через подписку
  total_amount: string;
  currency: string;
  status: ContractStatus;
  is_active: boolean;
  is_auto_renew?: boolean; // Автоматическая пролонгация договора
  contract_period_months?: number | null; // Период договора в месяцах (если null, используется период из тарифа)
  notify_before?: number;
  notes?: string;
  external_id?: string;
  account_id?: number; // ID учетной записи Axenta для автоматической привязки объектов
  
  // Скидки (для партнерских договоров)
  discount_type?: string; // none, manual_percent, manual_fixed, auto
  manual_discount_percent?: number; // 0-100 (процентная скидка)
  manual_discount_fixed?: number; // Фиксированная скидка в рублях
  use_auto_discount?: boolean; // Использовать автоматические скидки
}

// Договор с дополнительными полями и связями
export interface ContractWithRelations extends Contract {
  client_type?: ClientType; // Тип клиента
  client_short_name?: string; // Сокращенное название с ОПФ (для организаций)
  client_inn?: string;
  client_kpp?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  client_legal_address?: string; // Юридический адрес (для организаций)
  client_postal_address?: string; // Почтовый адрес (для организаций)
  
  // Дополнительные реквизиты для организаций
  client_ogrn?: string; // ОГРН (для организаций)
  client_okpo?: string; // ОКПО (для организаций)
  client_director?: string; // Генеральный директор / Руководитель
  client_based_on?: string; // Действует на основании
  
  // Поля для физических лиц и ИП
  client_passport_series?: string; // Серия паспорта
  client_passport_number?: string; // Номер паспорта
  client_passport_issued_by?: string; // Кем выдан паспорт
  client_passport_issue_date?: string; // Дата выдачи паспорта
  client_passport_department_code?: string; // Код подразделения
  client_registration_address?: string; // Адрес регистрации (для ИП и физических лиц)
  client_actual_address?: string; // Адрес фактического проживания (для физических лиц)
  client_snils?: string; // СНИЛС (для физических лиц)
  client_ogrnip?: string; // ОГРНИП (для ИП)
  client_website?: string; // Сайт (для ИП и организаций)
  
  // Банковские реквизиты
  client_bank_name?: string; // Наименование банка
  client_bank_bik?: string; // БИК
  client_bank_correspondent_account?: string; // Корреспондентский счёт
  client_bank_account?: string; // Расчётный счёт
  client_bank_recipient?: string; // Получатель
  
  tariff_plan_id?: number;
  total_amount?: string;
  notify_before?: number;
  notes?: string;
  external_id?: string;
  tariff_plan?: any;
  appendices?: ContractAppendix[];
  objects?: any[];
}

// Ответ API для договоров
export interface ContractsResponse {
  status: "success" | "error";
  data: {
    items: Contract[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  message?: string;
}

// Ответ API для одного договора
export interface ContractResponse {
  status: "success" | "error";
  data: Contract;
  message?: string;
}

// Приложение к договору
export interface ContractAppendix {
  id: number;
  contract_id: number;
  number: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: ContractAppendixStatus;
  monthly_fee_change: string;
  created_at: string;
  updated_at: string;
}

// Форма для привязки объектов к договору
export interface ContractObjectsForm {
  object_ids: number[];
  account_id?: number; // ID учетной записи Axenta (дочерняя компания)
}

// Форма приложения к договору
export interface ContractAppendixForm {
  number: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: ContractAppendixStatus;
  monthly_fee_change: string;
}

// Ответ API для приложений
export interface ContractAppendicesResponse {
  status: "success" | "error";
  data: {
    items: ContractAppendix[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  message?: string;
}

// Ответ API для одного приложения
export interface ContractAppendixResponse {
  status: "success" | "error";
  data: ContractAppendix;
  message?: string;
}

// Расчет стоимости договора
export interface ContractCostCalculation {
  base_cost: string;
  appendices_cost: string;
  total_cost: string;
  currency: string;
  calculation_date: string;
}

// Фильтры для договоров
export interface ContractFilters {
  search?: string;
  status?: ContractStatus;
  client_name?: string;
  start_date_from?: string;
  start_date_to?: string;
  end_date_from?: string;
  end_date_to?: string;
  is_active?: boolean;
  currency?: string;
}

// Статистика договоров
export interface ContractStats {
  total: number;
  active: number;
  expired: number;
  suspended: number;
  total_revenue: string;
  average_monthly_fee: string;
  expiring_soon: number;
}

// Нумератор договоров
export interface ContractNumerator {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  company_id: number;
  name: string;
  prefix: string;
  template: string;
  description?: string;
  counter_value: number;
  is_default: boolean;
  is_active: boolean;
  auto_reset: boolean;
  reset_period?: string;
  notes?: string;
}

// Форма нумератора
export interface ContractNumeratorForm {
  name: string;
  prefix: string;
  template: string;
  description?: string;
  company_id?: number; // ID компании из настроек пользователя
  is_default: boolean;
  is_active: boolean;
  auto_reset: boolean;
  reset_period?: string;
  notes?: string;
}

// Ответ API для нумераторов
export interface ContractNumeratorsResponse {
  status: "success" | "error";
  data: ContractNumerator[];
  count: number;
  message?: string;
}

// Плейсхолдеры для шаблона номера
export const CONTRACT_NUMBER_PLACEHOLDERS = [
  { value: "{PREFIX}", label: "Префикс", description: "Префикс нумератора (например, AX)" },
  { value: "{SEQ}", label: "Последовательный номер", description: "Автоматически увеличивающийся номер (001, 002, 003...)" },
  { value: "{DAY}", label: "Текущий день", description: "День месяца (01-31)" },
  { value: "{MONTH}", label: "Текущий месяц", description: "Месяц (01-12)" },
  { value: "{YEAR}", label: "Текущий год", description: "Год (2024)" },
  { value: "{YEAR_SHORT}", label: "Короткий год", description: "Последние 2 цифры года (24)" },
  { value: "{RANDOM}", label: "Случайный номер", description: "Случайное 2-значное число (00-99)" },
  // {ID}, {COMPANY_ID}, {CLIENT_ID} удалены из нумератора
] as const;

// Опции периода сброса
export const RESET_PERIOD_OPTIONS = [
  { value: "never", title: "Никогда" },
  { value: "yearly", title: "Ежегодно" },
  { value: "monthly", title: "Ежемесячно" },
] as const;

// Партнерские снимки
export interface PartnerDailySnapshot {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  admin_account_id: number;
  company_id: number;
  contract_id: number;
  snapshot_date: string;
  partner_company_id: number;
  tariff_plan_id: number;
  monthly_price: number;
  daily_price: number;
  total_objects_count: number;
  active_objects_count: number;
  discount_type: string;
  discount_percent: number;
  discount_fixed: number; // Фиксированная скидка
  cost_before_discount: number;
  discount_amount: number;
  daily_cost: number;
  status: string;
  notes?: string;
}

// Сводная информация по партнерским снимкам
export interface PartnerSnapshotsSummary {
  total_days: number;
  total_cost: number;
  avg_objects: number;
  daily_price: number; // Реальная дневная цена С УЧЕТОМ скидки
  monthly_price: number; // Реальная месячная цена С УЧЕТОМ скидки
  total_objects: number;
  price_per_object_for_period: number; // Реальная цена за объект/период С УЧЕТОМ скидки
  base_monthly_price?: number; // Базовая месячная цена БЕЗ скидки (для отображения)
  base_daily_price?: number; // Базовая дневная цена БЕЗ скидки (для отображения)
  total_discount?: number; // Общая сумма скидки за период
  discount_type?: DiscountType; // Тип скидки
  avg_daily_discount?: number; // Средняя дневная скидка
}

// Ответ API для партнерских снимков
export interface PartnerSnapshotsResponse {
  status: "success" | "error";
  snapshots: PartnerDailySnapshot[];
  summary: PartnerSnapshotsSummary;
  message?: string;
}
