# 🔍 Отладка проблемы с отображением объектов

## 🎯 Проблема
В интерфейсе показывается "Объекты не найдены" и статистика 0 объектов, хотя API возвращает реальные данные.

## 🛠️ Решения для отладки

### 1. **Проверьте консоль браузера (F12)**

Откройте DevTools и посмотрите на логи:
- ✅ `🔄 Starting loadObjects...` - функция вызывается
- ✅ `🚀 ObjectsService.getObjects called with:` - сервис работает  
- ✅ `✅ Axenta Cloud CMS objects API response:` - API отвечает
- ✅ `📊 Converted items: X objects` - данные конвертируются
- ✅ `✅ Objects loaded successfully:` - объекты загружены

### 2. **Используйте кнопку "Войти как glomos"**

В интерфейсе Objects добавлена кнопка **"Войти как glomos"**:
1. Откройте http://localhost:3005/objects
2. Нажмите кнопку **"Войти как glomos"** в правом верхнем углу
3. Дождитесь сообщения об успешной авторизации
4. Объекты должны загрузиться автоматически

### 3. **Отладочная страница**

Откройте `debug-auth.html` в браузере для детальной проверки:
1. **Проверить localStorage** - есть ли токены
2. **Авторизоваться** - получить новый токен
3. **Тестировать объекты** - проверить API напрямую

### 4. **Проверьте сетевые запросы**

В DevTools → Network:
- Должен быть запрос к `https://axenta.cloud/api/cms/objects/`
- Статус должен быть `200 OK`
- В заголовках должен быть `Authorization: Token ...`

## 🔧 Возможные причины проблемы

### 1. **Не авторизован пользователь**
```javascript
// В консоли должно быть:
localStorage.getItem('axenta_token') // не null
```

### 2. **Ошибка в ObjectsService**
```javascript
// Проверьте логи:
console.log('📋 ObjectsService response:', response);
```

### 3. **Проблема с конвертацией данных**
```javascript
// Должно быть:
console.log('📊 Converted items:', convertedItems.length, 'objects');
```

### 4. **Ошибка в компоненте Objects.vue**
```javascript
// Проверьте:
console.log('✅ Objects loaded successfully:', {
  count: objects.value.length,
  total: response.data.total
});
```

## 🚀 Пошаговая отладка

### Шаг 1: Откройте консоль браузера
```
F12 → Console
```

### Шаг 2: Перейдите на страницу объектов
```
http://localhost:3005/objects
```

### Шаг 3: Нажмите "Войти как glomos"
Должны увидеть логи:
```
🔐 Attempting to login as glomos...
✅ Login successful!
🔄 Starting loadObjects...
🚀 ObjectsService.getObjects called with: ...
✅ Axenta Cloud CMS objects API response: ...
📊 Converted items: 50 objects
✅ Objects loaded successfully: ...
```

### Шаг 4: Проверьте результат
- Статистика должна показать реальные числа (не 0)
- В таблице должны появиться объекты
- Пагинация должна показать "X из Y"

## 🔍 Детальная диагностика

### Проверьте localStorage:
```javascript
console.log('Token:', localStorage.getItem('axenta_token'));
console.log('User:', localStorage.getItem('axenta_user'));
```

### Проверьте состояние компонента:
```javascript
// В консоли браузера:
console.log('Objects count:', document.querySelector('[data-testid="objects-count"]')?.textContent);
```

### Проверьте API напрямую:
```bash
curl -H "Authorization: Token YOUR_TOKEN" \
  "https://axenta.cloud/api/cms/objects/?page=1&per_page=5"
```

## ✅ Ожидаемый результат

После успешной отладки должны увидеть:
- **Статистика:** "Всего объектов: 3537"
- **Таблица:** Список реальных объектов (Renault, Камаз, МАЗ)
- **Пагинация:** "1-50 из 3537"
- **Данные:** Реальные компании (Elittrans, АЛЕКС-1 ООО)

## 🆘 Если ничего не помогает

1. **Очистите localStorage:**
   ```javascript
   localStorage.clear();
   ```

2. **Перезагрузите страницу** (Ctrl+F5)

3. **Нажмите "Войти как glomos"** еще раз

4. **Проверьте интернет-соединение** - API должен быть доступен

5. **Проверьте токен** - возможно, истек срок действия

---

**📋 Файлы для отладки:**
- `debug-auth.html` - Проверка авторизации
- Консоль браузера - Детальные логи
- DevTools Network - Сетевые запросы
