// Dashboard KPI / Alerts API client — обёртка над /api/auth/dashboard/{kpi,alerts}.
// Backend handlers: backend_axenta/api/dashboard_kpi.go и dashboard_alerts.go.
import { apiClient } from "./api";

// === Типы (mirror backend) ===

export interface DashboardAlert {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "billing" | "warehouse" | "installations" | "notifications";
  title: string;
  description: string;
  count: number;
  action_url: string;
  action_label: string;
  created_at: string;
}

export interface KPIMetric {
  id: "active_objects" | "monthly_revenue" | "today_installations" | "alert" | string;
  title: string;
  value: string;
  raw_value: number;
  delta: string;
  delta_direction: "up" | "down" | "flat";
  delta_value: number;
  delta_percentage: number;
  action_url: string;
}

export interface KPIResponse {
  metrics: KPIMetric[];
  generated_at: string;
}

const BASE = "/auth/dashboard";

export interface SearchResultItem {
  id: string;
  type: "object" | "client" | "contract" | "invoice" | string;
  title: string;
  subtitle: string;
  url: string;
}

export interface SearchResponse {
  objects: SearchResultItem[];
  clients: SearchResultItem[];
  query: string;
}

export interface SourceObjectStats {
  total: number;
  active: number;
  inactive: number;
  deleted: number;
}

export interface SourceAccountStats {
  total: number;
  active: number;
  blocked: number;
  clients: number;
  partners: number;
}

export interface SourceStats {
  key: "axenta" | "wh" | "wl" | "all" | string;
  label: string;
  objects: SourceObjectStats;
  accounts: SourceAccountStats;
}

export interface SourcesStatsResponse {
  sources: SourceStats[];
  total: SourceStats;
}

export interface CurrencyRevenue {
  currency: string;
  raw: number;
  text: string;
}

export interface ChartPoint {
  month: string;
  month_label: string;
  objects: number;
  axenta: number;
  wh: number;
  wl: number;
  revenues: CurrencyRevenue[];
}

export interface TopContractRow {
  id: number;
  client_name: string;
  contract_number: string;
  objects: number;
  active: number;
  overdue: number;
  mrr: number;
}

export interface ChartResponse {
  points: ChartPoint[];
  currencies: string[];
  generated_at: string;
}

const EMPTY_SOURCE = (key: string, label: string): SourceStats => ({
  key,
  label,
  objects: { total: 0, active: 0, inactive: 0, deleted: 0 },
  accounts: { total: 0, active: 0, blocked: 0, clients: 0, partners: 0 },
});

export const dashboardKpiService = {
  async getAlerts(): Promise<DashboardAlert[]> {
    const res = await apiClient.get(`${BASE}/alerts`);
    return res.data?.data || [];
  },

  async getKPI(): Promise<KPIResponse> {
    const res = await apiClient.get(`${BASE}/kpi`);
    return res.data?.data || { metrics: [], generated_at: new Date().toISOString() };
  },

  async search(query: string, limit = 10): Promise<SearchResponse> {
    const res = await apiClient.get(`/auth/search`, { params: { q: query, limit } });
    return res.data?.data || { objects: [], clients: [], query };
  },

  async getChart(period: "7d" | "1m" | "3m" | "6m" | "1y" = "7d"): Promise<ChartResponse> {
    const res = await apiClient.get(`${BASE}/chart`, { params: { period } });
    return res.data?.data || { points: [], currencies: [], generated_at: new Date().toISOString() };
  },

  async getTopContracts(period: "month" | "quarter" | "year" = "month", limit = 10): Promise<TopContractRow[]> {
    const res = await apiClient.get(`${BASE}/top-contracts`, { params: { period, limit } });
    return res.data?.data || [];
  },

  async getSourcesStats(): Promise<SourcesStatsResponse> {
    const res = await apiClient.get(`${BASE}/sources-stats`);
    const data = res.data?.data;
    if (!data) {
      return {
        sources: [
          EMPTY_SOURCE("axenta", "Axenta"),
          EMPTY_SOURCE("wh", "Wialon Hosting"),
          EMPTY_SOURCE("wl", "Wialon Local"),
        ],
        total: EMPTY_SOURCE("all", "Все"),
      };
    }
    return data;
  },
};
