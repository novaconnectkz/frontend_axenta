// Базовые типы для склада

// Статусы оборудования
export const EQUIPMENT_STATUSES = {
  IN_STOCK: "in_stock",
  RESERVED: "reserved", 
  INSTALLED: "installed",
  MAINTENANCE: "maintenance",
  BROKEN: "broken",
  DISPOSED: "disposed",
} as const;

export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[keyof typeof EQUIPMENT_STATUSES];

// Состояния оборудования
export const EQUIPMENT_CONDITIONS = {
  NEW: "new",
  USED: "used", 
  REFURBISHED: "refurbished",
  DAMAGED: "damaged",
} as const;

export type EquipmentCondition = (typeof EQUIPMENT_CONDITIONS)[keyof typeof EQUIPMENT_CONDITIONS];

// Типы складских операций
export const WAREHOUSE_OPERATION_TYPES = {
  RECEIVE: "receive",
  ISSUE: "issue",
  TRANSFER: "transfer", 
  INVENTORY: "inventory",
  MAINTENANCE: "maintenance",
  DISPOSAL: "disposal",
} as const;

export type WarehouseOperationType = (typeof WAREHOUSE_OPERATION_TYPES)[keyof typeof WAREHOUSE_OPERATION_TYPES];

// Статусы складских операций
export const WAREHOUSE_OPERATION_STATUSES = {
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type WarehouseOperationStatus = (typeof WAREHOUSE_OPERATION_STATUSES)[keyof typeof WAREHOUSE_OPERATION_STATUSES];

// Типы уведомлений склада
export const STOCK_ALERT_TYPES = {
  LOW_STOCK: "low_stock",
  EXPIRED_WARRANTY: "expired_warranty", 
  MAINTENANCE_DUE: "maintenance_due",
  EQUIPMENT_MOVEMENT: "equipment_movement",
} as const;

export type StockAlertType = (typeof STOCK_ALERT_TYPES)[keyof typeof STOCK_ALERT_TYPES];

// Уровни важности уведомлений
export const STOCK_ALERT_SEVERITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high", 
  CRITICAL: "critical",
} as const;

export type StockAlertSeverity = (typeof STOCK_ALERT_SEVERITIES)[keyof typeof STOCK_ALERT_SEVERITIES];

// Статусы уведомлений
export const STOCK_ALERT_STATUSES = {
  ACTIVE: "active",
  ACKNOWLEDGED: "acknowledged",
  RESOLVED: "resolved",
} as const;

export type StockAlertStatus = (typeof STOCK_ALERT_STATUSES)[keyof typeof STOCK_ALERT_STATUSES];

// Интерфейсы

// Базовый интерфейс оборудования
export interface EquipmentBase {
  id: number;
  type: string;
  model: string;
  brand: string;
  serial_number: string;
  imei: string;
  phone_number: string;
  mac_address: string;
  qr_code: string;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  object_id: number | null;
  category_id: number | null;
  warehouse_location: string;
  purchase_price: string;
  purchase_date: string | null;
  warranty_until: string | null;
  specifications: string;
  notes: string;
  last_maintenance_at: string | null;
  created_at: string;
  updated_at: string;
  category?: EquipmentCategory;
  object?: any; // Ссылка на объект
}

// Категория оборудования
export interface EquipmentCategory {
  id: number;
  name: string;
  description: string;
  code: string;
  min_stock_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Складская операция
export interface WarehouseOperation {
  id: number;
  type: WarehouseOperationType;
  description: string;
  status: WarehouseOperationStatus;
  equipment_id: number;
  quantity: number;
  from_location: string;
  to_location: string;
  user_id: number;
  document_number: string;
  notes: string;
  installation_id: number | null;
  company_id: number;
  created_at: string;
  updated_at: string;
  equipment?: EquipmentBase;
  user?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  installation?: any; // Ссылка на монтаж
}

// Уведомление склада
export interface StockAlert {
  id: number;
  type: StockAlertType;
  title: string;
  description: string;
  severity: StockAlertSeverity;
  equipment_id: number | null;
  equipment_category_id: number | null;
  status: StockAlertStatus;
  read_at: string | null;
  resolved_at: string | null;
  assigned_user_id: number | null;
  metadata: string;
  company_id: number;
  created_at: string;
  updated_at: string;
  equipment?: EquipmentBase;
  equipment_category?: EquipmentCategory;
  assigned_user?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

// Статистика склада (используется из types/dashboard.ts)

// Фильтры для оборудования
export interface EquipmentFilters {
  type?: string;
  status?: EquipmentStatus;
  condition?: EquipmentCondition;
  category_id?: number;
  manufacturer?: string;
  model?: string;
  search?: string;
  available?: boolean;
  needs_maintenance?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Форма оборудования
export interface EquipmentForm {
  type: string;
  model: string;
  brand: string;
  serial_number: string;
  imei?: string;
  phone_number?: string;
  mac_address?: string;
  qr_code?: string;
  status?: EquipmentStatus;
  condition?: EquipmentCondition;
  category_id?: number;
  warehouse_location: string;
  purchase_price: string;
  purchase_date?: string;
  warranty_until?: string;
  specifications?: string;
  notes?: string;
}

// Фильтры для операций
export interface WarehouseOperationFilters {
  type?: WarehouseOperationType;
  status?: WarehouseOperationStatus;
  equipment_id?: number;
  user_id?: number;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Форма складской операции
export interface WarehouseOperationForm {
  type: WarehouseOperationType;
  description: string;
  equipment_id: number;
  quantity?: number;
  from_location?: string;
  to_location: string;
  user_id: number;
  document_number?: string;
  notes?: string;
  installation_id?: number;
}

// Фильтры для уведомлений
export interface StockAlertFilters {
  type?: StockAlertType;
  status?: StockAlertStatus;
  severity?: StockAlertSeverity;
  equipment_id?: number;
  equipment_category_id?: number;
  assigned_user_id?: number;
  include_resolved?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Форма уведомления
export interface StockAlertForm {
  type: StockAlertType;
  title: string;
  description: string;
  severity: StockAlertSeverity;
  equipment_id?: number;
  equipment_category_id?: number;
  assigned_user_id?: number;
  metadata?: string;
}

// Форма перемещения оборудования
export interface EquipmentTransferForm {
  equipment_id: number;
  from_location: string;
  to_location: string;
  user_id: number;
  notes?: string;
}

// Форма установки оборудования
export interface EquipmentInstallForm {
  object_id: number;
}

// Ответы API
export interface EquipmentResponse {
  data: EquipmentBase[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface WarehouseOperationResponse {
  data: WarehouseOperation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface StockAlertResponse {
  data: StockAlert[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Статистика оборудования
export interface EquipmentStats {
  total: number;
  in_stock: number;
  installed: number;
  maintenance: number;
  broken: number;
  retired: number;
  needs_maintenance: number;
  expired_warranty: number;
  by_type: Record<string, number>;
  by_manufacturer: Record<string, number>;
}

// Низкие остатки
export interface LowStockItem {
  type: string;
  model: string;
  manufacturer: string;
  in_stock: number;
  total: number;
  threshold: number;
}

// Элементы для селектов
export interface EquipmentTypeOption {
  value: string;
  title: string;
  icon?: string;
}

export interface WarehouseLocationOption {
  value: string;
  title: string;
  zone?: string;
}

// Константы для UI
export const EQUIPMENT_TYPE_OPTIONS: EquipmentTypeOption[] = [
  { value: "GPS-tracker", title: "GPS-трекер", icon: "mdi-crosshairs-gps" },
  { value: "IP-camera", title: "IP-камера", icon: "mdi-camera" },
  { value: "Sensor", title: "Датчик", icon: "mdi-radar" },
  { value: "Cable", title: "Кабель", icon: "mdi-cable-data" },
  { value: "Switch", title: "Коммутатор", icon: "mdi-switch" },
  { value: "Router", title: "Маршрутизатор", icon: "mdi-router-wireless" },
  { value: "Power-supply", title: "Блок питания", icon: "mdi-power-plug" },
  { value: "Antenna", title: "Антенна", icon: "mdi-antenna" },
  { value: "Other", title: "Прочее", icon: "mdi-package-variant" },
];

export const WAREHOUSE_LOCATION_OPTIONS: WarehouseLocationOption[] = [
  { value: "A1-01", title: "Зона A, стеллаж 1, полка 01", zone: "A" },
  { value: "A1-02", title: "Зона A, стеллаж 1, полка 02", zone: "A" },
  { value: "A1-03", title: "Зона A, стеллаж 1, полка 03", zone: "A" },
  { value: "B2-01", title: "Зона B, стеллаж 2, полка 01", zone: "B" },
  { value: "B2-02", title: "Зона B, стеллаж 2, полка 02", zone: "B" },
  { value: "B2-03", title: "Зона B, стеллаж 2, полка 03", zone: "B" },
  { value: "C1-01", title: "Зона C, стеллаж 1, полка 01", zone: "C" },
  { value: "C1-05", title: "Зона C, стеллаж 1, полка 05", zone: "C" },
  { value: "C1-06", title: "Зона C, стеллаж 1, полка 06", zone: "C" },
  { value: "D3-01", title: "Зона D, стеллаж 3, полка 01", zone: "D" },
  { value: "E1-02", title: "Зона E, стеллаж 1, полка 02", zone: "E" },
  { value: "F1-01", title: "Зона F, стеллаж 1, полка 01", zone: "F" },
];

// Отображаемые названия статусов
export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  [EQUIPMENT_STATUSES.IN_STOCK]: "В наличии",
  [EQUIPMENT_STATUSES.RESERVED]: "Зарезервировано",
  [EQUIPMENT_STATUSES.INSTALLED]: "Установлено",
  [EQUIPMENT_STATUSES.MAINTENANCE]: "На обслуживании",
  [EQUIPMENT_STATUSES.BROKEN]: "Сломано",
  [EQUIPMENT_STATUSES.DISPOSED]: "Списано",
};

// Отображаемые названия состояний
export const EQUIPMENT_CONDITION_LABELS: Record<EquipmentCondition, string> = {
  [EQUIPMENT_CONDITIONS.NEW]: "Новое",
  [EQUIPMENT_CONDITIONS.USED]: "Б/у",
  [EQUIPMENT_CONDITIONS.REFURBISHED]: "Восстановленное",
  [EQUIPMENT_CONDITIONS.DAMAGED]: "Повреждено",
};

// Цвета для статусов
export const EQUIPMENT_STATUS_COLORS: Record<EquipmentStatus, string> = {
  [EQUIPMENT_STATUSES.IN_STOCK]: "success",
  [EQUIPMENT_STATUSES.RESERVED]: "warning",
  [EQUIPMENT_STATUSES.INSTALLED]: "info",
  [EQUIPMENT_STATUSES.MAINTENANCE]: "purple",
  [EQUIPMENT_STATUSES.BROKEN]: "error",
  [EQUIPMENT_STATUSES.DISPOSED]: "grey",
};

// Цвета для состояний
export const EQUIPMENT_CONDITION_COLORS: Record<EquipmentCondition, string> = {
  [EQUIPMENT_CONDITIONS.NEW]: "success",
  [EQUIPMENT_CONDITIONS.USED]: "info",
  [EQUIPMENT_CONDITIONS.REFURBISHED]: "warning",
  [EQUIPMENT_CONDITIONS.DAMAGED]: "error",
};

// Отображаемые названия типов операций
export const WAREHOUSE_OPERATION_TYPE_LABELS: Record<WarehouseOperationType, string> = {
  [WAREHOUSE_OPERATION_TYPES.RECEIVE]: "Поступление",
  [WAREHOUSE_OPERATION_TYPES.ISSUE]: "Выдача",
  [WAREHOUSE_OPERATION_TYPES.TRANSFER]: "Перемещение",
  [WAREHOUSE_OPERATION_TYPES.INVENTORY]: "Инвентаризация",
  [WAREHOUSE_OPERATION_TYPES.MAINTENANCE]: "Обслуживание",
  [WAREHOUSE_OPERATION_TYPES.DISPOSAL]: "Списание",
};

// Иконки для типов операций
export const WAREHOUSE_OPERATION_TYPE_ICONS: Record<WarehouseOperationType, string> = {
  [WAREHOUSE_OPERATION_TYPES.RECEIVE]: "mdi-package-down",
  [WAREHOUSE_OPERATION_TYPES.ISSUE]: "mdi-package-up",
  [WAREHOUSE_OPERATION_TYPES.TRANSFER]: "mdi-swap-horizontal",
  [WAREHOUSE_OPERATION_TYPES.INVENTORY]: "mdi-clipboard-list",
  [WAREHOUSE_OPERATION_TYPES.MAINTENANCE]: "mdi-wrench",
  [WAREHOUSE_OPERATION_TYPES.DISPOSAL]: "mdi-delete",
};

// Отображаемые названия типов уведомлений
export const STOCK_ALERT_TYPE_LABELS: Record<StockAlertType, string> = {
  [STOCK_ALERT_TYPES.LOW_STOCK]: "Низкий остаток",
  [STOCK_ALERT_TYPES.EXPIRED_WARRANTY]: "Истекла гарантия",
  [STOCK_ALERT_TYPES.MAINTENANCE_DUE]: "Требуется обслуживание",
  [STOCK_ALERT_TYPES.EQUIPMENT_MOVEMENT]: "Движение оборудования",
};

// Иконки для типов уведомлений
export const STOCK_ALERT_TYPE_ICONS: Record<StockAlertType, string> = {
  [STOCK_ALERT_TYPES.LOW_STOCK]: "mdi-package-variant",
  [STOCK_ALERT_TYPES.EXPIRED_WARRANTY]: "mdi-shield-alert",
  [STOCK_ALERT_TYPES.MAINTENANCE_DUE]: "mdi-wrench-clock",
  [STOCK_ALERT_TYPES.EQUIPMENT_MOVEMENT]: "mdi-swap-horizontal",
};

// Отображаемые названия уровней важности
export const STOCK_ALERT_SEVERITY_LABELS: Record<StockAlertSeverity, string> = {
  [STOCK_ALERT_SEVERITIES.LOW]: "Низкий",
  [STOCK_ALERT_SEVERITIES.MEDIUM]: "Средний",
  [STOCK_ALERT_SEVERITIES.HIGH]: "Высокий",
  [STOCK_ALERT_SEVERITIES.CRITICAL]: "Критический",
};

// Цвета для уровней важности
export const STOCK_ALERT_SEVERITY_COLORS: Record<StockAlertSeverity, string> = {
  [STOCK_ALERT_SEVERITIES.LOW]: "info",
  [STOCK_ALERT_SEVERITIES.MEDIUM]: "warning",
  [STOCK_ALERT_SEVERITIES.HIGH]: "orange",
  [STOCK_ALERT_SEVERITIES.CRITICAL]: "error",
};
