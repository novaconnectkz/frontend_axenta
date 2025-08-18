# ✅ Правильная конфигурация API URL

## 🎯 **Правильные URL для продакшена:**

### **Правильный запрос авторизации:**
```
https://api.axenta.glonass-saratov.ru/api/auth/login
```

### **Логика формирования URL:**
```
VITE_BACKEND_URL = https://api.axenta.glonass-saratov.ru
config.apiBaseUrl = https://api.axenta.glonass-saratov.ru/api
auth endpoint = /auth/login
Итоговый URL = https://api.axenta.glonass-saratov.ru/api/auth/login ✅
```

## 🔧 **Исправленная конфигурация:**

### **env.production.example:**
```bash
# URL бэкенда для продакшена
# Базовый URL сервера БЕЗ /api (к нему автоматически добавится /api)
# Например: https://api.axenta.glonass-saratov.ru (без /api в конце)
# Результат: https://api.axenta.glonass-saratov.ru/api/auth/login
VITE_BACKEND_URL=https://api.axenta.glonass-saratov.ru

# WebSocket URL для реального времени (продакшен)
# Используйте wss:// для HTTPS сайтов
VITE_WS_BASE_URL=wss://api.axenta.glonass-saratov.ru
```

### **config/env.ts:**
```typescript
// Базовый URL API
get apiBaseUrl() {
  // Всегда добавляем /api к базовому URL
  // Например: https://api.axenta.glonass-saratov.ru + /api = https://api.axenta.glonass-saratov.ru/api
  return `${this.backendUrl}/api`;
},
```

## 📊 **Результирующие URL:**

### **Для разработки:**
- `VITE_BACKEND_URL`: `http://localhost:8080`
- `config.apiBaseUrl`: `http://localhost:8080/api`
- **Авторизация:** `http://localhost:8080/api/auth/login` ✅

### **Для продакшена:**
- `VITE_BACKEND_URL`: `https://api.axenta.glonass-saratov.ru`
- `config.apiBaseUrl`: `https://api.axenta.glonass-saratov.ru/api`
- **Авторизация:** `https://api.axenta.glonass-saratov.ru/api/auth/login` ✅

## 🧪 **Как проверить:**

### **В DevTools → Network:**
После деплоя должны быть запросы:
- `POST https://api.axenta.glonass-saratov.ru/api/auth/login` ✅
- `GET https://api.axenta.glonass-saratov.ru/api/objects` ✅
- `GET https://api.axenta.glonass-saratov.ru/api/users` ✅

### **НЕ должно быть:**
- `POST https://api.axenta.glonass-saratov.ru/api/api/auth/login` ❌
- Дублирования `/api` в URL ❌

## 🚀 **Статус:**
- ✅ Логика исправлена
- ✅ Сборка успешна
- ✅ Готово к деплою

---

**📅 Дата:** 18 января 2025  
**🎯 Результат:** Правильные API URL без дублирования
