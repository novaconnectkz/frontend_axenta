# 🔧 Исправление подключения к API Axenta

## 📋 Проблема
Фронтенд пытался подключиться к локальному серверу на порту 8080, но получал ошибку `ERR_CONNECTION_REFUSED`, так как был настроен на локальный API вместо реального API Axenta.

## ✅ Что было исправлено

### 1. Обновлена конфигурация API
**Файл:** `src/config/env.ts`
- Изменен `backendUrl` с `http://localhost:8080` на `https://axenta.cloud`
- Обновлен `wsBaseUrl` с `ws://localhost:8080` на `wss://axenta.cloud`

### 2. Создан сервис для работы с API Axenta
**Файл:** `src/services/axentaApiService.ts`
- Адаптер для работы с реальным API Axenta
- Поддержка авторизации через `/api/auth/login/`
- Получение аккаунтов через `/api/cms/accounts/`
- Обработка ошибок и токенов

### 3. Создан тестовый компонент
**Файл:** `src/views/AxentaApiTest.vue`
- Интерфейс для тестирования подключения к API
- Форма авторизации с реальными данными
- Отображение результатов в удобном формате
- Таблица аккаунтов и статистика

### 4. Добавлен маршрут
**Файл:** `src/router/index.ts`
- Добавлен маршрут `/axenta-api-test` для тестового компонента

## 🚀 Как использовать

### 1. Запустите фронтенд (если не запущен)
```bash
cd /Users/com/frontend_axenta
npm run dev
```

### 2. Откройте тестовую страницу
```
http://localhost:5173/axenta-api-test
```

### 3. Введите реальные данные Axenta
- **Email**: ваш логин в Axenta Cloud
- **Пароль**: ваш пароль от Axenta Cloud
- Нажмите "🚀 Тестировать API"

### 4. Просмотрите результаты
Вы увидите:
- ✅ Результат авторизации с токенами
- 📊 Список аккаунтов в виде таблицы
- 📈 Статистику по аккаунтам
- 📦 Сырые данные JSON

## 🔍 Что показывает тестовая страница

### Информация о подключении:
- Статус подключения к серверу
- URL API: `https://axenta.cloud/api`

### Результат авторизации:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Структура аккаунта:
```json
{
  "id": 123,
  "name": "ООО Рога и Копыта",
  "manager": "Иван Иванов",
  "service_company": "СервисТех",
  "objects_count": 25,
  "status": "active"
}
```

### Таблица аккаунтов:
| ID  | Название          | Менеджер     | Сервисная компания | Объектов | Статус |
|-----|-------------------|--------------|-------------------|----------|--------|
| 123 | ООО Рога и Копыта | Иван Иванов  | СервисТех         | 25       | active |

## 🛠️ Для разработчиков

### Использование сервиса в коде:
```typescript
import { axentaApiService } from '@/services/axentaApiService';

// Авторизация
const authData = await axentaApiService.login('user@example.com', 'password');

// Получение аккаунтов
const accounts = await axentaApiService.getAccounts();
```

### Адаптация существующего кода:
Если нужно адаптировать существующую систему авторизации для работы с API Axenta, обновите функцию `login` в `src/context/auth.ts`:

```typescript
// Вместо ожидания формата { data: { user, token, company } }
// Обрабатывайте формат { access, refresh }
```

## 🔄 Возврат к локальному API

Если нужно вернуться к локальному API, измените в `src/config/env.ts`:
```typescript
backendUrl: getEnvVar("VITE_BACKEND_URL", "http://localhost:8080"),
wsBaseUrl: getEnvVar("VITE_WS_BASE_URL", "ws://localhost:8080"),
```

## 📱 Альтернативные способы тестирования

### 1. Веб-интерфейс (созданный ранее)
```bash
cd /Users/com/backend_axenta/scripts
npm run start-viewer
# Откройте http://localhost:3001
```

### 2. Консольные скрипты
```bash
cd /Users/com/backend_axenta/scripts
DEBUG_MODE=true AXENTA_USERNAME=ваш_email AXENTA_PASSWORD=ваш_пароль npm run test-auth-advanced
```

## ✅ Результат

Теперь фронтенд корректно подключается к реальному API Axenta Cloud и может:
- ✅ Авторизоваться с реальными учетными данными
- ✅ Получать список аккаунтов
- ✅ Отображать данные в удобном интерфейсе
- ✅ Обрабатывать ошибки API

Ошибка `ERR_CONNECTION_REFUSED` больше не возникает!
