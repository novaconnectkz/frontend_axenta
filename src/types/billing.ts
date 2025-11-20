/**
 * Типы для системы биллинга Axenta CRM
 */

// Базовые типы
export type BillingPeriod = "monthly" | "yearly" | "one-time";
export type SubscriptionStatus =
  | "active"
  | "expired"
  | "cancelled"
  | "suspended"
  | "scheduled";
export type InvoiceStatus =
  | "draft"
  | "sent"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";
export type InvoiceItemType = "subscription" | "object" | "setup" | "discount";
export type BillingHistoryOperation =
  | "invoice_created"
  | "payment_received"
  | "invoice_cancelled"
  | "reminder_sent"
  | "object_scheduled_deletion"
  | "monthly_report_generated";
export type BillingHistoryStatus =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled";

// Тарифный план
export interface BillingPlan {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_period: BillingPeriod;
  max_devices: number;
  max_users: number;
  max_storage: number;
  has_analytics: boolean;
  has_api: boolean;
  has_support: boolean;
  has_custom_domain: boolean;
  is_active: boolean;
  is_popular: boolean;
  company_id?: number;
}

// Подписка
export interface Subscription {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  sequential_number?: number; // Порядковый номер подписки
  company_id: number;
  billing_plan_id: number;
  billing_plan: BillingPlan;
  contract_id?: number;
  contract?: {
    id: number;
    number: string;
    client_name: string;
    title: string;
  };
  start_date: string;
  end_date?: string;
  status: SubscriptionStatus;
  is_auto_renew: boolean;
  last_payment_date?: string;
  next_payment_date?: string;
  payment_method: string;
  object_ids?: number[];
  objects_count?: number;
}

// Позиция счета
export interface InvoiceItem {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  invoice_id: number;
  name: string;
  description: string;
  item_type: InvoiceItemType;
  object_id?: number;
  object?: {
    id: number;
    name: string;
    imei?: string;
    phone_number?: string;
  };
  quantity: string;
  unit_price: string;
  amount: string;
  period_start?: string;
  period_end?: string;
  notes: string;
}

// Счет
export interface Invoice {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  number: string;
  sequential_number?: number; // Порядковый номер счета
  title: string;
  description: string;
  invoice_date: string;
  due_date: string;
  company_id: number;
  contract_id?: number;
  contract?: {
    id: number;
    number: string;
    client_name: string;
    client_email: string;
  };
  tariff_plan_id: number;
  tariff_plan?: {
    id: number;
    name: string;
    price: number;
    currency: string;
  };
  billing_period_start: string;
  billing_period_end: string;
  subtotal_amount: string;
  tax_rate: string;
  tax_amount: string;
  total_amount: string;
  currency: string;
  status: InvoiceStatus;
  paid_at?: string;
  paid_amount: string;
  notes: string;
  external_id: string;
  items: InvoiceItem[];
}

// История биллинга
export interface BillingHistory {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  company_id: number;
  invoice_id?: number;
  invoice?: Invoice;
  contract_id?: number;
  contract?: {
    id: number;
    number: string;
    client_name: string;
  };
  operation: BillingHistoryOperation;
  amount: string;
  currency: string;
  description: string;
  period_start?: string;
  period_end?: string;
  metadata: string;
  status: BillingHistoryStatus;
}

// Настройки биллинга
export interface BillingSettings {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  company_id: number;
  auto_generate_invoices: boolean;
  invoice_generation_day: number;
  invoice_payment_term_days: number;
  default_tax_rate: string;
  tax_included: boolean;
  notify_before_invoice: number;
  notify_before_due: number;
  notify_overdue: number;
  invoice_number_prefix: string;
  invoice_number_format: string;
  currency: string;
  default_payment_method: string;
  allow_partial_payments: boolean;
  require_payment_confirm: boolean;
  enable_inactive_discounts: boolean;
  inactive_discount_ratio: string;
  contract_numbering_method: string;
  contract_default_numerator_id?: number;
  bitrix24_deal_number_field?: string;
}

// Расчет биллинга
export interface BillingCalculation {
  contract_id: number;
  company_id: number;
  active_objects: number;
  inactive_objects: number;
  scheduled_deletes: number;
  base_amount: string;
  objects_amount: string;
  discount_amount: string;
  subtotal_amount: string;
  tax_amount: string;
  total_amount: string;
  items: {
    name: string;
    description?: string;
    item_type: InvoiceItemType;
    object_id?: number;
    quantity: string;
    unit_price: string;
    amount: string;
    period_start?: string;
    period_end?: string;
  }[];
}

// Статистика биллинга
export interface BillingStatistics {
  company_id: number;
  period: {
    year: number;
    month?: number;
  };
  total_invoices: number;
  total_amount: string;
  paid_amount: string;
  outstanding_amount: string;
  overdue_amount: string;
  invoices_by_status: {
    draft: number;
    sent: number;
    partially_paid: number;
    paid: number;
    overdue: number;
    cancelled: number;
  };
  monthly_revenue: {
    month: number;
    amount: string;
    invoices_count: number;
  }[];
  payment_methods: {
    method: string;
    count: number;
    amount: string;
  }[];
}

// Данные для создания подписки
export interface CreateSubscriptionData {
  company_id: number;
  billing_plan_id: number;
  start_date?: string;
  start_time?: string; // Время начала подписки (HH:MM)
  end_date?: string;
  status?: SubscriptionStatus;
  is_auto_renew?: boolean;
  payment_method?: string;
  contract_id?: number;
  split_period?: boolean; // Разбить период при смене тарифа в середине месяца
  transfer_from_subscription_id?: number; // ID подписки для переноса
}

// Данные для обновления подписки
export interface UpdateSubscriptionData {
  billing_plan_id?: number;
  end_date?: string;
  status?: SubscriptionStatus;
  is_auto_renew?: boolean;
  payment_method?: string;
}

// Данные для создания тарифного плана
export interface CreateBillingPlanData {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  billing_period?: BillingPeriod;
  max_devices?: number;
  max_users?: number;
  max_storage?: number;
  has_analytics?: boolean;
  has_api?: boolean;
  has_support?: boolean;
  has_custom_domain?: boolean;
  is_active?: boolean;
  is_popular?: boolean;
  company_id?: number;
}

// Данные для обновления тарифного плана
export interface UpdateBillingPlanData extends Partial<CreateBillingPlanData> {}

// Данные для генерации счета
export interface GenerateInvoiceData {
  period_start: string;
  period_end: string;
}

// Данные для обработки платежа
export interface ProcessPaymentData {
  amount: string;
  payment_method: string;
  notes?: string;
}

// Данные для отмены счета
export interface CancelInvoiceData {
  reason: string;
}

// Данные для обновления настроек биллинга
export interface UpdateBillingSettingsData extends Partial<BillingSettings> {}

// Фильтры для поиска счетов
export interface InvoicesFilter {
  company_id?: number;
  contract_id?: number;
  status?: InvoiceStatus;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

// Фильтры для истории биллинга
export interface BillingHistoryFilter {
  company_id: number;
  invoice_id?: number;
  contract_id?: number;
  operation?: BillingHistoryOperation;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

// Ответы API
export interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  error?: string;
  message?: string;
  count?: number;
  total?: number;
  limit?: number;
  offset?: number;
}

export interface BillingPlansResponse extends ApiResponse<BillingPlan[]> {}
export interface BillingPlanResponse extends ApiResponse<BillingPlan> {}
export interface SubscriptionsResponse extends ApiResponse<Subscription[]> {}
export interface SubscriptionResponse extends ApiResponse<Subscription> {}
export interface InvoicesResponse extends ApiResponse<Invoice[]> {}
export interface InvoiceResponse extends ApiResponse<Invoice> {}
export interface BillingHistoryResponse extends ApiResponse<BillingHistory[]> {}
export interface BillingSettingsResponse extends ApiResponse<BillingSettings> {}
export interface BillingCalculationResponse
  extends ApiResponse<BillingCalculation> {}
export interface BillingStatisticsResponse
  extends ApiResponse<BillingStatistics> {}

// ------- Дополнительные типы для улучшений вкладки «Настройки» -------

// Dry-run генерации счетов
export interface DryRunInvoicesRequest {
  from: string; // ISO date
  to: string;   // ISO date
  filters?: {
    accountId?: string | number;
    subscriptionId?: string | number;
    status?: "active" | "paused";
    objectId?: string | number;
  };
  limit?: number;
}

export interface DryRunItem {
  accountId: string | number;
  subscriptionId?: string | number;
  amount: { value: number; currency: string };
  reason?: string;
  blockedBy?: string[];
}

export interface DryRunInvoicesResponse {
  summary: {
    candidates: number;
    willCreate: number;
    totalAmount: { value: number; currency: string };
  };
  items: DryRunItem[];
}

// Тест уведомлений
export type TestNotificationChannel = "email" | "system" | "slack";
export type TestNotificationTemplate =
  | "invoice_due"
  | "invoice_created"
  | "subscription_expiring";

export interface TestNotificationRequest {
  channel: TestNotificationChannel;
  template: TestNotificationTemplate;
  to?: string;
  sampleData?: Record<string, unknown>;
}

export interface TestNotificationResponse {
  status: "ok";
  deliveryId?: string;
  previewUrl?: string;
}

// Превью нумератора
export type NumeratorContext = "contracts" | "invoices";
export interface PreviewNumeratorQuery {
  template?: string;
  prefix?: string;
  seq?: number;
  date?: string; // ISO date
}

export interface PreviewNumeratorResponse {
  preview: string;
  nextSeq: number;
}

// Виджеты для дашборда
export interface BillingWidget {
  title: string;
  value: string | number;
  change?: {
    value: number;
    period: string;
    trend: "up" | "down" | "stable";
  };
  currency?: string;
  format?: "currency" | "number" | "percentage";
}

export interface BillingDashboardData {
  widgets: {
    total_revenue: BillingWidget;
    monthly_revenue: BillingWidget;
    outstanding_amount: BillingWidget;
    overdue_amount: BillingWidget;
    active_subscriptions: BillingWidget;
    overdue_invoices: BillingWidget;
  };
  recent_invoices: Invoice[];
  revenue_chart: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
    }[];
  };
  invoices_by_status: {
    status: InvoiceStatus;
    count: number;
    amount: string;
  }[];
}
