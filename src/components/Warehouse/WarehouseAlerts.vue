<template>
  <div class="warehouse-alerts">
    <!-- Фильтры -->
    <v-card class="mb-4" elevation="1">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.type"
              label="Тип уведомления"
              :items="typeOptions"
              variant="outlined"
              density="comfortable"
              clearable
              @update:model-value="applyFilters"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.severity"
              label="Важность"
              :items="severityOptions"
              variant="outlined"
              density="comfortable"
              clearable
              @update:model-value="applyFilters"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.status"
              label="Статус"
              :items="statusOptions"
              variant="outlined"
              density="comfortable"
              clearable
              @update:model-value="applyFilters"
            />
          </v-col>
          <v-col cols="12" md="3">
            <div class="d-flex align-center ga-2">
              <v-switch
                v-model="filters.include_resolved"
                label="Показать разрешенные"
                color="primary"
                density="comfortable"
                @update:model-value="applyFilters"
              />
            </div>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center ga-2">
                <v-btn
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-refresh"
                  @click="$emit('refresh')"
                  :loading="loading"
                >
                  Обновить
                </v-btn>
                <v-btn
                  variant="outlined"
                  prepend-icon="mdi-filter-off"
                  @click="clearFilters"
                >
                  Очистить фильтры
                </v-btn>
              </div>
              <div class="d-flex align-center ga-2">
                <v-btn
                  v-if="selectedAlerts.length > 0"
                  color="warning"
                  variant="outlined"
                  prepend-icon="mdi-check"
                  @click="acknowledgeSelected"
                >
                  Отметить как прочитанные ({{ selectedAlerts.length }})
                </v-btn>
                <v-btn
                  v-if="selectedAlerts.length > 0"
                  color="success"
                  variant="outlined"
                  prepend-icon="mdi-check-all"
                  @click="resolveSelected"
                >
                  Разрешить ({{ selectedAlerts.length }})
                </v-btn>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Список уведомлений -->
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon icon="mdi-alert" class="mr-2" />
          Уведомления склада
          <v-chip class="ml-2" size="small">
            {{ filteredAlerts.length }}
          </v-chip>
        </div>
        <v-checkbox
          v-if="filteredAlerts.length > 0"
          v-model="selectAll"
          @update:model-value="toggleSelectAll"
          hide-details
          density="comfortable"
        />
      </v-card-title>

      <v-card-text>
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="64" />
          <div class="mt-4">Загрузка уведомлений...</div>
        </div>

        <div v-else-if="filteredAlerts.length === 0" class="text-center py-8">
          <v-icon icon="mdi-check-circle" size="64" color="success" />
          <div class="text-h6 mt-4">Уведомлений нет</div>
          <div class="text-body-2 text-medium-emphasis">
            Все складские процессы в порядке
          </div>
        </div>

        <div v-else class="alerts-list">
          <v-card
            v-for="alert in filteredAlerts"
            :key="alert.id"
            variant="outlined"
            class="alert-card mb-3"
            :class="getAlertCardClass(alert)"
          >
            <v-card-text>
              <div class="d-flex align-start">
                <v-checkbox
                  :model-value="selectedAlerts.includes(alert.id)"
                  @update:model-value="toggleAlertSelection(alert.id)"
                  density="comfortable"
                  hide-details
                  class="mr-3 mt-0"
                />
                
                <div class="flex-grow-1">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <div class="d-flex align-center">
                      <v-icon
                        :icon="getAlertIcon(alert.type)"
                        :color="getSeverityColor(alert.severity)"
                        class="mr-2"
                      />
                      <v-chip
                        :color="getSeverityColor(alert.severity)"
                        size="small"
                        variant="tonal"
                      >
                        {{ getSeverityLabel(alert.severity) }}
                      </v-chip>
                      <v-chip
                        :color="getStatusColor(alert.status)"
                        size="small"
                        variant="outlined"
                        class="ml-2"
                      >
                        {{ getStatusLabel(alert.status) }}
                      </v-chip>
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ formatDateTime(alert.created_at) }}
                    </div>
                  </div>

                  <div class="alert-content">
                    <div class="text-subtitle-1 font-weight-bold mb-1">
                      {{ alert.title }}
                    </div>
                    <div class="text-body-2 mb-2">
                      {{ alert.description }}
                    </div>

                    <!-- Связанное оборудование или категория -->
                    <div v-if="alert.equipment" class="related-info mb-2">
                      <v-icon icon="mdi-package-variant" size="16" class="mr-1" />
                      <span class="text-body-2">
                        {{ alert.equipment.model }} {{ alert.equipment.brand }}
                        ({{ alert.equipment.serial_number }})
                      </span>
                    </div>
                    <div v-else-if="alert.equipment_category" class="related-info mb-2">
                      <v-icon icon="mdi-tag" size="16" class="mr-1" />
                      <span class="text-body-2">
                        Категория: {{ alert.equipment_category.name }}
                      </span>
                    </div>

                    <!-- Ответственное лицо -->
                    <div v-if="alert.assigned_user" class="assigned-user mb-2">
                      <v-icon icon="mdi-account" size="16" class="mr-1" />
                      <span class="text-body-2">
                        Ответственный: {{ alert.assigned_user.first_name }} {{ alert.assigned_user.last_name }}
                      </span>
                    </div>

                    <!-- Метаданные -->
                    <div v-if="alertMetadata" class="metadata-info">
                      <v-expansion-panels variant="accordion" density="compact">
                        <v-expansion-panel>
                          <v-expansion-panel-title class="text-caption">
                            Дополнительная информация
                          </v-expansion-panel-title>
                          <v-expansion-panel-text>
                            <div class="metadata-grid">
                              <div
                                v-for="(value, key) in alertMetadata"
                                :key="key"
                                class="metadata-item"
                              >
                                <span class="metadata-label">{{ formatMetadataKey(key) }}:</span>
                                <span class="metadata-value">{{ value }}</span>
                              </div>
                            </div>
                          </v-expansion-panel-text>
                        </v-expansion-panel>
                      </v-expansion-panels>
                    </div>
                  </div>

                  <!-- Действия -->
                  <div class="alert-actions mt-3">
                    <v-btn
                      v-if="alert.status === 'active'"
                      color="warning"
                      variant="outlined"
                      size="small"
                      prepend-icon="mdi-check"
                      @click="$emit('acknowledge', alert.id)"
                      class="mr-2"
                    >
                      Прочитано
                    </v-btn>
                    <v-btn
                      v-if="alert.status !== 'resolved'"
                      color="success"
                      variant="outlined"
                      size="small"
                      prepend-icon="mdi-check-all"
                      @click="$emit('resolve', alert.id)"
                    >
                      Разрешить
                    </v-btn>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { StockAlert, StockAlertFilters } from '@/types/warehouse';
import {
  STOCK_ALERT_TYPE_LABELS,
  STOCK_ALERT_TYPE_ICONS,
  STOCK_ALERT_SEVERITY_LABELS,
  STOCK_ALERT_SEVERITY_COLORS,
} from '@/types/warehouse';

// Props
interface Props {
  alerts: StockAlert[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

// Emits
const emit = defineEmits<{
  acknowledge: [id: number];
  resolve: [id: number];
  refresh: [];
}>();

// Состояние
const selectedAlerts = ref<number[]>([]);
const selectAll = ref(false);

// Фильтры
const filters = ref<StockAlertFilters>({
  type: undefined,
  severity: undefined,
  status: undefined,
  include_resolved: false,
});

// Опции для селектов
const typeOptions = computed(() => 
  Object.entries(STOCK_ALERT_TYPE_LABELS).map(([value, title]) => ({
    value,
    title,
  }))
);

const severityOptions = computed(() => 
  Object.entries(STOCK_ALERT_SEVERITY_LABELS).map(([value, title]) => ({
    value,
    title,
  }))
);

const statusOptions = computed(() => [
  { value: 'active', title: 'Активные' },
  { value: 'acknowledged', title: 'Прочитанные' },
  { value: 'resolved', title: 'Разрешенные' },
]);

// Фильтрация
const filteredAlerts = computed(() => {
  let result = [...props.alerts];

  if (filters.value.type) {
    result = result.filter(alert => alert.type === filters.value.type);
  }
  if (filters.value.severity) {
    result = result.filter(alert => alert.severity === filters.value.severity);
  }
  if (filters.value.status) {
    result = result.filter(alert => alert.status === filters.value.status);
  }
  if (!filters.value.include_resolved) {
    result = result.filter(alert => alert.status !== 'resolved');
  }

  // Сортировка по важности и дате
  result.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const aSeverity = severityOrder[a.severity as keyof typeof severityOrder] || 0;
    const bSeverity = severityOrder[b.severity as keyof typeof severityOrder] || 0;
    
    if (aSeverity !== bSeverity) {
      return bSeverity - aSeverity;
    }
    
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return result;
});

// Вычисляемые свойства для метаданных
const alertMetadata = computed(() => {
  // Здесь можно добавить логику для отображения метаданных конкретного уведомления
  return null;
});

// Методы
const applyFilters = () => {
  selectedAlerts.value = [];
  selectAll.value = false;
};

const clearFilters = () => {
  filters.value = {
    type: undefined,
    severity: undefined,
    status: undefined,
    include_resolved: false,
  };
  selectedAlerts.value = [];
  selectAll.value = false;
};

const toggleSelectAll = (value: boolean) => {
  if (value) {
    selectedAlerts.value = filteredAlerts.value.map(alert => alert.id);
  } else {
    selectedAlerts.value = [];
  }
};

const toggleAlertSelection = (alertId: number) => {
  const index = selectedAlerts.value.indexOf(alertId);
  if (index > -1) {
    selectedAlerts.value.splice(index, 1);
  } else {
    selectedAlerts.value.push(alertId);
  }
  
  // Обновляем состояние "выбрать все"
  selectAll.value = selectedAlerts.value.length === filteredAlerts.value.length;
};

const acknowledgeSelected = async () => {
  for (const alertId of selectedAlerts.value) {
    emit('acknowledge', alertId);
  }
  selectedAlerts.value = [];
  selectAll.value = false;
};

const resolveSelected = async () => {
  for (const alertId of selectedAlerts.value) {
    emit('resolve', alertId);
  }
  selectedAlerts.value = [];
  selectAll.value = false;
};

const getAlertIcon = (type: string) => 
  STOCK_ALERT_TYPE_ICONS[type as keyof typeof STOCK_ALERT_TYPE_ICONS] || 'mdi-alert';

const getSeverityColor = (severity: string) => 
  STOCK_ALERT_SEVERITY_COLORS[severity as keyof typeof STOCK_ALERT_SEVERITY_COLORS] || 'grey';

const getSeverityLabel = (severity: string) => 
  STOCK_ALERT_SEVERITY_LABELS[severity as keyof typeof STOCK_ALERT_SEVERITY_LABELS] || severity;

const getStatusColor = (status: string) => {
  const statusColors: Record<string, string> = {
    active: 'error',
    acknowledged: 'warning',
    resolved: 'success',
  };
  return statusColors[status] || 'grey';
};

const getStatusLabel = (status: string) => {
  const statusLabels: Record<string, string> = {
    active: 'Активное',
    acknowledged: 'Прочитано',
    resolved: 'Разрешено',
  };
  return statusLabels[status] || status;
};

const getAlertCardClass = (alert: StockAlert) => {
  const classes = ['alert-card'];
  
  if (alert.severity === 'critical') {
    classes.push('alert-card--critical');
  } else if (alert.severity === 'high') {
    classes.push('alert-card--high');
  } else if (alert.status === 'resolved') {
    classes.push('alert-card--resolved');
  }
  
  return classes;
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('ru-RU');
};

const formatMetadataKey = (key: string) => {
  const keyMap: Record<string, string> = {
    current_stock: 'Текущий остаток',
    min_level: 'Минимальный уровень',
    category: 'Категория',
    warranty_expired_days: 'Дней с истечения гарантии',
    last_maintenance: 'Последнее обслуживание',
    recommended_interval: 'Рекомендуемый интервал',
  };
  return keyMap[key] || key;
};

// Watchers
watch(filteredAlerts, () => {
  // Очищаем выбранные элементы при изменении фильтров
  selectedAlerts.value = selectedAlerts.value.filter(id =>
    filteredAlerts.value.some(alert => alert.id === id)
  );
  selectAll.value = selectedAlerts.value.length === filteredAlerts.value.length && filteredAlerts.value.length > 0;
});
</script>

<style scoped>
.warehouse-alerts {
  height: 100%;
}

.alerts-list {
  max-height: 600px;
  overflow-y: auto;
}

.alert-card {
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.alert-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.alert-card--critical {
  border-left-color: rgb(var(--v-theme-error));
  background: rgba(var(--v-theme-error), 0.05);
}

.alert-card--high {
  border-left-color: rgb(var(--v-theme-warning));
  background: rgba(var(--v-theme-warning), 0.05);
}

.alert-card--resolved {
  opacity: 0.7;
  border-left-color: rgb(var(--v-theme-success));
}

.alert-content {
  padding-left: 8px;
}

.related-info,
.assigned-user {
  display: flex;
  align-items: center;
  color: rgb(var(--v-theme-on-surface-variant));
}

.alert-actions {
  padding-left: 8px;
}

.metadata-grid {
  display: grid;
  gap: 8px;
}

.metadata-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 4px;
}

.metadata-label {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
  font-weight: 500;
}

.metadata-value {
  font-size: 0.875rem;
  font-weight: 600;
}

/* Адаптивность */
@media (max-width: 768px) {
  .alerts-list {
    max-height: 500px;
  }
  
  .alert-content {
    padding-left: 0;
  }
  
  .alert-actions {
    padding-left: 0;
    margin-top: 8px;
  }
}
</style>
