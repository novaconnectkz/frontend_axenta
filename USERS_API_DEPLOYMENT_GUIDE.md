# 🚀 Руководство по развертыванию API пользователей

## Обзор

Этот документ описывает процесс развертывания новых endpoints для загрузки пользователей из Axenta Cloud API вместо локальной базы данных.

## 🎯 Цель

Заменить загрузку пользователей из локальной БД (1 пользователь) на загрузку из Axenta Cloud API (511+ пользователей).

## 📊 Результат

**До изменений:**
- API возвращал 1 пользователя из локальной БД ("NEWACRM")
- Статистика: 1 пользователь

**После изменений:**
- API возвращает **511 пользователей** из Axenta Cloud
- Статистика: 511 активных пользователей, 209 недавних входов
- Примеры: "Братановская Галина", "Братановский Виктор", "ООО_ТАУ"

## 🔧 Технические изменения

### Backend (ветка: 2025-10-11-izac-45ad8)

1. **api/axenta_proxy.go** - добавлены функции:
   - `GetUsersFromAxentaCloud()` - прокси к `https://axenta.cloud/api/cms/users/`
   - `GetUsersStatsFromAxentaCloud()` - статистика пользователей

2. **main.go** - обновлены endpoints:
   - `GET /api/auth/users` → `GetUsersFromAxentaCloud`
   - `GET /api/auth/users/stats` → `GetUsersStatsFromAxentaCloud`
   - `GET /api/auth/cms/users` → альтернативный endpoint

### Frontend (ветка: main)

1. **src/services/usersService.ts** - исправления:
   - Пути API: `/users` → `/auth/users`
   - Убран автоматический fallback на mock данные
   - Улучшена обработка ошибок

2. **src/types/users.ts** - обновлен интерфейс UserStats
3. **src/views/Users.vue** - улучшено логирование
4. **src/config/env.ts** - временно переключен на localhost

## 🚀 Развертывание

### Вариант 1: Локальное тестирование

```bash
# 1. Запустить локальный бэкенд
cd /Users/com/backend_axenta
go run main.go

# 2. Запустить фронтенд с очисткой кэша
cd /Users/com/frontend_axenta
rm -rf node_modules/.vite dist
npm run dev

# 3. Открыть в приватном окне браузера
open -a "Google Chrome" --args --incognito http://localhost:3001/users
```

### Вариант 2: Развертывание на продакшн

```bash
# 1. Развернуть бэкенд
cd /Users/com/backend_axenta
./deploy_users_api.sh

# 2. Переключить фронтенд на продакшн
cd /Users/com/frontend_axenta
./switch_to_production.sh
```

## 🐛 Решение проблем

### Проблема: Фронтенд обращается к старому API

**Симптомы:**
```
GET https://api.axenta.glonass-saratov.ru/api/auth/users 404 (Not Found)
```

**Решение:**
1. **Очистка кэша браузера:**
   - Откройте DevTools (F12)
   - Правый клик на кнопку обновления
   - "Жесткая перезагрузка" или Cmd+Shift+R

2. **Очистка кэша Vite:**
   ```bash
   rm -rf node_modules/.vite dist
   npm run dev
   ```

3. **Приватное окно:**
   ```bash
   open -a "Google Chrome" --args --incognito http://localhost:3001/users
   ```

### Проблема: API возвращает ошибку парсинга

**Симптомы:**
```
❌ Ошибка парсинга JSON от Axenta Cloud
```

**Решение:**
Убедитесь, что в `api/axenta_proxy.go` используется правильная структура:
```go
var axentaResponse struct {
    Count    int                      `json:"count"`
    Results  []map[string]interface{} `json:"results"`
}
```

## 📋 Проверка работы

### 1. Тест локального API

```bash
# Пользователи
curl -X GET "http://localhost:8080/api/auth/users?page=1&limit=5" \
  -H "Authorization: Token 5e515a8f2874fc78f31c74af45260333f2c84c35" \
  | jq '.data | {total: .total, count: (.items | length)}'

# Статистика  
curl -X GET "http://localhost:8080/api/auth/users/stats" \
  -H "Authorization: Token 5e515a8f2874fc78f31c74af45260333f2c84c35" \
  | jq '.data | {total_users, active_users, recent_users}'
```

### 2. Тест продакшн API

```bash
# После развертывания
curl -X GET "https://api.axenta.glonass-saratov.ru/api/auth/users" \
  -H "Authorization: Token YOUR_TOKEN"
```

## 🔗 Ссылки

- **Backend**: https://github.com/novaconnectkz/backend_axenta/tree/2025-10-11-izac-45ad8
- **Frontend**: https://github.com/novaconnectkz/frontend_axenta/tree/main

## ✅ Чек-лист развертывания

- [x] Код выгружен на GitHub
- [x] Локальное API работает (511 пользователей)
- [x] Созданы скрипты развертывания
- [ ] Развернуто на продакшн сервер
- [ ] Протестировано на продакшн
- [ ] Фронтенд переключен на продакшн API

## 🎯 Итог

После развертывания раздел "Пользователи" будет отображать **полный список реальных пользователей из Axenta Cloud** с корректной статистикой и авторизацией через существующую систему TokenAuth.
