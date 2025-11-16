// Утилиты для полной очистки данных авторизации

/**
 * Полностью очищает все данные авторизации из localStorage
 */
export function clearAllAuthData(): void {
  console.log('🧹 Clearing all auth data from localStorage...');
  
  // Axenta Cloud данные
  const axentaKeys = [
    'axenta_token',
    'axenta_user', 
    'axenta_company',
    'axenta_token_expiry',
    'token',  // Старый ключ
    'user',   // Старый ключ
  ];
  
  // Локальные данные
  const localKeys = [
    'local_access_token',
    'local_refresh_token',
    'local_user',
  ];
  
  // Демо данные
  const demoKeys = [
    'demo_token',
    'demo_user',
    'demo_company',
  ];
  
  // Другие возможные ключи
  const otherKeys = [
    'auth_token',
    'auth_user',
    'current_user',
    'jwt_token',
    'bearer_token',
    // Устаревшие ключи NovaConnect (раньше сохранялись в браузере)
    'novaconnect_token',
    'novaconnect_settings',
  ];
  
  const allKeys = [...axentaKeys, ...localKeys, ...demoKeys, ...otherKeys];
  
  let clearedCount = 0;
  allKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      clearedCount++;
      console.log(`  ❌ Removed: ${key}`);
    }
  });
  
  console.log(`✅ Cleared ${clearedCount} auth-related items from localStorage`);
  
  // Дополнительно очищаем sessionStorage
  allKeys.forEach(key => {
    if (sessionStorage.getItem(key)) {
      sessionStorage.removeItem(key);
      console.log(`  ❌ Removed from session: ${key}`);
    }
  });

  // Удаляем все ключи вида novaconnect_token_<companyId> на случай кэширования по компаниям
  const allLocalKeys = Object.keys(localStorage);
  allLocalKeys.forEach(k => {
    if (k.startsWith('novaconnect_token_')) {
      localStorage.removeItem(k);
      console.log(`  ❌ Removed: ${k}`);
    }
  });
}

/**
 * Проверяет, остались ли данные авторизации после очистки
 */
export function verifyAuthCleared(): boolean {
  const remainingKeys = [];
  
  // Проверяем основные ключи
  const keysToCheck = [
    'axenta_token',
    'axenta_user',
    'local_access_token', 
    'local_user',
    'token',
    'user'
  ];
  
  keysToCheck.forEach(key => {
    if (localStorage.getItem(key)) {
      remainingKeys.push(key);
    }
  });
  
  if (remainingKeys.length > 0) {
    console.warn('⚠️ Some auth data still remains:', remainingKeys);
    return false;
  }
  
  console.log('✅ All auth data successfully cleared');
  return true;
}

/**
 * Принудительная очистка всех данных (для отладки)
 */
export function forceLogout(): void {
  console.log('🚨 Force logout initiated...');
  
  // Очищаем все данные
  clearAllAuthData();
  
  // Проверяем результат
  const isCleared = verifyAuthCleared();
  
  if (!isCleared) {
    console.warn('⚠️ Force clearing remaining items...');
    // Принудительно очищаем все localStorage
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.includes('token') || key.includes('user') || key.includes('auth') || key.includes('axenta')) {
        localStorage.removeItem(key);
        console.log(`  🔥 Force removed: ${key}`);
      }
    });
  }
  
  // Перезагружаем страницу для полного сброса состояния
  console.log('🔄 Reloading page to reset state...');
  window.location.href = '/login';
}
