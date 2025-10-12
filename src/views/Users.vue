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
        <AppleButton prepend-icon="mdi-plus" @click="openCreateDialog" data-testid="create-button">
          Создать пользователя
        </AppleButton>
      </div>
    </div>


    <!-- Статистика -->
    <div class="stats-section">
      <div class="stats-grid">
        <AppleCard v-for="stat in stats" :key="stat.key" :title="(stat.value || 0).toString()" :subtitle="stat.label"
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
      <div class="filters-content">
        <div class="filters-row">
          <div class="filter-item filter-search">
            <AppleInput 
              v-model="filters.search" 
              placeholder="Поиск по имени, email, логину..."
              clearable 
              @input="debouncedSearch"
              :color="isMultipleUserSearch ? 'primary' : undefined"
            >
              <template #prepend-icon>
                <v-tooltip :text="userSearchHint" location="bottom">
                  <template #activator="{ props }">
                    <v-icon 
                      v-bind="props" 
                      :icon="isMultipleUserSearch ? 'mdi-account-search' : 'mdi-magnify'" 
                      :color="isMultipleUserSearch ? 'primary' : undefined"
                    />
                  </template>
                </v-tooltip>
              </template>
              
              <template #append-inner v-if="isMultipleUserSearch">
                <v-tooltip text="Активен точный поиск по нескольким пользователям">
                  <template #activator="{ props }">
                    <v-chip v-bind="props" size="x-small" color="primary" variant="flat">
                      {{ userSearchTermsArray.length }}
                    </v-chip>
                  </template>
                </v-tooltip>
              </template>
            </AppleInput>
          </div>

          <div class="filter-item">
            <v-select 
              v-model="filters.role" 
              :items="roleOptions" 
              label="Роль" 
              clearable 
              variant="outlined"
              density="comfortable" 
              :loading="loadingRoles" 
            />
          </div>

          <div class="filter-item">
            <v-select 
              v-model="filters.user_type" 
              :items="userTypeOptions" 
              label="Тип пользователя" 
              clearable
              variant="outlined" 
              density="comfortable" 
            />
          </div>

          <div class="filter-item">
            <v-select 
              v-model="filters.active" 
              :items="[
                { title: 'Активные', value: true },
                { title: 'Неактивные', value: false }
              ]" 
              label="Статус" 
              clearable 
              variant="outlined" 
              density="comfortable" 
            />
          </div>

          <div class="filter-item filter-clear">
            <v-btn
              icon="mdi-filter-remove"
              :variant="hasActiveFilters ? 'flat' : 'outlined'"
              :color="hasActiveFilters ? 'primary' : 'default'"
              size="small"
              @click="clearFilters"
              :title="hasActiveFilters ? 'Сбросить активные фильтры' : 'Сбросить фильтры'"
              :class="{ 'filter-clear-active': hasActiveFilters }"
              data-testid="clear-filters"
            >
              <v-badge
                v-if="hasActiveFilters"
                :content="activeFiltersCount"
                color="white"
                text-color="primary"
                inline
              />
            </v-btn>
          </div>
        </div>

        <!-- Чипы с найденными пользователями -->
        <div v-if="isMultipleUserSearch && userSearchTermsArray.length > 0" class="search-chips mt-2">
          <v-chip
            v-for="(term, index) in userSearchTermsArray"
            :key="index"
            size="small"
            color="primary"
            variant="outlined"
            class="mr-1 mb-1"
            closable
            @click:close="removeUserSearchTerm(index)"
          >
            {{ term }}
          </v-chip>
        </div>
      </div>
    </AppleCard>

    <!-- Список пользователей -->
    <AppleCard class="users-table-card" variant="outlined">
      <!-- Панель групповых действий -->
      <div v-if="selectedUsers.length > 0" class="bulk-actions-panel">
        <div class="bulk-actions-info">
          <v-icon>mdi-checkbox-marked</v-icon>
          Выбрано пользователей: {{ selectedUsers.length }}
        </div>
        <div class="bulk-actions-buttons">
          <AppleButton 
            variant="text" 
            size="small" 
            prepend-icon="mdi-close" 
            @click="clearSelection"
          >
            Снять выделение
          </AppleButton>
          
          <!-- Активация/деактивация -->
          <AppleButton 
            v-if="hasInactiveUsers"
            variant="secondary" 
            size="small" 
            prepend-icon="mdi-check-circle" 
            color="success"
            :loading="bulkActionsLoading"
            @click="bulkActivateUsers"
          >
            Активировать ({{ inactiveUsersCount }})
          </AppleButton>
          
          <AppleButton 
            v-if="hasActiveUsers"
            variant="secondary" 
            size="small" 
            prepend-icon="mdi-pause-circle" 
            color="warning"
            :loading="bulkActionsLoading"
            @click="bulkDeactivateUsers"
          >
            Деактивировать ({{ activeUsersCount }})
          </AppleButton>
          
          <!-- Удаление -->
          <AppleButton 
            variant="secondary" 
            size="small" 
            prepend-icon="mdi-delete" 
            color="error"
            :loading="bulkActionsLoading"
            @click="bulkDeleteUsers"
          >
            Удалить ({{ selectedUsers.length }})
          </AppleButton>
        </div>
      </div>

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
          <!-- Чекбокс выделения -->
          <template #item.select="{ item }">
            <v-checkbox 
              :model-value="isUserSelected(item)" 
              @update:model-value="toggleUserSelection(item)"
              hide-details 
              density="compact" 
            />
          </template>

          <!-- Заголовок чекбокса -->
          <template #header.select>
            <v-checkbox 
              :model-value="selectAll" 
              :indeterminate="selectedUsers.length > 0 && selectedUsers.length < users.length"
              @update:model-value="toggleSelectAll"
              hide-details 
              density="compact"
            />
          </template>

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

              <v-tooltip text="Отправить ссылку для сброса пароля на email">
                <template #activator="{ props }">
                  <v-btn 
                    v-bind="props" 
                    size="small" 
                    variant="text" 
                    color="orange"
                    @click="sendPasswordResetEmailToUser(item)"
                    :loading="item.sendingPasswordReset"
                    style="min-width: 32px;"
                  >
                    <v-icon>mdi-email</v-icon>
                  </v-btn>
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

    <!-- Диалог подтверждения массового удаления -->
    <BulkDeleteConfirmDialog
      v-model="showBulkDeleteDialog"
      :items="selectedUsers"
      item-type="пользователей"
      :loading="bulkActionsLoading"
      @confirm="executeBulkDelete"
      @cancel="showBulkDeleteDialog = false"
    />

    <!-- Snackbar для уведомлений -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="bottom right">
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Красивые уведомления об успехе -->
    <SuccessNotification
      :show="successNotification.show"
      :title="successNotification.title"
      :message="successNotification.message"
      :details="successNotification.details"
      :icon="successNotification.icon"
      @close="successNotification.show = false"
    />
  </div>
</template>

<script setup lang="ts">
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import AppleInput from '@/components/Apple/AppleInput.vue';
import BulkDeleteConfirmDialog from '@/components/Common/BulkDeleteConfirmDialog.vue';
import SuccessNotification from '@/components/Common/SuccessNotification.vue';
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
import { debounce } from 'lodash-es';
import { computed, onMounted, reactive, ref, watch } from 'vue';

// Reactive data
const loading = ref(false);
const saving = ref(false);
const resetting = ref(false);
const exporting = ref(false);
const users = ref<UserWithRelations[]>([]);
const usersData = ref<any>(null);
const showRolesManagement = ref(false);

// Bulk selection
const selectedUsers = ref<UserWithRelations[]>([]);
const selectAll = ref(false);
const bulkActionsLoading = ref(false);

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

// Bulk delete dialog
const showBulkDeleteDialog = ref(false);

// Snackbar
const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000,
});

// Красивые уведомления об успехе
const successNotification = reactive({
  show: false,
  title: '',
  message: '',
  details: '',
  icon: 'mdi-check-circle'
});

// Computed
const hasActiveFilters = computed(() => {
  return Object.values(filters.value).some(value =>
    value !== undefined && value !== null && value !== ''
  );
});

const activeFiltersCount = computed(() => {
  return Object.values(filters.value).filter(value =>
    value !== undefined && value !== null && value !== ''
  ).length;
});

// Computed properties для групповых действий
const activeUsersCount = computed(() => {
  return selectedUsers.value.filter(user => user.is_active).length;
});

const inactiveUsersCount = computed(() => {
  return selectedUsers.value.filter(user => !user.is_active).length;
});

const hasActiveUsers = computed(() => {
  return activeUsersCount.value > 0;
});

const hasInactiveUsers = computed(() => {
  return inactiveUsersCount.value > 0;
});

// Computed properties для множественного поиска пользователей
const isMultipleUserSearch = computed(() => {
  if (!filters.value.search) return false;
  const searchTerms = filters.value.search.split(',').map(term => term.trim()).filter(term => term.length > 0);
  return searchTerms.length > 1;
});

const userSearchTermsArray = computed(() => {
  if (!filters.value.search) return [];
  return filters.value.search.split(',').map(term => term.trim()).filter(term => term.length > 0);
});

const userSearchHint = computed(() => {
  if (!filters.value.search) {
    return 'Введите имя, email или логин. Для поиска нескольких пользователей разделите запятой';
  }
  
  const searchTerms = filters.value.search.split(',').map(term => term.trim()).filter(term => term.length > 0);
  if (searchTerms.length > 1) {
    return `Точный поиск по ${searchTerms.length} пользователям: ${searchTerms.join(', ')}`;
  }
  
  return 'Поиск по частичному совпадению или добавьте запятую для точного поиска';
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
  { title: '', value: 'select', sortable: false, width: 50 },
  { title: 'Активность', value: 'is_active', sortable: false, width: 100 },
  { title: 'ID', value: 'id', sortable: true, width: 80 },
  { title: 'Пользователь', value: 'user', sortable: false, width: 200 },
  { title: 'Email', value: 'email', sortable: true },
  { title: 'Роль', value: 'role', sortable: false },
  { title: 'Тип', value: 'user_type', sortable: true },
  { title: 'Действия', value: 'actions', sortable: false, width: 160 },
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
    console.log('🔄 Loading users...', { page: pagination.value.page, limit: pagination.value.limit, filters: filters.value });

    const response = await usersService.getUsers(
      pagination.value.page,
      pagination.value.limit,
      filters.value
    );

    console.log('📡 Users API response:', response);

    if (response.status === 'success') {
      users.value = response.data.items;
      usersData.value = response.data;
      console.log('✅ Users loaded successfully:', users.value.length, 'users');
    } else {
      console.error('❌ Users API error:', response.error);
      showSnackbar(response.error || 'Ошибка загрузки пользователей', 'error');
    }
  } catch (error: any) {
    console.error('❌ Exception loading users:', error);
    showSnackbar('Ошибка загрузки пользователей', 'error');
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    const statsData = await usersService.getUsersStats();
    if (statsData && typeof statsData === 'object') {
      stats.value[0].value = statsData.total || 0;
      stats.value[1].value = statsData.active_users || statsData.active || 0;
      stats.value[2].value = statsData.inactive_users || statsData.inactive || 0;
      stats.value[3].value = statsData.recent_users || statsData.recent_logins || 0;
    }
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
    // Устанавливаем значения по умолчанию при ошибке
    stats.value.forEach(stat => {
      stat.value = 0;
    });
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
  // Очищаем выделение после изменений
  clearSelection();
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

// Отправка ссылки сброса пароля на email
const sendPasswordResetEmailToUser = async (user: UserWithRelations) => {
  if (!user.email) {
    showSnackbar('У пользователя не указан email адрес', 'error');
    return;
  }

  // Подтверждение действия
  if (!confirm(`Отправить ссылку для сброса пароля на email ${user.email}?`)) {
    return;
  }

  try {
    // Устанавливаем состояние загрузки для конкретного пользователя
    const userIndex = users.value.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users.value[userIndex].sendingPasswordReset = true;
    }

    const response = await usersService.sendPasswordResetEmail(user.email, user.username);
    
    if (response.status === 'success') {
      showSuccessNotification(
        'Ссылка отправлена',
        `Ссылка для сброса пароля отправлена на ${user.email}`,
        response.message || 'Пользователь получит email с инструкциями по сбросу пароля',
        'mdi-email-check'
      );
    } else {
      showSnackbar(response.error || 'Ошибка отправки ссылки сброса пароля', 'error');
    }
  } catch (error: any) {
    console.error('Ошибка отправки ссылки сброса пароля:', error);
    showSnackbar('Ошибка отправки ссылки сброса пароля', 'error');
  } finally {
    // Убираем состояние загрузки
    const userIndex = users.value.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users.value[userIndex].sendingPasswordReset = false;
    }
  }
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

const showSuccessNotification = (title: string, message: string, details?: string, icon?: string) => {
  successNotification.title = title;
  successNotification.message = message;
  successNotification.details = details || '';
  successNotification.icon = icon || 'mdi-check-circle';
  successNotification.show = true;
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

// Функции для работы с выделением
const isUserSelected = (user: UserWithRelations): boolean => {
  return selectedUsers.value.some(u => u.id === user.id);
};

const toggleUserSelection = (user: UserWithRelations) => {
  const index = selectedUsers.value.findIndex(u => u.id === user.id);
  if (index > -1) {
    selectedUsers.value.splice(index, 1);
  } else {
    selectedUsers.value.push(user);
  }
  updateSelectAllState();
};

const updateSelectAllState = () => {
  if (selectedUsers.value.length === 0) {
    selectAll.value = false;
  } else if (selectedUsers.value.length === users.value.length) {
    selectAll.value = true;
  } else {
    selectAll.value = false;
  }
};

const toggleSelectAll = () => {
  if (selectAll.value || selectedUsers.value.length === users.value.length) {
    // Снимаем выделение со всех
    selectedUsers.value = [];
    selectAll.value = false;
  } else {
    // Выделяем всех видимых пользователей
    selectedUsers.value = [...users.value];
    selectAll.value = true;
  }
};

const clearSelection = () => {
  selectedUsers.value = [];
  selectAll.value = false;
};

// Удаление отдельного поискового термина для пользователей
const removeUserSearchTerm = (index: number) => {
  const searchTerms = filters.value.search.split(',').map(term => term.trim()).filter(term => term.length > 0);
  searchTerms.splice(index, 1);
  filters.value.search = searchTerms.join(', ');
  debouncedSearch();
};

// Групповые действия
const bulkDeleteUsers = () => {
  if (selectedUsers.value.length === 0) {
    showSnackbar('Выберите пользователей для удаления', 'warning');
    return;
  }

  // Проверяем, есть ли администраторы среди выбранных пользователей
  const adminUsers = selectedUsers.value.filter(user => 
    user.role && (user.role.name === 'admin' || user.role.name === 'administrator')
  );

  if (adminUsers.length > 0) {
    const adminUsernames = adminUsers.map(u => u.username).join(', ');
    showSnackbar(
      `Нельзя удалить администраторов: ${adminUsernames}. Сначала смените им роль.`,
      'error'
    );
    return;
  }

  // Проверяем, есть ли активные пользователи с недавней активностью
  const recentlyActiveUsers = selectedUsers.value.filter(user => {
    if (!user.last_login) return false;
    const lastLogin = new Date(user.last_login);
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    return lastLogin > dayAgo;
  });

  if (recentlyActiveUsers.length > 0) {
    const activeUsernames = recentlyActiveUsers.map(u => u.username).join(', ');
    if (!confirm(`Внимание! Среди выбранных пользователей есть те, кто заходил в систему за последние 24 часа: ${activeUsernames}.\n\nВы действительно хотите продолжить?`)) {
      return;
    }
  }

  showBulkDeleteDialog.value = true;
};

const executeBulkDelete = async () => {
  try {
    bulkActionsLoading.value = true;
    const userIds = selectedUsers.value.map(u => u.id);
    
    const response = await usersService.deleteUsers(userIds);
    
    if (response.status === 'success') {
      const deletedCount = selectedUsers.value.length;
      showBulkDeleteDialog.value = false;
      clearSelection();
      await loadUsers();
      await loadStats();
      showSuccessNotification(
        'Пользователи удалены',
        'Выбранные пользователи были успешно удалены из системы',
        `Удалено пользователей: ${response.deleted}`,
        'mdi-account-remove'
      );
    } else {
      showSnackbar(response.error || 'Ошибка группового удаления пользователей', 'error');
    }
  } catch (error: any) {
    console.error('Ошибка группового удаления пользователей:', error);
    showSnackbar('Ошибка группового удаления пользователей', 'error');
  } finally {
    bulkActionsLoading.value = false;
  }
};

// Массовая активация пользователей
const bulkActivateUsers = async () => {
  if (inactiveUsersCount.value === 0) {
    showSnackbar('Нет неактивных пользователей для активации', 'warning');
    return;
  }

  const inactiveUsers = selectedUsers.value.filter(user => !user.is_active);
  const usernames = inactiveUsers.map(u => u.username).join(', ');
  
  if (!confirm(`Вы уверены, что хотите активировать ${inactiveUsers.length} пользователей?\n\n${usernames}`)) {
    return;
  }

  try {
    bulkActionsLoading.value = true;
    const userIds = inactiveUsers.map(u => u.id);
    
    // В реальном API здесь будет вызов usersService.activateUsers(userIds)
    // Для демо имитируем успешный ответ
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Обновляем статус в локальных данных (для демо)
    inactiveUsers.forEach(user => {
      user.is_active = true;
    });
    
    clearSelection();
    await loadUsers();
    await loadStats();
    showSuccessNotification(
      'Пользователи активированы',
      'Выбранные пользователи были успешно активированы',
      `Активировано пользователей: ${inactiveUsers.length}`,
      'mdi-account-check'
    );
  } catch (error: any) {
    console.error('Ошибка массовой активации пользователей:', error);
    showSnackbar('Ошибка массовой активации пользователей', 'error');
  } finally {
    bulkActionsLoading.value = false;
  }
};

// Массовая деактивация пользователей  
const bulkDeactivateUsers = async () => {
  if (activeUsersCount.value === 0) {
    showSnackbar('Нет активных пользователей для деактивации', 'warning');
    return;
  }

  const activeUsers = selectedUsers.value.filter(user => user.is_active);
  
  // Проверяем, есть ли администраторы
  const adminUsers = activeUsers.filter(user => 
    user.role && (user.role.name === 'admin' || user.role.name === 'administrator')
  );

  if (adminUsers.length > 0) {
    const adminUsernames = adminUsers.map(u => u.username).join(', ');
    showSnackbar(
      `Нельзя деактивировать администраторов: ${adminUsernames}. Сначала смените им роль.`,
      'error'
    );
    return;
  }

  const usernames = activeUsers.map(u => u.username).join(', ');
  if (!confirm(`Вы уверены, что хотите деактивировать ${activeUsers.length} пользователей?\n\n${usernames}`)) {
    return;
  }

  try {
    bulkActionsLoading.value = true;
    const userIds = activeUsers.map(u => u.id);
    
    // В реальном API здесь будет вызов usersService.deactivateUsers(userIds)
    // Для демо имитируем успешный ответ
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Обновляем статус в локальных данных (для демо)
    activeUsers.forEach(user => {
      user.is_active = false;
    });
    
    clearSelection();
    await loadUsers();
    await loadStats();
    showSuccessNotification(
      'Пользователи деактивированы',
      'Выбранные пользователи были успешно деактивированы',
      `Деактивировано пользователей: ${activeUsers.length}`,
      'mdi-account-cancel'
    );
  } catch (error: any) {
    console.error('Ошибка массовой деактивации пользователей:', error);
    showSnackbar('Ошибка массовой деактивации пользователей', 'error');
  } finally {
    bulkActionsLoading.value = false;
  }
};

// Watchers
watch([filters], () => {
  pagination.value.page = 1;
  clearSelection(); // Очищаем выделение при изменении фильтров
  loadUsers();
}, { deep: true });

// Очищаем выделение при изменении пользователей
watch(users, () => {
  // Удаляем из выделения пользователей, которых больше нет в списке
  selectedUsers.value = selectedUsers.value.filter(selectedUser =>
    users.value.some(user => user.id === selectedUser.id)
  );
  updateSelectAllState();
}, { deep: true });

// Lifecycle
onMounted(async () => {
  console.log('🔧 Users component mounted - loading data...');
  
  // Проверяем авторизацию
  const token = localStorage.getItem('axenta_token');
  const user = localStorage.getItem('axenta_user');
  const company = localStorage.getItem('axenta_company');
  
  console.log('🔐 Auth check:', {
    token: token ? `EXISTS (${token.length} chars)` : 'MISSING',
    user: user ? 'EXISTS' : 'MISSING',
    company: company ? 'EXISTS' : 'MISSING'
  });
  
  if (!token) {
    console.error('❌ No auth token found! Users will not load.');
    showSnackbar('Не найден токен авторизации. Пожалуйста, авторизуйтесь.', 'error');
    return;
  }
  
  try {
    await Promise.all([
      loadUsers(),
      loadStats(),
      loadRoles(),
      loadTemplates(),
    ]);
    console.log('✅ Users data loaded, users count:', users.value.length);
    console.log('📊 Users data:', users.value);
    console.log('📈 Stats data:', usersData.value);
  } catch (error) {
    console.error('❌ Error loading users data:', error);
    showSnackbar('Ошибка загрузки данных пользователей', 'error');
  }
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

.filters-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-item {
  flex: 1;
  min-width: 0;
}

.filter-search {
  flex: 2;
  min-width: 250px;
}

.filter-clear {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-start;
  padding-top: 8px;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .filter-item,
  .filter-search {
    flex: none;
    width: 100%;
    min-width: auto;
  }
  
  .filter-clear {
    align-self: flex-end;
    padding-top: 0;
  }
}

/* Стили для активной кнопки очистки фильтров */
.filter-clear-active {
  position: relative;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3) !important;
  animation: pulse-filter 2s infinite;
}

@keyframes pulse-filter {
  0% {
    box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
  }
  50% {
    box-shadow: 0 4px 12px rgba(25, 118, 210, 0.5);
  }
  100% {
    box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
  }
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
  gap: 16px;
}

.table-title-section {
  display: flex;
  align-items: center;
  flex: 1;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.bulk-actions-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-primary), 0.04);
}

.bulk-actions-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: rgb(var(--v-theme-primary));
}

.bulk-actions-buttons {
  display: flex;
  gap: 8px;
}

.search-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
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
  align-items: center;
}

.actions-cell .v-btn {
  transition: all 0.2s ease;
}

.actions-cell .v-btn:hover {
  transform: scale(1.1);
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

  .bulk-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .bulk-actions-panel {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .bulk-actions-buttons {
    justify-content: flex-end;
    flex-wrap: wrap;
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
