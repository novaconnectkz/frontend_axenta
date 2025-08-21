# Исправление выравнивания чекбоксов

## ❌ Проблема

Чекбоксы в таблице оборудования были не выровнены по центру с остальными заголовками и содержимым ячеек.

## ✅ Решение

### 1. Обертка для центрирования

Добавил `div` с классом `d-flex justify-center` для чекбоксов:

```vue
<!-- Заголовок таблицы -->
<template #header.select>
  <div class="d-flex justify-center">
    <v-checkbox ... />
  </div>
</template>

<!-- Ячейки таблицы -->
<template #item.select="{ item }">
  <div class="d-flex justify-center">
    <v-checkbox ... />
  </div>
</template>
```

### 2. CSS стили для таблицы

Добавил специальные стили для выравнивания:

```css
/* Общее выравнивание ячеек */
.equipment-table :deep(.v-data-table__td) {
  vertical-align: middle !important;
  padding: 8px 16px !important;
}

.equipment-table :deep(.v-data-table__th) {
  vertical-align: middle !important;
  padding: 12px 16px !important;
}

/* Центрирование колонки с чекбоксами */
.equipment-table :deep(.v-data-table__td:first-child),
.equipment-table :deep(.v-data-table__th:first-child) {
  text-align: center !important;
  padding: 8px !important;
}
```

### 3. Улучшения чекбоксов

Добавил атрибуты для компактности:

- `density="comfortable"` - компактный размер
- `hide-details` - убирает лишние отступы

## 🎯 Результат

Теперь чекбоксы:

- ✅ **Идеально выровнены** по центру колонки
- ✅ **Вертикально центрированы** с содержимым строк
- ✅ **Компактные** и не занимают лишнего места
- ✅ **Единообразные** в заголовке и ячейках

## 📱 Проверка

1. Откройте `http://localhost:3004/warehouse`
2. Перейдите на вкладку "Оборудование"
3. Убедитесь, что выбран режим "Список"
4. Проверьте выравнивание чекбоксов в заголовке и строках

**Выравнивание исправлено! Чекбоксы теперь идеально центрированы.** ✅
