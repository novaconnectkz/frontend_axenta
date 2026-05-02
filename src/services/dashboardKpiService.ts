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

export interface TodayInstallationItem {
  id: number;
  scheduled_at: string;
  time_label: string;
  status: "planned" | "in_progress" | "completed" | "cancelled" | string;
  type: string;
  address: string;
  installer_id: number;
  installer_name: string;
  object_id: number;
  object_name: string;
}

export interface RecentInvoiceItem {
  id: number;
  number: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled" | string;
  total_amount: string; // Decimal serialised
  paid_amount: string;
  due_date: string;
  created_at: string;
  client_name: string;
  is_overdue: boolean;
}

const BASE = "/auth/dashboard";

export const dashboardKpiService = {
  async getAlerts(): Promise<DashboardAlert[]> {
    const res = await apiClient.get(`${BASE}/alerts`);
    return res.data?.data || [];
  },

  async getKPI(): Promise<KPIResponse> {
    const res = await apiClient.get(`${BASE}/kpi`);
    return res.data?.data || { metrics: [], generated_at: new Date().toISOString() };
  },

  async getTodayInstallations(): Promise<TodayInstallationItem[]> {
    const res = await apiClient.get(`${BASE}/today-installations`);
    return res.data?.data || [];
  },

  async getRecentInvoices(): Promise<RecentInvoiceItem[]> {
    const res = await apiClient.get(`${BASE}/recent-invoices`);
    return res.data?.data || [];
  },
};
