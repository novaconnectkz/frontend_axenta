/**
 * Сервис кэширования данных в localStorage для оптимизации при плохом интернете
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // время жизни в миллисекундах
}

class CacheService {
  private prefix = 'axenta_cache_';
  private defaultTTL = 5 * 60 * 1000; // 5 минут по умолчанию

  /**
   * Сохраняет данные в кэш
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresIn: ttl,
      };
      localStorage.setItem(
        this.prefix + key,
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.warn('Failed to save to cache:', error);
      // Если localStorage переполнен, очищаем старые данные
      this.cleanup();
    }
  }

  /**
   * Получает данные из кэша
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const cacheItem: CacheItem<T> = JSON.parse(item);
      const now = Date.now();

      // Проверяем не истекло ли время жизни
      if (now - cacheItem.timestamp > cacheItem.expiresIn) {
        this.remove(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to read from cache:', error);
      return null;
    }
  }

  /**
   * Удаляет данные из кэша
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.warn('Failed to remove from cache:', error);
    }
  }

  /**
   * Проверяет есть ли валидные данные в кэше
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Очищает весь кэш
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Очищает устаревшие данные
   */
  cleanup(): void {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const cacheItem: CacheItem<any> = JSON.parse(item);
              if (now - cacheItem.timestamp > cacheItem.expiresIn) {
                localStorage.removeItem(key);
              }
            }
          } catch (e) {
            // Если не удалось распарсить, удаляем
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to cleanup cache:', error);
    }
  }

  /**
   * Получает размер кэша в байтах
   */
  getSize(): number {
    let size = 0;
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        const item = localStorage.getItem(key);
        if (item) {
          size += item.length * 2; // UTF-16
        }
      }
    });
    return size;
  }

  /**
   * Получает размер кэша в мегабайтах
   */
  getSizeMB(): number {
    return this.getSize() / (1024 * 1024);
  }
}

export const cacheService = new CacheService();

