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
            <!-- Кнопка автопилота -->
            <div class="filter-autopilot">
              <v-tooltip location="top" :disabled="false">
                <template #activator="{ props }">
                  <!-- Оборачиваем в span, чтобы tooltip работал на disabled кнопке -->
                  <span v-bind="props">
                    <v-btn
                      icon="mdi-robot"
                      color="secondary"
                      variant="flat"
                      @click="startAutopilot"
                      class="autopilot-button"
                      :disabled="!autopilotEnabled"
                    />
                  </span>
                </template>
                <div style="max-width: 280px; padding: 4px;">
                  <div class="text-body-2 font-weight-medium mb-2">
                    Запустить Автопилот
                  </div>
                  <div class="text-caption">
                    Автоматизация полного цикла: создание договора → подписка → счет → отправка клиенту
                  </div>
                  <div v-if="!autopilotEnabled" class="text-caption mt-2 text-warning">
                    Автопилот отключен в настройках
                  </div>
                </div>
              </v-tooltip>
            </div>
              
              <div class="filter-create">
                <v-tooltip location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-plus"
                      color="primary"
                      variant="flat"
                      @click="createContract"
                      class="create-button"
                    />
                  </template>
                  <span>Создать договор</span>
                </v-tooltip>
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
    <v-card variant="outlined" v-if="filteredContracts.length > 0">
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
        <!-- Порядковый номер -->
        <template #item.sequential_number="{ index }">
          <div class="sequential-number">
            {{ index + 1 }}
          </div>
        </template>

        <!-- Дата создания -->
        <template #item.created_at="{ item }">
          <div class="created-date">
            {{ formatDate(item.created_at) }}
          </div>
        </template>

        <!-- Номер договора -->
        <template #item.number="{ item }">
          <v-chip 
            size="small" 
            :color="getStatusColor(item.status)"
            variant="tonal"
            style="cursor: pointer;"
            @click="navigateToSubscriptions(item)"
          >
            {{ item.number }}
          </v-chip>
        </template>

        <!-- Клиент -->
        <template #item.title="{ item }">
          <div class="contract-client">{{ item.client_short_name || item.client_name }}</div>
        </template>

        <!-- Тарифный план -->
        <template #item.tariff_plan="{ item }">
          <v-tooltip location="top">
            <template #activator="{ props }">
              <div v-bind="props" style="cursor: help;">
                <v-chip size="small" color="primary" variant="tonal">
                  {{ item.tariff_plan?.name || 'Не указан' }}
                </v-chip>
                <div class="text-caption">
                  {{ formatCurrency(item.tariff_plan?.price || 0) }}/мес
                </div>
              </div>
            </template>
            <template #default>
              <div class="tariff-tooltip">
                <div class="tariff-tooltip-title">Информация о тарифе:</div>
                <div class="tariff-tooltip-content">
                  <div v-if="item.tariff_plan">
                    <strong>{{ item.tariff_plan.name }}</strong>
                    <div class="mt-1">Стоимость: {{ formatCurrency(item.tariff_plan.price) }}/мес</div>
                  </div>
                  <div v-else>
                    Тарифный план не установлен. Он будет установлен при создании подписки.
                  </div>
                </div>
              </div>
            </template>
          </v-tooltip>
        </template>

        <!-- Период -->
        <template #item.period="{ item }">
          <v-tooltip location="top">
            <template #activator="{ props }">
              <div v-bind="props" style="cursor: help;">
                <!-- Если период не установлен, показываем чип -->
                <div v-if="!item.start_date && !item.end_date">
                  <v-chip size="small" color="info" variant="tonal">
                    Не указан
                  </v-chip>
                  <div class="text-caption text-grey">
                    Период не установлен
                  </div>
                </div>
                <!-- Если период установлен, показываем даты -->
                <div v-else>
                  <div class="text-body-2">
                    {{ formatPeriod(item.start_date, item.end_date) }}
                  </div>
                  <div class="text-caption" :class="getPeriodClass(item)">
                    {{ getPeriodText(item) }}
                  </div>
                </div>
              </div>
            </template>
            <template #default>
              <div class="period-tooltip">
                <div class="period-tooltip-title">Статус договора:</div>
                <div class="period-tooltip-content">
                  {{ getPeriodTooltipText(item) }}
                </div>
              </div>
            </template>
          </v-tooltip>
        </template>

        <!-- Стоимость -->
        <template #item.total_amount="{ item }">
          <div class="text-right">
            <div class="amount-value">
              {{ formatCurrency(calculateContractAmount(item), item.currency) }}
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
                      <span v-if="obj.name">
                        <strong>{{ obj.name }}</strong>
                        <span v-if="obj.name !== `Объект #${obj.id}`" class="objects-tooltip-id">(ID: {{ obj.id }})</span>
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
            
            <v-tooltip text="Редактировать">
              <template #activator="{ props }">
                <v-btn 
                  v-bind="props"
                  icon="mdi-pencil" 
                  size="small" 
                  variant="text" 
                  color="primary"
                  @click="editContract(item)"
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
            
            <v-tooltip text="Удалить">
              <template #activator="{ props }">
                <v-btn 
                  v-bind="props"
                  icon="mdi-delete" 
                  size="small" 
                  variant="text" 
                  color="error"
                  @click="deleteContract(item)"
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
  sequential_number?: number; // Порядковый номер договора
  created_at?: string; // Дата создания
  title: string;
  client_name: string;
  client_short_name?: string; // Сокращенное название с ОПФ (для организаций)
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

// Автопилот
const autopilotEnabled = ref(false);

// Заголовки таблицы (с динамической шириной для лучшей адаптации)
const headers = [
  { title: '№', key: 'sequential_number', sortable: true, width: '60px', minWidth: '50px' },
  { title: 'Дата', key: 'created_at', sortable: true, width: '110px', minWidth: '100px' },
  { title: 'Номер', key: 'number', sortable: true, width: '130px', minWidth: '110px' },
  { title: 'Клиент', key: 'title', sortable: true, width: 'auto', minWidth: '150px' },
  { title: 'Тариф', key: 'tariff_plan', sortable: false, width: '150px', minWidth: '130px' },
  { title: 'Период', key: 'period', sortable: false, width: '160px', minWidth: '140px' },
  { title: 'Сумма', key: 'total_amount', sortable: true, width: '130px', minWidth: '110px', align: 'end' },
  { title: 'Статус', key: 'status', sortable: true, width: '120px', minWidth: '100px' },
  { title: 'Действия', key: 'actions', sortable: false, width: '180px', minWidth: '160px', align: 'end' },
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
      contract.client_name.toLowerCase().includes(query) ||
      (contract.client_short_name && contract.client_short_name.toLowerCase().includes(query))
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

// Функция для расчета стоимости договора
const calculateContractAmount = (contract: Contract): number => {
  // Если у договора уже есть заполненная стоимость (не 0), используем её
  const existingAmount = parseFloat(contract.total_amount || '0');
  if (existingAmount > 0) {
    return existingAmount;
  }

  // Рассчитываем стоимость на основе тарифного плана и объектов
  if (!contract.tariff_plan || !contract.tariff_plan.price) {
    return 0;
  }

  const tariffPrice = contract.tariff_plan.price;
  const objectsCount = contract.objects?.length || 0;

  // Если есть объекты, рассчитываем стоимость: цена тарифа * количество объектов
  // Если объектов нет, используем базовую цену тарифа
  if (objectsCount > 0) {
    return tariffPrice * objectsCount;
  } else {
    // Если объектов нет, но есть тариф, используем базовую цену тарифа
    return tariffPrice;
  }
};

const stats = computed(() => {
  const total = contracts.value.length;
  const active = contracts.value.filter(c => c.status === 'active').length;
  const expired = contracts.value.filter(c => c.status === 'expired').length;
  const expiring_soon = contracts.value.filter(c => isExpiringSoon(c)).length;
  
  // Используем автоматический расчет стоимости для каждого договора
  const total_amount = contracts.value.reduce((sum, c) => {
    const calculatedAmount = calculateContractAmount(c);
    return sum + calculatedAmount;
  }, 0);

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
  demoMode.value = true;
  await loadDemoContracts();
  showSnackbarMessage('Демо режим договоров включен', 'success');
};

const disableDemoMode = async () => {
  demoMode.value = false;
  contracts.value = [];
  showSnackbarMessage('Демо режим договоров выключен', 'info');
  await loadContracts();
};

const loadDemoContracts = async () => {
  loading.value = true;
  
  try {
    const demoContracts: Contract[] = [
      {
        id: 1,
        number: "DOG-2024-001",
        sequential_number: 1,
        created_at: "2024-01-01T00:00:00Z",
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
        sequential_number: 2,
        created_at: "2024-02-01T00:00:00Z",
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
        sequential_number: 3,
        created_at: "2024-01-15T00:00:00Z",
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
        sequential_number: 4,
        created_at: "2024-03-01T00:00:00Z",
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
        sequential_number: 5,
        created_at: "2023-12-01T00:00:00Z",
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
        sequential_number: 6,
        created_at: "2024-02-15T00:00:00Z",
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
        sequential_number: 7,
        created_at: "2024-01-05T00:00:00Z",
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
        sequential_number: 8,
        created_at: "2023-11-01T00:00:00Z",
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
    
  } catch (error) {
    console.error('Ошибка загрузки демо данных:', error);
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

const startAutopilot = () => {
  if (!autopilotEnabled.value) {
    showSnackbarMessage('Автопилот отключен. Включите его в настройках биллинга.', 'warning');
    return;
  }
  // Запускаем автопилот - переходим на страницу создания договора с флагом autopilot=true
  router.push({
    path: '/contracts/create',
    query: { autopilot: 'true' }
  });
  showSnackbarMessage('Автопилот запущен. Создайте договор для начала работы.', 'info');
};

const viewContract = (contract: Contract) => {
  showSnackbarMessage(`Просмотр договора ${contract.number}`, 'info');
};

const editContract = (contract: Contract) => {
  router.push({
    name: 'EditContract',
    params: { id: contract.id }
  });
};

// Навигация к подпискам по договору
const navigateToSubscriptions = (contract: Contract) => {
  // Переход на страницу биллинга с вкладкой "Подписки" и фильтром по contract_id
  router.push({
    path: '/billing',
    query: {
      tab: 'subscriptions',
      contract_id: contract.id.toString(),
      contract_number: contract.number
    }
  });
};

const viewInvoices = (contract: Contract) => {
  showSnackbarMessage(`Счета по договору ${contract.number}`, 'info');
  // Здесь можно переключиться на вкладку "Счета" с фильтром по договору
};

const calculateCost = (contract: Contract) => {
  const objectsCount = contract.objects?.length || 0;
  const monthlyPrice = contract.tariff_plan?.price || 0;
  const message = `Договор ${contract.number}: ${objectsCount} объектов × ${formatCurrency(monthlyPrice)}/мес`;
  showSnackbarMessage(message, 'info');
};


const deleteContract = async (contract: Contract) => {
  if (!confirm(`Вы уверены, что хотите удалить договор ${contract.number}?`)) {
    return;
  }

  try {
    const contractsService = (await import('@/services/contractsService')).default;
    await contractsService.deleteContract(contract.id);
    await loadContracts();
    showSnackbarMessage('Договор успешно удален', 'success');
  } catch (error) {
    console.error('Error deleting contract:', error);
    showSnackbarMessage('Ошибка удаления договора', 'error');
  }
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

const formatDate = (date: string | null | undefined): string => {
  if (!date) {
    return 'Не указан';
  }
  const dateObj = new Date(date);
  // Проверяем, является ли дата валидной и не является ли она "эпохой Unix" (01.01.1970)
  if (isNaN(dateObj.getTime()) || dateObj.getFullYear() === 1970) {
    return 'Не указан';
  }
  return dateObj.toLocaleDateString('ru-RU');
};

// Функция для форматирования периода (начало - конец)
const formatPeriod = (startDate: string | null | undefined, endDate: string | null | undefined): string => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  // Если обе даты не указаны, показываем просто "Не указан"
  if (start === 'Не указан' && end === 'Не указан') {
    return 'Не указан';
  }
  
  // Если указаны обе даты, показываем период
  if (start !== 'Не указан' && end !== 'Не указан') {
    return `${start} - ${end}`;
  }
  
  // Если указана только одна дата
  if (start !== 'Не указан') {
    return `${start} - Не указан`;
  }
  
  return `Не указан - ${end}`;
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
  // Если дата окончания не указана или невалидна, не применяем стиль
  if (!contract.end_date) {
    return 'text-grey';
  }
  
  const endDate = new Date(contract.end_date);
  
  // Проверяем, что дата валидна и не является эпохой Unix
  if (isNaN(endDate.getTime()) || endDate.getFullYear() === 1970) {
    return 'text-grey';
  }
  
  const now = new Date();
  
  if (now > endDate) {
    return 'text-error';
  } else if (isExpiringSoon(contract)) {
    return 'text-warning';
  } else {
    return 'text-success';
  }
};

const getPeriodText = (contract: Contract): string => {
  // Если дата окончания не указана или невалидна, показываем "Не указан"
  if (!contract.end_date) {
    return 'Период не установлен';
  }
  
  const endDate = new Date(contract.end_date);
  
  // Проверяем, что дата валидна и не является эпохой Unix
  if (isNaN(endDate.getTime()) || endDate.getFullYear() === 1970) {
    return 'Период не установлен';
  }
  
  const now = new Date();
  
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

const getPeriodTooltipText = (contract: Contract): string => {
  // Если дата окончания не указана или невалидна
  if (!contract.end_date) {
    return 'Период действия договора не установлен. Он будет установлен при создании подписки.';
  }
  
  const endDate = new Date(contract.end_date);
  
  // Проверяем, что дата валидна и не является эпохой Unix
  if (isNaN(endDate.getTime()) || endDate.getFullYear() === 1970) {
    return 'Период действия договора не установлен. Он будет установлен при создании подписки.';
  }
  
  const now = new Date();
  
  if (now > endDate) {
    const days = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
    return `Договор истек ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'} назад`;
  } else if (isExpiringSoon(contract)) {
    const days = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `Договор истекает через ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}. Требуется продление.`;
  } else {
    const days = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `Договор активен. До истечения осталось ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`;
  }
};

// Загрузка реальных договоров
const loadContracts = async () => {
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
  } catch (error) {
    console.error('Ошибка загрузки договоров:', error);
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

// Загрузка настроек биллинга для проверки статуса автопилота
const loadBillingSettings = async () => {
  try {
    const billingService = (await import('@/services/billingService')).default;
    const companyStr = localStorage.getItem('axenta_company');
    if (companyStr) {
      const companyData = JSON.parse(companyStr);
      const companyId = companyData.id || companyData.ID;
      if (companyId) {
        const settings = await billingService.getBillingSettings(Number(companyId));
        autopilotEnabled.value = settings.autopilot_enabled || false;
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки настроек биллинга:', error);
  }
};

// Lifecycle
onMounted(async () => {
  await loadBillingSettings();
  if (demoMode.value) {
    await loadDemoContracts();
  } else {
    await loadContracts();
  }
});

// Экспортируем метод для обновления данных извне
defineExpose({
  loadContracts,
  refresh: loadContracts // Алиас для удобства
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
.filter-autopilot :deep(.v-btn),
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

/* Специальные стили для кнопки Автопилот */
.autopilot-button {
  box-shadow: 0 2px 8px rgba(156, 39, 176, 0.3) !important;
  transition: all 0.2s ease !important;
}

.autopilot-button:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(156, 39, 176, 0.4) !important;
  transform: translateY(-1px) !important;
}

.autopilot-button:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

.autopilot-button :deep(.v-icon) {
  color: white !important;
  font-size: 20px !important;
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

.filter-autopilot :deep(.v-btn .v-icon),
.filter-create :deep(.v-btn .v-icon),
.filter-clear :deep(.v-btn .v-icon) {
  font-size: 20px !important;
}

.filter-autopilot :deep(.v-btn .v-btn__content),
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
    justify-content: flex-end;
    gap: 6px;
  }
  
  .filter-autopilot,
  .filter-create,
  .filter-clear {
    min-width: 44px !important;
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

/* Улучшенная адаптивность таблицы */
.contracts-table :deep(.v-data-table__wrapper) {
  overflow-x: auto;
}

.contracts-table :deep(table) {
  min-width: 1000px;
  table-layout: auto;
}

.contracts-table :deep(th) {
  white-space: nowrap;
  font-weight: 600;
  font-size: 0.8125rem;
  padding: 12px 16px !important;
}

.contracts-table :deep(td) {
  padding: 8px 16px !important;
  vertical-align: middle;
}

/* Оптимизация колонок для лучшего отображения */
.contracts-table :deep(th:first-child),
.contracts-table :deep(td:first-child) {
  padding-left: 16px !important;
  text-align: center;
}

.contracts-table :deep(th:last-child),
.contracts-table :deep(td:last-child) {
  padding-right: 16px !important;
}

/* Responsive: скрытие некоторых колонок на малых экранах */
@media (max-width: 1400px) {
  .contracts-table :deep(th:nth-child(2)),
  .contracts-table :deep(td:nth-child(2)) {
    display: none; /* Скрываем колонку "Дата" на средних экранах */
  }
}

@media (max-width: 1200px) {
  .contracts-table :deep(th:nth-child(5)),
  .contracts-table :deep(td:nth-child(5)) {
    display: none; /* Скрываем колонку "Тариф" на малых экранах */
  }
}

@media (max-width: 960px) {
  .contracts-table :deep(table) {
    min-width: 700px;
  }
  
  .contracts-table :deep(th:nth-child(6)),
  .contracts-table :deep(td:nth-child(6)) {
    display: none; /* Скрываем колонку "Период" на планшетах */
  }
}

.contract-title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 2px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contract-client {
  font-size: 13px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.4;
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sequential-number {
  font-weight: 600;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  text-align: center;
}

.created-date {
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.7);
  white-space: nowrap;
}

.amount-value {
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  white-space: nowrap;
}

.actions-cell {
  display: flex;
  gap: 2px;
  justify-content: flex-end;
  align-items: center;
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

/* Стили для tooltip периода */
.period-tooltip {
  max-width: 250px;
  padding: 4px 0;
}

.period-tooltip-title {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 4px;
  color: rgba(0, 0, 0, 0.87);
}

.period-tooltip-content {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1.4;
}

[data-theme="dark"] .period-tooltip-title {
  color: rgba(255, 255, 255, 0.87);
}

[data-theme="dark"] .period-tooltip-content {
  color: rgba(255, 255, 255, 0.7);
}

/* Стили для tooltip тарифа */
.tariff-tooltip {
  max-width: 280px;
  padding: 4px 0;
}

.tariff-tooltip-title {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 4px;
  color: rgba(0, 0, 0, 0.87);
}

.tariff-tooltip-content {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1.4;
}

[data-theme="dark"] .tariff-tooltip-title {
  color: rgba(255, 255, 255, 0.87);
}

[data-theme="dark"] .tariff-tooltip-content {
  color: rgba(255, 255, 255, 0.7);
}

/* Улучшенные hover-эффекты для строк таблицы */
.contracts-table :deep(tbody tr) {
  transition: background-color 0.2s ease, transform 0.1s ease;
  cursor: pointer;
}

.contracts-table :deep(tbody tr:hover) {
  background-color: rgba(25, 118, 210, 0.04) !important;
}

[data-theme="dark"] .contracts-table :deep(tbody tr:hover) {
  background-color: rgba(0, 122, 255, 0.08) !important;
}

/* Анимация для ячеек */
.contracts-table :deep(td) {
  transition: padding 0.2s ease;
}

/* Стили для скроллбара */
.contracts-table :deep(.v-data-table__wrapper)::-webkit-scrollbar {
  height: 8px;
}

.contracts-table :deep(.v-data-table__wrapper)::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.contracts-table :deep(.v-data-table__wrapper)::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  transition: background 0.2s ease;
}

.contracts-table :deep(.v-data-table__wrapper)::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .contracts-table :deep(.v-data-table__wrapper)::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

[data-theme="dark"] .contracts-table :deep(.v-data-table__wrapper)::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

[data-theme="dark"] .contracts-table :deep(.v-data-table__wrapper)::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

[data-theme="dark"] .sequential-number {
  color: rgba(255, 255, 255, 0.6);
}

[data-theme="dark"] .created-date {
  color: rgba(255, 255, 255, 0.7);
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
