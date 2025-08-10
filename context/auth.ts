import { reactive, provide, inject, type App } from 'vue';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface AuthContext extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const authState = reactive<AuthState>({
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('auth_token')
});

const login = async (email: string, password: string): Promise<void> => {
  try {
    // API call to backend
    const response = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    
    authState.token = data.token;
    authState.user = data.user;
    authState.isAuthenticated = true;
    
    localStorage.setItem('auth_token', data.token);
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

const logout = (): void => {
  authState.isAuthenticated = false;
  authState.user = null;
  authState.token = null;
  localStorage.removeItem('auth_token');
};

const checkAuth = async (): Promise<void> => {
  const token = authState.token;
  if (!token) return;

  try {
    const response = await fetch('http://localhost:8080/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const user = await response.json();
      authState.user = user;
      authState.isAuthenticated = true;
    } else {
      logout();
    }
  } catch (error) {
    console.error('Auth check error:', error);
    logout();
  }
};

const authContext: AuthContext = {
  ...authState,
  login,
  logout,
  checkAuth,
};

export const useAuthProvider = (app?: App): void => {
  if (app) {
    app.provide('auth', authContext);
  } else {
    provide('auth', authContext);
  }
  
  // Check authentication on app start
  checkAuth();
};

export const useAuth = (): AuthContext => {
  const auth = inject<AuthContext>('auth');
  if (!auth) {
    throw new Error('useAuth must be used within an auth provider');
  }
  return auth;
};