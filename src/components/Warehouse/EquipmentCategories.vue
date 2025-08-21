<template>
  <div class="equipment-categories">
    <!-- Заголовок и действия -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="d-flex align-center">
        <v-icon icon="mdi-tag-multiple" class="mr-2" />
        <span class="text-h6">Категории оборудования</span>
        <v-chip class="ml-2" size="small">
          {{ filteredCategories.length }}
        </v-chip>
      </div>
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
          color="success"
          prepend-icon="mdi-plus"
          @click="showCreateDialog = true"
        >
          Добавить категорию
        </v-btn>
      </div>
    </div>

    <!-- Фильтры -->
    <v-card class="mb-4" elevation="1">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchQuery"
              label="Поиск по названию или коду"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              clearable
              @input="debouncedSearch"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-switch
              v-model="showOnlyActive"
              label="Только активные"
              color="success"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-switch
              v-model="showLowStock"
              label="С низкими остатками"
              color="warning"
              density="comfortable"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Список категорий -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="64" />
      <div class="mt-4">Загрузка категорий...</div>
    </div>

    <div v-else-if="filteredCategories.length === 0" class="text-center py-8">
      <v-icon icon="mdi-tag-off" size="64" color="grey" />
      <div class="text-h6 mt-4">Категории не найдены</div>
      <div class="text-body-2 text-medium-emphasis">
        Попробуйте изменить параметры поиска или создать новую категорию
      </div>
    </div>

    <v-row v-else>
      <v-col
        v-for="category in filteredCategories"
        :key="category.id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card
          class="category-card"
          :class="{ 'category-card--inactive': !category.is_active }"
          elevation="2"
        >
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon icon="mdi-tag" class="mr-2" />
              <div>
                <div class="text-subtitle-1 font-weight-bold">{{ category.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ category.code }}</div>
              </div>
            </div>
            <v-menu>
              <template #activator="{ props }">
                <v-btn
                  icon="mdi-dots-vertical"
                  variant="text"
                  size="small"
                  v-bind="props"
                />
              </template>
              <v-list density="compact">
                <v-list-item @click="editCategory(category)">
                  <template #prepend>
                    <v-icon icon="mdi-pencil" />
                  </template>
                  <v-list-item-title>Редактировать</v-list-item-title>
                </v-list-item>
                <v-list-item @click="toggleCategoryStatus(category)">
                  <template #prepend>
                    <v-icon :icon="category.is_active ? 'mdi-pause' : 'mdi-play'" />
                  </template>
                  <v-list-item-title>
                    {{ category.is_active ? 'Деактивировать' : 'Активировать' }}
                  </v-list-item-title>
                </v-list-item>
                <v-divider />
                <v-list-item @click="deleteCategory(category)">
                  <template #prepend>
                    <v-icon icon="mdi-delete" color="error" />
                  </template>
                  <v-list-item-title>Удалить</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-card-title>

          <v-card-text>
            <div class="category-info">
              <div v-if="category.description" class="description mb-3">
                <div class="text-body-2">{{ category.description }}</div>
              </div>

              <div class="stock-info">
                <div class="d-flex align-center justify-space-between mb-2">
                  <span class="text-caption text-medium-emphasis">Минимальный остаток:</span>
                  <v-chip
                    :color="getStockLevelColor(category)"
                    size="small"
                    variant="tonal"
                  >
                    {{ category.min_stock_level }}
                  </v-chip>
                </div>

                <div class="d-flex align-center justify-space-between">
                  <span class="text-caption text-medium-emphasis">Текущий остаток:</span>
                  <v-chip
                    :color="getCurrentStockColor(category)"
                    size="small"
                    variant="outlined"
                  >
                    {{ getCurrentStock(category) }}
                  </v-chip>
                </div>
              </div>

              <!-- Индикатор статуса -->
              <div class="status-indicator mt-3">
                <v-chip
                  :color="category.is_active ? 'success' : 'grey'"
                  size="small"
                  variant="tonal"
                >
                  <v-icon
                    :icon="category.is_active ? 'mdi-check-circle' : 'mdi-pause-circle'"
                    start
                    size="14"
                  />
                  {{ category.is_active ? 'Активна' : 'Неактивна' }}
                </v-chip>
              </div>

              <!-- Предупреждение о низком остатке -->
              <v-alert
                v-if="isLowStock(category)"
                type="warning"
                variant="tonal"
                density="compact"
                class="mt-3"
              >
                <template #prepend>
                  <v-icon icon="mdi-alert" />
                </template>
                Низкий остаток!
              </v-alert>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn
              color="primary"
              variant="outlined"
              size="small"
              block
              @click="viewCategoryDetails(category)"
            >
              Подробнее
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Диалоги -->
    <EquipmentCategoryDialog
      v-model="showCreateDialog"
      @created="handleCategoryCreated"
    />

    <EquipmentCategoryDialog
      v-model="showEditDialog"
      :category="selectedCategory"
      @updated="handleCategoryUpdated"
    />

    <EquipmentCategoryViewDialog
      v-model="showDetailsDialog"
      :category="selectedCategory"
    />

    <ConfirmDialog
      v-model="showDeleteDialog"
      title="Удаление категории"
      :text="`Вы уверены, что хотите удалить категорию '${selectedCategory?.name}'?`"
      confirm-text="Удалить"
      confirm-color="error"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { debounce } from 'lodash-es';
import type { EquipmentBase, EquipmentCategory } from '@/types/warehouse';

// Импорт компонентов
import EquipmentCategoryDialog from './EquipmentCategoryDialog.vue';
import EquipmentCategoryViewDialog from './EquipmentCategoryViewDialog.vue';
import ConfirmDialog from '@/components/Common/ConfirmDialog.vue';

// Props
interface Props {
  categories: EquipmentCategory[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

// Emits
const emit = defineEmits<{
  create: [category: Omit<EquipmentCategory, 'id' | 'created_at' | 'updated_at'>];
  edit: [id: number, category: Partial<EquipmentCategory>];
  delete: [id: number];
  refresh: [];
}>();

// Состояние
const searchQuery = ref('');
const showOnlyActive = ref(true);
const showLowStock = ref(false);

// Диалоги
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showDetailsDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedCategory = ref<EquipmentCategory | null>(null);

// Mock данные для подсчета остатков (в реальном приложении будут загружаться с сервера)
const mockEquipmentCounts: Record<number, number> = {
  1: 25, // GPS-трекеры
  2: 8,  // IP-камеры  
  3: 15, // Датчики
  4: 3,  // Кабели
  5: 12, // Коммутаторы
};

// Фильтрация
const filteredCategories = computed(() => {
  let result = [...props.categories];

  // Поиск
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase();
    result = result.filter(cat => 
      cat.name.toLowerCase().includes(search) ||
      cat.code.toLowerCase().includes(search) ||
      cat.description.toLowerCase().includes(search)
    );
  }

  // Только активные
  if (showOnlyActive.value) {
    result = result.filter(cat => cat.is_active);
  }

  // Только с низкими остатками
  if (showLowStock.value) {
    result = result.filter(cat => isLowStock(cat));
  }

  return result;
});

// Методы
const debouncedSearch = debounce(() => {
  // Поиск уже реактивный через computed
}, 300);

const getCurrentStock = (category: EquipmentCategory) => {
  return mockEquipmentCounts[category.id] || 0;
};

const isLowStock = (category: EquipmentCategory) => {
  const currentStock = getCurrentStock(category);
  return currentStock < category.min_stock_level;
};

const getStockLevelColor = (category: EquipmentCategory) => {
  return isLowStock(category) ? 'error' : 'success';
};

const getCurrentStockColor = (category: EquipmentCategory) => {
  const currentStock = getCurrentStock(category);
  if (currentStock === 0) return 'error';
  if (isLowStock(category)) return 'warning';
  return 'success';
};

// Обработчики действий
const editCategory = (category: EquipmentCategory) => {
  selectedCategory.value = category;
  showEditDialog.value = true;
};

const deleteCategory = (category: EquipmentCategory) => {
  selectedCategory.value = category;
  showDeleteDialog.value = true;
};

const toggleCategoryStatus = (category: EquipmentCategory) => {
  emit('edit', category.id, { is_active: !category.is_active });
};

const viewCategoryDetails = (category: EquipmentCategory) => {
  selectedCategory.value = category;
  showDetailsDialog.value = true;
};

const confirmDelete = () => {
  if (selectedCategory.value) {
    emit('delete', selectedCategory.value.id);
  }
  showDeleteDialog.value = false;
  selectedCategory.value = null;
};

// Обработчики событий диалогов
const handleCategoryCreated = () => {
  showCreateDialog.value = false;
  emit('refresh');
};

const handleCategoryUpdated = () => {
  showEditDialog.value = false;
  selectedCategory.value = null;
  emit('refresh');
};
</script>

<style scoped>
.equipment-categories {
  height: 100%;
}

.category-card {
  height: 100%;
  transition: all 0.3s ease;
  position: relative;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.category-card--inactive {
  opacity: 0.6;
  border: 2px dashed rgba(var(--v-theme-outline), 0.5);
}

.category-info {
  min-height: 120px;
}

.description {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
  padding: 12px;
}

.stock-info {
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 8px;
  padding: 12px;
}

.status-indicator {
  text-align: center;
}

/* Адаптивность */
@media (max-width: 768px) {
  .category-card {
    margin-bottom: 16px;
  }
}
</style>
