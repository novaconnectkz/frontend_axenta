<template>
  <div class="integrations-settings">
    <!-- Заголовок и статистика -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h3 class="text-h6 font-weight-bold mb-1">Внешние интеграции</h3>
        <p class="text-body-2 text-medium-emphasis">
          Управление подключениями к внешним системам и сервисам
        </p>
      </div>
      
      <!-- Статистика -->
      <div class="d-flex gap-4">
        <v-chip
          :color="stats.active > 0 ? 'success' : 'grey'"
          variant="elevated"
          size="small"
        >
          <v-icon start>mdi-check-circle</v-icon>
          Активных: {{ stats.active }}
        </v-chip>
        <v-chip
          :color="stats.errors > 0 ? 'error' : 'grey'"
          variant="elevated"
          size="small"
        >
          <v-icon start>mdi-alert-circle</v-icon>
          Ошибок: {{ stats.errors }}
        </v-chip>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-4 text-body-2">Загрузка интеграций...</p>
    </div>

    <!-- Список интеграций -->
    <div v-else>
      <v-row>
        <v-col
          v-for="integration in integrations"
          :key="integration.id"
          cols="12"
          md="6"
        >
          <v-card
            class="integration-card"
            :class="{ 'integration-card--active': integration.enabled }"
            elevation="2"
          >
            <!-- Заголовок карточки -->
            <v-card-title class="d-flex align-center justify-space-between">
              <div class="d-flex align-center gap-3">
                <v-avatar
                  :color="getIntegrationColor(integration.type)"
                  size="40"
                >
                  <v-icon :icon="getIntegrationIcon(integration.type)" color="white" />
                </v-avatar>
                
                <div>
                  <div class="text-subtitle-1 font-weight-bold">
                    {{ integration.name }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ getIntegrationTypeLabel(integration.type) }}
                  </div>
                </div>
              </div>

              <!-- Статус -->
              <v-chip
                :color="getStatusColor(integration.status)"
                :variant="integration.enabled ? 'elevated' : 'outlined'"
                size="small"
              >
                <v-icon
                  start
                  :icon="getStatusIcon(integration.status)"
                  size="14"
                />
                {{ getStatusLabel(integration.status) }}
              </v-chip>
            </v-card-title>

            <!-- Описание -->
            <v-card-text class="pt-0">
              <p class="text-body-2 mb-3">{{ integration.description }}</p>

              <!-- Дополнительная информация -->
              <div class="d-flex align-center justify-space-between text-caption">
                <span v-if="integration.lastSync" class="text-medium-emphasis">
                  <v-icon size="14" class="me-1">mdi-clock</v-icon>
                  Синхронизация: {{ formatDate(integration.lastSync) }}
                </span>
                
                <span v-if="integration.lastError" class="text-error">
                  <v-icon size="14" class="me-1">mdi-alert</v-icon>
                  {{ integration.lastError }}
                </span>
              </div>
            </v-card-text>

            <!-- Действия -->
            <v-card-actions class="pt-0">
              <v-switch
                v-model="integration.enabled"
                :label="integration.enabled ? 'Включено' : 'Отключено'"
                color="primary"
                hide-details
                @change="toggleIntegration(integration)"
              />

              <v-spacer />

              <v-btn
                variant="text"
                size="small"
                @click="testConnection(integration)"
                :loading="testingConnections[integration.id]"
              >
                <v-icon start>mdi-connection</v-icon>
                Тест
              </v-btn>

              <v-btn
                variant="text"
                size="small"
                @click="editIntegration(integration)"
              >
                <v-icon start>mdi-cog</v-icon>
                Настроить
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Диалог настройки интеграции -->
    <v-dialog v-model="editDialog.show" max-width="600" scrollable>
      <v-card v-if="editDialog.integration">
        <v-card-title class="d-flex align-center gap-3">
          <v-avatar
            :color="getIntegrationColor(editDialog.integration.type)"
            size="32"
          >
            <v-icon :icon="getIntegrationIcon(editDialog.integration.type)" color="white" size="18" />
          </v-avatar>
          Настройка: {{ editDialog.integration.name }}
        </v-card-title>

        <v-divider />

        <v-card-text class="py-4">
          <!-- Общие настройки -->
          <v-text-field
            v-model="editDialog.form.name"
            label="Название"
            variant="outlined"
            class="mb-3"
          />
          
          <v-textarea
            v-model="editDialog.form.description"
            label="Описание"
            variant="outlined"
            rows="2"
            class="mb-4"
          />

          <!-- Специфичные настройки для каждого типа интеграции -->
          <div v-if="editDialog.integration.type === 'axenta'">
            <h4 class="text-subtitle-1 font-weight-bold mb-3">Настройки Axenta API</h4>
            
            <v-text-field
              v-model="editDialog.form.settings.api_url"
              label="URL API"
              variant="outlined"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.username"
              label="Имя пользователя"
              variant="outlined"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.password"
              label="Пароль"
              type="password"
              variant="outlined"
              class="mb-3"
            />
            
            <v-text-field
              v-model.number="editDialog.form.settings.sync_interval"
              label="Интервал синхронизации (минуты)"
              type="number"
              variant="outlined"
              class="mb-3"
            />
            
            <v-switch
              v-model="editDialog.form.settings.auto_sync_enabled"
              label="Автоматическая синхронизация"
              color="primary"
            />
          </div>

          <div v-if="editDialog.integration.type === 'bitrix24'">
            <h4 class="text-subtitle-1 font-weight-bold mb-3">Настройки Битрикс24</h4>
            
            <v-text-field
              v-model="editDialog.form.settings.domain"
              label="Домен Битрикс24"
              variant="outlined"
              placeholder="company.bitrix24.ru"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.client_id"
              label="Client ID"
              variant="outlined"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.client_secret"
              label="Client Secret"
              type="password"
              variant="outlined"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.webhook_url"
              label="Webhook URL"
              variant="outlined"
              class="mb-3"
            />
            
            <div class="mb-3">
              <h5 class="text-subtitle-2 mb-2">Синхронизация данных</h5>
              <v-switch
                v-model="editDialog.form.settings.sync_contacts"
                label="Синхронизировать контакты"
                color="primary"
                class="mb-1"
              />
              <v-switch
                v-model="editDialog.form.settings.sync_deals"
                label="Синхронизировать сделки"
                color="primary"
                class="mb-1"
              />
              <v-switch
                v-model="editDialog.form.settings.sync_companies"
                label="Синхронизировать компании"
                color="primary"
              />
            </div>
          </div>

          <div v-if="editDialog.integration.type === '1c'">
            <h4 class="text-subtitle-1 font-weight-bold mb-3">Настройки 1С</h4>
            
            <v-text-field
              v-model="editDialog.form.settings.server_url"
              label="URL сервера 1С"
              variant="outlined"
              placeholder="http://1c-server:8080/accounting/hs/api"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.database_name"
              label="Имя базы данных"
              variant="outlined"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.username"
              label="Имя пользователя"
              variant="outlined"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.password"
              label="Пароль"
              type="password"
              variant="outlined"
              class="mb-3"
            />
            
            <v-select
              v-model="editDialog.form.settings.export_format"
              label="Формат экспорта"
              :items="[
                { value: 'xml', title: 'XML' },
                { value: 'json', title: 'JSON' }
              ]"
              variant="outlined"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.export_schedule"
              label="Расписание экспорта (cron)"
              variant="outlined"
              placeholder="0 0 9 * * MON-FRI"
              class="mb-3"
            />
          </div>

          <div v-if="editDialog.integration.type === 'telegram'">
            <h4 class="text-subtitle-1 font-weight-bold mb-3">Настройки Telegram Bot</h4>
            
            <v-text-field
              v-model="editDialog.form.settings.bot_token"
              label="Bot Token"
              type="password"
              variant="outlined"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.chat_id"
              label="Chat ID"
              variant="outlined"
              class="mb-3"
            />
            
            <v-select
              v-model="editDialog.form.settings.parse_mode"
              label="Режим парсинга"
              :items="[
                { value: 'HTML', title: 'HTML' },
                { value: 'Markdown', title: 'Markdown' }
              ]"
              variant="outlined"
              class="mb-3"
            />
            
            <div class="mb-3">
              <h5 class="text-subtitle-2 mb-2">Тихие часы</h5>
              <v-row>
                <v-col cols="6">
                  <v-text-field
                    v-model="editDialog.form.settings.silent_hours_start"
                    label="Начало"
                    type="time"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="editDialog.form.settings.silent_hours_end"
                    label="Окончание"
                    type="time"
                    variant="outlined"
                  />
                </v-col>
              </v-row>
            </div>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn @click="editDialog.show = false">Отмена</v-btn>
          <v-btn
            color="primary"
            @click="saveIntegration"
            :loading="editDialog.saving"
          >
            Сохранить
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
import type {
    IntegrationWithSettings
} from '@/types/settings';
import { computed, onMounted, ref } from 'vue';

// Реактивные данные
const loading = ref(false);
const integrations = ref<IntegrationWithSettings[]>([]);
const testingConnections = ref<Record<string, boolean>>({});

const editDialog = ref({
  show: false,
  integration: null as IntegrationWithSettings | null,
  form: {
    name: '',
    description: '',
    settings: {} as any
  },
  saving: false
});

const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000
});

// Вычисляемые свойства
const stats = computed(() => {
  const active = integrations.value.filter(i => i.status === 'active').length;
  const errors = integrations.value.filter(i => i.status === 'error').length;
  
  return { active, errors };
});

// Методы
const showSnackbar = (text: string, color = 'info', timeout = 5000) => {
  snackbar.value = { show: true, text, color, timeout };
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

const getIntegrationIcon = (type: string) => {
  const icons = {
    axenta: 'mdi-cloud',
    bitrix24: 'mdi-briefcase',
    '1c': 'mdi-database',
    telegram: 'mdi-telegram',
    email: 'mdi-email',
    sms: 'mdi-message-text'
  };
  return icons[type as keyof typeof icons] || 'mdi-connection';
};

const getIntegrationColor = (type: string) => {
  const colors = {
    axenta: 'blue',
    bitrix24: 'orange',
    '1c': 'green',
    telegram: 'cyan',
    email: 'purple',
    sms: 'teal'
  };
  return colors[type as keyof typeof colors] || 'primary';
};

const getIntegrationTypeLabel = (type: string) => {
  const labels = {
    axenta: 'Axenta Cloud',
    bitrix24: 'Битрикс24',
    '1c': '1С:Предприятие',
    telegram: 'Telegram Bot',
    email: 'Email SMTP',
    sms: 'SMS Gateway'
  } as any;
  return labels[type] || type;
};

const getStatusColor = (status: string) => {
  const colors = {
    active: 'success',
    inactive: 'grey',
    error: 'error',
    connecting: 'warning',
    disconnected: 'error'
  } as any;
  return colors[status] || 'grey';
};

const getStatusIcon = (status: string) => {
  const icons = {
    active: 'mdi-check-circle',
    inactive: 'mdi-pause-circle',
    error: 'mdi-alert-circle',
    connecting: 'mdi-loading',
    disconnected: 'mdi-close-circle'
  } as any;
  return icons[status] || 'mdi-help-circle';
};

const getStatusLabel = (status: string) => {
  const labels = {
    active: 'Активна',
    inactive: 'Неактивна',
    error: 'Ошибка',
    connecting: 'Подключение',
    disconnected: 'Отключена'
  } as any;
  return labels[status] || status;
};

const loadIntegrations = async () => {
  loading.value = true;
  try {
    const response = await settingsService.getIntegrations();
    integrations.value = response.integrations;
  } catch (error) {
    console.error('Ошибка загрузки интеграций:', error);
    showSnackbar('Ошибка загрузки интеграций', 'error');
  } finally {
    loading.value = false;
  }
};

const toggleIntegration = async (integration: IntegrationWithSettings) => {
  try {
    await settingsService.updateIntegration(integration.id, {
      enabled: integration.enabled
    });
    
    showSnackbar(
      `Интеграция ${integration.enabled ? 'включена' : 'отключена'}`,
      'success'
    );
  } catch (error) {
    console.error('Ошибка переключения интеграции:', error);
    // Откатываем изменение
    integration.enabled = !integration.enabled;
    showSnackbar('Ошибка изменения статуса интеграции', 'error');
  }
};

const testConnection = async (integration: IntegrationWithSettings) => {
  testingConnections.value[integration.id] = true;
  
  try {
    const result = await settingsService.testIntegrationConnection(integration.id);
    
    if (result.success) {
      showSnackbar(
        `Подключение успешно (${result.response_time}мс)`,
        'success'
      );
    } else {
      showSnackbar(result.message, 'error');
    }
  } catch (error) {
    console.error('Ошибка тестирования подключения:', error);
    showSnackbar('Ошибка тестирования подключения', 'error');
  } finally {
    testingConnections.value[integration.id] = false;
  }
};

const editIntegration = (integration: IntegrationWithSettings) => {
  editDialog.value.integration = integration;
  editDialog.value.form = {
    name: integration.name,
    description: integration.description,
    settings: { ...integration.settings }
  };
  editDialog.value.show = true;
};

const saveIntegration = async () => {
  if (!editDialog.value.integration) return;
  
  editDialog.value.saving = true;
  
  try {
    const updated = await settingsService.updateIntegration(
      editDialog.value.integration.id,
      editDialog.value.form
    );
    
    // Обновляем в списке
    const index = integrations.value.findIndex(i => i.id === updated.id);
    if (index !== -1) {
      integrations.value[index] = updated;
    }
    
    editDialog.value.show = false;
    showSnackbar('Интеграция успешно обновлена', 'success');
  } catch (error) {
    console.error('Ошибка сохранения интеграции:', error);
    showSnackbar('Ошибка сохранения интеграции', 'error');
  } finally {
    editDialog.value.saving = false;
  }
};

// Lifecycle
onMounted(() => {
  loadIntegrations();
});
</script>

<style scoped>
.integrations-settings {
  max-width: none;
}

.integration-card {
  transition: all 0.3s ease;
  border-radius: 12px;
  height: 100%;
}

.integration-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.integration-card--active {
  border: 2px solid rgba(var(--v-theme-primary), 0.3);
}

.integration-card .v-card-title {
  padding-bottom: 8px;
}

.integration-card .v-card-text {
  padding-top: 8px;
}

/* Темная тема */
[data-theme="dark"] .integration-card:hover {
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .integration-card--active {
  border-color: rgba(var(--v-theme-primary), 0.5);
}

/* Responsive */
@media (max-width: 960px) {
  .integration-card {
    margin-bottom: 16px;
  }
}
</style>
