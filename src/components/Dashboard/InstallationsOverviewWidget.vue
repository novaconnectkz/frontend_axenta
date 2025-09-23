<template>
  <BaseWidget
    title="Обзор монтажей"
    icon="mdi-hammer-wrench"
    :loading="loading"
    :error="error"
    @refresh="loadData"
    @configure="$emit('configure')"
    @remove="$emit('remove')"
  >
    <div v-if="data" class="installations-overview">
      <v-row>
        <v-col cols="6" sm="2">
          <div class="stat-item">
            <div class="stat-value total">{{ data.total }}</div>
            <div class="stat-label">Всего</div>
          </div>
        </v-col>
        <v-col cols="6" sm="2">
          <div class="stat-item">
            <div class="stat-value scheduled">{{ data.scheduled }}</div>
            <div class="stat-label">Запланировано</div>
          </div>
        </v-col>
        <v-col cols="6" sm="2">
          <div class="stat-item">
            <div class="stat-value in-progress">{{ data.in_progress }}</div>
            <div class="stat-label">В работе</div>
          </div>
        </v-col>
        <v-col cols="6" sm="2">
          <div class="stat-item">
            <div class="stat-value completed">{{ data.completed }}</div>
            <div class="stat-label">Завершено</div>
          </div>
        </v-col>
        <v-col cols="6" sm="2">
          <div class="stat-item">
            <div class="stat-value cancelled">{{ data.cancelled }}</div>
            <div class="stat-label">Отменено</div>
          </div>
        </v-col>
        <v-col cols="6" sm="2">
          <div class="stat-item">
            <div class="stat-value today">{{ data.today_installations }}</div>
            <div class="stat-label">Сегодня</div>
          </div>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1">
              <v-icon start icon="mdi-progress-clock" />
              Прогресс выполнения
            </v-card-title>
            <v-card-text>
              <div class="progress-section">
                <div class="progress-label">
                  <span>Завершено</span>
                  <span>{{ completionPercentage }}%</span>
                </div>
                <v-progress-linear
                  :model-value="completionPercentage"
                  color="success"
                  height="8"
                  rounded
                />
              </div>
              
              <div class="progress-section mt-3">
                <div class="progress-label">
                  <span>В работе</span>
                  <span>{{ inProgressPercentage }}%</span>
                </div>
                <v-progress-linear
                  :model-value="inProgressPercentage"
                  color="primary"
                  height="8"
                  rounded
                />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <v-list density="compact">
            <v-list-subheader>Статусы монтажей</v-list-subheader>
            
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-calendar-clock" color="info" />
              </template>
              <v-list-item-title>Запланировано</v-list-item-title>
              <template v-slot:append>
                <v-chip color="info" size="small">
                  {{ data.scheduled }}
                </v-chip>
              </template>
            </v-list-item>

            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-hammer-wrench" color="primary" />
              </template>
              <v-list-item-title>В работе</v-list-item-title>
              <template v-slot:append>
                <v-chip color="primary" size="small">
                  {{ data.in_progress }}
                </v-chip>
              </template>
            </v-list-item>

            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-check-circle" color="success" />
              </template>
              <v-list-item-title>Завершено</v-list-item-title>
              <template v-slot:append>
                <v-chip color="success" size="small">
                  {{ data.completed }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-col>

        <v-col cols="12" md="6">
          <v-card v-if="data.today_installations > 0" variant="tonal" color="primary">
            <v-card-text class="text-center">
              <v-icon icon="mdi-calendar-today" size="large" class="mb-2" />
              <div class="text-h5">{{ data.today_installations }}</div>
              <div class="text-caption">монтажей запланировано на сегодня</div>
            </v-card-text>
          </v-card>
          
          <v-card v-else variant="tonal">
            <v-card-text class="text-center">
              <v-icon icon="mdi-calendar-blank" size="large" class="mb-2" />
              <div class="text-subtitle-1">На сегодня монтажей не запланировано</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <template #actions>
      <v-btn
        color="primary"
        variant="outlined"
        size="small"
        to="/installations"
      >
        Все монтажи
      </v-btn>
      <v-spacer />
      <v-btn
        color="success"
        variant="outlined"
        size="small"
        to="/installations/create"
      >
        <v-icon start icon="mdi-plus" />
        Запланировать
      </v-btn>
    </template>
  </BaseWidget>
</template>

<script lang="ts">
import { dashboardService } from '@/services/dashboardService';
import type { InstallationStats } from '@/types/dashboard';
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue';
import BaseWidget from './BaseWidget.vue';

export default defineComponent({
  name: 'InstallationsOverviewWidget',
  components: {
    BaseWidget
  },
  props: {
    refreshInterval: {
      type: Number,
      default: 300
    }
  },
  emits: ['configure', 'remove'],
  setup(props) {
    const data = ref<InstallationStats | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    let refreshTimer: NodeJS.Timeout | null = null;

    const completionPercentage = computed(() => {
      if (!data.value || data.value.total === 0) return 0;
      return Math.round((data.value.completed / data.value.total) * 100);
    });

    const inProgressPercentage = computed(() => {
      if (!data.value || data.value.total === 0) return 0;
      return Math.round((data.value.in_progress / data.value.total) * 100);
    });

    const loadData = async () => {
      try {
        // loading.value = true; // Убираем loading, чтобы не было размытия экрана
        error.value = null;
        const stats = await dashboardService.getStats();
        data.value = stats.installations;
      } catch (err: any) {
        error.value = err.message || 'Ошибка загрузки данных монтажей';
        console.error('Ошибка загрузки данных монтажей:', err);
      } finally {
        // loading.value = false; // Убираем loading состояние
      }
    };

    const startAutoRefresh = () => {
      if (props.refreshInterval > 0) {
        refreshTimer = setInterval(() => {
          loadData();
        }, props.refreshInterval * 1000);
      }
    };

    const stopAutoRefresh = () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
      }
    };

    onMounted(() => {
      loadData();
      startAutoRefresh();
    });

    onUnmounted(() => {
      stopAutoRefresh();
    });

    return {
      data,
      loading,
      error,
      completionPercentage,
      inProgressPercentage,
      loadData
    };
  }
});
</script>

<style scoped>
.installations-overview {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Прокрутка если содержимое не помещается */
}

.stat-item {
  text-align: center;
  padding: 8px;
  min-width: fit-content;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 4px;
  white-space: nowrap;
  word-break: keep-all;
}

.stat-value.total {
  color: rgb(var(--v-theme-primary));
}

.stat-value.scheduled {
  color: rgb(var(--v-theme-info));
}

.stat-value.in-progress {
  color: rgb(var(--v-theme-primary));
}

.stat-value.completed {
  color: rgb(var(--v-theme-success));
}

.stat-value.cancelled {
  color: rgb(var(--v-theme-error));
}

.stat-value.today {
  color: rgb(var(--v-theme-warning));
}

.stat-label {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
  text-transform: uppercase;
  letter-spacing: 0.5px;
  word-break: keep-all;
  overflow-wrap: normal;
  line-height: 1.3;
  text-align: center;
}

.progress-section {
  margin-bottom: 16px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 0.875rem;
}
</style>
