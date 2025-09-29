<template>
  <BaseWidget
    title="Обзор склада"
    icon="mdi-warehouse"
    :widget-id="widgetId"
    :is-resize-mode="isResizeMode"
    :dimensions="dimensions"
    :loading="loading"
    :error="error"
    @refresh="loadData"
    @configure="$emit('configure')"
    @remove="$emit('remove')"
    @resize="$emit('resize', $event)"
  >
    <div v-if="data" class="warehouse-overview">
      <v-row>
        <v-col cols="6" sm="3">
          <div class="stat-item">
            <div class="stat-value total">{{ data.total_equipment }}</div>
            <div class="stat-label">Всего оборудования</div>
          </div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="stat-item">
            <div class="stat-value available">{{ data.available_equipment }}</div>
            <div class="stat-label">Доступно</div>
          </div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="stat-item">
            <div class="stat-value installed">{{ data.installed_equipment }}</div>
            <div class="stat-label">Установлено</div>
          </div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="stat-item">
            <div class="stat-value reserved">{{ data.reserved_equipment }}</div>
            <div class="stat-label">Зарезервировано</div>
          </div>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1">
              <v-icon start icon="mdi-chart-donut" />
              Распределение оборудования
            </v-card-title>
            <v-card-text>
              <div class="equipment-distribution">
                <div class="distribution-item">
                  <div class="distribution-bar">
                    <v-progress-linear
                      :model-value="availablePercentage"
                      color="success"
                      height="20"
                      rounded
                    >
                      <template v-slot:default="{ value }">
                        <strong>{{ Math.ceil(value) }}%</strong>
                      </template>
                    </v-progress-linear>
                  </div>
                  <div class="distribution-label">Доступно</div>
                </div>

                <div class="distribution-item mt-2">
                  <div class="distribution-bar">
                    <v-progress-linear
                      :model-value="installedPercentage"
                      color="primary"
                      height="20"
                      rounded
                    >
                      <template v-slot:default="{ value }">
                        <strong>{{ Math.ceil(value) }}%</strong>
                      </template>
                    </v-progress-linear>
                  </div>
                  <div class="distribution-label">Установлено</div>
                </div>

                <div class="distribution-item mt-2">
                  <div class="distribution-bar">
                    <v-progress-linear
                      :model-value="reservedPercentage"
                      color="warning"
                      height="20"
                      rounded
                    >
                      <template v-slot:default="{ value }">
                        <strong>{{ Math.ceil(value) }}%</strong>
                      </template>
                    </v-progress-linear>
                  </div>
                  <div class="distribution-label">Зарезервировано</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="text-subtitle-1">
              <v-icon start icon="mdi-format-list-bulleted" />
              Категории
            </v-card-title>
            <v-card-text>
              <div class="categories-info">
                <v-chip color="info" size="large">
                  <v-icon start icon="mdi-tag-multiple" />
                  {{ data.categories_count }} категорий
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card :color="data.low_stock_alerts > 0 ? 'error' : 'success'" variant="tonal">
            <v-card-title class="text-subtitle-1">
              <v-icon start :icon="data.low_stock_alerts > 0 ? 'mdi-alert-circle' : 'mdi-check-circle'" />
              Уровень запасов
            </v-card-title>
            <v-card-text>
              <div v-if="data.low_stock_alerts > 0" class="text-center">
                <div class="text-h5">{{ data.low_stock_alerts }}</div>
                <div class="text-caption">предупреждений о низких остатках</div>
              </div>
              <div v-else class="text-center">
                <div class="text-subtitle-1">Все в порядке</div>
                <div class="text-caption">Критически низких остатков нет</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-if="data.low_stock_alerts > 0" class="mt-4">
        <v-col cols="12">
          <v-alert
            type="error"
            variant="tonal"
            density="compact"
          >
            <template v-slot:prepend>
              <v-icon icon="mdi-alert-circle" />
            </template>
            Внимание! {{ data.low_stock_alerts }} позиций с критически низкими остатками
            <template v-slot:append>
              <v-btn
                color="error"
                variant="outlined"
                size="small"
                to="/warehouse/alerts"
              >
                Просмотреть
              </v-btn>
            </template>
          </v-alert>
        </v-col>
      </v-row>
    </div>

    <template #actions>
      <v-btn
        color="primary"
        variant="outlined"
        size="small"
        to="/warehouse"
      >
        Склад
      </v-btn>
      <v-spacer />
      <v-btn
        color="success"
        variant="outlined"
        size="small"
        to="/warehouse/equipment/create"
      >
        <v-icon start icon="mdi-plus" />
        Добавить
      </v-btn>
    </template>
  </BaseWidget>
</template>

<script lang="ts">
import { dashboardService } from '@/services/dashboardService';
import type { WarehouseStats } from '@/types/dashboard';
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue';
import BaseWidget from './BaseWidget.vue';

export default defineComponent({
  name: 'WarehouseOverviewWidget',
  components: {
    BaseWidget
  },
  props: {
    refreshInterval: {
      type: Number,
      default: 600
    }
  },
  emits: ['configure', 'remove'],
  setup(props) {
    const data = ref<WarehouseStats | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    let refreshTimer: NodeJS.Timeout | null = null;

    const availablePercentage = computed(() => {
      if (!data.value || data.value.total_equipment === 0) return 0;
      return (data.value.available_equipment / data.value.total_equipment) * 100;
    });

    const installedPercentage = computed(() => {
      if (!data.value || data.value.total_equipment === 0) return 0;
      return (data.value.installed_equipment / data.value.total_equipment) * 100;
    });

    const reservedPercentage = computed(() => {
      if (!data.value || data.value.total_equipment === 0) return 0;
      return (data.value.reserved_equipment / data.value.total_equipment) * 100;
    });

    const loadData = async () => {
      try {
        // loading.value = true; // Убираем loading, чтобы не было размытия экрана
        error.value = null;
        const stats = await dashboardService.getStats();
        data.value = stats.warehouse;
      } catch (err: any) {
        error.value = err.message || 'Ошибка загрузки данных склада';
        console.error('Ошибка загрузки данных склада:', err);
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
      availablePercentage,
      installedPercentage,
      reservedPercentage,
      loadData
    };
  }
});
</script>

<style scoped>
.warehouse-overview {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Прокрутка если содержимое не помещается */
}

.stat-item {
  text-align: center;
  padding: 12px;
  min-width: fit-content;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 4px;
  white-space: nowrap;
  word-break: keep-all;
}

.stat-value.total {
  color: rgb(var(--v-theme-primary));
}

.stat-value.available {
  color: rgb(var(--v-theme-success));
}

.stat-value.installed {
  color: rgb(var(--v-theme-info));
}

.stat-value.reserved {
  color: rgb(var(--v-theme-warning));
}

.stat-label {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
  text-transform: uppercase;
  letter-spacing: 0.5px;
  word-break: keep-all;
  overflow-wrap: normal;
  line-height: 1.3;
  text-align: center;
}

.equipment-distribution {
  padding: 8px 0;
}

.distribution-item {
  margin-bottom: 8px;
}

.distribution-bar {
  margin-bottom: 4px;
}

.distribution-label {
  font-size: 0.875rem;
  text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
}

.categories-info {
  text-align: center;
  padding: 16px 0;
}
</style>
