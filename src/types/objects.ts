// Типы для управления объектами мониторинга

export interface ObjectBase {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Основные поля объекта
  name: string;
  type: string;
  description: string;

  // Новые поля согласно требованиям
  accountName?: string; // Название учетной записи
  creatorName?: string; // Создатель (ФИО)
  deviceTypeName?: string; // Модель устройства
  phoneNumbers?: string[]; // Номера телефонов (массив)
  createdAt?: string; // Дата создания (дублирует created_at для совместимости)
  lastMessageDatetime?: string; // Дата последнего сообщения
  uniqueId?: string; // Уникальный ID

  // Географические координаты
  latitude?: number;
  longitude?: number;
  address: string;

  // Идентификаторы устройства
  imei: string;
  phone_number: string;
  serial_number: string;

  // Статус объекта
  status: ObjectStatus;
  is_active: boolean;
  scheduled_delete_at?: string;
  last_activity_at?: string;

  // Связи
  company_id: number; // ID компании
  contract_id: number;
  template_id?: number;
  location_id: number;

  // Дополнительные данные
  settings: string; // JSON строка
  tags: string[];
  notes: string;
  external_id: string;
}

export interface ObjectWithRelations extends ObjectBase {
  company?: CompanyInfo;
  contract?: Contract;
  template?: ObjectTemplate;
  location?: Location;
  equipment?: Equipment[];
  installations?: Installation[];
}

export interface CompanyInfo {
  id: number;
  name: string;
}

export interface ObjectTemplate {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  name: string;
  description: string;
  category: string;

  icon: string;
  color: string;

  config: string; // JSON строка
  default_settings: string; // JSON строка
  required_equipment: string[];

  is_active: boolean;
  is_system: boolean;
  usage_count: number;
}

export interface Contract {
  id: number;
  client_name: string;
  client_contact: string;
  start_date: string;
  end_date: string;
  status: string;
  total_amount: number;
}

export interface Location {
  id: number;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  status: string;
}

export interface Equipment {
  id: number;
  name: string;
  type: string;
  imei: string;
  serial_number: string;
  status: string;
}

export interface Installation {
  id: number;
  type: string;
  status: string;
  scheduled_at: string;
  completed_at?: string;
}

// Типы статусов
export type ObjectStatus =
  | "active"
  | "inactive"
  | "maintenance"
  | "scheduled_delete";

// Фильтры для объектов
export interface ObjectFilters {
  status?: ObjectStatus;
  type?: string;
  search?: string;
  contract_id?: number;
  location_id?: number;
  template_id?: number;
  has_scheduled_delete?: boolean;
  is_active?: boolean;

  // Новые фильтры по полям
  accountName?: string;
  creatorName?: string;
  deviceTypeName?: string;
  uniqueId?: string;

  ordering?: string; // Поле для сортировки (id, name, accountName, creatorName, deviceTypeName, createdAt, lastMessageDatetime, uniqueId и т.д.)
}

// Пагинация
export interface ObjectsResponse {
  status: "success" | "error";
  data: {
    items: ObjectWithRelations[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
  error?: string;
}

// Форма создания/редактирования объекта
export interface ObjectForm {
  name: string;
  type: string;
  description: string;

  // Новые поля
  accountName?: string;
  creatorName?: string;
  deviceTypeName?: string;
  phoneNumbers?: string[];
  uniqueId?: string;
  is_active?: boolean;

  latitude?: number;
  longitude?: number;
  address: string;
  imei: string;
  phone_number: string;
  serial_number: string;
  company_id: number; // ID компании
  contract_id: number;
  template_id?: number;
  location_id: number;
  settings: string;
  tags: string[];
  notes: string;
  external_id: string;
}

// Данные для планового удаления
export interface ScheduleDeleteForm {
  scheduled_delete_at: string;
}

// Константы
export const OBJECT_TYPES = {
  VEHICLE: "vehicle",
  EQUIPMENT: "equipment",
  ASSET: "asset",
  BUILDING: "building",
  CONTAINER: "container",
} as const;

export const OBJECT_STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  MAINTENANCE: "maintenance",
  SCHEDULED_DELETE: "scheduled_delete",
} as const;

export const TEMPLATE_CATEGORIES = {
  VEHICLES: "vehicles",
  EQUIPMENT: "equipment",
  BUILDINGS: "buildings",
  CONTAINERS: "containers",
  ASSETS: "assets",
} as const;

export type ObjectType = (typeof OBJECT_TYPES)[keyof typeof OBJECT_TYPES];
export type TemplateCategory =
  (typeof TEMPLATE_CATEGORIES)[keyof typeof TEMPLATE_CATEGORIES];
