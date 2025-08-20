// Типы для системы планирования монтажей

import type { PaginatedResponse } from "./index";

// Статусы монтажей
export const INSTALLATION_STATUSES = {
  PLANNED: "planned",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type InstallationStatus =
  (typeof INSTALLATION_STATUSES)[keyof typeof INSTALLATION_STATUSES];

// Типы работ
export const INSTALLATION_TYPES = {
  INSTALLATION: "монтаж",
  DIAGNOSTICS: "диагностика",
  DISMANTLING: "демонтаж",
  MAINTENANCE: "обслуживание",
} as const;

export type InstallationType =
  (typeof INSTALLATION_TYPES)[keyof typeof INSTALLATION_TYPES];

// Приоритеты
export const INSTALLATION_PRIORITIES = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export type InstallationPriority =
  (typeof INSTALLATION_PRIORITIES)[keyof typeof INSTALLATION_PRIORITIES];

// Статусы монтажников
export const INSTALLER_STATUSES = {
  AVAILABLE: "available",
  BUSY: "busy",
  VACATION: "vacation",
  SICK: "sick",
} as const;

export type InstallerStatus =
  (typeof INSTALLER_STATUSES)[keyof typeof INSTALLER_STATUSES];

// Типы монтажников
export const INSTALLER_TYPES = {
  STAFF: "staff",
  CONTRACTOR: "contractor",
  PARTNER: "partner",
} as const;

export type InstallerType =
  (typeof INSTALLER_TYPES)[keyof typeof INSTALLER_TYPES];

// Статусы оборудования
export const EQUIPMENT_STATUSES = {
  IN_STOCK: "in_stock",
  RESERVED: "reserved",
  INSTALLED: "installed",
  MAINTENANCE: "maintenance",
} as const;

export type EquipmentStatus =
  (typeof EQUIPMENT_STATUSES)[keyof typeof EQUIPMENT_STATUSES];

// Состояния оборудования
export const EQUIPMENT_CONDITIONS = {
  NEW: "new",
  USED: "used",
  REFURBISHED: "refurbished",
  DAMAGED: "damaged",
} as const;

export type EquipmentCondition =
  (typeof EQUIPMENT_CONDITIONS)[keyof typeof EQUIPMENT_CONDITIONS];

// Базовые интерфейсы

export interface InstallationBase {
  id: number;
  type: InstallationType;
  status: InstallationStatus;
  priority: InstallationPriority;
  scheduled_at: string;
  estimated_duration: number; // в минутах
  object_id: number;
  installer_id: number;
  location_id?: number;
  client_contact: string;
  address: string;
  description?: string;
  notes?: string;
  result?: string;
  actual_duration?: number;
  is_billable: boolean;
  cost?: number;
  labor_cost?: number;
  materials_cost?: number;
  created_at: string;
  updated_at: string;
  created_by_user_id: number;
}

export interface InstallationWithRelations extends InstallationBase {
  object: {
    id: number;
    name: string;
    type: string;
    imei?: string;
    phone_number?: string;
  };
  installer: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    type: InstallerType;
    specialization: string[];
  };
  location?: {
    id: number;
    city: string;
    region: string;
    country: string;
  };
  equipment?: EquipmentBase[];
}

export interface InstallerBase {
  id: number;
  first_name: string;
  last_name: string;
  type: InstallerType;
  phone: string;
  email: string;
  specialization: string[];
  max_daily_installations: number;
  working_days: number[]; // 1-7 (пн-вс)
  working_hours_start: string; // "09:00"
  working_hours_end: string; // "18:00"
  location_ids: number[];
  is_active: boolean;
  status: InstallerStatus;
  hire_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InstallerWithRelations extends InstallerBase {
  locations: LocationBase[];
  current_installations_count?: number;
  total_installations_count?: number;
  rating?: number;
}

export interface LocationBase {
  id: number;
  city: string;
  region: string;
  country: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EquipmentBase {
  id: number;
  type: string;
  model: string;
  brand: string;
  serial_number: string;
  imei?: string;
  phone_number?: string;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  object_id?: number;
  qr_code?: string;
  warranty_expires_at?: string;
  purchase_date?: string;
  purchase_price?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Формы для создания/редактирования

export interface InstallationForm {
  type: InstallationType;
  priority: InstallationPriority;
  scheduled_at: string;
  estimated_duration: number;
  object_id: number;
  installer_id: number;
  location_id?: number;
  client_contact: string;
  address: string;
  description?: string;
  notes?: string;
  is_billable: boolean;
  cost?: number;
  labor_cost?: number;
  materials_cost?: number;
  equipment_ids?: number[];
}

export interface InstallerForm {
  first_name: string;
  last_name: string;
  type: InstallerType;
  phone: string;
  email: string;
  specialization: string[];
  max_daily_installations: number;
  working_days: number[];
  working_hours_start: string;
  working_hours_end: string;
  location_ids: number[];
  hire_date?: string;
  notes?: string;
}

export interface LocationForm {
  city: string;
  region: string;
  country: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
}

export interface EquipmentForm {
  type: string;
  model: string;
  brand: string;
  serial_number: string;
  imei?: string;
  phone_number?: string;
  condition: EquipmentCondition;
  warranty_expires_at?: string;
  purchase_date?: string;
  purchase_price?: number;
  notes?: string;
}

// Фильтры

export interface InstallationFilters {
  status?: InstallationStatus;
  type?: InstallationType;
  priority?: InstallationPriority;
  installer_id?: number;
  object_id?: number;
  location_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
  is_billable?: boolean;
  ordering?: string;
}

export interface InstallerFilters {
  type?: InstallerType;
  status?: InstallerStatus;
  specialization?: string;
  location_id?: number;
  is_active?: boolean;
  search?: string;
  ordering?: string;
}

export interface LocationFilters {
  region?: string;
  country?: string;
  is_active?: boolean;
  search?: string;
  ordering?: string;
}

export interface EquipmentFilters {
  type?: string;
  status?: EquipmentStatus;
  condition?: EquipmentCondition;
  object_id?: number;
  search?: string;
  ordering?: string;
}

// Ответы API

export interface InstallationsResponse
  extends PaginatedResponse<InstallationWithRelations> {}

export interface InstallersResponse
  extends PaginatedResponse<InstallerWithRelations> {}

export interface LocationsResponse extends PaginatedResponse<LocationBase> {}

export interface EquipmentResponse extends PaginatedResponse<EquipmentBase> {}

// Статистика

export interface InstallationStats {
  total: number;
  by_status: Record<InstallationStatus, number>;
  by_type: Record<InstallationType, number>;
  by_priority: Record<InstallationPriority, number>;
  overdue: number;
  today: number;
  this_week: number;
  this_month: number;
  average_duration: number;
  completion_rate: number;
}

export interface InstallerStats {
  total: number;
  active: number;
  by_type: Record<InstallerType, number>;
  by_status: Record<InstallerStatus, number>;
  average_rating: number;
  total_installations: number;
  busiest_installer: {
    id: number;
    name: string;
    installations_count: number;
  };
}

export interface LocationStats {
  total: number;
  active: number;
  by_region: Record<string, number>;
  most_popular: {
    id: number;
    city: string;
    installations_count: number;
  };
}

export interface EquipmentStats {
  total: number;
  by_status: Record<EquipmentStatus, number>;
  by_condition: Record<EquipmentCondition, number>;
  low_stock: number;
  warranty_expiring: number;
}

// Расписание монтажника

export interface InstallerScheduleItem {
  installation_id: number;
  type: InstallationType;
  priority: InstallationPriority;
  scheduled_at: string;
  estimated_duration: number;
  object_name: string;
  client_contact: string;
  address: string;
  status: InstallationStatus;
}

export interface InstallerSchedule {
  installer: InstallerBase;
  items: InstallerScheduleItem[];
  total_duration: number;
  available_slots: {
    start: string;
    end: string;
  }[];
}

// Календарь

export interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  color: string;
  installation: InstallationWithRelations;
}

export interface CalendarView {
  events: CalendarEvent[];
  installers: InstallerBase[];
  date_from: string;
  date_to: string;
}

// Доступные монтажники

export interface AvailableInstallerQuery {
  date: string;
  location_id?: number;
  specialization?: string;
  duration: number;
}

export interface AvailableInstaller extends InstallerBase {
  available_slots: {
    start: string;
    end: string;
  }[];
  current_workload: number;
  distance?: number;
}

// Завершение монтажа

export interface CompleteInstallationForm {
  result: string;
  notes?: string;
  actual_duration: number;
  materials_cost?: number;
  labor_cost?: number;
  equipment_installed?: number[];
  photos?: File[];
}

// Отмена монтажа

export interface CancelInstallationForm {
  reason: string;
  notes?: string;
  reschedule_date?: string;
}
