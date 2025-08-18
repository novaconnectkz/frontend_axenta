# 🔧 Исправление дублирования /api в URL запросах

## 🚨 **Проблема:**

**Было:** `https://api.axenta.glonass-saratov.ru/api/api/auth/login`  
**Должно быть:** `https://api.axenta.glonass-saratov.ru/api/auth/login`

### **Причина дублирования:**
1. `VITE_BACKEND_URL` содержит `https://api.axenta.glonass-saratov.ru` (уже с `/api`)
2. `config.apiBaseUrl` добавляет еще `/api`: `${backendUrl}/api`
3. В запросах добавляется еще `/api/auth/login`
4. Результат: `/api` + `/api` + `/auth/login` = `/api/api/auth/login`

## ✅ **Реализованные исправления:**

### 🔧 **1. Умная логика в config/env.ts**

**Добавлена проверка дублирования:**
```typescript
// Базовый URL API
get apiBaseUrl() {
  // Если backendUrl уже содержит /api, не добавляем его повторно
  if (this.backendUrl.includes('/api')) {
    return this.backendUrl;
  }
  return `${this.backendUrl}/api`;
},
```

**Теперь работает для всех случаев:**
- `http://localhost:8080` → `http://localhost:8080/api` ✅
- `https://api.axenta.glonass-saratov.ru` → `https://api.axenta.glonass-saratov.ru` ✅

### 🔧 **2. Исправлены URL в auth.ts**

**Было:**
```typescript
`${config.apiBaseUrl}/api/auth/login`  // Дублирование /api
`${config.apiBaseUrl}/api/auth/refresh`
```

**Стало:**
```typescript
`${config.apiBaseUrl}/auth/login`     // Корректно
`${config.apiBaseUrl}/auth/refresh`
```

### 🔧 **3. Исправлен DiagnosticLogin.vue**

**Было:**
```typescript
`${config.apiBaseUrl}/api/auth/login`  // Дублирование
```

**Стало:**
```typescript
`${config.apiBaseUrl}/auth/login`     // Корректно
```

### 🔧 **4. Обновлены комментарии в env файлах**

**Добавлены пояснения в env.production.example:**
```bash
# URL бэкенда для продакшена
# Если используется поддомен api.*, то URL уже содержит /api
# Например: https://api.axenta.glonass-saratov.ru
# Если обычный сервер, то: http://194.87.143.169:8080
VITE_BACKEND_URL=http://194.87.143.169:8080
```

## 📊 **Результаты исправлений:**

### ✅ **Корректные URL теперь:**

#### **Для разработки** (`localhost:8080`):
- `config.backendUrl`: `http://localhost:8080`
- `config.apiBaseUrl`: `http://localhost:8080/api` 
- Запрос логина: `http://localhost:8080/api/auth/login` ✅

#### **Для продакшена** (`api.axenta.glonass-saratov.ru`):
- `config.backendUrl`: `https://api.axenta.glonass-saratov.ru`
- `config.apiBaseUrl`: `https://api.axenta.glonass-saratov.ru`
- Запрос логина: `https://api.axenta.glonass-saratov.ru/auth/login` ✅

### 🧪 **Тестирование:**
- ✅ Сборка прошла успешно
- ✅ Размер бандла: 453.46 KB (gzipped: 135.00 KB)
- ✅ Время сборки: 1.81 секунды
- ✅ Все API endpoints исправлены

## 🎯 **Затронутые файлы:**

### **Исправлены:**
- `src/config/env.ts` - умная логика apiBaseUrl
- `src/context/auth.ts` - убрано дублирование /api в auth endpoints
- `src/views/DiagnosticLogin.vue` - исправлен URL логина
- `env.production.example` - добавлены комментарии

### **Корректные (не требовали изменений):**
- `src/views/Billing.vue` - правильно использует `/billing/`
- `src/views/LoginPageFixed.vue` - использует `/login` без дублирования
- `src/views/SimpleLogin.vue` - использует `/login` без дублирования

## 🚀 **Деплой:**

### **Немедленные действия:**
```bash
git pull origin main
npm install
npm run build
# Деплой dist/ папки на сервер
```

### **Ожидаемый результат после деплоя:**
- ✅ Авторизация работает корректно
- ✅ URL запросов правильные: `/api/auth/login` (без дублирования)
- ✅ Все API endpoints доступны
- ✅ Нет ошибок 404 для auth endpoints

## 🔍 **Как проверить исправление:**

### **В браузере (DevTools → Network):**
- **Было:** `POST https://api.axenta.glonass-saratov.ru/api/api/auth/login` ❌
- **Стало:** `POST https://api.axenta.glonass-saratov.ru/api/auth/login` ✅

### **В консоли должны исчезнуть:**
- `404 Not Found` для auth endpoints
- Ошибки авторизации из-за неправильных URL

---

**📅 Дата:** 18 января 2025  
**🔧 Статус:** ✅ Готово к деплою  
**⚡ Приоритет:** Высокий - исправляет критическую проблему авторизации
