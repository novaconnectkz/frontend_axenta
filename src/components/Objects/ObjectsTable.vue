<template>
  <AppleCard class="objects-table-card" variant="outlined">
    <template v-if="selectedObjects.length > 0" #header>
      <div class="table-header table-header--compact">
        <div class="mass-actions">
          <v-chip :text="`Выбрано: ${selectedObjects.length}`" color="primary" variant="outlined" size="small"
            class="mr-2" />
          <AppleButton variant="secondary" size="small" prepend-icon="mdi-check-circle"
            @click="$emit('toggleAllActivity', true)" class="mr-2">
            Активировать
          </AppleButton>
          <AppleButton variant="secondary" size="small" prepend-icon="mdi-pause-circle"
            @click="$emit('toggleAllActivity', false)" class="mr-2">
            Деактивировать
          </AppleButton>
          <AppleButton variant="text" size="small" prepend-icon="mdi-close" @click="clearSelection">
            Отменить выбор
          </AppleButton>
        </div>
      </div>
    </template>

    <!-- Таблица объектов -->
    <div v-if="viewMode === 'table'" class="table-container">
      <v-data-table-server
        :headers="headers"
        :items="combinedObjects"
        :loading="false"
        :items-per-page="pagination.per_page"
        :page="pagination.page"
        :items-length="objectsTotal"
        :items-per-page-options="perPageOptions"
        :model-value="selectedObjects"
        @update:model-value="selectedObjects = $event as any[]"
        @update:page="(p: number) => $emit('pageChange', p)"
        @update:items-per-page="(p: number) => $emit('perPageChange', p)"
        @update:sort-by="(s: any) => $emit('sortChange', s)"
        item-value="id"
        show-select
        hide-default-footer
        class="objects-table"
        no-data-text="Объекты не найдены"
        loading-text="Загрузка объектов..."
      >
        <template #header.is_active>
          <v-icon icon="mdi-power" size="20" :title="'Статус (вкл/выкл)'" />
        </template>

        <template #header.scheduled_delete_at>
          <v-icon icon="mdi-clock-alert-outline" size="20" title="Плановое удаление" />
        </template>
        <template #header.deleted_at>
          <v-icon icon="mdi-delete-clock-outline" size="20" title="Дата удаления" />
        </template>

        <template #item.is_active="{ item }">
          <v-icon
            v-if="showDeletedObjects || item.scheduledDelete || item.deleted_at || item.axenta_deleted_at"
            icon="mdi-delete-circle"
            color="error"
            size="22"
            title="В корзине"
          />
          <v-icon
            v-else-if="item.is_active"
            icon="mdi-check-circle"
            color="success"
            size="22"
            :title="'Активный (клик — деактивировать)'"
            style="cursor:pointer"
            @click="$emit('toggleActivity', item, false)"
          />
          <v-icon
            v-else
            icon="mdi-pause-circle"
            color="warning"
            size="22"
            :title="'Деактивирован (клик — активировать)'"
            style="cursor:pointer"
            @click="$emit('toggleActivity', item, true)"
          />
        </template>

        <template #item.accountName="{ item }">
          <span>{{ item.accountName || 'Не указано' }}</span>
        </template>

        <template #item.creatorName="{ item }">
          <span>{{ item.creatorName || 'Не указан' }}</span>
        </template>

        <template #item.deviceTypeName="{ item }">
          <span>{{ item.deviceTypeName || 'Не указана' }}</span>
        </template>

        <template #item.phoneNumbers="{ item }">
          <div v-if="item.phoneNumbers && item.phoneNumbers.length > 0">
            <div v-for="phone in item.phoneNumbers" :key="phone" class="text-caption">
              {{ phone }}
            </div>
          </div>
          <span v-else class="text-medium-emphasis">Не указаны</span>
        </template>

        <template #item.createdAt="{ item }">
          <div class="text-caption">{{ formatDate(item.createdAt || item.created_at) }}</div>
        </template>

        <template #item.lastMessageDatetime="{ item }">
          <div v-if="item.lastMessageDatetime" class="text-caption">
            {{ formatDate(item.lastMessageDatetime) }}
          </div>
          <div v-else class="text-caption text-medium-emphasis">Нет данных</div>
        </template>

        <template #item.uniqueId="{ item }">
          <span class="font-mono text-caption">{{ item.uniqueId || item.external_id || 'Не указан' }}</span>
        </template>

        <template #header.source>
          <v-icon icon="mdi-source-branch" size="20" title="Источник" />
        </template>

        <template #item.source="{ item }">
          <v-icon
            v-if="item.source === 'axenta'"
            icon="mdi-cloud-outline"
            color="primary"
            size="22"
            :title="item.sourceLabel || 'Axenta Cloud'"
          />
          <v-icon
            v-else-if="item.source === 'wh' || item.source === 'wl'"
            icon="mdi-satellite-uplink"
            :color="getConnectionColor(item.connectionId)"
            size="22"
            :title="item.sourceLabel || (item.source === 'wh' ? 'Wialon Hosting' : 'Wialon Local')"
          />
          <v-icon v-else icon="mdi-help-circle-outline" color="grey" size="22" :title="item.source || ''" />
        </template>

        <template #item.status="{ item }">
          <v-chip :text="getStatusText(item.status)" :color="getStatusColor(item.status)" size="small" variant="tonal" />
        </template>

        <template #item.type="{ item }">
          <div class="d-flex align-center">
            <v-icon :icon="getTypeIcon(item.type)" size="20" class="mr-2" />
            {{ getTypeText(item.type) }}
          </div>
        </template>

        <template #item.contract="{ item }">
          <div v-if="item.contract">
            <div class="font-weight-medium">{{ item.contract.client_name }}</div>
            <div class="text-caption text-medium-emphasis">№{{ item.contract.id }}</div>
          </div>
        </template>

        <template #item.location="{ item }">
          <div v-if="item.location">
            <v-icon icon="mdi-map-marker" size="16" class="mr-1" />
            {{ item.location.name }}
          </div>
        </template>

        <template #item.last_activity_at="{ item }">
          <div v-if="item.last_activity_at" class="text-caption">{{ formatDate(item.last_activity_at) }}</div>
          <div v-else class="text-caption text-medium-emphasis">Нет данных</div>
        </template>

        <template #item.scheduled_delete_at="{ item }">
          <div v-if="item.scheduled_delete_at" class="d-flex align-center">
            <v-icon icon="mdi-clock-alert" size="16" color="warning" class="mr-1" />
            <span class="text-caption text-warning">{{ formatDate(item.scheduled_delete_at) }}</span>
          </div>
        </template>

        <template #item.actions="{ item }">
          <div class="actions-cell">
            <template v-if="!showDeletedObjects">
              <v-menu>
                <template #activator="{ props }">
                  <v-icon v-bind="props" icon="mdi-dots-vertical" size="20" class="actions-dots" />
                </template>

                <v-list density="compact">
                  <v-list-item prepend-icon="mdi-card-account-details-outline" title="Свойства объекта"
                    @click="$emit('view', item)" />
                  <v-list-item prepend-icon="mdi-pencil" title="Редактировать" @click="$emit('edit', item)" />
                  <v-divider />
                  <v-list-item v-if="item.scheduled_delete_at" prepend-icon="mdi-restore" title="Отменить удаление"
                    @click="$emit('cancelScheduledDelete', item)" />
                  <v-list-item v-else prepend-icon="mdi-clock-alert" title="Запланировать удаление"
                    @click="$emit('scheduleDelete', item)" />
                  <v-divider />
                  <v-list-item prepend-icon="mdi-delete" title="Удалить" class="text-error"
                    @click="$emit('delete', item)" />
                </v-list>
              </v-menu>
            </template>

            <template v-else>
              <v-tooltip text="Восстановить">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon="mdi-restore" size="small" variant="text" color="success"
                    @click="$emit('restore', item)" />
                </template>
              </v-tooltip>

              <v-tooltip text="Удалить навсегда">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon="mdi-delete-forever" size="small" variant="text" color="error"
                    @click="$emit('permanentDelete', item)" />
                </template>
              </v-tooltip>
            </template>
          </div>
        </template>
      </v-data-table-server>

      <!-- Кастомная пагинация (как в /accounts) -->
      <div class="compact-pagination" v-if="objectsTotal > 0">
        <v-select
          :model-value="pagination.per_page"
          :items="perPageOptions"
          variant="outlined"
          density="compact"
          class="items-select"
          hide-details
          @update:model-value="(v: number) => $emit('perPageChange', v)"
        />
        <span class="range-info">{{ paginationRange }} из {{ objectsTotal }}</span>
        <div class="nav-controls">
          <v-btn icon="mdi-page-first" variant="text" size="x-small"
            :disabled="pagination.page === 1" title="Первая"
            @click="$emit('pageChange', 1)" />
          <v-btn icon="mdi-chevron-left" variant="text" size="x-small"
            :disabled="pagination.page === 1" title="Предыдущая"
            @click="$emit('pageChange', pagination.page - 1)" />
          <span class="page-info">{{ pagination.page }} / {{ paginationTotalPages }}</span>
          <v-btn icon="mdi-chevron-right" variant="text" size="x-small"
            :disabled="pagination.page >= paginationTotalPages" title="Следующая"
            @click="$emit('pageChange', pagination.page + 1)" />
          <v-btn icon="mdi-page-last" variant="text" size="x-small"
            :disabled="pagination.page >= paginationTotalPages" title="Последняя"
            @click="$emit('pageChange', paginationTotalPages)" />
        </div>
      </div>
    </div>

    <!-- Сетка объектов -->
    <div v-else class="grid-container">
      <div class="objects-grid">
        <AppleCard v-for="object in objects" :key="object.id" :title="object.name"
          :subtitle="getTypeText(object.type)" :icon="getTypeIcon(object.type)" variant="outlined" clickable hover
          class="object-card" @click="$emit('view', object)">
          <div class="object-card-content">
            <div class="object-info">
              <div class="info-row">
                <v-icon icon="mdi-identifier" size="16" />
                <span>{{ object.imei || 'Не указан' }}</span>
              </div>
              <div class="info-row">
                <v-icon icon="mdi-phone" size="16" />
                <span>{{ object.phone_number || 'Не указан' }}</span>
              </div>
              <div class="info-row">
                <v-icon icon="mdi-map-marker" size="16" />
                <span>{{ object.location?.name || 'Не указана' }}</span>
              </div>
            </div>

            <div class="object-status">
              <v-chip :text="getStatusText(object.status)" :color="getStatusColor(object.status)" size="small"
                variant="tonal" />
            </div>
          </div>

          <template #footer>
            <div class="object-card-actions">
              <AppleButton variant="text" size="small" prepend-icon="mdi-eye" @click.stop="$emit('view', object)">
                Просмотр
              </AppleButton>
              <AppleButton variant="text" size="small" prepend-icon="mdi-pencil" @click.stop="$emit('edit', object)">
                Изменить
              </AppleButton>
            </div>
          </template>
        </AppleCard>
      </div>
    </div>
  </AppleCard>
</template>

<script setup lang="ts">
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import {
  formatDate,
  getConnectionColor,
  getStatusColor,
  getStatusText,
  getTypeIcon,
  getTypeText,
} from '@/utils/objectsHelpers';

defineProps<{
  combinedObjects: any[];
  objects: any[];
  objectsTotal: number;
  headers: any[];
  pagination: { page: number; per_page: number };
  perPageOptions: number[];
  paginationRange: string;
  paginationTotalPages: number;
  viewMode: 'table' | 'grid';
  showDeletedObjects: boolean;
}>();

const selectedObjects = defineModel<any[]>('selectedObjects', { required: true });
const selectAll = defineModel<boolean>('selectAll', { required: true });

const emit = defineEmits<{
  pageChange: [page: number];
  perPageChange: [perPage: number];
  sortChange: [sortBy: any];
  toggleActivity: [item: any, active: boolean];
  toggleAllActivity: [active: boolean];
  view: [item: any];
  edit: [item: any];
  cancelScheduledDelete: [item: any];
  scheduleDelete: [item: any];
  delete: [item: any];
  restore: [item: any];
  permanentDelete: [item: any];
}>();

void emit;

function clearSelection() {
  selectedObjects.value = [];
  selectAll.value = false;
}
</script>

<style scoped>
.objects-table-card {
  margin: 0;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
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

.object-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

[data-theme="dark"] .object-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.mass-actions {
  display: flex;
  align-items: center;
  margin-right: 16px;
}

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
</style>
