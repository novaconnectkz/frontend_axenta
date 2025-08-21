<template>
  <div class="contracts-tab">
    <!-- Заголовок секции -->
    <div class="section-header">
      <div class="section-title">
        <v-icon icon="mdi-file-document-multiple" class="mr-2" />
        Договоры
        <v-chip v-if="contracts.length > 0" size="small" class="ml-2">
          {{ contracts.length }}
        </v-chip>
      </div>
      
      <div class="section-actions">
        <v-btn 
          v-if="!demoMode" 
          color="success" 
          variant="outlined"
          prepend-icon="mdi-play-circle"
          @click="enableDemoMode"
          size="small"
        >
          Демо режим
        </v-btn>
        <v-btn 
          v-else 
          color="warning" 
          variant="outlined"
          prepend-icon="mdi-stop-circle" 
          @click="disableDemoMode"
          size="small"
        >
          Выйти из демо
        </v-btn>
        <v-btn 
          color="primary" 
          prepend-icon="mdi-plus" 
          @click="createContract"
          size="small"
        >
          Создать договор
        </v-btn>
      </div>
    </div>

    <!-- Уведомление о демо режиме -->
    <v-alert 
      v-if="demoMode" 
      type="info" 
      variant="tonal" 
      class="demo-alert mb-4"
      density="compact"
    >
      <template #prepend>
        <v-icon icon="mdi-play-circle" size="20" />
      </template>
      <div class="alert-content">
        <strong>Демо режим:</strong> Отображаются {{ contracts.length }} тестовых договоров для демонстрации интерфейса.
      </div>
    </v-alert>

    <!-- Статистика договоров -->
    <div class="contracts-stats mb-4" v-if="contracts.length > 0">
      <v-row>
        <v-col cols="6" sm="3">
          <v-card variant="outlined" class="stat-card">
            <v-card-text class="text-center pa-3">
              <v-icon icon="mdi-file-document-multiple" size="24" color="primary" class="mb-1" />
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">Всего</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="6" sm="3">
          <v-card variant="outlined" class="stat-card">
            <v-card-text class="text-center pa-3">
              <v-icon icon="mdi-check-circle" size="24" color="success" class="mb-1" />
              <div class="stat-value">{{ stats.active }}</div>
              <div class="stat-label">Активные</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="6" sm="3">
          <v-card variant="outlined" class="stat-card">
            <v-card-text class="text-center pa-3">
              <v-icon icon="mdi-clock-alert" size="24" color="warning" class="mb-1" />
              <div class="stat-value">{{ stats.expiring_soon }}</div>
              <div class="stat-label">Истекают</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="6" sm="3">
          <v-card variant="outlined" class="stat-card">
            <v-card-text class="text-center pa-3">
              <v-icon icon="mdi-currency-rub" size="20" color="info" class="mb-1" />
              <div class="stat-value-small">{{ formatCurrencyShort(stats.total_amount) }}</div>
              <div class="stat-label">Стоимость</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Фильтры -->
    <v-card variant="outlined" class="filters-card mb-4" v-if="contracts.length > 0">
      <v-card-text class="pa-3">
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              placeholder="Поиск по номеру, клиенту..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              hide-details
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
            />
          </v-col>
          
          <v-col cols="6" md="2">
            <v-checkbox
              v-model="expiringFilter"
              label="Истекающие"
              density="compact"
              hide-details
            />
          </v-col>
          
          <v-col cols="6" md="2">
            <v-btn
              variant="outlined"
              size="small"
              @click="clearFilters"
              :disabled="!hasActiveFilters"
              block
            >
              Очистить
            </v-btn>
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
            <div class="text-caption">
              {{ item.objects?.length || 0 }} объектов
            </div>
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
          {{ demoMode ? 'Ошибка загрузки демо данных' : 'Включите демо режим для просмотра тестовых данных' }}
        </p>
        <v-btn 
          v-if="!demoMode"
          color="primary" 
          prepend-icon="mdi-play-circle"
          @click="enableDemoMode"
        >
          Включить демо режим
        </v-btn>
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
import { computed, onMounted, ref } from 'vue';

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
const demoMode = ref(true); // Включен по умолчанию
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

const hasActiveFilters = computed(() => {
  return !!(
    searchQuery.value ||
    statusFilter.value ||
    activeFilter.value !== null ||
    expiringFilter.value
  );
});

// Методы
const enableDemoMode = async () => {
  console.log('🎭 Enabling contracts demo mode...');
  demoMode.value = true;
  await loadDemoContracts();
  showSnackbarMessage('Демо режим договоров включен', 'success');
};

const disableDemoMode = () => {
  console.log('🔄 Disabling contracts demo mode...');
  demoMode.value = false;
  contracts.value = [];
  showSnackbarMessage('Демо режим договоров выключен', 'info');
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

const clearFilters = () => {
  searchQuery.value = '';
  statusFilter.value = null;
  activeFilter.value = null;
  expiringFilter.value = false;
};

const createContract = () => {
  console.log('Создание договора из биллинга');
  showSnackbarMessage('Создание договора (в разработке)', 'info');
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

// Lifecycle
onMounted(async () => {
  console.log('🚀 Contracts tab mounted in billing');
  if (demoMode.value) {
    await loadDemoContracts();
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

.contracts-stats {
  /* Статистика договоров */
}

.stat-card {
  height: 80px;
  min-height: 80px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  margin: 2px 0;
  line-height: 1.2;
}

.stat-value-small {
  font-size: 14px;
  font-weight: 600;
  margin: 2px 0;
  line-height: 1.2;
}

.stat-label {
  font-size: 10px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filters-card {
  border-radius: 8px;
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

/* Responsive */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .section-actions {
    justify-content: stretch;
  }

  .stat-card {
    height: 70px;
    min-height: 70px;
  }

  .stat-value {
    font-size: 18px;
  }

  .stat-value-small {
    font-size: 12px;
  }

  .stat-label {
    font-size: 9px;
  }
}
</style>
