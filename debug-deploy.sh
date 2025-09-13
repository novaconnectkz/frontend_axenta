#!/bin/bash

echo "🔍 Диагностика деплоя frontend_axenta"
echo "======================================="

# Проверяем последний коммит
echo "📍 Последний коммит:"
git log --oneline -1
echo ""

# Проверяем статус сборки
echo "🏗️ Проверяем сборку..."
if [ -d "dist" ]; then
    echo "✅ Папка dist существует"
    echo "📁 Содержимое dist:"
    ls -la dist/
    echo ""
    
    echo "📄 Размер файлов:"
    du -sh dist/*
    echo ""
else
    echo "❌ Папка dist не найдена"
    echo "🔧 Попытка сборки..."
    npm run build
fi

# Проверяем package.json
echo "📦 Проверяем package.json..."
if [ -f "package.json" ]; then
    echo "✅ package.json найден"
    echo "🔖 Версия: $(node -p "require('./package.json').version")"
    echo "📜 Скрипты:"
    node -p "Object.keys(require('./package.json').scripts).join(', ')"
else
    echo "❌ package.json не найден"
fi
echo ""

# Проверяем конфигурацию Vite
echo "⚙️ Проверяем конфигурацию Vite..."
if [ -f "vite.config.ts" ]; then
    echo "✅ vite.config.ts найден"
else
    echo "❌ vite.config.ts не найден"
fi
echo ""

# Проверяем переменные окружения
echo "🔧 Переменные окружения:"
if [ -f ".env" ]; then
    echo "✅ .env найден"
    echo "📋 Содержимое .env:"
    cat .env | grep -v "SECRET\|PASSWORD\|TOKEN" | head -10
else
    echo "⚠️ .env не найден"
fi

if [ -f ".env.production" ]; then
    echo "✅ .env.production найден"
    echo "📋 Содержимое .env.production:"
    cat .env.production | grep -v "SECRET\|PASSWORD\|TOKEN" | head -10
else
    echo "⚠️ .env.production не найден"
fi
echo ""

# Проверяем GitHub workflow файлы
echo "🚀 Проверяем GitHub Actions:"
if [ -d ".github/workflows" ]; then
    echo "✅ Папка .github/workflows найдена"
    echo "📄 Workflow файлы:"
    ls -la .github/workflows/
else
    echo "❌ Папка .github/workflows не найдена"
fi
echo ""

# Проверяем index.html
echo "📄 Проверяем index.html..."
if [ -f "dist/index.html" ]; then
    echo "✅ dist/index.html найден"
    echo "📏 Размер: $(wc -c < dist/index.html) байт"
    echo "🔍 Первые 10 строк:"
    head -10 dist/index.html
else
    echo "❌ dist/index.html не найден"
fi
echo ""

echo "🎯 Рекомендации для диагностики:"
echo "1. Проверьте логи GitHub Actions в репозитории"
echo "2. Убедитесь, что secrets настроены правильно"
echo "3. Проверьте доступность сервера"
echo "4. Проверьте права доступа на сервере"
echo "5. Проверьте конфигурацию nginx"
echo ""

echo "🔗 Полезные ссылки:"
echo "- GitHub Actions: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions"
echo "- Настройка секретов: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/settings/secrets/actions"
