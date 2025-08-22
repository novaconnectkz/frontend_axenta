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
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

const getTokenExpiry = (token: string): Date | null => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
};

export const AuthKey: InjectionKey<AuthContext> = Symbol("auth");

export function useAuthProvider() {
  // Создаем демо пользователя для тестирования
  const demoUser: User = {
    accountBlockingDatetime: null,
    accountName: "Axenta Demo",
    accountType: "demo",
    creatorName: "System",
    id: "demo-user-1",
    lastLogin: new Date().toISOString(),
    name: "Демо Пользователь",
    username: "demo",
    email: "demo@axenta.ru",
    accountId: 2061, // Используем реальный accountId из логов
    isAdmin: true,
    isActive: true,
    language: "ru",
    timezone: 3,
  };

  const demoCompany: Company = {
    id: "4e12b3c9-529c-4fe7-98e1-025eed8cb258",
    name: "Axenta Demo Company",
    schema: "demo",
    isActive: true,
  };

  const user = ref<User | null>(demoUser);
  const token = ref<string | null>(localStorage.getItem("axenta_token"));
  const company = ref<Company | null>(demoCompany);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Создаем axios instance с автоматическим добавлением токена
  const apiClient = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 30000,
  });

  // Interceptor для автоматического добавления токена
  apiClient.interceptors.request.use(
    (config) => {
      if (token.value) {
        config.headers["authorization"] = `Token ${token.value}`;
        if (company.value) {
          config.headers["X-Tenant-ID"] = company.value.id;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Interceptor для обработки ошибок аутентификации
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 && token.value) {
        // Токен истек, пробуем обновить
        try {
          await refreshToken();
          // Повторяем оригинальный запрос с новым токеном
          const originalRequest = error.config;
          originalRequest.headers["authorization"] = `Token ${token.value}`;
          return apiClient.request(originalRequest);
        } catch (refreshError) {
          // Не удалось обновить токен, выходим из системы
          logout();
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );

  const isAuthenticated = computed(() => {
    return !!(user.value && token.value && !isTokenExpired(token.value));
  });

  // Загружаем данные из localStorage при инициализации
  const loadFromStorage = () => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      const storedCompany = localStorage.getItem(COMPANY_KEY);

      if (storedToken && storedUser) {
        if (!isTokenExpired(storedToken)) {
          token.value = storedToken;
          user.value = JSON.parse(storedUser);
          if (storedCompany) {
            const parsedCompany = JSON.parse(storedCompany);
            // Проверяем, что используется корректный UUID
            if (parsedCompany.id === "1" || parsedCompany.id === 1) {
              // Обновляем старые данные с некорректным ID
              company.value = demoCompany;
              localStorage.setItem(COMPANY_KEY, JSON.stringify(demoCompany));
            } else {
              company.value = parsedCompany;
            }
          }
        } else {
          // Токен истек, очищаем данные
          clearStorage();
        }
      }
    } catch (err) {
      console.error("Ошибка загрузки данных из localStorage:", err);
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

  const login = async (credentials: LoginForm) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await axios.post(
        `${config.apiBaseUrl}/auth/login`,
        credentials
      );

      const authData = response.data.data;
      user.value = authData.user;
      token.value = authData.token;

      if (authData.company) {
        company.value = authData.company;
      }

      saveToStorage();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || "Ошибка входа в систему";
      error.value = errorMessage;
      clearStorage();
      throw new Error(errorMessage);
    } finally {
      isLoading.value = false;
    }
  };

  const refreshToken = async () => {
    if (!token.value) {
      throw new Error("Нет токена для обновления");
    }

    try {
      const response = await axios.post(
        `${config.apiBaseUrl}/auth/refresh`,
        {},
        {
          headers: {
            authorization: `Token ${token.value}`,
            ...(company.value && { "X-Tenant-ID": company.value.id }),
          },
        }
      );

      const newToken = response.data.token;
      token.value = newToken;
      saveToStorage();
    } catch (err: any) {
      console.error("Ошибка обновления токена:", err);
      logout();
      throw err;
    }
  };

  const logout = () => {
    user.value = null;
    token.value = null;
    company.value = null;
    error.value = null;
    clearStorage();
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

  // Автоматически проверяем токен каждые 5 минут
  let tokenCheckInterval: NodeJS.Timeout;

  const startTokenCheck = () => {
    tokenCheckInterval = setInterval(() => {
      if (token.value && isTokenExpired(token.value)) {
        refreshToken().catch(() => {
          // Если не удалось обновить токен, выходим
          logout();
        });
      }
    }, 5 * 60 * 1000); // 5 минут
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

  // Принудительно очищаем старые данные с некорректным company ID
  const forceCleanOldData = () => {
    const storedCompany = localStorage.getItem(COMPANY_KEY);
    if (storedCompany) {
      try {
        const parsedCompany = JSON.parse(storedCompany);
        if (parsedCompany.id === "1" || parsedCompany.id === 1) {
          console.log("🔄 Очищаем старые данные с некорректным company ID");
          clearStorage();
          // Устанавливаем корректные демо данные
          token.value =
            localStorage.getItem("axenta_token") || "demo-token-" + Date.now();
          user.value = demoUser;
          company.value = demoCompany;
          saveToStorage();
        }
      } catch (err) {
        console.log(
          "🔄 Ошибка при проверке старых данных, очищаем localStorage"
        );
        clearStorage();
      }
    }
  };

  // Принудительная очистка при загрузке
  forceCleanOldData();

  // Загружаем данные при инициализации
  loadFromStorage();

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
