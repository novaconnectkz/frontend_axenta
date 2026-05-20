// Операторский (control-plane) клиент — ПОЛНОСТЬЮ изолирован от
// tenant-auth (context/auth.ts). Свой токен (acrm_op_access в памяти+
// localStorage), своя cookie (acrm_op_refresh httpOnly — браузер сам),
// свой csrf (acrm_op_csrf), свой axios. Ноль пересечений с Ф1.
import axios from "axios";
import { config } from "@/config/env";

const OP_TOKEN_KEY = "acrm_op_access";
const OP_CSRF_KEY = "acrm_op_csrf";

export const opToken = {
  get: () => localStorage.getItem(OP_TOKEN_KEY) || "",
  set: (t: string) => localStorage.setItem(OP_TOKEN_KEY, t),
  clear: () => {
    localStorage.removeItem(OP_TOKEN_KEY);
    localStorage.removeItem(OP_CSRF_KEY);
  },
};

function readCookie(name: string): string {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
}

export const op = axios.create({
  baseURL: `${config.apiBaseUrl}/control`,
  timeout: 30000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

op.interceptors.request.use((cfg) => {
  const t = opToken.get();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  const m = (cfg.method || "get").toLowerCase();
  if (!["get", "head", "options"].includes(m)) {
    const csrf = localStorage.getItem(OP_CSRF_KEY) || readCookie("acrm_op_csrf");
    if (csrf) cfg.headers["X-CSRF-Token"] = csrf;
  }
  return cfg;
});

let refreshing: Promise<string | null> | null = null;

async function doOpRefresh(): Promise<string | null> {
  try {
    const r = await axios.post(
      `${config.apiBaseUrl}/control/auth/refresh`,
      {},
      {
        withCredentials: true,
        headers: { "X-CSRF-Token": localStorage.getItem(OP_CSRF_KEY) || readCookie("acrm_op_csrf") },
      }
    );
    const d = r.data?.data;
    if (r.data?.status === "success" && d?.access_token) {
      opToken.set(d.access_token);
      if (d.csrf_token) localStorage.setItem(OP_CSRF_KEY, d.csrf_token);
      return d.access_token;
    }
    return null;
  } catch {
    return null; // сеть/409/прочее — НЕ выкидываем; смерть = только 401
  }
}

op.interceptors.response.use(
  (r) => r,
  async (error) => {
    const orig = error.config || {};
    const url: string = orig.url || "";
    const isAuth = url.includes("/auth/");
    if (error.response?.status === 401 && !orig.__r && !isAuth) {
      orig.__r = true;
      if (!refreshing) refreshing = doOpRefresh().finally(() => (refreshing = null));
      const nt = await refreshing;
      if (nt) {
        orig.headers = orig.headers || {};
        orig.headers.Authorization = `Bearer ${nt}`;
        return op(orig);
      }
      // refresh не вышел → operator-сессия мертва
      opToken.clear();
      if (location.pathname !== "/control-plane/login") {
        location.href = "/control-plane/login";
      }
    }
    return Promise.reject(error);
  }
);

// --- auth API ---
export async function operatorLogin(username: string, password: string) {
  const r = await axios.post(
    `${config.apiBaseUrl}/control/auth/login`,
    { username, password },
    { withCredentials: true, headers: { "Content-Type": "application/json" } }
  );
  const d = r.data?.data;
  if (r.data?.status !== "success" || !d?.access_token) {
    throw new Error(r.data?.error || "Ошибка входа оператора");
  }
  opToken.set(d.access_token);
  if (d.csrf_token) localStorage.setItem(OP_CSRF_KEY, d.csrf_token);
  return d.operator;
}

export async function operatorLogout() {
  try {
    await op.post("/auth/logout", {});
  } catch {
    /* best-effort */
  }
  opToken.clear();
}

export const isOperatorAuthed = () => !!opToken.get();
