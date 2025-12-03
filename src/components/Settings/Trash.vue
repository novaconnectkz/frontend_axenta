<template>
  <div class="trash-container">
    <!-- Заголовок и статистика -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-4">
          <div>
            <h2 class="text-h5 font-weight-bold">Корзина удаленных элементов</h2>
            <p class="text-body-2 text-medium-emphasis mt-1">
              Просмотр, восстановление и окончательное удаление элементов
            </p>
          </div>
          
          <v-btn
            v-if="selectedItems.length > 0"
            color="error"
            variant="outlined"
            prepend-icon="mdi-delete-forever"
            @click="confirmBulkPermanentDelete"
          >
            Удалить навсегда ({{ selectedItems.length }})
          </v-btn>
        </div>

        <!-- Статистика -->
        <v-row class="stats-cards">
          <v-col cols="12" sm="6" md="3">
            <v-card class="stat-card" elevation="2">
              <v-card-text>
                <div class="d-flex align-center">
                  <v-icon icon="mdi-delete" size="40" color="primary" class="mr-3" />
                  <div>
                    <div class="text-h4 font-weight-bold">{{ stats.total_items }}</div>
                    <div class="text-caption text-medium-emphasis">Всего элементов</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card class="stat-card" elevation="2">
              <v-card-text>
                <div class="d-flex align-center">
                  <v-icon icon="mdi-restore" size="40" color="success" class="mr-3" />
                  <div>
                    <div class="text-h4 font-weight-bold">{{ stats.can_be_restored }}</div>
                    <div class="text-caption text-medium-emphasis">Доступно для восстановления</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card class="stat-card" elevation="2">
              <v-card-text>
                <div class="d-flex align-center">
                  <v-icon icon="mdi-check-circle" size="40" color="info" class="mr-3" />
                  <div>
                    <div class="text-h4 font-weight-bold">{{ stats.restored_count }}</div>
                    <div class="text-caption text-medium-emphasis">Восстановлено</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card class="stat-card" elevation="2">
              <v-card-text>
                <div class="d-flex align-center">
                  <v-icon icon="mdi-shape" size="40" color="warning" class="mr-3" />
                  <div>
                    <div class="text-h4 font-weight-bold">{{ Object.keys(stats.items_by_type).length }}</div>
                    <div class="text-caption text-medium-emphasis">Типов элементов</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Фильтры -->
    <v-card class="mb-4" elevation="2">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              label="Поиск"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              @update:model-value="debouncedSearch"
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="selectedType"
              :items="entityTypes"
              label="Тип элемента"
              prepend-inner-icon="mdi-filter"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              @update:model-value="loadItems"
            />
          </v-col>

          <v-col cols="12" md="5">
            <div class="d-flex flex-column gap-2">
              <v-switch
                v-model="showRestored"
                label="Показать восстановленные"
                color="primary"
                density="compact"
                hide-details
                @update:model-value="loadItems"
              />
              <v-switch
                v-model="showPermanentlyDeleted"
                label="Показать удаленные навсегда"
                color="primary"
                density="compact"
                hide-details
                @update:model-value="loadItems"
              />
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Список элементов -->
    <v-card elevation="2">
      <v-card-text class="pa-0">
        <v-data-table
          v-model="selectedItems"
          :headers="headers"
          :items="items"
          :loading="loading"
          :items-per-page="itemsPerPage"
          :page="currentPage"
          :server-items-length="totalItems"
          show-select
          item-value="id"
          class="trash-table"
          @update:page="onPageChange"
        >
          <!-- Тип элемента -->
          <template #item.entity_type="{ item }">
            <v-chip
              :color="getEntityColor(item.entity_type)"
              :prepend-icon="getEntityIcon(item.entity_type)"
              size="small"
              variant="tonal"
            >
              {{ getEntityLabel(item.entity_type) }}
            </v-chip>
          </template>

          <!-- Название элемента -->
          <template #item.entity_name="{ item }">
            <div class="entity-info">
              <div class="font-weight-medium">{{ item.entity_name }}</div>
              <div v-if="item.entity_description" class="text-caption text-medium-emphasis">
                {{ truncate(item.entity_description, 60) }}
              </div>
            </div>
          </template>

          <!-- Кто удалил -->
          <template #item.deleted_by_name="{ item }">
            <div class="d-flex align-center">
              <v-avatar size="32" class="mr-2" color="primary">
                <span class="text-caption">{{ getInitials(item.deleted_by_name) }}</span>
              </v-avatar>
              <div>
                <div class="text-body-2">{{ item.deleted_by_name }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ formatRelativeTime(item.deleted_at_custom) }}
                </div>
              </div>
            </div>
          </template>

          <!-- Статус -->
          <template #item.status="{ item }">
            <v-chip
              v-if="item.is_permanently_deleted"
              color="error"
              size="small"
              variant="tonal"
            >
              <v-icon icon="mdi-delete-forever" size="small" class="mr-1" />
              Удалено навсегда
            </v-chip>
            <v-chip
              v-else-if="item.is_restored"
              color="success"
              size="small"
              variant="tonal"
            >
              <v-icon icon="mdi-check-circle" size="small" class="mr-1" />
              Восстановлено
            </v-chip>
            <v-chip
              v-else
              color="warning"
              size="small"
              variant="tonal"
            >
              <v-icon icon="mdi-delete-clock" size="small" class="mr-1" />
              В корзине
            </v-chip>
          </template>

          <!-- Действия -->
          <template #item.actions="{ item }">
            <div class="d-flex gap-2">
              <v-tooltip text="Просмотр деталей" location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-eye"
                    size="small"
                    variant="text"
                    @click="viewDetails(item)"
                  />
                </template>
              </v-tooltip>

              <v-tooltip v-if="canRestore(item)" text="Восстановить" location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-restore"
                    size="small"
                    variant="text"
                    color="success"
                    @click="confirmRestore(item)"
                  />
                </template>
              </v-tooltip>

              <v-tooltip v-if="canPermanentlyDelete(item)" text="Удалить навсегда" location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-delete-forever"
                    size="small"
                    variant="text"
                    color="error"
                    @click="confirmPermanentDelete(item)"
                  />
                </template>
              </v-tooltip>
            </div>
          </template>

          <!-- Пустое состояние -->
          <template #no-data>
            <div class="text-center pa-8">
              <v-icon icon="mdi-delete-empty" size="64" color="grey-lighten-1" class="mb-4" />
              <div class="text-h6 text-medium-emphasis mb-2">Корзина пуста</div>
              <div class="text-body-2 text-medium-emphasis">
                Удаленные элементы будут отображаться здесь
              </div>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Диалог деталей элемента -->
    <v-dialog v-model="detailsDialog" max-width="800">
      <v-card v-if="selectedItem">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon :icon="getEntityIcon(selectedItem.entity_type)" size="24" class="mr-2" />
            Детали удаленного элемента
          </div>
          <v-btn icon="mdi-close" variant="text" @click="detailsDialog = false" />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <v-row>
            <v-col cols="12" md="6">
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis mb-1">Тип элемента</div>
                <v-chip
                  :color="getEntityColor(selectedItem.entity_type)"
                  :prepend-icon="getEntityIcon(selectedItem.entity_type)"
                  size="small"
                >
                  {{ getEntityLabel(selectedItem.entity_type) }}
                </v-chip>
              </div>

              <div class="mb-4">
                <div class="text-caption text-medium-emphasis mb-1">Название</div>
                <div class="text-h6">{{ selectedItem.entity_name }}</div>
              </div>

              <div v-if="selectedItem.entity_description" class="mb-4">
                <div class="text-caption text-medium-emphasis mb-1">Описание</div>
                <div class="text-body-2">{{ selectedItem.entity_description }}</div>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis mb-1">Удалил</div>
                <div class="d-flex align-center">
                  <v-avatar size="32" class="mr-2" color="primary">
                    <span class="text-caption">{{ getInitials(selectedItem.deleted_by_name) }}</span>
                  </v-avatar>
                  <div class="text-body-2">{{ selectedItem.deleted_by_name }}</div>
                </div>
              </div>

              <div class="mb-4">
                <div class="text-caption text-medium-emphasis mb-1">Дата удаления</div>
                <div class="text-body-2">{{ formatDate(selectedItem.deleted_at_custom) }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ formatRelativeTime(selectedItem.deleted_at_custom) }}
                </div>
              </div>

              <div v-if="selectedItem.delete_reason" class="mb-4">
                <div class="text-caption text-medium-emphasis mb-1">Причина удаления</div>
                <div class="text-body-2">{{ selectedItem.delete_reason }}</div>
              </div>
            </v-col>

            <v-col v-if="selectedItem.is_restored" cols="12">
              <v-divider class="mb-4" />
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis mb-2">Информация о восстановлении</div>
                <div class="d-flex align-center mb-2">
                  <v-icon icon="mdi-account" size="small" class="mr-2" />
                  <span class="text-body-2">{{ selectedItem.restored_by_name }}</span>
                </div>
                <div class="d-flex align-center">
                  <v-icon icon="mdi-clock" size="small" class="mr-2" />
                  <span class="text-body-2">{{ formatDate(selectedItem.restored_at!) }}</span>
                </div>
              </div>
            </v-col>

            <v-col cols="12">
              <v-divider class="mb-4" />
              <div class="mb-2">
                <div class="text-caption text-medium-emphasis mb-2">Данные элемента (JSON)</div>
                <v-card variant="outlined" class="entity-data-preview">
                  <v-card-text>
                    <pre class="text-caption">{{ formatJSON(selectedItem.entity_data) }}</pre>
                  </v-card-text>
                </v-card>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn @click="detailsDialog = false">Закрыть</v-btn>
          <v-btn
            v-if="canRestore(selectedItem)"
            color="success"
            variant="elevated"
            prepend-icon="mdi-restore"
            @click="restoreItem(selectedItem)"
          >
            Восстановить
          </v-btn>
          <v-btn
            v-if="canPermanentlyDelete(selectedItem)"
            color="error"
            variant="elevated"
            prepend-icon="mdi-delete-forever"
            @click="permanentlyDeleteItem(selectedItem)"
          >
            Удалить навсегда
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог подтверждения восстановления -->
    <v-dialog v-model="restoreConfirmDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-restore" color="success" class="mr-2" />
          Восстановить элемент?
        </v-card-title>
        <v-card-text>
          <p>Вы уверены, что хотите восстановить этот элемент?</p>
          <p v-if="itemToRestore" class="font-weight-medium mt-2">
            {{ itemToRestore.entity_name }}
          </p>
          <p class="text-caption text-medium-emphasis mt-2">
            Элемент будет возвращен в систему и станет доступным для работы.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="restoreConfirmDialog = false">Отмена</v-btn>
          <v-btn color="success" variant="elevated" @click="executeRestore">
            Восстановить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог подтверждения окончательного удаления -->
    <v-dialog v-model="deleteConfirmDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-alert" color="error" class="mr-2" />
          Удалить навсегда?
        </v-card-title>
        <v-card-text>
          <v-alert type="warning" variant="tonal" class="mb-4">
            <p class="font-weight-medium">Внимание! Это действие необратимо!</p>
          </v-alert>
          <p>Вы уверены, что хотите окончательно удалить этот элемент?</p>
          <p v-if="itemToDelete" class="font-weight-medium mt-2">
            {{ itemToDelete.entity_name }}
          </p>
          <p class="text-caption text-medium-emphasis mt-2">
            После удаления восстановление будет невозможно.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteConfirmDialog = false">Отмена</v-btn>
          <v-btn color="error" variant="elevated" @click="executePermanentDelete">
            Удалить навсегда
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
import { ref, computed, onMounted } from 'vue';
import { trashService } from '@/services/trashService';
import type { DeletedItem, EntityType, TrashStats } from '@/types/trash';
import { EntityTypeLabels, EntityTypeIcons, EntityTypeColors } from '@/types/trash';

// Реактивные данные
const loading = ref(false);
const items = ref<DeletedItem[]>([]);
const stats = ref<TrashStats>({
  total_items: 0,
  items_by_type: {},
  restored_count: 0,
  can_be_restored: 0,
});

// Фильтры
const searchQuery = ref('');
const selectedType = ref<EntityType | null>(null);
const showRestored = ref(false);
const showPermanentlyDeleted = ref(false);
const itemsPerPage = ref(50);
const currentPage = ref(1);
const totalItems = ref(0);

// Выбранные элементы
const selectedItems = ref<DeletedItem[]>([]);

// Диалоги
const detailsDialog = ref(false);
const restoreConfirmDialog = ref(false);
const deleteConfirmDialog = ref(false);
const selectedItem = ref<DeletedItem | null>(null);
const itemToRestore = ref<DeletedItem | null>(null);
const itemToDelete = ref<DeletedItem | null>(null);

// Snackbar
const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000,
});

// Заголовки таблицы
const headers = [
  { title: 'Тип', key: 'entity_type', sortable: false, width: '150px' },
  { title: 'Название', key: 'entity_name', sortable: false },
  { title: 'Удалил', key: 'deleted_by_name', sortable: false, width: '200px' },
  { title: 'Статус', key: 'status', sortable: false, width: '180px' },
  { title: 'Действия', key: 'actions', sortable: false, align: 'end', width: '150px' },
];

// Типы сущностей для фильтра
const entityTypes = computed(() => {
  return Object.entries(EntityTypeLabels).map(([value, title]) => ({
    value,
    title,
  }));
});

// Методы
const loadItems = async () => {
  loading.value = true;
  try {
    const response = await trashService.getTrashItems({
      entity_type: selectedType.value || undefined,
      search: searchQuery.value || undefined,
      show_restored: showRestored.value,
      show_permanently_deleted: showPermanentlyDeleted.value,
      page: currentPage.value,
      limit: itemsPerPage.value,
    });

    items.value = response.data.items;
    totalItems.value = response.data.pagination.total;
  } catch (error) {
    console.error('Ошибка загрузки элементов корзины:', error);
    showSnackbar('Ошибка загрузки элементов корзины', 'error');
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    stats.value = await trashService.getTrashStats();
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
  }
};

const debouncedSearch = (() => {
  let timeout: ReturnType<typeof setTimeout>;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      currentPage.value = 1;
      loadItems();
    }, 300);
  };
})();

const onPageChange = (page: number) => {
  currentPage.value = page;
  loadItems();
};

const viewDetails = (item: DeletedItem) => {
  selectedItem.value = item;
  detailsDialog.value = true;
};

const confirmRestore = (item: DeletedItem) => {
  itemToRestore.value = item;
  restoreConfirmDialog.value = true;
};

const confirmPermanentDelete = (item: DeletedItem) => {
  itemToDelete.value = item;
  deleteConfirmDialog.value = true;
};

const confirmBulkPermanentDelete = () => {
  if (selectedItems.value.length === 0) return;
  
  itemToDelete.value = null; // Для массового удаления
  deleteConfirmDialog.value = true;
};

const executeRestore = async () => {
  if (!itemToRestore.value) return;

  try {
    await trashService.restoreItem(itemToRestore.value.id);
    showSnackbar(`Элемент "${itemToRestore.value.entity_name}" успешно восстановлен`, 'success');
    restoreConfirmDialog.value = false;
    detailsDialog.value = false;
    itemToRestore.value = null;
    await Promise.all([loadItems(), loadStats()]);
  } catch (error) {
    console.error('Ошибка восстановления элемента:', error);
    showSnackbar('Ошибка восстановления элемента', 'error');
  }
};

const executePermanentDelete = async () => {
  try {
    if (itemToDelete.value) {
      // Единичное удаление
      await trashService.permanentlyDeleteItem(itemToDelete.value.id);
      showSnackbar(`Элемент "${itemToDelete.value.entity_name}" окончательно удален`, 'success');
    } else {
      // Массовое удаление
      const ids = selectedItems.value.map(item => item.id);
      await trashService.permanentlyDeleteMultipleItems(ids);
      showSnackbar(`Удалено элементов: ${ids.length}`, 'success');
      selectedItems.value = [];
    }
    
    deleteConfirmDialog.value = false;
    detailsDialog.value = false;
    itemToDelete.value = null;
    await Promise.all([loadItems(), loadStats()]);
  } catch (error: any) {
    console.error('Ошибка окончательного удаления:', error);
    const errorMessage = error?.response?.data?.error || error?.message || 'Ошибка окончательного удаления';
    console.error('Детали ошибки:', error?.response?.data);
    showSnackbar(errorMessage, 'error');
  }
};

const restoreItem = async (item: DeletedItem) => {
  itemToRestore.value = item;
  await executeRestore();
};

const permanentlyDeleteItem = async (item: DeletedItem) => {
  itemToDelete.value = item;
  await executePermanentDelete();
};

const showSnackbar = (text: string, color = 'info', timeout = 5000) => {
  snackbar.value = { show: true, text, color, timeout };
};

// Вспомогательные функции
const getEntityLabel = (type: EntityType): string => {
  return EntityTypeLabels[type] || type;
};

const getEntityIcon = (type: EntityType): string => {
  return EntityTypeIcons[type] || 'mdi-help-circle';
};

const getEntityColor = (type: EntityType): string => {
  return EntityTypeColors[type] || 'grey';
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (dateString: string): string => {
  return trashService.formatDate(dateString);
};

const formatRelativeTime = (dateString: string): string => {
  return trashService.getRelativeTime(dateString);
};

const formatJSON = (jsonString: string): string => {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return jsonString;
  }
};

const truncate = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
};

const canRestore = (item: DeletedItem): boolean => {
  return trashService.canRestore(item);
};

const canPermanentlyDelete = (item: DeletedItem): boolean => {
  return trashService.canPermanentlyDelete(item);
};

// Lifecycle
onMounted(async () => {
  await Promise.all([loadItems(), loadStats()]);
});
</script>

<style scoped>
.trash-container {
  padding: 0;
}

.stats-cards {
  margin-bottom: 24px;
}

.stat-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-surface), 1), rgba(var(--v-theme-surface-variant), 0.5));
  border-radius: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.trash-table :deep(.v-data-table__th) {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  font-weight: 600;
}

.entity-info {
  max-width: 400px;
}

.entity-data-preview {
  max-height: 300px;
  overflow-y: auto;
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

.entity-data-preview pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Темная тема */
.v-theme--dark .stat-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-surface-bright), 1), rgba(var(--v-theme-surface-variant), 0.5));
}

/* Адаптивность */
@media (max-width: 960px) {
  .stats-cards {
    gap: 12px;
  }
}
</style>

