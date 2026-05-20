/**
 * Сервис для работы с DaData API через бэкенд
 * Используется для автозаполнения реквизитов организаций по ИНН/ОГРН
 */

import axios from 'axios';

// Используем бэкенд API вместо прямого обращения к DaData
// Используем тот же baseURL, что и другие сервисы
import { config } from '@/config/env';

/**
 * Интерфейс данных организации из DaData
 */
export interface DaDataOrganization {
  value?: string; // Полное наименование
  unrestricted_value?: string;
  data: {
    kpp?: string; // КПП
    management?: {
      name?: string;
      post?: string;
    };
    name?: {
      full_with_opf?: string; // Полное наименование с ОПФ
      short_with_opf?: string; // Краткое наименование с ОПФ
      latin?: string;
      full?: string; // Полное наименование без ОПФ
      short?: string; // Краткое наименование без ОПФ
    };
    inn?: string; // ИНН
    ogrn?: string; // ОГРН
    ogrn_date?: number; // Дата выдачи ОГРН
    okpo?: string; // ОКПО
    type?: string; // Тип организации (LEGAL, INDIVIDUAL)
    website?: string; // Сайт организации
    address?: {
      value?: string; // Полный адрес
      unrestricted_value?: string;
      data?: {
        postal_code?: string;
        country?: string;
        region?: string;
        area?: string;
        city?: string;
        settlement?: string;
        street?: string;
        house?: string;
        block?: string;
        flat?: string;
      };
    };
    state?: {
      status?: string; // Статус организации
      actuality_date?: number;
      registration_date?: number;
      liquidation_date?: number;
    };
    opf?: {
      full?: string;
      short?: string;
      code?: string;
    };
    okved?: string; // Основной вид деятельности
    okveds?: Array<{
      main?: boolean;
      type?: string;
      code?: string;
      name?: string;
    }>;
    authorities?: {
      fts_registration?: {
        type?: string;
        name?: string;
        date?: number;
      };
    };
    phones?: Array<{
      value?: string;
      unrestricted_value?: string;
      data?: {
        contact?: string;
        source?: string;
      };
    }>;
    emails?: Array<{
      value?: string;
      source?: string;
    }>;
  };
}

/**
 * Ответ от DaData API
 */
export interface DaDataResponse {
  suggestions: DaDataOrganization[];
}

/**
 * Интерфейс ответа от бэкенд API
 */
interface BackendDaDataResponse {
  status: string;
  data: DaDataOrganization | null;
  message?: string;
}

/**
 * Класс сервиса для работы с DaData API через бэкенд
 */
class DaDataService {
  private apiClient = axios.create({
    baseURL: config.apiBaseUrl, // Используем apiBaseUrl который уже содержит /api
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  constructor() {
    // Добавляем токен авторизации из localStorage (используем тот же формат что и другие сервисы)
    this.apiClient.interceptors.request.use((requestConfig) => {
      const token = localStorage.getItem('axenta_token') || 
                   localStorage.getItem('token') ||
                   localStorage.getItem('authToken');
      
      console.log('🌐🌐🌐 Axios Request Interceptor:');
      console.log('🌐 Full URL:', `${requestConfig.baseURL}${requestConfig.url}`);
      console.log('🌐 Method:', requestConfig.method);
      console.log('🌐 Has token:', !!token);
      
      if (token) {
        // Используем формат "Token" как в других сервисах, а не "Bearer"
        if (token.startsWith('Token ') || token.startsWith('Bearer ')) {
          requestConfig.headers['authorization'] = token;
          requestConfig.headers['Authorization'] = token;
        } else {
          requestConfig.headers['authorization'] = `Bearer ${token}`;
          requestConfig.headers['Authorization'] = `Bearer ${token}`;
        }
        console.log('🌐 Token added to headers');
      } else {
        console.log('🌐⚠️ No token found!');
      }
      
      console.log('🌐 Final headers:', requestConfig.headers);
      return requestConfig;
    });

    // Обработка ошибок
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('DaData Backend API error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Поиск организации по ИНН или ОГРН через бэкенд API
   * @param query ИНН (10 или 12 цифр) или ОГРН (13 цифр)
   * @returns Данные организации
   */
  async findOrganizationById(query: string): Promise<DaDataOrganization | null> {
    try {
      console.log('🌐🌐🌐 DaDataService.findOrganizationById called with query:', query);
      console.log('🌐 BaseURL (apiBaseUrl):', config.apiBaseUrl);
      console.log('🌐 Full URL will be:', `${config.apiBaseUrl}/auth/dadata/organization`);
      
      // Очищаем запрос от пробелов и других символов
      const cleanQuery = query.trim().replace(/\s+/g, '');
      console.log('🌐 Cleaned query:', cleanQuery);
      
      // Валидация: ИНН должен быть 10 или 12 цифр, ОГРН - 13 цифр
      if (!/^\d{10}$|^\d{12}$|^\d{13}$/.test(cleanQuery)) {
        throw new Error('ИНН должен содержать 10 или 12 цифр, ОГРН - 13 цифр');
      }

      const requestBody = { 
        query: cleanQuery,
        branch_type: "MAIN" // Получаем головную организацию, а не филиалы
      };
      console.log('🌐 Request body:', requestBody);
      console.log('🌐 Making POST request to /api/auth/dadata/organization...');

      // Отправляем запрос на бэкенд API
      // Используем путь /auth/dadata/organization, т.к. baseURL уже содержит /api
      const apiPath = '/auth/dadata/organization';
      console.log('🌐 Making POST request to:', apiPath);
      console.log('🌐 Complete URL:', `${config.apiBaseUrl}${apiPath}`);
      
      const response = await this.apiClient.post<BackendDaDataResponse>(
        apiPath,
        requestBody
      );
      
      console.log('🌐✅ Response received:', response.status, response.data);

      // Проверяем статус ответа
      if (response.data.status === 'success' && response.data.data) {
        // Бэкенд возвращает DaDataSuggestion (с полями value и data)
        // Нужно вернуть в формате, который ожидает extractOrganizationData
        return response.data.data;
      }

      // Если организации не найдено
      if (response.data.message) {
        console.log('DaData search result:', response.data.message);
      }

      return null;
    } catch (error: any) {
      console.error('Error finding organization by ID:', error);
      
      // Обрабатываем специфичные ошибки
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Ошибка авторизации. Пожалуйста, войдите в систему заново');
      }
      
      if (error.response?.status === 429) {
        throw new Error('Превышен лимит запросов к DaData API. Попробуйте позже');
      }
      
      // Если сервер вернул сообщение об ошибке
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(
        error.message || 
        'Ошибка при поиске организации'
      );
    }
  }

  /**
   * Поиск банка по БИК через бэкенд API
   * @param bik БИК банка (9 цифр)
   * @returns Данные банка
   */
  async findBankByBik(bik: string): Promise<any | null> {
    try {
      console.log('🏦 DaDataService.findBankByBik called with BIK:', bik);
      
      // Очищаем БИК от пробелов и других символов
      const cleanBik = bik.trim().replace(/\s+/g, '');
      console.log('🏦 Cleaned BIK:', cleanBik);
      
      // Валидация: БИК должен быть 9 цифр
      if (!/^\d{9}$/.test(cleanBik)) {
        throw new Error('БИК должен содержать 9 цифр');
      }

      const requestBody = { 
        query: cleanBik
      };
      console.log('🏦 Request body:', requestBody);
      
      // Отправляем запрос на бэкенд API
      const apiPath = '/auth/dadata/bank';
      console.log('🏦 Making POST request to:', apiPath);
      
      const response = await this.apiClient.post<any>(
        apiPath,
        requestBody
      );
      
      console.log('🏦✅ Bank response received:', response.status, response.data);

      // Проверяем статус ответа
      if (response.data.status === 'success' && response.data.data) {
        return response.data.data;
      }

      // Если банк не найден
      if (response.data.message) {
        console.log('DaData bank search result:', response.data.message);
      }

      return null;
    } catch (error: any) {
      console.error('Error finding bank by BIK:', error);
      
      // Обрабатываем специфичные ошибки
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Ошибка авторизации. Пожалуйста, войдите в систему заново');
      }
      
      if (error.response?.status === 429) {
        throw new Error('Превышен лимит запросов к DaData API. Попробуйте позже');
      }
      
      // Если сервер вернул сообщение об ошибке
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(
        error.message || 
        'Ошибка при поиске банка'
      );
    }
  }

  /**
   * Преобразование данных DaData в данные для формы договора
   * @param orgData Данные организации из DaData (может быть как DaDataOrganization, так и DaDataSuggestion)
   * @returns Данные для заполнения формы
   */
  extractOrganizationData(orgData: any): {
    client_name?: string;
    client_short_name?: string;
    client_inn?: string;
    client_kpp?: string;
    client_address?: string;
    client_legal_address?: string;
    client_postal_address?: string;
    client_registration_address?: string; // Адрес регистрации (для ИП)
    client_phone?: string;
    client_email?: string;
    client_ogrn?: string;
    client_okpo?: string;
    client_director?: string;
    client_based_on?: string;
    client_website?: string;
  } {
    console.log('🔍 extractOrganizationData received:', orgData);
    
    // Бэкенд возвращает DaDataSuggestion с полями {value, data}
    // data содержит DaDataOrganization где поля на верхнем уровне
    let org = orgData;
    
    // Если это suggestion с полями value и data
    if (orgData.value && orgData.data) {
      console.log('🔍 Format: DaDataSuggestion (has value and data)');
      // Берем data, где находятся данные организации
      org = orgData.data;
    } else if (orgData.data && typeof orgData.data === 'object') {
      console.log('🔍 Format: nested data');
      org = orgData.data;
    } else {
      console.log('🔍 Format: direct organization data');
      org = orgData;
    }
    
    console.log('🔍 Processing org:', org);
    
    // В Go структуре данные на верхнем уровне: inn, kpp, address, phone, email
    // Но name может быть объектом или строкой
    const name = org.name || (typeof org.name === 'object' ? org.name : {});
    const address = org.address || {};
    
    // Извлекаем название
    let clientName = '';
    let clientShortName = '';
    if (typeof name === 'object' && name !== null) {
      clientName = name.full_with_opf || name.full || name.short_with_opf || name.short || '';
      clientShortName = name.short_with_opf || ''; // Сокращенное название с ОПФ
    } else if (typeof name === 'string') {
      clientName = name;
    }
    if (!clientName) {
      clientName = org.value || org.full_name || org.name || '';
    }

    // Извлекаем телефон из массива phones
    let clientPhone = '';
    if (org.phones && Array.isArray(org.phones) && org.phones.length > 0) {
      const firstPhone = org.phones[0];
      if (typeof firstPhone === 'string') {
        clientPhone = firstPhone;
      } else if (typeof firstPhone === 'object' && firstPhone !== null && 'value' in firstPhone) {
        clientPhone = (firstPhone as any).value || '';
      }
    } else if (org.phone) {
      // Fallback для старого формата
      clientPhone = org.phone;
    }

    // Извлекаем email из массива emails
    let clientEmail = '';
    if (org.emails && Array.isArray(org.emails) && org.emails.length > 0) {
      const firstEmail = org.emails[0];
      if (typeof firstEmail === 'string') {
        clientEmail = firstEmail;
      } else if (typeof firstEmail === 'object' && firstEmail !== null && 'value' in firstEmail) {
        clientEmail = (firstEmail as any).value || '';
      }
    } else if (org.email) {
      // Fallback для старого формата
      clientEmail = org.email;
    }

    // Извлекаем адреса
    let legalAddress = '';
    let postalAddress = '';
    let registrationAddress = ''; // Адрес регистрации (для ИП) - используем unrestricted_value
    if (typeof address === 'object' && address !== null) {
      const addressValue = address.value || '';
      const unrestrictedValue = address.unrestricted_value || '';
      
      // Для адреса регистрации используем unrestricted_value (полный адрес)
      registrationAddress = unrestrictedValue || addressValue;
      
      legalAddress = addressValue || unrestrictedValue;
      postalAddress = addressValue || unrestrictedValue; // По умолчанию почтовый адрес = юридический, если не указан отдельно
      
      // Если есть data с подробной информацией об адресе
      if (address.data) {
        const addrData = address.data;
        // Формируем полный адрес из компонентов
        const addressParts = [
          addrData.postal_code,
          addrData.country,
          addrData.region,
          addrData.area,
          addrData.city,
          addrData.settlement,
          addrData.street,
          addrData.house,
          addrData.block,
          addrData.flat,
        ].filter(Boolean);
        
        if (addressParts.length > 0) {
          const fullAddress = addressParts.join(', ');
          legalAddress = fullAddress;
          postalAddress = fullAddress;
          // Для адреса регистрации также используем полный адрес, если unrestricted_value не указан
          if (!registrationAddress) {
            registrationAddress = fullAddress;
          }
        }
      }
    } else if (typeof address === 'string') {
      legalAddress = address;
      postalAddress = address;
      registrationAddress = address;
    }

    // Извлекаем ОГРН
    const ogrn = org.ogrn || '';

    // Извлекаем ОКПО (если есть в данных)
    const okpo = org.okpo || '';

    // Извлекаем информацию о руководителе
    let director = '';
    if (org.management) {
      const management = org.management;
      if (management.name) {
        director = management.name;
        if (management.post) {
          director = `${management.post} ${management.name}`.trim();
        }
      }
    }

    // Формируем "Действует на основании"
    let basedOn = 'Устава';
    if (org.opf) {
      const opfShort = org.opf.short || '';
      const opfFull = org.opf.full || '';
      if (opfShort || opfFull) {
        basedOn = opfShort || opfFull;
      }
    }

    // Извлекаем сайт (если есть в данных)
    const website = org.website || '';

    return {
      client_name: clientName,
      client_short_name: clientShortName,
      client_inn: org.inn || '',
      client_kpp: org.kpp || '',
      client_address: legalAddress, // Для обратной совместимости
      client_legal_address: legalAddress,
      client_postal_address: postalAddress,
      client_registration_address: registrationAddress, // Адрес регистрации (для ИП) - из unrestricted_value
      client_phone: clientPhone,
      client_email: clientEmail,
      client_ogrn: ogrn,
      client_okpo: okpo,
      client_director: director,
      client_based_on: basedOn,
      client_website: website,
    };
  }
}

// Экспортируем singleton экземпляр
const dadataService = new DaDataService();
export default dadataService;
