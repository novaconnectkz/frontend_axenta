#!/bin/bash

# 🚨 ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ ДЕПЛОЯ
# Запустите этот скрипт на сервере, если деплой не работает

echo "🚨 EMERGENCY DEPLOYMENT FIX"
echo "=========================="

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the right directory?"
    echo "Please cd to your frontend project directory first."
    exit 1
fi

echo "📍 Current directory: $(pwd)"

# Принудительно исправляем Git
echo "🔧 Fixing Git configuration..."
git config pull.rebase false
git config --global --add safe.directory $(pwd)

echo "📥 Fetching latest changes..."
git fetch --all --prune

echo "🔄 Force updating to latest version..."
git reset --hard origin/main

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building project..."
npm run build

echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

echo ""
echo "✅ EMERGENCY FIX COMPLETED!"
echo "Current commit: $(git rev-parse --short HEAD)"
echo "Commit message: $(git log -1 --pretty=%B)"
echo ""
echo "If you still have issues, check:"
echo "1. File permissions"
echo "2. Node.js version"
echo "3. Nginx configuration"
echo "4. Server logs: journalctl -u nginx -f"
