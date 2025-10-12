# 🔧 Требуется настройка backend для отображения объектов

## ❌ Проблема: Данные по объектам не отображаются

После отмены автоматической установки токена система вернулась к использованию локального backend, но:
- ✅ Frontend настроен на localhost:8080
- ❌ Backend может быть не запущен или не настроен для Axenta Cloud API

## 🎯 Что нужно сделать:

### 1. **Запустите backend сервер:**
```bash
cd /Users/com/backend_axenta
go run main.go
```

### 2. **Убедитесь, что backend настроен для Axenta Cloud:**
Backend должен иметь endpoints:
- `POST /api/auth/login` - для авторизации через Axenta Cloud
- `GET /api/auth/objects` - для получения объектов из Axenta Cloud
- `GET /api/auth/objects/stats` - для статистики объектов

### 3. **Backend должен проксировать запросы:**
```go
// Пример логики в backend:
func (h *Handler) GetObjects(c *gin.Context) {
    // Получаем токен пользователя
    token := c.GetHeader("Authorization")
    
    // Делаем запрос к Axenta Cloud API
    resp, err := http.Get("https://axenta.cloud/api/cms/objects/", 
        headers: map[string]string{
            "Authorization": token,
        })
    
    // Возвращаем данные фронтенду
    c.JSON(200, resp.Data)
}
```

## 🔍 Диагностика:

### **Проверьте в консоли браузера:**
```javascript
// Должны быть сообщения:
🚀 ObjectsService.getObjects called with: {page: 1, per_page: 50}
✅ Backend objects API response: {status: "success", data: {...}}

// Если видите ошибки:
❌ Error in getObjects (backend auth): 404/500/Connection refused
```

### **Если backend не запущен:**
- Ошибка: `net::ERR_CONNECTION_REFUSED`
- Решение: Запустите backend сервер

### **Если backend не настроен для Axenta Cloud:**
- Ошибка: `404 Not Found` для `/auth/objects`
- Решение: Настройте backend endpoints

## ✅ Альтернативное решение:

### **Если backend сложно настроить, можно временно:**

#### Вариант 1 - Вернуть прямое обращение к Axenta Cloud:
```typescript
// В objectsService.ts изменить обратно на:
const response = await this.getAuth().apiClient.get(
  `/cms/objects/?${params.toString()}`
);
```

#### Вариант 2 - Использовать демо данные:
```javascript
// В консоли браузера:
localStorage.setItem('objects_demo_mode', 'true');
location.reload();
```

## 🚀 Рекомендуемое решение:

### **Настройте backend правильно:**
1. **Запустите backend** на localhost:8080
2. **Настройте проксирование** к Axenta Cloud API
3. **Авторизуйтесь** через форму входа
4. **Получите доступ** к реальным объектам

---

**🔧 Основная проблема: Backend не запущен или не настроен для работы с Axenta Cloud API**
