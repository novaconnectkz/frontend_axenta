# 🔧 Исправление ошибки типа пропа в Vue компоненте

## 🚨 Проблема

В консоли браузера появлялась ошибка Vue:
```
[Vue warn]: Invalid prop: type check failed for prop "size". Expected Number with value 32, got String with value "32".
  at <UserAvatar name="Чудин Андрей Геннадьевич" username="glomos" size="32"  ... >
```

## 🔍 Анализ проблемы

1. **Источник проблемы**: Компонент `UserAvatar` ожидает проп `size` как число (`number`)
2. **Причина**: В `AppLayout.vue` проп `size` передавался как строка `"32"` вместо числа `32`
3. **Локализация**: Файл `src/components/Layout/AppLayout.vue`, строки 219 и 232

## ✅ Решение

### Изменения в `AppLayout.vue`:

**Было (неправильно):**
```vue
<UserAvatar 
  :name="auth.user.value?.name" 
  :username="auth.user.value?.username"
  size="32"  <!-- ❌ Строка -->
  class="user-avatar"
/>

<UserAvatar 
  :name="auth.user.value?.name" 
  :username="auth.user.value?.username"
  size="48"  <!-- ❌ Строка -->
  large
  class="me-3"
/>
```

**Стало (правильно):**
```vue
<UserAvatar 
  :name="auth.user.value?.name" 
  :username="auth.user.value?.username"
  :size="32"  <!-- ✅ Число -->
  class="user-avatar"
/>

<UserAvatar 
  :name="auth.user.value?.name" 
  :username="auth.user.value?.username"
  :size="48"  <!-- ✅ Число -->
  large
  class="me-3"
/>
```

## 🎯 Результат

- ✅ Ошибка типа пропа устранена
- ✅ Vue предупреждения в консоли исчезли
- ✅ Компонент `UserAvatar` работает корректно
- ✅ Типы данных соответствуют ожиданиям

## 📋 Техническая информация

### Определение пропа в компоненте:
```typescript
interface Props {
  name?: string
  username?: string
  size?: number  // Ожидается число
  large?: boolean
  small?: boolean
  backgroundColor?: string
  textColor?: string
}
```

### Правильный способ передачи числовых пропов:
```vue
<!-- Правильно - с двоеточием для привязки -->
:size="32"

<!-- Неправильно - без двоеточия, передается как строка -->
size="32"
```

## 🔧 Рекомендации

1. **Всегда используйте `:prop="value"`** для передачи чисел, булевых значений и объектов
2. **Используйте `prop="value"`** только для строковых значений
3. **Проверяйте типы пропов** в определениях компонентов
4. **Следите за консолью браузера** на предмет предупреждений Vue

---
**Статус**: ✅ ИСПРАВЛЕНО
**Дата**: 13 октября 2025
**Файл**: `src/components/Layout/AppLayout.vue`
