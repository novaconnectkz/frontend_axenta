import { config } from "@/config/env";
import axios, { type AxiosInstance } from "axios";
import {
  computed,
  type ComputedRef,
  inject,
  type InjectionKey,
  provide,
  ref,
  type Ref,
  watch,
} from "vue";

export interface User {
  accountBlockingDatetime: string | null;
  accountName: string;
  accountType: string;
  creatorName: string;
  id: string;
  lastLogin: string;
  name: string;
  username: string;
  email?: string;
  accountId?: number;
  isAdmin?: boolean;
  isActive?: boolean;
  language?: string;
  timezone?: number;
}

export interface Company {
  id: string;
  name: string;
  schema: string;
  isActive: boolean;
}

export interface LoginForm {
  username: string;
  password: string;
  tenantId?: string;
}

export interface AuthResponse {
  data: {
    user: User;
    token: string;
    company?: Company;
  };
}

export interface RefreshTokenResponse {
  token: string;
  expiresAt: string;
}

export interface AuthContext {
  user: Ref<User | null>;
  token: Ref<string | null>;
  company: Ref<Company | null>;
  login: (credentials: LoginForm) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  isAuthenticated: ComputedRef<boolean>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  clearError: () => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  apiClient: AxiosInstance;
}

// Константы для localStorage
const TOKEN_KEY = "axenta_token";
const USER_KEY = "axenta_user";
const COMPANY_KEY = "axenta_company";
const TOKEN_EXPIRY_KEY = "axenta_token_expiry";

// Утилиты для работы с токенами
// JWT использует base64URL ('-' '_', без паддинга). Голый atob()
// принимает только base64 и БРОСАЕТ на '-'/'_' → раньше любой наш
// HS256-токен считался "истёкшим" (catch → true) и сессия убивалась
// в loadFromStorage. Нормализуем перед декодом.
const decodeJwtPayload = (seg: string): any => {
  let b64 = seg.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  if (pad) b64 += "=".repeat(4 - pad);
  return JSON.parse(atob(b64));
};

const isTokenExpired = (token: string): boolean => {
  if (!token) return true;

  try {
    // 3 части = JWT; иначе не-JWT (легаси opaque) → считаем валидным.
    const parts = token.split(".");
    if (parts.length !== 3) {
      return false;
    }
    const payload = decodeJwtPayload(parts[1]);
    if (!payload || typeof payload.exp !== "number") {
      // Нет exp — не можем судить; не выкидываем юзера.
      return false;
    }
    return Date.now() >= payload.exp * 1000;
  } catch (error) {
    console.error("❌ Error checking token expiry:", error);
    // Не трактуем ошибку парсинга как протухание (иначе ложный logout).
    return false;
  }
};

const getTokenExpiry = (token: string): Date | null => {
  try {
    const payload = decodeJwtPayload(token.split(".")[1]);
    return typeof payload.exp === "number"
      ? new Date(payload.exp * 1000)
      : null;
  } catch {
    return null;
  }
};

export const AuthKey: InjectionKey<AuthContext> = Symbol("auth");

export function useAuthProvider() {
  // Убираем демо пользователя - только реальная авторизация

  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const company = ref<Company | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Создаем axios instance с автоматическим добавлением токена.
  // withCredentials: refresh-токен в httpOnly-cookie (Ф1).
  const apiClient = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: config.apiTimeout,
    withCredentials: true,
  });

  // Interceptor: access-токен по схеме Bearer (унифицировано с
  // services/api.ts — раньше тут был «Token <axenta>») + CSRF.
  apiClient.interceptors.request.use(
    (cfg) => {
      const currentToken = token.value || localStorage.getItem("axenta_token");
      if (currentToken) {
        cfg.headers["Authorization"] = `Bearer ${currentToken}`;
      }
      const tenantId = localStorage.getItem("tenant_id");
      if (tenantId) {
        cfg.headers["X-Tenant-ID"] = tenantId;
      }
      const method = (cfg.method || "get").toLowerCase();
      if (!["get", "head", "options"].includes(method)) {
        const csrf = localStorage.getItem("acrm_csrf");
        if (csrf) cfg.headers["X-CSRF-Token"] = csrf;
      }
      return cfg;
    },
    (error) => Promise.reject(error)
  );

  // Interceptor для обработки ошибок аутентификации
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Ф1: 401 здесь НЕ означает смерть локальной сессии. После
      // отвязки от Axenta data-layer (objects/cms/stats) — это
      // passthrough-прокси в axenta.cloud по login-токену; без
      // Axenta-токена они законно отдают 401. Раньше тут был
      // logout(true) → любой пустой Axenta-экран выкидывал
      // залогиненного юзера. Смерть локальной сессии определяет
      // ТОЛЬКО refresh-путь в services/api.ts + watcher истечения.
      if (error.response?.status === 401) {
        console.warn('401 (downstream, не логаутим):', error.config?.url);
      }
      return Promise.reject(error);
    }
  );

  const isAuthenticated = computed(() => {
    return !!(user.value && token.value && !isTokenExpired(token.value));
  });

  // Загружаем данные из localStorage при инициализации
  const loadFromStorage = () => {
    console.log("🔄 Loading Axenta Cloud auth data from localStorage...");
    
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      const storedCompany = localStorage.getItem(COMPANY_KEY);

      console.log("📦 Axenta Cloud storage check:", {
        token: storedToken ? `EXISTS (${storedToken.length} chars)` : 'MISSING',
        user: storedUser ? 'EXISTS' : 'MISSING',
        company: storedCompany ? 'EXISTS' : 'MISSING'
      });

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Проверяем, что это не демо пользователь
          if (parsedUser.username === 'demo' && parsedUser.accountType === 'demo') {
            console.log("⚠️ Found demo user in storage, checking for real user...");
            
            // Проверяем, есть ли настоящий пользователь в других ключах
            const altUser = localStorage.getItem('user') || localStorage.getItem('current_user');
            if (altUser) {
              const altParsedUser = JSON.parse(altUser);
              if (altParsedUser.username !== 'demo') {
                console.log("✅ Found real user in alternative storage");
                user.value = altParsedUser;
                token.value = storedToken;
                if (storedCompany) {
                  company.value = JSON.parse(storedCompany);
                }
                return;
              }
            }
          }
          
          // Проверяем срок действия токена (только для JWT)
          let isExpired = false;
          try {
            isExpired = isTokenExpired(storedToken);
          } catch (e) {
            // Не JWT токен, считаем валидным
            isExpired = false;
          }
          
          console.log("🕐 Token expiry check:", { 
            isJWT: storedToken.includes('.'),
            isExpired 
          });
          
          if (!isExpired) {
            // Ф1: гейт accountType==partner убран — роль из нашей БД,
            // доступ решает RBAC, а не тип аккаунта Axenta.
            token.value = storedToken;
            user.value = parsedUser;
            
            if (storedCompany) {
              const parsedCompany = JSON.parse(storedCompany);
              company.value = parsedCompany;
            }
            
            console.log("✅ Axenta Cloud auth data restored");
            console.log("👤 Restored user:", user.value?.name, `(${user.value?.username})`);
            console.log("🏢 Restored company:", company.value?.name);
          } else {
            console.log("⚠️ Token expired, clearing Axenta storage");
            clearStorage();
          }
        } catch (parseErr) {
          console.error("❌ Error parsing stored user data:", parseErr);
          clearStorage();
        }
      } else {
        console.log("ℹ️ No Axenta Cloud auth data found");
      }
    } catch (err) {
      console.error("❌ Error loading Axenta auth data:", err);
      clearStorage();
    }
  };

  // Сохраняем данные в localStorage
  const saveToStorage = () => {
    try {
      if (token.value && user.value) {
        localStorage.setItem(TOKEN_KEY, token.value);
        localStorage.setItem(USER_KEY, JSON.stringify(user.value));
        if (company.value) {
          localStorage.setItem(COMPANY_KEY, JSON.stringify(company.value));
        }

        const expiry = getTokenExpiry(token.value);
        if (expiry) {
          localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toISOString());
        }
      }
    } catch (err) {
      console.error("Ошибка сохранения данных в localStorage:", err);
    }
  };

  // Очищаем localStorage
  const clearStorage = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(COMPANY_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  };

  // Локальная авторизация (Ф1): прямой POST /auth/login.
  // Никаких Axenta-retry и accountType==partner гейта — роль из нашей
  // БД. Access — в память+localStorage, refresh — httpOnly cookie.
  const login = async (credentials: LoginForm) => {
    isLoading.value = true;
    error.value = null;

    try {
      const resp = await axios.post(
        `${config.apiBaseUrl}/auth/login`,
        { username: credentials.username, password: credentials.password },
        {
          timeout: 15000,
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      const d = resp.data?.data;
      if (resp.data?.status !== "success" || !d?.access_token) {
        throw new Error("Неверный формат ответа сервера");
      }

      const u = d.user || {};
      const role = u.role || "user";
      const isPrivileged =
        role === "admin" || role === "superadmin" || !!u.is_superadmin;

      const mapped: User = {
        accountBlockingDatetime: null,
        accountName: u.name || u.username || credentials.username,
        accountType: role,
        creatorName: "",
        id: String(u.id ?? ""),
        lastLogin: u.last_login || new Date().toISOString(),
        name: u.name || u.username || credentials.username,
        username: u.username || credentials.username,
        email: u.email,
        accountId: u.company_id != null ? Number(u.company_id) : undefined,
        isAdmin: isPrivileged,
        isActive: u.is_active !== false,
        language: "ru",
        timezone: 3,
      };

      user.value = mapped;
      token.value = d.access_token;
      company.value = {
        id: String(u.company_id ?? ""),
        name: mapped.accountName,
        isActive: true,
      };

      localStorage.setItem("axenta_token", d.access_token);
      if (d.csrf_token) localStorage.setItem("acrm_csrf", d.csrf_token);
      if (u.company_id != null) {
        // tenant_id == numeric company_id == JWT-claim (риск B5:
        // расхождение заголовка с claim → 403 на бэке).
        localStorage.setItem("tenant_id", String(u.company_id));
      }
      saveToStorage();
    } catch (err: any) {
      const msg =
        err.response?.data?.error || err.message || "Ошибка входа в систему";
      error.value = msg;
      clearStorage();
      localStorage.removeItem("acrm_csrf");
      throw new Error(msg);
    } finally {
      isLoading.value = false;
    }
  };

  const refreshToken = async () => {
    if (!token.value) {
      throw new Error("Нет токена для обновления");
    }

    try {
      // Refresh по httpOnly-cookie (браузер шлёт сам). CSRF double-submit.
      const response = await axios.post(
        `${config.apiBaseUrl}/auth/refresh`,
        {},
        {
          withCredentials: true,
          headers: {
            "X-CSRF-Token": localStorage.getItem("acrm_csrf") || "",
          },
        }
      );

      const d = response.data?.data;
      if (response.data?.status === "success" && d?.access_token) {
        token.value = d.access_token;
        localStorage.setItem("axenta_token", d.access_token);
        if (d.csrf_token) localStorage.setItem("acrm_csrf", d.csrf_token);
        saveToStorage();
        return;
      }
      throw new Error("refresh failed");
    } catch (err: any) {
      console.error("Ошибка обновления токена:", err);
      logout();
      throw err;
    }
  };

  const logout = (redirectToLogin: boolean = false) => {
    console.log("🚪 Logout initiated...");

    // Серверный logout: отзыв всей семьи refresh + чистка cookie.
    // Fire-and-forget — UI не блокируем, локально чистим в любом случае.
    try {
      axios.post(
        `${config.apiBaseUrl}/auth/logout`,
        {},
        {
          withCredentials: true,
          headers: { "X-CSRF-Token": localStorage.getItem("acrm_csrf") || "" },
        }
      ).catch(() => {});
    } catch { /* ignore */ }

    user.value = null;
    token.value = null;
    company.value = null;
    error.value = null;

    // Очищаем все данные авторизации
    clearStorage();

    // Дополнительная очистка для надежности
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("acrm_csrf");
    localStorage.removeItem("demo_token");
    localStorage.removeItem("demo_user");
    
    console.log("✅ Axenta Cloud logout completed");
    
    // Перенаправляем на страницу входа, если требуется
    if (redirectToLogin && typeof window !== 'undefined' && window.location.pathname !== '/login') {
      console.log("🔄 Перенаправление на страницу входа...");
      
      // Сохраняем текущий путь для редиректа после входа
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/' && currentPath !== '/dashboard') {
        localStorage.setItem('redirect_after_login', currentPath);
      }
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  };

  const clearError = () => {
    error.value = null;
  };

  const hasRole = (role: string): boolean => {
    if (!user.value) return false;
    // Логика проверки роли будет реализована позже
    return user.value.isAdmin || false;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user.value) return false;
    // Логика проверки прав будет реализована позже
    return user.value.isAdmin || false;
  };

  // Автоматически проверяем токен каждые 30 минут (увеличено с 5 минут)
  let tokenCheckInterval: NodeJS.Timeout;

  const startTokenCheck = () => {
    // Access JWT короткий (15м, Ф1). Раз в 5м пробуем тихий refresh
    // по cookie; не вышло (refresh мёртв/отозван) → logout. НЕ выкидываем
    // юзера только из-за истёкшего access, пока жива refresh-сессия.
    tokenCheckInterval = setInterval(() => {
      if (token.value && isTokenExpired(token.value)) {
        refreshToken().catch(() => {
          console.log("🔄 refresh не удался — выход");
        });
      }
    }, 5 * 60 * 1000);
  };

  const stopTokenCheck = () => {
    if (tokenCheckInterval) {
      clearInterval(tokenCheckInterval);
    }
  };

  // Следим за изменениями токена для запуска/остановки проверки
  watch(token, (newToken) => {
    if (newToken) {
      startTokenCheck();
    } else {
      stopTokenCheck();
    }
  });

  // Очищаем старые демо данные при инициализации
  const cleanDemoData = () => {
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Если это демо пользователь - удаляем
        if (parsedUser.username === 'demo' || parsedUser.accountType === 'demo' || parsedUser.name === 'Демо Пользователь') {
          console.log('🧹 Очищаем старые демо данные...');
          clearStorage();
          user.value = null;
          token.value = null;
          company.value = null;
        }
      } catch (err) {
        console.log('⚠️ Ошибка при проверке пользователя:', err);
      }
    }
  };

  // Сначала очищаем демо данные, затем загружаем реальные
  cleanDemoData();
  loadFromStorage();

  // Убираем автоматическую установку токена - теперь только через нормальную авторизацию
  console.log('🔍 Проверяем существующий токен в localStorage...');
  const existingToken = localStorage.getItem(TOKEN_KEY);
  if (existingToken) {
    console.log('✅ Найден существующий токен:', existingToken.substring(0, 20) + '...');
  } else {
    console.log('ℹ️ Токен не найден - требуется авторизация');
  }

  // Убираем автоматическую установку демо данных
  console.log("ℹ️ Демо режим отключен - только нормальная авторизация");
  
  // Проверяем, есть ли сохраненные данные для восстановления
  const hasAnyStoredToken = localStorage.getItem("axenta_token") || 
                           localStorage.getItem("local_access_token") ||
                           localStorage.getItem("token");
                           
  if (hasAnyStoredToken && !user.value) {
    console.log("🔄 Found stored token but no user, attempting to restore...");
    // Если есть токен в localStorage, но пользователь не загрузился, попробуем еще раз
    loadFromStorage();
  } else if (!hasAnyStoredToken) {
    console.log("ℹ️ No tokens found - user needs to login");
  }

  const authContext: AuthContext = {
    user,
    token,
    company,
    login,
    logout,
    refreshToken,
    isAuthenticated,
    isLoading,
    error,
    clearError,
    hasRole,
    hasPermission,
    apiClient,
  };

  provide(AuthKey, authContext);

  return authContext;
}

export function useAuth() {
  const auth = inject<AuthContext>(AuthKey);
  if (!auth) throw new Error("Auth context not provided");
  return auth;
}

export function provideAuth(authContext: AuthContext) {
  provide(AuthKey, authContext);
}
