#!/bin/bash

# 🔄 Скрипт переключения фронтенда на продакшн API

set -e

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_header() {
    echo -e "${BLUE}"
    echo "================================================================"
    echo "🔄 ПЕРЕКЛЮЧЕНИЕ НА ПРОДАКШН API"
    echo "================================================================"
    echo -e "${NC}"
}

print_header

print_info "Переключение фронтенда на продакшн сервер..."

# Проверяем текущую конфигурацию
current_url=$(grep -o 'http://localhost:8080\|https://api.axenta.glonass-saratov.ru' src/config/env.ts | head -1)
print_info "Текущий API URL: $current_url"

if [[ "$current_url" == "http://localhost:8080" ]]; then
    print_info "Переключение на продакшн API..."
    
    # Заменяем localhost на продакшн URL
    sed -i '' 's|http://localhost:8080|https://api.axenta.glonass-saratov.ru|g' src/config/env.ts
    sed -i '' 's|локальный сервер для тестирования новых endpoints|наш бэкенд для продакшена|g' src/config/env.ts
    
    print_success "Конфигурация обновлена на продакшн API"
    
    # Фиксируем изменения
    git add src/config/env.ts
    git commit -m "config: Переключение на продакшн API после развертывания endpoints пользователей

- Возврат backendUrl на https://api.axenta.glonass-saratov.ru
- Новые endpoints пользователей развернуты на продакшн сервере"
    
    print_success "Изменения зафиксированы в git"
    
    # Отправляем на GitHub
    git push origin main
    print_success "Изменения отправлены на GitHub"
    
elif [[ "$current_url" == "https://api.axenta.glonass-saratov.ru" ]]; then
    print_warning "Уже настроен на продакшн API"
else
    print_warning "Неизвестная конфигурация API URL"
fi

print_info "Текущая конфигурация:"
grep -A 2 -B 2 "backendUrl:" src/config/env.ts

print_success "Готово! Фронтенд настроен на продакшн API."
