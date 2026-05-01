// MAX Messenger-интеграция.
// Извлечено из settingsService.ts.
import { API_BASE_URL, createHeaders } from "./_client";

// === MAX MESSENGER ИНТЕГРАЦИЯ ===

export async function setupMaxIntegration(settings: any): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/integrations/max/setup`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        bot_token: settings.bot_token,
        parse_mode: settings.parse_mode || 'HTML',
        webhook_url: settings.webhook_url || '',
        use_polling: settings.use_polling || false,
      }),
    });

    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || `Ошибка настройки MAX интеграции: ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(data.error || `Ошибка настройки MAX интеграции: ${response.status}`);
    }

    return {
      success: true,
      message: data.message || 'Настройки MAX успешно сохранены',
    };
  } catch (error) {
    console.error('Ошибка настройки MAX интеграции:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

export async function updateMaxIntegration(settings: any): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/integrations/max/setup`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify({
        bot_token: settings.bot_token,
        parse_mode: settings.parse_mode || 'HTML',
        webhook_url: settings.webhook_url || '',
        use_polling: settings.use_polling || false,
      }),
    });

    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || `Ошибка обновления MAX интеграции: ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(data.error || `Ошибка обновления MAX интеграции: ${response.status}`);
    }

    return {
      success: true,
      message: data.message || 'Настройки MAX успешно обновлены',
    };
  } catch (error) {
    console.error('Ошибка обновления MAX интеграции:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

export async function getMaxConfig(skipIfNotConfigured = false): Promise<{
  bot_token?: string;
  parse_mode?: string;
  webhook_url?: string;
  use_polling?: boolean;
  enabled?: boolean;
  is_active?: boolean;
} | null> {
  // Если skipIfNotConfigured = true, сначала проверяем через список интеграций
  if (skipIfNotConfigured) {
    const list = await this.getIntegrationsList();
    const max = list.find(i => i.type === 'max');
    if (!max || !max.configured) {
      return null; // Не делаем запрос, если не настроена
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/integrations/max/config`, {
      method: 'GET',
      headers: createHeaders(),
    });

    // 404 означает, что интеграция не настроена - это нормально
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Ошибка получения конфигурации MAX: ${response.status}`);
    }

    const data = await response.json();
    return {
      bot_token: data.config?.bot_token || '',
      parse_mode: data.config?.parse_mode || 'HTML',
      webhook_url: data.config?.webhook_url || '',
      use_polling: data.config?.use_polling || false,
      enabled: data.config?.enabled !== undefined ? data.config.enabled : (data.config?.is_active || false),
      is_active: data.config?.is_active || false,
    };
  } catch (error) {
    console.error('Ошибка получения конфигурации MAX:', error);
    return null;
  }
}

export async function testMaxConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/integrations/max/test-connection`, {
      method: 'POST',
      headers: createHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.details || data.error || 'Ошибка подключения к MAX',
      };
    }

    return {
      success: true,
      message: data.message || 'Подключение к MAX успешно',
    };
  } catch (error) {
    console.error('Ошибка тестирования MAX подключения:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}
