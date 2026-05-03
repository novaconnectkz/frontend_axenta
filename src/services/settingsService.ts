// Сервис для работы с настройками системы
import { config } from "@/config/env";
import type {
  AxentaIntegrationSettings,
  ConnectionStatus,
  IntegrationLog,
  IntegrationStats,
  IntegrationStatusResponse,
  IntegrationWithSettings,
  IntegrationsResponse,
  NotificationChannelSettings,
  NotificationChannelsResponse,
  NotificationTemplate,
  ObjectTemplate,
  ReportTemplate,
  SystemSettings,
  SystemSettingsForm,
  TemplatesResponse,
  UserTemplate,
} from "@/types/settings";
import {
  INTEGRATION_STATUSES,
  INTEGRATION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENTS,
  TEMPLATE_SYSTEMS,
  TEMPLATE_TYPES,
} from "@/types/settings";
import axios from 'axios';
import * as wialon from './settings/wialon';
import * as telegram from './settings/telegram';
import * as max from './settings/max';
import * as email from './settings/email';
import * as axenta from './settings/axenta';
import * as novaconnect from './settings/novaconnect';
import { fetchIntegrationsList } from './settings/_client';

// API базовый URL
const API_BASE_URL = config.backendUrl;

// Получение токена авторизации
const getAuthToken = (): string | null => {
  return localStorage.getItem('axenta_token');
};

// Создание заголовков для API запросов
const createHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  return headers;
};


// Demo-данные вынесены в отдельный файл (см. settings/_demoData.ts)
import {
  demoIntegrations,
  demoNotificationChannels,
  demoObjectTemplates,
  demoUserTemplates,
  demoNotificationTemplates,
  demoSystemSettings,
  demoConnectionStatuses,
  demoIntegrationStats,
  demoIntegrationLogs,
} from "./settings/_demoData";

class SettingsService {
  private apiClient = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 30000,
  });

  constructor() {
    // Добавляем interceptor для токена
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem('axenta_token');
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }

      const companyRaw = localStorage.getItem('axenta_company');
      if (companyRaw) {
        try {
          const company = JSON.parse(companyRaw);
          const companyId = company?.id;
          if (companyId) {
            config.headers['X-Tenant-ID'] = String(companyId);
          }
        } catch (error) {
          console.error('Error parsing company data:', error);
        }
      }

      return config;
    });
  }

  private getCompanyId(): number | null {
    try {
      const companyRaw = localStorage.getItem('axenta_company');
      if (companyRaw) {
        const company = JSON.parse(companyRaw);
        return company?.id || null;
      }
    } catch (error) {
      console.error('Error getting company ID:', error);
    }
    return null;
  }

  // === ИНТЕГРАЦИИ ===

  async getIntegrations(): Promise<IntegrationsResponse> {
    // Имитация API запроса
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      integrations: demoIntegrations,
      total: demoIntegrations.length,
    };
  }

  async getIntegration(id: string): Promise<IntegrationWithSettings> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const integration = demoIntegrations.find((i) => i.id === id);
    if (!integration) {
      throw new Error("Интеграция не найдена");
    }

    return integration;
  }

  async updateIntegration(
    id: string,
    data: Partial<IntegrationWithSettings>
  ): Promise<IntegrationWithSettings> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const index = demoIntegrations.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error("Интеграция не найдена");
    }

    demoIntegrations[index] = {
      ...demoIntegrations[index],
      ...data,
      updated_at: new Date(),
    };

    return demoIntegrations[index];
  }

  async testIntegrationConnection(
    id: string
  ): Promise<{ success: boolean; message: string; response_time?: number }> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const integration = demoIntegrations.find((i) => i.id === id);
    if (!integration) {
      throw new Error("Интеграция не найдена");
    }

    // Имитируем тестирование подключения
    const isSuccess = Math.random() > 0.3; // 70% успешных тестов

    if (isSuccess) {
      return {
        success: true,
        message: "Подключение успешно установлено",
        response_time: Math.floor(Math.random() * 500) + 100,
      };
    } else {
      return {
        success: false,
        message: "Ошибка подключения: таймаут соединения",
      };
    }
  }

  // === УВЕДОМЛЕНИЯ ===

  async getNotificationChannels(): Promise<NotificationChannelsResponse> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    return {
      channels: demoNotificationChannels,
      total: demoNotificationChannels.length,
    };
  }

  async updateNotificationChannel(
    id: string,
    data: Partial<NotificationChannelSettings>
  ): Promise<NotificationChannelSettings> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const index = demoNotificationChannels.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error("Канал уведомлений не найден");
    }

    demoNotificationChannels[index] = {
      ...demoNotificationChannels[index],
      ...data,
    };

    return demoNotificationChannels[index];
  }

  async testNotificationChannel(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const channel = demoNotificationChannels.find((c) => c.id === id);
    if (!channel) {
      throw new Error("Канал уведомлений не найден");
    }

    const isSuccess = Math.random() > 0.2; // 80% успешных тестов

    if (isSuccess) {
      return {
        success: true,
        message: `Тестовое уведомление успешно отправлено через ${channel.name}`,
      };
    } else {
      return {
        success: false,
        message: "Ошибка отправки тестового уведомления",
      };
    }
  }

  // === ШАБЛОНЫ ===

  async getTemplates(type?: string, system?: string): Promise<TemplatesResponse> {
    try {
      const headers = createHeaders();
      let url = '';

      // Определяем URL в зависимости от типа шаблона
      if (type === 'report') {
        url = `${API_BASE_URL}/api/reports/templates`;
        if (system) {
          url += `?system=${system}`;
        }
      } else if (type === 'user') {
        url = `${API_BASE_URL}/api/user-templates`;
        if (system) {
          url += `?system=${system}`;
        }
      } else if (type === 'object') {
        url = `${API_BASE_URL}/api/object-templates`;
        if (system) {
          url += `?system=${system}`;
        }
      } else {
        // Если тип не указан, возвращаем пустой массив
        // В будущем можно сделать запросы ко всем типам и объединить
        return { templates: [], total: 0 };
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Ошибка загрузки шаблонов: ${response.statusText}`);
      }

      let templates: (ObjectTemplate | UserTemplate | NotificationTemplate | ReportTemplate)[] = [];

      if (type === 'report') {
        const data = await response.json();
        // Преобразуем данные бэкенда в формат фронтенда
        templates = Array.isArray(data) ? data.map((t: any) => this.mapReportTemplateFromBackend(t)) : [];
      } else if (type === 'user') {
        const data = await response.json();
        if (data.status === 'success' && data.data) {
          templates = Array.isArray(data.data.items)
            ? data.data.items.map((t: any) => this.mapUserTemplateFromBackend(t))
            : [];
        }
      } else if (type === 'object') {
        const data = await response.json();
        if (data.status === 'success' && data.data) {
          templates = Array.isArray(data.data.items)
            ? data.data.items.map((t: any) => this.mapObjectTemplateFromBackend(t))
            : [];
        }
      }

      // Фильтруем по системе, если указана
      if (system) {
        templates = templates.filter((t) => t.system === system);
      }

      return {
        templates,
        total: templates.length,
      };
    } catch (error) {
      console.error('Ошибка загрузки шаблонов:', error);
      // В случае ошибки возвращаем пустой массив
      return { templates: [], total: 0 };
    }
  }

  // Маппинг шаблона отчета из формата бэкенда в формат фронтенда
  private mapReportTemplateFromBackend(data: any): ReportTemplate {
    let config: any = {};
    try {
      if (data.config && typeof data.config === 'string') {
        config = JSON.parse(data.config);
      } else if (data.config) {
        config = data.config;
      }
    } catch (e) {
      console.warn('Ошибка парсинга config шаблона отчета:', e);
    }

    // Извлекаем system из config или используем значение по умолчанию
    const system = config.system || data.system || 'axenta';

    return {
      id: data.id?.toString() || '',
      type: 'report',
      system: system,
      name: data.name || '',
      description: data.description || '',
      category: data.category,
      is_system: data.is_system || false,
      is_active: data.is_active !== undefined ? data.is_active : true,
      usage_count: data.usage_count || 0,
      created_at: data.created_at ? new Date(data.created_at) : new Date(),
      updated_at: data.updated_at ? new Date(data.updated_at) : new Date(),
      // Сохраняем content и settings из config
      content: config.content,
      settings: config.settings,
      sql_query: data.sql_query,
      parameters: data.parameters ? (typeof data.parameters === 'string' ? JSON.parse(data.parameters) : data.parameters) : undefined,
      headers: data.headers ? (typeof data.headers === 'string' ? JSON.parse(data.headers) : data.headers) : undefined,
      formatting: data.formatting ? (typeof data.formatting === 'string' ? JSON.parse(data.formatting) : data.formatting) : undefined,
    };
  }

  // Маппинг шаблона пользователя из формата бэкенда в формат фронтенда
  private mapUserTemplateFromBackend(data: any): UserTemplate {
    return {
      id: data.id?.toString() || '',
      type: 'user',
      system: data.system || 'axenta',
      name: data.name || '',
      description: data.description || '',
      category: data.category,
      is_system: data.is_system || false,
      is_active: data.is_active !== undefined ? data.is_active : true,
      usage_count: data.usage_count || 0,
      created_at: data.created_at ? new Date(data.created_at) : new Date(),
      updated_at: data.updated_at ? new Date(data.updated_at) : new Date(),
      role_id: data.role_id?.toString() || '',
      permissions: data.permissions || [],
      default_settings: data.settings ? (typeof data.settings === 'string' ? JSON.parse(data.settings) : data.settings) : {},
    };
  }

  // Маппинг шаблона объекта из формата бэкенда в формат фронтенда
  private mapObjectTemplateFromBackend(data: any): ObjectTemplate {
    return {
      id: data.id?.toString() || '',
      type: 'object',
      system: data.system || 'axenta',
      name: data.name || '',
      description: data.description || '',
      category: data.category,
      is_system: data.is_system || false,
      is_active: data.is_active !== undefined ? data.is_active : true,
      usage_count: data.usage_count || 0,
      created_at: data.created_at ? new Date(data.created_at) : new Date(),
      updated_at: data.updated_at ? new Date(data.updated_at) : new Date(),
      fields: data.fields || [],
      default_values: data.default_settings ? (typeof data.default_settings === 'string' ? JSON.parse(data.default_settings) : data.default_settings) : {},
    };
  }

  async getTemplate(
    id: string
  ): Promise<ObjectTemplate | UserTemplate | NotificationTemplate | ReportTemplate> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const allTemplates = [
      ...demoObjectTemplates,
      ...demoUserTemplates,
      ...demoNotificationTemplates,
    ];
    const template = allTemplates.find((t) => t.id === id);

    if (!template) {
      throw new Error("Шаблон не найден");
    }

    return template;
  }

  async deleteTemplate(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const template = [
      ...demoObjectTemplates,
      ...demoUserTemplates,
      ...demoNotificationTemplates,
    ].find((t) => t.id === id);

    if (!template) {
      throw new Error("Шаблон не найден");
    }

    if (template.is_system) {
      throw new Error("Системные шаблоны нельзя удалять");
    }

    // В реальном приложении здесь был бы API вызов
    console.log(`Шаблон ${id} удален`);
  }

  async createTemplate(templateData: any): Promise<{ status: string; data?: any; error?: string }> {
    try {
      const headers = createHeaders();
      let url = '';
      let body: any = {};

      // Определяем URL и формат тела запроса в зависимости от типа шаблона
      if (templateData.type === 'report') {
        url = `${API_BASE_URL}/api/reports/templates`;
        // Для отчетов Axenta сохраняем content и settings в config
        const config: any = {};
        if (templateData.content) {
          config.content = templateData.content;
        }
        if (templateData.settings) {
          config.settings = templateData.settings;
        }

        body = {
          name: templateData.name,
          description: templateData.description || '',
          type: templateData.report_type || 'objects', // Тип отчета для бэкенда (должен быть одним из: objects, users, billing, installations, warehouse, contracts, general)
          system: templateData.system || 'axenta', // Система шаблона
          config: config,
          sql_query: templateData.sql_query || '',
          parameters: templateData.parameters || {},
          headers: templateData.headers || [],
          formatting: templateData.formatting || {},
          is_public: templateData.is_public || false,
        };
      } else if (templateData.type === 'user') {
        url = `${API_BASE_URL}/api/user-templates`;
        body = {
          name: templateData.name,
          description: templateData.description || '',
          role_id: parseInt(templateData.role_id) || 1,
          system: templateData.system || 'axenta', // Система шаблона
          settings: JSON.stringify(templateData.default_settings || {}),
          is_active: templateData.is_active !== undefined ? templateData.is_active : true,
        };
      } else if (templateData.type === 'object') {
        url = `${API_BASE_URL}/api/object-templates`;
        body = {
          name: templateData.name,
          description: templateData.description || '',
          category: templateData.category || '',
          system: templateData.system || 'axenta', // Система шаблона
          config: JSON.stringify(templateData.config || {}),
          default_settings: JSON.stringify(templateData.default_values || {}),
          is_active: templateData.is_active !== undefined ? templateData.is_active : true,
        };
      } else {
        return { status: 'error', error: 'Неподдерживаемый тип шаблона' };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Ошибка создания шаблона: ${response.statusText}`;
        console.error('Детали ошибки создания шаблона:', errorData);
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Преобразуем ответ в формат фронтенда
      let mappedTemplate: any;
      if (templateData.type === 'report') {
        mappedTemplate = this.mapReportTemplateFromBackend(data);
      } else if (templateData.type === 'user') {
        mappedTemplate = this.mapUserTemplateFromBackend(data.data || data);
      } else if (templateData.type === 'object') {
        mappedTemplate = this.mapObjectTemplateFromBackend(data.data || data);
      }

      return { status: 'success', data: mappedTemplate };
    } catch (error) {
      console.error('Ошибка создания шаблона:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Ошибка создания шаблона'
      };
    }
  }

  async updateTemplate(id: string, templateData: any): Promise<{ status: string; data?: any; error?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const template = [
        ...demoObjectTemplates,
        ...demoUserTemplates,
        ...demoNotificationTemplates,
      ].find((t) => t.id === id);

      if (!template) {
        return { status: 'error', error: 'Шаблон не найден' };
      }

      if (template.is_system) {
        return { status: 'error', error: 'Системные шаблоны нельзя изменять' };
      }

      // В реальном приложении здесь был бы API вызов
      const updatedTemplate = {
        ...template,
        ...templateData,
        updated_at: new Date(),
      };

      console.log('Обновлен шаблон:', updatedTemplate);
      return { status: 'success', data: updatedTemplate };
    } catch (error) {
      console.error('Ошибка обновления шаблона:', error);
      return { status: 'error', error: 'Ошибка обновления шаблона' };
    }
  }

  // === СИСТЕМНЫЕ НАСТРОЙКИ ===

  async getSystemSettings(): Promise<SystemSettings> {
    const companyId = this.getCompanyId();
    if (!companyId) {
      throw new Error('Company ID not found');
    }

    try {
      const response = await this.apiClient.get(`/auth/system/settings`, {
        params: { company_id: companyId }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error loading system settings:', error);
      // Возвращаем демо данные в случае ошибки
      return demoSystemSettings;
    }
  }

  async updateSystemSettings(
    data: Partial<SystemSettingsForm>
  ): Promise<SystemSettings> {
    const companyId = this.getCompanyId();
    if (!companyId) {
      throw new Error('Company ID not found');
    }

    try {
      const response = await this.apiClient.put(`/auth/system/settings`, data, {
        params: { company_id: companyId }
      });

      console.log('✅ Системные настройки обновлены:', response.data.data);

      // Если обновлены настройки НДС, они автоматически синхронизированы с billing_settings на бэкенде
      if (data.vat_rate_preset !== undefined || data.vat_rate_custom !== undefined) {
        console.log('✅ Настройки НДС синхронизированы с биллингом');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  // === МОНИТОРИНГ ИНТЕГРАЦИЙ ===

  async getIntegrationStatus(): Promise<IntegrationStatusResponse> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    return {
      statuses: demoConnectionStatuses,
      stats: demoIntegrationStats,
    };
  }

  async getIntegrationLogs(
    integrationId?: string,
    limit = 50
  ): Promise<IntegrationLog[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    let logs = demoIntegrationLogs;

    if (integrationId) {
      logs = logs.filter((log) => log.integration_id === integrationId);
    }

    return logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async clearIntegrationLogs(integrationId?: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (integrationId) {
      // Удаляем логи конкретной интеграции
      const index = demoIntegrationLogs.findIndex(
        (log) => log.integration_id === integrationId
      );
      if (index !== -1) {
        demoIntegrationLogs.splice(index, 1);
      }
    } else {
      // Очищаем все логи
      demoIntegrationLogs.length = 0;
    }

    console.log("Логи интеграций очищены");
  }

  // === ЭКСПОРТ/ИМПОРТ НАСТРОЕК ===

  async exportSettings(): Promise<Blob> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const settings = {
      integrations: demoIntegrations,
      notification_channels: demoNotificationChannels,
      templates: [
        ...demoObjectTemplates,
        ...demoUserTemplates,
        ...demoNotificationTemplates,
      ],
      system_settings: demoSystemSettings,
      exported_at: new Date().toISOString(),
    };

    const json = JSON.stringify(settings, null, 2);
    return new Blob([json], { type: "application/json" });
  }

  async importSettings(
    file: File
  ): Promise<{ success: boolean; message: string; imported_count: number }> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Валидация структуры файла
      if (!data.integrations || !data.system_settings) {
        throw new Error("Неверная структура файла настроек");
      }

      // В реальном приложении здесь была бы валидация и импорт данных
      const importedCount =
        (data.integrations?.length || 0) +
        (data.notification_channels?.length || 0) +
        (data.templates?.length || 0) +
        1; // system_settings

      return {
        success: true,
        message: "Настройки успешно импортированы",
        imported_count: importedCount,
      };
    } catch (error) {
      return {
        success: false,
        message: `Ошибка импорта: ${error instanceof Error ? error.message : "Неизвестная ошибка"
          }`,
        imported_count: 0,
      };
    }
  }

  // ===== Общий API для интеграций =====

  async getIntegrationsList(): Promise<{ type: string; configured: boolean; is_active: boolean }[]> {
    return fetchIntegrationsList();
  }

  // === АКСЕНТА CLOUD ИНТЕГРАЦИЯ === (реализация в settings/axenta.ts)

  async getAxentaIntegrationConfig(skipIfNotConfigured = false) { return axenta.getAxentaIntegrationConfig(skipIfNotConfigured); }
  async setupAxentaIntegration(settings: any) { return axenta.setupAxentaIntegration(settings); }
  async updateAxentaIntegration(settings: any) { return axenta.updateAxentaIntegration(settings); }
  async checkAxentaIntegrationStatus() { return axenta.checkAxentaIntegrationStatus(); }
  async testAxentaConnection(settings: AxentaIntegrationSettings) { return axenta.testAxentaConnection(settings); }
  async syncAxentaObjects() { return axenta.syncAxentaObjects(); }
  async getAxentaIntegrationStatus() { return axenta.getAxentaIntegrationStatus(); }
  async deleteAxentaIntegration() { return axenta.deleteAxentaIntegration(); }

  // === NOVACONNECT ИНТЕГРАЦИЯ === (реализация в settings/novaconnect.ts)

  async setupNovaConnectIntegration(settings: any) { return novaconnect.setupNovaConnectIntegration(settings); }
  async updateNovaConnectIntegration(settings: any) { return novaconnect.updateNovaConnectIntegration(settings); }
  async getNovaConnectConfig() { return novaconnect.getNovaConnectConfig(); }
  // === WIALON ИНТЕГРАЦИЯ === (реализация в settings/wialon.ts)

  async getWialonConfig() { return wialon.getWialonConfig(); }
  async getWialonAccounts() { return wialon.getWialonAccounts(); }
  async getWialonConnectionObjectsStats(connectionId: number) { return wialon.getWialonConnectionObjectsStats(connectionId); }
  async toggleWialonAccountStatus(accountId: number, connectionId: number, enable: boolean) { return wialon.toggleWialonAccountStatus(accountId, connectionId, enable); }
  async refreshWialonAccount(connectionId: number, userId: number) { return wialon.refreshWialonAccount(connectionId, userId); }
  async getWialonBillingPlans(connectionId: number, forceRefresh = false) { return wialon.getWialonBillingPlans(connectionId, forceRefresh); }
  async getWialonConnections() { return wialon.getWialonConnections(); }
  async createWialonAccount(connectionId: number, payload: { name: string; username: string; password: string; email: string; type: 'client' | 'partner'; billingPlan?: string }) { return wialon.createWialonAccount(connectionId, payload); }
  async createWialonUser(connectionId: number, payload: { username: string; password: string; email?: string; creatorId?: number }) { return wialon.createWialonUser(connectionId, payload); }
  async loginToWialonMonitoring(connectionId: number, userName?: string, accountId?: number, userId?: number) { return wialon.loginToWialonMonitoring(connectionId, userName, accountId, userId); }
  async loginToWialonCms(connectionId: number, userName?: string, accountId?: number, userId?: number) { return wialon.loginToWialonCms(connectionId, userName, accountId, userId); }
  async deleteWialonAccount(userId: number, connectionId: number, reasonKey?: string) { return wialon.deleteWialonAccount(userId, connectionId, reasonKey); }
  async getWialonUnits() { return wialon.getWialonUnits(); }
  async setupWialonIntegration(settings: any) { return wialon.setupWialonIntegration(settings); }
  async updateWialonIntegration(settings: any) { return wialon.updateWialonIntegration(settings); }

  // === TELEGRAM/MAX/EMAIL ИНТЕГРАЦИИ === (реализация в settings/telegram.ts, settings/max.ts, settings/email.ts)

  async setupTelegramIntegration(settings: any) { return telegram.setupTelegramIntegration(settings); }
  async updateTelegramIntegration(settings: any) { return telegram.updateTelegramIntegration(settings); }
  async getTelegramConfig(skipIfNotConfigured = false) { return telegram.getTelegramConfig(skipIfNotConfigured); }
  async testTelegramConnection() { return telegram.testTelegramConnection(); }

  async setupMaxIntegration(settings: any) { return max.setupMaxIntegration(settings); }
  async updateMaxIntegration(settings: any) { return max.updateMaxIntegration(settings); }
  async getMaxConfig(skipIfNotConfigured = false) { return max.getMaxConfig(skipIfNotConfigured); }
  async testMaxConnection() { return max.testMaxConnection(); }

  async setupEmailIntegration(settings: any) { return email.setupEmailIntegration(settings); }
  async updateEmailIntegration(settings: any) { return email.updateEmailIntegration(settings); }
  async getEmailConfig() { return email.getEmailConfig(); }
  async testEmailConnection() { return email.testEmailConnection(); }
}

export const settingsService = new SettingsService();
export default settingsService;
