<template>
  <v-card class="accounts-table-card">
    <v-progress-linear v-if="wialonRefreshing" indeterminate color="primary" height="3" class="wialon-refresh-indicator" />

    <v-data-table-virtual
      :headers="headers"
      :items="items"
      :loading="loading"
      :sort-by="[{ key: sortBy, order: sortOrder }]"
      :must-sort="false"
      :multi-sort="false"
      class="accounts-table"
      :class="{ 'updating': backgroundLoading }"
      loading-text="Загрузка учетных записей..."
      no-data-text="Учетные записи не найдены"
      height="600"
      item-height="54"
      @update:sort-by="(v: any) => $emit('sortChange', v)"
    >
      <template #item.rowNumber="{ item }">
        <span class="row-number">{{ item.rowNumber }}</span>
      </template>

      <template #item.id="{ item }">
        <v-tooltip
          location="top"
          class="id-tooltip"
          :close-on-content-click="false"
          :close-on-back="false"
          :close-on-click="false"
          :close-on-hover="false"
          persistent
          no-click-animation
          @update:model-value="onTooltipOpen"
        >
          <template #activator="{ props: tooltipProps }">
            <span class="id-minimal" v-bind="tooltipProps">{{ item.id }}</span>
          </template>
          <div class="id-popup draggable-popup" @mouseenter="keepOpen" @mouseleave="keepOpen">
            <div class="popup-header draggable-header">
              <div class="popup-icon"><v-icon>mdi-domain</v-icon></div>
              <div class="popup-title">{{ item.name }}</div>
              <v-btn icon="mdi-close" size="small" variant="text" class="close-btn" @click="closePopup" />
            </div>
            <div class="popup-content">
              <div class="popup-field">
                <span class="field-label">ID учетной записи</span>
                <span class="field-value">{{ item.id }}</span>
              </div>
              <div class="popup-field">
                <span class="field-label">ID администратора</span>
                <span class="field-value">{{ item.adminId }}</span>
              </div>
              <div class="popup-field">
                <span class="field-label">Тип компании</span>
                <span class="field-value">{{ item.type === 'partner' ? 'Партнер' : 'Клиент' }}</span>
              </div>
              <div class="popup-field">
                <span class="field-label">Статус</span>
                <span class="field-value" :class="{ 'text-success': item.isActive, 'text-error': !item.isActive }">
                  {{ item.isActive ? 'Активен' : 'Заблокирован' }}
                </span>
              </div>
              <div v-if="item.adminFullname" class="popup-field">
                <span class="field-label">Администратор</span>
                <span class="field-value">{{ item.adminFullname }}</span>
              </div>
              <div v-if="item.comment" class="popup-field">
                <span class="field-label">Комментарий</span>
                <span class="field-value">{{ item.comment }}</span>
              </div>
              <div v-if="item.hierarchy" class="popup-field hierarchy-field">
                <span class="field-label">Иерархия</span>
                <span class="field-value hierarchy-value">{{ item.hierarchy }}</span>
              </div>
              <div v-if="item.blockingDatetime" class="popup-field">
                <span class="field-label">Дата блокировки</span>
                <span class="field-value">{{ formatDateShort(item.blockingDatetime) }}</span>
              </div>
              <div v-if="item.daysBeforeBlocking !== null" class="popup-field">
                <span class="field-label">Дней до блокировки</span>
                <span class="field-value" :class="{ 'text-error': item.daysBeforeBlocking <= 3, 'text-warning': item.daysBeforeBlocking > 3 && item.daysBeforeBlocking <= 7 }">
                  {{ item.daysBeforeBlocking }}
                </span>
              </div>
              <div class="popup-field">
                <span class="field-label">Дата создания</span>
                <span class="field-value">{{ formatDateShort(item.creationDatetime) }}</span>
              </div>
            </div>
          </div>
        </v-tooltip>
      </template>

      <template #item.name="{ item }">
        <div class="company-name-compact">{{ item.name }}</div>
      </template>

      <template #item.type="{ item }">
        <span class="type-minimal" :class="{ 'type-partner': item.type === 'partner', 'type-client': item.type !== 'partner' }">
          {{ item.type === 'partner' ? 'Партнер' : 'Клиент' }}
        </span>
      </template>

      <template #item.objectsTotal="{ item }">
        <v-tooltip
          location="top"
          class="objects-tooltip"
          :close-on-content-click="false"
          :close-on-back="false"
          :close-on-click="false"
          :close-on-hover="false"
          persistent
          no-click-animation
          @update:model-value="onTooltipOpen"
        >
          <template #activator="{ props: tooltipProps }">
            <div class="objects-compact" v-bind="tooltipProps">
              <div v-if="item.objectsTotal === -1" class="objects-loading">
                <v-progress-circular indeterminate size="16" width="2" color="primary" />
              </div>
              <span v-else-if="!item.objectsTotal && !item.objectsActive && !item.objectsDeleted" class="no-objects">
                Нет объектов
              </span>
              <div v-else class="objects-display">
                <span class="objects-active">{{ item.objectsActive || 0 }}</span>
                <span class="objects-separator">/</span>
                <span class="objects-total">{{ item.objectsTotal || 0 }}</span>
                <span v-if="item.objectsDeleted > 0" class="objects-deleted">
                  <span class="objects-separator">/</span>
                  <span class="deleted-count">{{ item.objectsDeleted }}</span>
                </span>
              </div>
            </div>
          </template>
          <div class="objects-popup draggable-popup" @mouseenter="keepOpen" @mouseleave="keepOpen">
            <div class="popup-header draggable-header">
              <div class="popup-icon"><v-icon>mdi-radar</v-icon></div>
              <div class="popup-title">Объекты мониторинга</div>
              <v-btn icon="mdi-close" size="small" variant="text" class="close-btn" @click="closePopup" />
            </div>
            <div class="popup-content">
              <div class="popup-field">
                <span class="field-label">Активные объекты</span>
                <span class="field-value">{{ item.objectsActive || 0 }}</span>
              </div>
              <div class="popup-field">
                <span class="field-label">Всего объектов</span>
                <span class="field-value">{{ item.objectsTotal || 0 }}</span>
              </div>
              <div v-if="(item.objectsDeactivated ?? 0) > 0" class="popup-field">
                <span class="field-label">Деактивированные</span>
                <span class="field-value deactivated">{{ item.objectsDeactivated }}</span>
              </div>
              <div v-if="item.objectsDeleted > 0" class="popup-field">
                <span class="field-label">Удаленные</span>
                <span class="field-value">{{ item.objectsDeleted }}</span>
              </div>
            </div>
          </div>
        </v-tooltip>
      </template>

      <template #item.isActive="{ item }">
        <v-tooltip location="top" :text="item.isActive ? 'Активен' : 'Заблокирован'">
          <template #activator="{ props: tooltipProps }">
            <v-icon
              v-bind="tooltipProps"
              :icon="item.isActive ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline'"
              :color="item.isActive ? 'success' : 'error'"
              size="24"
              class="status-icon"
            />
          </template>
        </v-tooltip>
      </template>

      <template #item.source="{ item }">
        <v-chip :color="getSourceColor(item.source)" size="small" variant="tonal">
          <v-icon start size="16">{{ getSourceIcon(item.source) }}</v-icon>
          {{ item.source === 'axenta' ? 'Axenta' : item.source }}
        </v-chip>
      </template>

      <template #item.blockingInfo="{ item }">
        <span
          v-if="item.blockingDatetime"
          class="blocking-minimal"
          :class="{
            'blocking-critical': item.daysBeforeBlocking !== null && item.daysBeforeBlocking <= 3,
            'blocking-warning': item.daysBeforeBlocking !== null && item.daysBeforeBlocking > 3 && item.daysBeforeBlocking <= 7,
            'blocking-normal': item.daysBeforeBlocking !== null && item.daysBeforeBlocking > 7
          }"
        >
          {{ formatDateShort(item.blockingDatetime) }}
        </span>
        <span v-else class="blocking-minimal blocking-none">Без ограничений</span>
      </template>

      <template #item.creationDatetime="{ item }">
        <span class="creation-minimal">{{ formatDateShort(item.creationDatetime) }}</span>
      </template>

      <template #item.actions="{ item }">
        <div class="actions-row">
          <!-- Кнопка обновления stats — только для Wialon, видна на hover строки. Дёрнет /refresh-account, обновит objectsTotal без перезагрузки списка -->
          <v-btn
            v-if="item.source && item.source !== 'axenta'"
            :loading="!!refreshingIds[item.id]"
            class="row-refresh-btn"
            icon="mdi-refresh"
            variant="text"
            size="x-small"
            color="primary"
            title="Обновить количество объектов"
            @click="$emit('refreshStats', item)"
          />
          <v-btn
            :icon="item.isActive ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline'"
            variant="text"
            size="small"
            :color="item.isActive ? 'warning' : 'success'"
            :title="item.isActive ? 'Деактивировать' : 'Активировать'"
            @click="$emit('toggleStatus', item)"
          />
          <v-menu>
            <template #activator="{ props: menuProps }">
              <v-btn icon="mdi-dots-vertical" variant="text" size="x-small" v-bind="menuProps" title="Дополнительные действия" />
            </template>
            <v-list density="compact">
              <v-list-item prepend-icon="mdi-monitor-dashboard" title="Войти в мониторинг" @click="$emit('loginMonitoring', item)" />
              <v-list-item
                v-if="item.type === 'partner' || item.dealer_rights"
                prepend-icon="mdi-cog-transfer-outline"
                title="Войти в CMS"
                @click="$emit('loginCms', item)"
              />
              <v-list-item
                v-if="item.source === 'axenta' || !item.source"
                prepend-icon="mdi-account-arrow-right-outline"
                title="Переместить учетную запись"
                @click="$emit('move', item)"
              />
              <v-divider />
              <v-list-item prepend-icon="mdi-delete-outline" title="Удалить учетную запись" class="text-error" @click="$emit('delete', item)" />
            </v-list>
          </v-menu>
        </div>
      </template>
    </v-data-table-virtual>

    <v-alert v-if="wialonLoading && !axentaLoading" type="info" variant="tonal" density="compact" class="mt-2 mb-0 wialon-loading-alert">
      <div class="d-flex align-center">
        <v-progress-circular indeterminate size="18" width="2" class="mr-2" />
        <span>Загрузка аккаунтов из Wialon...</span>
      </div>
    </v-alert>

    <div class="compact-pagination">
      <v-select
        :model-value="itemsPerPage"
        :items="itemsPerPageOptions"
        variant="outlined"
        density="compact"
        class="items-select"
        hide-details
        @update:model-value="(v: number) => $emit('itemsPerPageChange', v)"
      />
      <span class="range-info">{{ displayRange }} из {{ effectiveTotal }}</span>
      <div class="nav-controls">
        <v-btn icon="mdi-page-first" variant="text" size="x-small" :disabled="currentPage === 1" title="Первая" @click="$emit('firstPage')" />
        <v-btn icon="mdi-chevron-left" variant="text" size="x-small" :disabled="currentPage === 1" title="Предыдущая" @click="$emit('prevPage')" />
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <v-btn icon="mdi-chevron-right" variant="text" size="x-small" :disabled="currentPage === totalPages" title="Следующая" @click="$emit('nextPage')" />
        <v-btn icon="mdi-page-last" variant="text" size="x-small" :disabled="currentPage === totalPages" title="Последняя" @click="$emit('lastPage')" />
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';

defineProps<{
  items: any[];
  loading: boolean;
  backgroundLoading: boolean;
  wialonRefreshing: boolean;
  wialonLoading: boolean;
  axentaLoading: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  effectiveTotal: number;
  displayRange: string;
  itemsPerPageOptions: Array<{ value: number; title: string }>;
  refreshingIds?: Record<number, boolean>;
}>();

const emit = defineEmits<{
  (e: 'sortChange', value: any): void;
  (e: 'itemsPerPageChange', value: number): void;
  (e: 'firstPage'): void;
  (e: 'prevPage'): void;
  (e: 'nextPage'): void;
  (e: 'lastPage'): void;
  (e: 'loginMonitoring', item: any): void;
  (e: 'loginCms', item: any): void;
  (e: 'move', item: any): void;
  (e: 'delete', item: any): void;
  (e: 'toggleStatus', item: any): void;
  (e: 'refreshStats', item: any): void;
  (e: 'scroll'): void;
}>();

const headers = computed(() => [
  { title: '№', key: 'rowNumber', sortable: false, width: '60px' },
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Компания', key: 'name', sortable: true, width: '25%' },
  { title: 'Тип', key: 'type', sortable: true },
  { title: 'Объекты', key: 'objectsTotal', sortable: true },
  { title: 'Статус', key: 'isActive', sortable: true },
  { title: 'Источник', key: 'source', sortable: true },
  { title: 'Создан', key: 'creationDatetime', sortable: true },
  { title: 'Действия', key: 'actions', sortable: false },
]);

const formatDateShort = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getSourceColor = (source: string): string => {
  if (source === 'axenta') return 'primary';
  const lower = source?.toLowerCase() || '';
  if (lower.startsWith('wh(') || lower.startsWith('wh ')) return 'orange';
  if (lower.startsWith('wl(') || lower.startsWith('wl ')) return 'cyan';
  return 'grey';
};

const getSourceIcon = (source: string): string => {
  if (source === 'axenta') return 'mdi-server-network-outline';
  const lower = source?.toLowerCase() || '';
  if (lower.startsWith('wh(') || lower.startsWith('wh ')) return 'mdi-cloud-outline';
  if (lower.startsWith('wl(') || lower.startsWith('wl ')) return 'mdi-server-outline';
  return 'mdi-satellite-uplink';
};

const keepOpen = (event: Event) => {
  event.stopPropagation();
  event.preventDefault();
};

const positionPopupInViewport = (popup: HTMLElement | null) => {
  if (!popup) return;

  const rect = popup.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const margin = 20;

  let newX = rect.left;
  let newY = rect.top;

  const elementCenterX = rect.left + (rect.width / 2);
  newX = elementCenterX - (rect.width / 2);

  if (newX < margin) newX = margin;
  if (newX + rect.width > viewportWidth - margin) newX = viewportWidth - rect.width - margin;

  const popupHeight = rect.height;
  newY = rect.top - popupHeight - 15;

  if (newY < margin) newY = margin;
  if (newY + popupHeight > viewportHeight - margin) newY = viewportHeight - popupHeight - margin;

  const deltaX = newX - rect.left;
  const deltaY = newY - rect.top;

  popup.style.setProperty('--popup-x', `${deltaX}px`);
  popup.style.setProperty('--popup-y', `${deltaY}px`);
};

const onTooltipOpen = (isOpen: boolean) => {
  if (!isOpen) return;

  setTimeout(() => {
    const popups = document.querySelectorAll('.draggable-popup');
    popups.forEach(popup => {
      if (!(popup instanceof HTMLElement)) return;

      const triggerElement = popup.closest('.v-tooltip')?.querySelector('[data-tooltip]') ||
        popup.closest('.v-tooltip')?.querySelector('td');

      if (triggerElement) {
        const triggerRect = triggerElement.getBoundingClientRect();
        const tableRows = document.querySelectorAll('tbody tr');
        const currentRow = triggerElement.closest('tr');
        if (!currentRow) return;
        const rowIndex = Array.from(tableRows).indexOf(currentRow);
        const totalRows = tableRows.length;
        const isLastTwoRows = rowIndex >= totalRows - 2;

        const popupRect = popup.getBoundingClientRect();
        const popupHeight = popupRect.height;
        const margin = 20;

        const elementCenterX = triggerRect.left + (triggerRect.width / 2);
        let newX = elementCenterX - (popupRect.width / 2);

        if (newX < margin) newX = margin;
        if (newX + popupRect.width > window.innerWidth - margin) {
          newX = window.innerWidth - popupRect.width - margin;
        }

        let newY: number;
        if (isLastTwoRows) {
          newY = triggerRect.top - popupHeight - 30;
        } else {
          newY = triggerRect.top - popupHeight - 15;
        }

        if (newY < margin) newY = margin;

        const deltaX = newX - popupRect.left;
        const deltaY = newY - popupRect.top;

        popup.style.setProperty('--popup-x', `${deltaX}px`);
        popup.style.setProperty('--popup-y', `${deltaY}px`);
      } else {
        positionPopupInViewport(popup);
      }
    });
  }, 150);
};

const closePopup = () => {
  const popups = document.querySelectorAll('.draggable-popup');
  popups.forEach(popup => {
    if (popup instanceof HTMLElement) {
      popup.style.display = 'none';
    }
  });
};

const handleWindowResize = () => {
  const popups = document.querySelectorAll('.draggable-popup');
  popups.forEach(popup => {
    if (popup instanceof HTMLElement) {
      positionPopupInViewport(popup);
    }
  });
};

const onScroll = () => emit('scroll');

onMounted(() => {
  window.addEventListener('resize', handleWindowResize);

  setTimeout(() => {
    const tableEl = document.querySelector('.accounts-table .v-table__wrapper');
    if (tableEl) {
      tableEl.addEventListener('scroll', onScroll);
    }
  }, 1500);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize);
  const tableEl = document.querySelector('.accounts-table .v-table__wrapper');
  if (tableEl) {
    tableEl.removeEventListener('scroll', onScroll);
  }
});
</script>

<style scoped>
.accounts-table-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  /* Для позиционирования индикатора */
}

/* Индикатор фонового обновления Wialon данных */
.wialon-refresh-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  opacity: 0.8;
}

.accounts-table {
  background: transparent;
}

.accounts-table :deep(.v-data-table__wrapper) {
  border-radius: 12px;
  overflow: hidden;
}

.accounts-table :deep(.v-data-table-header__content) {
  font-weight: 600;
  color: var(--text-primary);
  text-align: center !important;
  justify-content: center;
}

.accounts-table :deep(.v-data-table__td) {
  border-bottom: 1px solid rgba(60, 60, 67, 0.08);
}

/* Динамические колонки - автоматическая ширина по содержимому */
.accounts-table :deep(.v-data-table__th),
.accounts-table :deep(.v-data-table__td) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center !important;
  vertical-align: middle;
}

/* Колонка № - фиксированная ширина */
.accounts-table :deep(.v-data-table__th:first-child),
.accounts-table :deep(.v-data-table__td:first-child) {
  width: 60px !important;
  min-width: 60px;
  max-width: 60px;
  text-align: center;
}

/* Колонка ID - минимальная ширина */
.accounts-table :deep(.v-data-table__th:nth-child(2)),
.accounts-table :deep(.v-data-table__td:nth-child(2)) {
  width: auto;
  min-width: 60px;
  max-width: 100px;
}

/* Колонка Компания - фиксированная ширина 30% */
.accounts-table :deep(.v-data-table__th:nth-child(3)),
.accounts-table :deep(.v-data-table__td:nth-child(3)) {
  width: 30% !important;
  min-width: 200px;
  white-space: normal;
  word-wrap: break-word;
}

/* Колонка Тип - компактная ширина */
.accounts-table :deep(.v-data-table__th:nth-child(4)),
.accounts-table :deep(.v-data-table__td:nth-child(4)) {
  width: auto;
  min-width: 80px;
  max-width: 120px;
}

/* Колонка Объекты - компактная ширина */
.accounts-table :deep(.v-data-table__th:nth-child(5)),
.accounts-table :deep(.v-data-table__td:nth-child(5)) {
  width: auto;
  min-width: 100px;
  max-width: 140px;
}

/* Колонка Статус - компактная ширина */
.accounts-table :deep(.v-data-table__th:nth-child(6)),
.accounts-table :deep(.v-data-table__td:nth-child(6)) {
  width: auto;
  min-width: 80px;
  max-width: 120px;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
}

/* Колонка Создан - средняя ширина */
.accounts-table :deep(.v-data-table__th:nth-child(7)),
.accounts-table :deep(.v-data-table__td:nth-child(7)) {
  width: auto;
  min-width: 100px;
  max-width: 150px;
}

/* Колонка Действия - фиксированная ширина */
.accounts-table :deep(.v-data-table__th:last-child),
.accounts-table :deep(.v-data-table__td:last-child) {
  width: auto;
  min-width: 120px;
  max-width: 180px;
}

/* Стили для номера строки */
.row-number {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 0.9em;
}

/* Центрирование всех элементов в ячейках */
.accounts-table :deep(.v-data-table__td)>* {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

/* Центрирование текстовых элементов */
.accounts-table :deep(.v-data-table__td) span,
.accounts-table :deep(.v-data-table__td) div {
  display: inline-block;
  text-align: center;
}

/* Центрирование элементов с tooltip */
.accounts-table :deep(.v-data-table__td) .v-tooltip {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.accounts-table :deep(.v-data-table__td) .v-tooltip .v-tooltip__activator {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.custom-pagination-bottom {
  border-top: 1px solid #e0e0e0;
  background-color: #fafafa;
  /* Расширяем блок пагинации */
  min-height: 60px;
  padding: 20px 0;
}

/* Расширенная пагинация */
.compact-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 20px 24px;
  flex-wrap: nowrap;
  white-space: nowrap;
  /* Увеличиваем высоту блока */
  min-height: 40px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 0 16px;
}

.items-select {
  min-width: 60px !important;
  /* Увеличиваем минимальную ширину */
  width: fit-content !important;
  /* Ширина по содержимому */
  max-width: 120px !important;
  /* Максимальная ширина */
  flex-shrink: 0;
  /* Улучшаем внешний вид */
  height: 40px;
}

/* Принудительное переопределение стилей Vuetify */
.items-select :deep(.v-field) {
  min-width: 50px !important;
  width: auto !important;
}

.items-select :deep(.v-field__input) {
  min-width: 0 !important;
  width: auto !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.items-select :deep(.v-field__append-inner) {
  padding-left: 4px !important;
}

.items-select :deep(.v-select__selection) {
  max-width: none !important;
  min-width: 0 !important;
}

.range-info {
  font-size: 0.9rem;
  /* Увеличиваем размер шрифта */
  color: #555;
  /* Улучшаем цвет */
  flex-shrink: 0;
  min-width: 120px;
  /* Увеличиваем минимальную ширину */
  text-align: center;
  font-weight: 600;
  /* Увеличиваем жирность */
  padding: 8px 12px;
  /* Добавляем отступы */
  background-color: #f0f0f0;
  /* Добавляем фон */
  border-radius: 6px;
  /* Скругленные углы */
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  /* Увеличиваем промежуток */
  flex-shrink: 0;
  padding: 4px;
  /* Добавляем отступы */
  background-color: #f0f0f0;
  /* Добавляем фон */
  border-radius: 6px;
  /* Скругленные углы */
}

.page-info {
  font-size: 0.9rem;
  /* Увеличиваем размер шрифта */
  color: #555;
  /* Улучшаем цвет */
  font-weight: 700;
  /* Увеличиваем жирность */
  min-width: 50px;
  /* Увеличиваем минимальную ширину */
  text-align: center;
  padding: 8px 12px;
  /* Увеличиваем отступы */
  background-color: #e8e8e8;
  /* Добавляем фон */
  border-radius: 6px;
  /* Скругленные углы */
}

/* Улучшенные кнопки навигации */
.nav-controls .v-btn {
  min-width: 32px !important;
  /* Увеличиваем размер */
  width: 32px;
  height: 32px;
  border-radius: 6px;
  /* Скругленные углы */
  background-color: white;
  /* Белый фон */
  border: 1px solid #ddd;
  /* Добавляем рамку */
}

.accounts-table {
  transition: opacity 0.3s ease-in-out;
}

.accounts-table.updating {
  opacity: 0.8;
}

/* Адаптивность в стиле /users */
@media (max-width: 768px) {
  /* Адаптивные колонки для мобильных устройств */
  .accounts-table :deep(.v-data-table__th),
  .accounts-table :deep(.v-data-table__td) {
    min-width: 60px;
    max-width: none;
  }

  /* На мобильных устройствах колонка Компания получает больше места */
  .accounts-table :deep(.v-data-table__th:nth-child(2)),
  .accounts-table :deep(.v-data-table__td:nth-child(2)) {
    width: 40% !important;
    min-width: 150px;
  }
}

@media (max-width: 600px) {
  .page-title {
    font-size: 1.5rem;
  }
}

/* Темная тема */
.accounts-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}

[data-theme="dark"] .accounts-page {
  background-color: #1a1a1a;
}

[data-theme="dark"] .page-icon {
  color: #007AFF;
}

[data-theme="dark"] .page-title {
  color: #ffffff;
}

[data-theme="dark"] .page-subtitle {
  color: #8e8e93;
}

[data-theme="dark"] .accounts-table :deep(.v-data-table__td) {
  border-bottom-color: rgba(84, 84, 136, 0.16);
}

[data-theme="dark"] .accounts-table-card {
  background-color: #2c2c2e;
  border: 1px solid #3a3a3c;
}

[data-theme="dark"] .accounts-table :deep(.v-data-table-header__content) {
  color: #ffffff;
}

[data-theme="dark"] .accounts-table :deep(.v-data-table__td) {
  color: #ffffff;
  border-bottom-color: #3a3a3c;
}

[data-theme="dark"] .accounts-table :deep(.v-data-table__tr:hover) {
  background-color: rgba(0, 122, 255, 0.1) !important;
}

[data-theme="dark"] .company-name-compact {
  color: #ffffff;
}

[data-theme="dark"] .id-minimal {
  color: #8e8e93;
  background-color: rgba(142, 142, 147, 0.12);
}

[data-theme="dark"] .id-minimal:hover {
  color: #ffffff;
  background-color: rgba(142, 142, 147, 0.2);
}


[data-theme="dark"] .type-minimal {
  color: #ffffff;
}

[data-theme="dark"] .status-minimal {
  color: #ffffff;
}

[data-theme="dark"] .status-minimal.status-inactive {
  color: #ff453a;
}

[data-theme="dark"] .blocking-minimal {
  color: #ffffff;
}

[data-theme="dark"] .creation-minimal {
  color: #ffffff;
}

[data-theme="dark"] .objects-compact {
  background: linear-gradient(135deg, #3a3a3c, #2c2c2e);
  border-color: #3a3a3c;
}

[data-theme="dark"] .objects-compact:hover {
  background: linear-gradient(135deg, #007AFF, #0056CC);
  border-color: #007AFF;
}

[data-theme="dark"] .objects-active {
  color: #32d74b;
}

[data-theme="dark"] .objects-total {
  color: #007AFF;
}

[data-theme="dark"] .deleted-count {
  color: #ff453a;
}

[data-theme="dark"] .compact-pagination {
  background-color: #2c2c2e;
  border: 1px solid #3a3a3c;
}

[data-theme="dark"] .range-info {
  color: #8e8e93;
  background-color: #3a3a3c;
}

[data-theme="dark"] .page-info {
  color: #ffffff;
  background-color: #3a3a3c;
}

[data-theme="dark"] .nav-controls {
  background-color: #3a3a3c;
}

[data-theme="dark"] .nav-controls .v-btn {
  background-color: #2c2c2e;
  border-color: #3a3a3c;
  color: #ffffff;
}

[data-theme="dark"] .nav-controls .v-btn:hover {
  background-color: #3a3a3c;
  border-color: #007AFF;
}

[data-theme="dark"] .items-select :deep(.v-field) {
  background-color: #2c2c2e !important;
  border-color: #3a3a3c !important;
  color: #ffffff !important;
}

[data-theme="dark"] .items-select :deep(.v-field__input) {
  color: #ffffff !important;
}

[data-theme="dark"] .items-select :deep(.v-label) {
  color: #8e8e93 !important;
}

[data-theme="dark"] .popup-header {
  background: linear-gradient(135deg, #2c2c2e 0%, #1a1a1a 100%);
  border-bottom-color: #3a3a3c;
}

[data-theme="dark"] .popup-title {
  color: #ffffff;
}

[data-theme="dark"] .popup-content {
  background-color: #1a1a1a;
}

[data-theme="dark"] .field-label {
  color: #8e8e93;
}

[data-theme="dark"] .field-value {
  color: #ffffff;
}

[data-theme="dark"] .hierarchy-value {
  color: #8e8e93;
}

[data-theme="dark"] .draggable-popup {
  background-color: #1a1a1a;
  border: 1px solid #3a3a3c;
}


/* Темная тема для меню действий */
[data-theme="dark"] .actions-row .v-btn {
  color: #ffffff !important;
}

[data-theme="dark"] .actions-row .v-btn:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

/* Темная тема для списка меню */
[data-theme="dark"] .actions-row .v-list {
  background-color: #2c2c2e !important;
  border: 1px solid #3a3a3c !important;
}

[data-theme="dark"] .actions-row .v-list-item {
  color: #ffffff !important;
}

[data-theme="dark"] .actions-row .v-list-item:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

[data-theme="dark"] .actions-row .v-list-item.text-error {
  color: #ff453a !important;
}
.accounts-table :deep(.v-data-table__tr) {
  transition: all 0.3s ease-in-out;
}

.accounts-table :deep(.v-data-table__tr:hover) {
  background-color: rgba(25, 118, 210, 0.04) !important;
}

/* Анимация для обновляющихся элементов */
.stat-value {
  transition: all 0.3s ease-in-out;
  display: inline-block;
}

.stat-value.updating {
  transform: scale(1.05);
  color: #ff9800;
}


/* Компактное отображение названия компании */
.company-name-compact {
  font-weight: 500;
  color: #333;
  padding: 4px 8px;
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Стили для легенды компании */
.company-legend {
  padding: 12px;
  min-width: 350px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Цветовые индикаторы для компании */
.legend-color.company-status {
  background: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.legend-color.hierarchy-status {
  background: #9c27b0;
  box-shadow: 0 0 0 2px rgba(156, 39, 176, 0.2);
}

.legend-color.parent-status {
  background: #ff9800;
  box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.2);
}

.admin-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Базовые стили для всех компактных элементов */
.compact-base {
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: help;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-base:hover {
  transform: scale(1.02);
}

/* Минималистичное отображение ID */
.id-minimal {
  font-weight: 600;
  font-size: 0.8rem;
  cursor: help;
  transition: all 0.2s ease;
  padding: 2px 6px;
  border-radius: 6px;
  color: #666;
  background-color: rgba(0, 0, 0, 0.04);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.id-minimal:hover {
  background-color: rgba(0, 0, 0, 0.08);
  color: #333;
  transform: scale(1.05);
}


/* Плавный переход ширины колонки */
.accounts-table .v-data-table__td {
  transition: width 0.3s ease;
}

/* Минималистичное отображение типа аккаунта */
.type-minimal {
  font-weight: 500;
  font-size: 0.875rem;
  padding: 2px 4px;
  color: #333;
}

.type-minimal.type-partner {
  color: #333;
}

.type-minimal.type-client {
  color: #333;
}




/* Отображение объектов */
.no-objects {
  font-size: 0.75rem;
  color: #9e9e9e;
  font-style: italic;
}

.objects-display {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 0.875rem;
  font-weight: 500;
}

.objects-active {
  color: #2e7d32;
}

.objects-total {
  color: #1976d2;
}

.objects-separator {
  color: #666;
  margin: 0 1px;
}

.objects-deleted {
  color: #d32f2f;
}

.deleted-count {
  color: #d32f2f;
}

/* Минималистичное отображение статуса */
.status-minimal {
  font-weight: 500;
  font-size: 0.875rem;
  padding: 2px 4px;
  color: #333;
}

.status-minimal.status-active {
  color: #333;
}

.status-minimal.status-inactive {
  color: #d32f2f;
}

/* Стили для иконок статуса */
.status-icon {
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  height: 100% !important;
}

.status-icon:hover {
  transform: scale(1.1);
  filter: brightness(1.2);
}

/* Дополнительные стили для центрирования иконок в ячейке */
.accounts-table :deep(.v-data-table__td) .v-tooltip .v-tooltip__activator {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  width: 100% !important;
  height: 100% !important;
}

/* Минималистичное отображение блокировки */
.blocking-minimal {
  font-weight: 500;
  font-size: 0.875rem;
  padding: 2px 4px;
  color: #333;
}

.blocking-minimal.blocking-critical {
  color: #333;
}

.blocking-minimal.blocking-warning {
  color: #333;
}

.blocking-minimal.blocking-normal {
  color: #333;
}

.blocking-minimal.blocking-none {
  color: #333;
}

/* Минималистичное отображение даты создания */
.creation-minimal {
  font-weight: 500;
  font-size: 0.875rem;
  padding: 2px 4px;
  color: #333;
}

/* Ряд действий */
.actions-row {
  display: flex;
  align-items: center;
  gap: 2px;
  justify-content: center;
}

.actions-row .v-btn {
  min-width: 24px !important;
  width: 24px;
  height: 24px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.actions-row .v-btn:hover {
  opacity: 1;
}

/* Refresh-кнопка для wialon записей: видна только при hover строки. Чтобы не засорять таблицу 3000+ иконок */
.row-refresh-btn {
  opacity: 0 !important;
  transition: opacity 0.15s ease;
}
:deep(tr:hover) .row-refresh-btn,
.row-refresh-btn:focus-visible {
  opacity: 0.85 !important;
}
.row-refresh-btn:hover {
  opacity: 1 !important;
}

/* Стили для меню дополнительных действий */
.actions-row .v-menu .v-list {
  min-width: 200px;
}

.actions-row .v-list-item {
  min-height: 36px;
  padding: 8px 16px;
}

.actions-row .v-list-item .v-list-item__prepend {
  margin-inline-end: 12px;
}

.actions-row .v-list-item .v-list-item__content {
  font-size: 14px;
}

.actions-row .v-list-item.text-error {
  color: rgb(var(--v-theme-error)) !important;
}

.actions-row .v-list-item.text-error .v-list-item__prepend .v-icon {
  color: rgb(var(--v-theme-error)) !important;
}



/* Компактное отображение статуса аккаунта */
.objects-compact {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
  border: 1px solid #ddd;
  cursor: help;
  transition: all 0.2s ease;
  font-family: 'Roboto Mono', monospace;
  font-weight: 600;
  font-size: 0.875rem;
  margin: 0 auto;
}

.objects-compact:hover {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border-color: #1976d2;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
}

.objects-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
}

.objects-active {
  color: #2e7d32;
  font-weight: 700;
}

.objects-total {
  color: #1976d2;
  font-weight: 600;
}

.objects-separator {
  color: #666;
  margin: 0 2px;
  font-weight: 400;
}

.objects-deleted {
  display: inline-flex;
  align-items: center;
}

.deleted-count {
  color: #d32f2f;
  font-weight: 700;
}

/* Стили для легенды в тултипе */

</style>

<style>
/* Popup-стили global, чтобы достать Vuetify teleport */
/* Стили для всплывающего меню в стиле скриншота */
.objects-popup,
.id-popup {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 0;
  min-width: 380px;
  max-width: 450px;
  border: none;
  /* Убираем рамку */
}

.popup-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 12px 12px 0 0;
}

.popup-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #007AFF 0%, #0056CC 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.popup-icon .v-icon {
  color: white;
  font-size: 18px;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  flex: 1;
}

.popup-actions {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.popup-action-btn {
  flex: 1;
  height: 36px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-transform: none;
  border: 1px solid #007AFF;
  color: #007AFF;
  background: white;
  transition: all 0.2s ease;
}

.popup-action-btn:hover {
  background: #007AFF;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.popup-content {
  padding: 20px;
}

.popup-field {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  min-height: 20px;
}

.popup-field:last-child {
  border-bottom: none;
}

.field-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
  min-width: 140px;
  flex-shrink: 0;
  margin-right: 16px;
}

.field-value {
  font-size: 13px;
  color: #1a1a1a;
  font-weight: 600;
  text-align: right;
  flex: 1;
  word-break: break-word;
  line-height: 1.4;
  max-width: 200px;
}

/* Специальные стили для иерархии */
.hierarchy-field {
  align-items: flex-start;
}

.hierarchy-value {
  text-align: left !important;
  max-width: none !important;
  white-space: normal;
  word-break: break-word;
  line-height: 1.5;
  font-size: 12px;
  color: #555;
}

.phone-link,
.email-link {
  color: #007AFF;
  text-decoration: underline;
  cursor: pointer;
}

.phone-link:hover,
.email-link:hover {
  color: #0056CC;
}

/* Цветовое кодирование для полей */
.text-success {
  color: #2e7d32 !important;
}

.text-error {
  color: #d32f2f !important;
}

.text-warning {
  color: #f57c00 !important;
}

/* Стили для tooltip */
.objects-tooltip :deep(.v-tooltip__content),
.id-tooltip :deep(.v-tooltip__content) {
  background: transparent !important;
  padding: 0 !important;
  box-shadow: none !important;
  border: none !important;
}

.objects-tooltip :deep(.v-overlay__content),
.id-tooltip :deep(.v-overlay__content) {
  background: transparent !important;
  padding: 0 !important;
  box-shadow: none !important;
  border: none !important;
}

/* Предотвращаем закрытие tooltip при наведении на содержимое */
.objects-tooltip :deep(.v-overlay),
.id-tooltip :deep(.v-overlay) {
  pointer-events: none !important;
}

.objects-tooltip :deep(.v-overlay .draggable-popup),
.id-tooltip :deep(.v-overlay .draggable-popup) {
  pointer-events: auto !important;
}

/* Дополнительные стили для предотвращения закрытия */
.objects-tooltip :deep(.v-tooltip__content),
.id-tooltip :deep(.v-tooltip__content) {
  pointer-events: auto !important;
}

.objects-tooltip :deep(.v-overlay__content),
.id-tooltip :deep(.v-overlay__content) {
  pointer-events: auto !important;
}

/* Стили для popup */
.draggable-popup {
  position: fixed !important;
  z-index: 9999 !important;
  /* Принудительная защита от исчезновения */
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  /* Плавное позиционирование */
  transform: translate(var(--popup-x, 0px), var(--popup-y, 0px));
  transition: transform 0.2s ease-out;
  /* Улучшенные стили для лучшей видимости */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: none;
  /* Убираем рамку */
  border-radius: 8px;
  background: white;
  /* Максимальная ширина для предотвращения перекрытия */
  max-width: 400px;
  min-width: 300px;
}

.draggable-header {
  user-select: none;
}

.close-btn {
  margin-left: auto;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.close-btn:hover {
  opacity: 1;
}

/* Дополнительные стили для предотвращения закрытия popup */
.objects-tooltip :deep(.v-overlay__backdrop),
.id-tooltip :deep(.v-overlay__backdrop) {
  pointer-events: none !important;
}

.objects-tooltip :deep(.v-overlay__scrim),
.id-tooltip :deep(.v-overlay__scrim) {
  pointer-events: none !important;
}

/* Убеждаемся, что popup остается открытым */
.draggable-popup:hover {
  pointer-events: auto !important;
}

.draggable-popup * {
  pointer-events: auto !important;
}

/* Стили для id-popup (используем те же стили что и objects-popup) */
.id-popup {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 0;
  min-width: 380px;
  max-width: 450px;
  border: none;
  /* Убираем рамку */
}
</style>
