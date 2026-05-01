// Email SMTP-интеграция.
// Извлечено из settingsService.ts.
import { API_BASE_URL, createHeaders } from "./_client";

// === EMAIL SMTP ИНТЕГРАЦИЯ ===

export async function setupEmailIntegration(settings: any): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/email/setup`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        smtp_host: settings.smtp_host,
        smtp_port: settings.smtp_port || 587,
        smtp_username: settings.smtp_username,
        smtp_password: settings.smtp_password,
        smtp_from_email: settings.smtp_from_email,
        smtp_from_name: settings.smtp_from_name || 'Axenta CRM',
        smtp_use_tls: settings.smtp_use_tls !== undefined ? settings.smtp_use_tls : true,
      }),
    });

    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || `Ошибка настройки Email интеграции: ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(data.error || `Ошибка настройки Email интеграции: ${response.status}`);
    }

    return {
      success: true,
      message: data.message || 'Настройки Email SMTP успешно сохранены',
    };
  } catch (error) {
    console.error('Ошибка настройки Email интеграции:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

export async function updateEmailIntegration(settings: any): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/email/setup`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify({
        smtp_host: settings.smtp_host,
        smtp_port: settings.smtp_port || 587,
        smtp_username: settings.smtp_username,
        smtp_password: settings.smtp_password,
        smtp_from_email: settings.smtp_from_email,
        smtp_from_name: settings.smtp_from_name || 'Axenta CRM',
        smtp_use_tls: settings.smtp_use_tls !== undefined ? settings.smtp_use_tls : true,
      }),
    });

    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || `Ошибка обновления Email интеграции: ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(data.error || `Ошибка обновления Email интеграции: ${response.status}`);
    }

    return {
      success: true,
      message: data.message || 'Настройки Email SMTP успешно обновлены',
    };
  } catch (error) {
    console.error('Ошибка обновления Email интеграции:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

export async function getEmailConfig(): Promise<{
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_from_email?: string;
  smtp_from_name?: string;
  smtp_use_tls?: boolean;
  enabled?: boolean;
  is_active?: boolean;
} | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/email/config`, {
      method: 'GET',
      headers: createHeaders(),
    });

    // 404 означает, что интеграция не настроена - это нормально
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Ошибка получения конфигурации Email: ${response.status}`);
    }

    const data = await response.json();
    return {
      smtp_host: data.config?.smtp_host || '',
      smtp_port: data.config?.smtp_port || 587,
      smtp_username: data.config?.smtp_username || '',
      smtp_password: data.config?.smtp_password || '',
      smtp_from_email: data.config?.smtp_from_email || '',
      smtp_from_name: data.config?.smtp_from_name || 'Axenta CRM',
      smtp_use_tls: data.config?.smtp_use_tls !== undefined ? data.config.smtp_use_tls : true,
      enabled: data.config?.enabled !== undefined ? data.config.enabled : (data.config?.is_active || false),
      is_active: data.config?.is_active || false,
    };
  } catch (error) {
    console.error('Ошибка получения конфигурации Email:', error);
    return null;
  }
}

export async function testEmailConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/email/test-connection`, {
      method: 'POST',
      headers: createHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.details || data.error || 'Ошибка подключения к SMTP',
      };
    }

    return {
      success: true,
      message: data.message || 'Подключение к SMTP успешно',
    };
  } catch (error) {
    console.error('Ошибка тестирования Email подключения:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

// Получение конфигурации NovaConnect интеграции
