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
          <template v-if="contractTariffsMap.get(item.id)?.count > 1">
            <!-- Несколько тарифов -->
            <v-tooltip location="top">
              <template #activator="{ props }">
                <v-chip 
                  size="small" 
                  color="warning" 
                  variant="tonal" 
                  v-bind="props"
                >
                  <v-icon size="x-small" class="mr-1">mdi-layers-triple</v-icon>
                  {{ contractTariffsMap.get(item.id)?.count }} тарифа
                </v-chip>
              </template>
              <div class="pa-2">
                <div class="text-subtitle-2 mb-2">Активные тарифы:</div>
                <div 
                  v-for="(plan, index) in contractTariffsMap.get(item.id)?.uniquePlans" 
                  :key="plan.id"
                  class="mb-1"
                >
                  <strong>{{ index + 1 }}.</strong> {{ plan.name }} 
                  <span class="text-caption">({{ formatCurrency(plan.price || 0) }}/мес)</span>
                </div>
              </div>
            </v-tooltip>
          </template>
          <template v-else-if="contractTariffsMap.get(item.id)?.count === 1">
            <!-- Один тариф из подписки -->
            <v-chip size="small" color="primary" variant="tonal">
              {{ contractTariffsMap.get(item.id)?.uniquePlans[0]?.name }}
            </v-chip>
            <div class="text-caption">
              {{ formatCurrency(contractTariffsMap.get(item.id)?.uniquePlans[0]?.price || 0) }}/мес
            </div>
          </template>
          <template v-else>
            <!-- Нет активных подписок - не показываем тариф -->
            <v-chip size="small" color="grey" variant="tonal">
              Не указан
            </v-chip>
            <div class="text-caption text-grey">
              Нет подписок
            </div>
          </template>
        </template>

        <!-- Период -->
        <template #item.period="{ item }">
          <v-tooltip location="top">
            <template #activator="{ props }">
              <div v-bind="props" style="cursor: help;">
                <!-- Если нет активных подписок, не показываем период -->
                <div v-if="contractTariffsMap.get(item.id)?.count === 0 || !contractTariffsMap.get(item.id)">
                  <v-chip size="small" color="grey" variant="tonal">
                    Не указан
                  </v-chip>
                  <div class="text-caption text-grey">
                    Нет подписок
                  </div>
                </div>
                <!-- Если период не установлен, показываем чип -->
                <div v-else-if="!item.start_date && !item.end_date">
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
          <div class="text-center">
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
            
            <v-menu location="bottom end">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-dots-vertical"
                  size="small"
                  variant="text"
                />
              </template>
              <v-list density="compact">
                <v-list-item @click="editContract(item)">
                  <template #prepend>
                    <v-icon icon="mdi-pencil" size="small" />
                  </template>
                  <v-list-item-title>Редактировать</v-list-item-title>
                </v-list-item>
                
                <v-list-item @click="deleteContract(item)">
                  <template #prepend>
                    <v-icon icon="mdi-delete" size="small" color="error" />
                  </template>
                  <v-list-item-title class="text-error">Удалить</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
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

    <!-- Диалог детализации расчета стоимости -->
    <v-dialog v-model="billingBreakdownDialog" max-width="1200px" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between pa-4">
          <div class="d-flex align-center">
            <v-icon icon="mdi-calculator" class="mr-3" color="primary" />
            <div>
              <div class="text-h6">Детализация расчета стоимости</div>
              <div v-if="currentContractForBreakdown" class="text-caption text-grey">
                Договор {{ currentContractForBreakdown.number }} • {{ currentContractForBreakdown.client_name }}
              </div>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="billingBreakdownDialog = false" />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-0">
          <!-- Загрузка -->
          <div v-if="billingBreakdownLoading" class="text-center pa-8">
            <v-progress-circular indeterminate color="primary" size="64" />
            <div class="mt-4 text-grey">Загрузка данных...</div>
          </div>

          <!-- Данные -->
          <div v-else-if="billingBreakdownData">
            <!-- Общая информация о договоре -->
            <v-card variant="flat" class="ma-4 mb-2" color="blue-lighten-5">
              <v-card-text class="pa-4">
                <v-row>
                  <v-col cols="12" md="3">
                    <div class="text-caption text-grey mb-1">Период договора</div>
                    <div class="text-body-1 font-weight-medium">
                      {{ formatDate(billingBreakdownData.contract.start_date) }} - 
                      {{ formatDate(billingBreakdownData.contract.end_date) }}
                    </div>
                  </v-col>
                  <v-col cols="12" md="3">
                    <div class="text-caption text-grey mb-1">Всего месяцев</div>
                    <div class="text-h6 font-weight-bold">
                      {{ billingBreakdownData.summary.months_count }}
                    </div>
                  </v-col>
                  <v-col cols="12" md="3">
                    <div class="text-caption text-grey mb-1">Оплачено</div>
                    <div class="text-h6 font-weight-bold text-success">
                      {{ formatCurrency(billingBreakdownData.summary.total_paid) }}
                    </div>
                  </v-col>
                  <v-col cols="12" md="3">
                    <div class="text-caption text-grey mb-1">К оплате</div>
                    <div class="text-h6 font-weight-bold text-warning">
                      {{ formatCurrency(billingBreakdownData.summary.total_future) }}
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Разбивка по месяцам -->
            <div class="px-4 pb-4">
              <div class="text-subtitle-1 font-weight-medium mb-3">Разбивка по месяцам</div>
              
              <v-expansion-panels variant="accordion" multiple>
                <v-expansion-panel
                  v-for="(month, index) in billingBreakdownData.monthly_charges"
                  :key="index"
                  :class="month.is_completed ? 'completed-month' : 'future-month'"
                >
                  <v-expansion-panel-title>
                    <div class="d-flex align-center justify-space-between" style="width: 100%;">
                      <div class="d-flex align-center">
                        <v-icon 
                          :icon="month.is_completed ? 'mdi-check-circle' : 'mdi-clock-outline'" 
                          :color="month.is_completed ? 'success' : 'warning'"
                          class="mr-3"
                          size="small"
                        />
                        <div>
                          <div class="font-weight-medium">{{ month.month_name }}</div>
                          <div class="text-caption text-grey">
                            {{ month.subscriptions.length }} подписок
                          </div>
                        </div>
                      </div>
                      <v-chip 
                        :color="month.is_completed ? 'success' : 'warning'"
                        variant="flat"
                        size="small"
                        class="mr-4"
                      >
                        {{ formatCurrency(month.total_amount) }}
                      </v-chip>
                    </div>
                  </v-expansion-panel-title>

                  <v-expansion-panel-text>
                    <v-table density="compact" class="breakdown-table">
                      <thead>
                        <tr>
                          <th class="text-left">Тариф</th>
                          <th class="text-left">Период</th>
                          <th class="text-center">Объекты</th>
                          <th class="text-left">Расчет</th>
                          <th class="text-right">Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(sub, subIndex) in month.subscriptions" :key="subIndex">
                          <td>
                            <div class="font-weight-medium">{{ sub.plan_name }}</div>
                          </td>
                          <td>
                            <v-chip size="x-small" :color="getBillingPeriodColor(sub.billing_period)">
                              {{ getBillingPeriodLabel(sub.billing_period) }}
                            </v-chip>
                          </td>
                          <td class="text-center">
                            <v-chip size="x-small" variant="outlined">
                              {{ sub.objects_count }}
                            </v-chip>
                          </td>
                          <td>
                            <span class="text-caption text-grey">
                              {{ sub.description }}
                            </span>
                          </td>
                          <td class="text-right font-weight-medium">
                            {{ formatCurrency(sub.amount) }}
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>
          </div>

          <!-- Ошибка -->
          <div v-else class="text-center pa-8">
            <v-icon icon="mdi-alert-circle" color="error" size="64" />
            <div class="mt-4 text-grey">Не удалось загрузить данные</div>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="outlined" @click="billingBreakdownDialog = false">
            Закрыть
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { debounce } from 'lodash-es';
import { config } from '@/config/env';

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
const contractSubscriptions = ref<any[]>([]); // Подписки для всех договоров
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

// Диалог детализации расчета
const billingBreakdownDialog = ref(false);
const billingBreakdownLoading = ref(false);
const currentContractForBreakdown = ref<Contract | null>(null);
const billingBreakdownData = ref<any>(null);

// Заголовки таблицы (с динамической шириной для лучшей адаптации)
const headers = [
  { title: '№', key: 'sequential_number', sortable: true, width: '60px', minWidth: '50px', align: 'center' },
  { title: 'Дата', key: 'created_at', sortable: true, width: '110px', minWidth: '100px', align: 'center' },
  { title: 'Номер', key: 'number', sortable: true, width: '130px', minWidth: '110px', align: 'center' },
  { title: 'Клиент', key: 'title', sortable: true, width: 'auto', minWidth: '150px', align: 'center' },
  { title: 'Тариф', key: 'tariff_plan', sortable: false, width: '150px', minWidth: '130px', align: 'center' },
  { title: 'Период', key: 'period', sortable: false, width: '160px', minWidth: '140px', align: 'center' },
  { title: 'Сумма', key: 'total_amount', sortable: true, width: '130px', minWidth: '110px', align: 'center' },
  { title: 'Статус', key: 'status', sortable: true, width: '120px', minWidth: '100px', align: 'center' },
  { title: 'Действия', key: 'actions', sortable: false, width: '180px', minWidth: '160px', align: 'center' },
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
  const objectsCount = contract.objects?.length || 0;
  
  if (existingAmount > 0) {
    return existingAmount;
  }

  // Если объектов нет, возвращаем 0 (независимо от наличия тарифного плана)
  if (objectsCount === 0) {
    return 0;
  }

  // Рассчитываем стоимость на основе тарифного плана и количества объектов
  if (!contract.tariff_plan || !contract.tariff_plan.price) {
    return 0;
  }

  const tariffPrice = contract.tariff_plan.price;
  return tariffPrice * objectsCount;
};

// Карта тарифов для каждого договора (из подписок)
const contractTariffsMap = computed(() => {
  const map = new Map<number, { plans: any[], uniquePlans: any[], count: number }>();
  
  contracts.value.forEach(contract => {
    // Находим все активные подписки для этого договора
    const subscriptions = contractSubscriptions.value.filter(
      sub => sub.contract_id === contract.id && 
             sub.status && 
             ['active', 'scheduled'].includes(sub.status)
    );
    
    // Собираем уникальные тарифы из подписок
    const uniquePlansMap = new Map();
    subscriptions.forEach(sub => {
      if (sub.billing_plan && sub.billing_plan.id) {
        uniquePlansMap.set(sub.billing_plan.id, sub.billing_plan);
      }
    });
    
    const uniquePlans = Array.from(uniquePlansMap.values());
    
    const info = {
      plans: subscriptions.map(s => s.billing_plan).filter(Boolean),
      uniquePlans,
      count: uniquePlans.length
    };
    
    if (uniquePlans.length > 1) {
      console.log(`🎯 Contract ${contract.id} (${contract.number}) has ${uniquePlans.length} plans:`, 
        uniquePlans.map(p => p.name));
    }
    
    map.set(contract.id, info);
  });
  
  return map;
});

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

const calculateCost = async (contract: Contract) => {
  try {
    // Проверяем наличие приложений к договору
    const contractsService = (await import('@/services/contractsService')).default;
    const appendices = await contractsService.getContractAppendices(contract.id);
    
    // Если приложений нет, показываем информационное сообщение
    if (!appendices || appendices.length === 0) {
      showSnackbarMessage(
        'У договора еще нет приложений. Добавьте приложения к договору для расчета стоимости.',
        'info'
      );
      return;
    }
  } catch (error: any) {
    console.error('Ошибка при проверке приложений:', error);
    showSnackbarMessage('Ошибка при проверке приложений к договору', 'error');
    return;
  }

  currentContractForBreakdown.value = contract;
  billingBreakdownDialog.value = true;
  billingBreakdownLoading.value = true;
  billingBreakdownData.value = null;

  try {
    const token = localStorage.getItem('axenta_token');
    const companyData = localStorage.getItem('axenta_company');
    
    if (!token) {
      throw new Error('Отсутствует токен авторизации');
    }

    let companyId = null;
    if (companyData) {
      try {
        const company = JSON.parse(companyData);
        companyId = company.id;
      } catch (e) {
        console.error('Ошибка парсинга данных компании:', e);
      }
    }

    if (!companyId) {
      throw new Error('Отсутствует ID компании');
    }

    const response = await fetch(
      `${config.apiBaseUrl}/auth/billing/contracts/${contract.id}/breakdown`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': companyId,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Ошибка при загрузке детализации расчета');
    }

    const result = await response.json();
    
    if (result.status === 'success') {
      billingBreakdownData.value = result.data;
    } else {
      throw new Error(result.error || 'Неизвестная ошибка');
    }
  } catch (error: any) {
    console.error('Ошибка при загрузке детализации расчета:', error);
    showSnackbarMessage(error.message || 'Ошибка при загрузке детализации расчета', 'error');
    billingBreakdownDialog.value = false;
  } finally {
    billingBreakdownLoading.value = false;
  }
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

const getBillingPeriodLabel = (period: string): string => {
  const labels: Record<string, string> = {
    hourly: 'Часовой',
    daily: 'Дневной',
    weekly: 'Недельный',
    monthly: 'Месячный',
    yearly: 'Годовой',
    'one-time': 'Разовый'
  };
  return labels[period] || period;
};

const getBillingPeriodColor = (period: string): string => {
  const colors: Record<string, string> = {
    hourly: 'orange',
    daily: 'cyan',
    weekly: 'teal',
    monthly: 'blue',
    yearly: 'purple',
    'one-time': 'grey'
  };
  return colors[period] || 'blue';
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
const loadSubscriptions = async () => {
  try {
    console.log('🔄 ContractsTab: Загружаем подписки...');
    const companyData = localStorage.getItem('axenta_company');
    if (!companyData) {
      console.warn('⚠️ No company data found in localStorage');
      return;
    }
    
    const company = JSON.parse(companyData);
    const companyId = parseInt(company.id, 10);
    
    const billingService = (await import('@/services/billingService')).default;
    const subscriptions = await billingService.getSubscriptions(companyId);
    contractSubscriptions.value = subscriptions || [];
    console.log(`✅ ContractsTab: Загружено ${subscriptions?.length || 0} подписок`);
    
    // Логируем группировку по договорам для отладки
    const byContract = contractSubscriptions.value.reduce((acc, sub) => {
      const cId = sub.contract_id;
      if (cId && sub.status && ['active', 'scheduled'].includes(sub.status)) {
        if (!acc[cId]) {
          acc[cId] = { count: 0, plans: [] };
        }
        acc[cId].count++;
        if (sub.billing_plan) {
          acc[cId].plans.push(sub.billing_plan.name);
        }
      }
      return acc;
    }, {} as Record<number, { count: number, plans: string[] }>);
    
    // Показываем только договоры с несколькими тарифами
    const multiPlans = Object.entries(byContract).filter(([_, data]) => data.count > 1);
    if (multiPlans.length > 0) {
      console.log('🎯 Contracts with multiple plans:', 
        Object.fromEntries(multiPlans)
      );
    }
  } catch (error) {
    console.error('❌ Error loading subscriptions:', error);
    contractSubscriptions.value = [];
  }
};

const loadContracts = async () => {
  console.log('🔄 ContractsTab: Начинаем загрузку договоров...');
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
    console.log(`✅ ContractsTab: Загружено ${contracts.value.length} договоров`);
    
    // Логируем данные первого договора для отладки
    if (contracts.value.length > 0) {
      const firstContract = contracts.value[0];
      console.log('📋 Первый договор:', {
        id: firstContract.id,
        number: firstContract.number,
        total_amount: firstContract.total_amount,
        objects_count: firstContract.objects?.length || 0,
        objects: firstContract.objects
      });
    }
    
    // Загружаем подписки для определения тарифов
    await loadSubscriptions();
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
  text-align: center !important;
}

.contracts-table :deep(td) {
  padding: 8px 16px !important;
  vertical-align: middle;
  text-align: center !important;
}

/* Оптимизация колонок для лучшего отображения */
.contracts-table :deep(th:first-child),
.contracts-table :deep(td:first-child) {
  padding-left: 16px !important;
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
  text-align: center;
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
  text-align: center;
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
  justify-content: center;
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

/* Стили для диалога детализации расчета */
.completed-month {
  background-color: rgba(76, 175, 80, 0.05);
}

.future-month {
  background-color: rgba(255, 152, 0, 0.05);
}

[data-theme="dark"] .completed-month {
  background-color: rgba(76, 175, 80, 0.1);
}

[data-theme="dark"] .future-month {
  background-color: rgba(255, 152, 0, 0.1);
}

.v-expansion-panel-title {
  min-height: 64px !important;
}

.v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
  padding: 16px;
}

.breakdown-table {
  background: transparent !important;
}

.breakdown-table th {
  font-weight: 600 !important;
  font-size: 0.75rem !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(0, 0, 0, 0.6) !important;
  padding: 12px 16px !important;
}

[data-theme="dark"] .breakdown-table th {
  color: rgba(255, 255, 255, 0.6) !important;
}

.breakdown-table td {
  padding: 12px 16px !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06) !important;
}

[data-theme="dark"] .breakdown-table td {
  border-bottom-color: rgba(255, 255, 255, 0.06) !important;
}

.breakdown-table tbody tr:last-child td {
  border-bottom: none !important;
}
</style>
