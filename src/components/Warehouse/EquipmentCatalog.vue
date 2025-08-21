<template>
  <div class="equipment-catalog">
    <!-- Фильтры и поиск -->
    <v-card class="mb-4" elevation="1">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="searchQuery"
              label="Поиск"
              placeholder="Серийный номер, IMEI, модель..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              clearable
              @input="debouncedSearch"
            />
          </v-col>
          <v-col cols="12" md="2">
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
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.condition"
              label="Состояние"
              :items="conditionOptions"
              variant="outlined"
              density="comfortable"
              clearable
              @update:model-value="applyFilters"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.category_id"
              label="Категория"
              :items="categoryOptions"
              variant="outlined"
              density="comfortable"
              clearable
              @update:model-value="applyFilters"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.type"
              label="Тип"
              :items="typeOptions"
              variant="outlined"
              density="comfortable"
              clearable
              @update:model-value="applyFilters"
            />
          </v-col>
          <v-col cols="12" md="1">
            <v-btn
              icon="mdi-filter-off"
              variant="outlined"
              @click="clearFilters"
              title="Очистить фильтры"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="6">
            <div class="d-flex align-center ga-2">
              <v-switch
                v-model="filters.available"
                label="Только доступное"
                color="success"
                density="comfortable"
                @update:model-value="applyFilters"
              />
              <v-switch
                v-model="showGrid"
                label="Сетка"
                color="primary"
                density="comfortable"
              />
            </div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="d-flex align-center justify-end ga-2">
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
                color="success"
                prepend-icon="mdi-plus"
                @click="showCreateDialog = true"
              >
                Добавить
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Результаты -->
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon icon="mdi-package-variant" class="mr-2" />
          Каталог оборудования
          <v-chip class="ml-2" size="small">
            {{ filteredEquipment.length }} из {{ equipment.length }}
          </v-chip>
        </div>
        <div class="d-flex align-center ga-2">
          <v-btn-toggle v-model="sortBy" mandatory variant="outlined" density="comfortable">
            <v-btn value="created_at" size="small">
              <v-icon icon="mdi-clock" />
              Дата
            </v-btn>
            <v-btn value="model" size="small">
              <v-icon icon="mdi-alphabetical" />
              Модель
            </v-btn>
            <v-btn value="status" size="small">
              <v-icon icon="mdi-state-machine" />
              Статус
            </v-btn>
          </v-btn-toggle>
          <v-btn
            :icon="sortOrder === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending'"
            variant="outlined"
            size="small"
            @click="toggleSortOrder"
          />
        </div>
      </v-card-title>

      <v-card-text>
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="64" />
          <div class="mt-4">Загрузка оборудования...</div>
        </div>

        <div v-else-if="filteredEquipment.length === 0" class="text-center py-8">
          <v-icon icon="mdi-package-variant-closed" size="64" color="grey" />
          <div class="text-h6 mt-4">Оборудование не найдено</div>
          <div class="text-body-2 text-medium-emphasis">
            Попробуйте изменить параметры поиска или добавить новое оборудование
          </div>
        </div>

        <!-- Сетка карточек -->
        <div v-else-if="showGrid" class="equipment-grid">
          <v-row>
            <v-col
              v-for="item in paginatedEquipment"
              :key="item.id"
              cols="12"
              sm="6"
              md="4"
              lg="3"
            >
              <!-- Временная карточка оборудования -->
              <v-card elevation="2" class="equipment-card-temp">
                <v-card-title class="text-subtitle-1">
                  <v-icon :icon="getTypeIcon(item.type)" class="mr-2" />
                  {{ item.model }}
                </v-card-title>
                <v-card-text>
                  <div class="mb-2">
                    <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
                      {{ getStatusLabel(item.status) }}
                    </v-chip>
                  </div>
                  <div class="text-body-2">{{ item.brand }}</div>
                  <div class="text-caption">S/N: {{ item.serial_number }}</div>
                  <div v-if="item.warehouse_location" class="text-caption">
                    Локация: {{ item.warehouse_location }}
                  </div>
                </v-card-text>
                <v-card-actions>
                  <v-btn size="small" @click="showEquipmentDetails(item)">Подробнее</v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Таблица -->
        <div v-else class="equipment-table">
          <v-data-table
            :headers="tableHeaders"
            :items="paginatedEquipment"
            :loading="loading"
            item-key="id"
            class="elevation-0"
            :items-per-page="itemsPerPage"
            hide-default-footer
          >
            <template #item.status="{ item }">
              <v-chip
                :color="getStatusColor(item.status)"
                size="small"
                variant="tonal"
              >
                {{ getStatusLabel(item.status) }}
              </v-chip>
            </template>

            <template #item.condition="{ item }">
              <v-chip
                :color="getConditionColor(item.condition)"
                size="small"
                variant="outlined"
              >
                {{ getConditionLabel(item.condition) }}
              </v-chip>
            </template>

            <template #item.category="{ item }">
              <v-chip
                v-if="item.category"
                color="primary"
                size="small"
                variant="outlined"
              >
                {{ item.category.name }}
              </v-chip>
              <span v-else class="text-medium-emphasis">—</span>
            </template>

            <template #item.purchase_price="{ item }">
              <span class="font-weight-medium">
                {{ formatPrice(item.purchase_price) }}
              </span>
            </template>

            <template #item.warranty_until="{ item }">
              <span v-if="item.warranty_until" :class="getWarrantyClass(item.warranty_until)">
                {{ formatDate(item.warranty_until) }}
              </span>
              <span v-else class="text-medium-emphasis">—</span>
            </template>

            <template #item.actions="{ item }">
              <div class="d-flex align-center ga-1">
                <v-btn
                  icon="mdi-eye"
                  variant="text"
                  size="small"
                  @click="showEquipmentDetails(item)"
                  title="Просмотр"
                />
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  size="small"
                  @click="editEquipment(item)"
                  title="Редактировать"
                />
                <v-btn
                  v-if="item.status === 'in_stock'"
                  icon="mdi-arrow-right"
                  variant="text"
                  size="small"
                  color="success"
                  @click="installEquipment(item)"
                  title="Установить"
                />
                <v-btn
                  v-if="item.status === 'installed'"
                  icon="mdi-arrow-left"
                  variant="text"
                  size="small"
                  color="warning"
                  @click="$emit('uninstall', item.id)"
                  title="Снять"
                />
                <v-btn
                  icon="mdi-swap-horizontal"
                  variant="text"
                  size="small"
                  color="info"
                  @click="transferEquipment(item)"
                  title="Переместить"
                />
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  color="error"
                  @click="deleteEquipment(item)"
                  title="Удалить"
                  :disabled="item.status === 'installed'"
                />
              </div>
            </template>
          </v-data-table>
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

    <!-- Диалоги -->
    <EquipmentDialog
      v-model="showCreateDialog"
      :categories="categories"
      @created="handleEquipmentCreated"
    />

    <EquipmentDialog
      v-model="showEditDialog"
      :equipment="selectedEquipment"
      :categories="categories"
      @updated="handleEquipmentUpdated"
    />

    <EquipmentViewDialog
      v-model="showDetailsDialog"
      :equipment="selectedEquipment"
    />

    <!-- <EquipmentInstallDialog
      v-model="showInstallDialog"
      :equipment="selectedEquipment"
      @installed="handleEquipmentInstalled"
    />

    <EquipmentTransferDialog
      v-model="showTransferDialog"
      :equipment="selectedEquipment"
      @transferred="handleEquipmentTransferred"
    /> -->

    <ConfirmDialog
      v-model="showDeleteDialog"
      title="Удаление оборудования"
      :text="`Вы уверены, что хотите удалить оборудование '${selectedEquipment?.model} ${selectedEquipment?.serial_number}'?`"
      confirm-text="Удалить"
      confirm-color="error"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { debounce } from 'lodash-es';
import type {
  EquipmentBase,
  EquipmentCategory,
  EquipmentFilters,
  EquipmentForm,
  EquipmentInstallForm,
  EquipmentTransferForm,
} from '@/types/warehouse';
import {
  EQUIPMENT_STATUS_COLORS,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_CONDITION_COLORS,
  EQUIPMENT_CONDITION_LABELS,
  EQUIPMENT_TYPE_OPTIONS,
} from '@/types/warehouse';

// Импорт компонентов
// import EquipmentCard from './EquipmentCard.vue';
import EquipmentDialog from './EquipmentDialog.vue';
import EquipmentViewDialog from './EquipmentViewDialog.vue';
// import EquipmentInstallDialog from './EquipmentInstallDialog.vue';
// import EquipmentTransferDialog from './EquipmentTransferDialog.vue';
import ConfirmDialog from '@/components/Common/ConfirmDialog.vue';

// Props
interface Props {
  equipment: EquipmentBase[];
  categories: EquipmentCategory[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

// Emits
const emit = defineEmits<{
  create: [equipment: EquipmentForm];
  edit: [id: number, equipment: Partial<EquipmentForm>];
  delete: [id: number];
  install: [id: number, data: EquipmentInstallForm];
  uninstall: [id: number];
  transfer: [data: EquipmentTransferForm];
  refresh: [];
}>();

// Состояние
const searchQuery = ref('');
const showGrid = ref(true);
const currentPage = ref(1);
const itemsPerPage = ref(12);
const sortBy = ref('created_at');
const sortOrder = ref<'asc' | 'desc'>('desc');

// Фильтры
const filters = ref<EquipmentFilters>({
  status: undefined,
  condition: undefined,
  category_id: undefined,
  type: undefined,
  available: false,
});

// Диалоги
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showDetailsDialog = ref(false);
const showInstallDialog = ref(false);
const showTransferDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedEquipment = ref<EquipmentBase | null>(null);

// Опции для селектов
const statusOptions = computed(() => 
  Object.entries(EQUIPMENT_STATUS_LABELS).map(([value, title]) => ({
    value,
    title,
  }))
);

const conditionOptions = computed(() => 
  Object.entries(EQUIPMENT_CONDITION_LABELS).map(([value, title]) => ({
    value,
    title,
  }))
);

const categoryOptions = computed(() => 
  props.categories.map(cat => ({
    value: cat.id,
    title: cat.name,
  }))
);

const typeOptions = computed(() => EQUIPMENT_TYPE_OPTIONS);

// Заголовки таблицы
const tableHeaders = [
  { title: 'QR', key: 'qr_code', width: '80px' },
  { title: 'Модель', key: 'model', sortable: true },
  { title: 'Бренд', key: 'brand', sortable: true },
  { title: 'Серийный №', key: 'serial_number', sortable: true },
  { title: 'IMEI', key: 'imei' },
  { title: 'Статус', key: 'status', sortable: true },
  { title: 'Состояние', key: 'condition', sortable: true },
  { title: 'Категория', key: 'category' },
  { title: 'Локация', key: 'warehouse_location', sortable: true },
  { title: 'Цена', key: 'purchase_price', sortable: true },
  { title: 'Гарантия', key: 'warranty_until', sortable: true },
  { title: 'Действия', key: 'actions', sortable: false, width: '200px' },
];

// Фильтрация и сортировка
const filteredEquipment = computed(() => {
  let result = [...props.equipment];

  // Поиск
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase();
    result = result.filter(item => 
      item.serial_number.toLowerCase().includes(search) ||
      item.model.toLowerCase().includes(search) ||
      item.brand.toLowerCase().includes(search) ||
      item.imei.toLowerCase().includes(search) ||
      item.phone_number.includes(search) ||
      item.qr_code.toLowerCase().includes(search)
    );
  }

  // Фильтры
  if (filters.value.status) {
    result = result.filter(item => item.status === filters.value.status);
  }
  if (filters.value.condition) {
    result = result.filter(item => item.condition === filters.value.condition);
  }
  if (filters.value.category_id) {
    result = result.filter(item => item.category_id === filters.value.category_id);
  }
  if (filters.value.type) {
    result = result.filter(item => item.type === filters.value.type);
  }
  if (filters.value.available) {
    result = result.filter(item => 
      item.status === 'in_stock' && 
      item.condition !== 'broken' && 
      item.condition !== 'damaged'
    );
  }

  // Сортировка
  result.sort((a, b) => {
    let aValue: any = a[sortBy.value as keyof EquipmentBase];
    let bValue: any = b[sortBy.value as keyof EquipmentBase];

    // Обработка специальных случаев
    if (sortBy.value === 'category') {
      aValue = a.category?.name || '';
      bValue = b.category?.name || '';
    }

    // Преобразование в строки для сравнения
    aValue = String(aValue || '').toLowerCase();
    bValue = String(bValue || '').toLowerCase();

    const comparison = aValue.localeCompare(bValue);
    return sortOrder.value === 'asc' ? comparison : -comparison;
  });

  return result;
});

// Пагинация
const totalPages = computed(() => 
  Math.ceil(filteredEquipment.value.length / itemsPerPage.value)
);

const paginatedEquipment = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredEquipment.value.slice(start, end);
});

// Методы
const debouncedSearch = debounce(() => {
  currentPage.value = 1;
}, 300);

const applyFilters = () => {
  currentPage.value = 1;
};

const clearFilters = () => {
  searchQuery.value = '';
  filters.value = {
    status: undefined,
    condition: undefined,
    category_id: undefined,
    type: undefined,
    available: false,
  };
  currentPage.value = 1;
};

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
};

const updatePage = (page: number) => {
  currentPage.value = page;
};

// Утилиты
const getStatusColor = (status: string) => 
  EQUIPMENT_STATUS_COLORS[status as keyof typeof EQUIPMENT_STATUS_COLORS] || 'grey';

const getStatusLabel = (status: string) => 
  EQUIPMENT_STATUS_LABELS[status as keyof typeof EQUIPMENT_STATUS_LABELS] || status;

const getConditionColor = (condition: string) => 
  EQUIPMENT_CONDITION_COLORS[condition as keyof typeof EQUIPMENT_CONDITION_COLORS] || 'grey';

const getConditionLabel = (condition: string) => 
  EQUIPMENT_CONDITION_LABELS[condition as keyof typeof EQUIPMENT_CONDITION_LABELS] || condition;

const getTypeIcon = (type: string) => {
  const typeOption = EQUIPMENT_TYPE_OPTIONS.find(opt => opt.value === type);
  return typeOption?.icon || 'mdi-package-variant';
};

const formatPrice = (price: string) => {
  const num = parseFloat(price);
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(num);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU');
};

const getWarrantyClass = (warrantyDate: string) => {
  const date = new Date(warrantyDate);
  const now = new Date();
  const monthsLeft = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  if (monthsLeft < 0) return 'text-error';
  if (monthsLeft < 3) return 'text-warning';
  return '';
};

// Обработчики действий
const showEquipmentDetails = (equipment: EquipmentBase) => {
  selectedEquipment.value = equipment;
  showDetailsDialog.value = true;
};

const editEquipment = (equipment: EquipmentBase) => {
  selectedEquipment.value = equipment;
  showEditDialog.value = true;
};

const installEquipment = (equipment: EquipmentBase) => {
  selectedEquipment.value = equipment;
  showInstallDialog.value = true;
};

const transferEquipment = (equipment: EquipmentBase) => {
  selectedEquipment.value = equipment;
  showTransferDialog.value = true;
};

const deleteEquipment = (equipment: EquipmentBase) => {
  selectedEquipment.value = equipment;
  showDeleteDialog.value = true;
};

const confirmDelete = () => {
  if (selectedEquipment.value) {
    emit('delete', selectedEquipment.value.id);
  }
  showDeleteDialog.value = false;
  selectedEquipment.value = null;
};

// Обработчики событий диалогов
const handleEquipmentCreated = () => {
  showCreateDialog.value = false;
  emit('refresh');
};

const handleEquipmentUpdated = () => {
  showEditDialog.value = false;
  selectedEquipment.value = null;
  emit('refresh');
};

const handleEquipmentInstalled = (data: EquipmentInstallForm) => {
  if (selectedEquipment.value) {
    emit('install', selectedEquipment.value.id, data);
  }
  showInstallDialog.value = false;
  selectedEquipment.value = null;
};

const handleEquipmentTransferred = (data: EquipmentTransferForm) => {
  emit('transfer', data);
  showTransferDialog.value = false;
  selectedEquipment.value = null;
};

// Сброс страницы при изменении фильтров
watch([searchQuery, filters], () => {
  currentPage.value = 1;
}, { deep: true });
</script>

<style scoped>
.equipment-catalog {
  height: 100%;
}

.equipment-grid {
  min-height: 400px;
}

.equipment-table {
  min-height: 400px;
}

/* Стили для статусов в таблице */
:deep(.v-data-table__td) {
  padding: 8px 16px !important;
}

/* Адаптивность */
@media (max-width: 768px) {
  .equipment-grid .v-col {
    padding: 4px;
  }
}
</style>
