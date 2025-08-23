# 🔧 Исправление MIME типов на веб-сервере

## 🚨 Проблема решена в коде

**Основная проблема была в исходном HTML файле** - там были ссылки на `.ts` файлы вместо `.js`. Это исправлено в коммите.

## 📋 Если проблема повторится на сервере

### Для Nginx

Добавьте в конфигурацию сервера:

```nginx
server {
    # ... другие настройки ...
    
    # Правильные MIME типы для JavaScript модулей
    location ~* \.js$ {
        add_header Content-Type application/javascript;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Если случайно попадут .ts файлы
    location ~* \.ts$ {
        add_header Content-Type application/javascript;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Основные настройки для SPA
    location / {
        try_files $uri $uri/ /index.html;
        
        # Заголовки безопасности
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    }
}
```

### Для Apache (.htaccess)

Создайте файл `.htaccess` в корне сайта:

```apache
# Правильные MIME типы
AddType application/javascript .js
AddType application/javascript .ts

# Кэширование статических файлов
<FilesMatch "\.(js|ts|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
    Header set Cache-Control "public, immutable"
</FilesMatch>

# SPA маршрутизация
RewriteEngine On
RewriteBase /

# Обработка SPA маршрутов
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Заголовки безопасности
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "no-referrer-when-downgrade"
```

### Для других веб-серверов

**IIS (web.config):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <staticContent>
            <mimeMap fileExtension=".js" mimeType="application/javascript" />
            <mimeMap fileExtension=".ts" mimeType="application/javascript" />
        </staticContent>
        
        <rewrite>
            <rules>
                <rule name="SPA Routes" stopProcessing="true">
                    <match url=".*" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="/index.html" />
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
</configuration>
```

## ✅ Проверка исправления

После деплоя новой сборки проверьте:

1. **В браузере (F12 → Network):**
   - Все `.js` файлы загружаются с `Content-Type: application/javascript`
   - Нет ошибок MIME типов
   - Нет файлов с расширением `.ts`

2. **В консоли браузера:**
   - Нет ошибок `Failed to load module script`
   - Приложение загружается корректно

3. **Тест команды curl:**
   ```bash
   curl -I https://your-domain.com/assets/index-B-U3j_NJ.js
   # Должен вернуть: Content-Type: application/javascript
   ```

## 🚀 Деплой исправленной версии

```bash
# 1. Убедитесь что код обновлен
git pull origin main

# 2. Пересоберите проект
rm -rf dist
NODE_ENV=production npm run build

# 3. Проверьте что нет .ts файлов
ls dist/assets/*.ts 2>/dev/null && echo "ОШИБКА: Найдены .ts файлы!" || echo "✅ Только .js файлы"

# 4. Деплой на сервер
# (используйте ваш процесс деплоя)
```

## 📝 Важные заметки

1. **Проблема решена в коде** - больше не должна повторяться
2. **Vite теперь корректно** генерирует только `.js` файлы
3. **HTML не содержит** ссылок на `.ts` файлы
4. **Веб-сервер настройки** - дополнительная защита

---

**Дата исправления:** 23 августа 2025  
**Статус:** ✅ Исправлено в коде  
**Приоритет:** Критический - требует немедленного деплоя
