<template>
  <div class="settings-page">
    <!-- Заголовок страницы -->
    <div class="page-header mb-6">
      <div class="d-flex align-center justify-space-between">
        <div>
          <h1 class="text-h4 font-weight-bold mb-2">Настройки системы</h1>
          <p class="text-body-1 text-medium-emphasis">
            Управление интеграциями, уведомлениями, шаблонами и системными параметрами
          </p>
        </div>
        
        <!-- Кнопки действий -->
        <div class="d-flex gap-2">
          <v-btn
            variant="outlined"
            prepend-icon="mdi-download"
            @click="exportSettings"
            :loading="exporting"
          >
            Экспорт
          </v-btn>
          
          <v-btn
            variant="outlined"
            prepend-icon="mdi-upload"
            @click="$refs.importInput?.click()"
            :loading="importing"
          >
            Импорт
          </v-btn>
          
          <v-btn
            color="primary"
            prepend-icon="mdi-content-save"
            @click="saveAllSettings"
            :loading="saving"
          >
            Сохранить всё
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Скрытый input для импорта файлов -->
    <input
      ref="importInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="importSettings"
    />

    <!-- Основной контент -->
    <v-row>
      <!-- Боковое меню -->
      <v-col cols="12" md="3">
        <v-card class="settings-navigation" elevation="2">
          <v-list nav>
            <v-list-item
              v-for="tab in tabs"
              :key="tab.value"
              :value="tab.value"
              :active="activeTab === tab.value"
              @click="activeTab = tab.value"
              class="settings-nav-item"
            >
              <template #prepend>
                <v-icon :icon="tab.icon" />
              </template>
              <v-list-item-title>{{ tab.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ tab.subtitle }}</v-list-item-subtitle>
              
              <template #append v-if="tab.badge">
                <v-badge
                  :content="tab.badge"
                  :color="tab.badgeColor || 'primary'"
                  inline
                />
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Основной контент -->
      <v-col cols="12" md="9">
        <v-card elevation="2" class="settings-content">
          <!-- Заголовок вкладки -->
          <v-card-title class="d-flex align-center gap-3 pb-4">
            <v-icon :icon="currentTab?.icon" size="24" />
            <div>
              <div class="text-h6">{{ currentTab?.title }}</div>
              <div class="text-caption text-medium-emphasis">{{ currentTab?.subtitle }}</div>
            </div>
          </v-card-title>

          <v-divider />

          <!-- Контент вкладок -->
          <v-card-text class="pa-6">
            <!-- Интеграции -->
            <div v-if="activeTab === 'integrations'">
              <IntegrationsSettings />
            </div>

            <!-- Уведомления -->
            <div v-if="activeTab === 'notifications'">
              <NotificationsSettings />
            </div>

            <!-- Шаблоны -->
            <div v-if="activeTab === 'templates'">
              <TemplatesSettings />
            </div>

            <!-- Мониторинг -->
            <div v-if="activeTab === 'monitoring'">
              <MonitoringSettings />
            </div>

            <!-- Системные настройки -->
            <div v-if="activeTab === 'system'">
              <SystemSettingsForm />
            </div>

            <!-- Безопасность -->
            <div v-if="activeTab === 'security'">
              <SecuritySettings />
            </div>

            <!-- Производительность -->
            <div v-if="activeTab === 'performance'">
              <PerformanceSettings />
            </div>

            <!-- Документация -->
            <div v-if="activeTab === 'documentation'">
              <div class="documentation-section">
                <!-- Статистика документации -->
                <div class="stats-cards mb-6">
                  <v-card class="stat-card" elevation="1">
                    <v-card-text>
                      <div class="stat-value">{{ documentationStats.apiEndpoints.documented }}/{{ documentationStats.apiEndpoints.total }}</div>
                      <div class="stat-label">API Endpoints</div>
                    </v-card-text>
                  </v-card>

                  <v-card class="stat-card" elevation="1">
                    <v-card-text>
                      <div class="stat-value">{{ documentationStats.userDocs.published }}</div>
                      <div class="stat-label">Документы</div>
                    </v-card-text>
                  </v-card>

                  <v-card class="stat-card" elevation="1">
                    <v-card-text>
                      <div class="stat-value">{{ documentationStats.deployments.successful }}/{{ documentationStats.deployments.total }}</div>
                      <div class="stat-label">Развертывания</div>
                    </v-card-text>
                  </v-card>

                  <v-card class="stat-card" elevation="1">
                    <v-card-text>
                      <div class="stat-value">{{ documentationStats.environments.healthy }}/{{ documentationStats.environments.total }}</div>
                      <div class="stat-label">Окружения</div>
                    </v-card-text>
                  </v-card>
                </div>

                <!-- Вкладки документации -->
                <v-card elevation="1">
                  <v-tabs v-model="activeDocumentationTab" class="tabs-header">
                    <v-tab value="api-docs">
                      <v-icon icon="mdi-api" class="mr-2" />
                      API Документация
                    </v-tab>
                    <v-tab value="user-docs">
                      <v-icon icon="mdi-book-open-page-variant" class="mr-2" />
                      Пользовательские документы
                    </v-tab>
                    <v-tab value="deployment">
                      <v-icon icon="mdi-rocket-launch" class="mr-2" />
                      Развертывание
                    </v-tab>
                    <v-tab value="cicd">
                      <v-icon icon="mdi-source-branch" class="mr-2" />
                      CI/CD Pipelines
                    </v-tab>
                    <v-tab value="health">
                      <v-icon icon="mdi-heart-pulse" class="mr-2" />
                      Мониторинг
                    </v-tab>
                  </v-tabs>

                  <v-card-text class="tab-content">
                    <!-- API Документация -->
                    <div v-if="activeDocumentationTab === 'api-docs'" class="tab-panel">
                      <ApiDocumentationTab :documentation="apiDocumentation" :endpoints="apiEndpoints"
                        @generate-swagger="handleGenerateSwagger" @refresh="loadApiDocumentation" />
                    </div>

                    <!-- Пользовательские документы -->
                    <div v-if="activeDocumentationTab === 'user-docs'" class="tab-panel">
                      <UserDocumentationTab :documents="userDocuments" @create="handleCreateUserDoc" @update="handleUpdateUserDoc"
                        @delete="handleDeleteUserDoc" @refresh="loadUserDocumentation" />
                    </div>

                    <!-- Развертывание -->
                    <div v-if="activeDocumentationTab === 'deployment'" class="tab-panel">
                      <DeploymentTab :environments="deploymentEnvironments" :history="deploymentHistory"
                        :scripts="deploymentScripts" @deploy="handleDeploy" @execute-script="handleExecuteScript"
                        @refresh="loadDeploymentData" />
                    </div>

                    <!-- CI/CD Pipelines -->
                    <div v-if="activeDocumentationTab === 'cicd'" class="tab-panel">
                      <CicdTab :pipelines="cicdPipelines" @run-pipeline="handleRunPipeline" @refresh="loadCicdData" />
                    </div>

                    <!-- Мониторинг -->
                    <div v-if="activeDocumentationTab === 'health'" class="tab-panel">
                      <SystemHealthTab :health="systemHealth" @refresh="loadSystemHealth" />
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Диалог подтверждения -->
    <v-dialog v-model="confirmDialog.show" max-width="400">
      <v-card>
        <v-card-title>{{ confirmDialog.title }}</v-card-title>
        <v-card-text>{{ confirmDialog.text }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="confirmDialog.show = false">Отмена</v-btn>
          <v-btn
            color="primary"
            @click="confirmDialog.action(); confirmDialog.show = false"
          >
            Подтвердить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar для уведомлений -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top right"
    >
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { settingsService } from '@/services/settingsService';
import { computed, onMounted, ref, watch } from 'vue';

// Импорты компонентов (будут созданы далее)
import IntegrationsSettings from '@/components/Settings/IntegrationsSettings.vue';
import MonitoringSettings from '@/components/Settings/MonitoringSettings.vue';
import NotificationsSettings from '@/components/Settings/NotificationsSettings.vue';
import PerformanceSettings from '@/components/Settings/PerformanceSettings.vue';
import SecuritySettings from '@/components/Settings/SecuritySettings.vue';
import SystemSettingsForm from '@/components/Settings/SystemSettingsForm.vue';
import TemplatesSettings from '@/components/Settings/TemplatesSettings.vue';

// Импорт компонентов документации
import ApiDocumentationTab from '@/components/Documentation/ApiDocumentationTab.vue';
import CicdTab from '@/components/Documentation/CicdTab.vue';
import DeploymentTab from '@/components/Documentation/DeploymentTab.vue';
import SystemHealthTab from '@/components/Documentation/SystemHealthTab.vue';
import UserDocumentationTab from '@/components/Documentation/UserDocumentationTab.vue';

// Импорт сервиса документации
import { documentationService } from '@/services/documentationService';
import type {
    ApiDocumentation,
    ApiEndpoint,
    CicdPipeline,
    DeploymentEnvironment,
    DeploymentHistory,
    DeploymentScript,
    DocumentationStats,
    SystemHealth,
    UserDocumentation
} from '@/types/documentation';

// Реактивные данные
const activeTab = ref('integrations');
const loading = ref(false);
const saving = ref(false);
const exporting = ref(false);
const importing = ref(false);

const confirmDialog = ref({
  show: false,
  title: '',
  text: '',
  action: () => {}
});

const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000
});

// Статистика для бейджей (демо данные)
const stats = ref({
  integrations: {
    total: 5,
    active: 3,
    errors: 2
  },
  notifications: {
    total: 3,
    enabled: 2
  },
  templates: {
    total: 6,
    system: 4,
    custom: 2
  },
  documentation: {
    apiEndpoints: { total: 0, documented: 0 },
    userDocs: { total: 0, published: 0 },
    deployments: { total: 0, successful: 0 }
  }
});

// Данные для документации
const documentationStats = ref<DocumentationStats>({
  apiEndpoints: { total: 0, documented: 0, deprecated: 0 },
  userDocs: { total: 0, published: 0, drafts: 0 },
  deployments: { total: 0, successful: 0, failed: 0, avgDuration: 0 },
  environments: { total: 0, active: 0, healthy: 0 }
});

const apiDocumentation = ref<ApiDocumentation[]>([]);
const apiEndpoints = ref<ApiEndpoint[]>([]);
const userDocuments = ref<UserDocumentation[]>([]);
const deploymentEnvironments = ref<DeploymentEnvironment[]>([]);
const deploymentHistory = ref<DeploymentHistory[]>([]);
const deploymentScripts = ref<DeploymentScript[]>([]);
const cicdPipelines = ref<CicdPipeline[]>([]);
const systemHealth = ref<SystemHealth | null>(null);
const activeDocumentationTab = ref('api-docs');

// Вкладки настроек
const tabs = computed(() => [
  {
    value: 'integrations',
    title: 'Интеграции',
    subtitle: 'Внешние системы',
    icon: 'mdi-connection',
    badge: stats.value.integrations.errors > 0 ? stats.value.integrations.errors : undefined,
    badgeColor: stats.value.integrations.errors > 0 ? 'error' : 'primary'
  },
  {
    value: 'notifications',
    title: 'Уведомления',
    subtitle: 'Каналы связи',
    icon: 'mdi-bell-ring',
    badge: stats.value.notifications.enabled
  },
  {
    value: 'templates',
    title: 'Шаблоны',
    subtitle: 'Объекты и пользователи',
    icon: 'mdi-file-document-multiple',
    badge: stats.value.templates.total
  },
  {
    value: 'monitoring',
    title: 'Мониторинг',
    subtitle: 'Статус интеграций',
    icon: 'mdi-monitor-dashboard'
  },
  {
    value: 'system',
    title: 'Система',
    subtitle: 'Общие параметры',
    icon: 'mdi-cog'
  },
  {
    value: 'security',
    title: 'Безопасность',
    subtitle: 'Доступ и права',
    icon: 'mdi-shield-check'
  },
  {
    value: 'performance',
    title: 'Производительность',
    subtitle: 'Оптимизация и безопасность',
    icon: 'mdi-speedometer'
  },
  {
    value: 'documentation',
    title: 'Документация',
    subtitle: 'API, руководства, развертывание',
    icon: 'mdi-book-open-variant',
    badge: stats.value.documentation.apiEndpoints.documented + stats.value.documentation.userDocs.published
  }
]);

// Текущая вкладка
const currentTab = computed(() => {
  return tabs.value.find(tab => tab.value === activeTab.value);
});

// Методы
const showSnackbar = (text: string, color = 'info', timeout = 5000) => {
  snackbar.value = { show: true, text, color, timeout };
};

const showConfirm = (title: string, text: string, action: () => void) => {
  confirmDialog.value = { show: true, title, text, action };
};

const saveAllSettings = async () => {
  saving.value = true;
  try {
    // Имитация сохранения всех настроек
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    showSnackbar('Все настройки успешно сохранены', 'success');
  } catch (error) {
    console.error('Ошибка сохранения настроек:', error);
    showSnackbar('Ошибка сохранения настроек', 'error');
  } finally {
    saving.value = false;
  }
};

const exportSettings = async () => {
  exporting.value = true;
  try {
    const blob = await withTimeout(settingsService.exportSettings(), 5000);
    
    // Создаем ссылку для скачивания
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settings-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSnackbar('Настройки экспортированы', 'success');
  } catch (error) {
    console.error('Ошибка экспорта:', error);
    showSnackbar('Ошибка экспорта настроек', 'error');
  } finally {
    exporting.value = false;
  }
};

const importSettings = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  importing.value = true;
  try {
    const result = await withTimeout(settingsService.importSettings(file), 10000);
    
    if (result.success) {
      showSnackbar(`Импортировано ${result.imported_count} настроек`, 'success');
      // Перезагружаем статистику с таймаутом
      await withTimeout(loadStats(), 5000);
    } else {
      showSnackbar(result.message, 'error');
    }
  } catch (error) {
    console.error('Ошибка импорта:', error);
    showSnackbar('Ошибка импорта настроек', 'error');
  } finally {
    importing.value = false;
    // Очищаем input
    target.value = '';
  }
};

// Утилита для создания промиса с таймаутом
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

const loadStats = async () => {
  try {
    // Загружаем статистику для бейджей с таймаутом
    const [integrations, notifications, templates] = await Promise.all([
      withTimeout(settingsService.getIntegrations(), 3000),
      withTimeout(settingsService.getNotificationChannels(), 3000),
      withTimeout(settingsService.getTemplates(), 3000)
    ]);
    
    stats.value = {
      integrations: {
        total: integrations.total,
        active: integrations.integrations.filter(i => i.status === 'active').length,
        errors: integrations.integrations.filter(i => i.status === 'error').length
      },
      notifications: {
        total: notifications.total,
        enabled: notifications.channels.filter(c => c.enabled).length
      },
      templates: {
        total: templates.total,
        system: templates.templates.filter(t => t.is_system).length,
        custom: templates.templates.filter(t => !t.is_system).length
      },
      documentation: {
        apiEndpoints: documentationStats.value.apiEndpoints,
        userDocs: documentationStats.value.userDocs,
        deployments: documentationStats.value.deployments
      }
    };
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
    // Устанавливаем значения по умолчанию при ошибке или таймауте
    stats.value = {
      integrations: { total: 0, active: 0, errors: 0 },
      notifications: { total: 0, enabled: 0 },
      templates: { total: 0, system: 0, custom: 0 },
      documentation: {
        apiEndpoints: { total: 0, documented: 0 },
        userDocs: { total: 0, published: 0 },
        deployments: { total: 0, successful: 0 }
      }
    };
  }
};

// Методы для загрузки данных документации
const loadDocumentationStats = async () => {
  try {
    documentationStats.value = await documentationService.getDocumentationStats();
  } catch (error) {
    console.error('Ошибка загрузки статистики документации:', error);
  }
};

const loadApiDocumentation = async () => {
  try {
    apiDocumentation.value = await documentationService.getApiDocumentation();
    apiEndpoints.value = await documentationService.getApiEndpoints();
  } catch (error) {
    console.error('Ошибка загрузки API документации:', error);
  }
};

const loadUserDocumentation = async () => {
  try {
    userDocuments.value = await documentationService.getUserDocumentation();
  } catch (error) {
    console.error('Ошибка загрузки пользовательской документации:', error);
  }
};

const loadDeploymentData = async () => {
  try {
    deploymentEnvironments.value = await documentationService.getDeploymentEnvironments();
    deploymentHistory.value = await documentationService.getDeploymentHistory();
    deploymentScripts.value = await documentationService.getDeploymentScripts();
  } catch (error) {
    console.error('Ошибка загрузки данных развертывания:', error);
  }
};

const loadCicdData = async () => {
  try {
    cicdPipelines.value = await documentationService.getCicdPipelines();
  } catch (error) {
    console.error('Ошибка загрузки CI/CD данных:', error);
  }
};

const loadSystemHealth = async () => {
  try {
    systemHealth.value = await documentationService.getSystemHealth();
  } catch (error) {
    console.error('Ошибка загрузки данных мониторинга:', error);
  }
};

// Обработчики событий документации
const handleGenerateSwagger = async (docId: string) => {
  try {
    const swagger = await documentationService.generateSwaggerDoc(docId);
    console.log('Swagger документация сгенерирована:', swagger);
    showSnackbar('Swagger документация сгенерирована', 'success');
  } catch (error) {
    console.error('Ошибка генерации Swagger:', error);
    showSnackbar('Ошибка генерации Swagger документации', 'error');
  }
};

const handleCreateUserDoc = async (doc: Partial<UserDocumentation>) => {
  try {
    const newDoc = await documentationService.createUserDoc(doc);
    userDocuments.value.push(newDoc);
    await loadDocumentationStats();
    showSnackbar('Документ создан', 'success');
  } catch (error) {
    console.error('Ошибка создания документа:', error);
    showSnackbar('Ошибка создания документа', 'error');
  }
};

const handleUpdateUserDoc = async (id: string, updates: Partial<UserDocumentation>) => {
  try {
    const updatedDoc = await documentationService.updateUserDoc(id, updates);
    const index = userDocuments.value.findIndex(doc => doc.id === id);
    if (index !== -1) {
      userDocuments.value[index] = updatedDoc;
    }
    showSnackbar('Документ обновлен', 'success');
  } catch (error) {
    console.error('Ошибка обновления документа:', error);
    showSnackbar('Ошибка обновления документа', 'error');
  }
};

const handleDeleteUserDoc = async (id: string) => {
  try {
    await documentationService.deleteUserDoc(id);
    userDocuments.value = userDocuments.value.filter(doc => doc.id !== id);
    await loadDocumentationStats();
    showSnackbar('Документ удален', 'success');
  } catch (error) {
    console.error('Ошибка удаления документа:', error);
    showSnackbar('Ошибка удаления документа', 'error');
  }
};

const handleDeploy = async (environmentId: string, version: string) => {
  try {
    const deployment = await documentationService.deployToEnvironment(environmentId, version);
    deploymentHistory.value.unshift(deployment);
    await loadDeploymentData();
    await loadDocumentationStats();
    showSnackbar('Развертывание запущено', 'success');
  } catch (error) {
    console.error('Ошибка развертывания:', error);
    showSnackbar('Ошибка развертывания', 'error');
  }
};

const handleExecuteScript = async (scriptId: string) => {
  try {
    const result = await documentationService.executeScript(scriptId);
    console.log('Скрипт выполнен:', result);
    showSnackbar('Скрипт выполнен', 'success');
  } catch (error) {
    console.error('Ошибка выполнения скрипта:', error);
    showSnackbar('Ошибка выполнения скрипта', 'error');
  }
};

const handleRunPipeline = async (pipelineId: string) => {
  try {
    const pipeline = await documentationService.runPipeline(pipelineId);
    const index = cicdPipelines.value.findIndex(p => p.id === pipelineId);
    if (index !== -1) {
      cicdPipelines.value[index] = pipeline;
    }
    showSnackbar('Pipeline запущен', 'success');
  } catch (error) {
    console.error('Ошибка запуска pipeline:', error);
    showSnackbar('Ошибка запуска pipeline', 'error');
  }
};

// Lifecycle
onMounted(() => {
  loadStats();
  loadDocumentationStats();
});

// Загружаем данные документации при переключении на вкладку
watch(activeTab, (newTab) => {
  if (newTab === 'documentation') {
    loadApiDocumentation();
    loadUserDocumentation();
    loadDeploymentData();
    loadCicdData();
    loadSystemHealth();
  }
});
</script>

<style scoped>
.settings-page {
  padding: 0;
}

.page-header {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.1), rgba(var(--v-theme-secondary), 0.05));
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.settings-navigation {
  position: sticky;
  top: 20px;
  border-radius: 12px;
}

.settings-nav-item {
  margin: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.settings-nav-item:hover {
  background: rgba(var(--v-theme-primary), 0.08);
}

.settings-nav-item.v-list-item--active {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.15), rgba(var(--v-theme-primary), 0.05));
  color: rgb(var(--v-theme-primary));
}

.settings-content {
  border-radius: 12px;
  min-height: 600px;
}

.settings-content .v-card-title {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 12px 12px 0 0;
  padding: 20px 24px;
}

/* Темная тема */
[data-theme="dark"] .page-header {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.2), rgba(var(--v-theme-secondary), 0.1));
}

[data-theme="dark"] .settings-nav-item:hover {
  background: rgba(var(--v-theme-primary), 0.12);
}

[data-theme="dark"] .settings-nav-item.v-list-item--active {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.25), rgba(var(--v-theme-primary), 0.1));
}

/* Анимации */
.settings-content {
  transition: all 0.3s ease;
}

.v-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* Стили для секции документации */
.documentation-section {
  width: 100%;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
  background: linear-gradient(135deg, var(--v-theme-surface) 0%, var(--v-theme-surface-variant) 100%);
  border-radius: 12px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--v-theme-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--v-theme-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tabs-header {
  background: var(--v-theme-surface-variant);
  border-bottom: 1px solid var(--v-theme-outline-variant);
}

.tab-content {
  padding: 24px;
  min-height: 500px;
}

.tab-panel {
  height: 100%;
}

/* Темная тема для документации */
.v-theme--dark .stat-card {
  background: linear-gradient(135deg, var(--v-theme-surface-bright) 0%, var(--v-theme-surface-variant) 100%);
}

/* Responsive */
@media (max-width: 960px) {
  .settings-navigation {
    position: static;
    margin-bottom: 20px;
  }
  
  .page-header {
    padding: 16px;
  }
  
  .page-header .d-flex {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .tab-content {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>