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

// Базовый интерфейс договора
export interface ContractBase {
  id: number;
  number: string;
  title: string;
  description?: string;
  company_id: number;
  client_name: string;
  client_contact?: string;
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
  client_name: string;
  client_inn?: string;
  client_kpp?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  start_date: string;
  end_date: string;
  tariff_plan_id: number;
  total_amount: string;
  currency: string;
  status: ContractStatus;
  is_active: boolean;
  notify_before?: number;
  notes?: string;
  external_id?: string;
  account_id?: number; // ID учетной записи Axenta для автоматической привязки объектов
}

// Договор с дополнительными полями и связями
export interface ContractWithRelations extends Contract {
  client_inn?: string;
  client_kpp?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
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
