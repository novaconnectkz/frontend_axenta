// Утилиты для управления демо режимом

import usersService from '@/services/usersService';

// Включение демо режима для всех сервисов
export function enableDemoMode(): void {
  console.log('🎭 Включение демо режима...');
  
  // Включаем демо данные для пользователей
  usersService.enableMockData();
  
  // Сохраняем состояние в localStorage
  localStorage.setItem('axenta_demo_mode', 'true');
  
  console.log('✅ Демо режим включен');
}

// Отключение демо режима для всех сервисов
export function disableDemoMode(): void {
  console.log('🔧 Отключение демо режима...');
  
  // Отключаем демо данные для пользователей
  usersService.disableMockData();
  
  // Удаляем состояние из localStorage
  localStorage.removeItem('axenta_demo_mode');
  
  console.log('✅ Демо режим отключен');
}

// Проверка статуса демо режима
export function isDemoModeEnabled(): boolean {
  const demoMode = localStorage.getItem('axenta_demo_mode');
  return demoMode === 'true';
}

// Переключение демо режима
export function toggleDemoMode(): boolean {
  const isEnabled = isDemoModeEnabled();
  
  if (isEnabled) {
    disableDemoMode();
    return false;
  } else {
    enableDemoMode();
    return true;
  }
}

// Инициализация демо режима при загрузке приложения
export function initDemoMode(): void {
  const demoMode = localStorage.getItem('axenta_demo_mode');
  
  if (demoMode === 'true') {
    console.log('🎭 Восстановление демо режима из localStorage...');
    usersService.enableMockData();
    console.log('✅ Демо режим восстановлен');
  }
}

// Добавляем глобальные функции для отладки в консоли браузера
declare global {
  interface Window {
    enableDemo: () => void;
    disableDemo: () => void;
    toggleDemo: () => boolean;
    isDemoEnabled: () => boolean;
  }
}

// Добавляем функции в window для удобства отладки
if (typeof window !== 'undefined') {
  window.enableDemo = enableDemoMode;
  window.disableDemo = disableDemoMode;
  window.toggleDemo = toggleDemoMode;
  window.isDemoEnabled = isDemoModeEnabled;
}
