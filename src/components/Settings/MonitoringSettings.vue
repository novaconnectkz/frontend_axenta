<template>
  <div class="monitoring-settings">
    <!-- Заголовок -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h3 class="text-h6 font-weight-bold mb-1">Мониторинг интеграций</h3>
        <p class="text-body-2 text-medium-emphasis">
          Отслеживание статуса подключений и производительности внешних систем
        </p>
      </div>
      
      <!-- Кнопки действий -->
      <div class="d-flex gap-2">
        <v-btn
          variant="outlined"
          prepend-icon="mdi-refresh"
          @click="refreshStatus"
          :loading="refreshing"
        >
          Обновить
        </v-btn>
        
        <v-btn
          variant="outlined"
          prepend-icon="mdi-delete"
          @click="clearLogs"
          :loading="clearing"
        >
          Очистить логи
        </v-btn>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-4 text-body-2">Загрузка данных мониторинга...</p>
    </div>

    <!-- Основной контент -->
    <div v-else>
      <!-- Общая статистика -->
      <div class="mb-6">
        <h4 class="text-h6 font-weight-bold mb-4">Общая статистика</h4>
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-card class="stats-card text-center pa-4" elevation="2">
              <v-icon size="32" :color="overallStats.activeColor" class="mb-2">mdi-connection</v-icon>
              <div class="text-h6 font-weight-bold">{{ overallStats.active }}</div>
              <div class="text-caption text-medium-emphasis">Активных подключений</div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card class="stats-card text-center pa-4" elevation="2">
              <v-icon size="32" color="warning" class="mb-2">mdi-clock</v-icon>
              <div class="text-h6 font-weight-bold">{{ overallStats.avgResponseTime }}мс</div>
              <div class="text-caption text-medium-emphasis">Среднее время отклика</div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card class="stats-card text-center pa-4" elevation="2">
              <v-icon size="32" color="success" class="mb-2">mdi-check-circle</v-icon>
              <div class="text-h6 font-weight-bold">{{ overallStats.successRate }}%</div>
              <div class="text-caption text-medium-emphasis">Успешных запросов</div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card class="stats-card text-center pa-4" elevation="2">
              <v-icon size="32" color="error" class="mb-2">mdi-alert-circle</v-icon>
              <div class="text-h6 font-weight-bold">{{ overallStats.errors }}</div>
              <div class="text-caption text-medium-emphasis">Ошибок за сутки</div>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Статус интеграций -->
      <div class="mb-6">
        <h4 class="text-h6 font-weight-bold mb-4">Статус интеграций</h4>
        <v-row>
          <v-col
            v-for="status in connectionStatuses"
            :key="status.integration_id"
            cols="12"
            md="6"
            lg="4"
          >
            <v-card class="integration-status-card" elevation="2">
              <v-card-title class="d-flex align-center justify-space-between">
                <div class="d-flex align-center gap-3">
                  <v-avatar
                    :color="getIntegrationColor(getIntegrationById(status.integration_id)?.type)"
                    size="32"
                  >
                    <v-icon
                      :icon="getIntegrationIcon(getIntegrationById(status.integration_id)?.type)"
                      color="white"
                      size="18"
                    />
                  </v-avatar>
                  
                  <div>
                    <div class="text-subtitle-2 font-weight-bold">
                      {{ getIntegrationById(status.integration_id)?.name || 'Неизвестная интеграция' }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ getIntegrationById(status.integration_id)?.type }}
                    </div>
                  </div>
                </div>

                <!-- Статус -->
                <v-chip
                  :color="getStatusColor(status.status)"
                  size="small"
                  variant="elevated"
                >
                  <v-icon
                    start
                    :icon="getStatusIcon(status.status)"
                    size="14"
                  />
                  {{ getStatusLabel(status.status) }}
                </v-chip>
              </v-card-title>

              <v-card-text class="pt-2">
                <!-- Метрики -->
                <div class="metrics-grid">
                  <div class="metric">
                    <div class="text-caption text-medium-emphasis">Время отклика</div>
                    <div class="text-subtitle-2 font-weight-bold">
                      {{ status.response_time ? `${status.response_time}мс` : '—' }}
                    </div>
                  </div>
                  
                  <div class="metric">
                    <div class="text-caption text-medium-emphasis">Успешность</div>
                    <div class="text-subtitle-2 font-weight-bold" :class="getSuccessRateClass(status.success_rate)">
                      {{ status.success_rate.toFixed(1) }}%
                    </div>
                  </div>
                </div>

                <!-- Последняя проверка -->
                <div class="mt-3 text-caption text-medium-emphasis">
                  <v-icon size="14" class="me-1">mdi-clock</v-icon>
                  Последняя проверка: {{ formatDateTime(status.last_check) }}
                </div>

                <!-- Ошибка -->
                <div v-if="status.error_message" class="mt-2">
                  <v-alert
                    type="error"
                    variant="tonal"
                    density="compact"
                    class="text-caption"
                  >
                    {{ status.error_message }}
                  </v-alert>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Детальная статистика -->
      <div class="mb-6">
        <h4 class="text-h6 font-weight-bold mb-4">Детальная статистика</h4>
        <v-card elevation="2">
          <v-data-table
            :headers="statsHeaders"
            :items="integrationStats"
            class="stats-table"
            density="compact"
            :items-per-page="10"
          >
            <template #item.integration_name="{ item }">
              <div class="d-flex align-center gap-2">
                <v-avatar
                  :color="getIntegrationColor(getIntegrationById(item.integration_id)?.type)"
                  size="24"
                >
                  <v-icon
                    :icon="getIntegrationIcon(getIntegrationById(item.integration_id)?.type)"
                    color="white"
                    size="12"
                  />
                </v-avatar>
                {{ getIntegrationById(item.integration_id)?.name || 'Неизвестная' }}
              </div>
            </template>

            <template #item.uptime_percentage="{ item }">
              <div class="d-flex align-center gap-2">
                <v-progress-linear
                  :model-value="item.uptime_percentage"
                  :color="getUptimeColor(item.uptime_percentage)"
                  height="6"
                  rounded
                  style="min-width: 60px"
                />
                <span class="text-caption">{{ item.uptime_percentage.toFixed(1) }}%</span>
              </div>
            </template>

            <template #item.success_rate="{ item }">
              <span :class="getSuccessRateClass(item.successful_requests / item.total_requests * 100)">
                {{ ((item.successful_requests / item.total_requests) * 100).toFixed(1) }}%
              </span>
            </template>

            <template #item.average_response_time="{ item }">
              <span :class="getResponseTimeClass(item.average_response_time)">
                {{ item.average_response_time }}мс
              </span>
            </template>

            <template #item.actions="{ item }">
              <v-btn
                variant="text"
                size="small"
                @click="viewLogs(item.integration_id)"
              >
                <v-icon start>mdi-text-box-search</v-icon>
                Логи
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </div>

      <!-- Последние логи -->
      <div>
        <div class="d-flex align-center justify-space-between mb-4">
          <h4 class="text-h6 font-weight-bold">Последние события</h4>
          <v-select
            v-model="selectedIntegrationForLogs"
            :items="integrationOptions"
            label="Фильтр по интеграции"
            variant="outlined"
            density="compact"
            style="min-width: 250px"
            @update:model-value="loadLogs"
          />
        </div>

        <v-card elevation="2">
          <v-card-text class="pa-0">
            <div v-if="logs.length === 0" class="text-center py-8">
              <v-icon size="48" color="grey">mdi-text-box-search-outline</v-icon>
              <p class="text-body-2 text-medium-emphasis mt-2">Логи отсутствуют</p>
            </div>
            
            <div v-else class="logs-container">
              <div
                v-for="log in logs"
                :key="log.id"
                class="log-entry"
                :class="`log-entry--${log.level}`"
              >
                <div class="d-flex align-center gap-3">
                  <v-icon
                    :icon="getLogIcon(log.level)"
                    :color="getLogColor(log.level)"
                    size="18"
                  />
                  
                  <div class="flex-grow-1">
                    <div class="d-flex align-center justify-space-between">
                      <div class="log-message">{{ log.message }}</div>
                      <div class="text-caption text-medium-emphasis">
                        {{ formatDateTime(log.timestamp) }}
                      </div>
                    </div>
                    
                    <div class="text-caption text-medium-emphasis">
                      {{ getIntegrationById(log.integration_id)?.name }}
                    </div>
                    
                    <div v-if="log.details" class="log-details mt-1">
                      <v-code class="text-caption">{{ JSON.stringify(log.details, null, 2) }}</v-code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

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
    ConnectionStatus,
    IntegrationLog,
    IntegrationStats,
    IntegrationWithSettings
} from '@/types/settings';
import { computed, onMounted, ref } from 'vue';

// Реактивные данные
const loading = ref(false);
const refreshing = ref(false);
const clearing = ref(false);
const connectionStatuses = ref<ConnectionStatus[]>([]);
const integrationStats = ref<IntegrationStats[]>([]);
const logs = ref<IntegrationLog[]>([]);
const integrations = ref<IntegrationWithSettings[]>([]);
const selectedIntegrationForLogs = ref('');

const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000
});

// Заголовки таблицы статистики
const statsHeaders = [
  { title: 'Интеграция', key: 'integration_name', sortable: false },
  { title: 'Всего запросов', key: 'total_requests', align: 'center' },
  { title: 'Успешных', key: 'successful_requests', align: 'center' },
  { title: 'Ошибок', key: 'failed_requests', align: 'center' },
  { title: 'Успешность', key: 'success_rate', align: 'center' },
  { title: 'Время отклика', key: 'average_response_time', align: 'center' },
  { title: 'Uptime', key: 'uptime_percentage', align: 'center' },
  { title: 'За 24ч', key: 'last_24h_requests', align: 'center' },
  { title: 'Действия', key: 'actions', sortable: false, align: 'center' }
] as const;

// Вычисляемые свойства
const overallStats = computed(() => {
  const active = connectionStatuses.value.filter(s => s.status === 'active').length;
  const totalStats = integrationStats.value;
  
  const avgResponseTime = totalStats.length > 0
    ? Math.round(totalStats.reduce((sum, s) => sum + s.average_response_time, 0) / totalStats.length)
    : 0;
  
  const totalRequests = totalStats.reduce((sum, s) => sum + s.total_requests, 0);
  const totalSuccessful = totalStats.reduce((sum, s) => sum + s.successful_requests, 0);
  const successRate = totalRequests > 0 ? Math.round((totalSuccessful / totalRequests) * 100) : 0;
  
  const errors = totalStats.reduce((sum, s) => sum + s.last_24h_requests - Math.round(s.last_24h_requests * (s.successful_requests / s.total_requests)), 0);
  
  return {
    active,
    activeColor: active > 0 ? 'success' : 'error',
    avgResponseTime,
    successRate,
    errors
  };
});

const integrationOptions = computed(() => {
  const options = [{ value: '', title: 'Все интеграции' }];
  
  integrations.value.forEach(integration => {
    options.push({
      value: integration.id,
      title: integration.name
    });
  });
  
  return options;
});

// Методы
const showSnackbar = (text: string, color = 'info', timeout = 5000) => {
  snackbar.value = { show: true, text, color, timeout };
};

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(date));
};

const getIntegrationById = (id: string) => {
  return integrations.value.find(i => i.id === id);
};

const getIntegrationIcon = (type?: string) => {
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

const getIntegrationColor = (type?: string) => {
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

const getSuccessRateClass = (rate: number) => {
  if (rate >= 95) return 'text-success';
  if (rate >= 80) return 'text-warning';
  return 'text-error';
};

const getResponseTimeClass = (time: number) => {
  if (time <= 500) return 'text-success';
  if (time <= 2000) return 'text-warning';
  return 'text-error';
};

const getUptimeColor = (uptime: number) => {
  if (uptime >= 99) return 'success';
  if (uptime >= 95) return 'warning';
  return 'error';
};

const getLogIcon = (level: string) => {
  const icons = {
    info: 'mdi-information',
    warning: 'mdi-alert',
    error: 'mdi-alert-circle'
  } as any;
  return icons[level] || 'mdi-information';
};

const getLogColor = (level: string) => {
  const colors = {
    info: 'info',
    warning: 'warning',
    error: 'error'
  } as any;
  return colors[level] || 'info';
};

const loadData = async () => {
  loading.value = true;
  try {
    const [statusResponse, integrationsResponse] = await Promise.all([
      settingsService.getIntegrationStatus(),
      settingsService.getIntegrations()
    ]);
    
    connectionStatuses.value = statusResponse.statuses;
    integrationStats.value = statusResponse.stats;
    integrations.value = integrationsResponse.integrations;
    
    await loadLogs();
  } catch (error) {
    console.error('Ошибка загрузки данных мониторинга:', error);
    showSnackbar('Ошибка загрузки данных мониторинга', 'error');
  } finally {
    loading.value = false;
  }
};

const loadLogs = async () => {
  try {
    const logsData = await settingsService.getIntegrationLogs(
      selectedIntegrationForLogs.value || undefined,
      20
    );
    logs.value = logsData;
  } catch (error) {
    console.error('Ошибка загрузки логов:', error);
    showSnackbar('Ошибка загрузки логов', 'error');
  }
};

const refreshStatus = async () => {
  refreshing.value = true;
  try {
    await loadData();
    showSnackbar('Данные мониторинга обновлены', 'success');
  } catch (error) {
    console.error('Ошибка обновления данных:', error);
    showSnackbar('Ошибка обновления данных', 'error');
  } finally {
    refreshing.value = false;
  }
};

const clearLogs = async () => {
  clearing.value = true;
  try {
    await settingsService.clearIntegrationLogs();
    logs.value = [];
    showSnackbar('Логи очищены', 'success');
  } catch (error) {
    console.error('Ошибка очистки логов:', error);
    showSnackbar('Ошибка очистки логов', 'error');
  } finally {
    clearing.value = false;
  }
};

const viewLogs = (integrationId: string) => {
  selectedIntegrationForLogs.value = integrationId;
  loadLogs();
  
  // Прокручиваем к логам
  const logsContainer = document.querySelector('.logs-container');
  if (logsContainer) {
    logsContainer.scrollIntoView({ behavior: 'smooth' });
  }
};

// Lifecycle
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.monitoring-settings {
  max-width: none;
}

.stats-card {
  transition: all 0.3s ease;
  border-radius: 12px;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.integration-status-card {
  transition: all 0.3s ease;
  border-radius: 12px;
  height: 100%;
}

.integration-status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 12px;
}

.metric {
  text-align: center;
  padding: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 8px;
}

.stats-table {
  border-radius: 12px;
}

.logs-container {
  max-height: 500px;
  overflow-y: auto;
}

.log-entry {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
  transition: background-color 0.2s ease;
}

.log-entry:hover {
  background: rgba(var(--v-theme-surface-variant), 0.5);
}

.log-entry:last-child {
  border-bottom: none;
}

.log-entry--error {
  border-left: 4px solid rgb(var(--v-theme-error));
}

.log-entry--warning {
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.log-entry--info {
  border-left: 4px solid rgb(var(--v-theme-info));
}

.log-message {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.log-details {
  max-width: 100%;
  overflow-x: auto;
}

.log-details .v-code {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  max-height: 100px;
  overflow-y: auto;
}

/* Темная тема */
[data-theme="dark"] .stats-card:hover,
[data-theme="dark"] .integration-status-card:hover {
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.1);
}

/* Responsive */
@media (max-width: 960px) {
  .stats-card,
  .integration-status-card {
    margin-bottom: 16px;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
