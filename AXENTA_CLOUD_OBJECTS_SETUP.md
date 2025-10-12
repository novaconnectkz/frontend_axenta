# Настройка работы с Axenta Cloud Objects API

## Описание

Этот документ описывает настройку фронтенда для работы с Axenta Cloud API endpoint `/cms/objects/` с использованием авторизации через логин, пароль и токен.

## Быстрая настройка

### 1. Создание файла конфигурации

Создайте файл `.env.local` в корне проекта frontend_axenta:

```bash
# Конфигурация фронтенда Axenta для работы с Axenta Cloud
VITE_BACKEND_URL=https://axenta.cloud
VITE_WS_BASE_URL=ws://localhost:8080
VITE_APP_NAME=Axenta CRM
VITE_API_VERSION=v1
VITE_APP_ENV=development
VITE_API_TIMEOUT=30000
```

### 2. API Endpoints

После настройки будут использоваться следующие endpoints:

- **Основной endpoint объектов**: `https://axenta.cloud/api/cms/objects/?page=1&per_page=50&ordering=name`
- **Статистика объектов**: `https://axenta.cloud/api/cms/objects/stats/`
- **Авторизация**: `https://axenta.cloud/api/auth/login`

### 3. Авторизация

Система автоматически использует:
- **Логин и пароль** для получения токена через `/api/auth/login`
- **Токен** в заголовке `Authorization: Token <your-token>`
- **Tenant ID** в заголовке `X-Tenant-ID` (если доступен)

## Структура запроса к объектам

### Параметры запроса

```typescript
const params = {
  page: 1,                    // Номер страницы
  per_page: 50,              // Количество элементов на странице
  ordering: "name",          // Сортировка (name, -name, created_at, etc.)
  
  // Дополнительные фильтры (опционально)
  status: "active",          // Статус объекта
  type: "vehicle",           // Тип объекта
  search: "поиск",           // Поисковый запрос
  contract_id: 123,          // ID контракта
  location_id: 456,          // ID локации
  template_id: 789,          // ID шаблона
  has_scheduled_delete: false, // Есть ли запланированное удаление
  is_active: true,           // Активен ли объект
  accountName: "Компания",   // Название аккаунта
  creatorName: "Пользователь", // Имя создателя
  deviceTypeName: "GPS",     // Тип устройства
  uniqueId: "12345"          // Уникальный ID
}
```

### Пример полного URL

```
https://axenta.cloud/api/cms/objects/?page=1&per_page=50&ordering=name&status=active&search=объект
```

## Заголовки авторизации

Система автоматически добавляет следующие заголовки:

```http
Authorization: Token <your-axenta-token>
X-Tenant-ID: <company-id>
Content-Type: application/json
```

## Fallback система

Если Axenta Cloud CMS API недоступен, система автоматически попробует:

1. **Первый fallback**: `/api/auth/objects` (аутентифицированный endpoint)
2. **Второй fallback**: `/api/objects` (публичный endpoint)

## Логирование

Все запросы логируются в консоль браузера:

- ✅ Успешные запросы: `Axenta Cloud CMS objects API response`
- 🔍 Ошибки: `Error in getObjects (Axenta Cloud CMS)`
- 🔄 Fallback: `Fallback to auth/public endpoint`

## Использование в коде

### Получение объектов

```typescript
import { getObjectsService } from '@/services/objectsService';

const objectsService = getObjectsService();

// Получение списка объектов
const response = await objectsService.getObjects(1, 50, {
  ordering: 'name',
  status: 'active',
  search: 'поиск'
});

// Получение статистики
const stats = await objectsService.getObjectsStats();
```

### В компоненте Vue

```vue
<script setup lang="ts">
import { getObjectsService } from '@/services/objectsService';

const objectsService = getObjectsService();

const loadObjects = async () => {
  try {
    const data = await objectsService.getObjects(1, 50, {
      ordering: 'name'
    });
    console.log('Объекты загружены:', data);
  } catch (error) {
    console.error('Ошибка загрузки объектов:', error);
  }
};
</script>
```

## Проверка работы

1. Откройте DevTools (F12)
2. Перейдите в раздел "Объекты"
3. Проверьте в Network tab запросы к `https://axenta.cloud/api/cms/objects/`
4. Убедитесь, что заголовки авторизации присутствуют

## Устранение проблем

### Ошибка 401 (Unauthorized)
- Проверьте правильность логина и пароля
- Убедитесь, что токен не истек
- Проверьте тип аккаунта (должен быть 'partner')

### Ошибка 404 (Not Found)
- Проверьте правильность URL в VITE_BACKEND_URL
- Убедитесь, что endpoint `/cms/objects/` существует

### Ошибка CORS
- Убедитесь, что домен разрешен в настройках Axenta Cloud
- Проверьте настройки CORS на сервере

## Дополнительные возможности

### Экспорт объектов
```typescript
const blob = await objectsService.exportObjects('csv', {
  status: 'active',
  ordering: 'name'
});
```

### Работа с шаблонами
```typescript
const templates = await objectsService.getObjectTemplates();
```

### Создание объекта
```typescript
const newObject = await objectsService.createObject({
  name: 'Новый объект',
  type: 'vehicle',
  // ... другие поля
});
```
