// Утилиты для отладки темы

// Принудительная установка светлой темы
export function forceApplyLightTheme(): void {
  console.log('🌞 Принудительное применение светлой темы...');
  
  // Устанавливаем data-theme атрибут
  document.body.setAttribute('data-theme', 'light');
  
  // Очищаем localStorage от темной темы
  localStorage.setItem('theme', 'apple-light');
  localStorage.removeItem('user-theme-preference');
  
  // Если есть Vuetify theme, устанавливаем его
  const vuetifyApp = document.querySelector('#app')?.__vue_app__;
  if (vuetifyApp) {
    try {
      const theme = vuetifyApp.config.globalProperties.$vuetify?.theme;
      if (theme) {
        theme.global.name.value = 'apple-light';
      }
    } catch (e) {
      console.warn('Не удалось установить тему Vuetify:', e);
    }
  }
  
  console.log('✅ Светлая тема применена');
}

// Принудительная установка темной темы
export function forceApplyDarkTheme(): void {
  console.log('🌙 Принудительное применение темной темы...');
  
  // Устанавливаем data-theme атрибут
  document.body.setAttribute('data-theme', 'dark');
  
  // Устанавливаем в localStorage
  localStorage.setItem('theme', 'apple-dark');
  localStorage.setItem('user-theme-preference', 'manual');
  
  // Если есть Vuetify theme, устанавливаем его
  const vuetifyApp = document.querySelector('#app')?.__vue_app__;
  if (vuetifyApp) {
    try {
      const theme = vuetifyApp.config.globalProperties.$vuetify?.theme;
      if (theme) {
        theme.global.name.value = 'apple-dark';
      }
    } catch (e) {
      console.warn('Не удалось установить тему Vuetify:', e);
    }
  }
  
  console.log('✅ Темная тема применена');
}

// Проверка текущей темы
export function checkCurrentTheme(): void {
  const bodyTheme = document.body.getAttribute('data-theme');
  const localStorageTheme = localStorage.getItem('theme');
  const userPreference = localStorage.getItem('user-theme-preference');
  
  console.log('🔍 Проверка текущей темы:');
  console.log('  Body data-theme:', bodyTheme);
  console.log('  localStorage theme:', localStorageTheme);
  console.log('  User preference:', userPreference);
  
  // Проверяем CSS переменные
  const computedStyle = getComputedStyle(document.documentElement);
  const textPrimary = computedStyle.getPropertyValue('--text-primary').trim();
  const bgPrimary = computedStyle.getPropertyValue('--bg-primary').trim();
  
  console.log('  CSS переменные:');
  console.log('    --text-primary:', textPrimary);
  console.log('    --bg-primary:', bgPrimary);
  
  // Определяем актуальную тему
  const isLightTheme = textPrimary.includes('#1D1D1F') || textPrimary.includes('rgb(29, 29, 31)');
  console.log('  Актуальная тема:', isLightTheme ? 'Светлая' : 'Темная');
}

// Сброс темы к настройкам по умолчанию
export function resetTheme(): void {
  console.log('🔄 Сброс темы к настройкам по умолчанию...');
  
  // Очищаем localStorage
  localStorage.removeItem('theme');
  localStorage.removeItem('user-theme-preference');
  
  // Применяем светлую тему по умолчанию
  forceApplyLightTheme();
  
  console.log('✅ Тема сброшена');
}

// Добавляем функции в window для отладки
declare global {
  interface Window {
    forceLightTheme: () => void;
    forceDarkTheme: () => void;
    checkTheme: () => void;
    resetTheme: () => void;
  }
}

// Добавляем функции в window для удобства отладки
if (typeof window !== 'undefined') {
  window.forceLightTheme = forceApplyLightTheme;
  window.forceDarkTheme = forceApplyDarkTheme;
  window.checkTheme = checkCurrentTheme;
  window.resetTheme = resetTheme;
  
  console.log('🎨 Утилиты отладки темы загружены:');
  console.log('  window.forceLightTheme() - принудительно светлая тема');
  console.log('  window.forceDarkTheme() - принудительно темная тема');
  console.log('  window.checkTheme() - проверить текущую тему');
  console.log('  window.resetTheme() - сбросить тему');
}
