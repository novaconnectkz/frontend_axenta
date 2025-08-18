# 🔧 Исправление ошибки "Failed to fetch"

## 🚨 Проблема
Фронтенд показывает ошибку "Failed to fetch" при попытке входа в систему.

## 🔍 Диагностика выполнена:

### ✅ Что работает:
- ✅ Сервер `194.87.143.169` доступен (отвечает на ping)
- ✅ На сервере работает Nginx на порту 80
- ✅ **Локальный бэкенд работает** на `http://localhost:8080`

### ❌ Что не работает:
- ❌ Порт 8080 на удаленном сервере недоступен
- ❌ API endpoints недоступны через порт 80
- ❌ Бэкенд не запущен или не настроен на продакшн сервере

## 🎯 Решения

### Решение 1: Запуск бэкенда на продакшн сервере

1. **Подключитесь к серверу:**
   ```bash
   ssh user@194.87.143.169
   ```

2. **Проверьте статус бэкенда:**
   ```bash
   ps aux | grep axenta
   systemctl status axenta-backend  # если настроен как сервис
   ```

3. **Запустите бэкенд:**
   ```bash
   cd /path/to/backend
   ./main  # или как настроено
   ```

4. **Проверьте, что порт 8080 открыт:**
   ```bash
   netstat -tlnp | grep :8080
   curl localhost:8080/ping
   ```

### Решение 2: Настройка Nginx прокси

Если бэкенд работает локально на сервере, настройте Nginx:

```nginx
server {
    listen 80;
    server_name 194.87.143.169;
    
    # Фронтенд
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
    
    # API прокси к локальному бэкенду
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Ping endpoint
    location /ping {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Затем перезапустите Nginx:
```bash
nginx -t  # проверка конфигурации
systemctl reload nginx
```

### Решение 3: Обновление адреса фронтенда

Если API будет доступен через стандартный порт 80:

1. **Обновите конфигурацию:**
   ```bash
   # В .env.local измените:
   VITE_BACKEND_URL=http://194.87.143.169
   # Без указания порта 8080
   ```

2. **Пересоберите фронтенд:**
   ```bash
   npm run build
   ```

### Решение 4: Локальная разработка (временное)

Для немедленного тестирования используйте локальный бэкенд:

1. **Запустите локальный бэкенд:**
   ```bash
   cd /Users/com/backend_axenta
   go run main.go
   ```

2. **Фронтенд уже настроен** для работы с `localhost:8080`

3. **Откройте:** `http://localhost:5173` (dev) или используйте файлы из `dist/`

## 🔧 Текущее состояние

- ✅ Фронтенд пересобран для работы с `localhost:8080`
- ✅ Dev сервер запущен на `http://localhost:5173`
- ✅ Локальный бэкенд работает на `http://localhost:8080`

## 📋 Рекомендуемые действия

1. **Немедленно:** Используйте локальную разработку для тестирования
2. **Для продакшена:** Настройте бэкенд на сервере или Nginx прокси
3. **Долгосрочно:** Настройте proper deployment pipeline

## 🚀 Быстрый тест

```bash
# Проверьте локальный бэкенд
curl http://localhost:8080/ping

# Откройте фронтенд
open http://localhost:5173
```

## ⚠️ Важные замечания

1. **CORS**: Убедитесь, что бэкенд разрешает запросы с фронтенд домена
2. **Firewall**: Проверьте, что порт 8080 не заблокирован на сервере
3. **SSL**: Для продакшена рекомендуется использовать HTTPS
4. **Environment**: Не забудьте настроить переменные окружения на сервере
