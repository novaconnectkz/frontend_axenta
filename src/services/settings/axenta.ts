// Axenta Cloud-интеграция: проверка статуса, setup/update/delete,
// тест соединения, синхронизация объектов.
// Извлечено из settingsService.ts.
import { API_BASE_URL, createHeaders, fetchIntegrationsList } from "./_client";
import type { AxentaIntegrationSettings, IntegrationWithSettings } from "@/types/settings";

// ===== Axenta Cloud Integration API =====

// Получение конфигурации Axenta интеграции
export async function getAxentaIntegrationConfig(skipIfNotConfigured = false): Promise<IntegrationWithSettings | null> {
  // Если skipIfNotConfigured = true, сначала проверяем через список интеграций
  if (skipIfNotConfigured) {
    const list = await fetchIntegrationsList();
    const axenta = list.find(i => i.type === 'axenta_cloud');
    if (!axenta || !axenta.configured) {
      return null; // Не делаем запрос, если не настроена
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/axenta/config`, {
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
      // Тихо игнорируем неожиданный формат ответа
      return null;
    }

    if (!response.ok) {
      // Не логируем 404, так как это ожидаемое поведение
      // Для других ошибок также не логируем, чтобы не засорять консоль
      return null;
    }

    const data = await response.json();

    // Преобразуем ответ в формат IntegrationWithSettings
    return {
      id: data.integration.id.toString(),
      type: INTEGRATION_TYPES.AXENTA,
      name: data.integration.name,
      description: data.integration.description,
      status: data.integration.is_active ? INTEGRATION_STATUSES.ACTIVE : INTEGRATION_STATUSES.INACTIVE,
      enabled: data.integration.is_active,
      lastSync: data.integration.last_sync_at ? new Date(data.integration.last_sync_at) : null,
      created_at: new Date(data.integration.created_at),
      updated_at: new Date(data.integration.updated_at),
      settings: {
        api_url: data.config.api_url,
        username: data.config.username,
        password: data.config.password, // Уже замаскирован на бэкенде
        sync_interval: data.config.sync_interval,
        auto_sync_enabled: data.config.auto_sync_enabled,
        retry_attempts: data.config.retry_attempts,
        timeout: data.config.timeout,
      },
    };
  } catch (error) {
    // Тихо обрабатываем ошибки сети - не логируем и не пробрасываем
    // Это нормальное поведение, если интеграция не настроена или сервер недоступен
    return null;
  }
}

// Настройка Axenta интеграции
export async function setupAxentaIntegration(settings: any): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/axenta/setup`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        api_url: settings.api_url,
        username: settings.username,
        password: settings.password,
        sync_interval: settings.sync_interval || 15,
        auto_sync_enabled: settings.auto_sync_enabled || false,
        retry_attempts: settings.retry_attempts || 3,
        timeout: settings.timeout || 30,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка настройки интеграции');
    }

    return {
      success: true,
      message: data.message || 'Интеграция успешно настроена',
    };
  } catch (error) {
    console.error('Ошибка настройки Axenta интеграции:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

// Обновление настроек Axenta интеграции
export async function updateAxentaIntegration(settings: any): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/axenta/setup`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify({
        api_url: settings.api_url,
        username: settings.username,
        password: settings.password,
        sync_interval: settings.sync_interval || 15,
        auto_sync_enabled: settings.auto_sync_enabled || false,
        retry_attempts: settings.retry_attempts || 3,
        timeout: settings.timeout || 30,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка обновления интеграции');
    }

    return {
      success: true,
      message: data.message || 'Настройки интеграции обновлены',
    };
  } catch (error) {
    console.error('Ошибка обновления Axenta интеграции:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

export async function checkAxentaIntegrationStatus(): Promise<{
  isConfigured: boolean;
  isActive: boolean;
  needsPassword: boolean;
  lastSync?: Date;
  errorMessage?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/axenta/status`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          isConfigured: false,
          isActive: false,
          needsPassword: true
        };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      isConfigured: data.configured || false,
      isActive: data.active || false,
      needsPassword: !data.configured || !data.active,
      lastSync: data.last_sync ? new Date(data.last_sync) : undefined,
      errorMessage: data.error_message
    };
  } catch (error) {
    console.error('Ошибка проверки статуса Axenta интеграции:', error);
    return {
      isConfigured: false,
      isActive: false,
      needsPassword: true,
      errorMessage: error instanceof Error ? error.message : 'Неизвестная ошибка'
    };
  }
}

// Тестирование подключения к Axenta Cloud
export async function testAxentaConnection(settings: AxentaIntegrationSettings): Promise<{ success: boolean; message: string; connected: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/axenta/test-connection`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(settings), // Передаем настройки в теле запроса
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.details || data.error || 'Ошибка тестирования подключения',
        connected: false,
      };
    }

    return {
      success: true,
      message: data.message || 'Подключение успешно',
      connected: data.connected || true,
    };
  } catch (error) {
    console.error('Ошибка тестирования подключения Axenta:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      connected: false,
    };
  }
}

// Синхронизация объектов с Axenta Cloud
export async function syncAxentaObjects(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/axenta/sync/objects`, {
      method: 'POST',
      headers: createHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.details || data.error || 'Ошибка синхронизации');
    }

    return {
      success: true,
      message: data.message || 'Синхронизация завершена успешно',
    };
  } catch (error) {
    console.error('Ошибка синхронизации объектов Axenta:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

// Получение статуса Axenta интеграции
export async function getAxentaIntegrationStatus(): Promise<{
  is_active: boolean;
  last_sync_at: Date | null;
  last_error_at: Date | null;
  error_message?: string;
  sync_count?: number;
  error_count?: number;
  success_count?: number;
  success_rate?: number;
  next_sync_at?: Date | null;
} | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/axenta/status`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Интеграция не настроена
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      is_active: data.status.is_active,
      last_sync_at: data.status.last_sync_at ? new Date(data.status.last_sync_at) : null,
      last_error_at: data.status.last_error_at ? new Date(data.status.last_error_at) : null,
      error_message: data.status.error_message,
      sync_count: data.status.sync_count,
      error_count: data.status.error_count,
      success_count: data.status.success_count,
      success_rate: data.status.success_rate,
      next_sync_at: data.status.next_sync_at ? new Date(data.status.next_sync_at) : null,
    };
  } catch (error) {
    console.error('Ошибка получения статуса Axenta:', error);
    throw error;
  }
}

// Удаление Axenta интеграции
export async function deleteAxentaIntegration(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/axenta/setup`, {
      method: 'DELETE',
      headers: createHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка удаления интеграции');
    }

    return {
      success: true,
      message: data.message || 'Интеграция удалена',
    };
  } catch (error) {
    console.error('Ошибка удаления Axenta интеграции:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}
