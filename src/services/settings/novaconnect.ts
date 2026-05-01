// NovaConnect-интеграция: setup/update/getConfig.
// Извлечено из settingsService.ts.
import { API_BASE_URL, createHeaders } from "./_client";

export async function setupNovaConnectIntegration(settings: any): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/novaconnect/setup`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        api_url: settings.api_url || 'https://api.novaconnect.kz/api',
        token: settings.token,
        language: settings.language || 'ru',
        webhook_url: settings.webhook_url || '',
        webhook_enabled: settings.webhook_enabled || false,
        sync_interval: settings.sync_interval || 15,
        auto_sync_enabled: settings.auto_sync_enabled || false,
        enabled: settings.enabled || false,
      }),
    });

    // Проверяем тип ответа перед парсингом JSON
    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Неожиданный формат ответа:', text);
      throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      throw new Error(data.error || `Ошибка настройки интеграции: ${response.status}`);
    }

    return {
      success: true,
      message: data.message || 'Интеграция успешно настроена',
    };
  } catch (error) {
    console.error('Ошибка настройки NovaConnect интеграции:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

// Обновление настроек NovaConnect интеграции
export async function updateNovaConnectIntegration(settings: any): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/novaconnect/setup`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify({
        api_url: settings.api_url || 'https://api.novaconnect.kz/api',
        token: settings.token,
        language: settings.language || 'ru',
        webhook_url: settings.webhook_url || '',
        webhook_enabled: settings.webhook_enabled || false,
        sync_interval: settings.sync_interval || 15,
        auto_sync_enabled: settings.auto_sync_enabled || false,
        enabled: settings.enabled || false,
      }),
    });

    // Проверяем тип ответа перед парсингом JSON
    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Неожиданный формат ответа:', text);
      throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}`);
    }

    // Если интеграция не найдена (404), пробуем создать новую
    if (response.status === 404) {
      console.log('Интеграция не найдена, создаем новую...');
      return await setupNovaConnectIntegration(settings);
    }

    if (!response.ok) {
      throw new Error(data.error || `Ошибка обновления интеграции: ${response.status}`);
    }

    return {
      success: true,
      message: data.message || 'Настройки интеграции обновлены',
    };
  } catch (error) {
    console.error('Ошибка обновления NovaConnect интеграции:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}
export async function getNovaConnectConfig(): Promise<{
  api_url?: string;
  token?: string;
  language?: string;
  webhook_url?: string;
  webhook_enabled?: boolean;
  sync_interval?: number;
  auto_sync_enabled?: boolean;
  enabled?: boolean;
  has_token?: boolean;
  is_active?: boolean;
} | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/novaconnect/config`, {
      method: 'GET',
      headers: createHeaders(),
    });

    // 404 означает, что интеграция не настроена - это нормально, не логируем
    if (response.status === 404) {
      return null;
    }

    // Проверяем тип ответа перед парсингом JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (response.status === 404) {
        return null;
      }
      const text = await response.text();
      console.warn('Неожиданный формат ответа от /api/novaconnect/config:', text);
      return null;
    }

    if (!response.ok) {
      // Не логируем 404, так как это ожидаемое поведение
      if (response.status !== 404) {
        console.warn(`Ошибка получения конфигурации NovaConnect: ${response.status}`);
      }
      return null;
    }

    return await response.json();
  } catch (error) {
    // Игнорируем ошибки сети и 404 - просто возвращаем null
    // Не логируем, так как это ожидаемое поведение для ненастроенных интеграций
    return null;
  }
}

