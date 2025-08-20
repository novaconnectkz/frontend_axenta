# Mock Dashboard Data - Временное тестовое наполнение

## Обзор

Временно реализован режим mock-данных для Dashboard, чтобы не ждать загрузку с сервера. Все данные отображаются мгновенно с реалистичными тестовыми значениями.

## Что реализовано

### 1. Mock-данные (`src/services/mockDashboardData.ts`)

- **Статистика Dashboard**: объекты, пользователи, биллинг, монтажи, склад
- **Последняя активность**: 7 записей различных типов действий
- **Уведомления**: 5 уведомлений разных типов (warning, info, error, success)
- **Данные для графиков**: месячная выручка, еженедельные монтажи, категории склада
- **Макеты Dashboard**: макет по умолчанию с 6 виджетами
- **Данные виджетов**: специфичные данные для каждого типа виджета

### 2. Модифицированный сервис (`src/services/dashboardService.ts`)

- Флаг `useMockData = true` для включения mock-режима
- Все методы поддерживают как mock-данные, так и реальные API вызовы
- Минимальные задержки (20-100ms) для реалистичности
- Публичные методы для переключения режима:
  - `setMockMode(enabled: boolean)`
  - `isMockMode(): boolean`

### 3. Оптимизированный Store (`src/store/dashboard.ts`)

- Мгновенная инициализация mock-данных через `initializeMockData()`
- Новый экспорт `useDashboardStoreWithInit()` для автоматической инициализации
- Отключение состояния загрузки в mock-режиме
- Быстрая параллельная загрузка данных

### 4. Переключатель режима (`src/components/Dashboard/MockModeToggle.vue`)

- Отображается только в development режиме
- Позволяет переключаться между mock и реальными данными
- Фиксированное положение в правом верхнем углу
- Визуальная индикация текущего режима

## Использование

### Автоматическое включение

Mock-режим включен по умолчанию. При загрузке Dashboard данные отображаются мгновенно.

### Ручное переключение

В development режиме доступен переключатель в правом верхнем углу Dashboard:

- **Mock-данные** (желтый чип) - тестовые данные, быстрая загрузка
- **Реальные данные** (зеленый чип) - данные с сервера, обычная загрузка

### Программное управление

```typescript
import { dashboardService } from "@/services/dashboardService";

// Проверить текущий режим
const isMock = dashboardService.isMockMode();

// Включить mock-режим
dashboardService.setMockMode(true);

// Выключить mock-режим
dashboardService.setMockMode(false);
```

## Структура mock-данных

### Статистика объектов

```typescript
objects: {
  total: 156,
  active: 142,
  inactive: 12,
  scheduled_for_deletion: 2,
  deleted: 0
}
```

### Статистика пользователей

```typescript
users: {
  total: 28,
  active: 25,
  inactive: 3,
  admins: 4,
  regular_users: 24
}
```

### Биллинг

```typescript
billing: {
  total_revenue: 2850000,      // 2,85 млн руб
  monthly_revenue: 485000,     // 485 тыс руб
  pending_invoices: 8,
  overdue_invoices: 2,
  active_contracts: 142
}
```

### Монтажи

```typescript
installations: {
  total: 89,
  scheduled: 12,
  in_progress: 5,
  completed: 68,
  cancelled: 4,
  today_installations: 3
}
```

### Склад

```typescript
warehouse: {
  total_equipment: 1247,
  available_equipment: 856,
  installed_equipment: 312,
  reserved_equipment: 79,
  low_stock_alerts: 5,
  categories_count: 15
}
```

## Виджеты Dashboard

Все виджеты получают соответствующие mock-данные:

1. **Обзор объектов** - статистика + последние объекты
2. **Обзор пользователей** - статистика + последние пользователи
3. **Обзор биллинга** - статистика + график выручки + последние счета
4. **Обзор монтажей** - статистика + график + сегодняшние монтажи
5. **Обзор склада** - статистика + график категорий + товары с низким остатком
6. **Последняя активность** - список последних действий в системе

## Переход на реальные данные

Когда backend будет готов:

1. Установить `useMockData = false` в `dashboardService.ts`
2. Или использовать переключатель в UI
3. Или удалить mock-файлы и вернуть оригинальные методы

Mock-система полностью совместима с реальным API и не требует изменения компонентов.

## Файлы для удаления при переходе на реальные данные

- `src/services/mockDashboardData.ts`
- `src/components/Dashboard/MockModeToggle.vue`
- Этот файл `MOCK_DASHBOARD_README.md`

Также нужно будет:

- Убрать импорты mock-данных из `dashboardService.ts`
- Удалить методы `setMockMode` и `isMockMode`
- Вернуть `useDashboardStore` вместо `useDashboardStoreWithInit`
- Убрать `MockModeToggle` из `Dashboard.vue`
