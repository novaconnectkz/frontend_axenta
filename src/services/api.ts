// Простой HTTP клиент для API запросов
import axios from "axios";
import { config } from "@/config/env";

// Создаем экземпляр axios с базовой конфигурацией
export const apiClient = axios.create({
  baseURL: config.apiBaseUrl, // Используем конфигурацию из env
  timeout: config.apiTimeout, // Используем таймаут из конфигурации (по умолчанию 180 секунд)
  // withCredentials: refresh-токен живёт в httpOnly-cookie (Ф1),
  // браузер сам шлёт её на /api/auth/refresh|logout (same-site
  // acrm.su↔api.acrm.su). CORS на бэке: AllowCredentials=true.
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Безопасные методы CSRF-проверке не подлежат.
const CSRF_SAFE = new Set(["get", "head", "options"]);

// Интерцептор для добавления токена авторизации
apiClient.interceptors.request.use(
  (config) => {
    // Получаем токен из localStorage
    const token = localStorage.getItem("axenta_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Добавляем заголовок тенанта если есть.
    // Fallback на axenta_company.id — Axenta auth login не сохраняет tenant_id
    // отдельно, но кладёт всю company в localStorage.axenta_company.
    let tenantId = localStorage.getItem("tenant_id");
    if (!tenantId) {
      try {
        const companyRaw = localStorage.getItem("axenta_company");
        if (companyRaw) {
          const company = JSON.parse(companyRaw);
          if (company && (company.id || company.company_id)) {
            tenantId = String(company.id ?? company.company_id);
          }
        }
      } catch {
        // ignore — пустой/битый axenta_company
      }
    }
    if (tenantId) {
      config.headers["X-Tenant-ID"] = tenantId;
    }

    // CSRF double-submit (риск B4): на небезопасных методах дублируем
    // значение cookie acrm_csrf в заголовок. Бэк сверяет cookie==header.
    const method = (config.method || "get").toLowerCase();
    if (!CSRF_SAFE.has(method)) {
      const csrf = localStorage.getItem("acrm_csrf");
      if (csrf) {
        config.headers["X-CSRF-Token"] = csrf;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Single-flight refresh: параллельные 401 ждут один /auth/refresh,
// не устраивая refresh-шторм (бэк его переживёт — grace-окно, риск B1,
// но лишних запросов не плодим).
// "RACE" — бэк ответил 409 (ErrRefreshRace, BLK1): параллельная
// ротация, сессия жива. НЕ разлогиниваем, просто не ретраим этот запрос.
type RefreshResult = string | null | "RACE";
let refreshInFlight: Promise<RefreshResult> | null = null;

async function doRefresh(): Promise<RefreshResult> {
  try {
    const resp = await axios.post(
      `${config.apiBaseUrl}/auth/refresh`,
      {},
      {
        withCredentials: true,
        headers: {
          "X-CSRF-Token": localStorage.getItem("acrm_csrf") || "",
        },
      }
    );
    const d = resp.data?.data;
    if (resp.data?.status === "success" && d?.access_token) {
      localStorage.setItem("axenta_token", d.access_token);
      if (d.csrf_token) localStorage.setItem("acrm_csrf", d.csrf_token);
      return d.access_token;
    }
    return null;
  } catch (e: any) {
    if (e?.response?.status === 409) return "RACE";
    return null;
  }
}

// Интерцептор для обработки ответов
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // 401 → одна попытка silent-refresh по httpOnly-cookie, затем
    // повтор оригинального запроса. /auth/* не рефрешим (избегаем цикла).
    const original = error.config || {};
    const url: string = original.url || "";
    const isAuthEndpoint = url.includes("/auth/login") ||
      url.includes("/auth/refresh") || url.includes("/auth/logout");
    if (
      error.response?.status === 401 &&
      !original.__retried &&
      !isAuthEndpoint
    ) {
      original.__retried = true;
      if (!refreshInFlight) {
        refreshInFlight = doRefresh().finally(() => {
          refreshInFlight = null;
        });
      }
      const newToken = await refreshInFlight;
      if (newToken === "RACE") {
        // Параллельная ротация (BLK1): сессия жива, токены НЕ трогаем,
        // этот запрос просто фейлим — следующий пройдёт штатно.
        return Promise.reject(error);
      }
      if (newToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
      // refresh не вышел — сессия мертва.
      localStorage.removeItem("axenta_token");
      localStorage.removeItem("acrm_csrf");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
    return handleApiError(error);
  }
);

function handleApiError(error: any) {
    // Безопасность: error.config.data = тело запроса (axios сохраняет),
    // globalErrorHandler делает console.error(error) → пароль из любого
    // POST (gelios create-user, login, etc) утёк бы в devtools-консоль.
    // Редактируем до логирования (запрос уже отправлен — на сеть не влияет).
    try {
      if (error?.config?.data && typeof error.config.data === "string" &&
          error.config.data.includes("password")) {
        error.config.data = error.config.data.replace(
          /("password"\s*:\s*)"(?:[^"\\]|\\.)*"/g, '$1"***"');
      }
    } catch { /* best-effort redaction */ }
    // Используем улучшенный обработчик ошибок
    import("@/utils/errorHandler").then(({ globalErrorHandler }) => {
      globalErrorHandler.handleError(error);
    }).catch((err) => {
      console.warn("Cannot access error handler:", err);
      // Fallback для обработки ошибок авторизации
      if (error.response?.status === 401) {
        localStorage.removeItem("axenta_token");
        localStorage.removeItem("tenant_id");
        window.location.href = "/login";
      }
    });

    return Promise.reject(error);
}

export default apiClient;
