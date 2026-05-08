import { apiClient } from './api';

export interface SkifConnectionListItem {
  id: number;
  name: string;
  base_url: string;
  is_active: boolean;
}

export interface CreateSkifCompanyPayload {
  company_name: string;
  timezone: string;
  dateformat?: string;
  timeformat?: string;
  with_user?: boolean;
  user_email?: string;
  user_password?: string;
  user_name?: string;
}

export interface CreateSkifCompanyResult {
  ok: boolean;
  data?: any;
  error?: string;
}

export const skifAccountsService = {
  async getConnections(): Promise<SkifConnectionListItem[]> {
    const r = await apiClient.get('/auth/skif/connections');
    return r.data?.data || [];
  },

  async createCompany(connectionId: number, payload: CreateSkifCompanyPayload): Promise<CreateSkifCompanyResult> {
    try {
      const r = await apiClient.post(`/auth/skif/connections/${connectionId}/companies`, payload);
      return { ok: true, data: r.data?.data };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error || e?.message || 'Ошибка создания SKIF-компании' };
    }
  },

  async scheduleDelete(connectionId: number, skifCompanyId: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await apiClient.delete(`/auth/skif/connections/${connectionId}/companies/${skifCompanyId}`);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error || e?.message || 'Ошибка планирования удаления' };
    }
  },

  async cancelDelete(connectionId: number, skifCompanyId: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await apiClient.post(`/auth/skif/connections/${connectionId}/companies/${skifCompanyId}/cancel-delete`);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error || e?.message || 'Ошибка отмены удаления' };
    }
  },
};
