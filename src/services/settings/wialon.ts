// Wialon-интеграция: настройка, аккаунты, объекты, операции на стороне Wialon API.
// Извлечено из settingsService.ts для уменьшения размера основного файла.
import { API_BASE_URL, createHeaders } from "./_client";

// === WIALON ИНТЕГРАЦИЯ ===

// Получение конфигурации Wialon
export async function getWialonConfig(): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wialon/config`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Ошибка получения конфигурации: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка получения конфигурации Wialon:', error);
    return null;
  }
}

// Получение аккаунтов Wialon
export async function getWialonAccounts(): Promise<{
  items: Array<{
    id: number;
    name: string;
    type: string;
    is_active: boolean;
    objects_total: number;
    objects_active: number;
    source?: string;
    source_label?: string;
    connection_id?: number;
    created_at?: string;
    dealer_rights?: boolean;
    hierarchy?: string;
    billing_account_id?: number; // ID ресурса биллинга (bact)
  }>;
  total: number;
  connectionIds?: number[]; // Для фоновой загрузки статистики объектов
  stats: {
    total: number;
    active: number;
    blocked: number;
    objects_total: number;
  };
} | null> {
  try {
    // Используем новый API для получения аккаунтов из всех подключений
    const response = await fetch(`${API_BASE_URL}/api/wialon/all-accounts`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Ошибка получения аккаунтов: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Ошибка получения аккаунтов Wialon:', error);
    return null;
  }
}

// Получение статистики объектов для подключения Wialon (фоновая загрузка)
export async function getWialonConnectionObjectsStats(connectionId: number): Promise<{
  connectionId: number;
  stats: Record<number, { objectsTotal: number; objectsActive: number; objectsDeactivated?: number }>;
  totalObjects: number;
} | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/wialon/connections/${connectionId}/objects-stats`,
      {
        method: 'GET',
        headers: createHeaders(),
      }
    );

    if (!response.ok) {
      console.warn(`⚠️ Статистика недоступна для подключения ${connectionId}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Ошибка получения статистики для подключения ${connectionId}:`, error);
    return null;
  }
}

// Список активных wialon-подключений компании (для селектора "Система мониторинга")
export async function getWialonConnections(): Promise<Array<{
  id: number;
  name: string;
  user_name: string;
  connection_type: 'hosting' | 'local';
  is_active: boolean;
  source_label: string;
}>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wialon/connections`, {
      method: 'GET',
      headers: createHeaders(),
    });
    if (!response.ok) return [];
    const data = await response.json();
    // Backend отдаёт { data: { connections: [...] } } | { connections: [...] } | [...]
    const list = Array.isArray(data)
      ? data
      : (data?.data?.connections ?? data?.connections ?? data?.data ?? []);
    return (list as any[]).filter(c => c.is_active).map(c => ({
      id: c.id,
      name: c.name,
      user_name: c.user_name,
      connection_type: c.connection_type,
      is_active: c.is_active,
      source_label: c.connection_type === 'hosting' ? `WH(${c.user_name})` : `WL(${c.user_name})`,
    }));
  } catch (e) {
    console.error('getWialonConnections:', e);
    return [];
  }
}

// Список тарифных планов для wialon-подключения (для UI селектора при создании аккаунта).
// При forceRefresh=true дёргает Wialon API синхронно и обновляет БД-кэш.
export async function getWialonBillingPlans(connectionId: number, forceRefresh = false): Promise<Array<{ name: string }>> {
  try {
    const url = `${API_BASE_URL}/api/wialon/connections/${connectionId}/billing-plans${forceRefresh ? '?force_refresh=true' : ''}`;
    const response = await fetch(url, { method: 'GET', headers: createHeaders() });
    if (!response.ok) {
      console.warn(`Тарифы недоступны для connection=${connectionId}`);
      return [];
    }
    const data = await response.json();
    return data.plans || [];
  } catch (e) {
    console.error('getWialonBillingPlans:', e);
    return [];
  }
}

// Создание новой учётки в Wialon-подключении (5-step flow на backend)
export async function createWialonAccount(connectionId: number, payload: {
  name: string;
  username: string;
  password: string;
  email: string;
  type: 'client' | 'partner';
  billingPlan?: string;
}): Promise<{
  ok: boolean;
  error?: string;
  data?: {
    userId: number;
    resourceId: number;
    name: string;
    type: string;
    sourceLabel: string;
    hierarchy: string;
  };
}> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/wialon/connections/${connectionId}/accounts`,
      {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(payload),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      return { ok: false, error: data.error || `HTTP ${response.status}` };
    }
    return { ok: true, data };
  } catch (e: any) {
    console.error('createWialonAccount:', e);
    return { ok: false, error: e?.message || 'network error' };
  }
}

// Точечный refresh stats одной учётной записи Wialon (~2-3 сек к Wialon API).
// Возвращает свежие objectsTotal/Active/Deactivated. После toggle/edit или ручного клика "обновить".
export async function refreshWialonAccount(
  connectionId: number,
  userId: number
): Promise<{
  resourceId: number;
  objectsTotal: number;
  objectsActive: number;
  objectsDeactivated: number;
} | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/wialon/connections/${connectionId}/refresh-account/${userId}`,
      {
        method: 'POST',
        headers: createHeaders(),
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.warn(`Refresh wialon account ${userId} failed:`, err);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Ошибка refreshWialonAccount:', error);
    return null;
  }
}

// Блокировка/разблокировка аккаунта Wialon
export async function toggleWialonAccountStatus(
  accountId: number,
  connectionId: number,
  enable: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/wialon/accounts/${accountId}/toggle-status`,
      {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({
          enable,
          connection_id: connectionId,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.error || `Ошибка: ${response.status}`,
      };
    }

    return {
      success: result.success,
      message: result.message || (enable ? 'Аккаунт активирован' : 'Аккаунт заблокирован'),
    };
  } catch (error) {
    console.error('Ошибка изменения статуса Wialon аккаунта:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Вход в мониторинг Wialon под конкретным пользователем
 * Возвращает URL для открытия в новой вкладке
 */
export async function loginToWialonMonitoring(connectionId: number, userName?: string, accountId?: number, userId?: number): Promise<{
  success: boolean;
  redirectUrl?: string;
  message?: string;
}> {
  try {
    console.log(`🔐 Вход в мониторинг Wialon: connection_id=${connectionId}, user_name=${userName || 'основной'}, user_id=${userId || 'не указан'}, account_id=${accountId || 'не указан'}`);

    const response = await fetch(`${API_BASE_URL}/api/wialon/login-to-monitoring`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        connection_id: connectionId,
        user_name: userName || '',
        user_id: userId || 0,
        account_id: accountId || 0,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        message: result.error || 'Ошибка входа в мониторинг',
      };
    }

    return {
      success: true,
      redirectUrl: result.redirectUrl,
    };
  } catch (error) {
    console.error('Ошибка входа в мониторинг Wialon:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Вход в CMS Wialon под конкретным пользователем
 * Возвращает URL для открытия в новой вкладке
 */
export async function loginToWialonCms(connectionId: number, userName?: string, accountId?: number, userId?: number): Promise<{
  success: boolean;
  redirectUrl?: string;
  message?: string;
}> {
  try {
    console.log(`🔐 Вход в CMS Wialon: connection_id=${connectionId}, user_name=${userName || 'основной'}, user_id=${userId || 'не указан'}, account_id=${accountId || 'не указан'}`);

    const response = await fetch(`${API_BASE_URL}/api/wialon/login-to-cms`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        connection_id: connectionId,
        user_name: userName || '',
        user_id: userId || 0,
        account_id: accountId || 0,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        message: result.error || 'Ошибка входа в CMS',
      };
    }

    return {
      success: true,
      redirectUrl: result.redirectUrl,
    };
  } catch (error) {
    console.error('Ошибка входа в CMS Wialon:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Удалить учетную запись Wialon
 * Вызывает Wialon API account/delete_account
 * @param userId ID учетной записи в Wialon
 * @param connectionId ID подключения
 * @param reasonKey Причина удаления (для Wialon Hosting с объектами)
 */
export async function deleteWialonAccount(userId: number, connectionId: number, reasonKey?: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    console.log(`🗑️ Удаление учетной записи Wialon: user_id=${userId}, connection_id=${connectionId}, reason=${reasonKey || 'none'}`);

    let url = `${API_BASE_URL}/api/wialon/users/${userId}?connection_id=${connectionId}`;
    if (reasonKey) {
      url += `&reason_key=${encodeURIComponent(reasonKey)}`;
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers: createHeaders(),
    }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        message: result.error || 'Ошибка удаления пользователя',
      };
    }

    return {
      success: true,
      message: result.message || 'Пользователь успешно удалён',
    };
  } catch (error) {
    console.error('Ошибка удаления пользователя Wialon:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

// Получение объектов (units) Wialon
export async function getWialonUnits(): Promise<{
  items: Array<{
    id: number;
    nm: string;        // Название (поле nm в Wialon API)
    uid: string;       // Уникальный ID (IMEI)
    hw?: number;       // ID типа устройства
    hw_name?: string;  // Название типа устройства
    ph?: string;       // Телефон 1
    ph2?: string;      // Телефон 2
    last_message?: number; // Время последнего сообщения (UTC timestamp)
    ct?: number;       // Время создания объекта (UTC timestamp)
  }>;
  total: number;
} | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wialon/units`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error('Ошибка получения объектов Wialon:', error);
    return null;
  }
}

// Настройка интеграции Wialon
export async function setupWialonIntegration(settings: any): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wialon/setup`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        token: settings.token,
        data_center: settings.data_center || 'com',
        sync_interval: settings.sync_interval || 5,
        auto_sync_enabled: settings.auto_sync_enabled || false,
        sync_vehicles: settings.sync_vehicles || true,
        sync_sensors: settings.sync_sensors || true,
        sync_maintenance: settings.sync_maintenance || true,
        sync_drivers: settings.sync_drivers || true,
        sync_geozones: settings.sync_geozones || true,
        enabled: settings.enabled || false,
      }),
    });

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
      message: data.message || 'Интеграция с Wialon успешно настроена',
    };
  } catch (error) {
    console.error('Ошибка настройки Wialon интеграции:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

// Обновление настроек Wialon интеграции
export async function updateWialonIntegration(settings: any): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wialon/setup`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify({
        token: settings.token,
        data_center: settings.data_center || 'com',
        sync_interval: settings.sync_interval || 5,
        auto_sync_enabled: settings.auto_sync_enabled || false,
        sync_vehicles: settings.sync_vehicles || true,
        sync_sensors: settings.sync_sensors || true,
        sync_maintenance: settings.sync_maintenance || true,
        sync_drivers: settings.sync_drivers || true,
        sync_geozones: settings.sync_geozones || true,
        enabled: settings.enabled || false,
      }),
    });

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
      return await setupWialonIntegration(settings);
    }

    if (!response.ok) {
      throw new Error(data.error || `Ошибка обновления интеграции: ${response.status}`);
    }

    return {
      success: true,
      message: data.message || 'Настройки интеграции Wialon обновлены',
    };
  } catch (error) {
    console.error('Ошибка обновления Wialon интеграции:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}
