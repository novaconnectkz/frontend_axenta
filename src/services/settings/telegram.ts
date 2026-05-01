// Telegram-интеграция: setup/update конфигурации, получение и тест.
// Извлечено из settingsService.ts.
import { API_BASE_URL, createHeaders } from "./_client";

// === TELEGRAM ИНТЕГРАЦИЯ ===

// Настройка Telegram интеграции
export async function setupTelegramIntegration(settings: any): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/integrations/telegram/setup`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        bot_token: settings.bot_token,
        default_chat_id: settings.default_chat_id || '',
        parse_mode: settings.parse_mode || 'HTML',
        disable_notifications: settings.disable_notifications || false,
        quiet_hours_start: settings.quiet_hours_start || '',
        quiet_hours_end: settings.quiet_hours_end || '',
        quiet_hours_enabled: settings.quiet_hours_enabled || false,
      }),
    });

    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || `Ошибка настройки интеграции: ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(data.error || `Ошибка настройки интеграции: ${response.status}`);
    }

    return {
      success: true,
      message: data.message || 'Интеграция с Telegram успешно настроена',
    };
  } catch (error) {
    console.error('Ошибка настройки Telegram интеграции:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

// Обновление Telegram интеграции
export async function updateTelegramIntegration(settings: any): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/integrations/telegram/setup`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify({
        bot_token: settings.bot_token,
        default_chat_id: settings.default_chat_id || '',
        parse_mode: settings.parse_mode || 'HTML',
        disable_notifications: settings.disable_notifications || false,
        quiet_hours_start: settings.quiet_hours_start || '',
        quiet_hours_end: settings.quiet_hours_end || '',
        quiet_hours_enabled: settings.quiet_hours_enabled || false,
      }),
    });

    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || `Ошибка обновления интеграции: ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(data.error || `Ошибка обновления интеграции: ${response.status}`);
    }

    return {
      success: true,
      message: data.message || 'Настройки интеграции обновлены',
    };
  } catch (error) {
    console.error('Ошибка обновления Telegram интеграции:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

// Получение конфигурации Telegram интеграции
export async function getTelegramConfig(skipIfNotConfigured = false): Promise<{
  bot_token?: string;
  default_chat_id?: string;
  parse_mode?: string;
  disable_notifications?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  quiet_hours_enabled?: boolean;
  enabled?: boolean;
  is_active?: boolean;
} | null> {
  // Если skipIfNotConfigured = true, сначала проверяем через список интеграций
  if (skipIfNotConfigured) {
    const list = await this.getIntegrationsList();
    const telegram = list.find(i => i.type === 'telegram');
    if (!telegram || !telegram.configured) {
      return null; // Не делаем запрос, если не настроена
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/integrations/telegram/config`, {
      method: 'GET',
      headers: createHeaders(),
    });

    // 404 означает, что интеграция не настроена - это нормально
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Ошибка получения конфигурации: ${response.status}`);
    }

    const data = await response.json();
    return {
      bot_token: data.config?.bot_token || '',
      default_chat_id: data.config?.default_chat_id || '',
      parse_mode: data.config?.parse_mode || 'HTML',
      disable_notifications: data.config?.disable_notifications || false,
      quiet_hours_start: data.config?.quiet_hours_start || '',
      quiet_hours_end: data.config?.quiet_hours_end || '',
      quiet_hours_enabled: data.config?.quiet_hours_enabled || false,
      enabled: data.integration?.is_active || false,
      is_active: data.integration?.is_active || false,
    };
  } catch (error) {
    console.error('Ошибка получения конфигурации Telegram:', error);
    return null;
  }
}

// Тестирование подключения Telegram
export async function testTelegramConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/integrations/telegram/test-connection`, {
      method: 'POST',
      headers: createHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.details || data.error || 'Ошибка подключения',
      };
    }

    return {
      success: true,
      message: data.message || 'Подключение успешно',
    };
  } catch (error) {
    console.error('Ошибка тестирования Telegram подключения:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}
