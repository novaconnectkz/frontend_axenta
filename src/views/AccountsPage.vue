<template>
  <div class="accounts-page">
    <!-- Заголовок страницы -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <i class="mdi mdi-account-group"></i>
          Учетные записи
        </h1>
        <div class="header-actions">
          <v-chip
            :color="isAutoRefreshEnabled ? 'success' : 'default'"
            variant="outlined"
            size="small"
            @click="toggleAutoRefresh"
          >
            <i class="mdi mdi-refresh" :class="{ 'rotating': isLoading || isBackgroundLoading }"></i>
            Автообновление: {{ isAutoRefreshEnabled ? 'ВКЛ' : 'ВЫКЛ' }}
          </v-chip>
          <v-chip
            v-if="lastUpdateTime"
            :color="isBackgroundLoading ? 'warning' : 'info'"
            variant="outlined"
            size="small"
          >
            <i class="mdi mdi-clock-outline" :class="{ 'rotating': isBackgroundLoading }"></i>
            {{ formatTime(lastUpdateTime) }}
            <span v-if="isBackgroundLoading" class="ml-1">обновляется...</span>
          </v-chip>
        </div>
      </div>
    </div>


    <!-- Статистика -->
    <div class="stats-section">
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-card">
            <v-card-text>
              <div class="stat-content">
                <div class="stat-icon total">
                  <i class="mdi mdi-account-group"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.total }}</div>
                  <div class="stat-label">Доступных записей</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-card">
            <v-card-text>
              <div class="stat-content">
                <div class="stat-icon active">
                  <i class="mdi mdi-account-check"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.active }}</div>
                  <div class="stat-label">Активных</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-card">
            <v-card-text>
              <div class="stat-content">
                <div class="stat-icon clients">
                  <i class="mdi mdi-account"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.clients }}</div>
                  <div class="stat-label">Клиентов</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-card">
            <v-card-text>
              <div class="stat-content">
                <div class="stat-icon partners">
                  <i class="mdi mdi-handshake"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.partners }}</div>
                  <div class="stat-label">Партнеров</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Фильтры и поиск -->
    <v-card class="filters-card">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              label="Поиск по названию"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              @input="debouncedSearch"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.type"
              label="Тип аккаунта"
              :items="accountTypes"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="() => loadAccounts()"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.is_active"
              label="Статус"
              :items="statusOptions"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="() => loadAccounts()"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedParent"
              label="Родительский аккаунт"
              :items="parentAccountOptions"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="onParentChange"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-btn
              color="primary"
              variant="outlined"
              @click="resetFilters"
              block
            >
              <i class="mdi mdi-filter-remove"></i>
              Сбросить
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Таблица учетных записей -->
    <v-card class="accounts-table-card">
      <v-card-title class="table-header">
        <span>Список учетных записей</span>
        <v-spacer />
        <!-- Кнопка для загрузки всех записей с сортировкой -->
        <v-btn
          color="info"
          variant="outlined"
          size="small"
          @click="loadAllWithSort"
          class="mr-2"
        >
          <i class="mdi mdi-sort"></i>
          Сортировать все
        </v-btn>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="accounts"
        :loading="isLoading"
        :items-per-page="-1"
        :sort-by="[{ key: sortBy, order: sortOrder }]"
        @update:sort-by="onSortChange"
        :must-sort="false"
        :multi-sort="false"
        class="accounts-table"
        :class="{ 'updating': isBackgroundLoading }"
        loading-text="Загрузка учетных записей..."
        no-data-text="Учетные записи не найдены"
        hide-default-footer
      >
        <!-- Колонка "Компания" -->
        <template #item.name="{ item }">
          <v-tooltip location="top">
            <template #activator="{ props }">
              <div class="company-name-compact" v-bind="props">
                {{ item.name }}
              </div>
            </template>
            <div class="company-legend">
              <div class="legend-title">🏢 Информация о компании</div>
              <div class="legend-item">
                <span class="legend-color company-status"></span>
                <span class="legend-text">{{ item.name }}</span>
              </div>
              <div class="legend-item">
                <span class="legend-color hierarchy-status"></span>
                <span class="legend-text">{{ item.hierarchy }}</span>
              </div>
              <div v-if="item.parentAccountName" class="legend-item">
                <span class="legend-color parent-status"></span>
                <span class="legend-text">Родитель: {{ item.parentAccountName }}</span>
              </div>
              <div class="legend-description">
                📊 ID: {{ item.id }} | Создан: {{ formatDateShort(item.creationDatetime) }}
              </div>
            </div>
          </v-tooltip>
        </template>

        <!-- Колонка "Тип" -->
        <template #item.type="{ item }">
          <v-tooltip location="top">
            <template #activator="{ props }">
              <span 
                class="type-minimal" 
                :class="{ 'type-partner': item.type === 'partner', 'type-client': item.type === 'client' }"
                v-bind="props"
              >
                {{ item.type === 'partner' ? 'Партнер' : 'Клиент' }}
              </span>
            </template>
            <div class="type-legend">
              <div class="legend-title">🏢 Тип аккаунта</div>
              <div class="legend-item">
                <span :class="['legend-color', item.type === 'partner' ? 'type-status-partner' : 'type-status-client']"></span>
                <span class="legend-text">
                  {{ item.type === 'partner' ? 'Партнер' : 'Клиент' }} - {{ item.name }}
                </span>
              </div>
              <div class="legend-description">
                {{ item.type === 'partner' 
                  ? '🤝 Партнерский аккаунт с расширенными правами и возможностями' 
                  : '👤 Клиентский аккаунт с базовым набором функций' 
                }}
              </div>
            </div>
          </v-tooltip>
        </template>

        <!-- Колонка "Администратор" -->
        <template #item.adminFullname="{ item }">
          <v-tooltip location="top">
            <template #activator="{ props }">
              <span 
                class="admin-minimal" 
                :class="{ 'admin-active': item.adminIsActive, 'admin-inactive': !item.adminIsActive }"
                v-bind="props"
              >
                {{ item.adminFullname }}
              </span>
            </template>
            <div class="admin-legend">
              <div class="legend-title">👤 Статус администратора</div>
              <div class="legend-item">
                <span :class="['legend-color', item.adminIsActive ? 'admin-status-active' : 'admin-status-inactive']"></span>
                <span class="legend-text">
                  {{ item.adminIsActive ? 'Активен' : 'Неактивен' }} - {{ item.adminFullname }}
                </span>
              </div>
              <div class="legend-description">
                {{ item.adminIsActive 
                  ? '✅ Администратор имеет доступ к системе и может управлять аккаунтом' 
                  : '❌ Администратор заблокирован или отключен от системы' 
                }}
              </div>
            </div>
          </v-tooltip>
        </template>

        <!-- Колонка "Объекты" -->
        <template #item.objects="{ item }">
          <v-tooltip location="top">
            <template #activator="{ props }">
              <div class="objects-compact" v-bind="props">
                <span class="objects-active">{{ item.objectsActive }}</span>
                <span class="objects-separator">/</span>
                <span class="objects-total">{{ item.objectsTotal }}</span>
                <span v-if="item.objectsDeleted > 0" class="objects-deleted">
                  <span class="objects-separator">/</span>
                  <span class="deleted-count">{{ item.objectsDeleted }}</span>
                </span>
              </div>
            </template>
            <div class="objects-legend">
              <div class="legend-title">📊 Статистика объектов</div>
              <div class="legend-item">
                <span class="legend-color active"></span>
                <span class="legend-text">{{ item.objectsActive }} - Активные объекты</span>
              </div>
              <div class="legend-item">
                <span class="legend-color total"></span>
                <span class="legend-text">{{ item.objectsTotal }} - Всего объектов</span>
              </div>
              <div v-if="item.objectsDeleted > 0" class="legend-item">
                <span class="legend-color deleted"></span>
                <span class="legend-text">{{ item.objectsDeleted }} - Удаленные объекты</span>
              </div>
              <div class="legend-formula">
                Формула: <code>{{ item.objectsActive }}/{{ item.objectsTotal }}{{ item.objectsDeleted > 0 ? `/${item.objectsDeleted}` : '' }}</code>
              </div>
            </div>
          </v-tooltip>
        </template>

        <!-- Колонка "Статус" -->
        <template #item.isActive="{ item }">
          <v-tooltip location="top">
            <template #activator="{ props }">
              <span 
                class="status-minimal" 
                :class="{ 'status-active': item.isActive, 'status-inactive': !item.isActive }"
                v-bind="props"
              >
                {{ item.isActive ? 'Активен' : 'Заблокирован' }}
              </span>
            </template>
            <div class="status-legend">
              <div class="legend-title">⚡ Статус аккаунта</div>
              <div class="legend-item">
                <span :class="['legend-color', item.isActive ? 'account-status-active' : 'account-status-inactive']"></span>
                <span class="legend-text">
                  {{ item.isActive ? 'Активен' : 'Заблокирован' }} - {{ item.name }}
                </span>
              </div>
              <div class="legend-description">
                {{ item.isActive 
                  ? '✅ Аккаунт функционирует нормально и доступен для использования' 
                  : '❌ Аккаунт заблокирован и недоступен для использования' 
                }}
              </div>
              <div v-if="!item.isActive && item.blockingDatetime" class="legend-extra">
                🕒 Дата блокировки: {{ formatDate(item.blockingDatetime) }}
              </div>
            </div>
          </v-tooltip>
        </template>

        <!-- Колонка "Блокировка" -->
        <template #item.blockingInfo="{ item }">
          <v-tooltip v-if="item.blockingDatetime" location="top">
            <template #activator="{ props }">
              <span 
                class="blocking-minimal" 
                :class="{ 
                  'blocking-critical': item.daysBeforeBlocking !== null && item.daysBeforeBlocking <= 3,
                  'blocking-warning': item.daysBeforeBlocking !== null && item.daysBeforeBlocking > 3 && item.daysBeforeBlocking <= 7,
                  'blocking-normal': item.daysBeforeBlocking !== null && item.daysBeforeBlocking > 7
                }"
                v-bind="props"
              >
                {{ formatDateShort(item.blockingDatetime) }}
              </span>
            </template>
            <div class="blocking-legend">
              <div class="legend-title">🕒 Информация о блокировке</div>
              <div class="legend-item">
                <span :class="['legend-color', getBlockingLegendClass(item.daysBeforeBlocking)]"></span>
                <span class="legend-text">
                  Блокировка: {{ formatDate(item.blockingDatetime) }}
                </span>
              </div>
              <div v-if="item.daysBeforeBlocking !== null" class="legend-item">
                <span class="legend-color days-indicator"></span>
                <span class="legend-text">
                  Осталось: {{ item.daysBeforeBlocking }} {{ getDaysWord(item.daysBeforeBlocking) }}
                </span>
              </div>
              <div class="legend-description">
                {{ getBlockingDescription(item.daysBeforeBlocking) }}
              </div>
            </div>
          </v-tooltip>
          <div v-else class="blocking-unlimited">
            <v-tooltip location="top">
              <template #activator="{ props }">
                <span class="blocking-minimal blocking-none" v-bind="props">
                  Без ограничений
                </span>
              </template>
              <div class="blocking-legend">
                <div class="legend-title">♾️ Без ограничений</div>
                <div class="legend-description">
                  ✅ Аккаунт не имеет даты блокировки и может использоваться неограниченно
                </div>
              </div>
            </v-tooltip>
          </div>
        </template>

        <!-- Колонка "Дата создания" -->
        <template #item.creationDatetime="{ item }">
          <v-tooltip location="top">
            <template #activator="{ props }">
              <span class="creation-minimal" v-bind="props">
                {{ formatDateShort(item.creationDatetime) }}
              </span>
            </template>
            <div class="creation-legend">
              <div class="legend-title">📅 Дата создания</div>
              <div class="legend-item">
                <span class="legend-color creation-status"></span>
                <span class="legend-text">
                  Создан: {{ formatDate(item.creationDatetime) }}
                </span>
              </div>
              <div class="legend-description">
                ✅ Аккаунт был создан {{ getCreationAge(item.creationDatetime) }} назад
              </div>
            </div>
          </v-tooltip>
        </template>

        <!-- Колонка "Действия" -->
        <template #item.actions="{ item }">
          <div class="actions-row">
            <v-btn
              icon="mdi-eye"
              variant="text"
              size="x-small"
              @click="viewAccount(item)"
              title="Просмотр"
            />
            <v-btn
              icon="mdi-pencil"
              variant="text"
              size="x-small"
              @click="editAccount(item)"
              title="Редактировать"
            />
            <v-btn
              :icon="item.isActive ? 'mdi-pause' : 'mdi-play'"
              variant="text"
              size="x-small"
              :color="item.isActive ? 'warning' : 'success'"
              @click="toggleAccountStatus(item)"
              :title="item.isActive ? 'Деактивировать' : 'Активировать'"
            />
          </div>
        </template>
      </v-data-table>

      <!-- Компактная пагинация справа -->
      <div class="compact-pagination">
        <v-select
          v-model="itemsPerPage"
          :items="itemsPerPageOptions"
          variant="outlined"
          density="compact"
          class="items-select"
          @update:model-value="onItemsPerPageChange"
          hide-details
        />
        <span class="range-info">{{ getDisplayRange() }} из {{ totalItems }}</span>
        <div class="nav-controls">
          <v-btn
            icon="mdi-page-first"
            variant="text"
            size="x-small"
            :disabled="currentPage === 1"
            @click="goToFirstPage"
            title="Первая"
          />
          <v-btn
            icon="mdi-chevron-left"
            variant="text"
            size="x-small"
            :disabled="currentPage === 1"
            @click="goToPrevPage"
            title="Предыдущая"
          />
          <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
          <v-btn
            icon="mdi-chevron-right"
            variant="text"
            size="x-small"
            :disabled="currentPage === totalPages"
            @click="goToNextPage"
            title="Следующая"
          />
          <v-btn
            icon="mdi-page-last"
            variant="text"
            size="x-small"
            :disabled="currentPage === totalPages"
            @click="goToLastPage"
            title="Последняя"
          />
        </div>
      </div>
    </v-card>

    <!-- Диалог просмотра аккаунта -->
    <v-dialog v-model="viewDialog" max-width="800">
      <v-card v-if="selectedAccount">
        <v-card-title>
          <span class="text-h5">Информация об аккаунте</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="viewDialog = false" />
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                label="ID"
                :model-value="selectedAccount.id"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                label="Название"
                :model-value="selectedAccount.name"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                label="Иерархия"
                :model-value="selectedAccount.hierarchy"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                label="Родительский аккаунт"
                :model-value="selectedAccount.parentAccountName"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                label="Администратор"
                :model-value="selectedAccount.adminFullname"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                label="Комментарий"
                :model-value="selectedAccount.comment || 'Нет комментария'"
                readonly
                variant="outlined"
                rows="3"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { debounce } from 'lodash-es';
import accountsService, { type Account, type AccountsFilters } from '@/services/accountsService';

// Реактивные данные
const accounts = ref<Account[]>([]);
const isLoading = ref(false);
const isBackgroundLoading = ref(false); // Для фонового обновления
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(50);
const totalItems = ref(332); // Принудительно устанавливаем известное значение
const lastUpdateTime = ref<Date | null>(null);

// Параметры сортировки
const sortBy = ref<string>('name');
const sortOrder = ref<'asc' | 'desc'>('asc');

// Автообновление
const isAutoRefreshEnabled = ref(true);
const autoRefreshInterval = ref<NodeJS.Timeout | null>(null);
const AUTO_REFRESH_DELAY = 10000; // 10 секунд

// Статистика
const stats = ref({
  total: 0,
  active: 0,
  blocked: 0,
  clients: 0,
  partners: 0,
});

// Фильтры
const filters = ref<AccountsFilters>({
  type: undefined,
  is_active: undefined,
});

// Фильтр по родительскому аккаунту
const selectedParent = ref<string>('GLOMOS'); // По умолчанию текущий партнер
const parentAccountOptions = ref([
  { title: 'Все родители', value: '' },
  { title: 'GLOMOS', value: 'GLOMOS' },
  { title: 'Южаков Константин Николаевич ИП', value: 'Южаков Константин Николаевич ИП' },
  { title: 'ТРАНСНАВИ ООО', value: 'ТРАНСНАВИ ООО' },
  { title: 'Италон ООО', value: 'Италон ООО' },
  { title: 'Телетранс Запад ООО', value: 'Телетранс Запад ООО' },
  { title: 'Емельянов Роман Юрьевич ИП', value: 'Емельянов Роман Юрьевич ИП' },
]);

// Диалоги
const viewDialog = ref(false);
const selectedAccount = ref<Account | null>(null);

// Опции для фильтров
const accountTypes = [
  { title: 'Клиент', value: 'client' },
  { title: 'Партнер', value: 'partner' },
];

const statusOptions = [
  { title: 'Активные', value: true },
  { title: 'Заблокированные', value: false },
];

// Опции для количества записей на странице
const itemsPerPageOptions = [
  { value: 10, title: '10' },
  { value: 25, title: '25' },
  { value: 50, title: '50' },
  { value: 100, title: '100' },
  { value: 200, title: '200' },
  { value: 500, title: '500' },
  { value: 1000, title: '1000' },
  { value: -1, title: 'Все' }, // -1 означает все записи
];

// Заголовки таблицы
const headers = [
  { title: 'Компания', key: 'name', sortable: true, width: '28%' },
  { title: 'Тип', key: 'type', sortable: true, width: '10%' },
  { title: 'Администратор', key: 'adminFullname', sortable: true, width: '18%' },
  { title: 'Объекты', key: 'objectsActive', sortable: true, width: '10%' },
  { title: 'Статус', key: 'isActive', sortable: true, width: '10%' },
  { title: 'Блокировка', key: 'blockingDatetime', sortable: true, width: '14%' },
  { title: 'Создан', key: 'creationDatetime', sortable: true, width: '10%' },
  { title: 'Действия', key: 'actions', sortable: false, width: '10%' },
];

// Вычисляемые свойства для кастомной пагинации
const totalPages = computed(() => {
  if (itemsPerPage.value === -1 || itemsPerPage.value >= totalItems.value) {
    return 1; // Все на одной странице
  }
  return Math.ceil(totalItems.value / itemsPerPage.value);
});

const getDisplayRange = () => {
  if (totalItems.value === 0) return '0-0';
  
  if (itemsPerPage.value === -1 || itemsPerPage.value >= totalItems.value) {
    return `1-${totalItems.value}`;
  }
  
  const start = (currentPage.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(currentPage.value * itemsPerPage.value, totalItems.value);
  return `${start}-${end}`;
};

// Методы
const loadAccounts = async (isBackground = false) => {
  try {
    // Для фонового обновления используем отдельный индикатор
    if (isBackground) {
      isBackgroundLoading.value = true;
    } else {
      isLoading.value = true;
    }
    
    // Формируем поисковый запрос с учетом родителя
    let searchParam = searchQuery.value || '';
    if (selectedParent.value && selectedParent.value !== '') {
      // Добавляем фильтр по родительскому аккаунту в поиск
      const parentFilter = selectedParent.value;
      searchParam = searchParam ? `${searchParam} ${parentFilter}` : parentFilter;
    }

    const requestParams = {
      ...filters.value,
      page: currentPage.value,
      per_page: itemsPerPage.value,
      search: searchParam || undefined,
      ordering: sortOrder.value === 'desc' ? `-${sortBy.value}` : sortBy.value,
    };

    const response = await accountsService.getAccounts(requestParams);


    // Обновляем totalItems только если получили валидное значение
    if (response.count && response.count > 0) {
      totalItems.value = response.count;
    }
    
    // Плавное обновление данных
    if (isBackground && accounts.value.length > 0) {
      // Сравниваем данные и обновляем только если есть изменения
      const hasChanges = !areAccountsEqual(accounts.value, response.results);
      if (hasChanges) {
        // Плавная анимация обновления
        await updateAccountsSmooth(response.results);
      }
    } else {
      // Первоначальная загрузка или принудительное обновление
      accounts.value = response.results;
    }
    lastUpdateTime.value = new Date();

  } catch (error) {
    console.error('❌ Ошибка загрузки учетных записей:', error);
  } finally {
    if (isBackground) {
      isBackgroundLoading.value = false;
    } else {
      isLoading.value = false;
    }
  }
};

// Функция для сравнения массивов аккаунтов
const areAccountsEqual = (oldAccounts: Account[], newAccounts: Account[]): boolean => {
  if (oldAccounts.length !== newAccounts.length) return false;
  
  for (let i = 0; i < oldAccounts.length; i++) {
    const oldAcc = oldAccounts[i];
    const newAcc = newAccounts[i];
    
    // Сравниваем ключевые поля, которые могут измениться
    if (
      oldAcc.id !== newAcc.id ||
      oldAcc.name !== newAcc.name ||
      oldAcc.isActive !== newAcc.isActive ||
      oldAcc.objectsActive !== newAcc.objectsActive ||
      oldAcc.objectsTotal !== newAcc.objectsTotal ||
      oldAcc.blockingDatetime !== newAcc.blockingDatetime ||
      oldAcc.daysBeforeBlocking !== newAcc.daysBeforeBlocking
    ) {
      return false;
    }
  }
  
  return true;
};

// Функция для плавного обновления данных
const updateAccountsSmooth = async (newAccounts: Account[]): Promise<void> => {
  return new Promise((resolve) => {
    // Добавляем небольшую задержку для плавности
    setTimeout(() => {
      accounts.value = newAccounts;
      resolve();
    }, 50);
  });
};

const loadStats = async (isBackground = false) => {
  try {
    const statsData = await accountsService.getAccountsStats();
    
    // Плавное обновление статистики только если есть изменения
    if (isBackground) {
      const hasStatsChanged = (
        stats.value.total !== statsData.total ||
        stats.value.active !== statsData.active ||
        stats.value.clients !== statsData.clients ||
        stats.value.partners !== statsData.partners
      );
      
      if (hasStatsChanged) {
        // Анимированное обновление статистики
        await updateStatsSmooth(statsData);
      }
    } else {
      stats.value = statsData;
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки статистики:', error);
  }
};

// Загрузка списка родительских аккаунтов
const loadParentAccounts = async () => {
  try {
    // Получаем все записи для извлечения уникальных родителей
    const response = await accountsService.getAccounts({
      page: 1,
      per_page: 332, // Загружаем все для получения полного списка родителей
    });
    
    // Извлекаем уникальных родителей
    const uniqueParents = [...new Set(response.results.map(account => account.parentAccountName))];
    
    // Обновляем опции без дублирования
    const filteredParents = uniqueParents.filter(parent => parent !== 'GLOMOS');
    
    parentAccountOptions.value = [
      { title: 'Все родители', value: '' },
      { title: 'GLOMOS', value: 'GLOMOS' },
      ...filteredParents.map(parent => ({
        title: parent,
        value: parent
      }))
    ];
    
    console.log('✅ Загружены родительские аккаунты:', uniqueParents.length);
  } catch (error) {
    console.error('❌ Ошибка загрузки родительских аккаунтов:', error);
  }
};

// Функция для плавного обновления статистики
const updateStatsSmooth = async (newStats: typeof stats.value): Promise<void> => {
  return new Promise((resolve) => {
    // Анимируем изменение чисел
    const duration = 500; // 500ms
    const startTime = Date.now();
    const startStats = { ...stats.value };
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Интерполяция значений
      stats.value = {
        total: Math.round(startStats.total + (newStats.total - startStats.total) * progress),
        active: Math.round(startStats.active + (newStats.active - startStats.active) * progress),
        blocked: Math.round(startStats.blocked + (newStats.blocked - startStats.blocked) * progress),
        clients: Math.round(startStats.clients + (newStats.clients - startStats.clients) * progress),
        partners: Math.round(startStats.partners + (newStats.partners - startStats.partners) * progress),
      };
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    };
    
    requestAnimationFrame(animate);
  });
};

const debouncedSearch = debounce(() => {
  currentPage.value = 1;
  loadAccounts();
}, 500);

const resetFilters = () => {
  searchQuery.value = '';
  filters.value = {
    type: undefined,
    is_active: undefined,
  };
  selectedParent.value = 'GLOMOS'; // Сброс на GLOMOS
  currentPage.value = 1;
  loadAccounts();
};

const onParentChange = (parent: string) => {
  console.log('🔄 Изменение родительского аккаунта:', parent);
  currentPage.value = 1;
  loadAccounts();
};

const onPageChange = (page: number) => {
  currentPage.value = page;
  loadAccounts();
};

const onItemsPerPageChange = (items: number) => {
  if (items === -1) {
    // Опция "Все" - загружаем все записи
    itemsPerPage.value = totalItems.value || 332;
  } else {
    itemsPerPage.value = items;
  }
  
  currentPage.value = 1; // Всегда сбрасываем на первую страницу
  loadAccounts();
};

const onOptionsUpdate = (options: any) => {
  // Обновляем параметры пагинации
  if (options.page !== currentPage.value) {
    currentPage.value = options.page;
  }
  
  if (options.itemsPerPage !== itemsPerPage.value) {
    if (options.itemsPerPage === -1) {
      // Опция "Все"
      itemsPerPage.value = totalItems.value || 332;
    } else {
      itemsPerPage.value = options.itemsPerPage;
    }
    currentPage.value = 1; // Сбрасываем на первую страницу при изменении количества
  }
  
  // Загружаем данные с новыми параметрами
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
    if (itemsPerPage.value === totalItems.value || itemsPerPage.value >= 332) {
      console.log('📊 Загружаем все 332 записи с новой сортировкой');
      itemsPerPage.value = 332; // Принудительно загружаем все
    }
    
    loadAccounts();
  }
};

const toggleAutoRefresh = () => {
  isAutoRefreshEnabled.value = !isAutoRefreshEnabled.value;
  
  if (isAutoRefreshEnabled.value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
};

const startAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value);
  }
  
  autoRefreshInterval.value = setInterval(() => {
    // Используем фоновое обновление только если не идет основная загрузка
    if (!isLoading.value) {
      loadAccounts(true); // true = фоновое обновление
      loadStats(true); // true = фоновое обновление статистики
    }
  }, AUTO_REFRESH_DELAY);
};

const stopAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value);
    autoRefreshInterval.value = null;
  }
};

const viewAccount = (account: Account) => {
  selectedAccount.value = account;
  viewDialog.value = true;
};

const editAccount = (account: Account) => {
  // TODO: Реализовать редактирование
  console.log('Редактирование аккаунта:', account);
};

const toggleAccountStatus = async (account: Account) => {
  try {
    const newStatus = !account.isActive;
    const action = newStatus ? 'активации' : 'деактивации';
    
    console.log(`🔄 ${action} аккаунта:`, account.name);
    
    // TODO: Реализовать API вызов для изменения статуса
    // await accountsService.toggleAccountStatus(account.id, newStatus);
    
    // Временно обновляем локально для демонстрации
    account.isActive = newStatus;
    
    console.log(`✅ Аккаунт ${account.name} ${newStatus ? 'активирован' : 'деактивирован'}`);
    
    // Обновляем данные
    await loadAccounts();
    
  } catch (error) {
    console.error('❌ Ошибка изменения статуса аккаунта:', error);
  }
};

const loadAllWithSort = async () => {
  console.log('🔄 Загрузка всех записей с server-side сортировкой...');
  
  // Устанавливаем параметры для загрузки всех записей
  itemsPerPage.value = 332;
  currentPage.value = 1;
  
  console.log('📊 Параметры сортировки:', {
    sortBy: sortBy.value,
    sortOrder: sortOrder.value,
    ordering: sortOrder.value === 'desc' ? `-${sortBy.value}` : sortBy.value
  });
  
  // Загружаем все записи с сортировкой
  await loadAccounts();
  
  console.log('✅ Все записи загружены и отсортированы на сервере');
};

// Функции для быстрого перехода
const goToFirstPage = () => {
  currentPage.value = 1;
  loadAccounts();
};

const goToLastPage = () => {
  currentPage.value = totalPages.value;
  loadAccounts();
};

const goToPrevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value = currentPage.value - 1;
    loadAccounts();
  }
};

const goToNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value = currentPage.value + 1;
    loadAccounts();
  }
};



// Утилиты форматирования
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateShort = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const getBlockingColor = (days: number) => {
  if (days <= 3) return 'error';
  if (days <= 7) return 'warning';
  if (days <= 30) return 'info';
  return 'success';
};

const getBlockingLegendClass = (days: number | null) => {
  if (days === null) return 'blocking-status-none';
  if (days <= 3) return 'blocking-status-critical';
  if (days <= 7) return 'blocking-status-warning';
  return 'blocking-status-normal';
};

const getDaysWord = (days: number) => {
  const lastDigit = days % 10;
  const lastTwoDigits = days % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'дней';
  if (lastDigit === 1) return 'день';
  if (lastDigit >= 2 && lastDigit <= 4) return 'дня';
  return 'дней';
};

const getBlockingDescription = (days: number | null) => {
  if (days === null) return '✅ Аккаунт не имеет ограничений по времени';
  if (days <= 3) return '🚨 Критично! Аккаунт будет заблокирован в ближайшие дни';
  if (days <= 7) return '⚠️ Внимание! Аккаунт скоро будет заблокирован';
  if (days <= 30) return '📅 Аккаунт будет заблокирован в течение месяца';
  return '✅ До блокировки еще много времени';
};

const getCreationAge = (dateString: string) => {
  const creationDate = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - creationDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 день';
  if (diffDays < 7) return `${diffDays} ${getDaysWord(diffDays)}`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 неделю' : `${weeks} ${getWeeksWord(weeks)}`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 месяц' : `${months} ${getMonthsWord(months)}`;
  }
  const years = Math.floor(diffDays / 365);
  return years === 1 ? '1 год' : `${years} ${getYearsWord(years)}`;
};

const getWeeksWord = (weeks: number) => {
  const lastDigit = weeks % 10;
  const lastTwoDigits = weeks % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'недель';
  if (lastDigit === 1) return 'неделю';
  if (lastDigit >= 2 && lastDigit <= 4) return 'недели';
  return 'недель';
};

const getMonthsWord = (months: number) => {
  const lastDigit = months % 10;
  const lastTwoDigits = months % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'месяцев';
  if (lastDigit === 1) return 'месяц';
  if (lastDigit >= 2 && lastDigit <= 4) return 'месяца';
  return 'месяцев';
};

const getYearsWord = (years: number) => {
  const lastDigit = years % 10;
  const lastTwoDigits = years % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'лет';
  if (lastDigit === 1) return 'год';
  if (lastDigit >= 2 && lastDigit <= 4) return 'года';
  return 'лет';
};

// Lifecycle hooks
onMounted(() => {
  loadAccounts();
  loadStats();
  loadParentAccounts(); // Загружаем список родительских аккаунтов
  
  if (isAutoRefreshEnabled.value) {
    startAutoRefresh();
  }
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style scoped>
.accounts-page {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 2rem;
  font-weight: 600;
  color: #1976d2;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.stats-section {
  margin-bottom: 24px;
}

.stat-card {
  height: 100%;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #1976d2, #1565c0);
}

.stat-icon.active {
  background: linear-gradient(135deg, #388e3c, #2e7d32);
}

.stat-icon.clients {
  background: linear-gradient(135deg, #f57c00, #ef6c00);
}

.stat-icon.partners {
  background: linear-gradient(135deg, #7b1fa2, #6a1b9a);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1976d2;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
}

.filters-card {
  margin-bottom: 24px;
}

.accounts-table-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.custom-pagination-bottom {
  border-top: 1px solid #e0e0e0;
  background-color: #fafafa;
}

/* Максимально компактная пагинация */
.compact-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 16px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.items-select {
  min-width: 50px !important; /* Принудительная минимальная ширина */
  width: fit-content !important; /* Ширина по содержимому */
  max-width: 120px !important; /* Максимальная ширина */
  flex-shrink: 0;
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
  font-size: 0.8rem;
  color: #666;
  flex-shrink: 0;
  min-width: 100px;
  text-align: center;
  font-weight: 500;
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.page-info {
  font-size: 0.8rem;
  color: #666;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
  padding: 0 8px;
}

/* Компактные кнопки навигации */
.nav-controls .v-btn {
  min-width: 28px !important;
  width: 28px;
  height: 28px;
}

.accounts-table {
  transition: opacity 0.3s ease-in-out;
}

.accounts-table.updating {
  opacity: 0.8;
}

/* Плавные переходы для строк таблицы */
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

.table-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

/* Компактное отображение названия компании */
.company-name-compact {
  font-weight: 600;
  color: #1976d2;
  cursor: help;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.company-name-compact:hover {
  background-color: rgba(25, 118, 210, 0.08);
  transform: scale(1.01);
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

/* Минималистичное отображение типа аккаунта */
.type-minimal {
  font-weight: 500;
  font-size: 0.875rem;
  cursor: help;
  transition: all 0.2s ease;
  padding: 2px 4px;
  border-radius: 4px;
}

.type-minimal.type-partner {
  color: #2e7d32;
}

.type-minimal.type-partner:hover {
  background-color: rgba(46, 125, 50, 0.1);
}

.type-minimal.type-client {
  color: #1976d2;
}

.type-minimal.type-client:hover {
  background-color: rgba(25, 118, 210, 0.1);
}

/* Минималистичное отображение администратора */
.admin-minimal {
  font-weight: 500;
  font-size: 0.875rem;
  cursor: help;
  transition: all 0.2s ease;
  padding: 2px 4px;
  border-radius: 4px;
}

.admin-minimal.admin-active {
  color: #2e7d32;
}

.admin-minimal.admin-active:hover {
  background-color: rgba(46, 125, 50, 0.1);
}

.admin-minimal.admin-inactive {
  color: #d32f2f;
}

.admin-minimal.admin-inactive:hover {
  background-color: rgba(211, 47, 47, 0.1);
}

/* Минималистичное отображение статуса */
.status-minimal {
  font-weight: 500;
  font-size: 0.875rem;
  cursor: help;
  transition: all 0.2s ease;
  padding: 2px 4px;
  border-radius: 4px;
}

.status-minimal.status-active {
  color: #2e7d32;
}

.status-minimal.status-active:hover {
  background-color: rgba(46, 125, 50, 0.1);
}

.status-minimal.status-inactive {
  color: #d32f2f;
}

.status-minimal.status-inactive:hover {
  background-color: rgba(211, 47, 47, 0.1);
}

/* Минималистичное отображение блокировки */
.blocking-minimal {
  font-weight: 500;
  font-size: 0.875rem;
  cursor: help;
  transition: all 0.2s ease;
  padding: 2px 4px;
  border-radius: 4px;
}

.blocking-minimal.blocking-critical {
  color: #d32f2f;
}

.blocking-minimal.blocking-critical:hover {
  background-color: rgba(211, 47, 47, 0.1);
}

.blocking-minimal.blocking-warning {
  color: #f57c00;
}

.blocking-minimal.blocking-warning:hover {
  background-color: rgba(245, 124, 0, 0.1);
}

.blocking-minimal.blocking-normal {
  color: #1976d2;
}

.blocking-minimal.blocking-normal:hover {
  background-color: rgba(25, 118, 210, 0.1);
}

.blocking-minimal.blocking-none {
  color: #2e7d32;
}

.blocking-minimal.blocking-none:hover {
  background-color: rgba(46, 125, 50, 0.1);
}

/* Минималистичное отображение даты создания */
.creation-minimal {
  font-weight: 500;
  font-size: 0.875rem;
  cursor: help;
  transition: all 0.2s ease;
  padding: 2px 4px;
  border-radius: 4px;
  color: #7b1fa2;
}

.creation-minimal:hover {
  background-color: rgba(123, 31, 162, 0.1);
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

/* Компактное отображение администратора с цветовой индикацией */
.admin-name-compact {
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: help;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Компактное отображение статуса аккаунта */
.status-compact {
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

.status-compact.status-active {
  color: #1b5e20;
  background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
  border-color: #4caf50;
}

.status-compact.status-active:hover {
  background: linear-gradient(135deg, #c8e6c9, #a5d6a7);
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.status-compact.status-inactive {
  color: #c62828;
  background: linear-gradient(135deg, #ffebee, #ffcdd2);
  border-color: #f44336;
}

.status-compact.status-inactive:hover {
  background: linear-gradient(135deg, #ffcdd2, #ef9a9a);
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
}

.admin-name-compact.admin-active {
  color: #1b5e20;
  background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
  border-color: #4caf50;
}

.admin-name-compact.admin-active:hover {
  background: linear-gradient(135deg, #c8e6c9, #a5d6a7);
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.admin-name-compact.admin-inactive {
  color: #c62828;
  background: linear-gradient(135deg, #ffebee, #ffcdd2);
  border-color: #f44336;
}

.admin-name-compact.admin-inactive:hover {
  background: linear-gradient(135deg, #ffcdd2, #ef9a9a);
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
}

/* Базовые стили для всех легенд */
.legend-base {
  padding: 12px;
  min-width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Стили для легенды типа аккаунта */
.type-legend {
  @extend .legend-base;
}

/* Стили для легенды администратора */
.admin-legend {
  @extend .legend-base;
  min-width: 320px;
}

/* Стили для легенды статуса */
.status-legend {
  @extend .legend-base;
  min-width: 350px;
}

.admin-legend .legend-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1976d2;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.admin-legend .legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 4px 0;
}

.admin-legend .legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
}

.legend-color.admin-status-active {
  background: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.legend-color.admin-status-inactive {
  background: #f44336;
  box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2);
}

/* Цветовые индикаторы для типа аккаунта */
.legend-color.type-status-partner {
  background: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.legend-color.type-status-client {
  background: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

/* Цветовые индикаторы для статуса аккаунта */
.legend-color.account-status-active {
  background: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.legend-color.account-status-inactive {
  background: #f44336;
  box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2);
}

.admin-legend .legend-text {
  font-size: 0.875rem;
  color: #333;
  font-weight: 500;
}

.legend-description {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
  font-size: 0.8rem;
  color: #666;
  line-height: 1.4;
  text-align: left;
}

.legend-extra {
  margin-top: 6px;
  font-size: 0.75rem;
  color: #888;
  font-style: italic;
}

/* Компактное отображение объектов */
.objects-compact {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
  border: 1px solid #ddd;
  cursor: help;
  transition: all 0.2s ease;
  font-family: 'Roboto Mono', monospace;
  font-weight: 600;
  font-size: 0.875rem;
}

.objects-compact:hover {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border-color: #1976d2;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
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
.objects-legend {
  padding: 12px;
  min-width: 280px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.legend-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1976d2;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 4px 0;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
}

.legend-color.active {
  background: #2e7d32;
  box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.2);
}

.legend-color.total {
  background: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.legend-color.deleted {
  background: #d32f2f;
  box-shadow: 0 0 0 2px rgba(211, 47, 47, 0.2);
}

.legend-text {
  font-size: 0.875rem;
  color: #333;
  font-weight: 500;
}

.legend-formula {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
  font-size: 0.8rem;
  color: #666;
  text-align: center;
}

.legend-formula code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Roboto Mono', monospace;
  color: #1976d2;
  font-weight: 600;
}

/* Компактное отображение блокировки */
.blocking-compact {
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

.blocking-compact.blocking-critical {
  color: #c62828;
  background: linear-gradient(135deg, #ffebee, #ffcdd2);
  border-color: #f44336;
}

.blocking-compact.blocking-critical:hover {
  background: linear-gradient(135deg, #ffcdd2, #ef9a9a);
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
}

.blocking-compact.blocking-warning {
  color: #e65100;
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  border-color: #ff9800;
}

.blocking-compact.blocking-warning:hover {
  background: linear-gradient(135deg, #ffe0b2, #ffcc02);
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
}

.blocking-compact.blocking-normal {
  color: #0d47a1;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border-color: #2196f3;
}

.blocking-compact.blocking-normal:hover {
  background: linear-gradient(135deg, #bbdefb, #90caf9);
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}

.blocking-compact.blocking-none {
  color: #1b5e20;
  background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
  border-color: #4caf50;
}

.blocking-compact.blocking-none:hover {
  background: linear-gradient(135deg, #c8e6c9, #a5d6a7);
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

/* Стили для легенды блокировки */
.blocking-legend {
  padding: 12px;
  min-width: 320px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Цветовые индикаторы для статуса блокировки */
.legend-color.blocking-status-critical {
  background: #f44336;
  box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2);
}

.legend-color.blocking-status-warning {
  background: #ff9800;
  box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.2);
}

.legend-color.blocking-status-normal {
  background: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.legend-color.blocking-status-none {
  background: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.legend-color.days-indicator {
  background: #9c27b0;
  box-shadow: 0 0 0 2px rgba(156, 39, 176, 0.2);
}

/* Компактное отображение даты создания */
.creation-compact {
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
  color: #5e35b1;
  background: linear-gradient(135deg, #f3e5f5, #e1bee7);
  border-color: #9c27b0;
}

.creation-compact:hover {
  background: linear-gradient(135deg, #e1bee7, #ce93d8);
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(156, 39, 176, 0.3);
}

/* Стили для легенды даты создания */
.creation-legend {
  padding: 12px;
  min-width: 280px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Цветовой индикатор для даты создания */
.legend-color.creation-status {
  background: #9c27b0;
  box-shadow: 0 0 0 2px rgba(156, 39, 176, 0.2);
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.rotating {
  animation: rotate 1s linear infinite;
}

@media (max-width: 768px) {
  .accounts-page {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
}
</style>
