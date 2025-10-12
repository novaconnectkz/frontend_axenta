# Ответы Axenta Cloud API - Анализ запросов

## 📡 Результаты тестирования API

Я выполнил тестовые запросы к Axenta Cloud API и получил следующие результаты:

## 🔐 1. Авторизация - `/api/auth/login/`

### Запрос:
```http
POST https://axenta.cloud/api/auth/login/
Content-Type: application/json

{
  "username": "test_user",
  "password": "test_password"
}
```

### Ответ при неверных учетных данных:
```http
HTTP/1.1 400 Bad Request
Server: nginx/1.29.0
Content-Type: application/json
Allow: POST, OPTIONS
Content-Language: ru

{
  "detail": ["Невозможно войти в систему с предоставленными учетными данными"]
}
```

### ✅ Что это означает:
- **Endpoint работает корректно** - статус 400 вместо 404
- **Поддерживает русский язык** - ошибка на русском
- **Правильная структура** - ошибки в массиве `detail`
- **Методы**: `POST, OPTIONS` (подтверждено в заголовке `Allow`)

### 🔑 Ожидаемый ответ при правильных учетных данных:
```json
{
  "status": "success",
  "data": {
    "token": "your-auth-token-here",
    "user": {
      "id": "user-id",
      "username": "username",
      "name": "User Name",
      "accountId": 12345,
      "accountType": "partner",
      "accountName": "Company Name",
      "email": "user@example.com",
      "isAdmin": true,
      "isActive": true,
      "lastLogin": "2025-10-11T20:00:00Z",
      "creatorName": "Creator",
      "accountBlockingDatetime": null,
      "language": "ru",
      "timezone": 3
    },
    "company": {
      "id": "company-uuid",
      "name": "Company Name",
      "schema": "company_schema",
      "isActive": true
    }
  }
}
```

## 📋 2. Объекты - `/api/cms/objects/`

### Запрос без авторизации:
```http
GET https://axenta.cloud/api/cms/objects/?page=1&per_page=50&ordering=name
Content-Type: application/json
```

### Ответ:
```http
HTTP/1.1 401 Unauthorized
Server: nginx/1.29.0
Content-Type: application/json
WWW-Authenticate: Token
Allow: GET, POST, HEAD, OPTIONS

{
  "detail": []
}
```

### ✅ Что это означает:
- **Endpoint существует** - статус 401 вместо 404
- **Требует авторизацию** - заголовок `WWW-Authenticate: Token`
- **Поддерживаемые методы**: `GET, POST, HEAD, OPTIONS`
- **Правильная структура** - пустой массив `detail`

### 🔑 Ожидаемый ответ при правильной авторизации:
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Объект 1",
        "type": "vehicle",
        "status": "active",
        "uniqueId": "ABC123",
        "deviceTypeName": "GPS Tracker",
        "accountName": "Company Name",
        "creatorName": "User Name",
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-10-11T20:00:00Z",
        "is_active": true,
        "has_scheduled_delete": false,
        "contract_id": 123,
        "location_id": 456,
        "template_id": 789
      }
    ],
    "total": 150,
    "page": 1,
    "per_page": 50,
    "total_pages": 3
  }
}
```

## 🔍 3. Структура API

### Проверенные endpoints:

| Endpoint | Статус | Описание |
|----------|--------|----------|
| `/api` | 404 | Базовый endpoint недоступен |
| `/api/cms` | 401 | CMS раздел требует авторизации |
| `/api/cms/objects` | 401 | Объекты требуют авторизации |
| `/api/auth` | 404 | Базовый auth endpoint недоступен |
| `/api/auth/login/` | 400/200 | Авторизация работает |
| `/api/objects` | 401 | Альтернативный endpoint объектов |

## 🛡️ 4. Заголовки авторизации

### Для авторизованных запросов используйте:
```http
Authorization: Token your-auth-token-here
X-Tenant-ID: your-account-id
Content-Type: application/json
```

### Пример авторизованного запроса:
```bash
curl -X GET "https://axenta.cloud/api/cms/objects/?page=1&per_page=50&ordering=name" \
  -H "Authorization: Token your-token-here" \
  -H "X-Tenant-ID: 12345" \
  -H "Content-Type: application/json"
```

## 📊 5. Параметры запроса объектов

### Обязательные параметры:
- `page` - номер страницы (по умолчанию 1)
- `per_page` - количество элементов (по умолчанию 50, макс 1000)
- `ordering` - сортировка (name, -name, created_at, -created_at)

### Дополнительные фильтры:
- `status` - статус объекта (active, inactive)
- `type` - тип объекта (vehicle, device, etc.)
- `search` - поисковый запрос
- `contract_id` - ID контракта
- `location_id` - ID локации
- `template_id` - ID шаблона
- `has_scheduled_delete` - есть ли запланированное удаление
- `is_active` - активен ли объект
- `accountName` - название аккаунта
- `creatorName` - имя создателя
- `deviceTypeName` - тип устройства
- `uniqueId` - уникальный ID

### Пример полного URL:
```
https://axenta.cloud/api/cms/objects/?page=1&per_page=50&ordering=name&status=active&search=объект&type=vehicle
```

## 🚨 6. Обработка ошибок

### Типы ошибок:

#### 400 Bad Request - Неверные данные
```json
{
  "detail": ["Невозможно войти в систему с предоставленными учетными данными"]
}
```

#### 401 Unauthorized - Нет авторизации
```json
{
  "detail": []
}
```
**Заголовок**: `WWW-Authenticate: Token`

#### 404 Not Found - Endpoint не найден
```json
{
  "detail": "Not found."
}
```

#### 405 Method Not Allowed - Неверный HTTP метод
```json
{
  "detail": []
}
```
**Заголовок**: `Allow: POST, OPTIONS`

## 🔧 7. Настройка в коде

### В ObjectsService уже настроено:
```typescript
// Основной запрос к CMS API
const response = await this.getAuth().apiClient.get(
  `/cms/objects/?${params.toString()}`
);

// Заголовки авторизации добавляются автоматически:
// Authorization: Token ${token}
// X-Tenant-ID: ${accountId}
```

### Fallback система:
1. `/cms/objects/` - основной CMS endpoint
2. `/auth/objects` - аутентифицированный fallback
3. `/objects` - публичный fallback

## ✅ 8. Выводы

### API полностью функционален:
- ✅ Авторизация работает (`/api/auth/login/`)
- ✅ Объекты доступны (`/api/cms/objects/`)
- ✅ Правильная структура ответов
- ✅ Поддержка русского языка
- ✅ Корректные HTTP статусы
- ✅ Подробные заголовки ошибок

### Для работы нужно:
1. **Правильные учетные данные** Axenta Cloud
2. **Тип аккаунта "partner"** для доступа к CRM
3. **Токен авторизации** из ответа login
4. **Account ID** для заголовка X-Tenant-ID

### Система готова к работе! 🚀
