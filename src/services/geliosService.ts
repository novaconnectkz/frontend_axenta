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

  // Допустимые создатели (узлы дерева + корень) — тот же allow-list,
  // что форсит backend create-handler (защита от дурака).
  async listCreators(connId: number): Promise<{ gelios_id: number; login: string }[]> {
    const r = await apiClient.get(`${BASE}/${connId}/creators`);
    return r.data?.data || [];
  },

  async createUser(
    connId: number,
    payload: {
      login: string;
      password: string;
      creator_id: number;
      is_admin: boolean;
      email?: string;
      phone?: string;
      legal_name?: string;
    },
  ): Promise<{ gelios_user_id: number }> {
    const r = await apiClient.post(`${BASE}/${connId}/users`, payload);
    return r.data?.data;
  },

  // geliosUserId = ExternalID юзера (gelios_user_id). HARD-delete в GELIOS.
  async deleteUser(connId: number, geliosUserId: string): Promise<void> {
    await apiClient.delete(`${BASE}/${connId}/users/${encodeURIComponent(geliosUserId)}`);
  },
};
