// Сервис для работы с API NovaConnect
import axios from 'axios';

// Типы данных NovaConnect API
export interface NovaConnectSimCard {
  id: number;
  iccid: string;
  number: string;
  external_number: string;
  name: string | null;
  balance: number;
  currency: string;
  msu_value: number | null;
  profile: string; // TD или TC
  block: string; // n, u, m, p, f, g
  comment: string | null;
  groups: NovaConnectGroup[];
  limit: {
    type: string; // off, month1, p_lim, p_unlim
    value: number | null;
    used: number | null;
    updated: number | null;
    created: number | null;
  };
  tariff: {
    id: number;
    name: string;
    change_lock: number | null;
    package_auto: boolean;
  };
  queue_status?: string;
}

export interface NovaConnectGroup {
  id: number;
  name: string;
  added: number;
}

export interface NovaConnectSimListResponse {
  code: number;
  message: string;
  count: number;
  all_count: number;
  items: NovaConnectSimCard[];
}

export interface NovaConnectSimListParams {
  page?: number;
  size?: number;
  filter?: {
    profile?: string;
    msu_block?: boolean;
    blocked?: boolean;
    query?: string;
  };
  sort?: Record<string, 'ASC' | 'DESC'>;
}

class NovaConnectService {
  private apiUrl: string = 'https://api.novaconnect.kz/api';
  private token: string | null = null;
  private language: string = 'ru';

  constructor() {
    // Загружаем настройки синхронно из localStorage при инициализации
    // Асинхронная загрузка из БД будет выполнена при первом использовании
    const settings = localStorage.getItem('novaconnect_settings');
    const token = localStorage.getItem('novaconnect_token');
    
    if (settings) {
      const parsed = JSON.parse(settings);
      this.apiUrl = parsed.api_url || this.apiUrl;
      this.language = parsed.language || this.language;
    }
    
    if (token) {
      this.token = token;
    }
    
    // Загружаем актуальные настройки из БД в фоне
    this.loadSettings().catch(err => {
      console.warn('Не удалось загрузить настройки NovaConnect из БД:', err);
    });
  }

  private async loadSettings() {
    // Сначала пытаемся загрузить из БД через API
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/novaconnect/config`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('axenta_token') || ''}`,
        },
      });

      if (response.ok) {
        const config = await response.json();
        this.apiUrl = config.api_url || this.apiUrl;
        this.language = config.language || this.language;
        
        // Токен из БД
        if (config.token) {
          this.token = config.token;
          // Сохраняем в localStorage для кэширования
          localStorage.setItem('novaconnect_token', config.token);
        }
        return;
      }
    } catch (error) {
      console.warn('Не удалось загрузить настройки NovaConnect из БД, используем localStorage:', error);
    }

    // Fallback на localStorage для обратной совместимости
    const settings = localStorage.getItem('novaconnect_settings');
    const token = localStorage.getItem('novaconnect_token');
    
    if (settings) {
      const parsed = JSON.parse(settings);
      this.apiUrl = parsed.api_url || this.apiUrl;
      this.language = parsed.language || this.language;
    }
    
    if (token) {
      this.token = token;
    }
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
    };
  }

  /**
   * Получить список SIM-карт
   */
  async getSimCards(params?: NovaConnectSimListParams): Promise<NovaConnectSimListResponse> {
    if (!this.token) {
      throw new Error('Токен NovaConnect не настроен. Настройте интеграцию в разделе "Настройки" → "Интеграции"');
    }

    try {
      const response = await axios.post<NovaConnectSimListResponse>(
        `${this.apiUrl}/sim/list?lang=${this.language}`,
        {
          page: params?.page || 0,
          size: params?.size || 50,
          filter: params?.filter || {},
          sort: params?.sort || {},
        },
        {
          headers: this.getHeaders(),
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Ошибка получения списка SIM-карт:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Ошибка подключения к API NovaConnect'
      );
    }
  }

  /**
   * Получить информацию о SIM-карте по ID
   */
  async getSimCard(id: number): Promise<NovaConnectSimCard> {
    if (!this.token) {
      throw new Error('Токен NovaConnect не настроен');
    }

    try {
      // Используем список с фильтром по ID
      const response = await this.getSimCards({
        filter: { query: id.toString() },
        size: 1,
      });

      const simCard = response.items.find(item => item.id === id);
      if (!simCard) {
        throw new Error('SIM-карта не найдена');
      }

      return simCard;
    } catch (error: any) {
      console.error('Ошибка получения SIM-карты:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Ошибка получения информации о SIM-карте'
      );
    }
  }

  /**
   * Блокировка SIM-карты
   */
  async blockSimCard(items: number[]): Promise<any> {
    if (!this.token) {
      throw new Error('Токен NovaConnect не настроен');
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/sim/block?lang=${this.language}`,
        { items },
        {
          headers: this.getHeaders(),
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Ошибка блокировки SIM-карты:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Ошибка блокировки SIM-карты'
      );
    }
  }

  /**
   * Разблокировка SIM-карты
   */
  async unblockSimCard(items: number[]): Promise<any> {
    if (!this.token) {
      throw new Error('Токен NovaConnect не настроен');
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/sim/unblock?lang=${this.language}`,
        { items },
        {
          headers: this.getHeaders(),
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Ошибка разблокировки SIM-карты:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Ошибка разблокировки SIM-карты'
      );
    }
  }

  /**
   * Проверка подключения к API
   */
  async testConnection(): Promise<boolean> {
    if (!this.token) {
      throw new Error('Токен NovaConnect не настроен');
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/user/get?lang=${this.language}`,
        {},
        {
          headers: this.getHeaders(),
          timeout: 10000,
        }
      );

      return response.data?.code === 200;
    } catch (error: any) {
      console.error('Ошибка проверки подключения:', error);
      return false;
    }
  }
}

// Экспортируем singleton instance
export const novaconnectService = new NovaConnectService();

