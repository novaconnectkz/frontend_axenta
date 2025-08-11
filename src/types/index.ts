// Экспорт всех типов проекта

// Типы авторизации
export type {
  AuthContext,
  AuthResponse,
  LoginForm,
  User,
} from "@/context/auth";

// Типы для store
export type {
  Device,
  DeviceFilter,
  DeviceStats,
  User as StoreUser,
  UserProfile,
} from "@/store";

// Общие API типы
export interface APIResponse<T = any> {
  status: "success" | "error";
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationParams;
}

// Типы для компонентов
export interface ComponentProps {
  loading?: boolean;
  disabled?: boolean;
  error?: string;
}

export interface FormValidationRule {
  (value: any): boolean | string;
}

// Типы роутинга
export interface RouteMetadata {
  requiresAuth?: boolean;
  requiresGuest?: boolean;
  roles?: string[];
  title?: string;
}

// Типы для Vuetify
export interface VuetifyFormRef {
  validate(): Promise<{ valid: boolean }>;
  reset(): void;
  resetValidation(): void;
}

// Константы для ролей
export const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  TECH: "tech",
  ACCOUNTANT: "accountant",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Константы для статусов устройств
export const DEVICE_STATUSES = {
  AVAILABLE: "available",
  RESERVED: "reserved",
  INSTALLED: "installed",
  MAINTENANCE: "maintenance",
  RETIRED: "retired",
} as const;

export type DeviceStatus =
  (typeof DEVICE_STATUSES)[keyof typeof DEVICE_STATUSES];
