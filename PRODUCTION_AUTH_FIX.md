# 🚨 Исправление проблемы авторизации в продакшене

## 🔍 Проблема:
Фронтенд в продакшене обращается напрямую к `https://axenta.cloud/api/auth/login/` вместо нашего бэкенда на `https://api.axenta.glonass-saratov.ru/api/auth/login/`.

Ошибка: `403 Forbidden - "You are not allowed to login to this domain"`

## ✅ Решение:

### 1. Создать файл `.env.production` на сервере:

```bash
# Создать файл конфигурации для продакшена
cat > .env.production << 'EOF'
# Конфигурация фронтенда Axenta для продакшена

# URL бэкенда для продакшена
VITE_BACKEND_URL=https://api.axenta.glonass-saratov.ru

# WebSocket URL для реального времени (продакшен)
VITE_WS_BASE_URL=wss://api.axenta.glonass-saratov.ru

# Название приложения
VITE_APP_NAME=Axenta CRM

# Версия API
VITE_API_VERSION=v1

# Режим продакшена
VITE_APP_ENV=production

# Таймаут для API запросов (в миллисекундах)
VITE_API_TIMEOUT=10000
EOF
```

### 2. Пересобрать фронтенд:

```bash
# Пересобрать с правильной конфигурацией
npm run build
```

### 3. Проверить конфигурацию:

```bash
# Проверить что файл создался
cat .env.production

# Проверить что переменные подхватываются
grep -r "api.axenta.glonass-saratov.ru" dist/
```

## 🔧 Что исправлено в коде:

### 1. `/src/config/env.ts`:
```typescript
// Было:
backendUrl: getEnvVar("VITE_BACKEND_URL", "https://axenta.cloud"),

// Стало:
backendUrl: getEnvVar("VITE_BACKEND_URL", "https://api.axenta.glonass-saratov.ru"),
```

### 2. `/vite.config.ts`:
```typescript
// Исправлены все дефолтные значения с axenta.cloud на api.axenta.glonass-saratov.ru
```

## 🎯 Результат:

После исправления запросы будут идти правильно:
- ❌ Было: `POST https://axenta.cloud/api/auth/login/` → 403 Forbidden
- ✅ Стало: `POST https://api.axenta.glonass-saratov.ru/api/auth/login/` → 200 OK

## 🚀 Деплой:

```bash
# 1. Создать .env.production (см. выше)
# 2. Пересобрать фронтенд
npm run build

# 3. Задеплоить
# (используйте ваш обычный процесс деплоя)
```

## ✅ Проверка:

После деплоя авторизация должна работать без ошибок 403.
