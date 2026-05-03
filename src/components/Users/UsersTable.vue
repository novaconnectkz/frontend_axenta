<template>
  <AppleCard class="users-table-card" variant="outlined">
    <div class="table-container">
      <v-data-table
        :headers="tableHeaders"
        :items="users"
        :loading="loading"
        :items-per-page="pagination.limit"
        :page="pagination.page"
        :server-items-length="serverItemsLength"
        :items-per-page-options="perPageOptions"
        :sort-by="[{ key: 'creation_datetime', order: 'desc' }]"
        @update:page="(p) => $emit('page-change', p)"
        @update:items-per-page="(l) => $emit('per-page-change', l)"
        @update:sort-by="(s) => $emit('sort-change', s)"
        item-value="id"
        class="users-table"
        :row-props="getRowProps"
        :must-sort="false"
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
          v-model="itemsPerPageForSelect"
          :items="perPageOptions"
          variant="outlined"
          density="compact"
          class="items-select"
          @update:model-value="(l) => $emit('per-page-change', l)"
          hide-details
        />
        <span class="range-info">
          {{
            pagination.limit > 0 && pagination.limit < 100000
              ? `${(pagination.page - 1) * pagination.limit + 1}-${Math.min(
                  pagination.page * pagination.limit,
                  serverItemsLength
                )} из ${serverItemsLength}`
              : `Все ${serverItemsLength} записей`
          }}
        </span>
        <div class="nav-controls">
          <v-btn
            icon="mdi-page-first"
            variant="text"
            size="x-small"
            :disabled="pagination.page === 1"
            @click="$emit('page-change', 1)"
            title="Первая"
          />
          <v-btn
            icon="mdi-chevron-left"
            variant="text"
            size="x-small"
            :disabled="pagination.page === 1"
            @click="$emit('page-change', pagination.page - 1)"
            title="Предыдущая"
          />
          <span class="page-info">{{ pagination.page }} / {{ totalPages || 1 }}</span>
          <v-btn
            icon="mdi-chevron-right"
            variant="text"
            size="x-small"
            :disabled="pagination.page >= (totalPages || 1)"
            @click="$emit('page-change', pagination.page + 1)"
            title="Следующая"
          />
          <v-btn
            icon="mdi-page-last"
            variant="text"
            size="x-small"
            :disabled="pagination.page >= (totalPages || 1)"
            @click="$emit('page-change', totalPages || 1)"
            title="Последняя"
          />
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
  { title: '№', value: 'rowNumber', sortable: false, width: 60 },
  { title: 'ID', value: 'id', sortable: true, width: 80 },
  { title: 'Пользователь', value: 'username', sortable: true, width: 180 },
  { title: 'Email', value: 'email', sortable: true },
  { title: 'Полное имя', value: 'name', sortable: true },
  { title: 'Создатель', value: 'creator_name', sortable: true },
  { title: 'Дата создания', value: 'creation_datetime', sortable: true },
  { title: 'Роль', value: 'role', sortable: false },
  { title: 'Источник', value: 'source', sortable: true },
  { title: 'Действия', value: 'actions', sortable: false, width: 160 },
];

const perPageOptions = [
  { title: '5', value: 5 },
  { title: '10', value: 10 },
  { title: '25', value: 25 },
  { title: '50', value: 50 },
  { title: '75', value: 75 },
  { title: '100', value: 100 },
  { title: '150', value: 150 },
];

const itemsPerPageForSelect = computed({
  get: () => (props.pagination.limit === 100000 ? -1 : props.pagination.limit),
  set: () => {
    /* setter в parent через emit */
  },
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
.users-table-card { padding: 0; }
.table-container { padding: 0 16px 16px; }
.users-table {
  background: transparent !important;
}
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
  gap: 16px;
  padding: 12px 16px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.items-select { max-width: 100px; }
.range-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
}
.nav-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}
.page-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
  min-width: 60px;
  text-align: center;
}
:deep(.inactive-user) {
  background-color: rgba(244, 67, 54, 0.08) !important;
  border-left: 4px solid #f44336 !important;
}
</style>
