<template>
  <div class="axenta-roles-management">
    <!-- Заголовок секции -->
    <div class="section-header">
      <div class="section-title">
        <v-icon icon="mdi-account-network" size="24" class="section-icon" />
        <h3>Управление ролями Axenta</h3>
      </div>
      
      <div class="section-actions">
        <AppleButton
          prepend-icon="mdi-refresh"
          variant="outlined"
          size="small"
          @click="refreshData"
          :loading="loading"
        >
          Обновить
        </AppleButton>
        
        <AppleButton
          prepend-icon="mdi-account-plus"
          size="small"
          @click="openCreateLocalUserDialog"
        >
          Создать локального
        </AppleButton>
        
        <AppleButton
          prepend-icon="mdi-sync"
          variant="outlined"
          size="small"
          @click="openSyncDialog"
        >
          Синхронизация
        </AppleButton>
        
        <AppleButton
          prepend-icon="mdi-download"
          color="primary"
          size="small"
          @click="syncAllUsers"
          :loading="syncingAll"
        >
          Синхронизировать всех
        </AppleButton>
      </div>
    </div>

    <!-- Статистика по типам пользователей -->
    <div class="stats-section">
      <div class="stats-grid">
        <AppleCard
          v-for="stat in userTypeStats"
          :key="stat.type"
          :title="stat.count.toString()"
          :subtitle="stat.label"
          :icon="stat.icon"
          :icon-color="stat.color"
          variant="outlined"
          class="stat-card"
          @click="filterByType(stat.type)"
          :class="{ 'stat-card--active': selectedType === stat.type }"
        />
      </div>
    </div>

    <!-- Фильтры -->
    <div class="filters-section">
      <div class="filters-row">
        <v-select
          v-model="selectedType"
          :items="typeFilterOptions"
          label="Тип пользователя"
          clearable
          variant="outlined"
          density="comfortable"
          @update:model-value="loadUsers"
        />
        
        <v-select
          v-model="selectedSource"
          :items="sourceFilterOptions"
          label="Источник"
          clearable
          variant="outlined"
          density="comfortable"
          @update:model-value="loadUsers"
        />
        
        <AppleInput
          v-model="searchQuery"
          placeholder="Поиск пользователей (без создателя)..."
          clearable
          @input="debouncedSearch"
        >
          <template #prepend-icon>
            <v-icon icon="mdi-magnify" />
          </template>
        </AppleInput>
      </div>
    </div>

    <!-- Таблица пользователей -->
    <div class="users-table-section">
      <v-data-table
        :headers="headers"
        :items="filteredUsers"
        :loading="loading"
        :no-data-text="noDataText"
        class="users-table"
        item-key="id"
        show-select
        v-model="selectedUsers"
      >
        <!-- Колонка пользователя -->
        <template #item.user="{ item }">
          <div class="user-info">
            <div class="user-avatar">
              <v-avatar :color="getUserTypeColor(item.axenta_user_type)" size="32">
                <v-icon :icon="getUserTypeIcon(item.axenta_user_type)" color="white" />
              </v-avatar>
            </div>
            <div class="user-details">
              <div class="user-name">{{ item.first_name }} {{ item.last_name }}</div>
              <div class="user-email">{{ item.email }}</div>
              <div class="user-username">@{{ item.username }}</div>
            </div>
          </div>
        </template>

        <!-- Колонка типа Axenta -->
        <template #item.axenta_type="{ item }">
          <v-chip
            :color="getAxentaTypeColor(item.axenta_user_type)"
            :text="getAxentaTypeLabel(item.axenta_user_type)"
            size="small"
            variant="flat"
          >
            <template #prepend>
              <v-icon :icon="getAxentaTypeIcon(item.axenta_user_type)" />
            </template>
          </v-chip>
        </template>

        <!-- Колонка роли -->
        <template #item.role="{ item }">
          <v-chip
            v-if="item.role"
            :color="item.role.color || 'primary'"
            :text="item.role.display_name"
            size="small"
            variant="outlined"
          />
          <span v-else class="text-grey">Нет роли</span>
        </template>

        <!-- Колонка статуса -->
        <template #item.status="{ item }">
          <v-chip
            :color="item.is_active ? 'success' : 'error'"
            :text="item.is_active ? 'Активен' : 'Неактивен'"
            size="small"
            variant="flat"
          />
        </template>

        <!-- Колонка действий -->
        <template #item.actions="{ item }">
          <div class="actions-row">
            <v-tooltip text="Просмотр">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-eye"
                  size="small"
                  variant="text"
                  @click="viewUser(item)"
                />
              </template>
            </v-tooltip>
            
            <v-tooltip text="Изменить роль Axenta">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-account-edit"
                  size="small"
                  variant="text"
                  @click="editAxentaRole(item)"
                />
              </template>
            </v-tooltip>
            
            <v-tooltip v-if="item.is_axenta_user" text="Синхронизировать с Axenta">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-sync"
                  size="small"
                  variant="text"
                  @click="syncUser(item)"
                />
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-data-table>
    </div>

    <!-- Диалог создания локального пользователя -->
    <LocalUserDialog
      v-model="showCreateLocalDialog"
      @success="handleCreateSuccess"
      @error="handleError"
    />

    <!-- Диалог редактирования роли Axenta -->
    <AxentaRoleDialog
      v-model="showAxentaRoleDialog"
      :user="selectedUser"
      @success="handleUpdateSuccess"
      @error="handleError"
    />

    <!-- Диалог синхронизации с Axenta -->
    <SyncAxentaDialog
      v-model="showSyncDialog"
      :user="selectedUser"
      @success="handleSyncSuccess"
      @error="handleError"
    />

    <!-- Диалог просмотра пользователя -->
    <UserViewDialog
      v-model="showViewDialog"
      :user="selectedUser"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { debounce } from 'lodash-es';
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import AppleInput from '@/components/Apple/AppleInput.vue';
import UserViewDialog from './UserViewDialog.vue';
import LocalUserDialog from './LocalUserDialog.vue';
import AxentaRoleDialog from './AxentaRoleDialog.vue';
import SyncAxentaDialog from './SyncAxentaDialog.vue';
import axentaUsersService from '@/services/axentaUsersService';
import type { UserWithRelations, AxentaUsersStats } from '@/types/users';

// Reactive data
const loading = ref(false);
const syncingAll = ref(false);
const users = ref<UserWithRelations[]>([]);
const stats = ref<AxentaUsersStats | null>(null);
const selectedType = ref<string>('');
const selectedSource = ref<string>('');
const searchQuery = ref('');
const selectedUsers = ref<UserWithRelations[]>([]);
const selectedUser = ref<UserWithRelations | null>(null);

// Dialog states
const showCreateLocalDialog = ref(false);
const showAxentaRoleDialog = ref(false);
const showSyncDialog = ref(false);
const showViewDialog = ref(false);

// Emits
const emit = defineEmits<{
  success: [message: string];
  error: [message: string];
}>();

// Заголовки таблицы
const headers = [
  { title: 'Пользователь', key: 'user', sortable: false },
  { title: 'Тип Axenta', key: 'axenta_type', sortable: true },
  { title: 'Роль', key: 'role', sortable: false },
  { title: 'Статус', key: 'status', sortable: true },
  { title: 'Последний вход', key: 'last_login', sortable: true },
  { title: 'Действия', key: 'actions', sortable: false, width: '120px' },
];

// Опции фильтров
const typeFilterOptions = [
  { title: 'Все типы', value: '' },
  { title: 'Партнеры', value: 'partner' },
  { title: 'Клиенты', value: 'client' },
  { title: 'Локальные', value: 'local' },
];

const sourceFilterOptions = [
  { title: 'Все источники', value: '' },
  { title: 'Из Axenta', value: 'axenta' },
  { title: 'Локальные', value: 'local' },
];

// Computed properties
const userTypeStats = computed(() => {
  if (!stats.value) return [];
  
  return [
    {
      type: 'partner',
      label: 'Партнеры',
      count: stats.value.partners.count,
      icon: 'mdi-handshake',
      color: '#2196F3',
    },
    {
      type: 'client',
      label: 'Клиенты',
      count: stats.value.clients.count,
      icon: 'mdi-account-group',
      color: '#4CAF50',
    },
    {
      type: 'local',
      label: 'Локальные',
      count: stats.value.local.count,
      icon: 'mdi-account',
      color: '#FF9800',
    },
    {
      type: 'all',
      label: 'Всего',
      count: stats.value.total,
      icon: 'mdi-account-multiple',
      color: '#9C27B0',
    },
  ];
});

const filteredUsers = computed(() => {
  let result = [...users.value];

  // Фильтр по типу
  if (selectedType.value) {
    if (selectedType.value === 'local') {
      result = result.filter(u => !u.is_axenta_user || u.axenta_user_type === 'local');
    } else {
      result = result.filter(u => u.axenta_user_type === selectedType.value);
    }
  }

  // Фильтр по источнику
  if (selectedSource.value) {
    if (selectedSource.value === 'axenta') {
      result = result.filter(u => u.is_axenta_user);
    } else if (selectedSource.value === 'local') {
      result = result.filter(u => !u.is_axenta_user);
    }
  }

  // Поиск
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(u => 
      u.username.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.first_name.toLowerCase().includes(query) ||
      u.last_name.toLowerCase().includes(query)
    );
  }

  return result;
});

const noDataText = computed(() => {
  if (loading.value) return 'Загрузка...';
  if (selectedType.value || selectedSource.value || searchQuery.value) {
    return 'Нет пользователей, соответствующих фильтрам';
  }
  return 'Нет пользователей';
});

// Methods
const loadUsers = async () => {
  loading.value = true;
  try {
    // Загружаем синхронизированных пользователей из локальной базы данных
    const response = await axentaUsersService.getSyncedUsers(1, 100, {
      axenta_type: selectedType.value || undefined,
      is_axenta_user: selectedSource.value === 'axenta' ? true : 
                      selectedSource.value === 'local' ? false : undefined,
      search: searchQuery.value || undefined,
    });
    
    if (response.status === 'success' && response.data) {
      users.value = response.data.items;
    } else {
      emit('error', response.error || 'Ошибка загрузки пользователей');
    }
  } catch (error: any) {
    console.error('Ошибка загрузки пользователей:', error);
    emit('error', 'Ошибка загрузки пользователей');
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    const response = await axentaUsersService.getAxentaUsersStats();
    
    if (response.status === 'success') {
      stats.value = response.data;
    } else {
      console.error('Ошибка загрузки статистики:', response.error);
    }
  } catch (error: any) {
    console.error('Ошибка загрузки статистики:', error);
  }
};

const refreshData = async () => {
  await Promise.all([loadUsers(), loadStats()]);
  emit('success', 'Данные обновлены');
};

const syncAllUsers = async () => {
  syncingAll.value = true;
  try {
    const response = await axentaUsersService.syncAllAxentaUsers();
    
    if (response.status === 'success') {
      emit('success', response.message || 'Все пользователи синхронизированы');
      
      // Показываем детальную информацию о синхронизации
      if (response.data) {
        const { total_users, synced_count, error_count } = response.data;
        console.log(`Синхронизация завершена: ${synced_count}/${total_users} успешно, ${error_count} ошибок`);
        
        if (error_count > 0) {
          console.warn('Ошибки синхронизации:', response.data.errors);
        }
      }
      
      // Обновляем данные после синхронизации
      await refreshData();
    } else {
      emit('error', response.error || 'Ошибка синхронизации пользователей');
    }
  } catch (error: any) {
    console.error('Ошибка синхронизации всех пользователей:', error);
    emit('error', 'Ошибка синхронизации пользователей');
  } finally {
    syncingAll.value = false;
  }
};

const filterByType = (type: string) => {
  selectedType.value = selectedType.value === type ? '' : type;
};

const debouncedSearch = debounce(() => {
  // Поиск выполняется автоматически через computed свойство
}, 300);

// Dialog handlers
const openCreateLocalUserDialog = () => {
  showCreateLocalDialog.value = true;
};

const openSyncDialog = (user?: UserWithRelations) => {
  selectedUser.value = user || null;
  showSyncDialog.value = true;
};

const viewUser = (user: UserWithRelations) => {
  selectedUser.value = user;
  showViewDialog.value = true;
};

const editAxentaRole = (user: UserWithRelations) => {
  selectedUser.value = user;
  showAxentaRoleDialog.value = true;
};

const syncUser = (user: UserWithRelations) => {
  selectedUser.value = user;
  showSyncDialog.value = true;
};

// Success handlers
const handleCreateSuccess = (message: string) => {
  emit('success', message);
  refreshData();
};

const handleUpdateSuccess = (message: string) => {
  emit('success', message);
  refreshData();
};

const handleSyncSuccess = (message: string) => {
  emit('success', message);
  refreshData();
};

const handleError = (message: string) => {
  emit('error', message);
};

// Utility functions
const getUserTypeColor = (type?: string) => {
  switch (type) {
    case 'partner': return '#2196F3';
    case 'client': return '#4CAF50';
    case 'local': return '#FF9800';
    default: return '#9E9E9E';
  }
};

const getUserTypeIcon = (type?: string) => {
  switch (type) {
    case 'partner': return 'mdi-handshake';
    case 'client': return 'mdi-account-group';
    case 'local': return 'mdi-account';
    default: return 'mdi-account-question';
  }
};

const getAxentaTypeColor = (type?: string) => {
  switch (type) {
    case 'partner': return 'primary';
    case 'client': return 'success';
    case 'local': return 'warning';
    default: return 'grey';
  }
};

const getAxentaTypeLabel = (type?: string) => {
  switch (type) {
    case 'partner': return 'Партнер';
    case 'client': return 'Клиент';
    case 'local': return 'Локальный';
    default: return 'Неизвестно';
  }
};

const getAxentaTypeIcon = (type?: string) => {
  switch (type) {
    case 'partner': return 'mdi-handshake';
    case 'client': return 'mdi-account-group';
    case 'local': return 'mdi-account';
    default: return 'mdi-help';
  }
};

// Lifecycle
onMounted(() => {
  refreshData();
});

// Watchers
watch(selectedType, () => {
  loadUsers();
});
</script>

<style scoped>
.axenta-roles-management {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-title h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.section-icon {
  color: var(--primary-color);
}

.section-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.stats-section {
  margin: 16px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card--active {
  border-color: var(--primary-color);
  background-color: rgba(var(--primary-rgb), 0.05);
}

.filters-section {
  background: var(--surface-color);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border-color);
}

.filters-row {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: 16px;
  align-items: end;
}

.users-table-section {
  background: var(--surface-color);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 500;
  font-size: 0.875rem;
}

.user-email {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.user-username {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.actions-row {
  display: flex;
  gap: 4px;
}

/* Responsive */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .section-actions {
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filters-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
