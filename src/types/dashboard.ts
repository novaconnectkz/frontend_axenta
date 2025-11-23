// Типы для Dashboard
export interface DashboardStats {
  objects: ObjectStats;
  users: UserStats;
  billing: BillingStats;
  installations: InstallationStats;
  warehouse: WarehouseStats;
}

export interface ObjectStats {
  total: number;
  active: number;
  inactive: number;
  scheduled_for_deletion: number;
  deleted: number;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  regular_users: number;
  active_users?: number;
  inactive_users?: number;
  total_users?: number;
  recent_users?: number;
  recent_logins?: number;
  by_role?: Record<string, number>;
  by_type?: Record<string, number>;
  role_stats?: Array<{role_name: string; count: number}>;
  last_updated?: string;
}

export interface BillingStats {
  total_revenue: number;
  monthly_revenue: number;
  pending_invoices: number;
  overdue_invoices: number;
  active_contracts: number;
}

export interface InstallationStats {
  total: number;
  scheduled: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  today_installations: number;
}

export interface WarehouseStats {
  total_equipment: number;
  available_equipment: number;
  installed_equipment: number;
  reserved_equipment: number;
  maintenance_equipment: number;
  broken_equipment: number;
  low_stock_alerts: number;
  categories_count: number;
  recent_operations: number;
  by_category: Record<string, number>;
  operations_by_type: Record<string, number>;
  alerts_by_severity: Record<string, number>;
}

export interface Widget {
  id: string;
  title: string;
  type: WidgetType;
  size: WidgetSize;
  position: WidgetPosition;
  dimensions?: WidgetDimensions;
  config: WidgetConfig;
  visible: boolean;
}

export type WidgetType =
  | "objects-overview"
  | "users-overview"
  | "billing-overview"
  | "installations-overview"
  | "warehouse-overview"
  | "recent-activity"
  | "notifications"
  | "quick-stats"
  | "chart"
  | "tasks";

export type WidgetSize = "small" | "medium" | "large" | "extra-large";

export interface WidgetPosition {
  row: number;
  col: number;
  width: number;
  height: number;
}

export interface WidgetDimensions {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface WidgetBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CollisionResult {
  hasCollision: boolean;
  conflictingWidgets: string[];
  suggestedPosition?: WidgetBounds;
}

export interface SnapPoint {
  x: number;
  y: number;
  type: 'edge' | 'center' | 'grid';
  widgetId?: string;
  direction: 'horizontal' | 'vertical' | 'both';
}

export interface SnapResult {
  snapped: boolean;
  snapPoints: SnapPoint[];
  adjustedBounds: WidgetBounds;
}

export interface GridSettings {
  enabled: boolean;
  size: number;
  snapThreshold: number;
  showGrid: boolean;
  snapToWidgets: boolean;
  snapToGrid: boolean;
}

export interface WidgetConfig {
  refreshInterval?: number; // в секундах
  showHeader?: boolean;
  customTitle?: string;
  color?: string;
  chartType?: "line" | "bar" | "pie" | "doughnut";
  dataRange?: "today" | "week" | "month" | "year";
  [key: string]: any;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: Widget[];
  isDefault: boolean;
  userId?: string;
}

export interface ActivityItem {
  id: string;
  type:
    | "object_created"
    | "object_updated"
    | "object_deleted"
    | "user_created"
    | "installation_scheduled"
    | "installation_started"
    | "installation_completed"
    | "installation_cancelled"
    | "invoice_generated"
    | "payment_received"
    | "contract_created"
    | "contract_updated"
    | "subscription_created"
    | "subscription_updated"
    | "subscription_cancelled";
  title: string;
  description: string;
  timestamp: string;
  userId: string;
  userName: string;
  metadata?: Record<string, any>;
}

export interface NotificationItem {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

export interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  route: string;
  permission?: string;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
}
