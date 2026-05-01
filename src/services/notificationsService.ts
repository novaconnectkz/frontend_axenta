// Notifications API client — обёртка над /api/auth/notifications/*
// Endpoints соответствуют backend api/notifications.go (admin API).
import { apiClient } from "./api";

// === Типы ===

export interface NotificationTemplate {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  type: string; // installation_created, billing_alert, ...
  channel: "email" | "telegram" | "max";
  subject: string;
  template: string;
  description: string;
  is_active: boolean;
  language: string;
  priority: "low" | "normal" | "high" | "urgent";
  retry_attempts: number;
  delay_seconds: number;
  company_id: number;
}

export interface NotificationLog {
  id: number;
  created_at: string;
  type: string;
  channel: string;
  recipient: string;
  subject: string;
  message: string;
  status: "pending" | "sent" | "failed" | "retry" | "failed_final";
  error_message: string;
  sent_at?: string;
  related_id?: number;
  related_type: string;
  attempt_count: number;
  next_retry_at?: string;
  external_id: string;
  company_id: number;
  template_id?: number;
}

export interface NotificationStatsRow {
  channel: string;
  status: string;
  count: number;
}

export interface NotificationStats {
  by_channel_status: NotificationStatsRow[];
}

export interface TestSendPayload {
  type: string;
  channel: "email" | "telegram" | "max";
  recipient: string;
  data?: Record<string, unknown>;
}

// === API methods ===

const BASE = "/auth/notifications";

export const notificationsService = {
  // ----- Templates -----

  async listTemplates(filters: { type?: string; channel?: string } = {}): Promise<NotificationTemplate[]> {
    const params: Record<string, string> = {};
    if (filters.type) params.type = filters.type;
    if (filters.channel) params.channel = filters.channel;

    const res = await apiClient.get(`${BASE}/templates`, { params });
    return res.data?.data || [];
  },

  async getTemplate(id: number): Promise<NotificationTemplate> {
    const res = await apiClient.get(`${BASE}/templates/${id}`);
    return res.data?.data;
  },

  async createTemplate(payload: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const res = await apiClient.post(`${BASE}/templates`, payload);
    return res.data?.data;
  },

  async updateTemplate(id: number, payload: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const res = await apiClient.put(`${BASE}/templates/${id}`, payload);
    return res.data?.data;
  },

  async deleteTemplate(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/templates/${id}`);
  },

  async seedDefaults(): Promise<void> {
    await apiClient.post(`${BASE}/templates/seed`);
  },

  // ----- Test send -----

  async testSend(payload: TestSendPayload): Promise<{ message: string }> {
    const res = await apiClient.post(`${BASE}/test`, payload);
    return res.data;
  },

  // ----- Logs -----

  async getLogs(params: {
    limit?: number;
    offset?: number;
    type?: string;
    channel?: string;
    status?: string;
    related_type?: string;
  } = {}): Promise<{ logs: NotificationLog[]; total: number; limit: number; offset: number }> {
    const res = await apiClient.get(`${BASE}/logs`, { params });
    return {
      logs: res.data?.data || [],
      total: res.data?.total || 0,
      limit: res.data?.limit || 50,
      offset: res.data?.offset || 0,
    };
  },

  // ----- Stats -----

  async getStats(): Promise<NotificationStats> {
    const res = await apiClient.get(`${BASE}/stats`);
    return res.data?.data || { by_channel_status: [] };
  },
};
