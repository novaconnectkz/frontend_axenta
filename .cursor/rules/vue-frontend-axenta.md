# Правила для Vue-фронтенда с авторизацией

**description**: Правила для Vue-фронтенда с авторизацией  
**globs**: `/frontend_axenta/**/*.{vue,ts}`  
**alwaysApply**: true

## Общие правила разработки

1. **Vue 3 и Composition API**:

   - Используйте Vue 3 с Composition API
   - Импортируйте `defineComponent` для TypeScript компонентов
   - Используйте `<script setup>` для простых компонентов или `setup()` функцию для сложных

2. **Стиль кода**:

   - Компоненты именуйте в PascalCase (например, `UserProfile.vue`)
   - Файлы компонентов должны иметь расширение `.vue`
   - Используйте TypeScript для типизации
   - Следуйте шаблону из `@component-template.vue`
   - Используйте двойные кавычки для строк
   - Ставьте точку с запятой в конце операторов
   - Сортируйте импорты в алфавитном порядке

3. **Структура проекта**:
   - Компоненты: `frontend_axenta/src/components/`
   - Страницы: `frontend_axenta/src/views/`
   - Управление состоянием: `frontend_axenta/src/store/` (Pinia)
   - Контекст авторизации: `frontend_axenta/src/context/auth.ts`

## Управление состоянием

### Pinia Store

Используйте Pinia для управления состоянием приложения:

```typescript
// src/store/user.ts
import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    currentUser: null as User | null,
    isLoading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.currentUser,
    userName: (state) => state.currentUser?.name || "",
  },

  actions: {
    async fetchUser() {
      this.isLoading = true;
      try {
        // API call
        this.currentUser = await api.getCurrentUser();
      } finally {
        this.isLoading = false;
      }
    },
  },
});
```

## Авторизация

### Context API (provide/inject)

Используйте provide/inject в `frontend_axenta/src/context/auth.ts`:

```typescript
// src/context/auth.ts
import { inject, provide, ref } from "vue";
import axios from "axios";

interface LoginForm {
  username: string;
  password: string;
}

interface User {
  id: string;
  username: string;
  name: string;
  accountType: string;
}

interface AuthResponse {
  status: string;
  data: {
    token: string;
    user: User;
  };
}

const authSymbol = Symbol("auth");

export function provideAuth() {
  const token = ref<string | null>(localStorage.getItem("token"));
  const user = ref<User | null>(null);
  const isAuthenticated = ref(false);

  const login = async (form: LoginForm) => {
    const response = await axios.post<AuthResponse>(
      "http://localhost:8080/api/auth/login",
      form
    );

    if (response.data.status === "success") {
      token.value = response.data.data.token;
      user.value = response.data.data.user;
      isAuthenticated.value = true;
      localStorage.setItem("token", response.data.data.token);

      // Устанавливаем токен для всех последующих запросов
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${response.data.data.token}`;
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    isAuthenticated.value = false;
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
  };

  const auth = {
    token,
    user,
    isAuthenticated,
    login,
    logout,
  };

  provide(authSymbol, auth);
  return auth;
}

export function useAuth() {
  const auth = inject(authSymbol);
  if (!auth) {
    throw new Error("useAuth must be used within provideAuth");
  }
  return auth;
}
```

## API взаимодействие

### Axios конфигурация

Все API-запросы выполняйте через axios к бэкенду (`http://localhost:8080/api`):

```typescript
// src/api/client.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Интерцептор для автоматического добавления токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

## Валидация форм

### Vuetify Rules

Валидируйте поля логина и пароля (3–64 символа) с помощью Vuetify rules:

```typescript
// Правила валидации для логина
const usernameRules = [
  (v: string) => !!v || "Логин обязателен",
  (v: string) => v.length >= 3 || "Минимум 3 символа",
  (v: string) => v.length <= 64 || "Максимум 64 символа",
];

// Правила валидации для пароля
const passwordRules = [
  (v: string) => !!v || "Пароль обязателен",
  (v: string) => v.length >= 3 || "Минимум 3 символа",
  (v: string) => v.length <= 64 || "Максимум 64 символа",
];
```

## Шаблон компонента

Следуйте шаблону из `@component-template.vue`:

```vue
<template>
  <div>
    <!-- Контент компонента -->
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ComponentName",
  setup() {
    return {};
  },
});
</script>

<style scoped>
/* Стили */
</style>
```

## Пример страницы авторизации

```vue
<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-card-title>Вход в Axenta Cloud</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="login">
              <v-text-field
                v-model="form.username"
                label="Логин"
                :rules="usernameRules"
                required
              ></v-text-field>
              <v-text-field
                v-model="form.password"
                label="Пароль"
                type="password"
                :rules="passwordRules"
                required
              ></v-text-field>
              <v-btn
                type="submit"
                color="primary"
                block
                :disabled="!isValid"
                :loading="isLoading"
              >
                Войти
              </v-btn>
            </v-form>
            <v-alert v-if="error" type="error" class="mt-4">
              {{ error }}
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { useAuth } from "@/context/auth";
import { useRouter } from "vue-router";

interface LoginForm {
  username: string;
  password: string;
}

export default defineComponent({
  name: "LoginPage",
  setup() {
    const form = ref<LoginForm>({ username: "", password: "" });
    const error = ref("");
    const isLoading = ref(false);
    const auth = useAuth();
    const router = useRouter();

    const usernameRules = [
      (v: string) => !!v || "Логин обязателен",
      (v: string) => v.length >= 3 || "Минимум 3 символа",
      (v: string) => v.length <= 64 || "Максимум 64 символа",
    ];

    const passwordRules = [
      (v: string) => !!v || "Пароль обязателен",
      (v: string) => v.length >= 3 || "Минимум 3 символа",
      (v: string) => v.length <= 64 || "Максимум 64 символа",
    ];

    const isValid = computed(() => {
      return (
        form.value.username.length >= 3 &&
        form.value.username.length <= 64 &&
        form.value.password.length >= 3 &&
        form.value.password.length <= 64
      );
    });

    const login = async () => {
      if (!isValid.value) return;

      isLoading.value = true;
      error.value = "";

      try {
        await auth.login(form.value);
        router.push("/dashboard");
      } catch (err: any) {
        error.value = err.response?.data?.error || "Неверный логин или пароль";
      } finally {
        isLoading.value = false;
      }
    };

    return {
      form,
      error,
      isLoading,
      usernameRules,
      passwordRules,
      isValid,
      login,
    };
  },
});
</script>

<style scoped>
.fill-height {
  height: 100vh;
}
</style>
```

## TypeScript типы

### Основные интерфейсы

```typescript
// src/types/auth.ts
export interface User {
  id: string;
  username: string;
  name: string;
  accountName: string;
  accountType: "admin" | "manager" | "tech" | "accountant";
  creatorName: string;
  lastLogin: string;
}

export interface LoginForm {
  username: string;
  password: string;
}

export interface AuthResponse {
  status: "success" | "error";
  data?: {
    token: string;
    user: User;
  };
  error?: string;
}

// src/types/api.ts
export interface APIResponse<T = any> {
  status: "success" | "error";
  data?: T;
  error?: string;
}
```

## UI компоненты

### Vuetify

Используйте Vuetify для UI-компонентов:

- `v-container`, `v-row`, `v-col` для компоновки
- `v-card` для карточек
- `v-form`, `v-text-field`, `v-btn` для форм
- `v-alert` для уведомлений
- `v-navigation-drawer`, `v-app-bar` для навигации

### Стилизация

```vue
<style scoped>
/* Используйте scoped стили для изоляции */
.custom-component {
  margin: 16px;
  padding: 16px;
}

/* Используйте Vuetify классы когда возможно */
.mt-4 {
  margin-top: 16px;
}
.pa-4 {
  padding: 16px;
}
</style>
```

## Роутинг

### Защищенные роуты

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "Login",
      component: () => import("@/views/LoginPage.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/dashboard",
      name: "Dashboard",
      component: () => import("@/views/Dashboard.vue"),
      meta: { requiresAuth: true },
    },
  ],
});

// Navigation guards
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");

  if (to.meta.requiresAuth && !token) {
    next("/login");
  } else if (to.meta.requiresGuest && token) {
    next("/dashboard");
  } else {
    next();
  }
});

export default router;
```

## Лучшие практики

1. **Производительность**:

   - Используйте `v-show` для частых переключений
   - Используйте `v-if` для условного рендеринга
   - Применяйте `key` для списков

2. **Доступность**:

   - Добавляйте `aria-label` для интерактивных элементов
   - Используйте семантические HTML элементы

3. **Обработка ошибок**:

   - Всегда оборачивайте API вызовы в try-catch
   - Показывайте пользователю понятные сообщения об ошибках

4. **Безопасность**:
   - Не храните чувствительные данные в localStorage
   - Валидируйте данные на клиенте И сервере
   - Используйте HTTPS в продакшене
