// Сервис для работы с API NovaConnect
import axios from 'axios';
import { config } from '@/config/env';

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
  private currentCompanyId: number | null = null;

  constructor() {
    // Загружаем настройки из БД при инициализации
    // НЕ используем localStorage для токена - он должен быть привязан к компании
    this.loadSettings().catch(err => {
      console.warn('Не удалось загрузить настройки NovaConnect из БД:', err);
    });
  }

  private getCurrentCompanyId(): number | null {
    try {
      const companyStr = localStorage.getItem('axenta_company');
      if (!companyStr) return null;
      const company = JSON.parse(companyStr);
      return company?.id || null;
    } catch {
      return null;
    }
  }

  private getTokenStorageKey(): string {
    const companyId = this.getCurrentCompanyId();
    return companyId ? `novaconnect_token_${companyId}` : 'novaconnect_token';
  }

  private async loadSettings() {
    const companyId = this.getCurrentCompanyId();
    
    // Если компания не определена, не загружаем настройки
    if (!companyId) {
      console.warn('Компания не определена, не загружаем настройки NovaConnect');
      this.token = null;
      return;
    }

    // Если компания изменилась, очищаем старый токен
    if (this.currentCompanyId !== null && this.currentCompanyId !== companyId) {
      console.log('Компания изменилась, очищаем старый токен NovaConnect');
      this.token = null;
    }
    this.currentCompanyId = companyId;

    // Всегда загружаем настройки из БД через API (который учитывает текущую компанию)
    try {
      // Используем единый конфиг бэкенда (в проде будет https)
      const apiBaseUrl = config.apiBaseUrl;
      const token = localStorage.getItem('axenta_token');
      
      if (!token) {
        console.warn('Токен авторизации не найден');
        this.token = null;
        return;
      }

      const response = await fetch(`${apiBaseUrl}/novaconnect/config`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const config = await response.json();
        // Принудительно используем https, если фронтенд открыт по https
        const resolveApiUrl = (url: string): string => {
          try {
            const u = new URL(url);
            if (typeof window !== 'undefined' && window.location.protocol === 'https:' && u.protocol === 'http:') {
              u.protocol = 'https:';
            }
            return u.toString().replace(/\/+$/, '');
          } catch {
            return url;
          }
        };

        this.apiUrl = resolveApiUrl(config.api_url || this.apiUrl);
        this.language = config.language || this.language;
        
        // Токен из БД (уже привязан к текущей компании через middleware)
        if (config.token) {
          this.token = config.token;
          // Сохраняем в localStorage с привязкой к company_id для кэширования
          const storageKey = this.getTokenStorageKey();
          localStorage.setItem(storageKey, config.token);
        } else {
          this.token = null;
          // Очищаем кэш, если токена нет
          const storageKey = this.getTokenStorageKey();
          localStorage.removeItem(storageKey);
        }
        return;
      } else if (response.status === 404) {
        // Интеграция не настроена для этой компании
        console.log('Интеграция NovaConnect не настроена для текущей компании');
        this.token = null;
        const storageKey = this.getTokenStorageKey();
        localStorage.removeItem(storageKey);
        return;
      } else {
        console.warn('Ошибка загрузки настроек NovaConnect:', response.status, response.statusText);
        this.token = null;
      }
    } catch (error) {
      console.warn('Не удалось загрузить настройки NovaConnect из БД:', error);
      this.token = null;
    }
  }

  // Метод для принудительной перезагрузки настроек (например, при смене компании)
  async reloadSettings() {
    await this.loadSettings();
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
    // Проверяем, что компания не изменилась, и перезагружаем настройки если нужно
    const currentCompanyId = this.getCurrentCompanyId();
    if (this.currentCompanyId !== currentCompanyId) {
      await this.loadSettings();
    }

    if (!this.token) {
      throw new Error('Токен NovaConnect не настроен. Настройте интеграцию в разделе "Настройки" → "Интеграции"');
    }

    try {
      // Для больших запросов (статистика) увеличиваем таймаут
      // Для size >= 1000 используем 60 секунд, для остальных - 30 секунд
      const requestTimeout = (params?.size && params.size >= 1000) ? 60000 : 30000;
      
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
          timeout: requestTimeout,
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
    // Проверяем, что компания не изменилась, и перезагружаем настройки если нужно
    const currentCompanyId = this.getCurrentCompanyId();
    if (this.currentCompanyId !== currentCompanyId) {
      await this.loadSettings();
    }

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
    // Проверяем, что компания не изменилась, и перезагружаем настройки если нужно
    const currentCompanyId = this.getCurrentCompanyId();
    if (this.currentCompanyId !== currentCompanyId) {
      await this.loadSettings();
    }

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
    // Проверяем, что компания не изменилась, и перезагружаем настройки если нужно
    const currentCompanyId = this.getCurrentCompanyId();
    if (this.currentCompanyId !== currentCompanyId) {
      await this.loadSettings();
    }

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
   * Отключение SIM-карты (disconnect)
   */
  async disconnectSimCard(items: number[]): Promise<any> {
    // Проверяем, что компания не изменилась, и перезагружаем настройки если нужно
    const currentCompanyId = this.getCurrentCompanyId();
    if (this.currentCompanyId !== currentCompanyId) {
      await this.loadSettings();
    }

    if (!this.token) {
      throw new Error('Токен NovaConnect не настроен');
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/sim/disconnect?lang=${this.language}`,
        { items },
        {
          headers: this.getHeaders(),
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Ошибка отключения SIM-карты:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Ошибка отключения SIM-карты'
      );
    }
  }

  /**
   * Получить список групп
   */
  async getGroups(): Promise<NovaConnectGroup[]> {
    // Проверяем, что компания не изменилась, и перезагружаем настройки если нужно
    const currentCompanyId = this.getCurrentCompanyId();
    if (this.currentCompanyId !== currentCompanyId) {
      await this.loadSettings();
    }

    if (!this.token) {
      throw new Error('Токен NovaConnect не настроен');
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/group/list?lang=${this.language}`,
        {},
        {
          headers: this.getHeaders(),
          timeout: 10000,
        }
      );

      if (response.data?.code === 200 && Array.isArray(response.data.items)) {
        return response.data.items;
      }
      return [];
    } catch (error: any) {
      console.error('Ошибка получения списка групп:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Ошибка получения списка групп'
      );
    }
  }

  /**
   * Изменение групп SIM-карт
   */
  async changeSimGroups(items: number[], groups: number[]): Promise<any> {
    // Проверяем, что компания не изменилась, и перезагружаем настройки если нужно
    const currentCompanyId = this.getCurrentCompanyId();
    if (this.currentCompanyId !== currentCompanyId) {
      await this.loadSettings();
    }

    if (!this.token) {
      throw new Error('Токен NovaConnect не настроен');
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/sim/group?lang=${this.language}`,
        { items, groups },
        {
          headers: this.getHeaders(),
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Ошибка изменения групп SIM-карт:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Ошибка изменения групп SIM-карт'
      );
    }
  }

  /**
   * Пинг SIM-карт (только для профиля TD)
   */
  async pingSimCard(items: number[]): Promise<any> {
    const currentCompanyId = this.getCurrentCompanyId();
    if (this.currentCompanyId !== currentCompanyId) {
      await this.loadSettings();
    }

    if (!this.token) {
      throw new Error('Токен NovaConnect не настроен');
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/sim/ping?lang=${this.language}`,
        { items },
        {
          headers: this.getHeaders(),
          timeout: 15000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Ошибка пинга SIM-карт:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Ошибка пинга SIM-карт'
      );
    }
  }

  /**
   * Отправка SMS на SIM-карты (только для профиля TD)
   */
  async sendSmsToSimCards(items: number[], text: string): Promise<any> {
    const currentCompanyId = this.getCurrentCompanyId();
    if (this.currentCompanyId !== currentCompanyId) {
      await this.loadSettings();
    }

    if (!this.token) {
      throw new Error('Токен NovaConnect не настроен');
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/sim/sms?lang=${this.language}`,
        { items, text },
        {
          headers: this.getHeaders(),
          timeout: 15000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Ошибка отправки SMS:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Ошибка отправки SMS'
      );
    }
  }

  /**
   * Изменение тарификации SIM-карт (только для профиля TD)
   */
  async changeSimTariff(items: number[], tariffId: number): Promise<any> {
    const currentCompanyId = this.getCurrentCompanyId();
    if (this.currentCompanyId !== currentCompanyId) {
      await this.loadSettings();
    }

    if (!this.token) {
      throw new Error('Токен NovaConnect не настроен');
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/sim/tariff?lang=${this.language}`,
        { items, tariff: tariffId },
        {
          headers: this.getHeaders(),
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Ошибка изменения тарификации:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Ошибка изменения тарификации'
      );
    }
  }

  /**
   * Переподключение пакета (только для профиля TD)
   */
  async reconnectSimPackage(items: number[]): Promise<any> {
    const currentCompanyId = this.getCurrentCompanyId();
    if (this.currentCompanyId !== currentCompanyId) {
      await this.loadSettings();
    }

    if (!this.token) {
      throw new Error('Токен NovaConnect не настроен');
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/sim/reconnect?lang=${this.language}`,
        { items },
        {
          headers: this.getHeaders(),
          timeout: 15000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Ошибка переподключения пакета:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Ошибка переподключения пакета'
      );
    }
  }

  /**
   * Переименование SIM-карт
   */
  async renameSimCards(items: number[], name: string): Promise<any> {
    const currentCompanyId = this.getCurrentCompanyId();
    if (this.currentCompanyId !== currentCompanyId) {
      await this.loadSettings();
    }

    if (!this.token) {
      throw new Error('Токен NovaConnect не настроен');
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/sim/edit?lang=${this.language}`,
        { items, name },
        {
          headers: this.getHeaders(),
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Ошибка переименования SIM-карт:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Ошибка переименования SIM-карт'
      );
    }
  }

  /**
   * Проверка подключения к API
   */
  async testConnection(): Promise<boolean> {
    // Проверяем, что компания не изменилась, и перезагружаем настройки если нужно
    const currentCompanyId = this.getCurrentCompanyId();
    if (this.currentCompanyId !== currentCompanyId) {
      await this.loadSettings();
    }

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

