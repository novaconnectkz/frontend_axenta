# 🚀 Исправление проблем деплоя

## Проблема
При деплое возникает ошибка "divergent branches" - расходящиеся ветки.

## Решение
Выполните следующие команды на сервере деплоя:

```bash
# 1. Переходим в директорию проекта
cd /path/to/your/frontend/project

# 2. Настраиваем Git для автоматического merge
git config pull.rebase false

# 3. Или используем принудительное обновление
git fetch --all --prune
git reset --hard origin/main

# 4. Альтернативный способ - принудительный pull
git pull origin main --allow-unrelated-histories

# 5. Если ничего не помогает - полная переустановка
rm -rf .git
git init
git remote add origin https://github.com/novaconnectkz/frontend_axenta.git
git fetch origin
git checkout -b main origin/main
```

## Обновленный скрипт деплоя

```bash
#!/bin/bash
set -e

cd "***"

# Настраиваем Git для избежания проблем с divergent branches
git config pull.rebase false

# Загружаем изменения
git fetch --all --prune

# Принудительно обновляемся до последней версии
git reset --hard origin/main

# Устанавливаем зависимости
npm install

# Собираем проект
npm run build

# Перезагружаем nginx
sudo systemctl reload nginx
```

## Последние изменения
- Исправлены проблемы с прокруткой в продакшене
- Исправлен таймаут загрузочного экрана
- Добавлены комплексные исправления CSS

Текущий коммит: `90e2380` - "🔧 Fix scroll issues in production"
