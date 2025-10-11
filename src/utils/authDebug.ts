// Утилиты для отладки авторизации

/**
 * Показывает полную информацию о состоянии авторизации
 */
export function debugAuthState(): void {
  console.group('🔍 Auth Debug Information');
  
  // Проверяем localStorage
  console.group('📦 localStorage');
  const axentaToken = localStorage.getItem('axenta_token');
  const axentaUser = localStorage.getItem('axenta_user');
  const axentaCompany = localStorage.getItem('axenta_company');
  const localToken = localStorage.getItem('local_access_token');
  const localUser = localStorage.getItem('local_user');
  const oldToken = localStorage.getItem('token');
  const oldUser = localStorage.getItem('user');
  
  console.log('Axenta Cloud:');
  console.log('  axenta_token:', axentaToken ? `EXISTS (${axentaToken.length} chars)` : 'MISSING');
  console.log('  axenta_user:', axentaUser ? 'EXISTS' : 'MISSING');
  console.log('  axenta_company:', axentaCompany ? 'EXISTS' : 'MISSING');
  
  console.log('Local Auth:');
  console.log('  local_access_token:', localToken ? `EXISTS (${localToken.length} chars)` : 'MISSING');
  console.log('  local_user:', localUser ? 'EXISTS' : 'MISSING');
  
  console.log('Legacy:');
  console.log('  token:', oldToken ? `EXISTS (${oldToken.length} chars)` : 'MISSING');
  console.log('  user:', oldUser ? 'EXISTS' : 'MISSING');
  console.groupEnd();
  
  // Анализируем пользователей
  console.group('👤 User Analysis');
  if (axentaUser) {
    try {
      const user = JSON.parse(axentaUser);
      console.log('Axenta User:', {
        username: user.username,
        name: user.name,
        accountType: user.accountType,
        isDemo: user.username === 'demo' && user.accountType === 'demo'
      });
    } catch (e) {
      console.error('Failed to parse axenta_user:', e);
    }
  }
  
  if (localUser) {
    try {
      const user = JSON.parse(localUser);
      console.log('Local User:', {
        username: user.username,
        name: user.name,
        role: user.role
      });
    } catch (e) {
      console.error('Failed to parse local_user:', e);
    }
  }
  
  if (oldUser) {
    try {
      const user = JSON.parse(oldUser);
      console.log('Legacy User:', {
        username: user.username,
        name: user.name,
        type: user.accountType || user.role
      });
    } catch (e) {
      console.error('Failed to parse legacy user:', e);
    }
  }
  console.groupEnd();
  
  // Анализируем токены
  console.group('🔐 Token Analysis');
  [
    { name: 'axenta_token', token: axentaToken },
    { name: 'local_access_token', token: localToken },
    { name: 'legacy_token', token: oldToken }
  ].forEach(({ name, token }) => {
    if (token) {
      const parts = token.split('.');
      const isJWT = parts.length === 3;
      
      console.log(`${name}:`);
      console.log(`  Type: ${isJWT ? 'JWT' : 'Opaque'}`);
      console.log(`  Length: ${token.length} chars`);
      console.log(`  Starts: ${token.substring(0, 20)}...`);
      
      if (isJWT) {
        try {
          const payload = JSON.parse(atob(parts[1]));
          console.log(`  User ID: ${payload.user_id || payload.sub || 'N/A'}`);
          console.log(`  Username: ${payload.username || 'N/A'}`);
          console.log(`  Role: ${payload.role || payload.accountType || 'N/A'}`);
          if (payload.exp) {
            const expiry = new Date(payload.exp * 1000);
            const isExpired = Date.now() >= payload.exp * 1000;
            console.log(`  Expires: ${expiry.toLocaleString()} (${isExpired ? 'EXPIRED' : 'VALID'})`);
          }
        } catch (e) {
          console.log(`  JWT Parse Error: ${e.message}`);
        }
      }
    }
  });
  console.groupEnd();
  
  console.groupEnd();
}

/**
 * Очищает только демо данные, оставляя настоящие
 */
export function clearDemoData(): void {
  console.log('🧹 Clearing demo data only...');
  
  const demoKeys = ['demo_token', 'demo_user', 'demo_company'];
  let cleared = 0;
  
  demoKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      cleared++;
      console.log(`  ❌ Removed: ${key}`);
    }
  });
  
  // Проверяем, не является ли текущий пользователь демо
  const axentaUser = localStorage.getItem('axenta_user');
  if (axentaUser) {
    try {
      const user = JSON.parse(axentaUser);
      if (user.username === 'demo' && user.accountType === 'demo') {
        console.log('⚠️ Found demo user in axenta_user, removing...');
        localStorage.removeItem('axenta_user');
        localStorage.removeItem('axenta_token');
        localStorage.removeItem('axenta_company');
        cleared += 3;
      }
    } catch (e) {
      console.error('Error checking axenta_user:', e);
    }
  }
  
  console.log(`✅ Cleared ${cleared} demo-related items`);
}

/**
 * Восстанавливает настоящего пользователя из альтернативных ключей
 */
export function restoreRealUser(): boolean {
  console.log('🔄 Attempting to restore real user...');
  
  // Ищем настоящего пользователя в разных местах
  const possibleUserKeys = ['user', 'current_user', 'real_user'];
  const possibleTokenKeys = ['token', 'auth_token', 'bearer_token'];
  
  for (const userKey of possibleUserKeys) {
    const userData = localStorage.getItem(userKey);
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.username !== 'demo') {
          console.log(`✅ Found real user in ${userKey}:`, user.name);
          
          // Ищем соответствующий токен
          for (const tokenKey of possibleTokenKeys) {
            const tokenData = localStorage.getItem(tokenKey);
            if (tokenData) {
              console.log(`✅ Found token in ${tokenKey}`);
              
              // Перемещаем в правильные ключи
              localStorage.setItem('axenta_user', userData);
              localStorage.setItem('axenta_token', tokenData);
              
              return true;
            }
          }
        }
      } catch (e) {
        console.error(`Error parsing ${userKey}:`, e);
      }
    }
  }
  
  console.log('❌ No real user found in alternative storage');
  return false;
}

// Экспортируем функции для использования в консоли браузера
(window as any).debugAuth = debugAuthState;
(window as any).clearDemoData = clearDemoData;
(window as any).restoreRealUser = restoreRealUser;
