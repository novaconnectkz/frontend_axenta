/**
 * Утилита для повторных попыток API запросов с exponential backoff
 */

export interface RetryOptions {
  /**
   * Максимальное количество попыток
   * @default 3
   */
  maxRetries?: number;
  
  /**
   * Базовая задержка между попытками в мс
   * @default 1000
   */
  baseDelay?: number;
  
  /**
   * Максимальная задержка между попытками в мс
   * @default 10000
   */
  maxDelay?: number;
  
  /**
   * Callback при каждой повторной попытке
   */
  onRetry?: (attempt: number, error: Error) => void;
  
  /**
   * Должны ли мы повторять запрос при данной ошибке
   */
  shouldRetry?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  shouldRetry: (error: any) => {
    // Не retry если это ошибка клиента (4xx)
    if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
      return false;
    }
    
    // Retry только network errors и 5xx ошибки
    return !error.response || error.response.status >= 500;
  },
};

/**
 * Выполняет функцию с повторными попытками при ошибке
 * Использует exponential backoff для задержек между попытками
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;
  
  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Проверяем, нужно ли повторять
      if (!opts.shouldRetry(error)) {
        console.log(`❌ Retry skipped for error: ${error.message}`);
        throw error;
      }
      
      // Если это последняя попытка, выбрасываем ошибку
      if (attempt >= opts.maxRetries - 1) {
        console.log(`❌ Max retries (${opts.maxRetries}) reached`);
        throw error;
      }
      
      // Вычисляем задержку с exponential backoff
      const delay = Math.min(
        opts.baseDelay * Math.pow(2, attempt),
        opts.maxDelay
      );
      
      console.log(`⚠️ Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms`);
      
      // Вызываем callback если есть
      options.onRetry?.(attempt + 1, error);
      
      // Ждем перед следующей попыткой
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Обертка для axios запросов с retry
 */
export function createRetryableRequest<T = any>(
  requestFn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  return retryWithBackoff(requestFn, options);
}
