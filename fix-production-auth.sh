#!/bin/bash

# 🚨 Скрипт для исправления проблемы авторизации в продакшене
# Исправляет ошибку 403 "You are not allowed to login to this domain"

echo "🔧 Исправление конфигурации авторизации для продакшена..."

# Создаем правильный .env.production файл
echo "📝 Создание .env.production с правильной конфигурацией..."
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

echo "✅ Файл .env.production создан"

# Показываем содержимое для проверки
echo "📋 Содержимое .env.production:"
cat .env.production

echo ""
echo "🔄 Пересборка фронтенда с правильной конфигурацией..."

# Пересобираем фронтенд
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Сборка завершена успешно"
    
    # Проверяем что правильный URL попал в сборку
    echo "🔍 Проверка конфигурации в собранных файлах..."
    if grep -r "api.axenta.glonass-saratov.ru" dist/ > /dev/null 2>&1; then
        echo "✅ Правильный URL найден в собранных файлах"
    else
        echo "⚠️  Предупреждение: Правильный URL не найден в собранных файлах"
        echo "    Проверьте содержимое dist/ вручную"
    fi
    
    echo ""
    echo "🎯 Исправление завершено!"
    echo "📋 Что исправлено:"
    echo "   - Фронтенд теперь обращается к https://api.axenta.glonass-saratov.ru"
    echo "   - Вместо прямого обращения к https://axenta.cloud"
    echo "   - Это должно исправить ошибку 403 Forbidden"
    echo ""
    echo "🚀 Следующие шаги:"
    echo "   1. Задеплойте обновленный dist/ на сервер"
    echo "   2. Проверьте что авторизация работает"
    echo "   3. В браузере должны быть запросы на api.axenta.glonass-saratov.ru"
    
else
    echo "❌ Ошибка при сборке фронтенда"
    echo "   Проверьте логи выше для диагностики"
    exit 1
fi
