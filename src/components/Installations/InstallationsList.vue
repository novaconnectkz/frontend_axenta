<template>
  <div class="installations-list">
    <!-- Фильтры и поиск -->
    <AppleCard variant="outlined" class="filters-card mb-4">
      <template #header>
        <div class="filters-header">
          <v-icon icon="mdi-filter" class="mr-2" />
          Фильтры и поиск
          <v-spacer />
          <AppleButton
            variant="text"
            size="small"
            @click="clearFilters"
            :disabled="!hasActiveFilters"
          >
            Очистить
          </AppleButton>
        </div>
      </template>
      
      <div class="filters-content">
        <v-row>
          <v-col cols="12" md="3">
            <AppleInput
              v-model="filters.search"
              placeholder="Поиск по объекту, адресу..."
              prepend-icon="mdi-magnify"
              clearable
              @input="debouncedSearch"
            />
          </v-col>
          
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Статус"
              clearable
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.type"
              :items="typeOptions"
              label="Тип работы"
              clearable
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.priority"
              :items="priorityOptions"
              label="Приоритет"
              clearable
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.installer_id"
              :items="installerOptions"
              label="Монтажник"
              clearable
              variant="outlined"
              density="comfortable"
            />
          </v-col>
        </v-row>
        
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.date_from"
              label="Дата от"
              type="date"
              variant="outlined"
              density="comfortable"
              clearable
            />
          </v-col>
          
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.date_to"
              label="Дата до"
              type="date"
              variant="outlined"
              density="comfortable"
              clearable
            />
          </v-col>
          
          <v-col cols="12" md="3">
            <v-checkbox
              v-model="filters.is_billable"
              label="Только платные"
              density="comfortable"
            />
          </v-col>
          
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.ordering"
              :items="sortOptions"
              label="Сортировка"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
        </v-row>
      </div>
    </AppleCard>

    <!-- Список монтажей -->
    <AppleCard variant="outlined">
      <template #header>
        <div class="list-header">
          <v-icon icon="mdi-format-list-bulleted" class="mr-2" />
          Монтажи
          <v-chip class="ml-2" size="small">{{ totalCount }}</v-chip>
          <v-spacer />
          <div class="view-controls">
            <v-btn-toggle
              v-model="viewMode"
              variant="outlined"
              density="compact"
              mandatory
            >
              <v-btn value="table" size="small">
                <v-icon>mdi-table</v-icon>
              </v-btn>
              <v-btn value="cards" size="small">
                <v-icon>mdi-view-grid</v-icon>
              </v-btn>
            </v-btn-toggle>
          </div>
        </div>
      </template>
      
      <!-- Табличный вид -->
      <div v-if="viewMode === 'table'" class="table-view">
        <v-data-table
          :headers="tableHeaders"
          :items="installations"
          :loading="loading"
          :items-per-page="itemsPerPage"
          :page="currentPage"
          :server-items-length="totalCount"
          @update:page="handlePageChange"
          @update:items-per-page="handleItemsPerPageChange"
          @click:row="handleRowClick"
          item-key="id"
          class="installations-table"
          hover
        >
          <!-- Слоты для кастомного отображения колонок -->
          <template #item.type="{ item }">
            <div class="type-cell">
              <v-icon :icon="getTypeIcon(item.type)" size="small" class="mr-2" />
              {{ item.type }}
            </div>
          </template>
          
          <template #item.status="{ item }">
            <v-chip
              :color="getStatusColor(item.status)"
              size="small"
              variant="flat"
            >
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>
          
          <template #item.priority="{ item }">
            <v-chip
              v-if="item.priority !== 'normal'"
              :color="getPriorityColor(item.priority)"
              size="small"
              variant="outlined"
            >
              {{ getPriorityText(item.priority) }}
            </v-chip>
            <span v-else class="text-medium-emphasis">Обычный</span>
          </template>
          
          <template #item.scheduled_at="{ item }">
            <div class="datetime-cell">
              <div class="date">{{ formatDate(item.scheduled_at) }}</div>
              <div class="time">{{ formatTime(item.scheduled_at) }}</div>
            </div>
          </template>
          
          <template #item.object="{ item }">
            <div class="object-cell">
              <div class="object-name">{{ item.object.name }}</div>
              <div class="object-details">
                <span v-if="item.object.imei" class="text-caption">
                  IMEI: {{ item.object.imei }}
                </span>
              </div>
            </div>
          </template>
          
          <template #item.installer="{ item }">
            <div class="installer-cell">
              <v-avatar size="24" class="mr-2">
                <v-icon icon="mdi-account-hard-hat" />
              </v-avatar>
              {{ item.installer.first_name }} {{ item.installer.last_name }}
            </div>
          </template>
          
          <template #item.estimated_duration="{ item }">
            {{ formatDuration(item.estimated_duration) }}
          </template>
          
          <template #item.cost="{ item }">
            <span v-if="item.is_billable && item.cost">
              {{ formatCurrency(item.cost) }}
            </span>
            <span v-else class="text-medium-emphasis">—</span>
          </template>
          
          <template #item.actions="{ item }">
            <div class="actions-cell">
              <v-btn
                v-if="item.status === 'planned'"
                icon="mdi-play"
                size="small"
                variant="text"
                color="success"
                @click.stop="$emit('installation-start', item)"
              />
              
              <v-btn
                v-if="item.status === 'in_progress'"
                icon="mdi-check"
                size="small"
                variant="text"
                color="primary"
                @click.stop="$emit('installation-complete', item)"
              />
              
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                @click.stop="$emit('installation-edit', item)"
              />
              
              <v-menu>
                <template #activator="{ props }">
                  <v-btn
                    icon="mdi-dots-vertical"
                    size="small"
                    variant="text"
                    v-bind="props"
                    @click.stop
                  />
                </template>
                
                <v-list density="compact">
                  <v-list-item
                    v-if="item.status !== 'completed'"
                    prepend-icon="mdi-close"
                    title="Отменить"
                    @click="$emit('installation-cancel', item)"
                  />
                  <v-list-item
                    prepend-icon="mdi-delete"
                    title="Удалить"
                    @click="$emit('installation-delete', item)"
                  />
                </v-list>
              </v-menu>
            </div>
          </template>
        </v-data-table>
      </div>
      
      <!-- Карточный вид -->
      <div v-if="viewMode === 'cards'" class="cards-view">
        <div v-if="loading" class="loading-state">
          <v-progress-circular indeterminate />
          <p class="mt-4">Загрузка монтажей...</p>
        </div>
        
        <div v-else-if="installations.length === 0" class="empty-state">
          <v-icon icon="mdi-calendar-blank" size="64" class="mb-4" />
          <h3>Монтажи не найдены</h3>
          <p class="text-medium-emphasis">
            Попробуйте изменить фильтры или создать новый монтаж
          </p>
        </div>
        
        <div v-else class="cards-grid">
          <InstallationCard
            v-for="installation in installations"
            :key="installation.id"
            :installation="installation"
            @click="$emit('installation-click', installation)"
            @edit="$emit('installation-edit', installation)"
            @start="$emit('installation-start', installation)"
            @complete="$emit('installation-complete', installation)"
            @cancel="$emit('installation-cancel', installation)"
            @delete="$emit('installation-delete', installation)"
          />
        </div>
        
        <!-- Пагинация для карточного вида -->
        <div v-if="totalPages > 1" class="cards-pagination">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            @update:model-value="handlePageChange"
          />
        </div>
      </div>
    </AppleCard>
  </div>
</template>

<script setup lang="ts">
import AppleButton from "@/components/Apple/AppleButton.vue";
import AppleCard from "@/components/Apple/AppleCard.vue";
import AppleInput from "@/components/Apple/AppleInput.vue";
import type { InstallationFilters, InstallationWithRelations } from "@/types/installations";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { debounce } from "lodash-es";
import { computed, ref, watch } from "vue";
import InstallationCard from "./InstallationCard.vue";

interface Props {
  installations: InstallationWithRelations[];
  loading?: boolean;
  totalCount?: number;
}

interface Emits {
  (e: "installation-click", installation: InstallationWithRelations): void;
  (e: "installation-edit", installation: InstallationWithRelations): void;
  (e: "installation-delete", installation: InstallationWithRelations): void;
  (e: "installation-start", installation: InstallationWithRelations): void;
  (e: "installation-complete", installation: InstallationWithRelations): void;
  (e: "installation-cancel", installation: InstallationWithRelations): void;
  (e: "filters-change", filters: InstallationFilters): void;
  (e: "page-change", page: number): void;
  (e: "items-per-page-change", itemsPerPage: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  totalCount: 0,
});

const emit = defineEmits<Emits>();

// Состояние компонента
const viewMode = ref<"table" | "cards">("table");
const currentPage = ref(1);
const itemsPerPage = ref(25);

// Фильтры
const filters = ref<InstallationFilters>({
  search: "",
  status: undefined,
  type: undefined,
  priority: undefined,
  installer_id: undefined,
  date_from: "",
  date_to: "",
  is_billable: undefined,
  ordering: "-scheduled_at",
});

// Опции для селектов
const statusOptions = [
  { title: "Запланирован", value: "planned" },
  { title: "Выполняется", value: "in_progress" },
  { title: "Завершен", value: "completed" },
  { title: "Отменен", value: "cancelled" },
];

const typeOptions = [
  { title: "Монтаж", value: "монтаж" },
  { title: "Диагностика", value: "диагностика" },
  { title: "Демонтаж", value: "демонтаж" },
  { title: "Обслуживание", value: "обслуживание" },
];

const priorityOptions = [
  { title: "Низкий", value: "low" },
  { title: "Обычный", value: "normal" },
  { title: "Высокий", value: "high" },
  { title: "Срочный", value: "urgent" },
];

const sortOptions = [
  { title: "Дата (сначала новые)", value: "-scheduled_at" },
  { title: "Дата (сначала старые)", value: "scheduled_at" },
  { title: "Статус", value: "status" },
  { title: "Приоритет", value: "-priority" },
  { title: "Тип работы", value: "type" },
];

// Опции монтажников (получаем из пропсов installations)
const installerOptions = computed(() => {
  const installers = new Map();
  props.installations.forEach(installation => {
    const installer = installation.installer;
    if (!installers.has(installer.id)) {
      installers.set(installer.id, {
        title: `${installer.first_name} ${installer.last_name}`,
        value: installer.id,
      });
    }
  });
  return Array.from(installers.values());
});

// Заголовки таблицы
const tableHeaders = [
  { title: "Тип", key: "type", width: 120 },
  { title: "Статус", key: "status", width: 120 },
  { title: "Приоритет", key: "priority", width: 100 },
  { title: "Дата и время", key: "scheduled_at", width: 140 },
  { title: "Объект", key: "object", width: 200 },
  { title: "Монтажник", key: "installer", width: 180 },
  { title: "Длительность", key: "estimated_duration", width: 120 },
  { title: "Стоимость", key: "cost", width: 120 },
  { title: "Действия", key: "actions", width: 120, sortable: false },
];

// Вычисляемые свойства
const hasActiveFilters = computed(() => {
  return filters.value.search !== "" ||
         filters.value.status !== undefined ||
         filters.value.type !== undefined ||
         filters.value.priority !== undefined ||
         filters.value.installer_id !== undefined ||
         filters.value.date_from !== "" ||
         filters.value.date_to !== "" ||
         filters.value.is_billable !== undefined;
});

const totalPages = computed(() => {
  return Math.ceil(props.totalCount / itemsPerPage.value);
});

// Дебаунсированный поиск
const debouncedSearch = debounce(() => {
  emit("filters-change", { ...filters.value });
}, 300);

// Функции форматирования
const formatDate = (dateString: string): string => {
  return format(new Date(dateString), "dd.MM.yyyy", { locale: ru });
};

const formatTime = (dateString: string): string => {
  return format(new Date(dateString), "HH:mm", { locale: ru });
};

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}ч ${mins}м`;
  }
  return `${mins}м`;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
  }).format(amount);
};

// Функции для получения цветов и текстов
const getStatusColor = (status: string): string => {
  switch (status) {
    case "planned":
      return "info";
    case "in_progress":
      return "warning";
    case "completed":
      return "success";
    case "cancelled":
      return "error";
    default:
      return "default";
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case "planned":
      return "Запланирован";
    case "in_progress":
      return "Выполняется";
    case "completed":
      return "Завершен";
    case "cancelled":
      return "Отменен";
    default:
      return status;
  }
};

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case "urgent":
      return "error";
    case "high":
      return "warning";
    case "low":
      return "info";
    default:
      return "default";
  }
};

const getPriorityText = (priority: string): string => {
  switch (priority) {
    case "urgent":
      return "Срочный";
    case "high":
      return "Высокий";
    case "low":
      return "Низкий";
    case "normal":
      return "Обычный";
    default:
      return priority;
  }
};

const getTypeIcon = (type: string): string => {
  switch (type) {
    case "монтаж":
      return "mdi-tools";
    case "диагностика":
      return "mdi-stethoscope";
    case "демонтаж":
      return "mdi-wrench";
    case "обслуживание":
      return "mdi-cog";
    default:
      return "mdi-tools";
  }
};

// Обработчики событий
const handleRowClick = (_event: Event, { item }: { item: InstallationWithRelations }) => {
  emit("installation-click", item);
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  emit("page-change", page);
};

const handleItemsPerPageChange = (itemsPerPageValue: number) => {
  itemsPerPage.value = itemsPerPageValue;
  emit("items-per-page-change", itemsPerPageValue);
};

const clearFilters = () => {
  filters.value = {
    search: "",
    status: undefined,
    type: undefined,
    priority: undefined,
    installer_id: undefined,
    date_from: "",
    date_to: "",
    is_billable: undefined,
    ordering: "-scheduled_at",
  };
  emit("filters-change", { ...filters.value });
};

// Отслеживание изменений фильтров
watch(filters, (newFilters) => {
  if (newFilters.search === filters.value.search) {
    // Для остальных фильтров обновляем сразу
    emit("filters-change", { ...newFilters });
  }
}, { deep: true });
</script>

<style scoped>
.installations-list {
  width: 100%;
}

.filters-card {
  margin-bottom: 16px;
}

.filters-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.filters-content {
  padding: 16px 0;
}

.list-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.view-controls {
  margin-left: auto;
}

/* Табличный вид */
.table-view {
  overflow-x: auto;
}

.installations-table :deep(.v-data-table__tr) {
  cursor: pointer;
}

.installations-table :deep(.v-data-table__tr:hover) {
  background-color: rgb(var(--v-theme-surface-variant));
}

.type-cell {
  display: flex;
  align-items: center;
}

.datetime-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.datetime-cell .date {
  font-weight: 500;
}

.datetime-cell .time {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.object-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.object-name {
  font-weight: 500;
}

.object-details {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.installer-cell {
  display: flex;
  align-items: center;
}

.actions-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Карточный вид */
.cards-view {
  padding: 16px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.cards-pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

/* Адаптивность */
@media (max-width: 768px) {
  .filters-content .v-row {
    gap: 8px;
  }
  
  .list-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .view-controls {
    margin-left: 0;
    align-self: center;
  }
  
  .cards-grid {
    grid-template-columns: 1fr;
  }
  
  .table-view {
    font-size: 0.875rem;
  }
  
  .installations-table :deep(.v-data-table-header) {
    font-size: 0.75rem;
  }
}
</style>
