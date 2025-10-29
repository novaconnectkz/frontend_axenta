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
    </div>


    <!-- Статистика -->
    <div class="stats-section">
      <div class="stats-grid">
        <AppleCard v-for="stat in stats" :key="stat.key" :title="(stat.value || 0).toString()" :subtitle="stat.label"
          :icon="stat.icon" :icon-color="stat.color" variant="outlined" class="stat-card" />
      </div>
    </div>


    <!-- Фильтры -->
    <AppleCard class="filters-card" variant="outlined">
      <div class="filters-content">
        <div class="filters-row">
          <div class="filter-item filter-search">
            <AppleInput 
              v-model="filters.search" 
              placeholder="Поиск по имени, email, логину (без создателя)..."
              clearable 
              @input="debouncedSearch"
              :color="isMultipleUserSearch ? 'primary' : undefined"
            >
              <template #prepend-icon>
                <v-icon 
                  :icon="isMultipleUserSearch ? 'mdi-account-search' : 'mdi-magnify'" 
                  :color="isMultipleUserSearch ? 'primary' : undefined"
                />
              </template>
              
              <template #append-inner v-if="isMultipleUserSearch">
                <v-chip size="x-small" color="primary" variant="flat">
                  {{ userSearchTermsArray.length }}
                </v-chip>
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

          <!-- Отключено, но функционал сохранен -->
          <!-- <div class="filter-item">
            <v-select 
              v-model="filters.user_type" 
              :items="userTypeOptions" 
              label="Тип пользователя" 
              clearable
              variant="outlined" 
              density="comfortable" 
            />
          </div> -->

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

          <div class="filter-item filter-create">
            <v-btn
              icon="mdi-plus"
              variant="flat"
              color="primary"
              size="small"
              @click="openCreateDialog"
              title="Создать пользователя"
              data-testid="create-button"
            />
          </div>

          <div class="filter-item filter-clear">
            <v-btn
              v-show="hasActiveFilters"
              icon="mdi-filter-remove"
              variant="flat"
              color="warning"
              size="small"
              @click="clearFilters"
              title="Сбросить активные фильтры"
              :class="{ 'filter-clear-active': hasActiveFilters }"
              data-testid="clear-filters"
            >
              <v-badge
                :content="activeFiltersCount"
                color="white"
                text-color="warning"
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
      <!-- Таблица пользователей -->
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
          @update:page="handlePageChange" 
          @update:items-per-page="handlePerPageChange"
          @update:sort-by="handleSortChange"
          item-value="id" 
          class="users-table" 
          :row-props="getRowProps"
          :must-sort="false"
          hide-default-footer
          no-data-text="Пользователи не найдены"
          loading-text="Загрузка пользователей..."
        >
          <!-- Активность - отключено, но функционал сохранен -->
          <!-- <template #item.is_active="{ item }">
            <v-checkbox :model-value="item.is_active" @update:model-value="(val) => toggleUserActivity(item, !!val)"
              hide-details density="compact" />
          </template> -->

          <!-- Номер строки -->
          <template #item.rowNumber="{ index }">
            <span class="row-number">{{ (pagination.page - 1) * pagination.limit + index + 1 }}</span>
          </template>

          <!-- ID -->
          <template #item.id="{ item }">
            <span class="font-mono">{{ item.id }}</span>
          </template>

          <!-- Пользователь -->
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

          <!-- Email -->
          <template #item.email="{ item }">
            <a :href="`mailto:${item.email}`" class="email-link">{{ item.email }}</a>
          </template>

          <!-- Полное имя -->
          <template #item.name="{ item }">
            <span v-if="item.name" class="text-body-2">{{ item.name }}</span>
            <span v-else class="text-medium-emphasis">—</span>
          </template>

        <!-- Создатель -->
        <template #item.creator_name="{ item }">
          <span v-if="item.creator_name || item.creatorName" class="text-body-2">
            {{ item.creator_name || item.creatorName }}
          </span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <!-- Дата создания -->
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

          <!-- Роль -->
          <template #item.role="{ item }">
            <div v-if="item.role" class="d-flex align-center">
              <!-- Для ролей "Партнер" и "Клиент" показываем только иконку с подсказкой -->
              <v-tooltip
                v-if="item.role.display_name === 'Партнер' || item.role.display_name === 'Клиент'"
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
              <!-- Для остальных ролей показываем иконку с текстом -->
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

          <!-- Тип пользователя - отключено, но функционал сохранен -->
          <!-- <template #item.user_type="{ item }">
            <div class="d-flex align-center">
              <v-icon :icon="getUserTypeIcon(item.user_type)" size="22" class="mr-2" />
              {{ getUserTypeText(item.user_type) }}
            </div>
          </template> -->

          <!-- Действия -->
          <template #item.actions="{ item }">
            <div class="actions-cell">
              <v-btn
                :icon="item.is_active ? 'mdi-pause' : 'mdi-play'"
                variant="text"
                size="x-small"
                :color="item.is_active ? 'warning' : 'success'"
                @click="toggleUserActivity(item, !item.is_active)"
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
                  <v-list-item @click="viewUser(item)" prepend-icon="mdi-eye">
                    <v-list-item-title>Просмотр</v-list-item-title>
                  </v-list-item>
                  
                  <v-list-item @click="editUser(item)" prepend-icon="mdi-pencil">
                    <v-list-item-title>Редактировать</v-list-item-title>
                  </v-list-item>
                  
                  <v-divider />
                  
                  <!-- Доступ к мониторингу для партнеров и клиентов -->
                  <v-list-item 
                    v-if="item.role && (item.role.display_name === 'Партнер' || item.role.display_name === 'Клиент')"
                    @click="loginToMonitoring(item)"
                    prepend-icon="mdi-chart-line"
                  >
                    <v-list-item-title>Войти в мониторинг</v-list-item-title>
                  </v-list-item>
                  
                  <!-- Доступ к CMS только для партнеров -->
                  <v-list-item 
                    v-if="item.role && item.role.display_name === 'Партнер'"
                    @click="loginToCMS(item)"
                    prepend-icon="mdi-cog"
                  >
                    <v-list-item-title>Войти в CMS</v-list-item-title>
                  </v-list-item>
                  
                  <v-divider v-if="item.role && (item.role.display_name === 'Партнер' || item.role.display_name === 'Клиент')" />
                  
                  <v-list-item @click="showUserProperties(item)" prepend-icon="mdi-account-cog">
                    <v-list-item-title>Свойства пользователя</v-list-item-title>
                  </v-list-item>
                  
                  <v-list-item @click="resetUserPassword(item)" prepend-icon="mdi-key">
                    <v-list-item-title>Сменить пароль</v-list-item-title>
                  </v-list-item>
                  
                  <v-divider />
                  
                  <v-list-item 
                    @click="deleteUser(item)" 
                    prepend-icon="mdi-delete" 
                    class="text-error"
                  >
                    <v-list-item-title>Удалить пользователя</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </template>
        </v-data-table>

        <!-- Кастомный футер с пагинацией в стиле Accounts -->
        <div class="compact-pagination">
          <v-select
            v-model="itemsPerPageForSelect"
            :items="perPageOptions"
            variant="outlined"
            density="compact"
            class="items-select"
            @update:model-value="handlePerPageChange"
            hide-details
          />
          <span class="range-info">
            {{ pagination.limit > 0 && pagination.limit < 100000 
              ? `${(pagination.page - 1) * pagination.limit + 1}-${Math.min(pagination.page * pagination.limit, serverItemsLength)} из ${serverItemsLength}` 
              : `Все ${serverItemsLength} записей` }}
          </span>
          <div class="nav-controls">
            <v-btn
              icon="mdi-page-first"
              variant="text"
              size="x-small"
              :disabled="pagination.page === 1"
              @click="handlePageChange(1)"
              title="Первая"
            />
            <v-btn
              icon="mdi-chevron-left"
              variant="text"
              size="x-small"
              :disabled="pagination.page === 1"
              @click="handlePageChange(pagination.page - 1)"
              title="Предыдущая"
            />
            <span class="page-info">{{ pagination.page }} / {{ usersData?.pages || 1 }}</span>
            <v-btn
              icon="mdi-chevron-right"
              variant="text"
              size="x-small"
              :disabled="pagination.page >= (usersData?.pages || 1)"
              @click="handlePageChange(pagination.page + 1)"
              title="Следующая"
            />
            <v-btn
              icon="mdi-page-last"
              variant="text"
              size="x-small"
              :disabled="pagination.page >= (usersData?.pages || 1)"
              @click="handlePageChange(usersData?.pages || 1)"
              title="Последняя"
            />
          </div>
        </div>
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

    <!-- Красивые уведомления об успехе -->
    <SuccessNotification
      v-model="successNotification.show"
      :title="successNotification.title"
      :message="successNotification.message"
      :details="successNotification.details"
      :icon="successNotification.icon"
    />
  </div>
</template>

<script setup lang="ts">
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import AppleInput from '@/components/Apple/AppleInput.vue';
import SuccessNotification from '@/components/Common/SuccessNotification.vue';
import InactiveUsersDialog from '@/components/Users/InactiveUsersDialog.vue';
import PasswordResetDialog from '@/components/Users/PasswordResetDialog.vue';
import UserDialog from '@/components/Users/UserDialog.vue';
import UserViewDialog from '@/components/Users/UserViewDialog.vue';
import usersService from '@/services/usersService';
import type {
  UserFilters,
  UserWithRelations
} from '@/types/users';
import { debounce } from 'lodash-es';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

// Reactive data
const router = useRouter();
const loading = ref(false);
// removed unused refs: saving, resetting
// removed unused: exporting
const users = ref<UserWithRelations[]>([]);
const usersData = ref<any>(null);

// Pagination
const pagination = ref({
  page: 1,
  limit: 10,
});

// Filters
const filters = ref<UserFilters>({
  search: '',
  role: undefined,
  user_type: undefined,
  active: undefined,
  ordering: '-creation_datetime', // По умолчанию сортируем по дате создания в порядке убывания
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

// removed unused form state: userForm, formErrors, userFormRef

// Password reset dialog
const passwordDialog = ref({
  show: false,
  user: null as UserWithRelations | null,
});

// removed unused password form state: passwordForm, passwordErrors

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
  // Проверяем только реальные фильтры (исключаем сортировку)
  const realFilters = { ...filters.value };
  // Убираем параметр ordering из проверки, так как это не фильтр, а сортировка
  delete realFilters.ordering;
  
  return Object.values(realFilters).some(value =>
    value !== undefined && value !== null && value !== ''
  );
});

const activeFiltersCount = computed(() => {
  // Подсчитываем только реальные фильтры (исключаем сортировку)
  const realFilters = { ...filters.value };
  // Убираем параметр ordering из подсчета, так как это не фильтр, а сортировка
  delete realFilters.ordering;
  
  return Object.values(realFilters).filter(value =>
    value !== undefined && value !== null && value !== ''
  ).length;
});

// Computed properties для пагинации
const serverItemsLength = computed(() => {
  const total = usersData.value?.total ?? 0;
  console.log('🔍 Computed serverItemsLength:', total);
  return total;
});

const itemsPerPageForSelect = computed({
  get: () => pagination.value.limit === 100000 ? -1 : pagination.value.limit,
  set: (value) => handlePerPageChange(value)
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
    return 'Введите имя, email или логин (поиск по создателю исключен). Для поиска нескольких пользователей разделите запятой';
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

// Функции для правильной сортировки
const sortByNumber = (a: any, b: any, key: string) => {
  const numA = parseInt(a[key]) || 0;
  const numB = parseInt(b[key]) || 0;
  return numA - numB;
};

const sortByString = (a: any, b: any, key: string) => {
  const strA = (a[key] || '').toString().toLowerCase();
  const strB = (b[key] || '').toString().toLowerCase();
  return strA.localeCompare(strB, 'ru');
};

const sortByDate = (a: any, b: any) => {
  const timeA = a._creation_datetime_sort || 0;
  const timeB = b._creation_datetime_sort || 0;
  return timeA - timeB; // Клиентская сортировка по возрастанию (сервер уже присылает в правильном порядке)
};

const sortByRole = (a: any, b: any) => {
  const roleA = a.role?.display_name || '';
  const roleB = b.role?.display_name || '';
  return roleA.localeCompare(roleB, 'ru');
};

// Table headers
const tableHeaders = computed(() => [
  { title: '№', value: 'rowNumber', sortable: false, width: 60 },
  // { title: 'Активность', value: 'is_active', sortable: false, width: 100 }, // Отключено, но функционал сохранен
  { 
    title: 'ID', 
    value: 'id', 
    sortable: true, 
    width: 80
  },
  { 
    title: 'Пользователь', 
    value: 'username', 
    sortable: true, 
    width: 200
  },
  { 
    title: 'Email', 
    value: 'email', 
    sortable: true
  },
  { 
    title: 'Полное имя', 
    value: 'name', 
    sortable: true
  },
  { 
    title: 'Создатель', 
    value: 'creator_name', 
    sortable: true
  },
  { 
    title: 'Дата создания', 
    value: 'creation_datetime', 
    sortable: true
  },
  { title: 'Роль', value: 'role', sortable: false },
  // { title: 'Тип', value: 'user_type', sortable: true }, // Отключено, но функционал сохранен
  { title: 'Действия', value: 'actions', sortable: false, width: 160 },
]);

// Доступные значения для количества элементов на странице
const perPageOptions = [
  { title: '5', value: 5 },
  { title: '10', value: 10 },
  { title: '25', value: 25 },
  { title: '50', value: 50 },
  { title: '75', value: 75 },
  { title: '100', value: 100 },
  { title: '150', value: 150 },
];

// Methods
const loadUsers = async () => {
  try {
    loading.value = true;
    console.log('🔄 Loading users...', { page: pagination.value.page, limit: pagination.value.limit, filters: filters.value });
    console.log('🔍 Фильтры для API:', {
      search: filters.value.search,
      role: filters.value.role,
      active: filters.value.active,
      roleType: typeof filters.value.role
    });

    const response = await usersService.getUsers(
      pagination.value.page,
      pagination.value.limit,
      filters.value
    );

    console.log('📡 Users API response:', response);

    if (response.status === 'success') {
      // Обрабатываем данные пользователей для правильной сортировки дат
      const processedUsers = response.data.items.map((user: any) => {
        // Добавляем поле для правильной сортировки дат
        if (user.creation_datetime) {
          user._creation_datetime_sort = new Date(user.creation_datetime).getTime();
        }
        return user;
      });
      
      users.value = processedUsers;
      usersData.value = response.data;
      console.log('✅ Users loaded successfully:', users.value.length, 'users');
      console.log('📊 Pagination data:', {
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        pages: response.data.pages,
        items_count: response.data.items.length,
        server_items_length: response.data.total
      });
      console.log('🔍 usersData.value:', usersData.value);
      console.log('🔍 usersData.value.total:', usersData.value?.total, 'type:', typeof usersData.value?.total);
      console.log('🔍 users.value.length:', users.value.length);
      console.log('🔍 Размер таблицы будет:', parseInt(usersData.value?.total) || 0);
      
      // Отладка дат для первых нескольких пользователей
      console.log('📅 Отладка дат создания пользователей:');
      users.value.slice(0, 5).forEach((user, index) => {
        console.log(`📅 Пользователь ${index + 1}:`, {
          username: user.username,
          creation_datetime: user.creation_datetime,
          _creation_datetime_sort: user._creation_datetime_sort,
          type: typeof user.creation_datetime,
          raw_value: user.creation_datetime
        });
      });
      
      // Статистика активности пользователей (логирование отключено для продакшена)
      // console.log('👥 Статус активности пользователей:');
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
        value: role.display_name,  // Используем display_name для фильтрации
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
    ordering: '-creation_datetime', // Сохраняем сортировку по умолчанию
  };
  pagination.value.page = 1;
  loadUsers();
};

// Dialog methods
const openCreateDialog = () => {
  // Переходим на страницу создания пользователя
  router.push('/users/create');
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

const onUserSaved = async () => {
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

// Login to monitoring
const loginToMonitoring = (user: UserWithRelations) => {
  // TODO: Реализовать логику входа в мониторинг
  console.log('Вход в мониторинг для пользователя:', user.username);
  showSnackbar('Функция входа в мониторинг находится в разработке', 'info');
};

// Login to CMS
const loginToCMS = (user: UserWithRelations) => {
  // TODO: Реализовать логику входа в CMS
  console.log('Вход в CMS для пользователя:', user.username);
  showSnackbar('Функция входа в CMS находится в разработке', 'info');
};

// Show user properties
const showUserProperties = (user: UserWithRelations) => {
  viewUser(user);
};

// removed unused: openInactiveUsersDialog

const onInactiveUsersSuccess = async (message: string) => {
  showSnackbar(message, 'success');
  await loadUsers();
  await loadStats();
};

// removed unused: exportUsers

// Pagination handlers
const handlePageChange = (page: number) => {
  pagination.value.page = page;
  loadUsers();
};

const handlePerPageChange = (limit: number) => {
  // Обрабатываем значение -1 как "Все"
  if (limit === -1) {
    // Устанавливаем очень большое значение для загрузки всех записей
    pagination.value.limit = 100000; // Без ограничений для вывода всех
  } else {
    pagination.value.limit = limit;
  }
  pagination.value.page = 1;
  loadUsers();
};

// Sort handler
const handleSortChange = (sortBy: any[]) => {
  console.log('🔀 Sorting changed:', sortBy);
  
  if (!sortBy || sortBy.length === 0) {
    // Если сортировка сброшена, возвращаем сортировку по дате создания
    filters.value.ordering = '-creation_datetime';
  } else {
    const sortItem = sortBy[0];
    const key = sortItem.key;
    const order = sortItem.order;
    
    // Маппинг полей для серверной сортировки
    const fieldMapping: Record<string, string> = {
      'id': 'id',
      'username': 'username',
      'email': 'email',
      'name': 'name',  // Сервер использует поле name
      'creator_name': 'creator_name',
      'creation_datetime': 'creation_datetime'
    };
    
    const serverField = fieldMapping[key];
    if (serverField) {
      // Формируем параметр ordering для сервера
      if (order === 'desc') {
        filters.value.ordering = `-${serverField}`;
      } else {
        filters.value.ordering = serverField;
      }
    }
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

// Функция для определения цвета аватара пользователя
const getUserAvatarColor = (user: UserWithRelations): string => {
  // Определяем активность пользователя
  let isActive = true; // По умолчанию считаем активным
  
  if (user.is_active !== undefined && user.is_active !== null) {
    if (typeof user.is_active === 'string') {
      // Если строка, проверяем на "false", "0", "no", "off"
      isActive = !['false', '0', 'no', 'off', ''].includes(user.is_active.toLowerCase());
    } else if (typeof user.is_active === 'boolean') {
      // Если boolean, используем как есть
      isActive = user.is_active;
    } else if (typeof user.is_active === 'number') {
      // Если число, 0 = неактивен, остальное = активен
      isActive = user.is_active !== 0;
    }
  }
  
  // Возвращаем цвет в зависимости от активности
  return isActive ? 'primary' : 'error';
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

// Функция для получения иконки роли
const getRoleIcon = (roleName: string): string => {
  const roleIconMap: Record<string, string> = {
    'Партнер': 'mdi-handshake',
    'Клиент': 'mdi-account-group',
    'Администратор': 'mdi-shield-account',
    'Менеджер': 'mdi-account-supervisor',
    'Техник': 'mdi-account-hard-hat',
    'Бухгалтер': 'mdi-calculator',
    'Пользователь': 'mdi-account',
  };
  return roleIconMap[roleName] || 'mdi-account-outline';
};

// Функция форматирования даты (только дата)
const formatDateOnly = (dateString: string): string => {
  console.log('📅 Форматирование даты:', dateString, 'тип:', typeof dateString);
  const date = new Date(dateString);
  console.log('📅 Парсированная дата:', date, 'валидна:', !isNaN(date.getTime()));
  
  const formatted = date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  
  console.log('📅 Отформатированная дата:', formatted);
  return formatted;
};

// Функция форматирования времени (для подсказки)
const formatTimeOnly = (dateString: string): string => {
  const date = new Date(dateString);
  
  const formatted = date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  return formatted;
};

// Функция форматирования полной даты и времени (для обратной совместимости)
const formatDate = (dateString: string): string => {
  console.log('📅 Форматирование даты:', dateString, 'тип:', typeof dateString);
  const date = new Date(dateString);
  console.log('📅 Парсированная дата:', date, 'валидна:', !isNaN(date.getTime()));
  
  const formatted = date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  console.log('📅 Отформатированная дата:', formatted);
  return formatted;
};

// Функция для определения CSS класса строки
const getRowClass = (item: UserWithRelations): string => {
  console.log('🔍 Проверяем пользователя:', item.username, 'is_active:', item.is_active);
  const className = item.is_active ? '' : 'inactive-user';
  if (!item.is_active) {
    console.log('🔴 Неактивный пользователь:', item.username, 'класс:', className);
  }
  return className;
};

// Функция для определения свойств строки
const getRowProps = (item: UserWithRelations) => {
  // Надежная проверка активности
  let isActive = true; // По умолчанию считаем активным
  
  if (item.is_active !== undefined && item.is_active !== null) {
    if (typeof item.is_active === 'string') {
      // Если строка, проверяем на "false", "0", "no", "off"
      isActive = !['false', '0', 'no', 'off', ''].includes(item.is_active.toLowerCase());
    } else if (typeof item.is_active === 'boolean') {
      // Если boolean, используем как есть
      isActive = item.is_active;
    } else if (typeof item.is_active === 'number') {
      // Если число, 0 = неактивен, остальное = активен
      isActive = item.is_active !== 0;
    }
  }
  
  const props = {
    class: isActive ? '' : 'inactive-user',
    style: isActive ? {} : {
      backgroundColor: 'rgba(244, 67, 54, 0.08) !important',
      borderLeft: '4px solid #f44336 !important'
    }
  };
  
  return props;
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
  const action = isActive ? 'активации' : 'деактивации';
  
  try {
    console.log(`🔄 ${action} пользователя:`, user.username);
    
    // Вызываем API для изменения статуса
    await usersService.toggleUserStatus(user.id, isActive);
    
    // Обновляем локальное состояние
    user.is_active = isActive;
    
    console.log(`✅ Пользователь ${user.username} ${isActive ? 'активирован' : 'деактивирован'}`);
    
    // Показываем уведомление об успехе
    showSnackbar(
      `Пользователь "${user.username}" успешно ${isActive ? 'активирован' : 'деактивирован'}`,
      'success'
    );
    
    // Обновляем данные
    await loadUsers();
    await loadStats();
    
  } catch (error) {
    console.error('❌ Ошибка изменения статуса пользователя:', error);
    
    // Показываем уведомление об ошибке
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    showSnackbar(
      `Ошибка ${action} пользователя "${user.username}": ${errorMessage}`,
      'error'
    );
  }
};

// Удаление отдельного поискового термина для пользователей
const removeUserSearchTerm = (index: number) => {
  const currentSearch = filters.value.search ?? '';
  const searchTerms = currentSearch.split(',').map(term => term.trim()).filter(term => term.length > 0);
  searchTerms.splice(index, 1);
  filters.value.search = searchTerms.join(', ');
  debouncedSearch();
};

// Watchers
watch([filters], () => {
  pagination.value.page = 1;
  loadUsers();
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
  align-items: center;
  gap: 10px; /* небольшой отступ между элементами */
  flex-wrap: nowrap;
  width: 100%;
}

/* Единая высота и вертикальное выравнивание всех полей фильтров */
.filters-row :deep(.v-input) {
  margin-top: 0;
  margin-bottom: 0;
}

.filters-row :deep(.v-field--variant-outlined) {
  height: 44px;
}

.filters-row :deep(.v-field__input) {
  min-height: 44px;
  padding-top: 0;
  padding-bottom: 0;
  display: flex;
  align-items: center;
}

/* Единый радиус скругления и стиль для всех элементов фильтра */
.filters-row :deep(.v-field--variant-outlined),
.filters-row :deep(.apple-input-wrapper-base),
.filter-clear :deep(.v-btn),
.filters-row :deep(.v-field),
.filters-row :deep(.v-field__outline) {
  border-radius: 10px !important;
}

/* Дополнительные правила для обеспечения одинакового скругления */
.filters-row :deep(.v-select .v-field),
.filters-row :deep(.v-select .v-field__outline),
.filters-row :deep(.v-select .v-field__input),
.filters-row :deep(.v-input .v-field),
.filters-row :deep(.v-input .v-field__outline) {
  border-radius: 10px !important;
}

/* Единый цвет границы/outline и поведение при hover/focus */
.filters-row :deep(.v-field--variant-outlined .v-field__outline) {
  /* совпадает по ощущению с Vuetify, но делаем чуть выразительнее */
  border-color: rgba(var(--v-theme-on-surface), 0.24);
}

.filters-row :deep(.v-field--variant-outlined:hover .v-field__outline) {
  border-color: rgba(var(--v-theme-primary), 0.40);
}

.filters-row :deep(.v-field--focused .v-field__outline) {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.12);
}

.filters-row :deep(.v-field__outline) {
  height: 44px;
}

.filter-item {
  flex: 1 1 0; /* динамическая ширина, равномерное распределение */
  min-width: 0;
  display: flex;            /* выравниваем содержимое по вертикали как у v-select */
  align-items: center;      /* чтобы верхний край совпадал между инпутом и селектами */
}

.filter-search {
  flex: 3 1 0; /* заметно шире остальных */
  min-width: 420px;
  margin-top: -20px; /* поднимаем поле поиска еще выше */
}

.filter-create {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  margin-top: -26px; /* поднимаем кнопку создания на 2px */
}

.filter-clear {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  margin-left: auto; /* иконка сброса в конце строки */
  margin-top: -26px; /* поднимаем кнопку сброса фильтров на 2px */
}

/* Выравнивание AppleInput под высоту 44px */
.filters-row :deep(.apple-input-group) {
  display: flex;
  align-items: center;
  margin: 0; /* убрать возможные внешние отступы */
  padding: 0;
  gap: 0; /* не добавлять вертикальный зазор внутри группы */
  width: 100%;
}

.filters-row :deep(.apple-input-container) {
  height: 44px;
  width: 100%;
}

.filters-row :deep(.apple-input-wrapper-base) {
  height: 44px;
  min-height: 44px;
  width: 100%;
  border-radius: 10px; /* выравниваем с v-select */
  border: 1px solid rgba(var(--v-theme-on-surface), 0.24);
  background: rgb(var(--v-theme-surface));
}

/* Убираем смещение AppleInput при фокусе для ровной линии */
.filters-row :deep(.apple-input-focused) {
  transform: none;
}

/* Единое состояние при hover/focus для AppleInput */
.filters-row :deep(.apple-input-container:hover .apple-input-wrapper-base) {
  border-color: rgba(var(--v-theme-primary), 0.40);
}

.filters-row :deep(.apple-input-focused .apple-input-wrapper-base) {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.12);
}

/* Приводим кнопки к высоте инпутов/селектов и центрируем */
.filter-create :deep(.v-btn),
.filter-clear :deep(.v-btn) {
  height: 44px !important; /* соответствует density="comfortable" */
  width: 44px !important;
  min-width: 44px !important;
  min-height: 44px !important;
  padding: 0 !important;
  border-radius: 10px !important;
}

/* Дополнительные стили для обеспечения одинакового размера */
.filter-create :deep(.v-btn .v-icon),
.filter-clear :deep(.v-btn .v-icon) {
  font-size: 20px !important;
}

.filter-create :deep(.v-btn .v-btn__content),
.filter-clear :deep(.v-btn .v-btn__content) {
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
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
  
  .filter-create,
  .filter-clear {
    align-self: flex-end;
    padding-top: 0;
  }
}

/* Стили для активной кнопки очистки фильтров */
.filter-clear-active {
  position: relative;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3) !important;
  animation: pulse-filter 2s infinite;
}

@keyframes pulse-filter {
  0% {
    box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
  }
  50% {
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.5);
  }
  100% {
    box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
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
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
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
  color: var(--apple-text-primary-dark);
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

/* Подсветка неактивных пользователей */
.users-table :deep(.v-data-table__tr.inactive-user),
.users-table :deep(.v-data-table__tr[class*="inactive-user"]) {
  background-color: rgba(244, 67, 54, 0.08) !important;
  border-left: 4px solid #f44336 !important;
}

.users-table :deep(.v-data-table__tr.inactive-user:hover),
.users-table :deep(.v-data-table__tr[class*="inactive-user"]:hover) {
  background-color: rgba(244, 67, 54, 0.12) !important;
}

.users-table :deep(.v-data-table__tr.inactive-user .v-data-table__td),
.users-table :deep(.v-data-table__tr[class*="inactive-user"] .v-data-table__td) {
  border-bottom-color: rgba(244, 67, 54, 0.16) !important;
}

/* Альтернативный подход через item-class */
.users-table :deep(.inactive-user) {
  background-color: rgba(244, 67, 54, 0.08) !important;
  border-left: 4px solid #f44336 !important;
}

.users-table :deep(.inactive-user:hover) {
  background-color: rgba(244, 67, 54, 0.12) !important;
}

.users-table :deep(.inactive-user td) {
  border-bottom-color: rgba(244, 67, 54, 0.16) !important;
}

/* Темная тема для неактивных пользователей */
[data-theme="dark"] .users-table :deep(.v-data-table__tr.inactive-user),
[data-theme="dark"] .users-table :deep(.v-data-table__tr[class*="inactive-user"]) {
  background-color: rgba(244, 67, 54, 0.12) !important;
  border-left-color: #ff5252 !important;
}

[data-theme="dark"] .users-table :deep(.v-data-table__tr.inactive-user:hover),
[data-theme="dark"] .users-table :deep(.v-data-table__tr[class*="inactive-user"]:hover) {
  background-color: rgba(244, 67, 54, 0.16) !important;
}

[data-theme="dark"] .users-table :deep(.v-data-table__tr.inactive-user .v-data-table__td),
[data-theme="dark"] .users-table :deep(.v-data-table__tr[class*="inactive-user"] .v-data-table__td) {
  border-bottom-color: rgba(244, 67, 54, 0.24) !important;
}

[data-theme="dark"] .users-table :deep(.inactive-user) {
  background-color: rgba(244, 67, 54, 0.12) !important;
  border-left-color: #ff5252 !important;
}

[data-theme="dark"] .users-table :deep(.inactive-user:hover) {
  background-color: rgba(244, 67, 54, 0.16) !important;
}

[data-theme="dark"] .users-table :deep(.inactive-user td) {
  border-bottom-color: rgba(244, 67, 54, 0.24) !important;
}

/* Дополнительные селекторы для Vuetify 3 */
.users-table :deep(.v-data-table__tr.inactive-user),
.users-table :deep(tr.inactive-user),
.users-table :deep(.inactive-user) {
  background-color: rgba(244, 67, 54, 0.08) !important;
  border-left: 4px solid #f44336 !important;
}

.users-table :deep(.v-data-table__tr.inactive-user:hover),
.users-table :deep(tr.inactive-user:hover),
.users-table :deep(.inactive-user:hover) {
  background-color: rgba(244, 67, 54, 0.12) !important;
}

[data-theme="dark"] .users-table :deep(.v-data-table__tr.inactive-user),
[data-theme="dark"] .users-table :deep(tr.inactive-user),
[data-theme="dark"] .users-table :deep(.inactive-user) {
  background-color: rgba(244, 67, 54, 0.12) !important;
  border-left-color: #ff5252 !important;
}

[data-theme="dark"] .users-table :deep(.v-data-table__tr.inactive-user:hover),
[data-theme="dark"] .users-table :deep(tr.inactive-user:hover),
[data-theme="dark"] .users-table :deep(.inactive-user:hover) {
  background-color: rgba(244, 67, 54, 0.16) !important;
}

/* Максимально специфичный селектор для принудительного применения стилей */
.users-table :deep(.inactive-user),
.users-table :deep(.inactive-user tr),
.users-table :deep(.inactive-user td),
.users-table :deep(.inactive-user th),
.users-table :deep(.v-data-table__tr.inactive-user),
.users-table :deep(.v-data-table__tr.inactive-user td),
.users-table :deep(.v-data-table__tr.inactive-user th),
.users-table :deep(tr.inactive-user),
.users-table :deep(tr.inactive-user td),
.users-table :deep(tr.inactive-user th) {
  background-color: rgba(244, 67, 54, 0.08) !important;
  border-left: 4px solid #f44336 !important;
}

/* Принудительные стили для неактивных пользователей - ВРЕМЕННО ОТКЛЮЧЕНО */
/* .inactive-user,
.inactive-user * {
  background-color: rgba(244, 67, 54, 0.08) !important;
  border-left: 4px solid #f44336 !important;
} */

/* Компактная пагинация в стиле Accounts */
.compact-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 20px 24px;
  flex-wrap: nowrap;
  white-space: nowrap;
  min-height: 40px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 0 16px;
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

.items-select :deep(.v-field__append-inner) {
  padding-left: 4px !important;
}

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

.page-info {
  font-size: 0.9rem;
  color: #555;
  font-weight: 700;
  padding: 4px 8px;
  min-width: 50px;
  text-align: center;
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

.nav-controls .v-btn {
  min-width: 32px;
  height: 32px;
}

/* Темная тема */
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

/* Стили для иконок ролей */
.role-icon-only {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.role-icon-only:hover {
  transform: scale(1.1);
}

.role-icon {
  margin-right: 8px;
  transition: transform 0.2s ease;
}

.role-icon:hover {
  transform: scale(1.1);
}

.role-name {
  font-size: 0.875rem;
  font-weight: 500;
}
</style>
