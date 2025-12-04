<template>
  <v-card class="auto-refresh-settings" variant="outlined">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-refresh-auto" class="mr-2" />
      Автоматическое обновление данных
    </v-card-title>

    <v-card-text>
      <v-row>
        <!-- Основные настройки -->
        <v-col cols="12" md="6">
          <div class="settings-section">
            <h3 class="section-title">Основные настройки</h3>
            
            <!-- Включение/выключение -->
            <v-switch
              v-model="localEnabled"
              :loading="loading"
              color="primary"
              label="Включить автоматическое обновление"
              hide-details
              @change="toggleAutoRefresh"
            />

            <!-- Интервал обновления -->
            <v-select
              v-model="localInterval"
              :items="intervalOptions"
              :disabled="!localEnabled || loading"
              label="Интервал обновления"
              variant="outlined"
              density="compact"
              class="mt-4"
              @update:model-value="updateInterval"
            />

            <!-- Кнопка принудительного обновления -->
            <v-btn
              :disabled="!autoRefresh.isEnabled.value"
              :loading="refreshing"
              color="primary"
              variant="outlined"
              prepend-icon="mdi-refresh"
              class="mt-4"
              @click="forceRefresh"
            >
              Обновить сейчас
            </v-btn>
          </div>
        </v-col>

        <!-- Статистика -->
        <v-col cols="12" md="6">
          <div class="settings-section">
            <h3 class="section-title">Статистика</h3>
            
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-label">Статус</div>
                <v-chip
                  :color="autoRefresh.isEnabled.value ? 'success' : 'default'"
                  size="small"
                  variant="tonal"
                >
                  {{ autoRefresh.isEnabled.value ? 'Активно' : 'Отключено' }}
                </v-chip>
              </div>

              <div class="stat-item" v-if="autoRefresh.isEnabled.value">
                <div class="stat-label">Следующее обновление через</div>
                <div class="stat-value">
                  {{ autoRefresh.nextRefreshIn.value }}с
                </div>
              </div>

              <div class="stat-item" v-if="autoRefresh.lastUpdate.value">
                <div class="stat-label">Последнее обновление</div>
                <div class="stat-value">
                  {{ formatDate(autoRefresh.lastUpdate.value) }}
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-label">Всего обновлений</div>
                <div class="stat-value">
                  {{ autoRefresh.refreshStats.value.totalRefreshes }}
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-label">Успешных</div>
                <div class="stat-value success">
                  {{ autoRefresh.refreshStats.value.successfulRefreshes }}
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-label">Ошибок</div>
                <div class="stat-value error">
                  {{ autoRefresh.refreshStats.value.failedRefreshes }}
                </div>
              </div>
            </div>

            <!-- Последняя ошибка -->
            <v-alert
              v-if="autoRefresh.refreshStats.value.lastError"
              type="error"
              variant="tonal"
              density="compact"
              class="mt-4"
            >
              <div class="error-title">Последняя ошибка:</div>
              <div class="error-text">{{ autoRefresh.refreshStats.value.lastError }}</div>
            </v-alert>

            <!-- Кнопка сброса статистики -->
            <v-btn
              variant="outlined"
              color="warning"
              size="small"
              prepend-icon="mdi-refresh"
              class="mt-4"
              @click="resetStats"
            >
              Сбросить статистику
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- Настройки синхронизации AxentaSync -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card variant="outlined" class="axenta-sync-settings">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-cloud-sync" class="mr-2" />
              Синхронизация Axenta Cloud
            </v-card-title>
            <v-card-text>
              <div class="settings-section">
                <p class="text-body-2 text-medium-emphasis mb-4">
                  Настройка интервала автоматической синхронизации данных из Axenta Cloud API.
                  Синхронизация загружает аккаунты и объекты для всех компаний.
                </p>
                
                <v-select
                  v-model.number="axentaSyncInterval"
                  :items="axentaSyncIntervalOptions"
                  :loading="loadingAxentaSync"
                  :disabled="loadingAxentaSync"
                  label="Интервал синхронизации Axenta Cloud"
                  variant="outlined"
                  density="compact"
                  hint="Интервал синхронизации данных из Axenta Cloud API"
                  persistent-hint
                  class="mb-3"
                  @update:model-value="updateAxentaSyncInterval"
                />

                <v-alert
                  v-if="axentaSyncInfo"
                  type="info"
                  variant="tonal"
                  density="compact"
                  class="mt-3"
                >
                  {{ axentaSyncInfo }}
                </v-alert>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Дополнительная информация -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-expansion-panels variant="accordion">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon icon="mdi-information" class="mr-2" />
                Дополнительная информация
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div class="info-content">
                  <h4>Как работает автоматическое обновление:</h4>
                  <ul>
                    <li>Система автоматически обновляет данные объектов и статистику дашборда</li>
                    <li>Обновления происходят в фоновом режиме без перезагрузки страницы</li>
                    <li>При превышении лимита ошибок (5 подряд) автообновление автоматически отключается</li>
                    <li>Настройки сохраняются в браузере и восстанавливаются при следующем посещении</li>
                  </ul>

                  <h4 class="mt-4">Рекомендуемые интервалы:</h4>
                  <ul>
                    <li><strong>30 секунд</strong> - для активного мониторинга</li>
                    <li><strong>1 минута</strong> - для обычной работы</li>
                    <li><strong>5 минут</strong> - для экономии трафика</li>
                  </ul>

                  <h4 class="mt-4">Синхронизация Axenta Cloud:</h4>
                  <ul>
                    <li>Синхронизация загружает все аккаунты и объекты из Axenta Cloud API</li>
                    <li>Рекомендуемый интервал: <strong>5-15 минут</strong> для снижения нагрузки на API</li>
                    <li>Изменение интервала применяется сразу без перезапуска бекенда</li>
                    <li>Только суперадмин может изменять настройки синхронизации</li>
                  </ul>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>

  <!-- Snackbar для уведомлений -->
  <v-snackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="snackbar.timeout"
    location="top right"
  >
    {{ snackbar.text }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useAxentaAutoRefresh } from '@/services/axentaAutoRefreshService';
import { apiClient } from '@/services/api';
// import { useSnackbar } from '@/composables/useSnackbar'; // Removed - using local snackbar

// Локальный snackbar
const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
  timeout: 3000
});

const showSnackbar = (text: string, color = 'success', timeout = 3000) => {
  snackbar.value = { show: true, text, color, timeout };
};
const autoRefresh = useAxentaAutoRefresh();

// Настройки синхронизации AxentaSync
const axentaSyncInterval = ref(5);
const loadingAxentaSync = ref(false);
const axentaSyncInfo = ref<string | null>(null);

// Опции интервалов для синхронизации AxentaSync (в минутах)
const axentaSyncIntervalOptions = [
  { title: '1 минута', value: 1 },
  { title: '5 минут', value: 5 },
  { title: '10 минут', value: 10 },
  { title: '15 минут', value: 15 },
  { title: '30 минут', value: 30 },
  { title: '60 минут', value: 60 },
];

// Загрузка текущих настроек синхронизации AxentaSync
const loadAxentaSyncSettings = async () => {
  try {
    loadingAxentaSync.value = true;
    const response = await apiClient.get('/auth/system/axenta-sync-settings');
    if (response.data?.status === 'success' && response.data?.data?.sync_interval) {
      axentaSyncInterval.value = response.data.data.sync_interval;
      axentaSyncInfo.value = `Текущий интервал: ${axentaSyncInterval.value} минут`;
    }
  } catch (error: any) {
    console.error('Ошибка загрузки настроек синхронизации AxentaSync:', error);
    if (error.response?.status !== 403) {
      showSnackbar('Ошибка загрузки настроек синхронизации', 'error');
    }
  } finally {
    loadingAxentaSync.value = false;
  }
};

// Обновление интервала синхронизации AxentaSync
const updateAxentaSyncInterval = async (newInterval: number) => {
  try {
    loadingAxentaSync.value = true;
    const response = await apiClient.put('/auth/system/axenta-sync-settings', {
      sync_interval: newInterval,
    });
    
    if (response.data?.status === 'success') {
      axentaSyncInterval.value = newInterval;
      axentaSyncInfo.value = `Интервал обновлен на ${newInterval} минут`;
      showSnackbar(`Интервал синхронизации AxentaSync изменен на ${newInterval} минут`, 'success');
    } else {
      throw new Error(response.data?.error || 'Ошибка обновления');
    }
  } catch (error: any) {
    console.error('Ошибка обновления интервала синхронизации AxentaSync:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Ошибка обновления интервала';
    showSnackbar(errorMessage, 'error');
    // Возвращаем предыдущее значение
    await loadAxentaSyncSettings();
  } finally {
    loadingAxentaSync.value = false;
  }
};

// Локальные состояния
const loading = ref(false);
const refreshing = ref(false);
const localEnabled = ref(autoRefresh.isEnabled.value);
const localInterval = ref(autoRefresh.interval.value / 1000); // Конвертируем в секунды

// Опции интервалов
const intervalOptions = [
  { title: '5 секунд', value: 5 },
  { title: '10 секунд', value: 10 },
  { title: '30 секунд', value: 30 },
  { title: '1 минута', value: 60 },
  { title: '2 минуты', value: 120 },
  { title: '5 минут', value: 300 }
];

// Синхронизация с сервисом
watch(() => autoRefresh.isEnabled.value, (newValue) => {
  localEnabled.value = newValue;
});

watch(() => autoRefresh.interval.value, (newValue) => {
  localInterval.value = newValue / 1000;
});

// Включение/выключение автообновления
const toggleAutoRefresh = async () => {
  try {
    loading.value = true;
    
    if (localEnabled.value) {
      autoRefresh.start();
      showSnackbar('Автоматическое обновление включено', 'success');
    } else {
      autoRefresh.stop();
      showSnackbar('Автоматическое обновление отключено', 'info');
    }
  } catch (error: any) {
    console.error('Ошибка переключения автообновления:', error);
    showSnackbar(error.message || 'Ошибка настройки автообновления', 'error');
    localEnabled.value = !localEnabled.value; // Возвращаем предыдущее состояние
  } finally {
    loading.value = false;
  }
};

// Обновление интервала
const updateInterval = async (newInterval: number) => {
  try {
    loading.value = true;
    autoRefresh.setInterval(newInterval);
    showSnackbar(`Интервал обновления изменен на ${newInterval} секунд`, 'success');
  } catch (error: any) {
    console.error('Ошибка изменения интервала:', error);
    showSnackbar(error.message || 'Ошибка изменения интервала', 'error');
    localInterval.value = autoRefresh.interval.value / 1000; // Возвращаем предыдущее значение
  } finally {
    loading.value = false;
  }
};

// Принудительное обновление
const forceRefresh = async () => {
  try {
    refreshing.value = true;
    const success = await autoRefresh.forceRefresh();
    
    if (success) {
      showSnackbar('Данные успешно обновлены', 'success');
    } else {
      showSnackbar('Ошибка обновления данных', 'error');
    }
  } catch (error: any) {
    console.error('Ошибка принудительного обновления:', error);
    showSnackbar('Ошибка обновления данных', 'error');
  } finally {
    refreshing.value = false;
  }
};

// Сброс статистики
const resetStats = () => {
  autoRefresh.resetStats();
  showSnackbar('Статистика сброшена', 'success');
};

// Форматирование даты
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
};

// Загружаем настройки при монтировании компонента
onMounted(() => {
  loadAxentaSyncSettings();
});
</script>

<style scoped>
.auto-refresh-settings {
  max-width: 100%;
}

.settings-section {
  height: 100%;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
  font-weight: 500;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.stat-value.success {
  color: rgb(var(--v-theme-success));
}

.stat-value.error {
  color: rgb(var(--v-theme-error));
}

.error-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.error-text {
  font-size: 0.875rem;
  opacity: 0.9;
}

.info-content h4 {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 8px;
}

.info-content ul {
  margin-left: 16px;
  margin-bottom: 16px;
}

.info-content li {
  margin-bottom: 4px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.axenta-sync-settings {
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

@media (max-width: 960px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
