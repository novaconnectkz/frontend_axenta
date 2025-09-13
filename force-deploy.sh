#!/bin/bash

# Скрипт для принудительного деплоя с обновлением кэша

echo "🚀 Принудительный деплой с обновлением кэша"
echo "=============================================="

# Создаем небольшое изменение для принудительного обновления
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
COMMENT_FILE="src/utils/deployTimestamp.ts"

echo "📝 Создаем файл с временной меткой деплоя..."
cat > "$COMMENT_FILE" << EOF
// Автоматически сгенерированный файл для отслеживания деплоев
// Последний деплой: $TIMESTAMP

export const DEPLOY_TIMESTAMP = '$TIMESTAMP';
export const DEPLOY_HASH = '$(git rev-parse --short HEAD)';

// Этот файл помогает отслеживать успешность деплоев
// Если вы видите эту временную метку в браузере, значит деплой прошел успешно
EOF

echo "✅ Создан файл: $COMMENT_FILE"

# Обновляем версию в package.json
echo "📦 Обновляем версию в package.json..."
CURRENT_VERSION=$(node -p "require('./package.json').version")
NEW_VERSION="0.0.$(date +%s)"

# Создаем временный package.json с новой версией
node -p "
const pkg = require('./package.json');
pkg.version = '$NEW_VERSION';
JSON.stringify(pkg, null, 2);
" > package.json.tmp && mv package.json.tmp package.json

echo "📈 Версия обновлена: $CURRENT_VERSION → $NEW_VERSION"

# Пересобираем проект для продакшена
echo "🏗️ Пересборка проекта для продакшена..."
npm run build:production

if [ $? -eq 0 ]; then
    echo "✅ Сборка успешна"
    
    # Проверяем размер новой сборки
    echo "📏 Размер новой сборки:"
    du -sh dist/*
    
    # Коммитим изменения
    echo "📤 Коммитим изменения..."
    git add .
    git commit -m "deploy: принудительное обновление кэша ($TIMESTAMP)

- Обновлена версия до $NEW_VERSION
- Добавлена временная метка деплоя
- Пересобран проект для обновления кэша
- Hash коммита: $(git rev-parse --short HEAD)"

    # Пушим изменения
    echo "🚀 Отправляем на GitHub..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Изменения успешно отправлены на GitHub!"
        echo ""
        echo "🔄 Что происходит дальше:"
        echo "1. GitHub Actions автоматически запустит деплой"
        echo "2. Сервер получит обновленный код"
        echo "3. Nginx начнет отдавать новую версию"
        echo ""
        echo "⏱️ Ожидайте 2-5 минут для завершения деплоя"
        echo ""
        echo "🌐 Проверить статус деплоя:"
        echo "https://github.com/novaconnectkz/frontend_axenta/actions"
        echo ""
        echo "🔍 Проверить результат:"
        echo "https://axenta.glonass-saratov.ru"
        echo ""
        echo "💡 Для проверки изменений:"
        echo "1. Откройте сайт в браузере"
        echo "2. Нажмите Ctrl+F5 (принудительное обновление)"
        echo "3. Откройте консоль разработчика (F12)"
        echo "4. Проверьте, что иконка WebSocket исчезла из header"
        
        # Запускаем проверку через 30 секунд
        echo ""
        echo "⏰ Запуск проверки через 30 секунд..."
        sleep 30
        ./check-production.sh
        
    else
        echo "❌ Ошибка при отправке на GitHub"
        exit 1
    fi
else
    echo "❌ Ошибка сборки"
    exit 1
fi
