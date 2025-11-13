<template>
  <div class="contracts-tab">
    <!-- Фильтры -->
    <v-card variant="outlined" class="filters-card mb-4">
      <v-card-text class="pa-3">
        <v-row align="center">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              placeholder="Поиск по номеру, клиенту..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              rounded="lg"
            />
          </v-col>
          
          <v-col cols="6" md="2">
            <v-select
              v-model="statusFilter"
              :items="statusOptions"
              label="Статус"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              rounded="lg"
            />
          </v-col>
          
          <v-col cols="6" md="2">
            <v-select
              v-model="activeFilter"
              :items="activeOptions"
              label="Активность"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              rounded="lg"
            />
          </v-col>
          
          <v-col cols="6" md="2" class="expiring-filter-col">
            <div class="expiring-filter-wrapper">
              <v-switch
                v-model="expiringFilter"
                label="Истекающие"
                density="compact"
                hide-details
                color="primary"
                class="expiring-switch"
              />
            </div>
          </v-col>
          
          <!-- Действия -->
          <v-col cols="12" md="2" class="filter-actions">
            <div class="actions-container">
              <div class="filter-create">
                <v-btn
                  icon="mdi-plus"
                  color="primary"
                  variant="flat"
                  @click="createContract"
                  class="create-button"
                  :title="'Создать договор'"
                />
              </div>
              
              <div class="filter-clear">
                <v-btn
                  v-show="hasActiveFilters"
                  icon="mdi-filter-remove"
                  variant="flat"
                  color="warning"
                  density="comfortable"
                  @click="clearFilters"
                  :title="hasActiveFilters ? 'Сбросить активные фильтры' : 'Сбросить фильтры'"
                  :class="{ 'filter-clear-active': hasActiveFilters }"
                >
                  <v-badge
                    v-if="hasActiveFilters"
                    :content="getActiveFiltersCount()"
                    color="white"
                    text-color="warning"
                    inline
                  />
                </v-btn>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Таблица договоров -->
    <v-card variant="outlined" v-if="contracts.length > 0">
      <v-data-table
        :headers="headers"
        :items="filteredContracts"
        :loading="loading"
        class="contracts-table"
        no-data-text="Договоры не найдены"
        loading-text="Загрузка договоров..."
        density="compact"
        :items-per-page="10"
      >
        <!-- Номер договора -->
        <template #item.number="{ item }">
          <v-chip 
            size="small" 
            :color="getStatusColor(item.status)"
            variant="tonal"
          >
            {{ item.number }}
          </v-chip>
        </template>

        <!-- Название и клиент -->
        <template #item.title="{ item }">
          <div>
            <div class="contract-title">{{ item.title }}</div>
            <div class="contract-client">{{ item.client_name }}</div>
          </div>
        </template>

        <!-- Тарифный план -->
        <template #item.tariff_plan="{ item }">
          <div>
            <v-chip size="small" color="primary" variant="tonal">
              {{ item.tariff_plan?.name || 'Не указан' }}
            </v-chip>
            <div class="text-caption">
              {{ formatCurrency(item.tariff_plan?.price || 0) }}/мес
            </div>
          </div>
        </template>

        <!-- Период -->
        <template #item.period="{ item }">
          <div>
            <div class="text-body-2">
              {{ formatDate(item.start_date) }} - {{ formatDate(item.end_date) }}
            </div>
            <div class="text-caption" :class="getPeriodClass(item)">
              {{ getPeriodText(item) }}
            </div>
          </div>
        </template>

        <!-- Стоимость -->
        <template #item.total_amount="{ item }">
          <div class="text-right">
            <div class="amount-value">
              {{ formatCurrency(item.total_amount, item.currency) }}
            </div>
            <v-tooltip location="top" :disabled="!item.objects || item.objects.length === 0">
              <template #activator="{ props }">
                <div class="text-caption objects-count" v-bind="props" style="cursor: pointer;">
                  {{ item.objects?.length || 0 }} объектов
                </div>
              </template>
              <template #default>
                <div class="objects-tooltip">
                  <div class="objects-tooltip-title">Привязанные объекты:</div>
                  <div class="objects-tooltip-list">
                    <div 
                      v-for="obj in item.objects" 
                      :key="obj.id"
                      class="objects-tooltip-item"
                    >
                      <span v-if="obj.name && obj.name !== `Объект #${obj.id}`">
                        <strong>{{ obj.name }}</strong>
                        <span class="objects-tooltip-id">(ID: {{ obj.id }})</span>
                      </span>
                      <span v-else>
                        Объект #{{ obj.id }}
                      </span>
                    </div>
                    <div v-if="!item.objects || item.objects.length === 0" class="objects-tooltip-empty">
                      Нет привязанных объектов
                    </div>
                  </div>
                </div>
              </template>
            </v-tooltip>
          </div>
        </template>

        <!-- Статус -->
        <template #item.status="{ item }">
          <v-chip 
            :color="getStatusColor(item.status)"
            size="small"
            variant="tonal"
          >
            {{ getStatusLabel(item.status) }}
          </v-chip>
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="actions-cell">
            <v-tooltip text="Просмотр">
              <template #activator="{ props }">
                <v-btn 
                  v-bind="props"
                  icon="mdi-eye" 
                  size="small" 
                  variant="text" 
                  @click="viewContract(item)"
                />
              </template>
            </v-tooltip>
            
            <v-tooltip text="Счета по договору">
              <template #activator="{ props }">
                <v-btn 
                  v-bind="props"
                  icon="mdi-file-document" 
                  size="small" 
                  variant="text" 
                  color="primary"
                  @click="viewInvoices(item)"
                />
              </template>
            </v-tooltip>
            
            <v-tooltip text="Рассчитать стоимость">
              <template #activator="{ props }">
                <v-btn 
                  v-bind="props"
                  icon="mdi-calculator" 
                  size="small" 
                  variant="text" 
                  @click="calculateCost(item)"
                />
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Пустое состояние -->
    <v-card v-else variant="outlined" class="empty-state">
      <v-card-text class="text-center pa-6">
        <v-icon icon="mdi-file-document-multiple" size="48" class="mb-3" color="grey" />
        <h3 class="mb-2">Нет договоров</h3>
        <p class="text-grey mb-4">
          Создайте первый договор для работы с биллингом
        </p>
      </v-card-text>
    </v-card>

    <!-- Snackbar -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
      <template #actions>
        <v-btn color="white" variant="text" @click="showSnackbar = false">
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { debounce } from 'lodash-es';

const router = useRouter();

// Эмиты
const emit = defineEmits<{
  (e: 'stats-updated', stats: {
    total: number
    active: number
    expiring_soon: number
    total_amount: string
  }): void
}>();

// Интерфейс для договора (упрощенный)
interface Contract {
  id: number;
  number: string;
  title: string;
  client_name: string;
  start_date: string;
  end_date: string;
  total_amount: string;
  currency: string;
  status: string;
  is_active: boolean;
  notify_before: number;
  tariff_plan?: {
    id: number;
    name: string;
    price: number;
  };
  objects?: any[];
}

// Реактивные данные
const loading = ref(false);
const demoMode = ref(false); // Отключен по умолчанию
const contracts = ref<Contract[]>([]);
const searchQuery = ref('');
const statusFilter = ref<string | null>(null);
const activeFilter = ref<boolean | null>(null);
const expiringFilter = ref(false);

// Snackbar
const showSnackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

// Заголовки таблицы (компактные для вкладки)
const headers = [
  { title: 'Номер', key: 'number', sortable: true, width: '120px' },
  { title: 'Название / Клиент', key: 'title', sortable: true },
  { title: 'Тариф', key: 'tariff_plan', sortable: false, width: '140px' },
  { title: 'Период', key: 'period', sortable: false, width: '180px' },
  { title: 'Сумма', key: 'total_amount', sortable: true, width: '120px' },
  { title: 'Статус', key: 'status', sortable: true, width: '100px' },
  { title: 'Действия', key: 'actions', sortable: false, width: '120px' },
];

// Опции для фильтров
const statusOptions = [
  { value: 'draft', title: 'Черновик' },
  { value: 'active', title: 'Активный' },
  { value: 'expired', title: 'Истекший' },
  { value: 'cancelled', title: 'Отмененный' },
  { value: 'suspended', title: 'Приостановленный' },
];

const activeOptions = [
  { value: true, title: 'Активные' },
  { value: false, title: 'Неактивные' },
];

// Вычисляемые свойства
const filteredContracts = computed(() => {
  let result = contracts.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(contract =>
      contract.number.toLowerCase().includes(query) ||
      contract.title.toLowerCase().includes(query) ||
      contract.client_name.toLowerCase().includes(query)
    );
  }

  if (statusFilter.value) {
    result = result.filter(contract => contract.status === statusFilter.value);
  }

  if (activeFilter.value !== null) {
    result = result.filter(contract => contract.is_active === activeFilter.value);
  }

  if (expiringFilter.value) {
    result = result.filter(contract => isExpiringSoon(contract));
  }

  return result;
});

const stats = computed(() => {
  const total = contracts.value.length;
  const active = contracts.value.filter(c => c.status === 'active').length;
  const expired = contracts.value.filter(c => c.status === 'expired').length;
  const expiring_soon = contracts.value.filter(c => isExpiringSoon(c)).length;
  const total_amount = contracts.value.reduce((sum, c) => sum + parseFloat(c.total_amount), 0);

  return {
    total,
    active,
    expired,
    expiring_soon,
    total_amount: total_amount.toString(),
  };
});

// Отслеживаем изменения статистики и передаем в родительский компонент
watch(stats, (newStats) => {
  emit('stats-updated', {
    total: newStats.total,
    active: newStats.active,
    expiring_soon: newStats.expiring_soon,
    total_amount: newStats.total_amount,
  });
}, { immediate: true });

const hasActiveFilters = computed(() => {
  return !!(
    searchQuery.value ||
    statusFilter.value ||
    activeFilter.value !== null ||
    expiringFilter.value
  );
});

const getActiveFiltersCount = (): number => {
  let count = 0;
  if (searchQuery.value) count++;
  if (statusFilter.value) count++;
  if (activeFilter.value !== null) count++;
  if (expiringFilter.value) count++;
  return count;
};

// Методы
const enableDemoMode = async () => {
  console.log('🎭 Enabling contracts demo mode...');
  demoMode.value = true;
  await loadDemoContracts();
  showSnackbarMessage('Демо режим договоров включен', 'success');
};

const disableDemoMode = async () => {
  console.log('🔄 Disabling contracts demo mode...');
  demoMode.value = false;
  contracts.value = [];
  showSnackbarMessage('Демо режим договоров выключен', 'info');
  await loadContracts();
};

const loadDemoContracts = async () => {
  console.log('📄 Loading demo contracts for billing tab...');
  loading.value = true;
  
  try {
    const demoContracts: Contract[] = [
      {
        id: 1,
        number: "DOG-2024-001",
        title: "Мониторинг транспорта",
        client_name: "ООО Логистика Плюс",
        start_date: "2024-01-01T00:00:00Z",
        end_date: "2024-12-31T23:59:59Z",
        total_amount: "120000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 30,
        tariff_plan: { id: 1, name: "Стандартный", price: 1000 },
        objects: [{}, {}],
      },
      {
        id: 2,
        number: "DOG-2024-002",
        title: "Мониторинг стройтехники",
        client_name: "ООО СтройТех",
        start_date: "2024-02-01T00:00:00Z",
        end_date: "2025-01-31T23:59:59Z",
        total_amount: "180000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 60,
        tariff_plan: { id: 2, name: "Премиум", price: 1500 },
        objects: [{}],
      },
      {
        id: 3,
        number: "DOG-2024-003",
        title: "Мониторинг такси",
        client_name: "ИП Таксистов А.В.",
        start_date: "2024-01-01T00:00:00Z",
        end_date: "2024-03-31T23:59:59Z",
        total_amount: "30000.00",
        currency: "RUB",
        status: "expired",
        is_active: false,
        notify_before: 14,
        tariff_plan: { id: 1, name: "Стандартный", price: 1000 },
        objects: [],
      },
      {
        id: 4,
        number: "DOG-2024-004",
        title: "Мониторинг сельхозтехники",
        client_name: "СПК Колос",
        start_date: "2024-03-01T00:00:00Z",
        end_date: "2024-12-31T23:59:59Z",
        total_amount: "90000.00",
        currency: "RUB",
        status: "draft",
        is_active: false,
        notify_before: 30,
        tariff_plan: { id: 1, name: "Стандартный", price: 1000 },
        objects: [],
      },
      {
        id: 5,
        number: "DOG-2023-015",
        title: "Мониторинг курьерской службы",
        client_name: "ООО Быстрая Доставка",
        start_date: "2023-12-01T00:00:00Z",
        end_date: "2024-02-29T23:59:59Z",
        total_amount: "45000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 14,
        tariff_plan: { id: 2, name: "Премиум", price: 1500 },
        objects: [{}, {}],
      },
      {
        id: 6,
        number: "DOG-2024-005",
        title: "Мониторинг медтехники",
        client_name: "ГБУ Больница №7",
        start_date: "2024-02-15T00:00:00Z",
        end_date: "2025-02-14T23:59:59Z",
        total_amount: "240000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 45,
        tariff_plan: { id: 2, name: "Премиум", price: 1500 },
        objects: [{}, {}],
      },
      {
        id: 7,
        number: "DOG-2024-006",
        title: "Мониторинг коммунальной техники",
        client_name: "ГБУ Автодороги",
        start_date: "2024-01-05T00:00:00Z",
        end_date: "2024-04-30T23:59:59Z",
        total_amount: "60000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 15,
        tariff_plan: { id: 1, name: "Стандартный", price: 1000 },
        objects: [{}, {}, {}],
      },
      {
        id: 8,
        number: "DOG-2023-020",
        title: "Мониторинг инкассации",
        client_name: "ООО СБ Инкассация",
        start_date: "2023-11-01T00:00:00Z",
        end_date: "2024-02-29T23:59:59Z",
        total_amount: "180000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 7,
        tariff_plan: { id: 2, name: "Премиум", price: 1500 },
        objects: [{}, {}],
      },
    ];

    contracts.value = demoContracts;
    console.log(`✅ Loaded ${contracts.value.length} contracts for billing tab`);
    
  } catch (error) {
    console.error('❌ Error loading demo contracts:', error);
    showSnackbarMessage('Ошибка загрузки демо данных', 'error');
  } finally {
    loading.value = false;
  }
};

const clearFilters = async () => {
  searchQuery.value = '';
  statusFilter.value = null;
  activeFilter.value = null;
  expiringFilter.value = false;
  if (!demoMode.value) {
    await loadContracts();
  }
};

const createContract = () => {
  // Перенаправляем на страницу создания договора
  router.push('/contracts/create');
};

const viewContract = (contract: Contract) => {
  console.log('Просмотр договора:', contract.number);
  showSnackbarMessage(`Просмотр договора ${contract.number}`, 'info');
};

const viewInvoices = (contract: Contract) => {
  console.log('Просмотр счетов по договору:', contract.number);
  showSnackbarMessage(`Счета по договору ${contract.number}`, 'info');
  // Здесь можно переключиться на вкладку "Счета" с фильтром по договору
};

const calculateCost = (contract: Contract) => {
  console.log('Расчет стоимости договора:', contract.number);
  const objectsCount = contract.objects?.length || 0;
  const monthlyPrice = contract.tariff_plan?.price || 0;
  const message = `Договор ${contract.number}: ${objectsCount} объектов × ${formatCurrency(monthlyPrice)}/мес`;
  showSnackbarMessage(message, 'info');
};

const showSnackbarMessage = (text: string, color: string) => {
  snackbarText.value = text;
  snackbarColor.value = color;
  showSnackbar.value = true;
};

// Утилиты
const formatCurrency = (amount: string | number, currency = 'RUB'): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency,
  }).format(value || 0);
};

const formatCurrencyShort = (amount: string | number): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}М ₽`;
  } else if (value >= 1000) {
    return `${Math.round(value / 1000)}К ₽`;
  } else {
    return `${value} ₽`;
  }
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('ru-RU');
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    draft: 'grey',
    active: 'green',
    expired: 'red',
    cancelled: 'grey',
    suspended: 'orange',
  };
  return colors[status] || 'grey';
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: 'Черновик',
    active: 'Активный',
    expired: 'Истекший',
    cancelled: 'Отмененный',
    suspended: 'Приостановленный',
  };
  return labels[status] || status;
};

const isExpiringSoon = (contract: Contract): boolean => {
  const endDate = new Date(contract.end_date);
  const notifyDate = new Date(endDate);
  notifyDate.setDate(notifyDate.getDate() - contract.notify_before);
  const now = new Date();
  
  return now >= notifyDate && now <= endDate;
};

const getPeriodClass = (contract: Contract): string => {
  const now = new Date();
  const endDate = new Date(contract.end_date);
  
  if (now > endDate) {
    return 'text-error';
  } else if (isExpiringSoon(contract)) {
    return 'text-warning';
  } else {
    return 'text-success';
  }
};

const getPeriodText = (contract: Contract): string => {
  const now = new Date();
  const endDate = new Date(contract.end_date);
  
  if (now > endDate) {
    return 'Истек';
  } else if (isExpiringSoon(contract)) {
    const days = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `Через ${days} дн.`;
  } else {
    const days = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} дн.`;
  }
};

// Загрузка реальных договоров
const loadContracts = async () => {
  console.log('📄 Loading real contracts from API...');
  loading.value = true;
  try {
    const contractsService = (await import('@/services/contractsService')).default;
    const response = await contractsService.getContracts({
      search: searchQuery.value || undefined,
      status: statusFilter.value || undefined,
      is_active: activeFilter.value !== null ? activeFilter.value : undefined,
      expiring: expiringFilter.value || undefined,
      page: 1,
      limit: 100,
    });
    contracts.value = response.contracts || [];
    console.log(`✅ Loaded ${contracts.value.length} contracts from API (total: ${response.total})`);
  } catch (error) {
    console.error('❌ Error loading contracts:', error);
    showSnackbarMessage('Ошибка загрузки договоров', 'error');
    contracts.value = [];
  } finally {
    loading.value = false;
  }
};

// Отслеживание изменений фильтров для автоматической перезагрузки
const debouncedLoadContracts = debounce(async () => {
  if (!demoMode.value) {
    await loadContracts();
  }
}, 300);

watch([searchQuery, statusFilter, activeFilter, expiringFilter], () => {
  debouncedLoadContracts();
});

// Lifecycle
onMounted(async () => {
  console.log('🚀 Contracts tab mounted in billing');
  if (demoMode.value) {
    await loadDemoContracts();
  } else {
    await loadContracts();
  }
});
</script>

<style scoped>
.contracts-tab {
  /* Стили для вкладки внутри биллинга */
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.section-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.demo-alert {
  border-radius: 8px;
}

.alert-content {
  font-size: 14px;
}


.filters-card {
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.filter-actions {
  display: flex;
  align-items: center;
  height: 100%;
  padding-left: 8px;
}

.actions-container {
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: flex-end;
}

.filter-create,
.filter-clear {
  display: flex;
  align-items: center;
}

/* Стили для фильтра "Истекающие" */
.expiring-filter-col {
  display: flex;
  align-items: center;
}

.expiring-filter-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 8px;
  border: 1px solid rgba(0, 0, 0, 0.23);
  border-radius: 10px;
  background-color: white;
  transition: all 0.2s ease;
}

.expiring-filter-wrapper:hover {
  border-color: rgba(0, 0, 0, 0.87);
}

.expiring-switch :deep(.v-switch) {
  margin: 0;
}

.expiring-switch :deep(.v-switch__track) {
  height: 20px;
  width: 36px;
}

.expiring-switch :deep(.v-switch__thumb) {
  height: 16px;
  width: 16px;
}

.expiring-switch :deep(.v-label) {
  font-size: 0.875rem;
  white-space: nowrap;
  margin-left: 8px;
}

/* Стили для кнопок в стиле AccountsPage */
.filter-create :deep(.v-btn),
.filter-clear :deep(.v-btn) {
  height: 44px !important;
  min-height: 44px !important;
  width: 44px !important;
  min-width: 44px !important;
  padding: 0 !important;
  border-radius: 10px !important;
}

.filter-clear :deep(.v-btn) {
  width: 44px !important;
  min-width: 44px !important;
}

/* Специальные стили для кнопки Создать */
.create-button {
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3) !important;
  transition: all 0.2s ease !important;
}

.create-button:hover {
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4) !important;
  transform: translateY(-1px) !important;
}

.create-button :deep(.v-icon) {
  color: white !important;
  font-size: 20px !important;
}

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

/* Анимация для активной кнопки очистки фильтров */
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
    box-shadow: 0 2px 12px rgba(255, 152, 0, 0.5);
  }
  100% {
    box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
  }
}

/* Адаптивность для мобильных */
@media (max-width: 960px) {
  .actions-container {
    gap: 6px;
    justify-content: flex-start;
  }
  
  .btn-text {
    font-size: 0.8rem;
  }
}

@media (max-width: 600px) {
  .actions-container {
    justify-content: space-between;
    gap: 8px;
  }
  
  .actions-container .v-btn {
    flex: 1;
    min-width: 100px;
  }
  
  .btn-text {
    display: none;
  }
  
  .actions-container .v-btn {
    min-width: 44px !important;
    width: 44px !important;
    flex: none;
    padding: 0 !important;
  }
}

.contracts-table {
  --v-table-row-height: 56px;
}

.contract-title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 2px;
  line-height: 1.3;
}

.contract-client {
  font-size: 11px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.amount-value {
  font-weight: 600;
  font-family: 'SF Mono', monospace;
  font-size: 13px;
}

.actions-cell {
  display: flex;
  gap: 2px;
}

.empty-state {
  border-radius: 8px;
}

/* Темная тема для ContractsTab */
[data-theme="dark"] .filters-card {
  background-color: #2c2c2e !important;
  border-color: #3a3a3c !important;
}

[data-theme="dark"] .expiring-filter-wrapper {
  background-color: #2c2c2e !important;
  border-color: #3a3a3c !important;
}

[data-theme="dark"] .expiring-filter-wrapper:hover {
  border-color: #007AFF !important;
}

[data-theme="dark"] .v-text-field :deep(.v-field) {
  background-color: #2c2c2e !important;
  border-color: #3a3a3c !important;
  color: #ffffff !important;
}

[data-theme="dark"] .v-text-field :deep(.v-field__input) {
  color: #ffffff !important;
}

[data-theme="dark"] .v-text-field :deep(.v-label) {
  color: #8e8e93 !important;
}

[data-theme="dark"] .v-select :deep(.v-field) {
  background-color: #2c2c2e !important;
  border-color: #3a3a3c !important;
  color: #ffffff !important;
}

[data-theme="dark"] .v-select :deep(.v-field__input) {
  color: #ffffff !important;
}

[data-theme="dark"] .v-select :deep(.v-label) {
  color: #8e8e93 !important;
}

[data-theme="dark"] .empty-state {
  background-color: #2c2c2e !important;
  border-color: #3a3a3c !important;
}

[data-theme="dark"] .empty-state h3 {
  color: #ffffff !important;
}

[data-theme="dark"] .empty-state p {
  color: #8e8e93 !important;
}

[data-theme="dark"] .empty-state .v-icon {
  color: #8e8e93 !important;
}

[data-theme="dark"] .v-data-table {
  background-color: #2c2c2e !important;
  color: #ffffff !important;
}

[data-theme="dark"] .v-data-table :deep(thead) {
  background-color: #1a1a1a !important;
}

[data-theme="dark"] .v-data-table :deep(th) {
  color: #ffffff !important;
  border-color: #3a3a3c !important;
}

[data-theme="dark"] .v-data-table :deep(td) {
  color: #ffffff !important;
  border-color: #3a3a3c !important;
}

[data-theme="dark"] .v-data-table :deep(.v-data-table__tr) {
  background-color: #2c2c2e !important;
}

[data-theme="dark"] .v-data-table :deep(.v-data-table__tr:hover) {
  background-color: #3a3a3c !important;
}

[data-theme="dark"] .contract-client {
  color: #8e8e93 !important;
}

[data-theme="dark"] .v-card {
  background-color: #2c2c2e !important;
  border-color: #3a3a3c !important;
}

[data-theme="dark"] .v-card-title {
  color: #ffffff !important;
}

[data-theme="dark"] .v-card-text {
  color: #ffffff !important;
}

/* Стили для tooltip с объектами */
.objects-count {
  transition: color 0.2s ease;
}

.objects-count:hover {
  color: var(--v-primary-base, #1976d2);
  text-decoration: underline;
}

.objects-tooltip {
  max-width: 300px;
  padding: 8px 0;
}

.objects-tooltip-title {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 8px;
  padding: 0 12px;
  color: rgba(0, 0, 0, 0.87);
}

.objects-tooltip-list {
  max-height: 200px;
  overflow-y: auto;
  padding: 0 12px;
}

.objects-tooltip-item {
  padding: 4px 0;
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.7);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  line-height: 1.5;
}

.objects-tooltip-item:last-child {
  border-bottom: none;
}

.objects-tooltip-item strong {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
}

.objects-tooltip-id {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.5);
  margin-left: 4px;
}

.objects-tooltip-empty {
  padding: 4px 0;
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.5);
  font-style: italic;
}

[data-theme="dark"] .objects-tooltip-title {
  color: rgba(255, 255, 255, 0.87);
}

[data-theme="dark"] .objects-tooltip-item {
  color: rgba(255, 255, 255, 0.7);
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .objects-tooltip-item strong {
  color: rgba(255, 255, 255, 0.87);
}

[data-theme="dark"] .objects-tooltip-id {
  color: rgba(255, 255, 255, 0.5);
}

[data-theme="dark"] .objects-tooltip-empty {
  color: rgba(255, 255, 255, 0.5);
}

/* Responsive */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .section-actions {
    justify-content: stretch;
  }

}
</style>
