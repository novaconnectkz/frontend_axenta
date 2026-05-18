// GELIOS GPS API client (обёртка над /api/auth/gelios/*)
// База: ACRM-Brain/wiki/sources/gelios-api/billing.md
import { apiClient } from "@/services/api";

export interface GeliosConnection {
  id: number;
  company_id: number;
  name: string;
  base_url: string;
  username: string;
  is_active: boolean;
  last_sync_at: string | null;
  last_login_at: string | null;
  units_count: number;
  sync_interval: number;
  auto_sync_enabled: boolean;
  sync_units: boolean;
  last_error_at: string | null;
  error_message: string;
  error_count: number;
  created_at: string;
  updated_at: string;
}

export interface GeliosConnectionInput {
  name: string;
  username: string;
  password: string;
  sync_interval?: number;
  auto_sync_enabled?: boolean;
  sync_units?: boolean;
}

export interface GeliosConnectionUpdate {
  name?: string;
  username?: string;
  password?: string;
  sync_interval?: number;
  auto_sync_enabled?: boolean;
  sync_units?: boolean;
  is_active?: boolean;
}

const BASE = "/auth/gelios/connections";

export const geliosService = {
  async list(): Promise<GeliosConnection[]> {
    const r = await apiClient.get(BASE);
    return r.data?.data || [];
  },

  async create(payload: GeliosConnectionInput): Promise<GeliosConnection> {
    const r = await apiClient.post(BASE, payload);
    return r.data?.data;
  },

  async update(id: number, payload: GeliosConnectionUpdate): Promise<GeliosConnection> {
    const r = await apiClient.put(`${BASE}/${id}`, payload);
    return r.data?.data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`);
  },

  async test(id: number): Promise<{ username: string; units_total: number }> {
    const r = await apiClient.post(`${BASE}/${id}/test`);
    return r.data?.data;
  },

  async sync(id: number): Promise<{ upserted: number }> {
    const r = await apiClient.post(`${BASE}/${id}/sync`);
    return r.data?.data;
  },
};
