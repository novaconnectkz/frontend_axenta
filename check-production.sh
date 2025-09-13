#!/bin/bash

# Скрипт для проверки состояния продакшн сервера

echo "🌐 Проверка продакшн сервера Axenta CRM"
echo "========================================"

# Читаем URL из .env.production
if [ -f ".env.production" ]; then
    BACKEND_URL=$(grep "VITE_BACKEND_URL" .env.production | cut -d '=' -f2)
    # Убираем api. из URL для получения фронтенд URL
    FRONTEND_URL=$(echo "$BACKEND_URL" | sed 's/api\.//')
    echo "🔧 Backend URL: $BACKEND_URL"
    echo "🌐 Frontend URL: $FRONTEND_URL"
else
    echo "❌ Файл .env.production не найден"
    FRONTEND_URL="https://axenta.glonass-saratov.ru"
    BACKEND_URL="https://api.axenta.glonass-saratov.ru"
fi

echo ""

# Проверяем доступность фронтенда
echo "🔍 Проверка фронтенда..."
if curl -s --connect-timeout 10 --max-time 30 "$FRONTEND_URL" > /dev/null; then
    echo "✅ Фронтенд доступен: $FRONTEND_URL"
    
    # Проверяем, есть ли наши изменения
    echo "🔍 Проверка последних изменений..."
    RESPONSE=$(curl -s --connect-timeout 10 --max-time 30 "$FRONTEND_URL")
    
    if echo "$RESPONSE" | grep -q "WebSocket"; then
        echo "⚠️  Старая версия: найдены упоминания WebSocket"
        echo "🔄 Деплой может не завершиться или не применяться"
    else
        echo "✅ Возможно новая версия: WebSocket упоминания не найдены"
    fi
    
    # Проверяем размер ответа
    RESPONSE_SIZE=$(echo "$RESPONSE" | wc -c)
    echo "📏 Размер страницы: $RESPONSE_SIZE байт"
    
    # Проверяем заголовки
    echo "📋 HTTP заголовки:"
    curl -s -I --connect-timeout 10 --max-time 30 "$FRONTEND_URL" | head -5
    
else
    echo "❌ Фронтенд недоступен: $FRONTEND_URL"
    echo "🔍 Возможные причины:"
    echo "   - Сервер выключен"
    echo "   - Проблемы с DNS"
    echo "   - Проблемы с nginx"
    echo "   - Неправильный URL"
fi

echo ""

# Проверяем доступность API
echo "🔍 Проверка API..."
API_HEALTH_URL="$BACKEND_URL/health"
if curl -s --connect-timeout 10 --max-time 30 "$API_HEALTH_URL" > /dev/null; then
    echo "✅ API доступен: $API_HEALTH_URL"
    
    # Получаем информацию о здоровье API
    API_RESPONSE=$(curl -s --connect-timeout 10 --max-time 30 "$API_HEALTH_URL")
    echo "📊 Ответ API: $API_RESPONSE"
else
    echo "❌ API недоступен: $API_HEALTH_URL"
    echo "🔍 Пробуем базовый URL..."
    if curl -s --connect-timeout 10 --max-time 30 "$BACKEND_URL" > /dev/null; then
        echo "✅ Базовый API URL доступен"
    else
        echo "❌ Базовый API URL недоступен"
    fi
fi

echo ""

# Проверяем последний коммит
echo "📍 Информация о последнем коммите:"
git log --oneline -1
COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_TIME=$(git log -1 --format="%ci")
echo "🔖 Hash: $COMMIT_HASH"
echo "⏰ Время: $COMMIT_TIME"

echo ""

# Рекомендации
echo "🎯 Рекомендации по диагностике:"
echo ""

if curl -s --connect-timeout 5 --max-time 10 "$FRONTEND_URL" > /dev/null; then
    echo "✅ Сайт работает, но изменения могут не применяться:"
    echo "   1. Проверьте логи GitHub Actions"
    echo "   2. Убедитесь, что деплой завершился успешно"
    echo "   3. Проверьте кэш браузера (Ctrl+F5)"
    echo "   4. Проверьте, что файлы обновились на сервере"
    echo ""
    echo "🔗 Полезные команды для сервера:"
    echo "   ssh user@server 'cd /var/www/frontend_axenta && git log --oneline -1'"
    echo "   ssh user@server 'cd /var/www/frontend_axenta && ls -la dist/'"
    echo "   ssh user@server 'systemctl status nginx'"
else
    echo "❌ Сайт недоступен:"
    echo "   1. Проверьте статус сервера"
    echo "   2. Проверьте конфигурацию nginx"
    echo "   3. Проверьте DNS настройки"
    echo "   4. Проверьте firewall"
fi

echo ""
echo "🌐 Ссылки для проверки:"
echo "   - Фронтенд: $FRONTEND_URL"
echo "   - API Health: $API_HEALTH_URL"
echo "   - GitHub Actions: https://github.com/novaconnectkz/frontend_axenta/actions"
