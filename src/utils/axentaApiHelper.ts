/**
 * Вспомогательные функции для работы с API Axenta
 * Включает retry механизм и детальную диагностику
 */

import axios, { AxiosError } from 'axios';

export interface ApiTestResult {
  success: boolean;
  status: number;
  message: string;
  data?: any;
  error?: string;
  timing?: number;
}

/**
 * Тестирование подключения к API Axenta с retry механизмом
 */
export async function testAxentaConnection(retries = 3, delay = 1000): Promise<ApiTestResult> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Попытка ${attempt}/${retries}: Тестирование подключения к Axenta...`);
      
      const response = await axios.get('https://axenta.cloud', {
        timeout: 10000,
        validateStatus: () => true
      });
      
      const timing = Date.now() - startTime;
      
      if (response.status === 200) {
        return {
          success: true,
          status: response.status,
          message: `Подключение успешно (${timing}ms)`,
          timing
        };
      } else {
        return {
          success: false,
          status: response.status,
          message: `Сервер вернул статус ${response.status}`,
          timing
        };
      }
      
    } catch (error: any) {
      const timing = Date.now() - startTime;
      
      if (attempt === retries) {
        return {
          success: false,
          status: 0,
          message: `Ошибка подключения после ${retries} попыток`,
          error: error.message,
          timing
        };
      }
      
      console.log(`❌ Попытка ${attempt} неудачна, повтор через ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return {
    success: false,
    status: 0,
    message: 'Неожиданная ошибка'
  };
}

/**
 * Тестирование API авторизации с retry механизмом
 */
export async function testAxentaAuth(username: string, password: string, retries = 3, delay = 2000): Promise<ApiTestResult> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const startTime = Date.now();
    
    try {
      console.log(`🔐 Попытка ${attempt}/${retries}: Тестирование авторизации...`);
      
      const response = await axios.post(
        'https://axenta.cloud/api/auth/login/',
        { username, password },
        {
          timeout: 15000,
          validateStatus: () => true,
          headers: {
            'Content-Type': 'application/json',
            // 'User-Agent': 'Axenta-CRM-Frontend/1.0', // Убрано - браузер блокирует
            'Accept': 'application/json',
            // 'Cache-Control': 'no-cache' // Убрано - CORS блокирует
          }
        }
      );
      
      const timing = Date.now() - startTime;
      
      if (response.status === 200) {
        return {
          success: true,
          status: response.status,
          message: `Авторизация успешна (${timing}ms)`,
          data: response.data,
          timing
        };
      } else if (response.status === 400) {
        return {
          success: false,
          status: response.status,
          message: 'Неверные учетные данные',
          data: response.data,
          timing
        };
      } else if (response.status === 502) {
        if (attempt === retries) {
          return {
            success: false,
            status: response.status,
            message: `Сервер недоступен (502) после ${retries} попыток`,
            timing
          };
        }
        
        console.log(`❌ Получен 502, повтор через ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      } else {
        return {
          success: false,
          status: response.status,
          message: `Неожиданный статус: ${response.status}`,
          data: response.data,
          timing
        };
      }
      
    } catch (error: any) {
      const timing = Date.now() - startTime;
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        if (axiosError.code === 'ECONNABORTED') {
          if (attempt === retries) {
            return {
              success: false,
              status: 0,
              message: `Таймаут после ${retries} попыток`,
              error: 'Timeout',
              timing
            };
          }
        } else if (axiosError.response?.status === 502) {
          if (attempt === retries) {
            return {
              success: false,
              status: 502,
              message: `Сервер недоступен (502) после ${retries} попыток`,
              timing
            };
          }
        }
      }
      
      if (attempt === retries) {
        return {
          success: false,
          status: 0,
          message: `Ошибка после ${retries} попыток: ${error.message}`,
          error: error.message,
          timing
        };
      }
      
      console.log(`❌ Попытка ${attempt} неудачна: ${error.message}, повтор через ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return {
    success: false,
    status: 0,
    message: 'Неожиданная ошибка'
  };
}

/**
 * Получение детальной диагностической информации
 */
export async function getAxentaDiagnostics(): Promise<{
  connection: ApiTestResult;
  cors: boolean;
  ssl: boolean;
  timing: number;
}> {
  const startTime = Date.now();
  
  // Тест подключения
  const connection = await testAxentaConnection(1, 0);
  
  // Проверка CORS (попытка OPTIONS запроса)
  let cors = false;
  try {
    await axios.options('https://axenta.cloud/api/auth/login/', {
      timeout: 5000
    });
    cors = true;
  } catch (error) {
    cors = false;
  }
  
  // Проверка SSL
  let ssl = false;
  try {
    await axios.get('https://axenta.cloud', {
      timeout: 5000,
      httpsAgent: { rejectUnauthorized: true }
    });
    ssl = true;
  } catch (error) {
    ssl = false;
  }
  
  const timing = Date.now() - startTime;
  
  return {
    connection,
    cors,
    ssl,
    timing
  };
}

/**
 * Форматирование результата для отображения
 */
export function formatApiResult(result: ApiTestResult): string {
  const status = result.success ? '✅' : '❌';
  const timing = result.timing ? ` (${result.timing}ms)` : '';
  
  return `${status} ${result.message}${timing}`;
}
