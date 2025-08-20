<template>
  <div class="users-page">
    <!-- Заголовок страницы -->
    <div class="page-header">
      <div class="page-title-section">
        <v-icon icon="mdi-account-group" size="32" class="page-icon" />
        <div>
          <h1 class="page-title">Управление пользователями</h1>
          <p class="page-subtitle">Пользователи, роли и права доступа</p>
        </div>
      </div>

      <div class="page-actions">
        <AppleButton v-if="!usersService.isMockDataEnabled()" variant="secondary" prepend-icon="mdi-play-circle"
          @click="enableDemoMode" color="success">
          Демо режим
        </AppleButton>
        <AppleButton v-else variant="secondary" prepend-icon="mdi-stop-circle" @click="disableDemoMode" color="warning">
          Выйти из демо
        </AppleButton>
        <AppleButton variant="secondary" prepend-icon="mdi-shield-account"
          @click="showRolesManagement = !showRolesManagement">
          {{ showRolesManagement ? 'Скрыть роли' : 'Управление ролями' }}
        </AppleButton>
        <AppleButton variant="secondary" prepend-icon="mdi-account-clock" @click="openInactiveUsersDialog">
          Деактивация
        </AppleButton>
        <AppleButton variant="secondary" prepend-icon="mdi-export" @click="exportUsers" :loading="exporting"
          data-testid="export-button">
          Экспорт
        </AppleButton>
        <AppleButton prepend-icon="mdi-plus" @click="openCreateDialog" data-testid="create-button">
          Создать пользователя
        </AppleButton>
      </div>
    </div>

    <!-- Уведомление о демо режиме -->
    <v-alert v-if="usersService.isMockDataEnabled()" type="info" variant="tonal" prominent border="start"
      class="demo-alert">
      <template #prepend>
        <v-icon icon="mdi-play-circle" size="24" />
      </template>
      <div class="alert-content">
        <div class="alert-title">Демонстрационный режим</div>
        <div class="alert-text">
          Отображаются демо данные. Это позволяет увидеть, как будет выглядеть интерфейс управления пользователями.
          Все изменения в демо режиме не сохраняются.
        </div>
      </div>
    </v-alert>

    <!-- Статистика -->
    <div class="stats-section">
      <div class="stats-grid">
        <AppleCard v-for="stat in stats" :key="stat.key" :title="stat.value.toString()" :subtitle="stat.label"
          :icon="stat.icon" :icon-color="stat.color" variant="outlined" class="stat-card" />
      </div>
    </div>

    <!-- Управление ролями -->
    <div v-if="showRolesManagement" class="roles-section">
      <AppleCard variant="outlined">
        <RolesManagement @success="showSnackbar($event, 'success')" @error="showSnackbar($event, 'error')" />
      </AppleCard>
    </div>

    <!-- Фильтры -->
    <AppleCard class="filters-card" variant="outlined">
      <template #header>
        <div class="filters-header">
          <v-icon icon="mdi-filter" class="mr-2" />
          Фильтры
          <v-spacer />
          <AppleButton variant="text" size="small" @click="clearFilters" :disabled="!hasActiveFilters"
            data-testid="clear-filters">
            Очистить
          </AppleButton>
        </div>
      </template>

      <div class="filters-content">
        <v-row>
          <v-col cols="12" md="4">
            <AppleInput v-model="filters.search" placeholder="Поиск по имени, email, логину..."
              prepend-icon="mdi-magnify" clearable @input="debouncedSearch" />
          </v-col>

          <v-col cols="12" md="3">
            <v-select v-model="filters.role" :items="roleOptions" label="Роль" clearable variant="outlined"
              density="comfortable" :loading="loadingRoles" />
          </v-col>

          <v-col cols="12" md="3">
            <v-select v-model="filters.user_type" :items="userTypeOptions" label="Тип пользователя" clearable
              variant="outlined" density="comfortable" />
          </v-col>

          <v-col cols="12" md="2">
            <v-select v-model="filters.active" :items="[
              { title: 'Активные', value: true },
              { title: 'Неактивные', value: false }
            ]" label="Статус" clearable variant="outlined" density="comfortable" />
          </v-col>
        </v-row>
      </div>
    </AppleCard>

    <!-- Список пользователей -->
    <AppleCard class="users-table-card" variant="outlined">
      <template #header>
        <div class="table-header">
          <div class="table-title-section">
            <v-icon icon="mdi-format-list-bulleted" class="mr-2" />
            Список пользователей
            <v-chip v-if="usersData" :text="usersData.total.toString()" size="small" class="ml-2" />
          </div>
        </div>
      </template>

      <!-- Таблица пользователей -->
      <div class="table-container">
        <v-data-table :headers="tableHeaders" :items="users" :loading="loading" :items-per-page="pagination.limit"
          :page="pagination.page" :server-items-length="usersData?.total || 0" :items-per-page-options="perPageOptions"
          @update:page="handlePageChange" @update:items-per-page="handlePerPageChange"
          @update:sort-by="handleSortChange" item-value="id" class="users-table" no-data-text="Пользователи не найдены"
          loading-text="Загрузка пользователей...">
          <!-- Активность -->
          <template #item.is_active="{ item }">
            <v-checkbox :model-value="item.is_active" @update:model-value="toggleUserActivity(item, $event)"
              hide-details density="compact" />
          </template>

          <!-- ID -->
          <template #item.id="{ item }">
            <span class="font-mono">{{ item.id }}</span>
          </template>

          <!-- Пользователь -->
          <template #item.user="{ item }">
            <div class="user-cell">
              <div class="user-avatar">
                <v-avatar size="32" color="primary">
                  <span class="text-white">{{ getUserInitials(item) }}</span>
                </v-avatar>
              </div>
              <div class="user-info">
                <div class="user-name">{{ getUserFullName(item) }}</div>
                <div class="user-username">@{{ item.username }}</div>
              </div>
            </div>
          </template>

          <!-- Email -->
          <template #item.email="{ item }">
            <a :href="`mailto:${item.email}`" class="email-link">{{ item.email }}</a>
          </template>

          <!-- Роль -->
          <template #item.role="{ item }">
            <v-chip v-if="item.role" :text="item.role.display_name" :color="item.role.color || 'primary'" size="small"
              variant="tonal" />
            <span v-else class="text-medium-emphasis">Не назначена</span>
          </template>

          <!-- Тип пользователя -->
          <template #item.user_type="{ item }">
            <div class="d-flex align-center">
              <v-icon :icon="getUserTypeIcon(item.user_type)" size="20" class="mr-2" />
              {{ getUserTypeText(item.user_type) }}
            </div>
          </template>

          <!-- Действия -->
          <template #item.actions="{ item }">
            <div class="actions-cell">
              <v-tooltip text="Просмотр">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon="mdi-eye" size="small" variant="text" @click="viewUser(item)" />
                </template>
              </v-tooltip>

              <v-tooltip text="Редактировать">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon="mdi-pencil" size="small" variant="text" @click="editUser(item)" />
                </template>
              </v-tooltip>

              <v-menu>
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon="mdi-dots-vertical" size="small" variant="text" />
                </template>

                <v-list density="compact">
                  <v-list-item prepend-icon="mdi-key" title="Сбросить пароль" @click="resetUserPassword(item)" />
                  <v-list-item v-if="item.is_active" prepend-icon="mdi-pause-circle" title="Деактивировать"
                    @click="toggleUserActivity(item, false)" />
                  <v-list-item v-else prepend-icon="mdi-check-circle" title="Активировать"
                    @click="toggleUserActivity(item, true)" />
                  <v-divider />
                  <v-list-item prepend-icon="mdi-delete" title="Удалить" class="text-error" @click="deleteUser(item)" />
                </v-list>
              </v-menu>
            </div>
          </template>
        </v-data-table>
      </div>
    </AppleCard>

    <!-- Диалоги -->
    <UserDialog v-model="userDialog.show" :user="userDialog.user" :role-options="roleOptionsForForm"
      :template-options="templateOptions" :loading-roles="loadingRoles" :loading-templates="loadingTemplates"
      @saved="onUserSaved" @error="showSnackbar($event, 'error')" />

    <UserViewDialog v-model="viewDialog.show" :user="viewDialog.user" @edit="editUser" @delete="deleteUser" />

    <PasswordResetDialog v-model="passwordDialog.show" :user="passwordDialog.user"
      @success="showSnackbar($event, 'success')" @error="showSnackbar($event, 'error')" />

    <InactiveUsersDialog v-model="inactiveUsersDialog.show" @success="onInactiveUsersSuccess"
      @error="showSnackbar($event, 'error')" />

    <!-- Snackbar для уведомлений -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="bottom right">
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
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import AppleInput from '@/components/Apple/AppleInput.vue';
import InactiveUsersDialog from '@/components/Users/InactiveUsersDialog.vue';
import PasswordResetDialog from '@/components/Users/PasswordResetDialog.vue';
import RolesManagement from '@/components/Users/RolesManagement.vue';
import UserDialog from '@/components/Users/UserDialog.vue';
import UserViewDialog from '@/components/Users/UserViewDialog.vue';
import usersService from '@/services/usersService';
import type {
  UserFilters,
  UserForm,
  UserWithRelations
} from '@/types/users';
import { disableDemoMode as disableDemo, enableDemoMode as enableDemo } from '@/utils/demoMode';
import { debounce } from 'lodash-es';
import { computed, onMounted, ref, watch } from 'vue';

// Reactive data
const loading = ref(false);
const saving = ref(false);
const resetting = ref(false);
const exporting = ref(false);
const users = ref<UserWithRelations[]>([]);
const usersData = ref<any>(null);
const showRolesManagement = ref(false);

// Pagination
const pagination = ref({
  page: 1,
  limit: 20,
});

// Filters
const filters = ref<UserFilters>({
  search: '',
  role: undefined,
  user_type: undefined,
  active: undefined,
});

// Options for selects
const roleOptions = ref<Array<{ title: string; value: string }>>([]);
const roleOptionsForForm = ref<Array<{ title: string; value: number }>>([]);
const templateOptions = ref<Array<{ title: string; value: number }>>([]);
const loadingRoles = ref(false);
const loadingTemplates = ref(false);

// Statistics
const stats = ref([
  { key: 'total', label: 'Всего пользователей', value: 0, icon: 'mdi-account-group', color: 'primary' },
  { key: 'active', label: 'Активные', value: 0, icon: 'mdi-check-circle', color: 'success' },
  { key: 'inactive', label: 'Неактивные', value: 0, icon: 'mdi-pause-circle', color: 'warning' },
  { key: 'recent', label: 'Недавние входы', value: 0, icon: 'mdi-login', color: 'info' },
]);

// User dialog
const userDialog = ref({
  show: false,
  isEdit: false,
  user: null as UserWithRelations | null,
});

const userForm = ref<UserForm>({
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  name: '',
  phone: '',
  telegram_id: '',
  is_active: true,
  user_type: 'user',
  role_id: 0,
  template_id: undefined,
});

const formErrors = ref<Record<string, string>>({});
const userFormRef = ref();

// Password reset dialog
const passwordDialog = ref({
  show: false,
  user: null as UserWithRelations | null,
});

const passwordForm = ref({
  password: '',
});

const passwordErrors = ref<Record<string, string>>({});

// View dialog
const viewDialog = ref({
  show: false,
  user: null as UserWithRelations | null,
});

// Inactive users dialog
const inactiveUsersDialog = ref({
  show: false,
});

// Snackbar
const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000,
});

// Computed
const hasActiveFilters = computed(() => {
  return Object.values(filters.value).some(value =>
    value !== undefined && value !== null && value !== ''
  );
});

// Options
const userTypeOptions = [
  { title: 'Пользователь', value: 'user' },
  { title: 'Клиент', value: 'client' },
  { title: 'Монтажник', value: 'installer' },
  { title: 'Менеджер', value: 'manager' },
  { title: 'Администратор', value: 'admin' },
];

// Table headers
const tableHeaders = computed(() => [
  { title: 'Активность', value: 'is_active', sortable: false, width: 100 },
  { title: 'ID', value: 'id', sortable: true, width: 80 },
  { title: 'Пользователь', value: 'user', sortable: false, width: 200 },
  { title: 'Email', value: 'email', sortable: true },
  { title: 'Роль', value: 'role', sortable: false },
  { title: 'Тип', value: 'user_type', sortable: true },
  { title: 'Действия', value: 'actions', sortable: false, width: 120 },
]);

// Доступные значения для количества элементов на странице
const perPageOptions = [
  { title: '10 на странице', value: 10 },
  { title: '20 на странице', value: 20 },
  { title: '50 на странице', value: 50 },
  { title: '100 на странице', value: 100 },
];

// Methods
const loadUsers = async () => {
  try {
    loading.value = true;

    const response = await usersService.getUsers(
      pagination.value.page,
      pagination.value.limit,
      filters.value
    );

    if (response.status === 'success') {
      users.value = response.data.items;
      usersData.value = response.data;
    } else {
      showSnackbar(response.error || 'Ошибка загрузки пользователей', 'error');
    }
  } catch (error: any) {
    console.error('Ошибка загрузки пользователей:', error);
    showSnackbar('Ошибка загрузки пользователей', 'error');
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    const statsData = await usersService.getUsersStats();
    stats.value[0].value = statsData.total;
    stats.value[1].value = statsData.active;
    stats.value[2].value = statsData.inactive;
    stats.value[3].value = statsData.recent_logins;
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
  }
};

const loadRoles = async () => {
  try {
    loadingRoles.value = true;
    const response = await usersService.getRoles(1, 100, { active_only: true });
    if (response.status === 'success') {
      roleOptions.value = response.data.items.map(role => ({
        title: role.display_name,
        value: role.name,
      }));
      roleOptionsForForm.value = response.data.items.map(role => ({
        title: role.display_name,
        value: role.id,
      }));
    }
  } catch (error) {
    console.error('Ошибка загрузки ролей:', error);
  } finally {
    loadingRoles.value = false;
  }
};

const loadTemplates = async () => {
  try {
    loadingTemplates.value = true;
    const response = await usersService.getUserTemplates(1, 100, { active_only: true });
    if (response.status === 'success') {
      templateOptions.value = response.data.items.map(template => ({
        title: template.name,
        value: template.id,
      }));
    }
  } catch (error) {
    console.error('Ошибка загрузки шаблонов:', error);
  } finally {
    loadingTemplates.value = false;
  }
};

// Debounced search
const debouncedSearch = debounce(() => {
  pagination.value.page = 1;
  loadUsers();
}, 500);

const clearFilters = () => {
  filters.value = {
    search: '',
    role: undefined,
    user_type: undefined,
    active: undefined,
  };
  pagination.value.page = 1;
  loadUsers();
};

// Dialog methods
const openCreateDialog = () => {
  userDialog.value = {
    show: true,
    isEdit: false,
    user: null,
  };
};

const editUser = (user: UserWithRelations) => {
  userDialog.value = {
    show: true,
    isEdit: true,
    user,
  };
};

const viewUser = (user: UserWithRelations) => {
  viewDialog.value = {
    show: true,
    user,
  };
};

const onUserSaved = async (user: UserWithRelations) => {
  showSnackbar(
    userDialog.value.isEdit ? 'Пользователь успешно обновлен' : 'Пользователь успешно создан',
    'success'
  );
  await loadUsers();
  await loadStats();
};

const deleteUser = async (user: UserWithRelations) => {
  if (!confirm(`Вы уверены, что хотите удалить пользователя "${user.username}"?`)) {
    return;
  }

  try {
    const response = await usersService.deleteUser(user.id);
    if (response.status === 'success') {
      showSnackbar('Пользователь успешно удален', 'success');
      await loadUsers();
      await loadStats();
    } else {
      showSnackbar(response.error || 'Ошибка удаления пользователя', 'error');
    }
  } catch (error: any) {
    console.error('Ошибка удаления пользователя:', error);
    showSnackbar('Ошибка удаления пользователя', 'error');
  }
};

// Password reset methods
const resetUserPassword = (user: UserWithRelations) => {
  passwordDialog.value = {
    show: true,
    user,
  };
};

const openInactiveUsersDialog = () => {
  inactiveUsersDialog.value.show = true;
};

const onInactiveUsersSuccess = async (message: string) => {
  showSnackbar(message, 'success');
  await loadUsers();
  await loadStats();
};

const exportUsers = async () => {
  try {
    exporting.value = true;
    const blob = await usersService.exportUsers('excel', filters.value);

    // Создаем ссылку для скачивания
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    showSnackbar('Экспорт завершен', 'success');
  } catch (error: any) {
    console.error('Ошибка экспорта:', error);
    showSnackbar('Ошибка экспорта пользователей', 'error');
  } finally {
    exporting.value = false;
  }
};

// Pagination handlers
const handlePageChange = (page: number) => {
  pagination.value.page = page;
  loadUsers();
};

const handlePerPageChange = (limit: number) => {
  pagination.value.limit = limit;
  pagination.value.page = 1;
  loadUsers();
};

const handleSortChange = (sortBy: any[]) => {
  if (sortBy.length > 0) {
    const sort = sortBy[0];
    const field = sort.key;
    const order = sort.order === 'desc' ? '-' : '';
    filters.value.ordering = `${order}${field}`;
  } else {
    filters.value.ordering = 'username';
  }
  pagination.value.page = 1;
  loadUsers();
};

// Utility methods
const getUserFullName = (user: UserWithRelations): string => {
  return `${user.first_name} ${user.last_name}`.trim() || user.username;
};

const getUserInitials = (user: UserWithRelations): string => {
  const firstName = user.first_name?.charAt(0) || '';
  const lastName = user.last_name?.charAt(0) || '';
  return (firstName + lastName).toUpperCase() || user.username.charAt(0).toUpperCase();
};

const getUserTypeText = (type: string): string => {
  const typeMap = {
    user: 'Пользователь',
    client: 'Клиент',
    installer: 'Монтажник',
    manager: 'Менеджер',
    admin: 'Администратор',
  };
  return typeMap[type as keyof typeof typeMap] || type;
};

const getUserTypeIcon = (type: string): string => {
  const iconMap = {
    user: 'mdi-account',
    client: 'mdi-account-tie',
    installer: 'mdi-account-hard-hat',
    manager: 'mdi-account-supervisor',
    admin: 'mdi-shield-account',
  };
  return iconMap[type as keyof typeof iconMap] || 'mdi-account';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const showSnackbar = (text: string, color = 'info', timeout = 5000) => {
  snackbar.value = { show: true, text, color, timeout };
};

// Методы для управления демо режимом
const enableDemoMode = async () => {
  enableDemo();
  showSnackbar('Демо режим включен. Теперь отображаются демо данные.', 'success');
  // Перезагружаем данные
  await Promise.all([
    loadUsers(),
    loadStats(),
    loadRoles(),
    loadTemplates(),
  ]);
};

const disableDemoMode = async () => {
  disableDemo();
  showSnackbar('Демо режим отключен. Попытка загрузки реальных данных с сервера.', 'info');
  // Перезагружаем данные
  await Promise.all([
    loadUsers(),
    loadStats(),
    loadRoles(),
    loadTemplates(),
  ]);
};

// Функции для работы с активностью пользователей
const toggleUserActivity = async (user: UserWithRelations, isActive: boolean) => {
  try {
    const response = await usersService.updateUser(user.id, { is_active: isActive });
    if (response.status === 'success') {
      // Обновляем пользователя в локальном состоянии
      const index = users.value.findIndex(u => u.id === user.id);
      if (index !== -1) {
        users.value[index].is_active = isActive;
      }
      showSnackbar(
        `Пользователь "${user.username}" ${isActive ? 'активирован' : 'деактивирован'}`,
        'success'
      );
    } else {
      showSnackbar(response.error || 'Ошибка изменения активности пользователя', 'error');
    }
  } catch (error: any) {
    console.error('Ошибка изменения активности пользователя:', error);
    showSnackbar('Ошибка изменения активности пользователя', 'error');
  }
};

// Watchers
watch([filters], () => {
  pagination.value.page = 1;
  loadUsers();
}, { deep: true });

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadUsers(),
    loadStats(),
    loadRoles(),
    loadTemplates(),
  ]);
});
</script>

<style scoped>
.users-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0;
}

/* Заголовок страницы */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0;
}

.page-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-icon {
  color: var(--apple-blue);
}

.page-title {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 4px 0 0 0;
  line-height: 1.4;
}

.page-actions {
  display: flex;
  gap: 12px;
}

/* Демо режим */
.demo-alert {
  margin: 0 0 20px 0;
}

.alert-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert-title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-primary);
}

.alert-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

[data-theme="dark"] .alert-title {
  color: var(--apple-text-primary-dark);
}

[data-theme="dark"] .alert-text {
  color: var(--apple-text-secondary-dark);
}

/* Статистика */
.stats-section {
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  text-align: center;
}

/* Управление ролями */
.roles-section {
  margin: 0;
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
.users-table-card {
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

.users-table {
  background: transparent;
}

.actions-cell {
  display: flex;
  gap: 4px;
}

/* Пользовательская ячейка */
.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  flex-shrink: 0;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 500;
  color: var(--text-primary);
}

.user-username {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.email-link {
  color: var(--apple-blue);
  text-decoration: none;
}

.email-link:hover {
  text-decoration: underline;
}

.font-mono {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.875rem;
}

/* Темная тема */
[data-theme="dark"] .page-icon {
  color: var(--apple-blue-light);
}

[data-theme="dark"] .page-title {
  color: var(--apple-text-primary-dark);
}

[data-theme="dark"] .page-subtitle {
  color: var(--apple-text-secondary-dark);
}

[data-theme="dark"] .user-name {
  color: var(--apple-text-primary-dark);
}

[data-theme="dark"] .user-username {
  color: var(--apple-text-secondary-dark);
}

[data-theme="dark"] .email-link {
  color: var(--apple-blue-light);
}

/* Адаптивность */
@media (max-width: 960px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .page-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 600px) {
  .page-title {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
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

/* Улучшения для таблицы */
.users-table :deep(.v-data-table__wrapper) {
  border-radius: 12px;
  overflow: hidden;
}

.users-table :deep(.v-data-table-header__content) {
  font-weight: 600;
  color: var(--text-primary);
}

.users-table :deep(.v-data-table__td) {
  border-bottom: 1px solid rgba(60, 60, 67, 0.08);
}

[data-theme="dark"] .users-table :deep(.v-data-table__td) {
  border-bottom-color: rgba(84, 84, 136, 0.16);
}
</style>
