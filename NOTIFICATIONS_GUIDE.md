# Руководство по системе уведомлений

## Обзор

Система уведомлений в Axenta CRM унифицирована и переведена на русский язык. Все уведомления теперь используют единый стиль и локализацию.

## Основные компоненты

### 1. useNotifications() composable

Основной composable для работы с уведомлениями:

```typescript
import { useNotifications } from '@/composables/useNotifications'

const notifications = useNotifications()

// Основные методы
notifications.showSuccess('Заголовок', 'Сообщение')
notifications.showError('Заголовок', 'Сообщение')
notifications.showWarning('Заголовок', 'Сообщение')
notifications.showInfo('Заголовок', 'Сообщение')

// Специализированные методы
notifications.showAuthError('Сообщение')
notifications.showNetworkError('Сообщение')
notifications.showValidationError('Сообщение', fields)
notifications.showPermissionError('Сообщение')
notifications.showDuplicateError('Сообщение')
```

### 2. ErrorHandler класс

Универсальный обработчик ошибок API:

```typescript
import { errorHandler } from '@/utils/errorHandler'

// Автоматическая обработка ошибок API
try {
  const response = await api.createUser(userData)
  errorHandler.showSuccess('Пользователь создан', 'Пользователь успешно добавлен в систему')
} catch (error) {
  errorHandler.handleApiError(error, 'создание пользователя')
}

// Специализированные методы
errorHandler.handleDuplicateUserError(error)
errorHandler.handleDuplicateRoleError(error)
```

## Примеры использования

### Создание пользователя

```vue
<script setup>
import { errorHandler } from '@/utils/errorHandler'

const createUser = async (userData) => {
  try {
    const response = await api.createUser(userData)
    
    if (response.ok) {
      errorHandler.showSuccess('Пользователь создан', `Пользователь успешно создан! ID: ${response.data.id}`)
      router.push('/users')
    } else {
      const apiError = {
        response: {
          status: response.status,
          data: response.data
        }
      }
      errorHandler.handleApiError(apiError, 'создание пользователя')
    }
  } catch (error) {
    errorHandler.handleApiError(error, 'создание пользователя')
  }
}
</script>
```

### Обработка валидации

```vue
<script setup>
import { useNotifications } from '@/composables/useNotifications'

const notifications = useNotifications()

const validateForm = () => {
  if (!formValid.value) {
    notifications.showValidationError('Пожалуйста, исправьте ошибки в форме')
    return false
  }
  return true
}
</script>
```

### Обработка авторизации

```vue
<script setup>
import { useNotifications } from '@/composables/useNotifications'

const notifications = useNotifications()

const checkAuth = () => {
  if (!isAuthenticated.value) {
    notifications.showAuthError('Необходимо войти в систему')
    return false
  }
  return true
}
</script>
```

## Типы уведомлений

### Success (Успех)
- **Цвет**: Зеленый
- **Иконка**: mdi-check-circle
- **Использование**: Успешные операции

### Error (Ошибка)
- **Цвет**: Красный
- **Иконка**: mdi-alert-circle
- **Использование**: Ошибки, исключения

### Warning (Предупреждение)
- **Цвет**: Оранжевый
- **Иконка**: mdi-alert
- **Использование**: Предупреждения, не критичные проблемы

### Info (Информация)
- **Цвет**: Синий
- **Иконка**: mdi-information
- **Использование**: Информационные сообщения

## Специализированные уведомления

### showAuthError()
- **Назначение**: Ошибки авторизации
- **Особенности**: Кнопка "Войти", не скрывается автоматически

### showNetworkError()
- **Назначение**: Ошибки сети
- **Особенности**: Длительный timeout (10 секунд)

### showValidationError()
- **Назначение**: Ошибки валидации
- **Особенности**: Поддержка полей с ошибками

### showPermissionError()
- **Назначение**: Недостаточно прав
- **Особенности**: Средний timeout (6 секунд)

### showDuplicateError()
- **Назначение**: Дублирование данных
- **Особенности**: Длительный timeout (8 секунд)

## Миграция со старой системы

### Было:
```typescript
const showSnackbar = (text: string, color: string = 'success') => {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

showSnackbar('Пользователь создан', 'success')
showSnackbar('Ошибка создания', 'error')
```

### Стало:
```typescript
import { useNotifications } from '@/composables/useNotifications'

const notifications = useNotifications()

notifications.showSuccess('Пользователь создан', 'Пользователь успешно добавлен')
notifications.showError('Ошибка создания', 'Не удалось создать пользователя')
```

## Глобальные уведомления

Глобальные уведомления автоматически подключены в `App.vue`:

```vue
<template>
  <div id="app">
    <!-- Контент приложения -->
    <GlobalNotifications />
  </div>
</template>
```

## Локализация

Все сообщения об ошибках в backend переведены на русский язык:

- `"User with this email or username already exists"` → `"Пользователь с таким email или именем пользователя уже существует"`
- `"Invalid credentials"` → `"Неверные учетные данные"`
- `"Failed to create user"` → `"Ошибка создания пользователя"`

## Лучшие практики

1. **Используйте специализированные методы** для типичных ошибок
2. **Предоставляйте контекст** в описании ошибки
3. **Используйте ErrorHandler** для обработки API ошибок
4. **Не дублируйте уведомления** - система автоматически предотвращает спам
5. **Тестируйте уведомления** в разных сценариях

## Тестирование

Для тестирования уведомлений используйте:

```typescript
// В консоли браузера или в тестах
const notifications = useNotifications()
notifications.showSuccess('Тест', 'Это тестовое уведомление')
notifications.showError('Ошибка', 'Это тестовая ошибка')
notifications.showDuplicateError('Дублирование', 'Это тест дублирования')
```
