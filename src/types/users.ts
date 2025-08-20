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
  external_source?: string; // bitrix24, 1c, etc.
  company_id?: number;
  role_id: number;
  template_id?: number;
  last_login?: string;
  login_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface UserWithRelations extends UserBase {
  role?: Role;
  template?: UserTemplate;
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
  by_role: Record<string, number>;
  by_type: Record<string, number>;
  recent_logins: number;
}

export type UserType = "user" | "client" | "installer" | "manager" | "admin";
export type UserStatus = "active" | "inactive" | "suspended";

// Константы для типов пользователей
export const USER_TYPES = {
  USER: "user",
  CLIENT: "client",
  INSTALLER: "installer",
  MANAGER: "manager",
  ADMIN: "admin",
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
