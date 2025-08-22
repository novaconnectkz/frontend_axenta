// Типы для системы производительности и безопасности

// Кэширование
export interface CacheMetrics {
  hit_count: number;
  miss_count: number;
  hit_rate: number;
  key_count: number;
  memory_usage: string;
  status: "enabled" | "disabled" | "error";
}

export interface CacheStats {
  status: string;
  key_count: number;
  memory: string;
}

// База данных
export interface DatabaseIndex {
  name: string;
  table_name: string;
  definition: string;
}

export interface IndexUsage {
  schema: string;
  table: string;
  index: string;
  tup_read: number;
  tup_fetch: number;
  scan_count: number;
}

export interface TableStats {
  schema: string;
  table: string;
  inserts: number;
  updates: number;
  deletes: number;
  live_tuples: number;
  dead_tuples: number;
  last_vacuum: string | null;
  last_analyze: string | null;
}

// Rate Limiting
export interface RateLimitInfo {
  key: string;
  current: number;
  limit: number;
  remaining: number;
  reset_time: number;
}

// Аудит
export interface AuditLog {
  id: number;
  tenant_id: number;
  user_id?: number;
  action: string;
  resource: string;
  resource_id?: number;
  ip_address: string;
  user_agent: string;
  details: string;
  old_values: string;
  new_values: string;
  success: boolean;
  error_message: string;
  created_at: string;
}

export interface AuditStats {
  period: string;
  start_date: string;
  end_date: string;
  total_logs: number;
  successful_logs: number;
  failed_logs: number;
  top_actions: Record<string, number>;
  top_users: Record<number, number>;
  hourly_activity: Record<number, number>;
}

export interface AuditFilters {
  user_id?: number;
  action?: string;
  resource?: string;
  start_date?: string;
  end_date?: string;
  ip_address?: string;
  limit?: number;
  offset?: number;
}

// Безопасность
export interface SecurityAlert {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  ip_address?: string;
  user_id?: number;
  count: number;
  detected_at: string;
}

// Система
export interface SystemInfo {
  database: {
    status: string;
    driver: string;
  };
  cache: {
    status: string;
    type: string;
  };
  performance: {
    indexes_enabled: boolean;
    rate_limiting_enabled: boolean;
    audit_logging_enabled: boolean;
  };
  timestamp: string;
}

export interface SystemHealth {
  status: "healthy" | "unhealthy";
  checks: {
    database: {
      status: boolean;
      name: string;
    };
    cache: {
      status: boolean;
      name: string;
    };
  };
}

// Компоненты интерфейса
export interface PerformanceTab {
  id: string;
  name: string;
  icon: string;
  component: string;
}

export interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  icon: string;
  color: string;
  description?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

// Фильтры и настройки
export interface PerformanceFilters {
  period: "hour" | "day" | "week" | "month";
  table?: string;
  action?: string;
  severity?: SecurityAlert["severity"];
}

export interface PerformanceSettings {
  cache_enabled: boolean;
  rate_limiting_enabled: boolean;
  audit_logging_enabled: boolean;
  retention_days: number;
  auto_optimization: boolean;
  alert_notifications: boolean;
}

// Экспорт данных
export interface ExportOptions {
  format: "json" | "csv" | "xlsx";
  filters?: AuditFilters;
  include_details: boolean;
}

// Мониторинг в реальном времени
export interface RealTimeMetrics {
  timestamp: string;
  cache_hit_rate: number;
  active_connections: number;
  queries_per_second: number;
  response_time: number;
  error_rate: number;
}

// Оптимизация
export interface OptimizationRecommendation {
  id: string;
  type: "index" | "cache" | "query" | "security";
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  impact: string;
  effort: string;
  action?: () => void;
}

// Бенчмарки
export interface BenchmarkResult {
  test_name: string;
  duration: number;
  operations_per_second: number;
  memory_usage: number;
  cpu_usage: number;
  status: "passed" | "failed" | "warning";
}

export interface LoadTestConfig {
  concurrent_users: number;
  duration_seconds: number;
  ramp_up_seconds: number;
  endpoints: string[];
}

export interface LoadTestResult {
  config: LoadTestConfig;
  start_time: string;
  end_time: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  max_response_time: number;
  requests_per_second: number;
  error_rate: number;
  results_by_endpoint: Record<
    string,
    {
      requests: number;
      avg_response_time: number;
      error_rate: number;
    }
  >;
}

// События и уведомления
export interface PerformanceEvent {
  id: string;
  type: "optimization" | "alert" | "maintenance" | "backup";
  title: string;
  message: string;
  severity: "info" | "warning" | "error" | "success";
  timestamp: string;
  acknowledged: boolean;
  details?: any;
}

// Конфигурация алертов
export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: "greater_than" | "less_than" | "equals";
  threshold: number;
  enabled: boolean;
  notification_channels: ("email" | "telegram" | "webhook")[];
}

// Дашборд производительности
export interface PerformanceDashboard {
  widgets: PerformanceWidget[];
  layout: {
    cols: number;
    rows: number;
  };
  refresh_interval: number;
}

export interface PerformanceWidget {
  id: string;
  type: "metric" | "chart" | "table" | "alert";
  title: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config: any;
}
