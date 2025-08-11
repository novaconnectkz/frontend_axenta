# Vue Frontend Axenta Cloud

## Описание

Фронтенд приложение для системы управления складом и устройствами Axenta Cloud, построенное на Vue 3, TypeScript, Vuetify и Pinia.

## Технологический стек

- **Vue 3** с Composition API
- **TypeScript** для типизации
- **Vuetify 3** для UI компонентов
- **Pinia** для управления состоянием
- **Vue Router** для роутинга
- **Axios** для API запросов

## Структура проекта

```
src/
├── components/         # Переиспользуемые компоненты
│   └── component-template.vue
├── views/             # Страницы приложения
│   ├── LoginPage.vue
│   ├── Dashboard.vue
│   └── Billing.vue
├── store/             # Pinia stores
│   ├── index.ts
│   ├── user.ts
│   └── devices.ts
├── context/           # Контексты (provide/inject)
│   └── auth.ts
├── router/            # Конфигурация роутинга
│   └── index.ts
├── types/             # TypeScript типы
│   └── index.ts
└── main.ts           # Точка входа
```

## Установка и запуск

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build

# Предварительный просмотр сборки
npm run preview
```

## Авторизация

### Настройка

Авторизация настраивается через `provideAuth()` в главном компоненте:

```typescript
// main.ts или App.vue
import { provideAuth } from "@/context/auth";

export default defineComponent({
  setup() {
    const auth = provideAuth();
    return { auth };
  },
});
```

### Использование в компонентах

```vue
<script lang="ts">
import { defineComponent } from "vue";
import { useAuth } from "@/context/auth";

export default defineComponent({
  setup() {
    const auth = useAuth();

    const handleLogin = async () => {
      try {
        await auth.login({ username: "user", password: "pass" });
        // Успешная авторизация
      } catch (error) {
        // Обработка ошибки
      }
    };

    return { auth, handleLogin };
  },
});
</script>
```

### Роли пользователей

- **admin**: Все права доступа
- **manager**: Управление складом, пользователями, отчеты
- **tech**: Резервирование и установка устройств для назначенных заказов
- **accountant**: Просмотр списков и отчетов

## Управление состоянием (Pinia)

### User Store

```typescript
import { useUserStore } from "@/store/user";

const userStore = useUserStore();

// Получение текущего пользователя
await userStore.fetchCurrentUser();

// Проверка прав
if (userStore.isAdmin) {
  // Действия для администратора
}
```

### Device Store

```typescript
import { useDeviceStore } from "@/store/devices";

const deviceStore = useDeviceStore();

// Загрузка устройств
await deviceStore.fetchDevices({ status: "available" });

// Резервирование устройства
await deviceStore.reserveDevice("device-id", "order-id", "tech-id");
```

## Компоненты

### Шаблон компонента

Используйте базовый шаблон из `component-template.vue`:

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

## Валидация форм

### Правила валидации

```typescript
// Валидация логина (3-64 символа)
const usernameRules = [
  (v: string) => !!v || "Логин обязателен",
  (v: string) => v.length >= 3 || "Минимум 3 символа",
  (v: string) => v.length <= 64 || "Максимум 64 символа",
];

// Валидация пароля (3-64 символа)
const passwordRules = [
  (v: string) => !!v || "Пароль обязателен",
  (v: string) => v.length >= 3 || "Минимум 3 символа",
  (v: string) => v.length <= 64 || "Максимум 64 символа",
];
```

### Использование в формах

```vue
<template>
  <v-form @submit.prevent="handleSubmit" ref="form">
    <v-text-field
      v-model="username"
      label="Логин"
      :rules="usernameRules"
      required
    />
    <v-btn type="submit" :disabled="!isValid"> Отправить </v-btn>
  </v-form>
</template>
```

## API взаимодействие

### Базовая настройка

```typescript
// context/auth.ts уже настраивает axios:
axios.defaults.baseURL = "http://localhost:8080/api";
axios.defaults.timeout = 10000;

// Автоматическое добавление токена
axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
```

### Использование в компонентах

```typescript
import axios from "axios";

// GET запрос
const response = await axios.get("/objects");

// POST запрос
const response = await axios.post("/objects", {
  name: "Device Name",
  modelId: "model-123",
});

// Обработка ответа
if (response.data.status === "success") {
  console.log(response.data.data);
} else {
  console.error(response.data.error);
}
```

## Роутинг

### Защищенные роуты

```typescript
// router/index.ts
const routes = [
  {
    path: "/login",
    component: LoginPage,
    meta: { requiresGuest: true },
  },
  {
    path: "/dashboard",
    component: Dashboard,
    meta: {
      requiresAuth: true,
      roles: ["admin", "manager"],
    },
  },
];

// Middleware для проверки авторизации
router.beforeEach((to, from, next) => {
  const auth = useAuth();

  if (to.meta.requiresAuth && !auth.isAuthenticated.value) {
    next("/login");
  } else if (to.meta.requiresGuest && auth.isAuthenticated.value) {
    next("/dashboard");
  } else {
    next();
  }
});
```

## Стилизация

### Vuetify классы

```vue
<template>
  <!-- Используйте встроенные классы Vuetify -->
  <div class="pa-4 ma-2">
    <v-card class="elevation-2">
      <v-card-title class="text-h5"> Заголовок </v-card-title>
    </v-card>
  </div>
</template>
```

### Кастомные стили

```vue
<style scoped>
/* Используйте scoped для изоляции стилей */
.custom-component {
  border-radius: 8px;
  transition: all 0.3s ease;
}

/* Адаптивность */
@media (max-width: 768px) {
  .custom-component {
    padding: 8px;
  }
}
</style>
```

## Лучшие практики

### 1. Компоненты

- Используйте PascalCase для имен компонентов
- Всегда указывайте `name` в defineComponent
- Применяйте TypeScript типизацию для props
- Используйте scoped стили

### 2. Стандарты кодирования

- Используйте двойные кавычки для строк
- Ставьте точку с запятой в конце операторов
- Сортируйте импорты в алфавитном порядке
- Используйте консистентное форматирование кода

### 3. Composition API

- Группируйте логику по функциональности
- Выносите сложную логику в composables
- Используйте computed для производных значений
- Применяйте ref для примитивов, reactive для объектов

### 4. Управление состоянием

- Используйте Pinia для глобального состояния
- Локальное состояние держите в компонентах
- Применяйте типизацию для stores
- Разделяйте stores по доменам (user, devices, etc.)

### 5. API запросы

- Всегда обрабатывайте ошибки
- Используйте loading состояния
- Применяйте типизацию для ответов API
- Кешируйте данные в stores

### 6. Безопасность

- Валидируйте данные на клиенте И сервере
- Не храните чувствительные данные в localStorage
- Используйте HTTPS в продакшене
- Проверяйте права доступа для каждого действия

## Отладка

### Vue DevTools

Установите расширение Vue DevTools для браузера для отладки:

- Состояние компонентов
- Pinia stores
- Router навигация
- Timeline событий

### Логирование

```typescript
// Включите логирование в development
if (import.meta.env.DEV) {
  console.log("Debug info:", data);
}
```

## Тестирование

Примеры тестовых сценариев:

1. **Авторизация:**

   - Ввод корректных данных
   - Обработка ошибок
   - Сохранение токена

2. **Навигация:**

   - Защищенные роуты
   - Права доступа по ролям

3. **CRUD операции:**
   - Создание устройств
   - Редактирование данных
   - Удаление с подтверждением

## Сборка и деплой

```bash
# Сборка для продакшена
npm run build

# Проверка сборки
npm run preview

# Анализ размера bundle
npm run build -- --analyze
```

## Поддержка браузеров

- Chrome (последние 2 версии)
- Firefox (последние 2 версии)
- Safari (последние 2 версии)
- Edge (последние 2 версии)
