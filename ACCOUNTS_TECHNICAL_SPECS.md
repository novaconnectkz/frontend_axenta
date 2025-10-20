# Техническая спецификация страницы "Учетные записи"

## 📋 Обзор

Страница `/accounts` представляет собой полнофункциональный интерфейс управления учетными записями в системе Axenta CRM, построенный на Vue 3 с использованием Composition API и Vuetify 3.

## 🏗 Архитектура

### Компонентная структура
```
AccountsPage.vue (3800+ строк)
├── Template (HTML разметка)
│   ├── Заголовок страницы
│   ├── Статистические карточки (AppleCard)
│   ├── Панель фильтров
│   ├── Таблица данных (v-data-table)
│   ├── Пагинация
│   └── Диалоги (удаление, перемещение)
├── Script (TypeScript логика)
│   ├── Реактивные данные (ref)
│   ├── Вычисляемые свойства (computed)
│   ├── Методы жизненного цикла
│   ├── API интеграция
│   └── Обработчики событий
└── Styles (Scoped CSS)
    ├── Базовые стили
    ├── Темная тема
    ├── Адаптивность
    └── Анимации
```

## 🔧 Технические детали

### Реактивные данные
```typescript
// Основные данные
const accounts = ref<Account[]>([]);
const isLoading = ref(false);
const isBackgroundLoading = ref(false);

// Фильтрация и поиск
const searchQuery = ref('');
const filters = ref<AccountsFilters>({
  type: null,
  is_active: null,
});
const selectedParent = ref<string>('');

// Пагинация
const currentPage = ref(1);
const itemsPerPage = ref(10);
const totalItems = ref(0);

// Кэширование
const allAccountsCache = ref<Account[]>([]);
const cacheTimestamp = ref<Date | null>(null);
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

// Автообновление
const autoRefreshInterval = ref<NodeJS.Timeout | null>(null);
const AUTO_REFRESH_DELAY = 60000; // 1 минута
```

### API интеграция
```typescript
// Основные методы
- getAccounts(filters) - получение списка аккаунтов
- getAccountsStats() - получение статистики
- toggleAccountStatus(id, isActive) - переключение статуса
- loginAs(userId, type) - вход в системы
- moveAccount(accountId, targetAccountId) - перемещение
- deleteAccount(id) - удаление аккаунта
```

### Система фильтрации

#### Гибридная фильтрация
- **Серверная фильтрация**: тип аккаунта, поиск по названию, родительский аккаунт
- **Клиентская фильтрация**: статус аккаунта (is_active)
- **Кэширование**: для клиентской фильтрации используется кэш на 5 минут

#### Множественный поиск
```typescript
// Поддержка поиска по нескольким компаниям через запятую
const isMultipleCompanySearch = computed(() => {
  if (!searchQuery.value) return false;
  const searchTerms = searchQuery.value.split(',')
    .map(term => term.trim())
    .filter(term => term.length > 0);
  return searchTerms.length > 1;
});
```

### Производительность

#### Кэширование
- **Время жизни кэша**: 5 минут
- **Область кэширования**: все аккаунты для клиентской фильтрации
- **Инвалидация**: при изменении фильтров или поиска

#### Умное обновление
```typescript
// Сравнение данных перед обновлением
const areAccountsEqual = (oldAccounts: Account[], newAccounts: Account[]): boolean => {
  if (oldAccounts.length !== newAccounts.length) return false;
  
  for (let i = 0; i < oldAccounts.length; i++) {
    const oldAcc = oldAccounts[i];
    const newAcc = newAccounts[i];
    
    if (
      oldAcc.id !== newAcc.id ||
      oldAcc.name !== newAcc.name ||
      oldAcc.isActive !== newAcc.isActive ||
      // ... другие ключевые поля
    ) {
      return false;
    }
  }
  
  return true;
};
```

#### Плавные анимации
```typescript
// Анимированное обновление статистики
const updateStatsSmooth = async (newStats: typeof stats.value): Promise<void> => {
  return new Promise((resolve) => {
    const duration = 500; // 500ms
    const startTime = Date.now();
    const startStats = { ...stats.value };
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Интерполяция значений
      stats.value = {
        total: Math.round(startStats.total + (newStats.total - startStats.total) * progress),
        active: Math.round(startStats.active + (newStats.active - startStats.active) * progress),
        // ... другие поля
      };
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    };
    
    requestAnimationFrame(animate);
  });
};
```

## 🎨 UI/UX особенности

### Дизайн в стиле Apple
- **Минималистичный интерфейс** с чистыми линиями
- **Карточки статистики** с градиентными фонами
- **Плавные переходы** и hover-эффекты
- **Компактная пагинация** с элегантными элементами управления

### Темная тема
```css
[data-theme="dark"] .accounts-page {
  background-color: #1a1a1a;
}

[data-theme="dark"] .accounts-table-card {
  background-color: #2c2c2e;
  border: 1px solid #3a3a3c;
}

[data-theme="dark"] .popup-header {
  background: linear-gradient(135deg, #2c2c2e 0%, #1a1a1a 100%);
}
```

### Адаптивность
```css
@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
```

## 🔍 Детальные подсказки

### ID подсказка
```vue
<template #item.id="{ item }">
  <v-tooltip location="top" persistent>
    <template #activator="{ props }">
      <span class="id-minimal" v-bind="props">{{ item.id }}</span>
    </template>
    <div class="id-popup draggable-popup">
      <div class="popup-header">
        <div class="popup-icon">
          <v-icon>mdi-domain</v-icon>
        </div>
        <div class="popup-title">{{ item.name }}</div>
      </div>
      <div class="popup-content">
        <!-- Детальная информация -->
      </div>
    </div>
  </v-tooltip>
</template>
```

### Объекты подсказка
```vue
<template #item.objectsTotal="{ item }">
  <v-tooltip location="top" persistent>
    <template #activator="{ props }">
      <div class="objects-compact" v-bind="props">
        <span class="objects-active">{{ item.objectsActive || 0 }}</span>
        <span class="objects-separator">/</span>
        <span class="objects-total">{{ item.objectsTotal || 0 }}</span>
      </div>
    </template>
    <div class="objects-popup draggable-popup">
      <!-- Статистика по объектам -->
    </div>
  </v-tooltip>
</template>
```

## ⚡ Оптимизация производительности

### Debounce поиска
```typescript
const debouncedSearch = debounce(() => {
  currentPage.value = 1;
  allAccountsCache.value = [];
  cacheTimestamp.value = null;
  loadAccounts();
}, 500);
```

### Ленивая загрузка
- Данные загружаются только при необходимости
- Кэширование для повторных запросов
- Фоновое обновление без прерывания работы

### Обработка ошибок
```typescript
try {
  const response = await accountsService.getAccounts(requestParams);
  // Обработка успешного ответа
} catch (error: any) {
  console.error('❌ Ошибка загрузки учетных записей:', error);
  
  if (error.response?.status === 401) {
    // Перенаправление на логин
  } else if (error.response?.status === 403) {
    // Уведомление о недостатке прав
  }
  
  showSnackbar('Ошибка загрузки данных', 'error');
}
```

## 🧪 Тестирование

### Unit тесты
- Тестирование методов фильтрации
- Тестирование API интеграции
- Тестирование вычисляемых свойств

### E2E тесты
- Полный цикл работы с аккаунтами
- Тестирование фильтрации и поиска
- Тестирование действий с аккаунтами

### Отладка
```javascript
// Консольные команды для отладки
console.log('Accounts:', this.accounts);
console.log('Filters:', this.filters);
console.log('Cache:', this.allAccountsCache);
```

## 📈 Метрики производительности

- **Время загрузки**: < 2 секунд
- **Время отклика фильтров**: < 500ms
- **Память**: ~50MB для 1000 записей
- **Размер бандла**: ~200KB (сжатый)

## 🔮 Планы развития

1. **Виртуализация таблицы** для больших объемов данных
2. **WebSocket интеграция** для real-time обновлений
3. **Service Worker** для офлайн работы
4. **GraphQL** для оптимизации запросов
5. **Машинное обучение** для умных фильтров
