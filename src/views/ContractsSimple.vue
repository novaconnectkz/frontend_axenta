<template>
  <div class="contracts-page">
    <!-- Заголовок страницы -->
    <div class="page-header">
      <div class="page-title-section">
        <v-icon icon="mdi-file-document-multiple" size="32" class="page-icon" />
        <div>
          <h1 class="page-title">Управление договорами</h1>
          <p class="page-subtitle">Договоры, приложения и привязка объектов</p>
        </div>
      </div>

      <div class="page-actions">
        <v-btn 
          v-if="!demoMode" 
          color="success" 
          prepend-icon="mdi-play-circle"
          @click="enableDemoMode"
        >
          Демо режим
        </v-btn>
        <v-btn 
          v-else 
          color="warning" 
          prepend-icon="mdi-stop-circle" 
          @click="disableDemoMode"
        >
          Выйти из демо
        </v-btn>
        <v-btn 
          color="primary" 
          prepend-icon="mdi-plus" 
          @click="createContract"
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
      prominent 
      class="demo-alert"
    >
      <template #prepend>
        <v-icon icon="mdi-play-circle" size="24" />
      </template>
      <div>
        <div class="alert-title">Демонстрационный режим (включен по умолчанию)</div>
        <div class="alert-text">
          Отображаются демо данные ({{ contracts.length }} договоров). 
          Это позволяет сразу увидеть, как будет выглядеть интерфейс управления договорами.
          Нажмите "Выйти из демо" для работы с реальными данными.
        </div>
      </div>
    </v-alert>

    <!-- Статистика -->
    <div class="stats-section" v-if="contracts.length > 0">
      <v-row>
        <v-col cols="6" md="3">
          <v-card variant="outlined" class="stat-card">
            <v-card-text class="text-center pa-4">
              <v-icon icon="mdi-file-document-multiple" size="28" color="primary" class="mb-2" />
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">Всего</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="6" md="3">
          <v-card variant="outlined" class="stat-card">
            <v-card-text class="text-center pa-4">
              <v-icon icon="mdi-check-circle" size="28" color="success" class="mb-2" />
              <div class="stat-value">{{ stats.active }}</div>
              <div class="stat-label">Активные</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="6" md="3">
          <v-card variant="outlined" class="stat-card">
            <v-card-text class="text-center pa-4">
              <v-icon icon="mdi-clock-alert" size="28" color="warning" class="mb-2" />
              <div class="stat-value">{{ stats.expiring_soon }}</div>
              <div class="stat-label">Истекают</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="6" md="3">
          <v-card variant="outlined" class="stat-card">
            <v-card-text class="text-center pa-3">
              <v-icon icon="mdi-currency-rub" size="24" color="info" class="mb-1" />
              <div class="stat-value-small">{{ formatCurrencyShort(stats.total_amount) }}</div>
              <div class="stat-label">Стоимость</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Фильтры -->
    <v-card variant="outlined" class="filters-card" v-if="contracts.length > 0">
      <v-card-title>
        <v-icon icon="mdi-filter" class="mr-2" />
        Фильтры
        <v-spacer />
        <v-btn variant="text" size="small" @click="clearFilters">
          Очистить
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              placeholder="Поиск по номеру, названию, клиенту..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              clearable
            />
          </v-col>
          
          <v-col cols="12" md="3">
            <v-select
              v-model="statusFilter"
              :items="statusOptions"
              label="Статус"
              variant="outlined"
              density="comfortable"
              clearable
            />
          </v-col>
          
          <v-col cols="12" md="3">
            <v-select
              v-model="activeFilter"
              :items="activeOptions"
              label="Активность"
              variant="outlined"
              density="comfortable"
              clearable
            />
          </v-col>
          
          <v-col cols="12" md="2">
            <v-checkbox
              v-model="expiringFilter"
              label="Истекающие"
              density="comfortable"
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="partnerSourceFilter"
              :items="CONTRACT_SOURCE_OPTIONS"
              label="GPS-система"
              variant="outlined"
              density="comfortable"
              clearable
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Список договоров -->
    <v-card variant="outlined" v-if="contracts.length > 0">
      <v-card-title>
        <v-icon icon="mdi-file-document-multiple" class="mr-2" />
        Договоры
        <v-chip size="small" class="ml-2">{{ filteredContracts.length }}</v-chip>
        <v-spacer />
        <v-btn icon="mdi-refresh" variant="text" @click="loadContracts" :loading="loading" />
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="filteredContracts"
        :loading="loading"
        class="contracts-table"
        no-data-text="Договоры не найдены"
        loading-text="Загрузка договоров..."
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
            <v-btn icon="mdi-eye" size="small" variant="text" @click="viewContract(item)" />
            <v-btn icon="mdi-pencil" size="small" variant="text" @click="editContract(item)" />
            <v-btn icon="mdi-link" size="small" variant="text" @click="linkObjects(item)" />
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Пустое состояние -->
    <v-card v-else variant="outlined" class="empty-state">
      <v-card-text class="text-center pa-8">
        <v-icon icon="mdi-file-document-multiple" size="64" class="mb-4" color="grey" />
        <h2 class="mb-2">Нет договоров</h2>
        <p class="text-grey mb-4">
          Создайте первый договор для работы с биллингом
        </p>
      </v-card-text>
    </v-card>

    <!-- Snackbar -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" :timeout="4000">
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
import { useRoute } from 'vue-router';
import { CONTRACT_SOURCE_OPTIONS, type ContractSource, type ContractWithRelations } from '@/types/contracts';
import contractsService from '@/services/contractsService';

// Простые типы для демо
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
  partner_source?: ContractSource;
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
const partnerSourceFilter = ref<ContractSource | null>(null);

// Snackbar
const showSnackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

// Заголовки таблицы
const headers = [
  { title: 'Номер', key: 'number', sortable: true },
  { title: 'Название / Клиент', key: 'title', sortable: true },
  { title: 'Тарифный план', key: 'tariff_plan', sortable: false },
  { title: 'Период действия', key: 'period', sortable: false },
  { title: 'Стоимость', key: 'total_amount', sortable: true },
  { title: 'Статус', key: 'status', sortable: true },
  { title: 'Действия', key: 'actions', sortable: false },
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

  if (partnerSourceFilter.value) {
    result = result.filter(contract => contract.partner_source === partnerSourceFilter.value);
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

// Методы
const enableDemoMode = async () => {
  console.log('🎭 Enabling demo mode...');
  demoMode.value = true;
  await loadDemoContracts();
  showSnackbarMessage('Демо режим включен', 'success');
};

const disableDemoMode = () => {
  console.log('🔄 Disabling demo mode...');
  demoMode.value = false;
  contracts.value = [];
  showSnackbarMessage('Демо режим выключен', 'info');
};

const loadDemoContracts = async () => {
  console.log('📄 Loading demo contracts...');
  loading.value = true;
  
  try {
    // Создаем демо данные прямо здесь
    const demoContracts: Contract[] = [
      {
        id: 1,
        number: "DOG-2024-001",
        title: "Договор на мониторинг транспорта ООО Логистика",
        client_name: "ООО Логистика Плюс",
        start_date: "2024-01-01T00:00:00Z",
        end_date: "2024-12-31T23:59:59Z",
        total_amount: "120000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 30,
        tariff_plan: {
          id: 1,
          name: "Стандартный",
          price: 1000,
        },
        objects: [{}, {}], // 2 объекта
      },
      {
        id: 2,
        number: "DOG-2024-002",
        title: "Договор мониторинга строительной техники",
        client_name: "ООО СтройТех",
        start_date: "2024-02-01T00:00:00Z",
        end_date: "2025-01-31T23:59:59Z",
        total_amount: "180000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 60,
        tariff_plan: {
          id: 2,
          name: "Премиум",
          price: 1500,
        },
        objects: [{}], // 1 объект
      },
      {
        id: 3,
        number: "DOG-2024-003",
        title: "Договор на мониторинг автопарка такси",
        client_name: "ИП Таксистов А.В.",
        start_date: "2024-01-01T00:00:00Z",
        end_date: "2024-03-31T23:59:59Z",
        total_amount: "30000.00",
        currency: "RUB",
        status: "expired",
        is_active: false,
        notify_before: 14,
        tariff_plan: {
          id: 1,
          name: "Стандартный",
          price: 1000,
        },
        objects: [],
      },
      {
        id: 4,
        number: "DOG-2024-004",
        title: "Договор мониторинга сельхозтехники",
        client_name: "СПК Колос",
        start_date: "2024-03-01T00:00:00Z",
        end_date: "2024-12-31T23:59:59Z",
        total_amount: "90000.00",
        currency: "RUB",
        status: "draft",
        is_active: false,
        notify_before: 30,
        tariff_plan: {
          id: 1,
          name: "Стандартный",
          price: 1000,
        },
        objects: [],
      },
      {
        id: 5,
        number: "DOG-2023-015",
        title: "Договор на мониторинг курьерской службы",
        client_name: "ООО Быстрая Доставка",
        start_date: "2023-12-01T00:00:00Z",
        end_date: "2024-02-29T23:59:59Z",
        total_amount: "45000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 14,
        tariff_plan: {
          id: 2,
          name: "Премиум",
          price: 1500,
        },
        objects: [{}, {}], // 2 объекта
      },
      {
        id: 6,
        number: "DOG-2024-005",
        title: "Договор мониторинга медицинской техники",
        client_name: "ГБУ Городская больница №7",
        start_date: "2024-02-15T00:00:00Z",
        end_date: "2025-02-14T23:59:59Z",
        total_amount: "240000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 45,
        tariff_plan: {
          id: 2,
          name: "Премиум",
          price: 1500,
        },
        objects: [{}, {}], // 2 объекта
      },
      {
        id: 7,
        number: "DOG-2024-006",
        title: "Договор мониторинга коммунальной техники",
        client_name: "ГБУ Автомобильные дороги",
        start_date: "2024-01-05T00:00:00Z",
        end_date: "2024-04-30T23:59:59Z",
        total_amount: "60000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 15,
        tariff_plan: {
          id: 1,
          name: "Стандартный",
          price: 1000,
        },
        objects: [{}, {}, {}], // 3 объекта
      },
      {
        id: 8,
        number: "DOG-2023-020",
        title: "Договор мониторинга банковской инкассации",
        client_name: "ООО СБ Инкассация",
        start_date: "2023-11-01T00:00:00Z",
        end_date: "2024-02-29T23:59:59Z",
        total_amount: "180000.00",
        currency: "RUB",
        status: "active",
        is_active: true,
        notify_before: 7,
        tariff_plan: {
          id: 2,
          name: "Премиум",
          price: 1500,
        },
        objects: [{}, {}], // 2 объекта
      },
      {
        id: 9,
        number: "DOG-2024-007",
        title: "Договор мониторинга школьных автобусов",
        client_name: "ГБОУ Школа №1234",
        start_date: "2024-01-20T00:00:00Z",
        end_date: "2024-06-30T23:59:59Z",
        total_amount: "75000.00",
        currency: "RUB",
        status: "suspended",
        is_active: false,
        notify_before: 30,
        tariff_plan: {
          id: 1,
          name: "Стандартный",
          price: 1000,
        },
        objects: [{}], // 1 объект
      },
      {
        id: 10,
        number: "DOG-2024-008",
        title: "Договор мониторинга службы доставки еды",
        client_name: "ООО ЕдаВремя",
        start_date: "2024-03-10T00:00:00Z",
        end_date: "2024-09-09T23:59:59Z",
        total_amount: "84000.00",
        currency: "RUB",
        status: "draft",
        is_active: false,
        notify_before: 14,
        tariff_plan: {
          id: 1,
          name: "Стандартный",
          price: 1000,
        },
        objects: [],
      },
    ];

    contracts.value = demoContracts;
    console.log(`✅ Loaded ${contracts.value.length} demo contracts`);
    
  } catch (error) {
    console.error('❌ Error loading demo contracts:', error);
    showSnackbarMessage('Ошибка загрузки демо данных', 'error');
  } finally {
    loading.value = false;
  }
};

// Маппинг договора из API (ContractWithRelations) в локальную табличную форму.
const mapContract = (c: ContractWithRelations): Contract => ({
  id: c.id,
  number: c.number,
  title: c.title ?? '',
  client_name: c.client_name ?? '',
  start_date: c.start_date ?? '',
  end_date: c.end_date ?? '',
  total_amount: c.total_amount ?? '0',
  currency: c.currency ?? 'RUB',
  status: c.status,
  is_active: c.is_active,
  notify_before: c.notify_before ?? 0,
  partner_source: c.partner_source,
  tariff_plan: (c as any).tariff_plan,
  objects: (c as any).objects,
});

const loadContracts = async () => {
  if (demoMode.value) {
    await loadDemoContracts();
    return;
  }
  // Реальная загрузка через /auth/contracts. ?search (в т.ч. deep-link глобального
  // поиска) шлём на бэкенд (q → number/title/client_name ILIKE), чтобы нужный договор
  // точно попал в выдачу; filteredContracts ниже дофильтрует клиентски. limit высокий —
  // страница фильтрует на клиенте (skip_stats=true для скорости, объекты не нужны таблице).
  loading.value = true;
  try {
    const resp = await contractsService.getContracts({
      search: searchQuery.value?.trim() || undefined,
      limit: 1000,
      skip_stats: true,
    } as any);
    contracts.value = resp.contracts.map(mapContract);
    console.log(`✅ Loaded ${contracts.value.length} contracts`);
  } catch (e) {
    console.error('Ошибка загрузки договоров:', e);
    showSnackbarMessage('Ошибка загрузки договоров', 'error');
    contracts.value = [];
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
  console.log('Создание договора');
  showSnackbarMessage('Создание договора (в разработке)', 'info');
};

const viewContract = (contract: Contract) => {
  console.log('Просмотр договора:', contract.number);
  showSnackbarMessage(`Просмотр договора ${contract.number}`, 'info');
};

const editContract = (contract: Contract) => {
  console.log('Редактирование договора:', contract.number);
  showSnackbarMessage(`Редактирование договора ${contract.number}`, 'info');
};

const linkObjects = (contract: Contract) => {
  console.log('Привязка объектов к договору:', contract.number);
  showSnackbarMessage(`Привязка объектов к договору ${contract.number}`, 'info');
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
    return `Истекает через ${days} дн.`;
  } else {
    const days = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} дней до истечения`;
  }
};

// Lifecycle
const route = useRoute();

onMounted(async () => {
  console.log('🚀 Contracts page mounted');
  // Глобальный поиск шлёт ?search=<term>: применяем как фильтр.
  if (typeof route.query.search === 'string' && route.query.search) {
    searchQuery.value = route.query.search;
  }
  // Загружаем договоры: demo (если включён) или реальные через /auth/contracts.
  await loadContracts();
});
</script>

<style scoped>
.contracts-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
}

.page-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-icon {
  color: rgb(var(--v-theme-primary));
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
}

.page-subtitle {
  font-size: 16px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 4px 0 0 0;
}

.page-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.demo-alert {
  margin-bottom: 24px;
}

.alert-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
}

.alert-text {
  font-size: 14px;
}

.stats-section {
  margin-bottom: 24px;
}

.stat-card {
  height: 110px;
  min-height: 110px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin: 4px 0;
  line-height: 1.2;
}

.stat-value-small {
  font-size: 18px;
  font-weight: 600;
  margin: 4px 0;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filters-card {
  margin-bottom: 24px;
}

.contracts-table {
  --v-table-row-height: 72px;
}

.contract-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 2px;
}

.contract-client {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.amount-value {
  font-weight: 600;
  font-family: 'SF Mono', monospace;
}

.actions-cell {
  display: flex;
  gap: 4px;
}

.empty-state {
  margin-top: 40px;
}

/* Responsive */
@media (max-width: 768px) {
  .contracts-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-actions {
    justify-content: stretch;
  }

  .stat-card {
    height: 90px;
    min-height: 90px;
  }

  .stat-value {
    font-size: 24px;
  }

  .stat-value-small {
    font-size: 16px;
  }

  .stat-label {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .contracts-page {
    padding: 12px;
  }

  .stat-card {
    height: 80px;
    min-height: 80px;
  }

  .stat-value {
    font-size: 20px;
  }

  .stat-value-small {
    font-size: 14px;
  }

  .stat-label {
    font-size: 10px;
  }
}
</style>
