// Типы для работы с пользователями

export interface UserBase {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  name?: string; // Полное имя для контрагентов
  phone?: string;
  telegram_id?: string;
  is_active: boolean;
  user_type: string; // user, client, installer, etc.
  external_id?: string;
  external_source?: string; // bitrix24, 1c, axenta, etc.
  company_id?: number;
  role_id: number;
  template_id?: number;
  last_login?: string;
  login_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Поля для Axenta интеграции
  axenta_user_type?: string; // partner, client, local
  axenta_user_id?: string;   // ID пользователя в Axenta
  is_axenta_user?: boolean;  // Пользователь из Axenta или локальный
}

export interface UserWithRelations extends UserBase {
  role?: Role;
  template?: UserTemplate;
  sendingPasswordReset?: boolean; // Состояние отправки ссылки сброса пароля
}

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  color?: string;
  priority: number;
  is_active: boolean;
  is_system: boolean;
  permissions?: Permission[];
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: string;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserTemplate {
  id: number;
  name: string;
  description?: string;
  role_id: number;
  role?: Role;
  settings: string; // JSON settings
  is_active: boolean;
  usage_count?: number;
  created_at: string;
  updated_at: string;
}

export interface UserFilters {
  search?: string;
  role?: string;
  active?: boolean;
  user_type?: string;
  external_source?: string;
  template_id?: number;
  ordering?: string;
  axenta_user_type?: string; // Фильтр по типу пользователя Axenta
  is_axenta_user?: boolean;  // Фильтр по источнику (Axenta или локальный)
}

export interface UserForm {
  username: string;
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  name?: string;
  phone?: string;
  telegram_id?: string;
  is_active: boolean;
  user_type: string;
  role_id: number;
  template_id?: number;
}

export interface UsersResponse {
  status: "success" | "error";
  data: {
    items: UserWithRelations[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  error?: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  regular_users: number;
  active_users: number;
  inactive_users: number;
  total_users: number;
  recent_users: number;
  recent_logins: number;
  by_role?: Record<string, number>;
  by_type?: Record<string, number>;
  role_stats?: Array<{role_name: string; count: number}>;
  last_updated?: string;
}

export type UserType = "user" | "client" | "installer" | "manager" | "admin";
export type UserStatus = "active" | "inactive" | "suspended";
export type AxentaUserType = "partner" | "client" | "local";

// Константы для типов пользователей
export const USER_TYPES = {
  USER: "user",
  CLIENT: "client",
  INSTALLER: "installer",
  MANAGER: "manager",
  ADMIN: "admin",
} as const;

// Константы для типов пользователей Axenta
export const AXENTA_USER_TYPES = {
  PARTNER: "partner",
  CLIENT: "client", 
  LOCAL: "local",
} as const;

// Константы для ролей
export const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  TECH: "tech",
  ACCOUNTANT: "accountant",
  INSTALLER: "installer",
  CLIENT: "client",
} as const;

// Константы для разрешений
export const PERMISSIONS = {
  // Пользователи
  USERS_READ: "users.read",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",

  // Роли
  ROLES_READ: "roles.read",
  ROLES_CREATE: "roles.create",
  ROLES_UPDATE: "roles.update",
  ROLES_DELETE: "roles.delete",

  // Объекты
  OBJECTS_READ: "objects.read",
  OBJECTS_CREATE: "objects.create",
  OBJECTS_UPDATE: "objects.update",
  OBJECTS_DELETE: "objects.delete",

  // Биллинг
  BILLING_READ: "billing.read",
  BILLING_CREATE: "billing.create",
  BILLING_UPDATE: "billing.update",

  // Отчеты
  REPORTS_READ: "reports.read",
  REPORTS_CREATE: "reports.create",

  // Склад
  WAREHOUSE_READ: "warehouse.read",
  WAREHOUSE_CREATE: "warehouse.create",
  WAREHOUSE_UPDATE: "warehouse.update",

  // Монтажи
  INSTALLATIONS_READ: "installations.read",
  INSTALLATIONS_CREATE: "installations.create",
  INSTALLATIONS_UPDATE: "installations.update",
} as const;

// === НОВЫЕ ТИПЫ ДЛЯ AXENTA РОЛЕЙ ===

// Интерфейс для статистики пользователей по типам Axenta
export interface AxentaUsersStats {
  partners: {
    count: number;
    users: UserWithRelations[];
  };
  clients: {
    count: number;
    users: UserWithRelations[];
  };
  local: {
    count: number;
    users: UserWithRelations[];
  };
  total: number;
}

// Интерфейс для создания локального пользователя
export interface LocalUserForm {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role_id: number;
}

// Интерфейс для обновления роли Axenta пользователя
export interface UpdateAxentaRoleForm {
  axenta_user_type: AxentaUserType;
  axenta_user_id?: string;
  is_axenta_user: boolean;
}

// Интерфейс для синхронизации с Axenta
export interface SyncAxentaUserForm {
  token: string;
  username: string;
}

// Ответы API для Axenta пользователей
export interface AxentaUsersResponse {
  status: "success" | "error";
  data: UserWithRelations[];
  count: number;
  type: string;
  error?: string;
}

export interface AxentaUsersStatsResponse {
  status: "success" | "error";
  data: AxentaUsersStats;
  error?: string;
}
