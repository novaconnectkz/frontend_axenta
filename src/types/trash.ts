// Типы для корзины удаленных элементов

export interface DeletedItem {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  
  // Идентификация удаленного элемента
  entity_type: EntityType;
  entity_id: number;
  entity_data: string; // JSON строка с данными
  
  // Информация об удалении
  deleted_by: number;
  deleted_by_name: string;
  deleted_at_custom: string;
  delete_reason?: string;
  
  // Для мультитенантности
  company_id: number;
  
  // Метаданные для отображения
  entity_name: string;
  entity_description: string;
  entity_preview: string;
  
  // Статус восстановления
  is_restored: boolean;
  restored_at?: string;
  restored_by?: number;
  restored_by_name?: string;
  
  // Окончательное удаление
  is_permanently_deleted: boolean;
  permanently_deleted_at?: string;
  permanently_deleted_by?: number;
}

export type EntityType = 
  | 'user'
  | 'contract'
  | 'object'
  | 'warehouse'
  | 'user_template'
  | 'object_template'
  | 'report_template'
  | 'installation'
  | 'equipment'
  | 'location'
  | 'role'
  | 'report';

export interface TrashStats {
  total_items: number;
  items_by_type: Record<string, number>;
  restored_count: number;
  can_be_restored: number;
  oldest_deleted_at?: string;
  recent_deleted_at?: string;
}

export interface TrashFilter {
  entity_type?: EntityType;
  search?: string;
  show_restored?: boolean;
  show_permanently_deleted?: boolean;
  page?: number;
  limit?: number;
}

export interface TrashListResponse {
  status: string;
  data: {
    items: DeletedItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface TrashStatsResponse {
  status: string;
  data: TrashStats;
}

export interface RestoreItemRequest {
  restore_note?: string;
}

export interface RestoreItemResponse {
  status: string;
  message: string;
  data: DeletedItem;
}

export interface PermanentlyDeleteResponse {
  status: string;
  message: string;
}

// Локализованные названия типов сущностей
export const EntityTypeLabels: Record<EntityType, string> = {
  user: 'Пользователь',
  contract: 'Договор',
  object: 'Объект',
  warehouse: 'Склад',
  user_template: 'Шаблон пользователя',
  object_template: 'Шаблон объекта',
  report_template: 'Шаблон отчета',
  installation: 'Монтаж',
  equipment: 'Оборудование',
  location: 'Локация',
  role: 'Роль',
  report: 'Отчет',
};

// Иконки для типов сущностей
export const EntityTypeIcons: Record<EntityType, string> = {
  user: 'mdi-account',
  contract: 'mdi-file-document',
  object: 'mdi-map-marker',
  warehouse: 'mdi-package-variant',
  user_template: 'mdi-account-box',
  object_template: 'mdi-shape',
  report_template: 'mdi-file-chart',
  installation: 'mdi-tools',
  equipment: 'mdi-devices',
  location: 'mdi-map',
  role: 'mdi-shield-account',
  report: 'mdi-chart-line',
};

// Цвета для типов сущностей
export const EntityTypeColors: Record<EntityType, string> = {
  user: 'blue',
  contract: 'green',
  object: 'orange',
  warehouse: 'purple',
  user_template: 'indigo',
  object_template: 'teal',
  report_template: 'cyan',
  installation: 'amber',
  equipment: 'brown',
  location: 'red',
  role: 'deep-purple',
  report: 'light-blue',
};

