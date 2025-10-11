#!/bin/bash

# Скрипт для удаленного деплоя через SSH
SERVER_IP="194.87.143.169"
SERVER_USER="root"
SERVER_PASS="g-t+XM#3an2YJM"

echo "🚀 Начинаем удаленный деплой на сервер $SERVER_IP"

# Команды для выполнения на сервере
REMOTE_COMMANDS="
set -e
echo '📍 Текущая папка:' && pwd
echo '📋 Проверяем статус сервиса:'
systemctl status axenta-backend || echo 'Сервис не найден'

echo '📁 Ищем папку с backend:'
find /opt -name '*axenta*' -type d 2>/dev/null || echo 'Папка не найдена в /opt'
find /var/www -name '*axenta*' -type d 2>/dev/null || echo 'Папка не найдена в /var/www'
find /home -name '*axenta*' -type d 2>/dev/null || echo 'Папка не найдена в /home'

echo '🔍 Проверяем процессы Go:'
ps aux | grep -i go || echo 'Go процессы не найдены'

echo '🌐 Проверяем порты:'
netstat -tlnp | grep :8080 || echo 'Порт 8080 не занят'

echo '📦 Проверяем Git репозитории:'
find / -name '.git' -type d 2>/dev/null | head -10 || echo 'Git репозитории не найдены'
"

echo "Команды для выполнения на сервере готовы"
echo "Для выполнения нужен интерактивный SSH с паролем"
echo ""
echo "Выполните вручную:"
echo "ssh -o StrictHostKeyChecking=no root@$SERVER_IP"
echo "Пароль: $SERVER_PASS"
echo ""
echo "Затем выполните команды диагностики:"
echo "$REMOTE_COMMANDS"
