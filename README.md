# Frontend Axenta

Frontend часть проекта Axenta, построенная на Vue 3 с TypeScript и Vuetify.

## Технологии

- **Vue 3** - современный JavaScript фреймворк
- **TypeScript** - типизированный JavaScript
- **Vuetify 3** - Material Design компоненты
- **Vue Router 4** - клиентская маршрутизация
- **Pinia** - управление состоянием
- **Vite** - сборщик и dev сервер
- **Axios** - HTTP клиент

## Функциональность

- **Dashboard** - главная страница с таблицей объектов
- **Аутентификация** - контекст для управления пользователями
- **Responsive UI** - адаптивный интерфейс с Material Design
- **API интеграция** - связь с backend через REST API

## Компоненты

### Dashboard
- Отображение таблицы объектов из API
- Колонки: Название, IMEI, Широта, Долгота
- Интеграция с системой аутентификации

### Auth Context
- Управление состоянием пользователя
- Login/logout функциональность
- JWT токен обработка

## Запуск

1. Установите зависимости: `npm install`
2. Запустите dev сервер: `npm run dev`
3. Откройте браузер: `http://localhost:5173`

## Сборка

```bash
npm run build
```

## Структура проекта

```
frontend_axenta/
├── src/
│   ├── components/     # Vue компоненты
│   ├── views/         # Страницы (Dashboard)
│   ├── router/        # Vue Router настройки
│   ├── assets/        # Статические файлы
│   └── main.ts        # Точка входа
├── context/           # Контексты (auth)
├── public/           # Публичные файлы
└── package.json      # NPM зависимости
```

## API Интеграция

Frontend взаимодействует с backend через REST API:
- `GET /api/objects` - получение списка объектов

Базовый URL: `http://localhost:8080`