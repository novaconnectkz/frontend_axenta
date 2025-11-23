// Типы для производительности и безопасности
export interface CacheMetrics {
  hit_count: number;
  miss_count: number;
  hit_rate: number;
  key_count: number;
  memory_usage: string;
  status: string;
}

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

export interface RateLimitInfo {
  key: string;
  current: number;
  limit: number;
  remaining: number;
  reset_time: number;
}

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

export interface SecurityAlert {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  ip_address?: string;
  user_id?: number;
  count: number;
  detected_at: string;
}

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

class PerformanceService {
  private baseURL = "http://localhost:8080/api/performance";

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token =
      localStorage.getItem("local_access_token") ||
      localStorage.getItem("axenta_token");

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  // Кэширование
  async getCacheMetrics(): Promise<CacheMetrics> {
    return this.request<CacheMetrics>("/cache/metrics");
  }

  async warmupCache(): Promise<void> {
    await this.request("/cache/warmup", { method: "POST" });
  }

  async clearCache(): Promise<void> {
    await this.request("/cache/clear", { method: "DELETE" });
  }

  async getCacheStats(): Promise<any> {
    return this.request("/cache/stats");
  }

  // Индексы БД
  async getDatabaseIndexes(
    table?: string
  ): Promise<Record<string, DatabaseIndex[]> | DatabaseIndex[]> {
    const params = table ? `?table=${table}` : "";
    return this.request(`/database/indexes${params}`);
  }

  async createIndexes(): Promise<void> {
    await this.request("/database/indexes/create", { method: "POST" });
  }

  async getIndexUsage(): Promise<IndexUsage[]> {
    return this.request<IndexUsage[]>("/database/indexes/usage");
  }

  async optimizeDatabase(): Promise<void> {
    await this.request("/database/optimize", { method: "POST" });
  }

  async getDatabaseStats(): Promise<TableStats[]> {
    return this.request<TableStats[]>("/database/stats");
  }

  // Rate Limiting
  async getRateLimitInfo(): Promise<RateLimitInfo> {
    return this.request<RateLimitInfo>("/rate-limit/info");
  }

  async clearRateLimit(): Promise<void> {
    await this.request("/rate-limit/clear", { method: "DELETE" });
  }

  // Аудит логи
  async getAuditLogs(filters?: AuditFilters): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (filters?.user_id) params.append("user_id", filters.user_id.toString());
    if (filters?.action) params.append("action", filters.action);
    if (filters?.resource) params.append("resource", filters.resource);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());

    const queryString = params.toString();
    return this.request<AuditLog[]>(
      `/audit/logs${queryString ? `?${queryString}` : ""}`
    );
  }

  async getAuditStats(period: string = "week"): Promise<AuditStats> {
    return this.request<AuditStats>(`/audit/stats?period=${period}`);
  }

  async getSecurityAlerts(hours: number = 24): Promise<SecurityAlert[]> {
    return this.request<SecurityAlert[]>(`/audit/security-alerts?hours=${hours}`);
  }

  async exportAuditLogs(filters?: AuditFilters): Promise<Blob> {
    const token =
      localStorage.getItem("local_access_token") ||
      localStorage.getItem("axenta_token");

    const response = await fetch(`${this.baseURL}/audit/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(filters || {}),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  async cleanupAuditLogs(retentionDays: number = 90): Promise<void> {
    await this.request(`/audit/cleanup?retention_days=${retentionDays}`, {
      method: "DELETE",
    });
  }

  // Системная информация
  async getSystemInfo(): Promise<SystemInfo> {
    return this.request<SystemInfo>("/system/info");
  }

  async getSystemHealth(): Promise<SystemHealth> {
    return this.request<SystemHealth>("/system/health");
  }

  // Демо данные
  getMockCacheMetrics(): CacheMetrics {
    return {
      hit_count: 1250,
      miss_count: 180,
      hit_rate: 87.4,
      key_count: 2840,
      memory_usage: "15.2MB",
      status: "enabled",
    };
  }

  getMockDatabaseIndexes(): Record<string, DatabaseIndex[]> {
    return {
      objects: [
        {
          name: "idx_objects_tenant_status",
          table_name: "objects",
          definition:
            "CREATE INDEX idx_objects_tenant_status ON objects USING btree (tenant_id, status)",
        },
        {
          name: "idx_objects_imei",
          table_name: "objects",
          definition:
            "CREATE INDEX idx_objects_imei ON objects USING btree (imei)",
        },
        {
          name: "idx_objects_fulltext",
          table_name: "objects",
          definition:
            "CREATE INDEX idx_objects_fulltext ON objects USING gin (to_tsvector(name, description))",
        },
      ],
      users: [
        {
          name: "idx_users_tenant_active",
          table_name: "users",
          definition:
            "CREATE INDEX idx_users_tenant_active ON users USING btree (tenant_id, is_active)",
        },
        {
          name: "idx_users_email",
          table_name: "users",
          definition:
            "CREATE UNIQUE INDEX idx_users_email ON users USING btree (email)",
        },
      ],
    };
  }

  getMockIndexUsage(): IndexUsage[] {
    return [
      {
        schema: "public",
        table: "objects",
        index: "idx_objects_tenant_status",
        tup_read: 45230,
        tup_fetch: 42180,
        scan_count: 1250,
      },
      {
        schema: "public",
        table: "users",
        index: "idx_users_email",
        tup_read: 18940,
        tup_fetch: 18940,
        scan_count: 890,
      },
      {
        schema: "public",
        table: "objects",
        index: "idx_objects_imei",
        tup_read: 12450,
        tup_fetch: 12450,
        scan_count: 340,
      },
    ];
  }

  getMockTableStats(): TableStats[] {
    return [
      {
        schema: "public",
        table: "objects",
        inserts: 1250,
        updates: 3480,
        deletes: 45,
        live_tuples: 1205,
        dead_tuples: 23,
        last_vacuum: "2024-01-15 10:30:00",
        last_analyze: "2024-01-15 10:32:00",
      },
      {
        schema: "public",
        table: "users",
        inserts: 180,
        updates: 890,
        deletes: 5,
        live_tuples: 175,
        dead_tuples: 2,
        last_vacuum: "2024-01-15 10:30:00",
        last_analyze: "2024-01-15 10:32:00",
      },
      {
        schema: "public",
        table: "installations",
        inserts: 450,
        updates: 1230,
        deletes: 12,
        live_tuples: 438,
        dead_tuples: 8,
        last_vacuum: "2024-01-15 10:30:00",
        last_analyze: "2024-01-15 10:32:00",
      },
    ];
  }

  getMockAuditLogs(): AuditLog[] {
    return [
      {
        id: 1,
        tenant_id: 1,
        user_id: 1,
        action: "user.login",
        resource: "user",
        resource_id: 1,
        ip_address: "192.168.1.100",
        user_agent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        details: '{"login_method": "password"}',
        old_values: "",
        new_values: "",
        success: true,
        error_message: "",
        created_at: "2024-01-15T10:30:00Z",
      },
      {
        id: 2,
        tenant_id: 1,
        user_id: 1,
        action: "object.create",
        resource: "object",
        resource_id: 45,
        ip_address: "192.168.1.100",
        user_agent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        details: '{"object_type": "gps_tracker"}',
        old_values: "",
        new_values: '{"name": "Трекер-001", "imei": "123456789012345"}',
        success: true,
        error_message: "",
        created_at: "2024-01-15T10:25:00Z",
      },
      {
        id: 3,
        tenant_id: 1,
        user_id: 2,
        action: "user.login",
        resource: "user",
        ip_address: "192.168.1.200",
        user_agent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        details: '{"login_method": "password"}',
        old_values: "",
        new_values: "",
        success: false,
        error_message: "Invalid password",
        created_at: "2024-01-15T10:20:00Z",
      },
    ];
  }

  getMockAuditStats(): AuditStats {
    return {
      period: "week",
      start_date: "2024-01-08T00:00:00Z",
      end_date: "2024-01-15T00:00:00Z",
      total_logs: 1250,
      successful_logs: 1180,
      failed_logs: 70,
      top_actions: {
        "user.login": 340,
        "object.update": 280,
        "object.create": 180,
        "user.update": 120,
        "installation.create": 95,
      },
      top_users: {
        1: 450,
        2: 320,
        3: 180,
        4: 150,
        5: 80,
      },
      hourly_activity: {
        8: 45,
        9: 120,
        10: 180,
        11: 160,
        12: 90,
        13: 70,
        14: 140,
        15: 160,
        16: 150,
        17: 100,
        18: 45,
      },
    };
  }

  getMockSecurityAlerts(): SecurityAlert[] {
    return [
      {
        type: "failed_logins",
        severity: "high",
        description:
          "Multiple failed login attempts from IP 192.168.1.200 (8 attempts)",
        ip_address: "192.168.1.200",
        count: 8,
        detected_at: "2024-01-15T10:30:00Z",
      },
      {
        type: "suspicious_activity",
        severity: "medium",
        description: "Unusual activity from user ID 3 (150 actions)",
        user_id: 3,
        count: 150,
        detected_at: "2024-01-15T09:45:00Z",
      },
      {
        type: "failed_logins",
        severity: "medium",
        description:
          "Multiple failed login attempts from IP 10.0.0.50 (5 attempts)",
        ip_address: "10.0.0.50",
        count: 5,
        detected_at: "2024-01-15T08:15:00Z",
      },
    ];
  }

  getMockSystemInfo(): SystemInfo {
    return {
      database: {
        status: "connected",
        driver: "postgresql",
      },
      cache: {
        status: "connected",
        type: "redis",
      },
      performance: {
        indexes_enabled: true,
        rate_limiting_enabled: true,
        audit_logging_enabled: true,
      },
      timestamp: new Date().toISOString(),
    };
  }

  getMockSystemHealth(): SystemHealth {
    return {
      status: "healthy",
      checks: {
        database: {
          status: true,
          name: "PostgreSQL Database",
        },
        cache: {
          status: true,
          name: "Redis Cache",
        },
      },
    };
  }

  getMockRateLimitInfo(): RateLimitInfo {
    return {
      key: "rate_limit:user:1",
      current: 15,
      limit: 100,
      remaining: 85,
      reset_time: Math.floor(Date.now() / 1000) + 3600,
    };
  }
}

export const performanceService = new PerformanceService();
