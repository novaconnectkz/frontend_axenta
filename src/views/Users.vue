<template>
  <div class="users-page">
    <UsersStats :stats="statsCards" />

    <UsersFilters
      :filters="filters"
      :role-options="roleOptions"
      :loading-roles="loadingRoles"
      @update:filters="onFiltersUpdate"
      @search="debouncedSearch"
      @clear="clearFilters"
    />

    <UsersTable
      :users="users"
      :loading="loading"
      :pagination="pagination"
      :server-items-length="serverItemsLength"
      :total-pages="usersData?.pages || 0"
      :ordering="filters.ordering"
      @page-change="onPageChange"
      @per-page-change="onPerPageChange"
      @sort-change="onSortChange"
      @toggle-activity="onToggleActivity"
      @login-monitoring="actions.loginToMonitoring"
      @login-cms="actions.loginToCMS"
      @view="onView"
      @reset-password="onResetPassword"
      @delete="onDelete"
    />

    <UserDialog
      v-model="userDialog.show"
      :user="userDialog.user"
      :role-options="roleOptionsForForm"
      :template-options="templateOptions"
      :loading-roles="loadingRoles"
      :loading-templates="loadingTemplates"
      @saved="onUserSaved"
      @error="(msg: string) => showSnackbar(msg, 'error')"
    />

    <UserViewDialog
      v-model="viewDialog.show"
      :user="viewDialog.user"
      @edit="onEdit"
      @delete="onDelete"
      @refreshed="onUserRefreshed"
      @snack="(p: { text: string; color: 'success' | 'error' | 'info' }) => showSnackbar(p.text, p.color)"
    />

    <WialonUserEditDialog
      v-model="wialonEditDialog.show"
      :user="wialonEditDialog.user"
      @saved="onUserRefreshed"
      @snack="(p: { text: string; color: 'success' | 'error' | 'info' }) => showSnackbar(p.text, p.color)"
    />

    <PasswordResetDialog
      v-model="passwordDialog.show"
      :user="passwordDialog.user"
      @success="(msg: string) => showSnackbar(msg, 'success')"
      @error="(msg: string) => showSnackbar(msg, 'error')"
    />

    <InactiveUsersDialog
      v-model="inactiveUsersDialog.show"
      @success="onInactiveUsersSuccess"
      @error="(msg: string) => showSnackbar(msg, 'error')"
    />

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="bottom right"
    >
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Закрыть</v-btn>
      </template>
    </v-snackbar>

    <SuccessNotification
      v-model="successNotification.show"
      :title="successNotification.title"
      :message="successNotification.message"
      :details="successNotification.details"
      :icon="successNotification.icon"
    />

    <AppleFAB icon="mdi-plus" :items="fabMenuItems" @item-click="handleFabAction" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { debounce } from 'lodash-es';
import AppleFAB from '@/components/Apple/AppleFAB.vue';
import SuccessNotification from '@/components/Common/SuccessNotification.vue';
import InactiveUsersDialog from '@/components/Users/InactiveUsersDialog.vue';
import PasswordResetDialog from '@/components/Users/PasswordResetDialog.vue';
import UserDialog from '@/components/Users/UserDialog.vue';
import WialonUserEditDialog from '@/components/Users/WialonUserEditDialog.vue';
import UserViewDialog from '@/components/Users/UserViewDialog.vue';
import UsersFilters from '@/components/Users/UsersFilters.vue';
import UsersStats from '@/components/Users/UsersStats.vue';
import UsersTable from '@/components/Users/UsersTable.vue';
import { useUserActions } from '@/composables/useUserActions';
import { useUsersList, type UsersListFilters } from '@/composables/useUsersList';
import usersService from '@/services/usersService';
import type { UserWithRelations } from '@/types/users';

const FILTERS_STORAGE_KEY = 'users_page_filters';

const defaultFilters = (): UsersListFilters => ({
  search: '',
  role: undefined,
  user_type: undefined,
  active: undefined,
  source: null,
  ordering: '-creation_datetime',
});

const filters = ref<UsersListFilters>(defaultFilters());

const {
  users,
  usersData,
  loading,
  pagination,
  wialonStats,
  axentaStats,
  loadUsers,
  loadGlobalStats,
  handlePageChange,
  handlePerPageChange,
} = useUsersList({ filters });

const loadFiltersFromStorage = (): boolean => {
  try {
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!saved) return false;
    const data = JSON.parse(saved);
    filters.value = {
      search: data.search ?? '',
      role: data.role ?? undefined,
      user_type: data.user_type ?? undefined,
      active: data.active ?? undefined,
      source: data.source ?? null,
      ordering: data.ordering ?? '-creation_datetime',
    };
    if (typeof data.page === 'number' && data.page > 0) pagination.value.page = data.page;
    if (typeof data.limit === 'number' && data.limit > 0) pagination.value.limit = data.limit;
    return true;
  } catch (e) {
    console.error('Ошибка загрузки фильтров users:', e);
    return false;
  }
};

const saveFiltersToStorage = () => {
  try {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        search: filters.value.search,
        role: filters.value.role,
        user_type: filters.value.user_type,
        active: filters.value.active,
        source: filters.value.source,
        ordering: filters.value.ordering,
        page: pagination.value.page,
        limit: pagination.value.limit,
      }),
    );
  } catch (e) {
    console.error('Ошибка сохранения фильтров users:', e);
  }
};

watch([filters, pagination], saveFiltersToStorage, { deep: true });

const roleOptions = ref<Array<{ title: string; value: string }>>([]);
const roleOptionsForForm = ref<Array<{ title: string; value: number }>>([]);
const templateOptions = ref<Array<{ title: string; value: number }>>([]);
const loadingRoles = ref(false);
const loadingTemplates = ref(false);

interface StatBreakdown { axenta: number; wl: number; wh: number }
interface StatItem {
  key: string;
  label: string;
  value: number;
  icon: string;
  color: string;
  breakdown?: StatBreakdown;
}

const stats = ref<StatItem[]>([
  { key: 'total', label: 'Всего пользователей', value: 0, icon: 'mdi-account-group-outline', color: 'primary' },
  { key: 'active', label: 'Активные', value: 0, icon: 'mdi-account-check-outline', color: 'success' },
  { key: 'inactive', label: 'Неактивные', value: 0, icon: 'mdi-account-off-outline', color: 'warning' },
  { key: 'recent', label: 'Недавние входы', value: 0, icon: 'mdi-history', color: 'info' },
]);

const statsCards = computed(() => stats.value);

const userDialog = ref({ show: false, isEdit: false, user: null as UserWithRelations | null });
const wialonEditDialog = ref({ show: false, user: null as any });
const passwordDialog = ref({ show: false, user: null as UserWithRelations | null });
const viewDialog = ref({ show: false, user: null as UserWithRelations | null });
const inactiveUsersDialog = ref({ show: false });
const snackbar = ref({ show: false, text: '', color: 'info', timeout: 5000 });
const successNotification = reactive({
  show: false,
  title: '',
  message: '',
  details: '',
  icon: 'mdi-check-circle',
});

const serverItemsLength = computed(() => usersData.value?.total ?? 0);

const showSnackbar = (text: string, color = 'info', timeout = 5000) => {
  snackbar.value = { show: true, text, color, timeout };
};

const updateTotalStats = () => {
  stats.value[0].value = axentaStats.value.total + wialonStats.value.total;
  stats.value[1].value = axentaStats.value.active + wialonStats.value.active;
  stats.value[2].value = axentaStats.value.inactive + wialonStats.value.inactive;
  stats.value[0].breakdown = {
    axenta: axentaStats.value.total,
    wl: wialonStats.value.wl.total,
    wh: wialonStats.value.wh.total,
  };
  stats.value[1].breakdown = {
    axenta: axentaStats.value.active,
    wl: wialonStats.value.wl.active,
    wh: wialonStats.value.wh.active,
  };
  stats.value[2].breakdown = {
    axenta: axentaStats.value.inactive,
    wl: wialonStats.value.wl.inactive,
    wh: wialonStats.value.wh.inactive,
  };
};

watch([axentaStats, wialonStats], updateTotalStats, { deep: true });

const loadStats = async (forceRefresh = false) => {
  try {
    const data = await usersService.getUsersStats(forceRefresh);
    if (data && typeof data === 'object') {
      axentaStats.value.total = data.total || 0;
      axentaStats.value.active = data.active_users || data.active || 0;
      axentaStats.value.inactive = data.inactive_users || data.inactive || 0;
      stats.value[3].value = data.recent_logins || data.recent_users || 0;
      updateTotalStats();
    }
  } catch (e) {
    console.error('Ошибка загрузки статистики:', e);
  }
};

const loadRoles = async (forceRefresh = false) => {
  loadingRoles.value = true;
  try {
    const response = await usersService.getRoles(1, 100, { active_only: true }, forceRefresh);
    if (response.status === 'success') {
      // Для фильтра в UI показываем только реально присутствующие в Axenta/Wialon роли:
      // Партнёр (= дилер) и Клиент. Остальные роли (Пользователь, Менеджер и т.п.) — для
      // локальных пользователей которых в snapshot нет, они просто пустят выборку.
      const filterRoles = ['Партнёр', 'Партнер', 'Клиент'];
      roleOptions.value = response.data.items
        .filter((r) => filterRoles.includes(r.display_name))
        .map((r) => ({ title: r.display_name, value: r.display_name }));
      // Для формы создания/редактирования — все роли как есть
      roleOptionsForForm.value = response.data.items.map((r) => ({ title: r.display_name, value: r.id }));
    }
  } catch (e) {
    console.error('Ошибка загрузки ролей:', e);
  } finally {
    loadingRoles.value = false;
  }
};

const loadTemplates = async (forceRefresh = false) => {
  loadingTemplates.value = true;
  try {
    const response = await usersService.getUserTemplates(1, 100, { active_only: true }, forceRefresh);
    if (response.status === 'success') {
      templateOptions.value = response.data.items.map((t) => ({ title: t.name, value: t.id }));
    }
  } catch (e) {
    console.error('Ошибка загрузки шаблонов:', e);
  } finally {
    loadingTemplates.value = false;
  }
};

const debouncedSearch = debounce(() => {
  pagination.value.page = 1;
  loadUsers();
}, 500);

const onFiltersUpdate = (next: UsersListFilters) => {
  // Сравнение по содержимому — игнорируем повторные emit с теми же значениями (UsersFilters
  // computed.set создаёт новый объект каждый раз, deep-watch ловил это и сбрасывал page=1).
  const prev = filters.value;
  const same =
    prev.search === next.search &&
    prev.role === next.role &&
    prev.active === next.active &&
    prev.source === next.source &&
    prev.user_type === next.user_type &&
    prev.ordering === next.ordering;
  if (same) return;
  filters.value = next;
  pagination.value.page = 1;
  loadUsers();
};

const clearFilters = () => {
  filters.value = defaultFilters();
  pagination.value.page = 1;
  try {
    localStorage.removeItem(FILTERS_STORAGE_KEY);
  } catch (e) {
    console.error('Ошибка очистки фильтров users:', e);
  }
  loadUsers();
};

const actions = useUserActions(showSnackbar);

const fabMenuItems = [
  {
    id: 'create',
    label: 'Создать пользователя',
    icon: 'mdi-account-plus-outline',
    color: 'success' as const,
    action: () => actions.openCreate(),
  },
];

const handleFabAction = (item: { id?: string }) => {
  console.log('FAB action:', item.id);
};

const onPageChange = (page: number) => {
  handlePageChange(page);
};
const onPerPageChange = (limit: number) => {
  handlePerPageChange(limit);
};

const onSortChange = (sortBy: any[]) => {
  if (!sortBy || sortBy.length === 0) {
    filters.value.ordering = '-creation_datetime';
  } else {
    const { key, order } = sortBy[0];
    const fieldMap: Record<string, string> = {
      id: 'id',
      username: 'username',
      email: 'email',
      name: 'name',
      creator_name: 'creator_name',
      creation_datetime: 'creation_datetime',
      source: 'source',
    };
    const field = fieldMap[key];
    if (field) {
      filters.value.ordering = order === 'desc' ? `-${field}` : field;
    }
  }
  pagination.value.page = 1;
  loadUsers();
};

const onToggleActivity = async (user: UserWithRelations, isActive: boolean) => {
  if (await actions.toggleActivity(user, isActive)) {
    await Promise.all([loadUsers(), loadStats(), loadGlobalStats()]);
  }
};

// adaptUserForView — приводит UnifiedUser/AxentaUser/WialonUser к shape UserWithRelations,
// который ожидает UserViewDialog. Без этого wialon-юзеры (и sub-users) показывают пустые
// Email/Роль/Тип и Invalid Date в карточке детали.
const adaptUserForView = (u: any): UserWithRelations => {
  const created = u.created_at || u.creation_datetime || '';
  const updated = u.updated_at || u.creation_datetime || created;
  const accountType = u.account_type || u.role || '';
  const roleDisplay = u.role && typeof u.role === 'object'
    ? u.role
    : (typeof u.role === 'string' && u.role
        ? { display_name: roleDisplayName(u.role), color: roleColor(u.role) }
        : (accountType
            ? { display_name: roleDisplayName(accountType), color: roleColor(accountType) }
            : undefined));
  return {
    ...u,
    email: u.email || '',
    name: u.name || u.username || '',
    user_type: u.user_type || accountType || '',
    created_at: created,
    updated_at: updated,
    last_login: u.last_login || '',
    login_count: u.login_count ?? 0,
    role: roleDisplay,
    external_source: u.external_source || u.source_label || u.source,
    external_id: u.external_id || (u.id != null ? String(u.id) : undefined),
  } as UserWithRelations;
};

const roleDisplayName = (r: string): string => {
  switch (r) {
    case 'partner': return 'Партнёр';
    case 'client': return 'Клиент';
    case 'staff': return 'Сотрудник';
    case 'admin': return 'Администратор';
    default: return r;
  }
};

const roleColor = (r: string): string => {
  switch (r) {
    case 'partner': return 'purple';
    case 'client': return 'primary';
    case 'staff': return 'orange';
    case 'admin': return 'red';
    default: return 'primary';
  }
};

const onView = (user: UserWithRelations) => {
  viewDialog.value = { show: true, user: adaptUserForView(user) };
};

const onUserRefreshed = async () => {
  await Promise.all([loadUsers(), loadGlobalStats()]);
};

const onEdit = (user: UserWithRelations) => {
  const u: any = user;
  const isWialon =
    u?.source === 'wialon' ||
    String(u?.external_source || u?.source_label || '').startsWith('WH(') ||
    String(u?.external_source || u?.source_label || '').startsWith('WL(');
  if (isWialon) {
    wialonEditDialog.value = { show: true, user: u };
  } else {
    userDialog.value = { show: true, isEdit: true, user };
  }
};

const onResetPassword = (user: UserWithRelations) => {
  passwordDialog.value = { show: true, user };
};

const onDelete = async (user: UserWithRelations) => {
  if (await actions.deleteUser(user)) {
    await Promise.all([loadUsers(), loadStats(), loadGlobalStats()]);
  }
};

const onUserSaved = async () => {
  showSnackbar(
    userDialog.value.isEdit ? 'Пользователь успешно обновлён' : 'Пользователь успешно создан',
    'success'
  );
  await Promise.all([loadUsers(), loadStats(), loadGlobalStats()]);
};

const onInactiveUsersSuccess = async (message: string) => {
  showSnackbar(message, 'success');
  await Promise.all([loadUsers(), loadStats(), loadGlobalStats()]);
};

onMounted(async () => {
  const token = localStorage.getItem('axenta_token');
  if (!token) {
    showSnackbar('Не найден токен авторизации. Пожалуйста, авторизуйтесь.', 'error');
    return;
  }

  loadFiltersFromStorage();

  try {
    await Promise.all([loadUsers(), loadStats(), loadGlobalStats(), loadRoles(), loadTemplates()]);
  } catch (e) {
    console.error('Ошибка загрузки данных:', e);
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
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow-x: hidden;
}
.users-page > * {
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.page-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}
.page-icon { color: var(--apple-blue); }
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

@media (max-width: 768px) {
  .users-page { gap: 12px; }
  .page-title { font-size: 1.25rem; line-height: 1.3; }
  .page-subtitle { font-size: 0.85rem; }
  .page-title-section { gap: 12px; }
  .page-icon { font-size: 24px !important; width: 24px; height: 24px; }
}
@media (max-width: 480px) {
  .page-title { font-size: 1.1rem; }
}
</style>
