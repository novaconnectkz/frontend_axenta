// SKIF.PRO API client (обёртка над /api/auth/skif/*)
import { apiClient } from "@/services/api";

export interface SkifConnection {
  id: number;
  company_id: number;
  name: string;
  base_url: string;
  login: string;
  is_active: boolean;
  last_sync_at: string | null;
  last_login_at: string | null;
  units_count: number;
  sync_interval: number;
  auto_sync_enabled: boolean;
  sync_units: boolean;
  sync_terminals: boolean;
  last_error_at: string | null;
  error_message: string;
  error_count: number;
  created_at: string;
  updated_at: string;
}

export interface SkifConnectionInput {
  name: string;
  base_url?: string;
  login: string;
  password: string;
  sync_interval?: number;
  auto_sync_enabled?: boolean;
  sync_units?: boolean;
  sync_terminals?: boolean;
}

export interface SkifConnectionUpdate {
  name?: string;
  base_url?: string;
  login?: string;
  password?: string;
  sync_interval?: number;
  auto_sync_enabled?: boolean;
  sync_units?: boolean;
  sync_terminals?: boolean;
  is_active?: boolean;
}

export interface SkifUnit {
  id: number;
  connection_id: number;
  skif_unit_id: number;
  name: string;
  imei: string;
  phone: string;
  model: string;
  is_active: boolean;
  company_id: number;
  skif_company: string;
  last_collected_at: string;
}

const BASE = "/auth/skif/connections";

export const skifService = {
  async list(): Promise<SkifConnection[]> {
    const r = await apiClient.get(BASE);
    return r.data?.data || [];
  },

  async create(payload: SkifConnectionInput): Promise<SkifConnection> {
    const r = await apiClient.post(BASE, payload);
    return r.data?.data;
  },

  async update(id: number, payload: SkifConnectionUpdate): Promise<SkifConnection> {
    const r = await apiClient.put(`${BASE}/${id}`, payload);
    return r.data?.data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`);
  },

  async test(id: number): Promise<{ me: Record<string, unknown> }> {
    const r = await apiClient.post(`${BASE}/${id}/test`);
    return r.data?.data;
  },

  async sync(id: number): Promise<{ upserted: number }> {
    const r = await apiClient.post(`${BASE}/${id}/sync`);
    return r.data?.data;
  },

  async units(id: number): Promise<SkifUnit[]> {
    const r = await apiClient.get(`${BASE}/${id}/units`);
    return r.data?.data || [];
  },
};
