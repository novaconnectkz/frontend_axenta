<template>
  <AppleCard class="users-table-card" variant="outlined">
    <div class="table-container">
      <v-data-table
        :headers="tableHeaders"
        :items="users"
        :loading="loading"
        :items-per-page="-1"
        :sort-by="[{ key: 'creation_datetime', order: 'desc' }]"
        @update:sort-by="(s) => $emit('sort-change', s)"
        item-value="id"
        class="users-table"
        :row-props="getRowProps"
        :must-sort="true"
        hide-default-footer
        no-data-text="Пользователи не найдены"
        loading-text="Загрузка пользователей..."
      >
        <template #item.rowNumber="{ index }">
          <span class="row-number">{{ (pagination.page - 1) * pagination.limit + index + 1 }}</span>
        </template>

        <template #item.id="{ item }">
          <span class="font-mono">{{ item.id }}</span>
        </template>

        <template #item.username="{ item }">
          <div class="user-cell">
            <div class="user-avatar">
              <v-avatar size="32" :color="getUserAvatarColor(item)">
                <span class="text-white">{{ getUserInitials(item) }}</span>
              </v-avatar>
            </div>
            <div class="user-info">
              <div class="user-username">@{{ item.username }}</div>
            </div>
          </div>
        </template>

        <template #item.email="{ item }">
          <a :href="`mailto:${item.email}`" class="email-link">{{ item.email }}</a>
        </template>

        <template #item.name="{ item }">
          <span v-if="item.name" class="text-body-2">{{ item.name }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.creator_name="{ item }">
          <span v-if="item.creator_name || (item as any).creatorName" class="text-body-2">
            {{ item.creator_name || (item as any).creatorName }}
          </span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.creation_datetime="{ item }">
          <v-tooltip v-if="item.creation_datetime" location="top">
            <template #activator="{ props }">
              <span v-bind="props" class="text-body-2">
                {{ formatDateOnly(item.creation_datetime) }}
              </span>
            </template>
            <span>{{ formatTimeOnly(item.creation_datetime) }}</span>
          </v-tooltip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.role="{ item }">
          <div v-if="item.role" class="d-flex align-center">
            <v-tooltip
              v-if="['Партнер', 'Партнёр', 'Клиент'].includes(item.role.display_name)"
              location="top"
            >
              <template #activator="{ props }">
                <v-icon
                  v-bind="props"
                  :icon="getRoleIcon(item.role.display_name)"
                  :color="item.role.color || 'primary'"
                  size="28"
                  class="role-icon-only"
                />
              </template>
              <span>{{ item.role.display_name }}</span>
            </v-tooltip>
            <template v-else>
              <v-icon
                :icon="getRoleIcon(item.role.display_name)"
                :color="item.role.color || 'primary'"
                size="24"
                class="role-icon"
              />
              <span class="role-name ml-2">{{ item.role.display_name }}</span>
            </template>
          </div>
          <span v-else class="text-medium-emphasis">Не назначена</span>
        </template>

        <template #item.source="{ item }">
          <v-chip :color="getSourceColor(item.source)" size="small" variant="tonal">
            <v-icon start size="16">{{ getSourceIcon(item.source) }}</v-icon>
            {{ getSourceLabel(item.source) }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <div class="actions-cell">
            <v-btn
              :icon="item.is_active ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline'"
              variant="text"
              size="x-small"
              :color="item.is_active ? 'warning' : 'success'"
              @click="$emit('toggle-activity', item, !item.is_active)"
              :title="item.is_active ? 'Деактивировать' : 'Активировать'"
            />
            <v-menu>
              <template #activator="{ props }">
                <v-btn
                  icon="mdi-dots-vertical"
                  size="x-small"
                  variant="text"
                  v-bind="props"
                  title="Дополнительные действия"
                />
              </template>
              <v-list density="compact">
                <v-list-item
                  prepend-icon="mdi-monitor-dashboard"
                  title="Войти в мониторинг"
                  @click="$emit('login-monitoring', item)"
                />
                <v-list-item
                  v-if="item.role && (item.role.display_name === 'Партнер' || item.role.display_name === 'Партнёр')"
                  prepend-icon="mdi-cog-transfer-outline"
                  title="Войти в CMS"
                  @click="$emit('login-cms', item)"
                />
                <v-divider />
                <v-list-item @click="$emit('view', item)" prepend-icon="mdi-account-cog-outline">
                  <v-list-item-title>Свойства пользователя</v-list-item-title>
                </v-list-item>
                <v-list-item @click="$emit('reset-password', item)" prepend-icon="mdi-lock-reset">
                  <v-list-item-title>Сменить пароль</v-list-item-title>
                </v-list-item>
                <v-divider />
                <v-list-item @click="$emit('delete', item)" prepend-icon="mdi-delete-outline" class="text-error">
                  <v-list-item-title>Удалить пользователя</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </template>
      </v-data-table>

      <div class="compact-pagination">
        <v-select
          :model-value="pagination.limit"
          :items="perPageOptions"
          variant="outlined"
          density="compact"
          class="items-select"
          hide-details
          @update:model-value="(v: number) => $emit('per-page-change', v)"
        />
        <span class="range-info">{{ displayRange }} из {{ serverItemsLength }}</span>
        <div class="nav-controls">
          <v-btn icon="mdi-page-first" variant="text" size="x-small" :disabled="pagination.page === 1" title="Первая" @click="$emit('page-change', 1)" />
          <v-btn icon="mdi-chevron-left" variant="text" size="x-small" :disabled="pagination.page === 1" title="Предыдущая" @click="$emit('page-change', pagination.page - 1)" />
          <span class="page-info">{{ pagination.page }} / {{ totalPages || 1 }}</span>
          <v-btn icon="mdi-chevron-right" variant="text" size="x-small" :disabled="pagination.page >= (totalPages || 1)" title="Следующая" @click="$emit('page-change', pagination.page + 1)" />
          <v-btn icon="mdi-page-last" variant="text" size="x-small" :disabled="pagination.page >= (totalPages || 1)" title="Последняя" @click="$emit('page-change', totalPages || 1)" />
        </div>
      </div>
    </div>
  </AppleCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import { useUserAvatar } from '@/composables/useUserAvatar';
import type { UserWithRelations } from '@/types/users';

const props = defineProps<{
  users: UserWithRelations[];
  loading: boolean;
  pagination: { page: number; limit: number };
  serverItemsLength: number;
  totalPages: number;
}>();

defineEmits<{
  (e: 'page-change', page: number): void;
  (e: 'per-page-change', limit: number): void;
  (e: 'sort-change', sortBy: any[]): void;
  (e: 'toggle-activity', user: UserWithRelations, isActive: boolean): void;
  (e: 'login-monitoring', user: UserWithRelations): void;
  (e: 'login-cms', user: UserWithRelations): void;
  (e: 'view', user: UserWithRelations): void;
  (e: 'reset-password', user: UserWithRelations): void;
  (e: 'delete', user: UserWithRelations): void;
}>();

const {
  getUserInitials,
  getUserAvatarColor,
  getRoleIcon,
  getSourceColor,
  getSourceIcon,
  getSourceLabel,
  getRowProps,
} = useUserAvatar();

const tableHeaders = [
  { title: '№', value: 'rowNumber', sortable: false, cellProps: { class: 'col-fit' }, headerProps: { class: 'col-fit' } },
  { title: 'Пользователь', value: 'username', sortable: true, cellProps: { class: 'col-wrap' }, headerProps: { class: 'col-wrap' } },
  { title: 'Email', value: 'email', sortable: true, cellProps: { class: 'col-wrap' }, headerProps: { class: 'col-wrap' } },
  { title: 'Полное имя', value: 'name', sortable: true, cellProps: { class: 'col-wrap' }, headerProps: { class: 'col-wrap' } },
  { title: 'Создатель', value: 'creator_name', sortable: true, cellProps: { class: 'col-wrap' }, headerProps: { class: 'col-wrap' } },
  { title: 'Дата', value: 'creation_datetime', sortable: true, cellProps: { class: 'col-fit' }, headerProps: { class: 'col-fit' } },
  { title: 'Роль', value: 'role', sortable: false, cellProps: { class: 'col-fit' }, headerProps: { class: 'col-fit' } },
  { title: 'Источник', value: 'source', sortable: true, cellProps: { class: 'col-fit' }, headerProps: { class: 'col-fit' } },
  { title: 'Действия', value: 'actions', sortable: false, cellProps: { class: 'col-fit actions-col' }, headerProps: { class: 'col-fit actions-col' } },
];

const perPageOptions = [
  { value: 5, title: '5' },
  { value: 10, title: '10' },
  { value: 25, title: '25' },
  { value: 50, title: '50' },
  { value: 75, title: '75' },
  { value: 100, title: '100' },
  { value: 150, title: '150' },
];

const displayRange = computed(() => {
  const total = props.serverItemsLength || 0;
  if (total === 0) return '0';
  const from = (props.pagination.page - 1) * props.pagination.limit + 1;
  const to = Math.min(props.pagination.page * props.pagination.limit, total);
  return `${from}-${to}`;
});

const formatDateOnly = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatTimeOnly = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<style scoped>
.users-table-card {
  padding: 0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
}
.table-container {
  padding: 0 16px 16px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow-x: hidden;
}
:deep(.users-table) { width: 100%; max-width: 100%; }
:deep(.users-table .v-table__wrapper) { overflow-x: auto; max-width: 100%; }
:deep(.users-table-card .v-card__content),
:deep(.users-table-card .apple-card-content) {
  overflow-x: auto;
  max-width: 100%;
}
.users-table {
  background: transparent !important;
}
:deep(.users-table table) { table-layout: auto; width: 100%; }
:deep(.users-table .col-fit) { width: 1%; white-space: nowrap; }
:deep(.users-table .col-wrap) {
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
  min-width: 100px;
}
:deep(.users-table .col-fit.actions-col) { padding-left: 8px; padding-right: 8px; }
.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-username {
  font-weight: 500;
  color: var(--text-primary);
}
.email-link {
  color: var(--apple-blue);
  text-decoration: none;
}
.email-link:hover { text-decoration: underline; }
.font-mono { font-family: 'SF Mono', monospace; font-size: 0.875rem; }
.row-number { color: var(--text-secondary); font-size: 0.875rem; }
.role-icon, .role-icon-only { flex-shrink: 0; }
.role-name {
  font-size: 0.875rem;
  color: var(--text-primary);
}
.actions-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}
.compact-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 20px 24px;
  flex-wrap: wrap;
  white-space: nowrap;
  min-height: 40px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 0 16px;
  box-sizing: border-box;
  max-width: calc(100% - 32px);
}
.items-select {
  min-width: 60px !important;
  width: fit-content !important;
  max-width: 120px !important;
  flex-shrink: 0;
  height: 40px;
}
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
.items-select :deep(.v-field__append-inner) { padding-left: 4px !important; }
.items-select :deep(.v-select__selection) {
  max-width: none !important;
  min-width: 0 !important;
}
.range-info {
  font-size: 0.9rem;
  color: #555;
  flex-shrink: 0;
  min-width: 120px;
  text-align: center;
  font-weight: 600;
  padding: 8px 12px;
  background-color: #f0f0f0;
  border-radius: 6px;
}
.nav-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 4px;
  background-color: #f0f0f0;
  border-radius: 6px;
}
.page-info {
  font-size: 0.9rem;
  color: #555;
  font-weight: 700;
  min-width: 50px;
  text-align: center;
  padding: 8px 12px;
  background-color: #e8e8e8;
  border-radius: 6px;
}
.nav-controls .v-btn {
  min-width: 32px !important;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background-color: white;
  border: 1px solid #ddd;
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
[data-theme="dark"] .nav-controls { background-color: #3a3a3c; }
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
[data-theme="dark"] .items-select :deep(.v-field__input) { color: #ffffff !important; }
[data-theme="dark"] .items-select :deep(.v-label) { color: #8e8e93 !important; }

@media (max-width: 768px) {
  .compact-pagination {
    padding: 12px;
    gap: 8px;
    margin: 0 8px;
    justify-content: center;
  }
  .range-info { min-width: auto; padding: 6px 10px; font-size: 0.85rem; }
  .nav-controls { padding: 2px; gap: 2px; }
  .nav-controls .v-btn { min-width: 28px !important; width: 28px; height: 28px; }
  .page-info { min-width: 40px; padding: 6px 8px; font-size: 0.85rem; }
  .table-container { padding: 0 8px 8px; }
}
:deep(.inactive-user) {
  background-color: rgba(244, 67, 54, 0.08) !important;
  border-left: 4px solid #f44336 !important;
}
</style>
