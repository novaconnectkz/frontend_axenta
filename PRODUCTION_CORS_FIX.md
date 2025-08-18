# 🚀 Исправление CORS ошибок в продакшене

## 🔍 Проблемы из логов:

1. **CORS ошибка**: `No 'Access-Control-Allow-Origin' header is present`
2. **MIME type ошибка**: `Expected a JavaScript module script but the server responded with a MIME type of "video/mp2t"`
3. **Ошибка загрузки**: `net::ERR_FAILED`

## ✅ Исправления в Backend:

### 1. CORS настройки обновлены в `main.go`:
```go
corsConfig.AllowOrigins = []string{
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "https://axenta.glonass-saratov.ru",
    "http://axenta.glonass-saratov.ru",
    "https://api.axenta.glonass-saratov.ru",
    "http://api.axenta.glonass-saratov.ru",
}
```

## ✅ Исправления в Frontend:

### 1. Убраны hardcoded URLs:
- ✅ `AppleStyleLogin.vue` - теперь использует `config.apiBaseUrl`
- ✅ `DiagnosticLogin.vue` - теперь использует `config.backendUrl`
- ✅ `BasicLogin.vue` - теперь использует `config.backendUrl`

### 2. Улучшена сборка в `vite.config.ts`:
- Добавлены правильные имена файлов для сборки
- Исправлены MIME типы

## 🔧 Необходимые действия на сервере:

### 1. Настройка Nginx (если используется):
```nginx
server {
    listen 443 ssl;
    server_name axenta.glonass-saratov.ru;
    
    # Настройки для SPA
    location / {
        try_files $uri $uri/ /index.html;
        
        # Правильные MIME типы
        location ~* \\.js$ {
            add_header Content-Type application/javascript;
        }
        
        location ~* \\.mjs$ {
            add_header Content-Type application/javascript;
        }
        
        location ~* \\.css$ {
            add_header Content-Type text/css;
        }
    }
    
    # API проксирование на backend
    location /api/ {
        proxy_pass https://api.axenta.glonass-saratov.ru/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Переменные окружения для продакшена:
Создайте файл `.env.production` на сервере:
```bash
VITE_BACKEND_URL=https://api.axenta.glonass-saratov.ru
VITE_WS_BASE_URL=wss://api.axenta.glonass-saratov.ru
VITE_APP_ENV=production
```

### 3. Пересборка frontend:
```bash
npm run build
```

### 4. Перезапуск backend:
Убедитесь, что backend перезапущен с новыми CORS настройками.

## 🔍 Проверка исправлений:

1. **Откройте Developer Tools**
2. **Перейдите на вкладку Network**
3. **Попробуйте войти в систему**
4. **Проверьте что:**
   - API запросы идут на правильный домен
   - Нет CORS ошибок
   - JavaScript файлы загружаются с правильным MIME типом

## 📝 Дополнительные рекомендации:

1. **Убедитесь что SSL сертификаты настроены правильно**
2. **Проверьте что backend доступен по HTTPS**
3. **Убедитесь что все домены указаны в DNS**
4. **Проверьте firewall настройки**

После применения этих исправлений CORS ошибки должны исчезнуть.
