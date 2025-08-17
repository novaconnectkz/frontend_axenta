# Система аутентификации Frontend Axenta CRM

## Обзор

Система аутентификации предоставляет полную поддержку мультитенантной аутентификации с JWT токенами, автоматическим обновлением, защищенными маршрутами и обработкой ошибок.

## Компоненты системы

### 1. Контекст аутентификации (`src/context/auth.ts`)

Основной контекст для управления состоянием аутентификации.

**Функции:**

- Управление JWT токенами с автоматическим обновлением
- Хранение данных пользователя и компании в localStorage
- Проверка истечения токенов
- HTTP клиент с автоматическим добавлением заголовков
- Проверка ролей и прав доступа

**Использование:**

```typescript
import { useAuth } from "@/context/auth";

const auth = useAuth();

// Вход в систему
await auth.login({ username: "user", password: "pass" });

// Проверка аутентификации
if (auth.isAuthenticated.value) {
  // Пользователь авторизован
}

// Проверка прав
if (auth.hasPermission("users.create")) {
  // Пользователь может создавать пользователей
}

// Выход из системы
auth.logout();
```

### 2. Компонент входа (`src/components/AuthLogin.vue`)

Современный компонент входа в систему с поддержкой мультитенантности.

**Возможности:**

- Валидация полей в реальном времени
- Опциональное поле для указания ID компании
- Обработка ошибок с детальными сообщениями
- Адаптивный дизайн
- Индикатор статуса подключения

### 3. Защищенные маршруты (`src/router/guards.ts`)

Система guards для защиты маршрутов.

**Guards:**

- `authGuard` - проверка аутентификации
- `roleGuard` - проверка ролей
- `permissionGuard` - проверка прав доступа
- `accessGuard` - комбинированная проверка
- `titleGuard` - установка заголовков страниц

**Утилиты для создания маршрутов:**

```typescript
import { createProtectedRoute, createGuestRoute } from "@/router/guards";

// Защищенный маршрут
createProtectedRoute("/users", UsersComponent, {
  title: "Управление пользователями",
  permissions: ["users.view"],
});

// Маршрут только для гостей
createGuestRoute("/login", LoginComponent, {
  title: "Вход в систему",
});
```

### 4. Обработка ошибок (`src/utils/errorHandler.ts`)

Глобальная система обработки ошибок.

**Типы ошибок:**

- `AuthError` - ошибки аутентификации
- `NetworkError` - сетевые ошибки
- `ValidationError` - ошибки валидации
- `PermissionError` - ошибки прав доступа

## Настройка

### 1. Инициализация в main.ts

```typescript
import { useAuthProvider } from "./context/auth";
import { setupGlobalErrorHandler } from "./utils/errorHandler";

// Настройка обработчика ошибок
setupGlobalErrorHandler(app);

// Настройка контекста аутентификации
app.provide("authProvider", useAuthProvider());
```

### 2. Настройка роутера

```typescript
import { accessGuard, titleGuard } from "./router/guards";

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Глобальные guards
router.beforeEach(accessGuard);
router.beforeEach(titleGuard);
```

## Мультитенантность

Система поддерживает мультитенантность через:

1. **Заголовок X-Tenant-ID** - автоматически добавляется к запросам
2. **Поле tenantId** в форме входа - опциональное указание компании
3. **Информация о компании** - сохраняется в контексте аутентификации

## Безопасность

### JWT токены

- Автоматическая проверка истечения
- Безопасное хранение в localStorage
- Автоматическое обновление при истечении
- Очистка при выходе из системы

### Защита маршрутов

- Проверка аутентификации
- Проверка ролей и прав доступа
- Перенаправление на страницы ошибок
- Сохранение пути для редиректа после входа

### Обработка ошибок

- Автоматический выход при ошибках аутентификации
- Логирование всех ошибок
- Пользовательские сообщения об ошибках
- Очередь ошибок для отладки

## Тестирование

### Unit тесты

```bash
# Запуск тестов
npm run test

# Запуск с UI
npm run test:ui

# Покрытие кода
npm run test:coverage
```

**Покрываемые сценарии:**

- Инициализация контекста
- Загрузка из localStorage
- Процесс входа/выхода
- Проверка токенов
- Работа guards
- Обработка ошибок

## API интеграция

### Backend endpoints

```typescript
// Вход в систему
POST /api/auth/login
{
  "username": "user",
  "password": "pass",
  "tenantId": "optional"
}

// Обновление токена
POST /api/auth/refresh
Headers: {
  "Authorization": "Token <token>",
  "X-Tenant-ID": "<tenant_id>"
}
```

### Автоматические заголовки

Все запросы через `auth.apiClient` автоматически включают:

- `Authorization: Token <jwt_token>`
- `X-Tenant-ID: <company_id>` (если указана компания)

## Обработка ошибок

### Автоматические действия

1. **401 Unauthorized** - автоматический выход из системы
2. **403 Forbidden** - перенаправление на страницу "Доступ запрещен"
3. **Сетевые ошибки** - показ сообщения о проблемах с подключением
4. **Ошибки валидации** - показ детальных сообщений о полях

### Пользовательские страницы ошибок

- `/access-denied` - доступ запрещен
- `/not-found` - страница не найдена

## Расширение системы

### Добавление новых ролей

```typescript
// В types/index.ts
export const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  TECH: "tech",
  ACCOUNTANT: "accountant",
  // Новая роль
  SUPERVISOR: "supervisor",
} as const;
```

### Добавление новых прав доступа

```typescript
// В контексте аутентификации
const hasPermission = (permission: string): boolean => {
  if (!user.value) return false;

  // Логика проверки прав
  // Можно расширить для работы с ролями из backend
  return user.value.isAdmin || checkUserPermissions(permission);
};
```

### Кастомные guards

```typescript
import type { NavigationGuardNext, RouteLocationNormalized } from "vue-router";

export const customGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  // Кастомная логика
  if (customCheck()) {
    next();
  } else {
    next("/custom-error");
  }
};
```

## Отладка

### Логирование

Все ошибки автоматически логируются в консоль с детальной информацией:

```typescript
import { globalErrorHandler } from "@/utils/errorHandler";

// Получение последних ошибок
const recentErrors = globalErrorHandler.getRecentErrors();

// Очистка ошибок
globalErrorHandler.clearErrors();
```

### Разработка

В режиме разработки доступна дополнительная информация:

- Детальные сообщения об ошибках
- Логирование всех операций аутентификации
- Состояние токенов в localStorage

## Производительность

### Оптимизации

1. **Lazy loading** - компоненты загружаются по требованию
2. **Кэширование** - данные компании кэшируются
3. **Автоматическая очистка** - интервалы очищаются при выходе
4. **Минимальные запросы** - токены обновляются только при необходимости

### Мониторинг

- Отслеживание времени ответа API
- Статистика ошибок аутентификации
- Мониторинг истечения токенов
