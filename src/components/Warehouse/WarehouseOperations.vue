<template>
  <div class="warehouse-operations">
    <!-- Фильтры -->
    <v-card class="mb-4" elevation="1">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.type"
              label="Тип операции"
              :items="typeOptions"
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
            <v-text-field
              v-model="filters.date_from"
              label="Дата с"
              type="date"
              variant="outlined"
              density="comfortable"
              @update:model-value="applyFilters"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.date_to"
              label="Дата по"
              type="date"
              variant="outlined"
              density="comfortable"
              @update:model-value="applyFilters"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="6">
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
          </v-col>
          <v-col cols="12" md="6">
            <div class="d-flex align-center justify-end ga-2">
              <v-btn
                color="success"
                prepend-icon="mdi-plus"
                @click="showCreateDialog = true"
              >
                Новая операция
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Список операций -->
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon icon="mdi-swap-horizontal" class="mr-2" />
          Складские операции
          <v-chip class="ml-2" size="small">
            {{ filteredOperations.length }}
          </v-chip>
        </div>
      </v-card-title>

      <v-card-text>
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="64" />
          <div class="mt-4">Загрузка операций...</div>
        </div>

        <div v-else-if="filteredOperations.length === 0" class="text-center py-8">
          <v-icon icon="mdi-clipboard-list-outline" size="64" color="grey" />
          <div class="text-h6 mt-4">Операции не найдены</div>
          <div class="text-body-2 text-medium-emphasis">
            Попробуйте изменить параметры фильтрации или создать новую операцию
          </div>
        </div>

        <div v-else class="operations-list">
          <v-timeline side="end" density="compact">
            <v-timeline-item
              v-for="operation in paginatedOperations"
              :key="operation.id"
              :dot-color="getOperationColor(operation.type)"
              size="small"
            >
              <template #icon>
                <v-icon :icon="getOperationIcon(operation.type)" size="16" />
              </template>

              <v-card variant="outlined" class="operation-card">
                <v-card-text>
                  <div class="d-flex align-center justify-space-between mb-2">
                    <div class="d-flex align-center">
                      <v-chip
                        :color="getOperationColor(operation.type)"
                        size="small"
                        variant="tonal"
                      >
                        {{ getOperationLabel(operation.type) }}
                      </v-chip>
                      <v-chip
                        v-if="operation.status !== 'completed'"
                        :color="operation.status === 'pending' ? 'warning' : 'error'"
                        size="small"
                        variant="outlined"
                        class="ml-2"
                      >
                        {{ getStatusLabel(operation.status) }}
                      </v-chip>
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ formatDateTime(operation.created_at) }}
                    </div>
                  </div>

                  <div class="operation-details">
                    <div class="text-subtitle-2 font-weight-bold mb-1">
                      {{ operation.description }}
                    </div>
                    
                    <div v-if="operation.equipment" class="equipment-info mb-2">
                      <v-icon icon="mdi-package-variant" size="16" class="mr-1" />
                      <span class="text-body-2">
                        {{ operation.equipment.model }} {{ operation.equipment.brand }}
                        ({{ operation.equipment.serial_number }})
                      </span>
                    </div>

                    <div class="location-info mb-2">
                      <div v-if="operation.from_location" class="d-flex align-center">
                        <v-icon icon="mdi-map-marker-minus" size="16" class="mr-1" />
                        <span class="text-body-2">Откуда: {{ operation.from_location }}</span>
                      </div>
                      <div v-if="operation.to_location" class="d-flex align-center">
                        <v-icon icon="mdi-map-marker-plus" size="16" class="mr-1" />
                        <span class="text-body-2">Куда: {{ operation.to_location }}</span>
                      </div>
                    </div>

                    <div v-if="operation.user" class="user-info mb-2">
                      <v-icon icon="mdi-account" size="16" class="mr-1" />
                      <span class="text-body-2">
                        {{ operation.user.first_name }} {{ operation.user.last_name }}
                      </span>
                    </div>

                    <div v-if="operation.document_number" class="document-info mb-2">
                      <v-icon icon="mdi-file-document" size="16" class="mr-1" />
                      <span class="text-body-2">Документ: {{ operation.document_number }}</span>
                    </div>

                    <div v-if="operation.notes" class="notes-info">
                      <v-icon icon="mdi-note-text" size="16" class="mr-1" />
                      <span class="text-body-2 text-medium-emphasis">{{ operation.notes }}</span>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-timeline-item>
          </v-timeline>
        </div>

        <!-- Пагинация -->
        <div v-if="totalPages > 1" class="d-flex justify-center mt-4">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            @update:model-value="updatePage"
          />
        </div>
      </v-card-text>
    </v-card>

    <!-- Диалог создания операции -->
    <!-- <WarehouseOperationDialog
      v-model="showCreateDialog"
      @created="handleOperationCreated"
    /> -->
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { WarehouseOperation, WarehouseOperationFilters } from '@/types/warehouse';
import {
  WAREHOUSE_OPERATION_TYPE_LABELS,
  WAREHOUSE_OPERATION_TYPE_ICONS,
  WAREHOUSE_OPERATION_STATUSES,
} from '@/types/warehouse';

// Импорт компонентов
// import WarehouseOperationDialog from './WarehouseOperationDialog.vue';

// Props
interface Props {
  operations: WarehouseOperation[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

// Emits
const emit = defineEmits<{
  create: [operation: any];
  refresh: [];
}>();

// Состояние
const currentPage = ref(1);
const itemsPerPage = ref(10);
const showCreateDialog = ref(false);

// Фильтры
const filters = ref<WarehouseOperationFilters>({
  type: undefined,
  status: undefined,
  date_from: '',
  date_to: '',
});

// Опции для селектов
const typeOptions = computed(() => 
  Object.entries(WAREHOUSE_OPERATION_TYPE_LABELS).map(([value, title]) => ({
    value,
    title,
  }))
);

const statusOptions = computed(() => [
  { value: 'pending', title: 'Ожидает' },
  { value: 'completed', title: 'Завершена' },
  { value: 'cancelled', title: 'Отменена' },
]);

// Фильтрация
const filteredOperations = computed(() => {
  let result = [...props.operations];

  if (filters.value.type) {
    result = result.filter(op => op.type === filters.value.type);
  }
  if (filters.value.status) {
    result = result.filter(op => op.status === filters.value.status);
  }
  if (filters.value.date_from) {
    result = result.filter(op => 
      new Date(op.created_at) >= new Date(filters.value.date_from!)
    );
  }
  if (filters.value.date_to) {
    result = result.filter(op => 
      new Date(op.created_at) <= new Date(filters.value.date_to!)
    );
  }

  // Сортировка по дате (новые сверху)
  result.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return result;
});

// Пагинация
const totalPages = computed(() => 
  Math.ceil(filteredOperations.value.length / itemsPerPage.value)
);

const paginatedOperations = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredOperations.value.slice(start, end);
});

// Методы
const applyFilters = () => {
  currentPage.value = 1;
};

const clearFilters = () => {
  filters.value = {
    type: undefined,
    status: undefined,
    date_from: '',
    date_to: '',
  };
  currentPage.value = 1;
};

const updatePage = (page: number) => {
  currentPage.value = page;
};

const getOperationIcon = (type: string) => 
  WAREHOUSE_OPERATION_TYPE_ICONS[type as keyof typeof WAREHOUSE_OPERATION_TYPE_ICONS] || 'mdi-swap-horizontal';

const getOperationLabel = (type: string) => 
  WAREHOUSE_OPERATION_TYPE_LABELS[type as keyof typeof WAREHOUSE_OPERATION_TYPE_LABELS] || type;

const getOperationColor = (type: string) => {
  const colorMap: Record<string, string> = {
    receive: 'success',
    issue: 'info',
    transfer: 'warning',
    inventory: 'purple',
    maintenance: 'orange',
    disposal: 'error',
  };
  return colorMap[type] || 'grey';
};

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'Ожидает',
    completed: 'Завершена',
    cancelled: 'Отменена',
  };
  return statusMap[status] || status;
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('ru-RU');
};

// Обработчики событий
const handleOperationCreated = () => {
  showCreateDialog.value = false;
  emit('refresh');
};

// Сброс страницы при изменении фильтров
watch(filters, () => {
  currentPage.value = 1;
}, { deep: true });
</script>

<style scoped>
.warehouse-operations {
  height: 100%;
}

.operations-list {
  max-height: 600px;
  overflow-y: auto;
}

.operation-card {
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.operation-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.operation-details {
  padding-left: 8px;
}

.equipment-info,
.location-info,
.user-info,
.document-info,
.notes-info {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.equipment-info:last-child,
.location-info:last-child,
.user-info:last-child,
.document-info:last-child,
.notes-info:last-child {
  margin-bottom: 0;
}

/* Стили для timeline */
:deep(.v-timeline-item__body) {
  padding-bottom: 16px;
}

:deep(.v-timeline-item__dot) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Адаптивность */
@media (max-width: 768px) {
  .operations-list {
    max-height: 500px;
  }
  
  .operation-details {
    padding-left: 0;
  }
}
</style>
