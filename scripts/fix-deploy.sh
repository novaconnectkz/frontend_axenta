#!/bin/bash

# 🔧 Скрипт для исправления проблем деплоя
# Используйте этот скрипт на сервере, если возникают проблемы с Git

echo "🔧 Fixing deployment issues..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверяем, что мы в Git репозитории
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: Not in a Git repository${NC}"
    exit 1
fi

echo -e "${YELLOW}📍 Current directory: $(pwd)${NC}"
echo -e "${YELLOW}📍 Current branch: $(git branch --show-current)${NC}"
echo -e "${YELLOW}📍 Current commit: $(git rev-parse --short HEAD)${NC}"

# Настраиваем Git
echo -e "${YELLOW}⚙️ Configuring Git...${NC}"
git config pull.rebase false
git config --global --add safe.directory $(pwd)

# Загружаем изменения
echo -e "${YELLOW}📥 Fetching changes...${NC}"
git fetch --all --prune

# Проверяем статус
echo -e "${YELLOW}📊 Checking repository status...${NC}"
git status

# Проверяем, есть ли расходящиеся ветки
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo -e "${YELLOW}⚠️ Local and remote branches are different${NC}"
    echo -e "${YELLOW}Local:  $LOCAL${NC}"
    echo -e "${YELLOW}Remote: $REMOTE${NC}"
    
    # Принудительно обновляемся
    echo -e "${YELLOW}🔄 Performing hard reset to origin/main...${NC}"
    git reset --hard origin/main
    
    echo -e "${GREEN}✅ Repository updated to latest version${NC}"
else
    echo -e "${GREEN}✅ Repository is already up to date${NC}"
fi

# Показываем текущее состояние
echo -e "${GREEN}📍 Updated to commit: $(git rev-parse --short HEAD)${NC}"
echo -e "${GREEN}📍 Commit message: $(git log -1 --pretty=%B)${NC}"

# Устанавливаем зависимости
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
if command -v npm &> /dev/null; then
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ npm not found${NC}"
fi

# Собираем проект
echo -e "${YELLOW}🏗️ Building project...${NC}"
if command -v npm &> /dev/null; then
    npm run build
    echo -e "${GREEN}✅ Project built successfully${NC}"
else
    echo -e "${RED}❌ Cannot build - npm not found${NC}"
fi

# Перезагружаем nginx (если есть права)
echo -e "${YELLOW}🔄 Reloading nginx...${NC}"
if command -v systemctl &> /dev/null; then
    if sudo systemctl reload nginx 2>/dev/null; then
        echo -e "${GREEN}✅ Nginx reloaded${NC}"
    else
        echo -e "${YELLOW}⚠️ Could not reload nginx (check permissions)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ systemctl not found${NC}"
fi

echo -e "${GREEN}🎉 Deployment fix completed!${NC}"
