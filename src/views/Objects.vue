<template>
  <div class="objects-page">

    <!-- Уведомление о демо режиме -->
    <v-alert v-if="objectsService.isMockDataEnabled && objectsService.isMockDataEnabled()" type="info" variant="tonal"
      prominent border="start" class="demo-alert">
      <template #prepend>
        <v-icon icon="mdi-play-circle" size="24" />
      </template>
      <div class="alert-content">
        <div class="alert-title">Демонстрационный режим</div>
        <div class="alert-text">
          Отображаются демо данные. Это позволяет увидеть, как будет выглядеть интерфейс управления объектами.
          Все изменения в демо режиме не сохраняются.
        </div>
      </div>
    </v-alert>

    <!-- Статистика -->
    <div class="stats-section">
      <div class="stats-grid">
        <AppleCard v-for="stat in stats" :key="stat.key" :title="stat.value.toString()" :subtitle="stat.label"
          :icon="stat.icon" :icon-color="stat.color" variant="outlined" :clickable="stat.key === 'trash'"
          :class="['stat-card', { 'clickable': stat.key === 'trash' }]"
          @click="stat.key === 'trash' ? openTrashDialog() : null" />
      </div>
    </div>

    <!-- Поиск + фильтры в одну линию -->
    <ObjectsFiltersBar
      :filters="filters"
      :source-options="sourceOptions"
      :has-active-filters="hasActiveFilters"
      :active-filters-count="activeFiltersCount"
      v-model:show-deleted-objects="showDeletedObjects"
      v-model:view-mode="viewMode"
      @search="debouncedSearch"
      @change="loadObjects"
      @clear-filters="clearFilters"
    />

    <!-- Список объектов -->
    <ObjectsTable
      :combined-objects="combinedObjects"
      :objects="objects"
      :objects-total="objectsData?.total || 0"
      :headers="tableHeaders"
      :pagination="pagination"
      :per-page-options="perPageOptions"
      :pagination-range="paginationRange"
      :pagination-total-pages="paginationTotalPages"
      :view-mode="viewMode"
      :show-deleted-objects="showDeletedObjects"
      v-model:selected-objects="selectedObjects"
      v-model:select-all="selectAll"
      @page-change="handlePageChange"
      @per-page-change="handlePerPageChange"
      @sort-change="handleSortChange"
      @toggle-activity="toggleObjectActivity"
      @toggle-all-activity="toggleAllObjectsActivity"
      @view="viewObject"
      @edit="editObject"
      @create-template="createTemplateFromObject"
      @cancel-scheduled-delete="cancelScheduledDelete"
      @schedule-delete="scheduleDelete"
      @delete="deleteObject"
      @restore="restoreObject"
      @permanent-delete="permanentDeleteObject"
    />

    <!-- Диалог создания/редактирования объекта -->
    <ObjectFormDialog
      v-model:show="objectDialog.show"
      v-model:selected-template="selectedTemplate"
      :is-edit="objectDialog.isEdit"
      :form="objectForm"
      :errors="formErrors"
      :saving="saving"
      :type-options="typeOptions"
      :company-options="companyOptions"
      :contract-options="contractOptions"
      :location-options="locationOptions"
      :template-options="templateOptions"
      :loading-companies="loadingCompanies"
      @close="closeObjectDialog"
      @save="saveObject"
      @apply-template="applyTemplate"
      @add-phone-number="addPhoneNumber"
      @remove-phone-number="removePhoneNumber"
    />

    <!-- Диалог планового удаления -->
    <ScheduleDeleteDialog
      v-model="scheduleDeleteDialog.show"
      :object="scheduleDeleteDialog.object"
      :form="scheduleDeleteForm"
      :errors="scheduleDeleteErrors"
      :min-date="minDeleteDate"
      :loading="scheduling"
      @update:form="scheduleDeleteForm = $event"
      @close="closeScheduleDeleteDialog"
      @confirm="confirmScheduleDelete" />

    <!-- Диалог создания шаблона из объекта -->
    <CreateTemplateDialog
      v-model="createTemplateDialog.show"
      :object="createTemplateDialog.object"
      :form="createTemplateForm"
      :errors="createTemplateErrors"
      :loading="saving"
      @update:form="createTemplateForm = $event"
      @close="closeCreateTemplateDialog"
      @confirm="confirmCreateTemplate" />

    <!-- Диалог просмотра объекта -->
    <ObjectViewDialog
      v-model:show="viewDialog.show"
      :object="viewDialog.object"
      @close="closeViewDialog"
      @edit="editObjectFromView"
      @delete="deleteObjectFromView"
    />

    <!-- Snackbar для уведомлений -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="top right"
      variant="flat" :multi-line="false" :vertical="false" elevation="8" rounded="xl" class="modern-snackbar">
      <div class="snackbar-content">
        <v-icon :icon="getSnackbarIcon(snackbar.color)" size="20" class="mr-3" />
        <span class="snackbar-text">{{ snackbar.text }}</span>
      </div>
      <template #actions>
        <v-btn variant="text" size="small" icon="mdi-close" @click="snackbar.show = false" />
      </template>
    </v-snackbar>

    <!-- Красивое уведомление об успехе -->
    <SuccessNotification v-model="successNotification.show" :title="successNotification.title"
      :message="successNotification.message" :details="successNotification.details"
      :show-timer="successNotification.showTimer" @timer-complete="onNotificationTimerComplete" />

    <!-- Диалог корзины объектов -->
    <ObjectsTrashDialog v-model="showTrashDialog" />

    <!-- FAB меню -->
    <AppleFAB icon="mdi-plus" :items="fabMenuItems" @item-click="handleFabAction" />
  </div>
</template>

<script setup lang="ts">
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import AppleFAB from '@/components/Apple/AppleFAB.vue';
import AppleInput from '@/components/Apple/AppleInput.vue';
import SuccessNotification from '@/components/Common/SuccessNotification.vue';
import CreateTemplateDialog from '@/components/Objects/CreateTemplateDialog.vue';
import ObjectFormDialog from '@/components/Objects/ObjectFormDialog.vue';
import ObjectViewDialog from '@/components/Objects/ObjectViewDialog.vue';
import ObjectsFiltersBar from '@/components/Objects/ObjectsFiltersBar.vue';
import ObjectsTable from '@/components/Objects/ObjectsTable.vue';
import ObjectsTrashDialog from '@/components/Objects/ObjectsTrashDialog.vue';
import ScheduleDeleteDialog from '@/components/Objects/ScheduleDeleteDialog.vue';
import getObjectsService from '@/services/objectsService';
import {
  formatDate,
  getConnectionColor,
  getSnackbarIcon,
  getStatusColor,
  getStatusText,
  getTypeIcon,
  getTypeText,
} from '@/utils/objectsHelpers';
import { useObjectsCRUD } from '@/composables/useObjectsCRUD';
import { useObjectsExport } from '@/composables/useObjectsExport';
import { useObjectsFilters } from '@/composables/useObjectsFilters';
import { useObjectsList } from '@/composables/useObjectsList';
import { useObjectsLookups } from '@/composables/useObjectsLookups';
import { useObjectsSelection } from '@/composables/useObjectsSelection';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const objectsService = getObjectsService();
const route = useRoute();

// === Snackbar / SuccessNotification (общий UI-state) ===
const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000,
});

const successNotification = ref({
  show: false,
  title: '',
  message: '',
  details: '',
  showTimer: false,
});

const showSnackbar = (text: string, color = 'info', timeout?: number) => {
  const defaultTimeouts = { error: 6000, warning: 5000, success: 4000, info: 4000 };
  const finalTimeout = timeout || defaultTimeouts[color as keyof typeof defaultTimeouts] || 5000;
  snackbar.value = { show: true, text, color, timeout: finalTimeout };
};

const showSuccessNotification = (title: string, message: string, details?: string, showTimer = false) => {
  successNotification.value = { show: true, title, message, details: details || '', showTimer };
};

const onNotificationTimerComplete = () => {};

// === Composables ===
// filters инициализируем первым, list использует filters.filters/showDeletedObjects.
// Циклическая зависимость "filters.loadObjects ↔ list.loadObjects" — обходим через
// поздний binding в filtersCtx.
const filtersCtx = {
  loadObjects: () => Promise.resolve(),
  pagination: ref({ page: 1, per_page: 10 }),
};

const _filters = useObjectsFilters(filtersCtx as any);

const list = useObjectsList({
  filters: _filters.filters,
  showDeletedObjects: _filters.showDeletedObjects,
  showSnackbar,
});

// Закрываем циклическую зависимость
filtersCtx.loadObjects = () => list.loadObjects();
filtersCtx.pagination = list.pagination;
// _filters внутри уже использует свой ctx.pagination ref → синхронизируем с реальной
// list.pagination через watch (filters сохраняет state в localStorage из своей copy).
// Решение: переинициализировать persist-функцию чтобы читала list.pagination.
const persistedInit = () => {
  try {
    localStorage.setItem('objects_page_state_v2', JSON.stringify({
      search: _filters.filters.value.search,
      source: _filters.filters.value.source ?? null,
      status: _filters.filters.value.status ?? null,
      type: _filters.filters.value.type ?? null,
      contract_id: _filters.filters.value.contract_id ?? null,
      location_id: _filters.filters.value.location_id ?? null,
      template_id: _filters.filters.value.template_id ?? null,
      ordering: _filters.filters.value.ordering,
      showDeleted: _filters.showDeletedObjects.value,
      page: list.pagination.value.page,
      per_page: list.pagination.value.per_page,
    }));
  } catch {/* ignore */}
};

// При первой загрузке восстанавливаем page/per_page в list.pagination из persist.
const _persisted = (() => {
  try {
    const raw = localStorage.getItem('objects_page_state_v2');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
})();
if (_persisted?.page) list.pagination.value.page = _persisted.page;
if (_persisted?.per_page) list.pagination.value.per_page = _persisted.per_page;

const lookups = useObjectsLookups({ showSnackbar });

const selection = useObjectsSelection({ objects: list.objects });

const crud = useObjectsCRUD({
  objects: list.objects,
  selectedObjects: selection.selectedObjects,
  selectAll: selection.selectAll,
  loadObjects: () => list.loadObjects(),
  loadStats: () => list.loadStats(),
  loadCompanies: () => lookups.loadCompanies(),
  loadTemplates: () => lookups.loadTemplates(),
  showSnackbar,
  showSuccessNotification,
  selectedTemplate: lookups.selectedTemplate,
});

const applyTemplate = (templateId: number | null) => {
  if (!templateId) return;
  const template = lookups.templateOptions.value.find((t: any) => t.value === templateId);
  if (!template) return;
  crud.objectForm.value.template_id = templateId;
  crud.objectForm.value.type = template.category || crud.objectForm.value.type;
  if (template.default_settings) {
    try {
      const settings = JSON.parse(template.default_settings);
      crud.objectForm.value.settings = JSON.stringify(settings);
    } catch (error) {
      console.warn('Ошибка парсинга настроек шаблона:', error);
    }
  }
  showSnackbar(`Шаблон "${template.name}" применен`, 'success');
};

const exporter = useObjectsExport({
  filters: _filters.filters,
  showSnackbar,
});

// === Деструктурирующий спред — template ожидает плоские имена ===
const filters = _filters.filters;
const advancedFilters = _filters.advancedFilters;
const showDeletedObjects = _filters.showDeletedObjects;
const showSearchHistory = _filters.showSearchHistory;
const showAdvancedSearch = _filters.showAdvancedSearch;
const showFilters = _filters.showFilters;
const loadingSuggestions = _filters.loadingSuggestions;
const searchSuggestions = _filters.searchSuggestions;
const searchHistory = _filters.searchHistory;
const quickFilters = _filters.quickFilters;
const hasActiveFilters = _filters.hasActiveFilters;
const activeFiltersCount = _filters.activeFiltersCount;
const debouncedSearch = _filters.debouncedSearch;
const debouncedAdvancedSearch = _filters.debouncedAdvancedSearch;
const clearFilters = _filters.clearFilters;
const handleSearchInput = _filters.handleSearchInput;
const loadSearchHistory = _filters.loadSearchHistory;
const clearSearchHistory = _filters.clearSearchHistory;
const removeFromHistory = _filters.removeFromHistory;
const applyHistorySearch = _filters.applyHistorySearch;
const isQuickFilterActive = _filters.isQuickFilterActive;
const toggleQuickFilter = _filters.toggleQuickFilter;

const objects = list.objects;
const objectsData = list.objectsData;
const loading = list.loading;
const pagination = list.pagination;
const stats = list.stats;
const loadObjects = list.loadObjects;
const loadStats = list.loadStats;
const handlePageChange = list.handlePageChange;
const handlePerPageChange = list.handlePerPageChange;
const handleSortChange = list.handleSortChange;

const companyOptions = lookups.companyOptions;
const contractOptions = lookups.contractOptions;
const locationOptions = lookups.locationOptions;
const templateOptions = lookups.templateOptions;
const loadingCompanies = lookups.loadingCompanies;
const loadingContracts = lookups.loadingContracts;
const loadingLocations = lookups.loadingLocations;
const loadingTemplates = lookups.loadingTemplates;
const selectedTemplate = lookups.selectedTemplate;
const loadCompanies = lookups.loadCompanies;
const loadContracts = lookups.loadContracts;
const loadLocations = lookups.loadLocations;
const loadTemplates = lookups.loadTemplates;

const selectedObjects = selection.selectedObjects;
const selectAll = selection.selectAll;
const toggleObjectSelection = selection.toggleObjectSelection;
const toggleSelectAll = selection.toggleSelectAll;
const updateSelectAllState = selection.updateSelectAllState;

const saving = crud.saving;
const scheduling = crud.scheduling;
const objectDialog = crud.objectDialog;
const objectForm = crud.objectForm;
const objectFormRef = crud.objectFormRef;
const formErrors = crud.formErrors;
const scheduleDeleteDialog = crud.scheduleDeleteDialog;
const scheduleDeleteForm = crud.scheduleDeleteForm;
const scheduleDeleteErrors = crud.scheduleDeleteErrors;
const viewDialog = crud.viewDialog;
const createTemplateDialog = crud.createTemplateDialog;
const createTemplateForm = crud.createTemplateForm;
const createTemplateErrors = crud.createTemplateErrors;
const openCreateDialog = crud.openCreateDialog;
const editObject = crud.editObject;
const closeObjectDialog = crud.closeObjectDialog;
const saveObject = crud.saveObject;
const viewObject = crud.viewObject;
const closeViewDialog = crud.closeViewDialog;
const editObjectFromView = crud.editObjectFromView;
const deleteObjectFromView = crud.deleteObjectFromView;
const deleteObject = crud.deleteObject;
const scheduleDelete = crud.scheduleDelete;
const closeScheduleDeleteDialog = crud.closeScheduleDeleteDialog;
const confirmScheduleDelete = crud.confirmScheduleDelete;
const cancelScheduledDelete = crud.cancelScheduledDelete;
const createTemplateFromObject = crud.createTemplateFromObject;
const closeCreateTemplateDialog = crud.closeCreateTemplateDialog;
const confirmCreateTemplate = crud.confirmCreateTemplate;
const restoreObject = crud.restoreObject;
const permanentDeleteObject = crud.permanentDeleteObject;
const toggleObjectActivity = crud.toggleObjectActivity;
const toggleAllObjectsActivity = crud.toggleAllObjectsActivity;
const addPhoneNumber = crud.addPhoneNumber;
const removePhoneNumber = crud.removePhoneNumber;

const exporting = exporter.exporting;
const exportObjects = exporter.exportObjects;

// === Local UI state ===
const viewMode = ref<'table' | 'grid'>('table');
const showTrashDialog = ref(false);

const combinedObjects = computed(() => objects.value);

const fabMenuItems = [
  { id: 'create', label: 'Создать объект', icon: 'mdi-plus', color: 'success' as const, action: () => openCreateDialog() },
  { id: 'export', label: 'Экспорт', icon: 'mdi-export', color: 'primary' as const, action: () => exportObjects() },
];

const handleFabAction = (_item: { id?: string; action?: () => void }) => {};

const openTrashDialog = () => {
  showTrashDialog.value = true;
};

// === Computed ===
const paginationTotalPages = computed(() => {
  const total = objectsData.value?.total || 0;
  return Math.max(1, Math.ceil(total / pagination.value.per_page));
});

const paginationRange = computed(() => {
  const total = objectsData.value?.total || 0;
  if (total === 0) return '0-0';
  const from = (pagination.value.page - 1) * pagination.value.per_page + 1;
  const to = Math.min(pagination.value.page * pagination.value.per_page, total);
  return `${from}-${to}`;
});

const hasScheduledDeletes = computed(() => {
  const st: any = objectsData.value?.stats;
  if (st && typeof st.axenta_scheduled_delete === 'number') {
    return st.axenta_scheduled_delete > 0;
  }
  return objects.value.some((o: any) => o.scheduled_delete_at || o.scheduledDelete);
});

const minDeleteDate = computed(() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
});

// === Options ===
const statusOptions = [
  { title: 'Активный', value: 'active' },
  { title: 'Неактивный', value: 'inactive' },
  { title: 'Обслуживание', value: 'maintenance' },
  { title: 'К удалению', value: 'scheduled_delete' },
];

const typeOptions = [
  { title: 'Транспорт', value: 'vehicle' },
  { title: 'Оборудование', value: 'equipment' },
  { title: 'Актив', value: 'asset' },
  { title: 'Здание', value: 'building' },
  { title: 'Контейнер', value: 'container' },
];

const sourceOptions = [
  { title: 'Все системы', value: null },
  { title: 'Axenta', value: 'axenta' },
  { title: 'Wialon', value: 'wialon' },
];

const tableHeaders = computed(() => [
  { title: '', value: 'is_active', sortable: false, width: 60, headerProps: { class: 'header-status-icon' } },
  { title: 'Наименование', value: 'name', sortable: true },
  { title: 'Учетка', value: 'accountName', sortable: true },
  { title: 'Протокол', value: 'deviceTypeName', sortable: true },
  { title: 'ID/IMEI', value: 'uniqueId', sortable: true },
  { title: '№ телефонов', value: 'phoneNumbers', sortable: false },
  { title: 'Создан', value: 'createdAt', sortable: true },
  { title: 'Сообщения', value: 'lastMessageDatetime', sortable: true },
  { title: '', value: 'source', sortable: true, width: 60 },
  ...(showDeletedObjects.value
    ? [{ title: '', value: 'deleted_at', sortable: true, width: 110, headerProps: { class: 'header-deleted-icon' } }]
    : (hasScheduledDeletes.value
        ? [{ title: '', value: 'scheduled_delete_at', sortable: true, width: 110, headerProps: { class: 'header-scheduled-icon' } }]
        : []
      )
  ),
  { title: '', value: 'actions', sortable: false, width: 56 },
]);

const perPageOptions = [
  { title: '5', value: 5 }, { title: '10', value: 10 }, { title: '25', value: 25 },
  { title: '50', value: 50 }, { title: '100', value: 100 }, { title: '150', value: 150 },
  { title: '300', value: 300 }, { title: '500', value: 500 }, { title: '1000', value: 1000 },
];

// === Watchers ===
watch(filters, () => {
  pagination.value.page = 1;
  loadObjects();
  persistedInit();
}, { deep: true });

watch(showDeletedObjects, () => {
  pagination.value.page = 1;
  loadObjects();
  persistedInit();
});

watch(pagination, () => persistedInit(), { deep: true });

// === Lifecycle ===
onMounted(async () => {
  // Принудительно закрываем все диалоги при инициализации
  objectDialog.value.show = false;
  scheduleDeleteDialog.value.show = false;
  viewDialog.value.show = false;

  // Подхватываем фильтры из URL (KPI Dashboard, глобальный поиск).
  if (typeof route.query.search === 'string') filters.value.search = route.query.search;
  if (typeof route.query.source === 'string') filters.value.source = route.query.source;
  if (typeof route.query.status === 'string') filters.value.status = route.query.status as any;
  if (typeof route.query.type === 'string') filters.value.type = route.query.type as any;

  loadSearchHistory();

  try {
    await loadObjects();
    Promise.allSettled([
      loadCompanies(),
      loadContracts(),
      loadLocations(),
      loadTemplates(),
    ]).then(results => {
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const names = ['компании', 'договоры', 'локации', 'шаблоны'];
          console.warn(`⚠️ Не удалось загрузить ${names[index]}:`, result.reason);
        }
      });
    });
  } catch (error: any) {
    console.error('Ошибка инициализации страницы объектов:', error);
    showSnackbar('Ошибка загрузки объектов. Проверьте подключение к серверу.', 'error', 8000);
  }

  // Авто-открытие диалога создания (?action=create из глобального FAB)
  if (route.query.action === 'create') {
    setTimeout(() => openCreateDialog(), 500);
  }
});

onUnmounted(() => {});
</script>

<style scoped>
.objects-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0;
}

.page-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;
}

.auto-refresh-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(var(--v-theme-surface), 0.8);
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
  border-radius: 12px;
}

.refresh-status {
  display: flex;
  align-items: center;
}

/* Статистика */
.stats-section {
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.stat-card {
  text-align: center;
}

.stat-card.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Поиск */
.search-card {
  margin: 0;
}

.search-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.search-actions {
  display: flex;
  gap: 8px;
}

.search-content {
  padding: 0;
}

.main-search-section {
  margin-bottom: 16px;
}

.main-search-input {
  width: 100%;
}

.quick-filters-section {
  margin-bottom: 16px;
  padding: 16px;
  background: rgba(60, 60, 67, 0.02);
  border-radius: 8px;
}

.quick-filters-title {
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
  font-size: 0.875rem;
}

.quick-filters-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.search-history-section {
  padding: 16px;
  background: rgba(60, 60, 67, 0.02);
  border-radius: 8px;
  margin-bottom: 16px;
}

.search-history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.search-history-title {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.search-history-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.advanced-search-section {
  padding: 16px;
  background: rgba(60, 60, 67, 0.02);
  border-radius: 8px;
  margin-bottom: 16px;
}

.advanced-search-title {
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 16px;
  font-size: 0.875rem;
}

/* Фильтры */
.filters-card {
  margin: 0;
}

.filters-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.filters-content {
  padding: 0;
}

/* Таблица */
.objects-table-card {
  margin: 0;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.table-title-section {
  display: flex;
  align-items: center;
}

.table-container {
  padding: 0;
}

.objects-table {
  background: transparent;
}

.actions-cell {
  display: flex;
  gap: 4px;
}

.actions-dots {
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.15s;
}
.actions-dots:hover {
  opacity: 1;
}

/* Компактная пагинация (как на /accounts) */
.compact-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 16px 24px;
  flex-wrap: nowrap;
  white-space: nowrap;
  min-height: 40px;
}

.items-select {
  min-width: 60px !important;
  width: fit-content !important;
  max-width: 120px !important;
  flex-shrink: 0;
  height: 40px;
}
.items-select :deep(.v-field) {
  min-width: 60px !important;
  width: auto !important;
}
.items-select :deep(.v-field__input) {
  min-width: 0 !important;
  width: auto !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.range-info {
  font-size: 0.875rem;
  color: var(--text-secondary, #555);
  flex-shrink: 0;
  font-weight: 500;
  padding: 6px 10px;
  background-color: rgba(0, 0, 0, 0.04);
  border-radius: 6px;
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 4px;
  background-color: rgba(0, 0, 0, 0.04);
  border-radius: 6px;
}

.page-info {
  font-size: 0.875rem;
  color: var(--text-primary, #555);
  font-weight: 600;
  min-width: 50px;
  text-align: center;
  padding: 4px 10px;
}

[data-theme="dark"] .range-info,
[data-theme="dark"] .nav-controls {
  background-color: rgba(255, 255, 255, 0.05);
}

/* Сетка объектов */
.grid-container {
  padding: 20px;
}

.objects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.object-card {
  height: 100%;
}

.object-card-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.object-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.object-status {
  align-self: flex-start;
}

.object-card-actions {
  display: flex;
  gap: 8px;
}

/* Диалоги */
.dialog-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.form-content {
  padding: 20px 0;
}

.dialog-content {
  padding: 20px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Просмотр объекта */
.view-dialog-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.object-title-section {
  display: flex;
  align-items: center;
}

.object-status-section {
  margin-left: 16px;
}

.object-details {
  padding: 20px;
}

.detail-section {
  margin-bottom: 24px;
}

.section-title {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(60, 60, 67, 0.08);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 120px;
}

.detail-value {
  color: var(--text-primary);
  flex: 1;
}

.detail-notes {
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Темная тема */
[data-theme="dark"] .section-title {
  color: var(--text-primary-dark);
}

[data-theme="dark"] .detail-label {
  color: var(--text-secondary-dark);
}

[data-theme="dark"] .detail-value {
  color: var(--text-primary-dark);
}

[data-theme="dark"] .detail-notes {
  color: var(--text-primary-dark);
}

[data-theme="dark"] .detail-item {
  border-bottom-color: rgba(84, 84, 136, 0.16);
}

/* Темная тема для поиска */
[data-theme="dark"] .quick-filters-section {
  background: rgba(84, 84, 136, 0.04);
}

[data-theme="dark"] .search-history-section {
  background: rgba(84, 84, 136, 0.04);
}

[data-theme="dark"] .advanced-search-section {
  background: rgba(84, 84, 136, 0.04);
}

[data-theme="dark"] .quick-filters-title,
[data-theme="dark"] .search-history-title,
[data-theme="dark"] .advanced-search-title {
  color: var(--text-secondary-dark);
}

/* Inline фильтры */
.inline-filters {
  display: flex;
  justify-content: flex-end;
  height: 40px;
  align-items: center;
}

.filters-toggle-inline {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid var(--border-color, #e0e0e0);
  background: var(--bg-secondary, #f8f9fa);
  height: 40px;
  min-width: 120px;
  font-size: 14px;
}

.filters-toggle-inline:hover {
  background-color: var(--bg-tertiary, #e9ecef);
  border-color: var(--apple-blue, #007AFF);
}

.expanded-filters {
  margin-top: 12px;
}

/* Демо уведомление */
.demo-alert {
  margin-bottom: 24px;
}

.alert-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert-title {
  font-weight: 600;
  font-size: 1rem;
}

.alert-text {
  font-size: 0.875rem;
  opacity: 0.9;
}

/* Snackbar стили */
.v-snackbar {
  z-index: 2000 !important;
}

.v-snackbar .v-snackbar__wrapper {
  min-width: 320px;
  max-width: 500px;
}

.modern-snackbar {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
}

.modern-snackbar .v-snackbar__wrapper {
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
}

.snackbar-content {
  display: flex;
  align-items: center;
  font-weight: 500;
  font-size: 0.875rem;
}

.snackbar-text {
  line-height: 1.4;
}

/* Анимация появления snackbar */
.modern-snackbar .v-snackbar__wrapper {
  animation: slideInFromRight 0.3s ease-out;
}

@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Темная тема для snackbar */
[data-theme="dark"] .modern-snackbar .v-snackbar__wrapper {
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Принудительно отключаем backdrop для диалогов, если он создает проблемы */
.v-overlay--active .v-overlay__scrim {
  opacity: 0.3 !important;
  /* Уменьшаем прозрачность backdrop */
}

/* Альтернативно - полностью отключаем backdrop */
.no-backdrop .v-overlay__scrim {
  display: none !important;
}

/* Убираем размытие с основного контента */
.v-application--wrap {
  filter: none !important;
  backdrop-filter: none !important;
}

/* Стили для диалога создания объекта */
.form-section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--border-color, #e0e0e0);
}

.dialog-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.form-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 16px 0;
}

/* Адаптивность */
@media (max-width: 960px) {
  .page-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .objects-grid {
    grid-template-columns: 1fr;
  }

  .search-actions {
    flex-direction: column;
    gap: 4px;
  }

  .quick-filters-chips {
    justify-content: center;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .page-actions {
    flex-direction: column;
    gap: 8px;
  }

  .filters-content .v-row {
    margin: 0;
  }

  .filters-content .v-col {
    padding: 4px;
  }
}

/* Анимации */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Улучшения для таблицы */
.objects-table :deep(.v-data-table__wrapper) {
  border-radius: 12px;
  overflow: hidden;
}

.objects-table :deep(.v-data-table-header__content) {
  font-weight: 600;
  color: var(--text-primary);
}

.objects-table :deep(.v-data-table__td) {
  border-bottom: 1px solid rgba(60, 60, 67, 0.08);
  padding-inline: 8px !important;
}

.objects-table :deep(th.v-data-table__th) {
  padding-inline: 8px !important;
}

.objects-table :deep(.v-data-table__td:first-child),
.objects-table :deep(th.v-data-table__th:first-child) {
  padding-inline-start: 12px !important;
}

.objects-table :deep(.v-data-table__td:last-child),
.objects-table :deep(th.v-data-table__th:last-child) {
  padding-inline-end: 12px !important;
}

[data-theme="dark"] .objects-table :deep(.v-data-table__td) {
  border-bottom-color: rgba(84, 84, 136, 0.16);
}

/* Улучшения для карточек */
.object-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

[data-theme="dark"] .object-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

/* Стили для новых элементов */
.mass-actions {
  display: flex;
  align-items: center;
  margin-right: 16px;
}

.phone-numbers-section {
  border: 1px solid rgba(60, 60, 67, 0.08);
  border-radius: 8px;
  padding: 16px;
  background: rgba(60, 60, 67, 0.02);
}

[data-theme="dark"] .phone-numbers-section {
  border-color: rgba(84, 84, 136, 0.16);
  background: rgba(84, 84, 136, 0.04);
}

.font-mono {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.875rem;
}

/* Стили для формы создания шаблона */
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row>* {
  flex: 1;
}

/* Адаптивность для массовых действий */
@media (max-width: 960px) {
  .mass-actions {
    flex-wrap: wrap;
    gap: 8px;
    margin-right: 0;
    margin-bottom: 12px;
  }

  .table-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-row {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
