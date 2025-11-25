// Утилита для отладки проблем с токеном

export function checkToken(): {
  exists: boolean;
  value: string | null;
  length: number;
  isValid: boolean;
  message: string;
} {
  const token = localStorage.getItem('axenta_token');
  
  if (!token) {
    return {
      exists: false,
      value: null,
      length: 0,
      isValid: false,
      message: '❌ Токен отсутствует в localStorage'
    };
  }

  // Проверяем, не пустой ли токен
  if (token.trim() === '') {
    return {
      exists: true,
      value: token,
      length: 0,
      isValid: false,
      message: '❌ Токен пустой'
    };
  }

  return {
    exists: true,
    value: token,
    length: token.length,
    isValid: true,
    message: `✅ Токен найден (длина: ${token.length} символов)`
  };
}

export function logTokenInfo() {
  const info = checkToken();
  console.group('🔐 Информация о токене');
  console.log('Существует:', info.exists);
  console.log('Длина:', info.length);
  console.log('Валидный:', info.isValid);
  console.log('Сообщение:', info.message);
  if (info.value) {
    console.log('Первые 20 символов:', info.value.substring(0, 20) + '...');
  }
  console.groupEnd();
  return info;
}

export function ensureToken(): boolean {
  const info = checkToken();
  
  if (!info.isValid) {
    console.error(info.message);
    console.warn('🔄 Необходима повторная авторизация');
    
    // Очищаем localStorage от невалидных данных
    localStorage.removeItem('axenta_token');
    localStorage.removeItem('axenta_user');
    localStorage.removeItem('axenta_company');
    localStorage.removeItem('axenta_token_expiry');
    
    // Перенаправляем на страницу входа если мы не на ней
    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
      console.log('🔄 Перенаправление на страницу входа...');
      window.location.href = '/login';
    }
    
    return false;
  }
  
  return true;
}

