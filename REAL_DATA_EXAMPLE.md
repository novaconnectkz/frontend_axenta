# 🚗 Пример обработки реальных данных Axenta Cloud

## 📊 Исходные данные из API

Вот что мы получаем от `https://axenta.cloud/api/cms/objects/`:

```json
{
  "count": 3537,
  "next": "https://axenta.cloud/api/cms/objects/?ordering=name&page=2&per_page=50",
  "previous": null,
  "results": [
    {
      "id": 24452,
      "name": "FAW М459АХ 164",
      "uniqueId": "179576",
      "creatorName": "АЛЕКС-1 ООО",
      "creatorId": 2847,
      "creatorIsActive": true,
      "accountId": 1943,
      "accountName": "АЛЕКС-1 ООО",
      "accountType": "client",
      "accountIsActive": true,
      "phoneNumbers": ["+79873700934"],
      "deviceTypeName": "Wialon Combine",
      "lastMessageDatetime": "2025-10-11T20:36:38+00:00",
      "createdAt": "2025-06-30T14:32:04.662335Z",
      "isActive": true,
      "currentUserAccess": [
        "view", "view_detail", "edit_detail",
        "view_additional_fields", "edit_additional_fields",
        "edit_other_properties", "change_icon", "rename",
        "delete", "access_control", "reports_and_messages",
        "view_connection_settings", "edit_connection_settings",
        "management_sensors", "view_command", "send_command",
        "management_command", "change_trip_detector",
        "using_object", "view_msg_filter", "edit_msg_filter",
        "management_event"
      ]
    }
  ]
}
```

## 🔄 Как система адаптирует данные

### 1. Определение структуры ответа:
```typescript
if (response.data.count !== undefined && response.data.results) {
  // Новая структура Axenta Cloud API
  return convertToLocalFormat(response.data);
} else {
  // Старая структура - возвращаем как есть
  return response.data;
}
```

### 2. Конвертация объекта:
```typescript
// Исходный объект Axenta Cloud
const axentaObject = {
  id: 24452,
  name: "FAW М459АХ 164",
  uniqueId: "179576",
  accountName: "АЛЕКС-1 ООО",
  deviceTypeName: "Wialon Combine",
  // ...
};

// Конвертированный объект для локального использования
const localObject = {
  // Основные поля
  id: 24452,
  name: "FAW М459АХ 164",
  type: "vehicle", // Определяется по deviceTypeName
  description: "Wialon Combine - АЛЕКС-1 ООО",
  
  // Поля из Axenta Cloud
  accountName: "АЛЕКС-1 ООО",
  creatorName: "АЛЕКС-1 ООО",
  deviceTypeName: "Wialon Combine",
  phoneNumbers: ["+79873700934"],
  uniqueId: "179576",
  lastMessageDatetime: "2025-10-11T20:36:38+00:00",
  
  // Статус
  status: "active",
  is_active: true,
  
  // Адаптированные поля
  address: "АЛЕКС-1 ООО",
  imei: "179576",
  phone_number: "+79873700934",
  company_id: 1943,
  
  // Дополнительная информация
  company: {
    id: 1943,
    name: "АЛЕКС-1 ООО"
  }
};
```

### 3. Итоговая структура ответа:
```typescript
{
  status: "success",
  data: {
    items: [localObject], // Массив конвертированных объектов
    total: 3537,
    page: 1,
    per_page: 50,
    total_pages: 71
  }
}
```

## 🎯 Определение типа объекта

Система автоматически определяет тип объекта по названию устройства:

```typescript
private determineObjectType(deviceTypeName: string): string {
  const deviceType = deviceTypeName?.toLowerCase() || "";
  
  if (deviceType.includes("wialon") || deviceType.includes("omnicomm")) {
    return "vehicle"; // Транспортное средство
  } else if (deviceType.includes("навтелеком") || deviceType.includes("умка")) {
    return "equipment"; // Оборудование
  } else if (deviceType.includes("arnavi")) {
    return "asset"; // Активы
  }
  
  return "vehicle"; // По умолчанию
}
```

### Примеры типов:
- **"Wialon Combine"** → `vehicle`
- **"Omnicomm"** → `vehicle`
- **"Навтелеком"** → `equipment`
- **"УМКа3xx"** → `equipment`
- **"Arnavi"** → `asset`

## 🔍 Fallback система

Если основной endpoint недоступен, система пробует альтернативы:

1. **Основной:** `/cms/objects/` (Axenta Cloud CMS)
2. **Fallback 1:** `/auth/objects` (аутентифицированный)
3. **Fallback 2:** `/objects` (публичный)

Каждый fallback также проверяет структуру ответа и адаптирует при необходимости.

## 📱 Отображение в интерфейсе

### Карточка объекта:
```
┌─────────────────────────────────────────┐
│ FAW М459АХ 164                    🟢 Активен │
├─────────────────────────────────────────┤
│ ID: 24452                               │
│ Уникальный ID: 179576                   │
│ Компания: АЛЕКС-1 ООО                   │
│ Создатель: АЛЕКС-1 ООО                  │
│ Устройство: Wialon Combine              │
│ Телефоны: +79873700934                  │
│ Последнее сообщение: 11.10.2025 23:36   │
│ Создан: 30.06.2025 17:32                │
└─────────────────────────────────────────┘
```

## ✅ Преимущества адаптации

### 1. **Совместимость:**
- Существующий код продолжает работать
- Новые поля доступны для использования
- Плавный переход на новое API

### 2. **Гибкость:**
- Автоматическое определение структуры
- Fallback на старые endpoints
- Обработка разных форматов ответов

### 3. **Богатые данные:**
- Реальная информация о компаниях
- Актуальные статусы устройств
- Детальные права доступа
- Время последних сообщений

## 🚀 Результат

Теперь система показывает:
- **3,537 реальных объектов** вместо тестовых
- **Актуальные компании:** АЛЕКС-1 ООО, Elittrans, Волга1984
- **Реальные устройства:** Wialon Combine, Omnicomm, Навтелеком
- **Живые данные:** последние сообщения от 11.10.2025

Пользователи видят настоящую систему мониторинга транспорта! 🎉
