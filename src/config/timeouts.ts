// Конфигурация таймаутов для API запросов
export const API_TIMEOUTS = {
  /**
   * Быстрые операции: статистика, проверки
   * 10 секунд
   */
  QUICK: 10000,
  
  /**
   * Обычные операции: CRUD, списки
   * 30 секунд
   */
  NORMAL: 30000,
  
  /**
   * Длительные операции: экспорт, генерация отчетов
   * 60 секунд
   */
  LONG: 60000,
  
  /**
   * Загрузка файлов
   * 2 минуты
   */
  UPLOAD: 120000,
} as const;

export type ApiTimeout = typeof API_TIMEOUTS[keyof typeof API_TIMEOUTS];

/**
 * Получить таймаут по типу операции
 */
export function getTimeoutForOperation(operation: 'quick' | 'normal' | 'long' | 'upload'): number {
  const map = {
    quick: API_TIMEOUTS.QUICK,
    normal: API_TIMEOUTS.NORMAL,
    long: API_TIMEOUTS.LONG,
    upload: API_TIMEOUTS.UPLOAD,
  };
  
  return map[operation];
}

export default API_TIMEOUTS;
