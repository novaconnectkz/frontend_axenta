import { config } from "@/config/env";
import axios from "axios";
import {
  computed,
  type ComputedRef,
  inject,
  type InjectionKey,
  provide,
  ref,
  type Ref,
} from "vue";

export interface User {
  accountBlockingDatetime: string;
  accountName: string;
  accountType: string;
  creatorName: string;
  id: string;
  lastLogin: string;
  name: string;
  username: string;
}

export interface LoginForm {
  username: string;
  password: string;
}

export interface AuthResponse {
  data: {
    user: User;
    token: string;
  };
}

export interface AuthContext {
  user: Ref<User | null>;
  token: Ref<string | null>;
  login: (credentials: LoginForm) => Promise<void>;
  logout: () => void;
  isAuthenticated: ComputedRef<boolean>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  clearError: () => void;
}

export const AuthKey: InjectionKey<AuthContext> = Symbol("auth");

export function useAuthProvider() {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!user.value && !!token.value);

  const login = async (credentials: LoginForm) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await axios.post(
        `${config.apiBaseUrl}/login`,
        credentials
      );
      user.value = response.data.data.user;
      token.value = response.data.data.token;
    } catch (err: any) {
      error.value = err.response?.data?.error || "Login failed";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = () => {
    user.value = null;
    token.value = null;
    error.value = null;
  };

  const clearError = () => {
    error.value = null;
  };

  const authContext: AuthContext = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    isLoading,
    error,
    clearError,
  };

  provide(AuthKey, authContext);
}

export function useAuth() {
  const auth = inject<AuthContext>(AuthKey);
  if (!auth) throw new Error("Auth context not provided");
  return auth;
}
