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
  if (!token) return true;
  
  try {
    // Проверяем, является ли токен JWT (имеет 3 части, разделенные точками)
    const parts = token.split(".");
    if (parts.length !== 3) {
      // Это не JWT токен (например, токен Axenta Cloud), считаем его валидным
      console.log("🔍 Non-JWT token detected, considering valid");
      return false;
    }
    
    // Для JWT токенов проверяем срок действия
    const payload = JSON.parse(atob(parts[1]));
    const isExpired = Date.now() >= payload.exp * 1000;
    console.log("🕐 JWT token expiry check:", { 
      exp: new Date(payload.exp * 1000).toLocaleString(),
      isExpired 
    });
    return isExpired;
  } catch (error) {
    console.error("❌ Error checking token expiry:", error);
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

  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const company = ref<Company | null>(null);
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
      const currentToken = token.value || localStorage.getItem("axenta_token");
      const currentCompany = company.value || JSON.parse(localStorage.getItem("axenta_company") || "null");
      
      if (currentToken) {
        config.headers["authorization"] = `Token ${currentToken}`;
        config.headers["Authorization"] = `Token ${currentToken}`;
        
        if (currentCompany) {
          config.headers["X-Tenant-ID"] = currentCompany.id;
        }
      }
      
      console.log("🔐 Auth headers:", {
        authorization: config.headers["authorization"] ? "Token ***" : "none",
        tenantId: config.headers["X-Tenant-ID"] || "none"
      });
      
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
            // Проверяем тип аккаунта при загрузке из localStorage
            if (parsedUser.accountType && parsedUser.accountType !== 'partner') {
              console.log("🚫 Non-partner user found in storage, clearing...");
              console.log("Account type:", parsedUser.accountType);
              clearStorage();
              return;
            }
            
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

  const login = async (credentials: LoginForm) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Используем наш backend API для авторизации через Axenta
      const backendLoginUrl = `${config.apiBaseUrl}/auth/login`;
      console.log('🔐 Attempting backend login to:', backendLoginUrl);
      console.log('🔧 Config apiBaseUrl:', config.apiBaseUrl);
      
      // Retry механизм для обработки ошибок
      const maxRetries = 3;
      let lastError: any = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 Попытка авторизации через backend ${attempt}/${maxRetries}`);
          
          const response = await axios.post(
            backendLoginUrl,
            credentials,
            {
              timeout: 15000,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('✅ Backend login response:', response.data);

          // Backend возвращает { status: "success", data: { token, user } }
          if (response.data.status === 'success' && response.data.data) {
            const responseData = response.data.data;
            
            // Проверяем тип аккаунта на стороне frontend
            if (responseData.user.accountType !== 'partner') {
              const errorMsg = `Доступ к CRM разрешен только партнерам Axenta. Ваш тип аккаунта: ${responseData.user.accountType}`;
              console.error('🚫 Access denied:', errorMsg);
              error.value = errorMsg;
              clearStorage();
              throw new Error(errorMsg);
            }

            // Используем полные данные пользователя от Axenta
            const axentaUser: User = {
              accountBlockingDatetime: responseData.user.accountBlockingDatetime,
              accountName: responseData.user.accountName,
              accountType: responseData.user.accountType,
              creatorName: responseData.user.creatorName,
              id: responseData.user.id,
              lastLogin: responseData.user.lastLogin,
              name: responseData.user.name,
              username: responseData.user.username,
              email: responseData.user.email,
              accountId: responseData.user.accountId,
              isAdmin: responseData.user.isAdmin,
              isActive: responseData.user.isActive,
              language: responseData.user.language,
              timezone: responseData.user.timezone,
            };

            user.value = axentaUser;
            token.value = responseData.token;

            // Создаем компанию на основе данных аккаунта
            company.value = {
              id: responseData.user.accountId?.toString() || "axenta-cloud",
              name: responseData.user.accountName || "Axenta Cloud",
              isActive: true,
            };

            saveToStorage();
            console.log('✅ Axenta login successful, user saved:', user.value);
            return; // Успешная авторизация, выходим из функции
          } else {
            throw new Error("Неверный формат ответа API");
          }
          
        } catch (err: any) {
          console.error(`❌ Backend login error (attempt ${attempt}):`, err);
          lastError = err;
          
          // Если это ошибка доступа (403), не повторяем попытки
          if (err.response?.status === 403) {
            console.log('🚫 Access denied - account type not allowed');
            break;
          }
          
          // Если это 502 ошибка и не последняя попытка, повторяем
          if (err.response?.status === 502 && attempt < maxRetries) {
            console.log(`⏳ Получен 502, ожидание перед повтором...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Увеличиваем задержку
            continue;
          }
          
          // Если это не 502 или последняя попытка, прерываем цикл
          break;
        }
      }
      
      // Если backend не работает, пробуем локальную авторизацию
      if (lastError) {
        console.log('🔄 Backend недоступен, пробуем локальную авторизацию...');
        
        try {
          const localLoginUrl = `${config.apiBaseUrl}/local/login`;
          console.log('🔐 Attempting local login to:', localLoginUrl);
          
          const localResponse = await axios.post(
            localLoginUrl,
            credentials,
            {
              timeout: 15000,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('✅ Local login response:', localResponse.data);

          // Локальная авторизация возвращает { status: "success", data: { access_token, user, ... } }
          if (localResponse.data.status === "success" && localResponse.data.data) {
            const responseData = localResponse.data.data;
            
            // Используем данные пользователя из ответа
            const userData = responseData.user;
            
            // Определяем тип аккаунта из company_id
            let accountType = "local";
            if (userData.company_id && userData.company_id.includes("partner")) {
              accountType = "partner";
            } else if (userData.company_id && userData.company_id.includes("client")) {
              accountType = "client";
            }
            
            // Если это не партнер, блокируем доступ
            if (accountType !== "partner") {
              const errorMsg = `Доступ к CRM разрешен только партнерам Axenta. Обнаружен тип: ${accountType}`;
              console.error('🚫 Local auth access denied:', errorMsg);
              error.value = errorMsg;
              clearStorage();
              throw new Error(errorMsg);
            }
            
            const localUser: User = {
              accountBlockingDatetime: null,
              accountName: userData.name || "Local User",
              accountType: accountType,
              creatorName: "Local Auth",
              id: userData.id.toString(),
              lastLogin: userData.last_login || new Date().toISOString(),
              name: userData.name || credentials.username,
              username: userData.username,
              email: userData.email || credentials.username,
              isAdmin: userData.role === "admin",
              isActive: userData.is_active,
              language: "ru",
              timezone: 3,
            };

            user.value = localUser;
            token.value = responseData.access_token; // Используем access_token

            // Создаем компанию на основе company_id
            company.value = {
              id: userData.company_id,
              name: "Local Company",
              isActive: true,
            };

            saveToStorage();
            console.log('✅ Local login successful, user saved:', user.value);
            return; // Успешная локальная авторизация
          }
        } catch (localError: any) {
          console.log('❌ Local login also failed:', localError);
        }
        
        // Если и локальная авторизация не сработала, показываем ошибку
        let errorMessage = "Ошибка входа в систему";
        
        if (lastError.response?.data?.detail) {
          if (Array.isArray(lastError.response.data.detail)) {
            errorMessage = lastError.response.data.detail.join(', ');
          } else {
            errorMessage = lastError.response.data.detail;
          }
        } else if (lastError.response?.status === 403) {
          errorMessage = lastError.response.data?.error || "Доступ запрещен. Проверьте права доступа.";
        } else if (lastError.response?.status === 502) {
          errorMessage = `Сервер недоступен (502) после ${maxRetries} попыток. Попробуйте позже.`;
        } else if (lastError.response?.status === 503) {
          errorMessage = "Сервис временно недоступен (503). Попробуйте позже.";
        } else if (lastError.response?.status === 504) {
          errorMessage = "Таймаут сервера (504). Попробуйте позже.";
        } else if (lastError.response?.data?.error) {
          errorMessage = lastError.response.data.error;
        } else if (lastError.message) {
          errorMessage = lastError.message;
        }
        
        error.value = errorMessage;
        clearStorage();
        throw new Error(errorMessage);
      }
      
    } catch (err: any) {
      // Дополнительная обработка ошибок на верхнем уровне
      console.error('❌ Top-level login error:', err);
      
      if (err.message && err.message.startsWith('Сервер Axenta')) {
        // Уже обработанная ошибка, просто пробрасываем
        throw err;
      }
      
      const errorMessage = err.response?.data?.error || err.message || "Ошибка входа в систему";
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
    console.log("🚪 Axenta Cloud logout initiated...");
    
    user.value = null;
    token.value = null;
    company.value = null;
    error.value = null;
    
    // Очищаем все данные авторизации
    clearStorage();
    
    // Дополнительная очистка для надежности
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("demo_token");
    localStorage.removeItem("demo_user");
    
    console.log("✅ Axenta Cloud logout completed");
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
        // Очищаем только если ID действительно некорректный (строка "1" или число 1)
        if (parsedCompany.id === "1" || parsedCompany.id === 1) {
          console.log("🔄 Обнаружены старые данные с некорректным company ID, обновляем");
          // Не очищаем все данные, а только обновляем company
          company.value = demoCompany;
          localStorage.setItem(COMPANY_KEY, JSON.stringify(demoCompany));
        }
      } catch (err) {
        console.log("🔄 Ошибка при проверке company данных:", err);
        // Не очищаем все данные, только company
        company.value = demoCompany;
        localStorage.setItem(COMPANY_KEY, JSON.stringify(demoCompany));
      }
    }
  };

  // Сначала загружаем данные при инициализации
  loadFromStorage();

  // Принудительная очистка старых данных (только если есть проблемы)
  forceCleanOldData();

  // Если после загрузки нет пользователя И нет никаких токенов в localStorage, устанавливаем демо данные
  const hasAnyStoredToken = localStorage.getItem("axenta_token") || 
                           localStorage.getItem("local_access_token") ||
                           localStorage.getItem("token");
                           
  if (!user.value && !token.value && !hasAnyStoredToken) {
    console.log("🔄 No user or tokens found anywhere, setting demo data for development");
    user.value = demoUser;
    token.value = "demo-token-" + Date.now();
    company.value = demoCompany;
    saveToStorage();
  } else if (hasAnyStoredToken && !user.value) {
    console.log("🔄 Found stored token but no user, attempting to restore...");
    // Если есть токен в localStorage, но пользователь не загрузился, попробуем еще раз
    loadFromStorage();
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
