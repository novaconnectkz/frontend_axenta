/**
 * Сервис для работы с API контрагентов (единый лицевой счёт per контрагент, Ф4).
 */

import { config } from "@/config/env";
import axios, { type AxiosResponse } from "axios";

export interface Counterparty {
  id: number;
  created_at: string;
  updated_at: string;
  admin_account_id: number;
  company_id: number;
  country: string;
  id_type: "inn" | "bin" | "iin" | "passport" | "other";
  tax_id: string;
  name: string;
  client_type: string;
  kpp?: string;
  email?: string;
  phone?: string;
  address?: string;
  legal_address?: string;
  director?: string;
  bank_name?: string;
  bank_account?: string;
  billing_mode: string;
  credit_limit: string;
  manual_review: boolean;
  created_by: string;
}

// Суб-баланс единицы в одной валюте (мультивалютный контрагент).
export interface CurrencyBreakdown {
  currency: string;
  charged: string;
  paid: string;
  balance: string;
}

export interface CounterpartyBalance {
  counterparty_id: number;
  name: string;
  balance: string; // BE гарантирует непустую строку (при stale-курсе — суб-баланс валюты презентации)
  total_charged: string;
  total_paid: string;
  is_debt: boolean;
  debt_amount: string;
  credit_limit: string;
  billing_mode: string;
  contracts_count: number;
  // Мультивалюта (аддитивно): присутствуют только когда у контрагента договоры в разных валютах.
  multicurrency?: boolean;
  sub_balances?: CurrencyBreakdown[];
  presentation_currency?: string;
  presentation_only?: boolean; // true → balance свёрнут по курсу (оценочно), не точный
}

// Договор контрагента в карточке (Фаза A, read-only из /counterparties/:id/contracts).
export interface CounterpartyContract {
  id: number;
  number: string;
  contract_type: string;
  status: string;
  is_active: boolean;
  currency: string;
  total_amount: string;
  balance: string;
  is_debt: boolean;
  start_date?: string | null;
  end_date?: string | null;
  manager_name?: string;
  tariff_name?: string;
  tariff_price?: string;
}

export interface CounterpartySearchItem {
  id: number;
  name: string;
  tax_id: string;
  id_type: string;
  manual_review: boolean;
}

class CounterpartiesService {
  private apiClient = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 60000,
  });

  constructor() {
    // Интерцептор: токен + X-Tenant-ID из localStorage (как в contractsService).
    this.apiClient.interceptors.request.use((cfg) => {
      const token = localStorage.getItem("axenta_token");
      const company = localStorage.getItem("axenta_company");
      if (token) {
        cfg.headers["authorization"] = `Bearer ${token}`;
      }
      if (company) {
        try {
          const companyId = JSON.parse(company)?.id;
          if (companyId !== undefined && companyId !== null) {
            cfg.headers["X-Tenant-ID"] = String(companyId);
          }
        } catch (e) {
          console.warn("Invalid company data in localStorage:", e);
        }
      }
      return cfg;
    });
  }

  /** Список контрагентов компании. q — поиск по имени/ИНН; manualReview — фильтр на проверку. */
  async list(params: { q?: string; manualReview?: boolean; limit?: number; offset?: number } = {}): Promise<{
    data: Counterparty[];
    count: number;
    total: number;
  }> {
    const res: AxiosResponse = await this.apiClient.get("/auth/counterparties", {
      params: {
        q: params.q || undefined,
        manual_review: params.manualReview ? "1" : undefined,
        limit: params.limit ?? 100,
        offset: params.offset ?? 0,
      },
    });
    return {
      data: res.data?.data ?? [],
      count: res.data?.count ?? 0,
      total: res.data?.total ?? 0,
    };
  }

  /** Autocomplete для формы договора (Ф4b-followon). */
  async search(q: string): Promise<CounterpartySearchItem[]> {
    const res: AxiosResponse = await this.apiClient.get("/auth/counterparties/search", {
      params: { q },
    });
    return res.data?.data ?? [];
  }

  async get(id: number): Promise<Counterparty> {
    const res: AxiosResponse = await this.apiClient.get(`/auth/counterparties/${id}`);
    return res.data?.data;
  }

  /** Единый лицевой счёт контрагента: баланс (по всем договорам) + разбивка. */
  async balance(id: number): Promise<CounterpartyBalance> {
    const res: AxiosResponse = await this.apiClient.get(`/auth/counterparties/${id}/balance`);
    return res.data?.data;
  }

  async update(id: number, payload: Partial<Counterparty>): Promise<Counterparty> {
    const res: AxiosResponse = await this.apiClient.put(`/auth/counterparties/${id}`, payload);
    return res.data?.data;
  }

  /** Создать контрагента вручную (Фаза A). Только admin/superadmin (BE-guard). */
  async create(payload: {
    name: string;
    id_type?: "inn" | "bin" | "iin" | "passport" | "other";
    tax_id?: string;
    client_type?: string;
    billing_mode?: string;
    credit_limit?: string;
    country?: string;
  }): Promise<Counterparty> {
    const res: AxiosResponse = await this.apiClient.post("/auth/counterparties", payload);
    return res.data?.data;
  }

  /** Договоры контрагента — для карточки (Фаза A). Read-only, полный ЛС. */
  async contracts(id: number): Promise<CounterpartyContract[]> {
    const res: AxiosResponse = await this.apiClient.get(`/auth/counterparties/${id}/contracts`);
    return res.data?.data ?? [];
  }

  /** Быстрый платёж на ЛС (через договор). Постит в существующий /ledger/payment. */
  async pay(payload: {
    contract_id: number;
    amount: number;
    source?: string;
    comment?: string;
    payment_date?: string;
  }): Promise<{ new_balance: string }> {
    const res: AxiosResponse = await this.apiClient.post("/auth/ledger/payment", payload);
    return res.data?.data ?? res.data;
  }

  // ── Ф5: Excel-импорт платежей ──────────────────────────────────────────────

  /** Превью-матчинг строк Excel на контрагентов (✅ matched / ⚠️ review / ❌ nomatch). */
  async matchRows(
    rows: { row_index: number; identifier: string; name?: string; amount: number }[]
  ): Promise<MatchResult[]> {
    const res: AxiosResponse = await this.apiClient.post("/auth/counterparties/match", { rows });
    return res.data?.data ?? [];
  }

  /** Импорт платежей пачкой. */
  async importBatch(payload: {
    source?: string;
    file_name?: string;
    rows: { counterparty_id: number; amount: number; date?: string; reference?: string; comment?: string }[];
  }): Promise<ImportBatchResult> {
    const res: AxiosResponse = await this.apiClient.post("/auth/ledger/import-batch", payload);
    return res.data?.data;
  }

  /** История батчей импорта. */
  async listBatches(): Promise<ImportBatch[]> {
    const res: AxiosResponse = await this.apiClient.get("/auth/ledger/import-batches");
    return res.data?.data ?? [];
  }

  /** Откат батча (полный или выборочный по entry_ids). */
  async reverseBatch(id: number, entryIds?: number[]): Promise<{ batch_id: number; reversed: number }> {
    const res: AxiosResponse = await this.apiClient.post(`/auth/ledger/import-batch/${id}/reverse`, {
      entry_ids: entryIds,
    });
    return res.data?.data;
  }
}

export interface MatchResult {
  row_index: number;
  status: "matched" | "review" | "nomatch";
  counterparty_id: number;
  counterparty_name: string;
  amount: number;
  note?: string;
}

export interface ImportBatchResult {
  batch_id: number;
  rows_total: number;
  imported: number;
  skipped: number;
  total_amount: string;
  errors: string[];
}

export interface ImportBatch {
  id: number;
  created_at: string;
  source: string;
  status: "imported" | "reversed";
  rows_total: number;
  rows_imported: number;
  rows_skipped: number;
  total_amount: string;
  currency: string;
  file_name: string;
  created_by: string;
  reversed_at?: string | null;
}

export const counterpartiesService = new CounterpartiesService();
export default counterpartiesService;
