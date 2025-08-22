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
import { computed, onMounted, ref } from 'vue';

// Импорты компонентов (будут созданы далее)
import IntegrationsSettings from '@/components/Settings/IntegrationsSettings.vue';
import MonitoringSettings from '@/components/Settings/MonitoringSettings.vue';
import NotificationsSettings from '@/components/Settings/NotificationsSettings.vue';
import SecuritySettings from '@/components/Settings/SecuritySettings.vue';
import SystemSettingsForm from '@/components/Settings/SystemSettingsForm.vue';
import TemplatesSettings from '@/components/Settings/TemplatesSettings.vue';

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
  }
});

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
    const blob = await settingsService.exportSettings();
    
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
    const result = await settingsService.importSettings(file);
    
    if (result.success) {
      showSnackbar(`Импортировано ${result.imported_count} настроек`, 'success');
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

const loadStats = async () => {
  try {
    // Загружаем статистику для бейджей
    const [integrations, notifications, templates] = await Promise.all([
      settingsService.getIntegrations(),
      settingsService.getNotificationChannels(),
      settingsService.getTemplates()
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
      }
    };
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
  }
};

// Lifecycle
onMounted(() => {
  loadStats();
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
}
</style>