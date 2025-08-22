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

// Типы объектов
export type {
  Contract,
  Equipment,
  Installation,
  Location,
  ObjectBase,
  ObjectFilters,
  ObjectForm,
  ObjectStatus,
  ObjectTemplate,
  ObjectType,
  ObjectWithRelations,
  ObjectsResponse,
  ScheduleDeleteForm,
  TemplateCategory,
} from "@/types/objects";

// Типы пользователей
export type {
  PERMISSIONS,
  Permission,
  Role,
  USER_ROLES,
  USER_TYPES,
  UserBase,
  UserFilters,
  UserForm,
  UserStats,
  UserStatus,
  UserTemplate,
  UserType,
  UserWithRelations,
  UsersResponse,
} from "@/types/users";

// Типы монтажей
export type {
  AvailableInstaller,
  AvailableInstallerQuery,
  CalendarEvent,
  CalendarView,
  CancelInstallationForm,
  CompleteInstallationForm,
  EQUIPMENT_CONDITIONS,
  EQUIPMENT_STATUSES,
  EquipmentBase,
  EquipmentCondition,
  EquipmentFilters,
  EquipmentForm,
  EquipmentResponse,
  EquipmentStats,
  EquipmentStatus,
  INSTALLATION_PRIORITIES,
  INSTALLATION_STATUSES,
  INSTALLATION_TYPES,
  INSTALLER_STATUSES,
  INSTALLER_TYPES,
  InstallationBase,
  InstallationFilters,
  InstallationForm,
  InstallationPriority,
  InstallationStats,
  InstallationStatus,
  InstallationType,
  InstallationWithRelations,
  InstallationsResponse,
  InstallerBase,
  InstallerFilters,
  InstallerForm,
  InstallerSchedule,
  InstallerScheduleItem,
  InstallerStats,
  InstallerStatus,
  InstallerType,
  InstallerWithRelations,
  InstallersResponse,
  LocationBase,
  LocationFilters,
  LocationForm,
  LocationStats,
  LocationsResponse,
} from "@/types/installations";

// Типы склада
export type {
  EQUIPMENT_CONDITIONS,
  EQUIPMENT_STATUSES,
  EQUIPMENT_STATUS_COLORS,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_TYPE_OPTIONS,
  EquipmentBase,
  EquipmentCategory,
  EquipmentCondition,
  EquipmentFilters,
  EquipmentForm,
  EquipmentInstallForm,
  EquipmentResponse,
  EquipmentStats,
  EquipmentStatus,
  EquipmentTransferForm,
  EquipmentTypeOption,
  LowStockItem,
  STOCK_ALERT_SEVERITIES,
  STOCK_ALERT_STATUSES,
  STOCK_ALERT_TYPES,
  StockAlert,
  StockAlertFilters,
  StockAlertForm,
  StockAlertResponse,
  StockAlertSeverity,
  StockAlertStatus,
  StockAlertType,
  WAREHOUSE_LOCATION_OPTIONS,
  WAREHOUSE_OPERATION_STATUSES,
  WAREHOUSE_OPERATION_TYPES,
  WarehouseLocationOption,
  WarehouseOperation,
  WarehouseOperationFilters,
  WarehouseOperationForm,
  WarehouseOperationResponse,
  WarehouseOperationStatus,
  WarehouseOperationType,
} from "@/types/warehouse";

// Типы договоров
export type {
  CONTRACT_APPENDIX_STATUS_COLORS,
  CONTRACT_APPENDIX_STATUS_LABELS,
  CONTRACT_STATUSES,
  CONTRACT_STATUS_COLORS,
  CONTRACT_STATUS_LABELS,
  CURRENCY_OPTIONS,
  ContractAppendicesResponse,
  ContractAppendix,
  ContractAppendixForm,
  ContractAppendixResponse,
  ContractAppendixStatus,
  ContractBase,
  ContractCostCalculation,
  ContractCostResponse,
  ContractFilters,
  ContractForm,
  ContractObjectsForm,
  ContractResponse,
  ContractStats,
  ContractStatus,
  ContractWithRelations,
  ContractsResponse,
  ExpiringContractNotification,
  ExpiringContractsResponse,
  NOTIFICATION_PERIOD_OPTIONS,
} from "@/types/contracts";

// Типы dashboard (включает WarehouseStats)
export type { WarehouseStats } from "@/types/dashboard";

// Типы настроек и интеграций
export {
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  INTEGRATION_STATUSES,
  INTEGRATION_STATUS_COLORS,
  INTEGRATION_STATUS_LABELS,
  INTEGRATION_TYPES,
  INTEGRATION_TYPE_LABELS,
  LANGUAGE_OPTIONS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_EVENTS,
  NOTIFICATION_EVENT_LABELS,
  TEMPLATE_TYPES,
  TIMEZONE_OPTIONS,
} from "@/types/settings";

export type {
  AxentaIntegrationSettings,
  Bitrix24IntegrationSettings,
  ConnectionStatus,
  EmailSettings,
  IntegrationBase,
  IntegrationForm,
  IntegrationLog,
  IntegrationStats,
  IntegrationStatus,
  IntegrationStatusResponse,
  IntegrationType,
  IntegrationWithSettings,
  IntegrationsResponse,
  NotificationChannel,
  NotificationChannelSettings,
  NotificationChannelsResponse,
  NotificationEvent,
  NotificationSettingsForm,
  NotificationTemplate,
  ObjectTemplate,
  ObjectTemplateField,
  OneCIntegrationSettings,
  SmsSettings,
  SystemSettings,
  SystemSettingsForm,
  TelegramSettings,
  TemplateBase,
  TemplateForm,
  TemplateType,
  TemplatesResponse,
  UserTemplate,
} from "@/types/settings";

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
  permissions?: string[];
  title?: string;
  layout?: string;
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
