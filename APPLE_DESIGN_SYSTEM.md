# 🍎 Apple Design System для Axenta CRM

## 🎨 **Обзор**

Полноценная система дизайна в стиле Apple с поддержкой всех современных браузеров и устройств.

## 🎯 **Основные принципы Apple Design:**

### **1. Простота и Элегантность**
- Минималистичный интерфейс
- Четкая иерархия информации
- Интуитивная навигация

### **2. Качество и Детали**
- Плавные анимации и переходы
- Точная типографика
- Консистентные отступы и размеры

### **3. Доступность**
- Поддержка всех устройств
- Совместимость с ассистивными технологиями
- Адаптация под предпочтения пользователя

## 🎨 **Цветовая палитра Apple:**

### **🔵 Основные цвета:**
```css
--apple-blue: #007AFF        /* Основной синий */
--apple-blue-dark: #0056CC   /* Темный синий */
--apple-blue-light: #4DA6FF  /* Светлый синий */

--apple-green: #34C759       /* Успех */
--apple-red: #FF3B30         /* Ошибка */
--apple-orange: #FF9500      /* Предупреждение */
--apple-yellow: #FFCC00      /* Внимание */
--apple-purple: #AF52DE      /* Акцент */
--apple-pink: #FF2D92        /* Дополнительный */
--apple-indigo: #5856D6      /* Дополнительный */
--apple-teal: #64D2FF        /* Информация */
```

### **⚫ Нейтральные цвета:**
```css
--apple-gray: #8E8E93        /* Основной серый */
--apple-gray-2: #AEAEB2      /* Светлее */
--apple-gray-3: #C7C7CC      /* Еще светлее */
--apple-gray-4: #D1D1D6      /* Очень светлый */
--apple-gray-5: #E5E5EA      /* Почти белый */
--apple-gray-6: #F2F2F7      /* Фон */
```

## 📝 **Типографика:**

### **🔤 Шрифты:**
```css
/* Основной шрифт Apple */
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;

/* Моноширинный шрифт */
font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
```

### **📏 Размеры текста:**
```css
--apple-text-xs: 10px     /* Очень мелкий */
--apple-text-sm: 12px     /* Мелкий */
--apple-text-base: 14px   /* Базовый */
--apple-text-lg: 16px     /* Крупный */
--apple-text-xl: 18px     /* Заголовки */
--apple-text-2xl: 20px    /* Большие заголовки */
--apple-text-3xl: 24px    /* Основные заголовки */
--apple-text-4xl: 28px    /* Крупные заголовки */
--apple-text-5xl: 32px    /* Очень крупные */
--apple-text-6xl: 36px    /* Максимальные */
```

### **🔖 Веса шрифтов:**
```css
--apple-font-light: 300      /* Тонкий */
--apple-font-normal: 400     /* Обычный */
--apple-font-medium: 500     /* Средний */
--apple-font-semibold: 600   /* Полужирный */
--apple-font-bold: 700       /* Жирный */
--apple-font-heavy: 800      /* Очень жирный */
```

## 🧩 **Компоненты:**

### **🔘 AppleButton**
```vue
<AppleButton
  variant="primary"          <!-- primary, secondary, danger, ghost, text -->
  size="medium"             <!-- small, medium, large -->
  :loading="false"
  :disabled="false"
  prepend-icon="mdi-plus"
  append-icon="mdi-chevron-right"
  @click="handleClick"
>
  Нажать
</AppleButton>
```

### **📝 AppleInput**
```vue
<AppleInput
  v-model="value"
  type="text"               <!-- text, password, email, tel, url, search, number -->
  label="Введите текст"
  placeholder="Placeholder"
  helper-text="Подсказка"
  :error-message="error"
  variant="outlined"        <!-- outlined, filled, underlined -->
  size="medium"            <!-- small, medium, large -->
  prepend-icon="mdi-account"
  :clearable="true"
  :required="true"
/>
```

### **🃏 AppleCard**
```vue
<AppleCard
  title="Заголовок"
  subtitle="Подзаголовок"
  icon="mdi-information"
  variant="elevated"        <!-- elevated, outlined, flat -->
  :clickable="true"
  :loading="false"
  loading-text="Загрузка..."
>
  <template #header>
    <!-- Кастомный заголовок -->
  </template>
  
  <!-- Основной контент -->
  
  <template #footer>
    <!-- Футер карточки -->
  </template>
</AppleCard>
```

## 🎭 **Темы:**

### **☀️ Светлая тема (apple-light):**
- Фон: `#FFFFFF`
- Текст: `#000000`
- Акцент: `#007AFF`
- Карточки: белые с тенями

### **🌙 Темная тема (apple-dark):**
- Фон: `#000000`
- Текст: `#FFFFFF`
- Акцент: `#4DA6FF`
- Карточки: темные с границами

### **🔄 Переключение темы:**
```typescript
import { useTheme } from 'vuetify';

const theme = useTheme();
theme.global.name.value = 'apple-dark'; // или 'apple-light'
```

## 📱 **Responsive Design:**

### **📏 Breakpoints:**
```css
xs: 0px      /* Телефоны портрет */
sm: 480px    /* Телефоны ландшафт */
md: 768px    /* Планшеты */
lg: 1024px   /* Ноутбуки */
xl: 1280px   /* Десктопы */
xxl: 1536px  /* Большие экраны */
```

### **📱 Mobile First подход:**
- Дизайн сначала для мобильных
- Прогрессивное улучшение для больших экранов
- Touch-friendly элементы (минимум 44px)

## 🌐 **Совместимость с браузерами:**

### **✅ Полная поддержка:**
- **Chrome** 70+
- **Safari** 12+
- **Firefox** 65+
- **Edge** 79+
- **Safari iOS** 12+
- **Chrome Android** 70+

### **⚠️ Частичная поддержка:**
- **IE11** - базовая функциональность без backdrop-filter
- **Old Safari** - без некоторых CSS Grid функций
- **Old Android** - упрощенные анимации

### **🔧 Fallback стратегии:**
- **Backdrop-filter** → обычный background
- **CSS Grid** → Flexbox
- **CSS Variables** → статические значения
- **Modern animations** → простые transitions

## 🎯 **Использование:**

### **1. Импорт стилей:**
```typescript
// В main.ts
import "./styles/apple-design-system.css";
import "./styles/browser-compatibility.css";
import appleTheme from "./styles/vuetify-apple-theme";
```

### **2. Настройка Vuetify:**
```typescript
const vuetify = createVuetify({
  theme: {
    defaultTheme: "apple-light",
    themes: {
      "apple-light": appleTheme.light,
      "apple-dark": appleTheme.dark,
    },
  },
  defaults: appleTheme.components,
});
```

### **3. Использование компонентов:**
```vue
<template>
  <AppleCard title="Пример">
    <AppleInput v-model="text" label="Введите текст" />
    <AppleButton variant="primary" @click="save">
      Сохранить
    </AppleButton>
  </AppleCard>
</template>
```

## 🔧 **Кастомизация:**

### **🎨 Цвета:**
```css
/* Переопределение цветов */
:root {
  --apple-blue: #0066CC;     /* Ваш синий */
  --apple-green: #00AA44;    /* Ваш зеленый */
}
```

### **📏 Spacing:**
```css
/* Переопределение отступов */
:root {
  --apple-spacing-md: 20px;  /* Вместо 16px */
  --apple-spacing-lg: 30px;  /* Вместо 24px */
}
```

### **🔤 Типографика:**
```css
/* Кастомные шрифты */
:root {
  --apple-font-family: 'Your Font', -apple-system, sans-serif;
}
```

## 🧪 **Тестирование:**

### **📋 Чек-лист браузеров:**
- [ ] Chrome (последняя версия)
- [ ] Safari (последняя версия)
- [ ] Firefox (последняя версия)
- [ ] Edge (последняя версия)
- [ ] Safari iOS (iPhone/iPad)
- [ ] Chrome Android
- [ ] Samsung Internet
- [ ] IE11 (базовая функциональность)

### **📱 Чек-лист устройств:**
- [ ] iPhone (различные размеры)
- [ ] iPad (портрет/ландшафт)
- [ ] Android телефоны
- [ ] Android планшеты
- [ ] Ноутбуки (различные разрешения)
- [ ] Десктопы (большие экраны)

### **♿ Чек-лист доступности:**
- [ ] Навигация с клавиатуры
- [ ] Screen reader совместимость
- [ ] High contrast mode
- [ ] Reduced motion поддержка
- [ ] Touch accessibility

## 📊 **Производительность:**

### **⚡ Оптимизации:**
- **Critical CSS** в index.html для быстрой загрузки
- **GPU acceleration** для анимаций
- **Lazy loading** для тяжелых компонентов
- **Tree shaking** для неиспользуемых стилей

### **📈 Метрики:**
- **First Paint:** < 1s
- **Largest Contentful Paint:** < 2.5s
- **Cumulative Layout Shift:** < 0.1
- **First Input Delay:** < 100ms

## 🔮 **Roadmap:**

### **🎯 Ближайшие улучшения:**
- [ ] Dark mode переключатель
- [ ] Анимации переходов между страницами
- [ ] Микроанимации для кнопок
- [ ] Haptic feedback (iOS)

### **🚀 Долгосрочные цели:**
- [ ] Adaptive icons
- [ ] Dynamic type scaling
- [ ] Advanced accessibility features
- [ ] Performance monitoring

---

**🍎 Apple Design System v1.0**  
**📅 Дата создания:** 18 января 2025  
**🎯 Статус:** Готов к использованию  
**🌐 Совместимость:** Все современные браузеры + fallback для старых
