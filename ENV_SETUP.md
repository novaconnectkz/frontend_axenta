# Настройка переменных окружения для Axenta Frontend

## Описание

Адрес бэкенда вынесен в переменные окружения для удобства переключения между разработкой и продакшеном.

## Быстрая настройка

### Для разработки (локальный бэкенд)

Скопируйте файл `env.example` в `.env.local`:

```bash
cp env.example .env.local
```

По умолчанию будет использоваться `http://localhost:8080`.

### Для продакшена (удаленный сервер)

Скопируйте файл `env.production.example` в `.env.local`:

```bash
cp env.production.example .env.local
```

Адрес бэкенда будет настроен согласно файлу `env.production.example`.

## Переменные окружения

| Переменная         | Описание            | Пример значения                                           |
| ------------------ | ------------------- | --------------------------------------------------------- |
| `VITE_BACKEND_URL` | URL бэкенда         | `http://localhost:8080` или `http://your-backend-ip:8080` |
| `VITE_APP_NAME`    | Название приложения | `Axenta CRM`                                              |
| `VITE_API_VERSION` | Версия API          | `v1`                                                      |

## Использование в коде

```typescript
import { config } from "@/config/env";

// Базовый URL API
console.log(config.apiBaseUrl); // http://your-backend-url:8080/api

// URL бэкенда
console.log(config.backendUrl); // http://your-backend-url:8080
```

## Файлы, которые были обновлены

Следующие файлы теперь используют переменные окружения вместо хардкода:

- `src/views/LoginPageFixed.vue`
- `src/views/SimpleLogin.vue`
- `src/context/auth.ts`
- `src/views/Billing.vue`

## Важные заметки

1. Файлы `.env.local` добавлены в `.gitignore` и не попадают в репозиторий
2. Для Vite переменные должны начинаться с `VITE_`
3. При изменении env файла необходимо перезапустить dev server

## Команды

```bash
# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build
```
