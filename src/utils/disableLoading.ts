/**
 * Утилита для полного отключения всех loading состояний и размытия экрана
 */

export const disableAllLoading = () => {
  console.log('🚨 Отключаем все loading состояния...');
  
  // Скрываем loading screen
  const loadingScreen = document.getElementById('app-loading');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
    loadingScreen.style.opacity = '0';
    loadingScreen.style.visibility = 'hidden';
    loadingScreen.style.pointerEvents = 'none';
    console.log('✅ Loading screen скрыт');
  }
  
  // Показываем основное приложение
  const app = document.getElementById('app');
  if (app) {
    app.style.opacity = '1';
    app.style.visibility = 'visible';
    app.classList.add('loaded');
    console.log('✅ Основное приложение показано');
  }
  
  // Убираем backdrop со всех overlay
  const overlays = document.querySelectorAll('.v-overlay__scrim');
  overlays.forEach((overlay) => {
    (overlay as HTMLElement).style.display = 'none';
  });
  console.log(`✅ Убрано ${overlays.length} overlay backdrop`);
  
  // Убираем backdrop-filter со всех элементов
  const allElements = document.querySelectorAll('*');
  allElements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    if (htmlElement.style) {
      htmlElement.style.backdropFilter = 'none';
      htmlElement.style.webkitBackdropFilter = 'none';
    }
  });
  console.log('✅ Убран backdrop-filter со всех элементов');
  
  // Закрываем все диалоги
  const dialogs = document.querySelectorAll('.v-dialog');
  dialogs.forEach((dialog) => {
    (dialog as HTMLElement).style.display = 'none';
  });
  console.log(`✅ Закрыто ${dialogs.length} диалогов`);
  
  console.log('🎉 Все loading состояния отключены!');
};

// Добавляем функцию в window для вызова из консоли
if (typeof window !== 'undefined') {
  (window as any).disableAllLoading = disableAllLoading;
}
