# Настройка виджета "Обзор пользователей"

## 📋 Обзор

Виджет "Обзор пользователей" теперь настроен для работы с реальными данными из API. Виджет автоматически получает статистику пользователей из эндпоинта `/api/auth/users/stats` и отображает её в удобном формате.

## 🔧 Что было сделано

### 1. Обновлен бэкенд API

**Файл:** `/Users/com/backend_axenta/api/users.go`

- ✅ Обновлен эндпоинт `GetUsersStats` для возврата полной статистики
- ✅ Добавлен подсчет администраторов и обычных пользователей
- ✅ Добавлена статистика по ролям и типам пользователей
- ✅ Добавлен подсчет недавних входов

**Новые поля в ответе API:**
```json
{
  "status": "success",
  "data": {
    "total": 28,
    "active": 25,
    "inactive": 3,
    "admins": 4,
    "regular_users": 24,
    "total_users": 28,
    "active_users": 25,
    "inactive_users": 3,
    "recent_users": 5,
    "recent_logins": 12,
    "by_role": {
      "Администратор": 4,
      "Пользователь": 20,
      "Клиент": 4
    },
    "by_type": {
      "active": 25,
      "inactive": 3,
      "admin": 4,
      "regular": 24
    },
    "role_stats": [
      {"role_name": "Администратор", "count": 4},
      {"role_name": "Пользователь", "count": 20},
      {"role_name": "Клиент", "count": 4}
    ],
    "last_updated": "2025-01-27T15:30:00Z"
  }
}
```

### 2. Обновлены типы данных

**Файлы:** 
- `/Users/com/frontend_axenta/src/types/users.ts`
- `/Users/com/frontend_axenta/src/types/dashboard.ts`

- ✅ Добавлены новые поля в интерфейс `UserStats`
- ✅ Обеспечена совместимость с API

### 3. Обновлен UsersService

**Файл:** `/Users/com/frontend_axenta/src/services/usersService.ts`

- ✅ Улучшена функция `getUsersStats()` для работы с новым API
- ✅ Добавлена обработка ошибок с fallback на mock данные
- ✅ Добавлено логирование для отладки

### 4. Обновлен DashboardService

**Файл:** `/Users/com/frontend_axenta/src/services/dashboardService.ts`

- ✅ Добавлена поддержка реальных данных пользователей
- ✅ Добавлены методы управления режимом данных
- ✅ Интегрирован UsersService

### 5. Виджет UsersOverviewWidget

**Файл:** `/Users/com/frontend_axenta/src/components/Dashboard/UsersOverviewWidget.vue`

- ✅ Виджет уже был готов к работе с реальными данными
- ✅ Поддерживает все новые поля статистики

## 🚀 Как использовать

### Автоматический режим

Виджет автоматически:
1. Пытается загрузить данные из API `/api/auth/users/stats`
2. При ошибке (например, отсутствие авторизации) переключается на mock данные
3. Обновляется каждые 5 минут (настраивается через `refreshInterval`)

### Программное управление

```javascript
import { dashboardService } from '@/services/dashboardService';

// Включить реальные данные пользователей
dashboardService.setRealUsersDataMode(true);

// Проверить текущий режим
const isRealMode = dashboardService.isRealUsersDataMode();

// Получить статистику напрямую
import { usersService } from '@/services/usersService';
const stats = await usersService.getUsersStats();
```

## 🧪 Тестирование

### 1. Тест API

```bash
cd /Users/com/frontend_axenta
node test-users-api.cjs
```

### 2. Тест виджета

Откройте файл `test-users-widget.html` в браузере:
```bash
open test-users-widget.html
```

### 3. Тест в приложении

1. Запустите бэкенд: `cd /Users/com/backend_axenta && go run main.go`
2. Запустите фронтенд: `cd /Users/com/frontend_axenta && npm run dev`
3. Откройте дашборд и проверьте виджет "Обзор пользователей"

## 🔐 Авторизация

Для получения реальных данных необходима авторизация:

1. **В браузере:** Войдите в систему через стандартную форму авторизации
2. **В API тестах:** Установите переменную окружения:
   ```bash
   AXENTA_TOKEN=your_token node test-users-api.cjs
   ```

## 📊 Отображаемые данные

Виджет показывает:

- **Всего пользователей** - общее количество
- **Активные** - пользователи с `is_active = true`
- **Неактивные** - пользователи с `is_active = false`  
- **Администраторы** - пользователи с ролью "admin"
- **Обычные** - активные пользователи минус администраторы

### Дополнительная информация:

- **Круговая диаграмма** - соотношение активных/неактивных
- **Список с иконками** - детализация по типам
- **Процент администраторов** - от общего числа пользователей

## 🛠️ Настройка

### Интервал обновления

В компоненте виджета:
```vue
<UsersOverviewWidget 
  :refresh-interval="300"  <!-- 5 минут -->
  widget-id="users-overview-1"
/>
```

### Переключение режимов данных

```javascript
// Включить реальные данные
dashboardService.setRealUsersDataMode(true);

// Вернуться к mock данным
dashboardService.setRealUsersDataMode(false);
```

## 🐛 Отладка

### Логи в консоли

Виджет выводит подробные логи:
- `📊 Загрузка статистики пользователей из API...`
- `📊 Получена статистика пользователей:` + данные
- `❌ Ошибка загрузки статистики пользователей:` + ошибка

### Проверка API

```bash
# Проверка локального сервера
curl -H "Authorization: Token YOUR_TOKEN" http://localhost:8080/api/auth/users/stats

# Проверка продакшн сервера  
curl -H "Authorization: Token YOUR_TOKEN" https://api.axenta.glonass-saratov.ru/api/auth/users/stats
```

## ✅ Результат

Виджет "Обзор пользователей" теперь:

- ✅ Получает реальные данные из API
- ✅ Показывает актуальную статистику пользователей
- ✅ Автоматически обновляется
- ✅ Имеет fallback на mock данные при ошибках
- ✅ Поддерживает все типы пользователей и ролей
- ✅ Отображает красивую визуализацию данных

Виджет готов к использованию в продакшн среде! 🎉
