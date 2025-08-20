# Обновление интеграции с Axenta Cloud API

## Внесенные изменения

### 1. Обновление API endpoints

**Было:** Локальные backend endpoints

```
GET /api/objects?page=1&limit=50
```

**Стало:** Axenta Cloud API endpoints

```
GET /api/cms/objects/?page=1&per_page=50&ordering=name
```

### 2. Изменения в ObjectsService

- ✅ Обновлены все URL endpoints для соответствия Axenta Cloud API
- ✅ Изменен параметр `limit` на `per_page`
- ✅ Добавлен параметр `ordering` для сортировки
- ✅ Все endpoints теперь используют префикс `/cms/` и завершаются `/`

### 3. Обновления в компоненте Objects.vue

- ✅ Изменена пагинация с `limit` на `per_page`
- ✅ Добавлены опции для выбора количества элементов: 10, 50, 100, 1000
- ✅ Реализована сортировка с отправкой параметра `ordering`
- ✅ Поддержка обратной сортировки с префиксом `-`

### 4. Обновление типов данных

- ✅ Интерфейс `ObjectsResponse` обновлен для использования `per_page`
- ✅ Добавлен параметр `ordering` в `ObjectFilters`
- ✅ Обновлены типы для соответствия API

### 5. Конфигурация

- ✅ Добавлена возможность настройки URL на `https://axenta.cloud` в `env.example`
- ✅ Сохранена обратная совместимость с локальной разработкой

## Полный список обновленных endpoints

| Функция                | Новый endpoint                              | Параметры                               |
| ---------------------- | ------------------------------------------- | --------------------------------------- |
| Список объектов        | `GET /api/cms/objects/`                     | `page`, `per_page`, `ordering`, фильтры |
| Один объект            | `GET /api/cms/objects/:id/`                 | -                                       |
| Создание               | `POST /api/cms/objects/`                    | Данные объекта                          |
| Обновление             | `PUT /api/cms/objects/:id/`                 | Данные для обновления                   |
| Удаление               | `DELETE /api/cms/objects/:id/`              | -                                       |
| Плановое удаление      | `PUT /api/cms/objects/:id/schedule-delete/` | `scheduled_delete_at`                   |
| Отмена удаления        | `PUT /api/cms/objects/:id/cancel-delete/`   | -                                       |
| Корзина                | `GET /api/cms/objects-trash/`               | `page`, `per_page`, `search`            |
| Восстановление         | `PUT /api/cms/objects/:id/restore/`         | -                                       |
| Окончательное удаление | `DELETE /api/cms/objects/:id/permanent/`    | -                                       |
| Шаблоны                | `GET /api/cms/object-templates/`            | `page`, `per_page`, фильтры             |
| Статистика             | `GET /api/cms/objects/stats/`               | -                                       |
| Экспорт                | `GET /api/cms/objects/export/`              | `format`, фильтры                       |

## Параметры пагинации и сортировки

### Пагинация

- `page=1` - номер страницы (начинается с 1)
- `per_page=50` - количество элементов на странице
- Поддерживаемые значения per_page: **10, 50, 100, 1000**

### Сортировка

- `ordering=name` - сортировка по имени (по возрастанию)
- `ordering=-name` - сортировка по имени (по убыванию)
- `ordering=created_at` - по дате создания
- `ordering=-created_at` - по дате создания (новые первые)

### Фильтрация

- `status=active` - фильтр по статусу
- `type=vehicle` - фильтр по типу
- `search=текст` - поиск по названию, IMEI, номеру телефона
- `contract_id=1` - фильтр по договору
- `location_id=1` - фильтр по локации

## Пример полного URL

```
https://axenta.cloud/api/cms/objects/?page=1&per_page=50&ordering=name&status=active&type=vehicle&search=тест
```

Этот URL запросит:

- Первую страницу
- 50 объектов на странице
- Сортировку по имени
- Только активные объекты
- Только транспортные средства
- Содержащие "тест" в названии, IMEI или номере

## Обратная совместимость

Интерфейс сохраняет полную функциональность и может работать как с локальным backend (для разработки), так и с Axenta Cloud API (для продакшена) путем изменения переменной окружения `VITE_BACKEND_URL`.

## Готовность к продакшену

Интерфейс полностью готов для работы с Axenta Cloud API и может быть развернут в продакшене без дополнительных изменений.
