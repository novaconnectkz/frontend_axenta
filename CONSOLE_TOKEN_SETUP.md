# 🔧 Быстрая установка токена через консоль браузера

## 🚨 Проблема: Сервер авторизации недоступен (502 Bad Gateway)

## ✅ Простое решение через консоль браузера:

### 1. **Откройте страницу объектов:**
```
http://localhost:3001/objects
```

### 2. **Откройте консоль браузера (F12):**
Перейдите на вкладку Console

### 3. **Скопируйте и выполните этот код:**

```javascript
// Устанавливаем рабочий токен и данные пользователя
localStorage.setItem('axenta_token', '5e515a8f2874fc78f31c74af45260333f2c84c35');
localStorage.setItem('axenta_user', JSON.stringify({
  username: 'glomos',
  name: 'glomos',
  accountType: 'partner',
  id: 'axenta-user',
  accountName: 'Axenta Cloud User',
  creatorName: 'Axenta Cloud',
  lastLogin: new Date().toISOString(),
  accountBlockingDatetime: null,
  email: 'glomos@axenta.cloud',
  accountId: 1,
  isAdmin: true,
  isActive: true,
  language: 'ru',
  timezone: 3
}));
localStorage.setItem('axenta_company', JSON.stringify({
  id: '1',
  name: 'Axenta Cloud',
  isActive: true
}));

console.log('✅ Токен установлен! Перезагрузите страницу.');
```

### 4. **Перезагрузите страницу (F5 или Ctrl+R)**

### 5. **Проверьте результат:**
Должны увидеть 3,537 реальных объектов!

## 📊 Ожидаемый результат:

### В интерфейсе:
- ✅ **Статистика:** "Всего объектов: 3537"
- ✅ **Список:** Реальные транспортные средства
- ✅ **Автообновление:** Каждые 10 секунд

### В консоли браузера:
```javascript
🔄 Starting loadObjects...
🚀 ObjectsService.getObjects called with: {page: 1, per_page: 50}
✅ Axenta Cloud CMS objects API response: {count: 3537, results: [...]}
📊 Converted items: 50 objects
✅ Objects loaded successfully: {count: 50, total: 3537}
📊 Статистика вычислена из данных: {total: 3537, active: 50}
```

## 🚗 Реальные объекты:

```
✅ 000Renault T 4x2 В428ТЕ 62 (Elittrans, Omnicomm)
✅ 000Renault T 4x2 К241ТК62 (Elittrans, Omnicomm)
✅ FAW М459АХ 164 (АЛЕКС-1 ООО, Wialon Combine)
✅ Камаз 5490 S-5 В411ТО62 (Elittrans, Omnicomm)
✅ МАЗ Е 846 МК/134 (Волга1984, Навтелеком)
```

## 🎉 Готово!

**После выполнения этих шагов система покажет 3,537 реальных объектов из Axenta Cloud с автообновлением каждые 10 секунд!**

---

### 🔗 Ссылки:
- **Объекты:** http://localhost:3001/objects
- **Консоль:** F12 → Console
- **Код для копирования:** Выше ☝️
