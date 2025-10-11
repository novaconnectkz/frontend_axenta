// Утилиты для инициализации авторизации при загрузке приложения

export interface AuthInitResult {
  hasAxentaAuth: boolean;
  hasLocalAuth: boolean;
  shouldRedirectToLogin: boolean;
  authType: 'axenta' | 'local' | 'none';
}

/**
 * Проверяет состояние авторизации при загрузке приложения
 */
export function checkAuthState(): AuthInitResult {
  // Проверяем Axenta Cloud токен
  const axentaToken = localStorage.getItem('axenta_token');
  const axentaUser = localStorage.getItem('axenta_user');
  
  // Проверяем локальный JWT токен
  const localToken = localStorage.getItem('local_access_token');
  const localUser = localStorage.getItem('local_user');
  
  const hasAxentaAuth = !!(axentaToken && axentaUser);
  const hasLocalAuth = !!(localToken && localUser);
  
  let authType: 'axenta' | 'local' | 'none' = 'none';
  
  if (hasAxentaAuth) {
    authType = 'axenta';
  } else if (hasLocalAuth) {
    authType = 'local';
  }
  
  console.log('🔍 Auth state check:', {
    axentaToken: axentaToken ? 'EXISTS' : 'MISSING',
    axentaUser: axentaUser ? 'EXISTS' : 'MISSING',
    localToken: localToken ? 'EXISTS' : 'MISSING',
    localUser: localUser ? 'EXISTS' : 'MISSING',
    hasAxentaAuth,
    hasLocalAuth,
    authType
  });
  
  return {
    hasAxentaAuth,
    hasLocalAuth,
    shouldRedirectToLogin: !hasAxentaAuth && !hasLocalAuth,
    authType
  };
}

/**
 * Проверяет валидность JWT токена
 */
export function isJWTTokenValid(token: string): boolean {
  if (!token) return false;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true; // Не JWT токен, считаем валидным
    
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return true; // Нет срока действия, считаем валидным
    
    return Date.now() < payload.exp * 1000;
  } catch (error) {
    console.error('Error checking JWT validity:', error);
    return false;
  }
}

/**
 * Очищает невалидные токены из localStorage
 */
export function cleanupInvalidTokens(): void {
  const axentaToken = localStorage.getItem('axenta_token');
  const localToken = localStorage.getItem('local_access_token');
  
  // Проверяем Axenta токен (если это JWT)
  if (axentaToken && !isJWTTokenValid(axentaToken)) {
    console.log('🧹 Removing invalid Axenta token');
    localStorage.removeItem('axenta_token');
    localStorage.removeItem('axenta_user');
    localStorage.removeItem('axenta_company');
  }
  
  // Проверяем локальный токен
  if (localToken && !isJWTTokenValid(localToken)) {
    console.log('🧹 Removing invalid local token');
    localStorage.removeItem('local_access_token');
    localStorage.removeItem('local_user');
  }
}

/**
 * Логирует текущее состояние localStorage для отладки
 */
export function debugAuthStorage(): void {
  console.log('🔍 Current localStorage auth state:');
  console.log('  axenta_token:', localStorage.getItem('axenta_token') ? 'EXISTS' : 'MISSING');
  console.log('  axenta_user:', localStorage.getItem('axenta_user') ? 'EXISTS' : 'MISSING');
  console.log('  axenta_company:', localStorage.getItem('axenta_company') ? 'EXISTS' : 'MISSING');
  console.log('  local_access_token:', localStorage.getItem('local_access_token') ? 'EXISTS' : 'MISSING');
  console.log('  local_refresh_token:', localStorage.getItem('local_refresh_token') ? 'EXISTS' : 'MISSING');
  console.log('  local_user:', localStorage.getItem('local_user') ? 'EXISTS' : 'MISSING');
}

/**
 * Восстанавливает состояние авторизации из localStorage
 */
export function restoreAuthState(): AuthInitResult {
  console.log('🔄 Restoring auth state from localStorage...');
  
  // Отладочная информация
  debugAuthStorage();
  
  // Очищаем невалидные токены
  cleanupInvalidTokens();
  
  // Проверяем состояние после очистки
  const result = checkAuthState();
  
  console.log('✅ Auth state restored:', result);
  
  return result;
}
