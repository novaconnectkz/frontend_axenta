#!/bin/bash

echo "🚀 Выгружаем Frontend на GitHub..."

# Проверяем статус Git  
echo "📋 Статус Git:"
git status

# Добавляем remote если нужно
echo "🔗 Настраиваем remote..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/novaconnectkz/frontend_axenta.git

# Выгружаем код
echo "📤 Выгружаем на GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ Frontend успешно выгружен на GitHub!"
    echo "🔗 Репозиторий: https://github.com/novaconnectkz/frontend_axenta"
else
    echo "❌ Ошибка при выгрузке. Проверьте:"
    echo "1. Создан ли репозиторий на GitHub"
    echo "2. Правильно ли настроен remote" 
    echo "3. Есть ли права доступа"
fi
