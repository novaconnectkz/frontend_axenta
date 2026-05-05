<template>
  <div class="accounts-page">
    <!-- Статистика -->
    <AccountsStats :stats="stats" :wialon-stats="wialonStats" :total-stats="totalStats" />

    <!-- Фильтры -->
    <AccountsFilters
      v-model:search-query="searchQuery"
      v-model:filters="filters"
      v-model:selected-parent="selectedParent"
      v-model:show-all-chips="showAllSearchChips"
      :parent-options="parentAccountOptions"
      :account-types="accountTypes"
      :status-options="statusOptions"
      :source-options="sourceOptions"
      :search-terms="companySearchTermsArray"
      :is-multiple-search="isMultipleCompanySearch"
      :has-active-filters="hasAnyActiveFilters"
      :active-filters-count="activeFiltersCount"
      @search="debouncedSearch"
      @type-change="onTypeFilterChange"
      @status-change="onStatusFilterChange"
      @source-change="onSourceFilterChange"
      @parent-change="onParentChange"
      @reset="resetFilters"
      @remove-search-term="removeCompanySearchTerm"
    />

    <!-- Таблица учетных записей -->
    <AccountsTable
      :items="accountsWithNumbers"
      :loading="isLoading"
      :background-loading="isBackgroundLoading"
      :wialon-refreshing="isWialonRefreshing"
      :wialon-loading="isWialonLoading"
      :axenta-loading="isAxentaLoading"
      :sort-by="sortBy"
      :sort-order="sortOrder"
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      :total-pages="totalPages"
      :effective-total="effectiveTotalItems"
      :display-range="getDisplayRange()"
      :items-per-page-options="itemsPerPageOptions"
      @sort-change="onSortChange"
      @items-per-page-change="onItemsPerPageChange"
      @first-page="goToFirstPage"
      @prev-page="goToPrevPage"
      @next-page="goToNextPage"
      @last-page="goToLastPage"
      @login-monitoring="loginToMonitoring"
      @login-cms="loginToCms"
      @move="moveAccount"
      @properties="onProperties"
      @delete="deleteAccount"
      @toggle-status="toggleAccountStatus"
      @refresh-stats="refreshSingleWialonAccount"
      :refreshing-ids="refreshingIds"
      @scroll="loadVisibleObjectsStats"
    />


    <!-- Диалог просмотра аккаунта -->
    <ViewAccountDialog v-model="viewDialog" :account="selectedAccount" />

    <!-- Свойства Wialon-аккаунта -->
    <WialonAccountEditDialog
      v-model="wialonPropsDialog.show"
      :account="wialonPropsDialog.account"
      @saved="onAccountSaved"
      @snack="(p: { text: string; color: 'success' | 'error' | 'info' }) => snackbar = { show: true, text: p.text, color: p.color, timeout: 4000 }"
    />

    <!-- Свойства Axenta-аккаунта -->
    <AxentaAccountEditDialog
      v-model="axentaPropsDialog.show"
      :account="axentaPropsDialog.account"
      @saved="onAccountSaved"
      @snack="(p: { text: string; color: 'success' | 'error' | 'info' }) => snackbar = { show: true, text: p.text, color: p.color, timeout: 4000 }"
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

    <!-- Диалог подтверждения удаления -->
    <DeleteAccountDialog
      v-model="deleteDialog"
      :account="accountToDelete"
      v-model:confirmation-id="deleteConfirmationId"
      v-model:reason-key="deleteReasonKey"
      :is-deleting="isDeleting"
      :wialon-reasons="wialonDeleteReasons"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <!-- Диалог перемещения учетной записи -->
    <MoveAccountDialog
      v-model="moveDialog"
      :account="accountToMove"
      :partner-options="partnerOptions"
      v-model:target-partner="selectedTargetPartner"
      v-model:confirmation-id="moveConfirmationId"
      :is-moving="isMoving"
      :loading-partners="loadingPartners"
      @confirm="confirmMove"
      @cancel="cancelMove"
    />

    <!-- FAB меню -->
    <AppleFAB icon="mdi-plus" :items="fabMenuItems" @item-click="handleFabAction" />
  </div>
</template>

<script setup lang="ts">
import AppleCard from '@/components/Apple/AppleCard.vue';
import AppleFAB from '@/components/Apple/AppleFAB.vue';
import AccountsStats from '@/components/Accounts/AccountsStats.vue';
import ViewAccountDialog from '@/components/Accounts/ViewAccountDialog.vue';
import DeleteAccountDialog from '@/components/Accounts/DeleteAccountDialog.vue';
import MoveAccountDialog from '@/components/Accounts/MoveAccountDialog.vue';
import AccountsFilters from '@/components/Accounts/AccountsFilters.vue';
import AccountsTable from '@/components/Accounts/AccountsTable.vue';
import WialonAccountEditDialog from '@/components/Accounts/WialonAccountEditDialog.vue';
import AxentaAccountEditDialog from '@/components/Accounts/AxentaAccountEditDialog.vue';
import accountsService, { type Account, type AccountsFilters as AccountsFiltersType } from '@/services/accountsService';
import settingsService from '@/services/settingsService';
import { wialonCacheService } from '@/services/wialonCacheService';
import { useAccountsExport } from '@/composables/useAccountsExport';
import { useWialonAccounts } from '@/composables/useWialonAccounts';
import { useAccountsList } from '@/composables/useAccountsList';
import { useFiltersStorage } from '@/composables/useFiltersStorage';
import { useAutoRefresh } from '@/composables/useAutoRefresh';
import { useMergedAccounts } from '@/composables/useMergedAccounts';
import { emitCrossSection } from '@/utils/crossSectionBus';
import { debounce } from 'lodash-es';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Router
const router = useRouter();
const route = useRoute();

// Реактивные данные
const searchQuery = ref('');
const showAllSearchChips = ref(false); // Показать все чипы поиска

// Автообновление

// Фильтры
const filters = ref<AccountsFiltersType & { source?: string | null }>({
  type: null,
  is_active: null,
  source: null, // Фильтр по системе: axenta, wialon, или null (все)
});

// Фильтр по родительскому аккаунту - по умолчанию "Все родители"
const selectedParent = ref<string>('');
// Список родительских аккаунтов (динамически загружается из API)
const parentAccountOptions = ref<Array<{ title: string; value: string }>>([
  { title: 'Все родители', value: '' }
]);

const {
  accounts,
  stats,
  isLoading,
  isBackgroundLoading,
  isAxentaLoading,
  lastUpdateTime,
  currentPage,
  itemsPerPage,
  totalItems,
  sortBy,
  sortOrder,
  loadAccounts,
  loadStats,
  invalidateCache,
  goToFirstPage,
  goToLastPage,
  goToPrevPage,
  goToNextPage,
} = useAccountsList({
  filters,
  searchQuery,
  selectedParent,
  isMultipleCompanySearch: () => isMultipleCompanySearch.value,
  companySearchTermsArray: () => companySearchTermsArray.value,
  getTotalPages: () => totalPages.value,
  onPageChange: () => saveFiltersToStorage(),
});

const {
  wialonAccounts,
  wialonStats,
  isWialonLoading,
  isWialonRefreshing,
  wialonLoadError,
  loadWialonAccounts,
  loadVisibleObjectsStats,
  loadParentAccounts,
} = useWialonAccounts({
  parentAccountOptions,
  getVisibleAccounts: () => accountsWithNumbers.value as any,
});

// Объединённая статистика (Axenta + Wialon)
const totalStats = computed(() => ({
  total: stats.value.total + wialonStats.value.total,
  active: stats.value.active + wialonStats.value.active,
  blocked: stats.value.blocked + wialonStats.value.blocked,
}));

// Диалоги
const viewDialog = ref(false);
const selectedAccount = ref<Account | null>(null);

// Диалог подтверждения удаления
const deleteDialog = ref(false);
const accountToDelete = ref<Account | null>(null);
const deleteConfirmationId = ref('');
const isDeleting = ref(false);
const deleteReasonKey = ref<string | null>(null); // Причина удаления для WH

// FAB Menu Items - элементы плавающего меню действий
const fabMenuItems = [
  {
    id: 'create',
    label: 'Создать аккаунт',
    icon: 'mdi-plus',
    color: 'success' as const,
    action: () => goToCreateAccount()
  },
  {
    id: 'export',
    label: 'Экспорт в Excel',
    icon: 'mdi-file-excel-outline',
    color: 'primary' as const,
    action: () => exportToExcel()
  }
];

// Обработчик клика на элементе FAB меню
const handleFabAction = (item: { id?: string; action?: () => void }) => {
  // Действие выполняется автоматически через свойство action элемента
  console.log('FAB action:', item.id);
};

// Причины удаления для Wialon Hosting
const wialonDeleteReasons = [
  { key: 'end-user_stopped_payments_or_went_out_of_business', label: 'Прекращение оплаты или закрытие бизнеса' },
  { key: 'contract_expiration', label: 'Истечение срока договора' },
  { key: 'better_terms_from_another_platform', label: 'Лучшие условия от другой платформы' },
  { key: 'better_terms_from_another_provider', label: 'Лучшие условия от другого поставщика' },
  { key: 'disagreement_on_pricing', label: 'Разногласия по ценам' },
  { key: 'poor_service', label: 'Неудовлетворительный сервис' },
  { key: 'poor_technical_support_quality', label: 'Недостаточное качество техподдержки' },
  { key: 'seasonal_units_deletion', label: 'Удаление сезонных объектов' },
  { key: 'other_reasons_partner', label: 'Другие причины' },
];

// Диалог перемещения учетной записи
const moveDialog = ref(false);
const accountToMove = ref<Account | null>(null);
const wialonPropsDialog = ref({ show: false, account: null as any });
const axentaPropsDialog = ref({ show: false, account: null as any });

const onProperties = (item: any) => {
  const src = String(item?.source || item?.sourceLabel || item?.source_label || '');
  const isWialon = src === 'wialon' || src.startsWith('WH(') || src.startsWith('WL(') || src.startsWith('wh') || src.startsWith('wl');
  if (isWialon) {
    wialonPropsDialog.value = { show: true, account: item };
  } else {
    axentaPropsDialog.value = { show: true, account: item };
  }
};

const onAccountSaved = async () => {
  await loadAccounts(true);
};
const selectedTargetPartner = ref<number | null>(null);
const moveConfirmationId = ref('');
const isMoving = ref(false);
const loadingPartners = ref(false);
const partnerOptions = ref<Account[]>([]);


// Snackbar для уведомлений
const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 30000
});

// Ключ для localStorage
const { saveFilters: saveFiltersToStorage, loadFilters: loadFiltersFromStorage, clearFilters: clearFiltersFromStorage } = useFiltersStorage({
  storageKey: 'accountsPage_filters',
  searchQuery,
  filters,
  selectedParent,
  currentPage,
  itemsPerPage,
  sortBy,
  sortOrder,
});

// Опции для фильтров
const accountTypes = [
  { title: 'Все типы', value: null },
  { title: 'Клиент', value: 'client' },
  { title: 'Партнер', value: 'partner' },
];

const statusOptions = [
  { title: 'Все статусы', value: null },
  { title: 'Активные', value: true },
  { title: 'Заблокированные', value: false },
];

// Опции для фильтра по системе
const sourceOptions = [
  { title: 'Все системы', value: null },
  { title: 'Axenta', value: 'axenta' },
  { title: 'Wialon (все)', value: 'wialon' },
  { title: 'WH (Hosting)', value: 'wh' },
  { title: 'WL (Local)', value: 'wl' },
];

// Опции для количества записей на странице
const itemsPerPageOptions = [
  { value: 5, title: '5' },
  { value: 10, title: '10' },
  { value: 25, title: '25' },
  { value: 50, title: '50' },
  { value: 75, title: '75' },
  { value: 100, title: '100' },
  { value: 150, title: '150' },
];

// Вычисляемые свойства для определения активности фильтров
const isSearchActive = computed(() => {
  return searchQuery.value && searchQuery.value.trim() !== '';
});

const isTypeFilterActive = computed(() => {
  return filters.value.type !== null;
});

const isStatusFilterActive = computed(() => {
  return filters.value.is_active !== null;
});

const isParentFilterActive = computed(() => {
  return selectedParent.value && selectedParent.value.trim() !== '';
});

const isSourceFilterActive = computed(() => {
  return filters.value.source !== null && filters.value.source !== '';
});

const hasAnyActiveFilters = computed(() => {
  return isSearchActive.value || isTypeFilterActive.value ||
    isStatusFilterActive.value || isParentFilterActive.value ||
    isSourceFilterActive.value;
});

const activeFiltersCount = computed(() => {
  let count = 0;
  if (isSearchActive.value) count++;
  if (isTypeFilterActive.value) count++;
  if (isStatusFilterActive.value) count++;
  if (isParentFilterActive.value) count++;
  if (isSourceFilterActive.value) count++;
  return count;
});

// Computed properties для множественного поиска компаний
const isMultipleCompanySearch = computed(() => {
  if (!searchQuery.value) return false;
  const searchTerms = searchQuery.value.split(',').map(term => term.trim()).filter(term => term.length > 0);
  return searchTerms.length > 1;
});

const companySearchTermsArray = computed(() => {
  if (!searchQuery.value) return [];
  return searchQuery.value.split(',').map(term => term.trim()).filter(term => term.length > 0);
});


const { accountsWithNumbers, effectiveTotalItems, totalPages, getDisplayRange } = useMergedAccounts({
  accounts,
  wialonAccounts,
  filters,
  searchQuery,
  selectedParent,
  currentPage,
  itemsPerPage,
  totalItems,
  sortBy,
  sortOrder,
});




const debouncedSearch = debounce(() => {
  currentPage.value = 1;
  // Очищаем кэш при изменении поиска
  invalidateCache();
  saveFiltersToStorage(); // Сохраняем фильтры
  loadAccounts();
}, 500);

const resetFilters = () => {
  searchQuery.value = '';
  filters.value = {
    type: null,
    is_active: null,
    source: null, // Сброс фильтра "Система"
  };
  selectedParent.value = ''; // Сброс на "Все родители"
  currentPage.value = 1;

  // Очищаем кэш при сбросе фильтров
  invalidateCache();

  // Очищаем сохраненные фильтры из localStorage
  clearFiltersFromStorage();

  loadAccounts();
};

// Обработчики изменений фильтров
const onTypeFilterChange = (value: string | null) => {
  // Очищаем кэш при изменении фильтра типа
  invalidateCache();
  // Устанавливаем значение фильтра
  filters.value.type = value as "client" | "partner" | null;
  // Сбрасываем страницу на первую при изменении фильтра
  currentPage.value = 1;
  saveFiltersToStorage(); // Сохраняем фильтры
  loadAccounts();
};

const onStatusFilterChange = (value: boolean | null) => {
  // Очищаем кэш при изменении фильтра статуса
  invalidateCache();
  // Устанавливаем значение фильтра
  filters.value.is_active = value;
  // Сбрасываем страницу на первую при изменении фильтра
  currentPage.value = 1;
  saveFiltersToStorage(); // Сохраняем фильтры
  loadAccounts();
};

const onSourceFilterChange = (value: string | null) => {
  // Очищаем кэш при изменении фильтра системы
  invalidateCache();
  // Устанавливаем значение фильтра
  filters.value.source = value;
  // Сбрасываем страницу на первую при изменении фильтра
  currentPage.value = 1;
  saveFiltersToStorage();
  loadAccounts();
};

// Метод для удаления отдельного термина поиска компании
const removeCompanySearchTerm = (index: number) => {
  const terms = companySearchTermsArray.value;
  terms.splice(index, 1);
  searchQuery.value = terms.join(', ');

  // Очищаем кэш при изменении поиска
  invalidateCache();

  // Если остался только один термин или меньше, перезагружаем
  if (terms.length <= 1) {
    currentPage.value = 1;
    loadAccounts();
  } else {
    // Для множественного поиска тоже перезагружаем
    debouncedSearch();
  }
};

const onParentChange = (parent: string) => {
  console.log('🔄 Изменение родительского аккаунта:', parent || 'Все родители');
  currentPage.value = 1;
  // Очищаем кэш при изменении родительского аккаунта
  invalidateCache();
  saveFiltersToStorage(); // Сохраняем фильтры
  loadAccounts();
};


const onItemsPerPageChange = (items: number) => {
  if (items === -1) {
    // Опция "Все" - загружаем все записи
    itemsPerPage.value = totalItems.value || 1000;
  } else {
    itemsPerPage.value = items;
  }

  currentPage.value = 1; // Всегда сбрасываем на первую страницу
  saveFiltersToStorage(); // Сохраняем фильтры
  loadAccounts();
};


const onSortChange = (sortOptions: any) => {
  if (sortOptions && sortOptions.length > 0) {
    const sortOption = sortOptions[0];
    sortBy.value = sortOption.key;
    sortOrder.value = sortOption.order;

    console.log('🔄 Server-side сортировка по всему списку:', {
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      totalRecords: totalItems.value
    });

    // Сбрасываем на первую страницу при изменении сортировки
    currentPage.value = 1;

    // Если выбрано "Все", загружаем все записи с новой сортировкой
    if (itemsPerPage.value === -1 || itemsPerPage.value >= totalItems.value) {
      console.log('📊 Загружаем все записи с новой сортировкой');
      itemsPerPage.value = totalItems.value || 1000; // Загружаем все доступные записи
    }

    saveFiltersToStorage(); // Сохраняем фильтры
    loadAccounts();
  }
};


const { start: startAutoRefresh, stop: stopAutoRefresh } = useAutoRefresh({
  delay: 60000,
  callback: () => {
    if (!isLoading.value) {
      loadAccounts(true);
      loadStats(true, true);
    }
  },
});


// Методы для меню дополнительных действий
const loginToCms = async (account: Account) => {
  try {
    console.log('🔗 Вход в CMS для аккаунта:', account.name);

    // Проверяем тип источника аккаунта
    const accountWithSource = account as Account & { source?: string; connection_id?: number };
    const isWialon = accountWithSource.source && accountWithSource.source !== 'axenta';

    if (isWialon) {
      // Для Wialon аккаунтов используем специальный API для CMS
      if (!accountWithSource.connection_id) {
        showSnackbar(`У аккаунта "${account.name}" не указан ID подключения`, 'error');
        return;
      }

      // Передаём account_id (ID пользователя) для входа под конкретным пользователем
      const result = await settingsService.loginToWialonCms(
        accountWithSource.connection_id,
        undefined, // user_name не передаём — бэкенд найдёт его по account_id
        account.id // ID для поиска пользователя
      );

      if (!result.success) {
        showSnackbar(result.message || 'Ошибка входа в CMS', 'error');
        return;
      }

      console.log('✅ Открываю CMS:', result.redirectUrl);
      window.open(result.redirectUrl, '_blank');

    } else {
      // Для Axenta аккаунтов используем стандартный метод
      if (!account.adminId) {
        showSnackbar(`У аккаунта "${account.name}" не указан ID администратора`, 'error');
        return;
      }

      const result = await accountsService.loginAs(account.adminId, 'cms');

      console.log('✅ Получен URL для входа в CMS:', result.redirectUrl);

      // Открываем новую вкладку с URL для входа
      window.open(result.redirectUrl, '_blank');
    }

  } catch (error: any) {
    console.error('❌ Ошибка входа в CMS:', error);
    const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Неизвестная ошибка';
    showSnackbar(`Ошибка входа в CMS: ${errorMessage}`, 'error');
  }
};

const loginToMonitoring = async (account: Account) => {
  try {
    console.log('📊 Вход в мониторинг для аккаунта:', account.name);
    console.log('📊 Account ID:', account.id, 'Type:', typeof account.id);

    // Проверяем тип источника аккаунта
    const accountWithSource = account as Account & { source?: string; connection_id?: number };
    const isWialon = accountWithSource.source && accountWithSource.source !== 'axenta';

    if (isWialon) {
      // Для Wialon аккаунтов используем API входа через Wialon
      if (!accountWithSource.connection_id) {
        showSnackbar(`У аккаунта "${account.name}" не указан ID подключения`, 'error');
        return;
      }

      // Передаём account_id (ID ресурса) для поиска связанного пользователя по bact
      // Бэкенд найдёт пользователя с bact == account.id и войдёт под ним
      const result = await settingsService.loginToWialonMonitoring(
        accountWithSource.connection_id,
        undefined, // user_name не передаём — бэкенд найдёт его по account_id
        account.id // ID ресурса для поиска пользователя
      );

      if (!result.success) {
        showSnackbar(`Ошибка входа в мониторинг: ${result.message}`, 'error');
        return;
      }

      console.log('✅ Получен URL для входа в мониторинг Wialon:', result.redirectUrl);
      window.open(result.redirectUrl, '_blank');
    } else {
      // Для Axenta аккаунтов используем старый метод
      if (!account.adminId) {
        showSnackbar(`У аккаунта "${account.name}" не указан ID администратора`, 'error');
        return;
      }

      const result = await accountsService.loginAs(account.adminId, 'monitoring');

      console.log('✅ Получен URL для входа в мониторинг:', result.redirectUrl);
      window.open(result.redirectUrl, '_blank');
    }

  } catch (error: any) {
    console.error('❌ Ошибка входа в мониторинг:', error);
    const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Неизвестная ошибка';
    showSnackbar(`Ошибка входа в мониторинг: ${errorMessage}`, 'error');
  }
};

const moveAccount = async (account: Account) => {
  console.log('🔄 Перемещение аккаунта:', account.name);

  accountToMove.value = account;
  selectedTargetPartner.value = null;
  moveConfirmationId.value = '';
  moveDialog.value = true;

  // Загружаем список партнеров
  await loadPartners();
};

const deleteAccount = (account: Account) => {
  console.log('🗑️ Запрос на удаление аккаунта:', account.name);

  accountToDelete.value = account;
  deleteConfirmationId.value = '';
  deleteReasonKey.value = null;
  deleteDialog.value = true;
};

// Подтверждение удаления
const confirmDelete = async () => {
  if (!accountToDelete.value) return;

  // Проверяем, что пользователь ввел правильный ID
  if (deleteConfirmationId.value !== accountToDelete.value.id.toString()) {
    showSnackbar('Неверный ID. Введите правильный ID для подтверждения удаления.', 'error');
    return;
  }

  isDeleting.value = true;

  try {
    const account = accountToDelete.value;
    const accountSource = (account.source || '').toUpperCase();
    const isWialon = accountSource.startsWith('WL') || accountSource.startsWith('WH');
    console.log(`🗑️ Удаление аккаунта ${account.id}: ${account.name} (source: ${account.source}, isWialon: ${isWialon})`);

    // Проверяем источник аккаунта - Wialon или Axenta
    if (isWialon) {
      // Для Wialon используем settingsService.deleteWialonAccount
      // connection_id хранится в поле connection_id (не connectionId)
      const connId = (account as any).connection_id;
      if (!connId) {
        throw new Error('Не указан connection_id для Wialon аккаунта');
      }

      // Передаём причину удаления для Wialon Hosting (WH)
      const reasonKey = accountSource.startsWith('WH') ? (deleteReasonKey.value || undefined) : undefined;
      const result = await settingsService.deleteWialonAccount(account.id, connId, reasonKey);

      if (!result.success) {
        throw new Error(result.message);
      }

      console.log(`✅ Wialon аккаунт ${account.name} успешно удален`);

      // Удаляем из локального wialonAccounts. loadWialonAccounts() НЕ зовём — Wialon API
      // имеет задержку propagation, refresh может вернуть только что удалённую запись и она
      // снова появится в списке. Локальное удаление + следующий natural refresh достаточно.
      const idx = wialonAccounts.value.findIndex(a => a.id === account.id);
      if (idx >= 0) wialonAccounts.value.splice(idx, 1);

      // Инвалидируем Dexie-кэш — иначе F5 покажет удалённый аккаунт из IndexedDB
      await wialonCacheService.removeAccount(account.id);
    } else {
      // Для Axenta используем стандартный метод
      await accountsService.deleteAccount(account.id);
      console.log(`✅ Axenta аккаунт ${account.name} успешно удален`);

      // Обновляем данные Axenta
      await loadAccounts();
    }

    // Показываем уведомление об успехе
    showSnackbar(
      `Аккаунт "${account.name}" успешно удален`,
      'success'
    );

    // Закрываем диалог
    deleteDialog.value = false;
    accountToDelete.value = null;
    deleteConfirmationId.value = '';
    deleteReasonKey.value = null;

    // Обновляем статистику
    await loadStats();

    // Уведомляем другие разделы (Dashboard инвалидирует кэш, перезагрузит KPI)
    emitCrossSection('accounts:mutated', { action: 'delete', id: account.id });

  } catch (error) {
    console.error('❌ Ошибка удаления аккаунта:', error);

    // Показываем уведомление об ошибке
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    const accountName = accountToDelete.value?.name || 'неизвестный аккаунт';
    showSnackbar(
      `Ошибка удаления аккаунта "${accountName}": ${errorMessage}`,
      'error'
    );
  } finally {
    isDeleting.value = false;
  }
};

// Отмена удаления
const cancelDelete = () => {
  deleteDialog.value = false;
  accountToDelete.value = null;
  deleteConfirmationId.value = '';
  deleteReasonKey.value = null;
};

// Загрузка списка партнеров для перемещения
const loadPartners = async () => {
  try {
    loadingPartners.value = true;
    console.log('📋 Загрузка списка партнеров...');

    const response = await accountsService.getAccounts({
      type: 'partner',
      per_page: 100,
      is_active: true
    });

    // Исключаем текущий аккаунт из списка
    partnerOptions.value = response.results.filter(account =>
      account.id !== accountToMove.value?.id
    );

    console.log(`✅ Загружено ${partnerOptions.value.length} партнеров`);
  } catch (error) {
    console.error('❌ Ошибка загрузки партнеров:', error);
    showSnackbar('Ошибка загрузки списка партнеров', 'error');
  } finally {
    loadingPartners.value = false;
  }
};

// Подтверждение перемещения
const confirmMove = async () => {
  if (!accountToMove.value || !selectedTargetPartner.value) return;

  try {
    isMoving.value = true;
    console.log(`🔄 Перемещение аккаунта ${accountToMove.value.id} к партнеру ${selectedTargetPartner.value}`);

    await accountsService.moveAccount(
      accountToMove.value.id,
      selectedTargetPartner.value
    );

    showSnackbar(
      `Аккаунт "${accountToMove.value.name}" успешно перемещен`,
      'success'
    );

    // Закрываем диалог
    moveDialog.value = false;
    accountToMove.value = null;
    selectedTargetPartner.value = null;
    moveConfirmationId.value = '';
    partnerOptions.value = [];

    // Обновляем данные
    await loadAccounts();

  } catch (error) {
    console.error('❌ Ошибка перемещения аккаунта:', error);
    showSnackbar('Ошибка перемещения учетной записи', 'error');
  } finally {
    isMoving.value = false;
  }
};

// Отмена перемещения
const cancelMove = () => {
  moveDialog.value = false;
  accountToMove.value = null;
  selectedTargetPartner.value = null;
  moveConfirmationId.value = '';
  partnerOptions.value = [];
};

// Переход на страницу создания учетной записи
const goToCreateAccount = () => {
  router.push('/accounts/create');
};

const showSnackbar = (text: string, color: string = 'info') => {
  snackbar.value.text = text;
  snackbar.value.color = color;
  snackbar.value.show = true;
};

const { isExporting: exporting, exportToExcel } = useAccountsExport({
  accounts: () => accounts.value,
  wialonAccounts: () => wialonAccounts.value as any,
  filters: () => filters.value,
  selectedParent: () => selectedParent.value,
  searchQuery: () => searchQuery.value,
  sortBy: () => sortBy.value,
  sortOrder: () => sortOrder.value,
  showSnackbar,
});

// Точечный refresh stats одной wialon-учётки (B+D из плана). Reactive map чтобы показывать
// loading-индикатор на кнопке и не запускать параллельный refresh для одной строки.
const refreshingIds = ref<Record<number, boolean>>({});

const refreshSingleWialonAccount = async (account: Account) => {
  const acc = account as Account & { source?: string; connection_id?: number };
  if (!acc.source || acc.source.toLowerCase() === 'axenta') return;
  if (refreshingIds.value[account.id]) return;

  const connectionId = acc.connection_id || 0;
  if (!connectionId) {
    showSnackbar(`Не найден ID подключения для "${account.name}"`, 'error');
    return;
  }

  refreshingIds.value = { ...refreshingIds.value, [account.id]: true };
  try {
    const result = await settingsService.refreshWialonAccount(connectionId, account.id);
    if (!result) {
      showSnackbar(`Не удалось обновить "${account.name}"`, 'warning');
      return;
    }
    // Обновляем строку in-place: и в локальном accounts (axenta), и в wialonAccounts
    const wAcc = wialonAccounts.value.find(a => a.id === account.id);
    if (wAcc) {
      wAcc.objectsTotal = result.objectsTotal;
      wAcc.objectsActive = result.objectsActive;
    }
    // accountsWithNumbers — computed, обновится автоматически после изменения wialonAccounts
    showSnackbar(`Обновлено: ${result.objectsActive}/${result.objectsTotal} объектов`, 'success');
  } catch (e) {
    console.error('refreshSingleWialonAccount:', e);
    showSnackbar(`Ошибка обновления "${account.name}"`, 'error');
  } finally {
    const next = { ...refreshingIds.value };
    delete next[account.id];
    refreshingIds.value = next;
  }
};

const toggleAccountStatus = async (account: Account) => {
  const newStatus = !account.isActive;
  const action = newStatus ? 'активации' : 'деактивации';

  try {
    console.log(`🔄 ${action} аккаунта:`, account.name);

    // Определяем источник аккаунта (Wialon или Axenta)
    const accountWithSource = account as Account & { source?: string; connection_id?: number };
    const isWialon = accountWithSource.source &&
      accountWithSource.source.toLowerCase() !== 'axenta' &&
      accountWithSource.source !== '';

    if (isWialon) {
      // Для Wialon аккаунтов используем Wialon API
      // ID ресурса = ID пользователя + 1 в Wialon
      const resourceId = account.id + 1;
      const connectionId = accountWithSource.connection_id || 0;

      if (connectionId === 0) {
        throw new Error('Не найден ID подключения для Wialon аккаунта');
      }

      console.log(`📡 Wialon toggle: resourceId=${resourceId}, connectionId=${connectionId}, enable=${newStatus}`);

      const result = await settingsService.toggleWialonAccountStatus(resourceId, connectionId, newStatus);

      if (!result.success) {
        throw new Error(result.message);
      }
    } else {
      // Для Axenta аккаунтов используем стандартный API
      await accountsService.toggleAccountStatus(account.id, newStatus);
    }

    // Обновляем локальное состояние
    account.isActive = newStatus;

    // Для Wialon также обновляем в массиве wialonAccounts
    if (isWialon) {
      const wialonAccount = wialonAccounts.value.find(acc => acc.id === account.id);
      if (wialonAccount) {
        wialonAccount.isActive = newStatus;
      }
    }

    // Инвалидируем in-memory cache + перезагружаем из backend.
    // Backend синхронно делает RefreshAccount → snapshot уже свежий к моменту
    // как мы получили 201. loadAccounts вернёт актуальный isActive.
    invalidateCache();
    if (!isWialon) {
      // Wialon refresh асинхронно делается ниже через refreshSingleWialonAccount
      void loadAccounts(true);
    }

    // Уведомляем Dashboard инвалидировать KPI cache (active_count изменился)
    emitCrossSection('accounts:mutated', {
      action: 'update',
      id: account.id,
      source: isWialon ? (accountWithSource.source?.toLowerCase().startsWith('wh') ? 'wialon-hosting' : 'wialon-local') : 'axenta',
    });

    console.log(`✅ Аккаунт ${account.name} ${newStatus ? 'активирован' : 'деактивирован'}`);

    // Показываем уведомление об успехе
    showSnackbar(
      `Аккаунт "${account.name}" успешно ${newStatus ? 'активирован' : 'деактивирован'}`,
      'success'
    );

    // Для Wialon: сразу подтягиваем свежий objectsTotal через точечный refresh — не ждём 15-минутный scheduler
    if (isWialon) {
      void refreshSingleWialonAccount(account);
    }

    // Обновляем данные
    await loadAccounts();

  } catch (error) {
    console.error('❌ Ошибка изменения статуса аккаунта:', error);

    // Показываем уведомление об ошибке
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    showSnackbar(
      `Ошибка ${action} аккаунта "${account.name}": ${errorMessage}`,
      'error'
    );
  }
};


















// Watcher больше не нужен, так как индивидуальная очистка фильтров отключена

// Убраны функции перетаскивания

// Lifecycle hooks
onMounted(() => {
  // Восстанавливаем фильтры из localStorage перед загрузкой данных
  loadFiltersFromStorage(); // Результат не используется — важен сам факт вызова

  // Подхватываем фильтры из URL (KPI Dashboard, глобальный поиск).
  // ?search=&type=&source=&is_active= — целевые ссылки сохраняют контекст.
  if (typeof route.query.search === 'string') {
    searchQuery.value = route.query.search;
  }
  if (typeof route.query.type === 'string' && (route.query.type === 'client' || route.query.type === 'partner')) {
    filters.value.type = route.query.type;
  }
  if (typeof route.query.source === 'string') {
    filters.value.source = route.query.source;
  }
  if (typeof route.query.is_active === 'string') {
    filters.value.is_active = route.query.is_active === 'true';
  }

  // Немедленная загрузка данных при первой загрузке страницы
  loadAccounts();
  loadWialonAccounts(); // Загружаем аккаунты Wialon
  loadStats();
  loadParentAccounts(); // Загружаем список родительских аккаунтов

  // Запускаем автоматическое обновление каждую минуту (начинается после первой загрузки)
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});

// Методы
</script>

<style scoped>
.accounts-page {
  padding: 0 24px 24px 24px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

[data-theme="dark"] .accounts-page {
  background-color: #1a1a1a;
}

[data-theme="dark"] .page-title,
[data-theme="dark"] .page-subtitle {
  color: #f5f5f7;
}

/* Заголовок в самом верху страницы */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  /* Уменьшаем отступ снизу */
  padding: 0;
  /* Убираем все отступы */
  margin-top: 0;
  /* Убираем отступ сверху */
}

.page-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;
}

.page-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  /* Уменьшаем промежуток */
}

.page-icon {
  color: var(--apple-blue);
  font-size: 24px !important;
  /* Уменьшаем размер иконки */
}

.page-title {
  font-size: 1.5rem;
  /* Уменьшаем размер шрифта */
  font-weight: 600;
  /* Уменьшаем жирность */
  margin: 0;
  color: var(--apple-text-primary);
  line-height: 1.2;
  /* Уменьшаем межстрочный интервал */
}

.page-subtitle {
  font-size: 0.85rem;
  /* Уменьшаем размер шрифта */
  color: var(--apple-text-secondary);
  margin: 2px 0 0 0;
  /* Уменьшаем отступ сверху */
  line-height: 1.2;
  /* Уменьшаем межстрочный интервал */
}


/* Статистика в стиле /users */
/* Фильтры в стиле /users */
/* Таблица в стиле /users */
/* Темная тема для диалогов */
[data-theme="dark"] .v-dialog .v-card {
  background-color: #2c2c2e !important;
  border: 1px solid #3a3a3c !important;
}

[data-theme="dark"] .v-dialog .v-card-title {
  color: #ffffff !important;
  border-bottom-color: #3a3a3c !important;
}

[data-theme="dark"] .v-dialog .v-card-text {
  color: #ffffff !important;
}

[data-theme="dark"] .v-dialog .v-text-field :deep(.v-field) {
  background-color: #1a1a1a !important;
  border-color: #3a3a3c !important;
  color: #ffffff !important;
}

[data-theme="dark"] .v-dialog .v-text-field :deep(.v-field__input) {
  color: #ffffff !important;
}

[data-theme="dark"] .v-dialog .v-text-field :deep(.v-label) {
  color: #8e8e93 !important;
}

[data-theme="dark"] .v-dialog .v-textarea :deep(.v-field) {
  background-color: #1a1a1a !important;
  border-color: #3a3a3c !important;
  color: #ffffff !important;
}

[data-theme="dark"] .v-dialog .v-textarea :deep(.v-field__input) {
  color: #ffffff !important;
}

[data-theme="dark"] .v-dialog .v-textarea :deep(.v-label) {
  color: #8e8e93 !important;
}

/* Темная тема для snackbar */
[data-theme="dark"] .v-snackbar {
  background-color: #2c2c2e !important;
  color: #ffffff !important;
  border: 1px solid #3a3a3c !important;
}

/* Темная тема для tooltip */
[data-theme="dark"] .v-tooltip :deep(.v-overlay__content) {
  background-color: #2c2c2e !important;
  color: #ffffff !important;
  border: 1px solid #3a3a3c !important;
}

/* Темная тема для select dropdown */
[data-theme="dark"] .v-select :deep(.v-list) {
  background-color: #2c2c2e !important;
  border: 1px solid #3a3a3c !important;
}

[data-theme="dark"] .v-select :deep(.v-list-item) {
  color: #ffffff !important;
}

[data-theme="dark"] .v-select :deep(.v-list-item:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

/* Темная тема для badge */
[data-theme="dark"] .v-badge :deep(.v-badge__badge) {
  background-color: #ff453a !important;
  color: #ffffff !important;
}


/* Унификация размеров кнопок и иконок */
.d-flex.justify-end.align-start.gap-3 .v-btn {
  min-width: 40px !important;
  width: 40px !important;
  height: 40px !important;
}




@media (max-width: 768px) {
  .accounts-page {
    padding: 0 16px 16px 16px;
    /* Убираем верхний отступ на мобильных */
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-title {
    font-size: 1.25rem;
    /* Еще меньше на мобильных */
    line-height: 1.1;
  }

  .page-subtitle {
    font-size: 0.8rem;
    /* Еще меньше на мобильных */
    line-height: 1.1;
  }

  .page-header {
    margin-bottom: 12px;
    /* Еще меньше отступ на мобильных */
    padding: 0;
    /* Убираем все отступы на мобильных */
    margin-top: 0;
    /* Убираем отступ сверху на мобильных */
  }
}
</style>
