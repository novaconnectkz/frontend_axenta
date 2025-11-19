import { config } from "@/config/env";
import type {
  InvoiceNumerator,
  InvoiceNumeratorForm,
  InvoiceNumeratorsResponse,
} from "@/types/invoices";
import axios, { type AxiosResponse } from "axios";

class InvoiceNumeratorsService {
  private apiClient = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 30000,
  });
  private readonly storageKey = "axenta_mock_invoice_numerators";

  constructor() {
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem("axenta_token");
      const company = localStorage.getItem("axenta_company");
      if (token) config.headers["authorization"] = `Token ${token}`;
      if (company) {
        try {
          const companyData = JSON.parse(company);
          const companyId = companyData.id;
          if (companyId !== undefined && companyId !== null) {
            config.headers["X-Tenant-ID"] = String(companyId);
          }
        } catch {}
      }
      return config;
    });
  }

  // --------- MOCK HELPERS (fallback при отсутствии бэкенда) ----------
  private loadMock(companyId: number): InvoiceNumerator[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const all: Record<string, InvoiceNumerator[]> = raw ? JSON.parse(raw) : {};
      return (all[String(companyId)] || []).map((x) => ({ ...x }));
    } catch {
      return [];
    }
  }

  private saveMock(companyId: number, items: InvoiceNumerator[]): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const all: Record<string, InvoiceNumerator[]> = raw ? JSON.parse(raw) : {};
      all[String(companyId)] = items;
      localStorage.setItem(this.storageKey, JSON.stringify(all));
    } catch {}
  }

  private genId(): number {
    return Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
  }
  // -------------------------------------------------------------------

  async getInvoiceNumerators(companyId: number): Promise<InvoiceNumerator[]> {
    try {
      const response: AxiosResponse<InvoiceNumeratorsResponse> =
        await this.apiClient.get("/auth/billing/invoice-numerators", {
          params: { company_id: companyId },
        });
      return response.data.data || [];
    } catch {
      // Fallback на mock
      return this.loadMock(companyId);
    }
  }

  async getInvoiceNumerator(id: number): Promise<InvoiceNumerator> {
    try {
      const response = await this.apiClient.get(`/auth/billing/invoice-numerators/${id}`);
      return response.data.data;
    } catch {
      // Поиск в моках по всем компаниям
      const raw = localStorage.getItem(this.storageKey);
      const all: Record<string, InvoiceNumerator[]> = raw ? JSON.parse(raw) : {};
      for (const k of Object.keys(all)) {
        const found = (all[k] || []).find((x) => x.id === id);
        if (found) return found;
      }
      throw new Error("Mock: нумератор не найден");
    }
  }

  async createInvoiceNumerator(
    data: InvoiceNumeratorForm
  ): Promise<InvoiceNumerator> {
    try {
      const response = await this.apiClient.post(
        "/auth/billing/invoice-numerators",
        data
      );
      return response.data.data;
    } catch {
      // Fallback: создаем в LocalStorage
      const companyId = Number((data as any).company_id) || 0;
      const list = this.loadMock(companyId);
      const now = new Date().toISOString();
      const item: InvoiceNumerator = {
        id: this.genId(),
        created_at: now,
        updated_at: now,
        deleted_at: undefined,
        company_id: companyId,
        name: data.name,
        prefix: data.prefix,
        template: data.template,
        description: data.description,
        counter_value: 1,
        is_default: !!data.is_default,
        is_active: !!data.is_active,
        auto_reset: !!data.auto_reset,
        reset_period: data.reset_period,
        notes: data.notes,
      };
      list.unshift(item);
      this.saveMock(companyId, list);
      return item;
    }
  }

  async updateInvoiceNumerator(
    id: number,
    data: Partial<InvoiceNumeratorForm>
  ): Promise<InvoiceNumerator> {
    try {
      const response = await this.apiClient.put(
        `/auth/billing/invoice-numerators/${id}`,
        data
      );
      return response.data.data;
    } catch {
      // Fallback: обновление в LocalStorage
      const companyId = Number((data as any).company_id) || 0;
      const raw = localStorage.getItem(this.storageKey);
      const all: Record<string, InvoiceNumerator[]> = raw ? JSON.parse(raw) : {};
      const targetKey =
        companyId && all[String(companyId)] ? String(companyId) : Object.keys(all).find((k) => (all[k] || []).some((x) => x.id === id));
      if (!targetKey) throw new Error("Mock: компания не найдена для обновления");
      const list = all[targetKey] || [];
      const idx = list.findIndex((x) => x.id === id);
      if (idx === -1) throw new Error("Mock: нумератор не найден");
      list[idx] = {
        ...list[idx],
        ...data,
        updated_at: new Date().toISOString(),
      } as any;
      all[targetKey] = list;
      localStorage.setItem(this.storageKey, JSON.stringify(all));
      return list[idx];
    }
  }

  async deleteInvoiceNumerator(id: number): Promise<void> {
    try {
      await this.apiClient.delete(`/auth/billing/invoice-numerators/${id}`);
    } catch {
      // Fallback: удаление из LocalStorage
      const raw = localStorage.getItem(this.storageKey);
      const all: Record<string, InvoiceNumerator[]> = raw ? JSON.parse(raw) : {};
      for (const k of Object.keys(all)) {
        const before = all[k] || [];
        const after = before.filter((x) => x.id !== id);
        all[k] = after;
      }
      localStorage.setItem(this.storageKey, JSON.stringify(all));
    }
  }

  async generateInvoiceNumber(
    numeratorId: number,
    params?: { company_id?: number; invoice_id?: number }
  ): Promise<{ number: string; counter: number }> {
    try {
      const response = await this.apiClient.post(
        `/auth/billing/invoice-numerators/${numeratorId}/generate`,
        params || {}
      );
      return response.data.data;
    } catch {
      // Fallback: простая генерация по шаблону в LocalStorage
      const companyId = Number(params?.company_id || 0);
      const list = companyId ? this.loadMock(companyId) : (() => {
        const raw = localStorage.getItem(this.storageKey);
        const all: Record<string, InvoiceNumerator[]> = raw ? JSON.parse(raw) : {};
        return Object.values(all).flat();
      })();
      const item = (list || []).find((x) => x.id === numeratorId);
      if (!item) throw new Error("Mock: нумератор не найден");
      const date = new Date();
      const year = String(date.getFullYear());
      const yearShort = year.slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const seq = String(item.counter_value || 1).padStart(3, "0");
      const random2 = String(Math.floor(Math.random() * 100)).padStart(2, "0");

      const withPrefix = (item.prefix || "")
        .replace("{YEAR}", year)
        .replace("{YEAR_SHORT}", yearShort)
        .replace("{MONTH}", month)
        .replace("{DAY}", day)
        .replace("{SEQ}", seq)
        .replace("{RANDOM}", random2);

      const number = (item.template || "{PREFIX}{SEQ}")
        .replace("{PREFIX}", withPrefix)
        .replace("{SEQ}", seq)
        .replace("{YEAR}", year)
        .replace("{YEAR_SHORT}", yearShort)
        .replace("{MONTH}", month)
        .replace("{DAY}", day)
        .replace("{RANDOM}", random2);

      // Инкрементируем счетчик и сохраняем
      item.counter_value = (item.counter_value || 1) + 1;
      item.updated_at = new Date().toISOString();
      if (companyId) {
        const updated = list.map((x) => (x.id === item.id ? item : x));
        this.saveMock(companyId, updated);
      } else {
        const raw = localStorage.getItem(this.storageKey);
        const all: Record<string, InvoiceNumerator[]> = raw ? JSON.parse(raw) : {};
        for (const k of Object.keys(all)) {
          all[k] = (all[k] || []).map((x) => (x.id === item.id ? item : x));
        }
        localStorage.setItem(this.storageKey, JSON.stringify(all));
      }

      return { number, counter: item.counter_value };
    }
  }
}

export const invoiceNumeratorsService = new InvoiceNumeratorsService();
export default invoiceNumeratorsService;


