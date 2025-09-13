#!/bin/bash

# Скрипт для принудительного запуска деплоя через GitHub Actions

REPO="novaconnectkz/frontend_axenta"
WORKFLOW_FILE="deploy-production.yml"

echo "🚀 Запуск деплоя для репозитория: $REPO"
echo "📋 Workflow: $WORKFLOW_FILE"
echo "========================================"

# Проверяем наличие GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) не установлен"
    echo "🔧 Установите GitHub CLI: https://cli.github.com/"
    echo ""
    echo "🔄 Альтернативные способы запуска деплоя:"
    echo "1. Перейдите на GitHub: https://github.com/$REPO/actions"
    echo "2. Найдите workflow 'Deploy to Production'"
    echo "3. Нажмите 'Run workflow' -> 'Run workflow'"
    echo ""
    echo "Или используйте curl:"
    echo "curl -X POST \\"
    echo "  -H 'Accept: application/vnd.github.v3+json' \\"
    echo "  -H 'Authorization: token YOUR_GITHUB_TOKEN' \\"
    echo "  https://api.github.com/repos/$REPO/actions/workflows/$WORKFLOW_FILE/dispatches \\"
    echo "  -d '{\"ref\":\"main\"}'"
    exit 1
fi

# Проверяем авторизацию
if ! gh auth status &> /dev/null; then
    echo "❌ Не авторизован в GitHub CLI"
    echo "🔧 Выполните: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI настроен"

# Запускаем workflow
echo "🔄 Запуск workflow..."
if gh workflow run "$WORKFLOW_FILE" --repo "$REPO"; then
    echo "✅ Деплой запущен успешно!"
    echo ""
    echo "📊 Проверить статус:"
    echo "gh run list --repo $REPO --limit 5"
    echo ""
    echo "🌐 Или откройте в браузере:"
    echo "https://github.com/$REPO/actions"
    echo ""
    
    # Показываем последние запуски
    echo "📋 Последние запуски:"
    gh run list --repo "$REPO" --limit 5
else
    echo "❌ Ошибка запуска деплоя"
    echo "🔍 Возможные причины:"
    echo "- Workflow файл не найден или недоступен"
    echo "- Нет прав на запуск workflow"
    echo "- Проблемы с сетью"
    echo ""
    echo "🔧 Попробуйте запустить вручную:"
    echo "https://github.com/$REPO/actions/workflows/$WORKFLOW_FILE"
fi
