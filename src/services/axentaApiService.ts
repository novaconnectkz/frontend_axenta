/**
 * Сервис для работы с внешним API Axenta Cloud
 * Адаптирует ответы внешнего API к внутреннему формату
 */

import axios, { type AxiosInstance } from 'axios';
import { config } from '@/config/env';

export interface AxentaAuthResponse {
  access: string;
  refresh: string;
}

export interface AxentaAccount {
  id: number;
  name: string;
  manager?: string;
  service_company?: string;
  objects_count: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface AxentaAccountsResponse {
  results: AxentaAccount[];
  count: number;
  next?: string;
  previous?: string;
}

export class AxentaApiService {
  private apiClient: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.apiClient = axios.create({
      baseURL: config.backendUrl,
      timeout: config.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
        // 'User-Agent': 'Axenta-CRM-Frontend/1.0' // Убрано - браузер блокирует
      }
    });

    // Добавляем interceptor для автоматического добавления токена
    this.apiClient.interceptors.request.use((config) => {
      if (this.token) {
        config.headers['Authorization'] = `Bearer ${this.token}`;
      }
      return config;
    });

    // Добавляем interceptor для обработки ошибок
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Axenta API Error:', {
          status: error.response?.status,
          url: error.config?.url,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Авторизация в API Axenta
   */
  async login(username: string, password: string): Promise<AxentaAuthResponse> {
    try {
      console.log('🔐 Авторизация в Axenta API...');
      
      const response = await this.apiClient.post<AxentaAuthResponse>(
        '/api/auth/login/',
        { username, password }
      );

      if (response.data.access) {
        this.token = response.data.access;
        console.log('✅ Успешная авторизация в Axenta API');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка авторизации в Axenta API:', error);
      
      let errorMessage = 'Ошибка авторизации';
      
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.join(', ');
        } else {
          errorMessage = error.response.data.detail;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Получение списка аккаунтов
   */
  async getAccounts(page = 1, perPage = 50): Promise<AxentaAccountsResponse> {
    if (!this.token) {
      throw new Error('Необходима авторизация');
    }

    try {
      console.log('📋 Получение аккаунтов из Axenta API...');
      
      const response = await this.apiClient.get<AxentaAccountsResponse>(
        '/api/cms/accounts/',
        {
          params: {
            page,
            per_page: perPage,
            ordering: 'name'
          }
        }
      );

      console.log(`✅ Получено ${response.data.results?.length || 0} аккаунтов`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка получения аккаунтов:', error);
      throw error;
    }
  }

  /**
   * Проверка подключения к API
   */
  async testConnection(): Promise<{ status: number; message: string }> {
    try {
      const response = await this.apiClient.get('/', {
        validateStatus: () => true // Принимаем любой статус
      });

      return {
        status: response.status,
        message: `Сервер доступен (${response.status})`
      };
    } catch (error: any) {
      return {
        status: 0,
        message: `Ошибка подключения: ${error.message}`
      };
    }
  }

  /**
   * Установка токена извне
   */
  setToken(token: string) {
    this.token = token;
  }

  /**
   * Получение текущего токена
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Очистка токена
   */
  clearToken() {
    this.token = null;
  }
}

// Экспортируем singleton instance
export const axentaApiService = new AxentaApiService();
