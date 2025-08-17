# Dashboard System - Система панели управления

Полнофункциональная система Dashboard с настраиваемыми виджетами и real-time обновлениями для Axenta CRM.

## Возможности

### 🎛️ Настраиваемая панель управления

- **Drag & Drop интерфейс**: Перетаскивание и изменение размеров виджетов
- **Персональные макеты**: Создание и сохранение пользовательских макетов
- **Макеты по умолчанию**: Система макетов по умолчанию для новых пользователей
- **Адаптивный дизайн**: Автоматическая адаптация под разные размеры экранов

### 📊 Виджеты обзора

- **Обзор объектов**: Статистика по объектам мониторинга
- **Обзор пользователей**: Информация о пользователях системы
- **Обзор биллинга**: Финансовая статистика и счета
- **Обзор монтажей**: Статус монтажных работ
- **Обзор склада**: Состояние складских запасов
- **Последняя активность**: Недавние действия в системе

### ⚡ Real-time обновления

- **WebSocket подключение**: Мгновенные обновления данных
- **Умное обновление**: Debounced обновления для оптимизации производительности
- **Индикаторы состояния**: Визуальные индикаторы подключения
- **Автоматическое переподключение**: Восстановление соединения при сбоях

### 🚀 Быстрые действия

- **Контекстные кнопки**: Быстрый доступ к часто используемым функциям
- **Права доступа**: Автоматическая фильтрация по правам пользователя
- **Настраиваемые действия**: Возможность добавления пользовательских действий

## Архитектура

### Компоненты

```
src/
├── components/Dashboard/
│   ├── BaseWidget.vue              # Базовый компонент виджета
│   ├── DashboardGrid.vue           # Сетка виджетов с управлением
│   ├── ObjectsOverviewWidget.vue   # Виджет обзора объектов
│   ├── UsersOverviewWidget.vue     # Виджет обзора пользователей
│   ├── BillingOverviewWidget.vue   # Виджет обзора биллинга
│   ├── InstallationsOverviewWidget.vue # Виджет обзора монтажей
│   ├── WarehouseOverviewWidget.vue # Виджет обзора склада
│   └── RecentActivityWidget.vue    # Виджет последней активности
├── services/
│   ├── dashboardService.ts         # API сервис для Dashboard
│   └── websocketService.ts         # WebSocket сервис
├── store/
│   └── dashboard.ts                # Pinia store для Dashboard
├── composables/
│   └── useRealTimeWidget.ts        # Composable для real-time виджетов
└── types/
    └── dashboard.ts                # TypeScript типы
```

### Типы данных

```typescript
interface DashboardStats {
  objects: ObjectStats;
  users: UserStats;
  billing: BillingStats;
  installations: InstallationStats;
  warehouse: WarehouseStats;
}

interface Widget {
  id: string;
  title: string;
  type: WidgetType;
  size: WidgetSize;
  position: WidgetPosition;
  config: WidgetConfig;
  visible: boolean;
}

interface DashboardLayout {
  id: string;
  name: string;
  widgets: Widget[];
  isDefault: boolean;
  userId?: string;
}
```

## Использование

### Основной Dashboard

```vue
<template>
  <DashboardGrid />
</template>

<script setup lang="ts">
import DashboardGrid from "@/components/Dashboard/DashboardGrid.vue";
</script>
```

### Создание пользовательского виджета

```vue
<template>
  <BaseWidget
    title="Мой виджет"
    icon="mdi-chart-box"
    :loading="loading"
    :error="error"
    :real-time-enabled="true"
    :is-connected="isConnected"
    @refresh="loadData"
    @configure="configureWidget"
    @remove="removeWidget"
  >
    <div v-if="data">
      <!-- Содержимое виджета -->
    </div>
  </BaseWidget>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import BaseWidget from "@/components/Dashboard/BaseWidget.vue";
import { useRealTimeWidget } from "@/composables/useRealTimeWidget";

const data = ref(null);
const loading = ref(false);
const error = ref(null);

// Real-time обновления
const realTimeWidget = useRealTimeWidget({
  widgetId: "my-custom-widget",
  updateChannels: ["my_data_update"],
  refreshInterval: 300,
});

const loadData = async () => {
  // Загрузка данных
};

// Настройка real-time обновлений
realTimeWidget.onUpdate("my_data_update", (updateData) => {
  // Обработка обновлений
});

onMounted(() => {
  loadData();
  realTimeWidget.startAutoRefresh(loadData);
});
</script>
```

### Работа с Dashboard Store

```typescript
import { useDashboardStore } from "@/store/dashboard";

const dashboardStore = useDashboardStore();

// Загрузка всех данных
await dashboardStore.refreshAll();

// Работа с виджетами
dashboardStore.addWidget(newWidget);
dashboardStore.updateWidget(widgetId, updates);
dashboardStore.removeWidget(widgetId);

// Работа с макетами
await dashboardStore.saveCurrentLayout();
await dashboardStore.switchLayout(layoutId);
await dashboardStore.setDefaultLayout(layoutId);
```

### Real-time обновления

```typescript
import { useObjectsWidget } from "@/composables/useRealTimeWidget";

// Использование специализированного composable
const realTimeWidget = useObjectsWidget("objects-overview", 300);

// Обработка обновлений
realTimeWidget.onUpdate("object_created", (data) => {
  console.log("Новый объект создан:", data);
});

// Принудительное обновление
realTimeWidget.forceUpdate(loadData);
```

## API Endpoints

### Dashboard API

```typescript
// Статистика
GET /api/dashboard/stats
// Ответ: { data: DashboardStats }

// Последняя активность
GET /api/dashboard/activity?limit=10
// Ответ: { data: ActivityItem[] }

// Данные для графиков
GET /api/dashboard/charts/{type}?range=month
// Ответ: { data: ChartData }

// Макеты
GET /api/dashboard/layouts
POST /api/dashboard/layouts
PUT /api/dashboard/layouts/{id}
DELETE /api/dashboard/layouts/{id}
PUT /api/dashboard/layouts/{id}/default

// Данные виджетов
POST /api/dashboard/widgets/{type}/data
// Тело: WidgetConfig
// Ответ: { data: any }
```

### WebSocket Events

```typescript
// Подписка на канал
{
  type: 'subscribe',
  channel: 'dashboard_updates',
  widget_id: 'objects-overview'
}

// Обновления данных
{
  type: 'object_update',
  data: { /* данные обновления */ },
  timestamp: '2024-01-15T10:30:00Z'
}

// Новая активность
{
  type: 'activity_update',
  data: ActivityItem,
  timestamp: '2024-01-15T10:30:00Z'
}
```

## Конфигурация

### Настройки виджетов

```typescript
interface WidgetConfig {
  refreshInterval?: number; // Интервал автообновления (сек)
  showHeader?: boolean; // Показывать заголовок
  customTitle?: string; // Пользовательский заголовок
  color?: string; // Цветовая схема
  chartType?: string; // Тип графика
  dataRange?: string; // Период данных
}
```

### WebSocket настройки

```typescript
// В .env файле
VITE_WS_BASE_URL=ws://localhost:8080

// Автоматическое переподключение
maxReconnectAttempts = 5
reconnectInterval = 1000ms (с экспоненциальной задержкой)
```

## Производительность

### Оптимизации

1. **Debounced обновления**: Группировка частых обновлений
2. **Lazy loading**: Загрузка виджетов по требованию
3. **Кэширование**: Кэширование статических данных
4. **Виртуализация**: Для больших списков активности
5. **Сжатие WebSocket**: Оптимизация трафика

### Мониторинг

```typescript
// Метрики производительности
const metrics = {
  widgetLoadTime: performance.now(),
  updateFrequency: updateCount / timeWindow,
  webSocketLatency: pingTime,
  cacheHitRate: hits / (hits + misses),
};
```

## Тестирование

### Unit тесты

```bash
npm run test:unit src/__tests__/dashboard.test.ts
```

### E2E тесты

```typescript
// Пример Cypress теста
describe("Dashboard", () => {
  it("должен загружать и отображать виджеты", () => {
    cy.visit("/dashboard");
    cy.get('[data-testid="objects-widget"]').should("be.visible");
    cy.get('[data-testid="users-widget"]').should("be.visible");
  });

  it("должен сохранять пользовательский макет", () => {
    cy.get('[data-testid="layout-settings"]').click();
    cy.get('[data-testid="save-layout"]').click();
    cy.get('[data-testid="success-message"]').should("be.visible");
  });
});
```

### Нагрузочное тестирование

```typescript
// WebSocket нагрузочный тест
const connections = Array.from(
  { length: 100 },
  () => new WebSocket("ws://localhost:8080/ws")
);

// Тест производительности виджетов
const loadTest = async () => {
  const startTime = performance.now();
  await Promise.all(widgets.map((widget) => widget.loadData()));
  const endTime = performance.now();
  console.log(`Время загрузки: ${endTime - startTime}ms`);
};
```

## Развертывание

### Production настройки

```bash
# Сборка для production
npm run build

# Переменные окружения
VITE_WS_BASE_URL=wss://your-domain.com
VITE_API_BASE_URL=https://your-api-domain.com
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "run", "serve"]
```

## Безопасность

### Аутентификация

- JWT токены для WebSocket подключений
- Проверка прав доступа для каждого виджета
- Tenant isolation для мультитенантности

### Валидация данных

```typescript
// Валидация WebSocket сообщений
const validateMessage = (message: any): boolean => {
  return (
    message.type && message.timestamp && isValidTimestamp(message.timestamp)
  );
};
```

## Расширение

### Добавление нового виджета

1. Создать компонент виджета, наследующий BaseWidget
2. Добавить тип виджета в `WidgetType`
3. Зарегистрировать в `DashboardGrid.vue`
4. Создать специализированный composable
5. Добавить API endpoint для данных

### Кастомные макеты

```typescript
const customLayout: DashboardLayout = {
  id: "custom-layout-1",
  name: "Мой макет",
  widgets: [
    // Конфигурация виджетов
  ],
  isDefault: false,
};

await dashboardStore.saveLayout(customLayout);
```

## Поддержка

### Логирование

```typescript
// Структурированное логирование
const logger = {
  info: (message: string, meta?: any) =>
    console.log({ level: "info", message, meta }),
  error: (message: string, error?: Error) =>
    console.error({ level: "error", message, error }),
  debug: (message: string, data?: any) =>
    console.debug({ level: "debug", message, data }),
};
```

### Мониторинг ошибок

```typescript
// Интеграция с системами мониторинга
window.addEventListener("error", (event) => {
  // Отправка ошибки в систему мониторинга
  errorTracker.captureException(event.error);
});
```

## Changelog

### v1.0.0 (2024-01-15)

- ✅ Базовая система Dashboard с виджетами
- ✅ Real-time обновления через WebSocket
- ✅ Настраиваемые макеты
- ✅ Система прав доступа
- ✅ Responsive дизайн
- ✅ Unit и E2E тесты
- ✅ Документация

### Планируемые функции

- [ ] Экспорт Dashboard в PDF
- [ ] Темная тема
- [ ] Дополнительные типы графиков
- [ ] Мобильное приложение
- [ ] AI-рекомендации по макетам
