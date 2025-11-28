import api from './api';
import type {
  DeletedItem,
  TrashFilter,
  TrashListResponse,
  TrashStats,
  TrashStatsResponse,
  RestoreItemRequest,
  RestoreItemResponse,
  PermanentlyDeleteResponse,
} from '@/types/trash';

/**
 * Сервис для работы с корзиной удаленных элементов
 */
class TrashService {
  private baseUrl = '/auth/trash';

  /**
   * Получить список удаленных элементов
   */
  async getTrashItems(filter?: TrashFilter): Promise<TrashListResponse> {
    const params: Record<string, string | number> = {};
    
    if (filter?.entity_type) {
      params.entity_type = filter.entity_type;
    }
    if (filter?.search) {
      params.search = filter.search;
    }
    if (filter?.show_restored !== undefined) {
      params.show_restored = filter.show_restored ? 'true' : 'false';
    }
    if (filter?.show_permanently_deleted !== undefined) {
      params.show_permanently_deleted = filter.show_permanently_deleted ? 'true' : 'false';
    }
    if (filter?.page) {
      params.page = filter.page;
    }
    if (filter?.limit) {
      params.limit = filter.limit;
    }

    const response = await api.get<TrashListResponse>(`${this.baseUrl}/items`, {
      params,
    });
    
    return response.data;
  }

  /**
   * Получить статистику корзины
   */
  async getTrashStats(): Promise<TrashStats> {
    const response = await api.get<TrashStatsResponse>(`${this.baseUrl}/stats`);
    return response.data.data;
  }

  /**
   * Восстановить удаленный элемент
   */
  async restoreItem(itemId: number, request?: RestoreItemRequest): Promise<DeletedItem> {
    const response = await api.post<RestoreItemResponse>(
      `${this.baseUrl}/items/${itemId}/restore`,
      request || {}
    );
    return response.data.data;
  }

  /**
   * Окончательно удалить элемент из корзины
   */
  async permanentlyDeleteItem(itemId: number): Promise<void> {
    await api.delete<PermanentlyDeleteResponse>(
      `${this.baseUrl}/items/${itemId}/permanent`
    );
  }

  /**
   * Массовое восстановление элементов
   */
  async restoreMultipleItems(itemIds: number[]): Promise<DeletedItem[]> {
    const results: DeletedItem[] = [];
    
    for (const itemId of itemIds) {
      try {
        const restoredItem = await this.restoreItem(itemId);
        results.push(restoredItem);
      } catch (error) {
        console.error(`Ошибка восстановления элемента ${itemId}:`, error);
        // Продолжаем с остальными элементами
      }
    }
    
    return results;
  }

  /**
   * Массовое окончательное удаление элементов
   */
  async permanentlyDeleteMultipleItems(itemIds: number[]): Promise<void> {
    for (const itemId of itemIds) {
      try {
        await this.permanentlyDeleteItem(itemId);
      } catch (error) {
        console.error(`Ошибка окончательного удаления элемента ${itemId}:`, error);
        // Продолжаем с остальными элементами
      }
    }
  }

  /**
   * Получить детали удаленного элемента
   */
  async getDeletedItemDetails(itemId: number): Promise<DeletedItem | null> {
    try {
      // Используем фильтр для получения конкретного элемента
      const response = await this.getTrashItems({ page: 1, limit: 1 });
      const item = response.data.items.find(item => item.id === itemId);
      return item || null;
    } catch (error) {
      console.error(`Ошибка получения деталей элемента ${itemId}:`, error);
      return null;
    }
  }

  /**
   * Парсинг JSON данных удаленного элемента
   */
  parseEntityData<T = any>(entityData: string): T | null {
    try {
      return JSON.parse(entityData) as T;
    } catch (error) {
      console.error('Ошибка парсинга данных элемента:', error);
      return null;
    }
  }

  /**
   * Форматирование даты для отображения
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  /**
   * Получить относительное время (например, "2 часа назад")
   */
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'только что';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${this.pluralize(diffInMinutes, 'минуту', 'минуты', 'минут')} назад`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${this.pluralize(diffInHours, 'час', 'часа', 'часов')} назад`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ${this.pluralize(diffInDays, 'день', 'дня', 'дней')} назад`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} ${this.pluralize(diffInMonths, 'месяц', 'месяца', 'месяцев')} назад`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} ${this.pluralize(diffInYears, 'год', 'года', 'лет')} назад`;
  }

  /**
   * Плюрализация русских слов
   */
  private pluralize(count: number, one: string, few: string, many: string): string {
    const mod10 = count % 10;
    const mod100 = count % 100;

    if (mod10 === 1 && mod100 !== 11) {
      return one;
    }
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      return few;
    }
    return many;
  }

  /**
   * Проверка, можно ли восстановить элемент
   */
  canRestore(item: DeletedItem): boolean {
    return !item.is_restored && !item.is_permanently_deleted;
  }

  /**
   * Проверка, можно ли окончательно удалить элемент
   */
  canPermanentlyDelete(item: DeletedItem): boolean {
    return !item.is_permanently_deleted;
  }
}

export const trashService = new TrashService();

