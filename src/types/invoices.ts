// Типы для счетов (нумераторы счетов)

export interface InvoiceNumerator {
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

export interface InvoiceNumeratorForm {
  name: string;
  prefix: string;
  template: string;
  description?: string;
  company_id?: number;
  is_default: boolean;
  is_active: boolean;
  auto_reset: boolean;
  reset_period?: string;
  notes?: string;
}

export interface InvoiceNumeratorsResponse {
  status: "success" | "error";
  data: InvoiceNumerator[];
  count: number;
  message?: string;
}

// Плейсхолдеры для шаблона/префикса номера счета
export const INVOICE_NUMBER_PLACEHOLDERS = [
  { value: "{PREFIX}", label: "Префикс", description: "Префикс нумератора (например, INV)" },
  { value: "{SEQ}", label: "Последовательный номер", description: "Автоматически увеличивающийся номер (001, 002, 003...)" },
  { value: "{DAY}", label: "Текущий день", description: "День месяца (01-31)" },
  { value: "{MONTH}", label: "Текущий месяц", description: "Месяц (01-12)" },
  { value: "{YEAR}", label: "Текущий год", description: "Год (2025)" },
  { value: "{YEAR_SHORT}", label: "Короткий год", description: "Последние 2 цифры года (25)" },
  { value: "{RANDOM}", label: "Случайный номер", description: "Случайное 2-значное число (00-99)" },
] as const;

