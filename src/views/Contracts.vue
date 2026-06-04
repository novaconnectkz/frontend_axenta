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
        <AppleButton v-if="!demoMode" variant="secondary" prepend-icon="mdi-play-circle" @click="enableDemoMode"
          color="success">
          Демо режим
        </AppleButton>
        <AppleButton v-else variant="secondary" prepend-icon="mdi-stop-circle" @click="disableDemoMode" color="warning">
          Выйти из демо
        </AppleButton>
        <AppleButton variant="secondary" prepend-icon="mdi-clock-alert" @click="showExpiringContracts"
          :loading="loadingExpiring">
          Истекающие договоры
        </AppleButton>
        <AppleButton variant="secondary" prepend-icon="mdi-export" @click="exportContracts" :loading="exporting">
          Экспорт
        </AppleButton>
        <AppleButton prepend-icon="mdi-plus" @click="openCreateDialog">
          Создать договор
        </AppleButton>
      </div>
    </div>

    <!-- Уведомление о демо режиме -->
    <v-alert v-if="demoMode" type="info" variant="tonal" prominent border="start" class="demo-alert">
      <template #prepend>
        <v-icon icon="mdi-play-circle" size="24" />
      </template>
      <div class="alert-content">
        <div class="alert-title">Демонстрационный режим</div>
        <div class="alert-text">
          Отображаются демо данные. Это позволяет увидеть, как будет выглядеть интерфейс управления договорами.
          Все изменения в демо режиме не сохраняются.
        </div>
      </div>
    </v-alert>

    <!-- Статистика -->
    <div class="stats-section">
      <div class="stats-grid">
        <AppleCard v-for="stat in stats" :key="stat.key" :title="stat.value.toString()" :subtitle="stat.label"
          :icon="stat.icon" :icon-color="stat.color" variant="outlined" class="stat-card" />
      </div>
    </div>

    <!-- Фильтры -->
    <AppleCard class="filters-card" variant="outlined">
      <template #header>
        <div class="filters-header">
          <v-icon icon="mdi-filter" class="mr-2" />
          Фильтры
          <v-spacer />
          <AppleButton variant="text" size="small" @click="clearFilters" :disabled="!hasActiveFilters">
            Очистить
          </AppleButton>
        </div>
      </template>

      <div class="filters-content">
        <v-row>
          <v-col cols="12" md="4">
            <AppleInput v-model="filters.search" placeholder="Поиск по номеру, названию, клиенту..."
              prepend-icon="mdi-magnify" clearable @input="debouncedSearch" />
          </v-col>

          <v-col cols="12" md="2">
            <v-select v-model="filters.status" :items="statusOptions" label="Статус" clearable variant="outlined"
              density="comfortable" />
          </v-col>

          <v-col cols="12" md="2">
            <v-select v-model="filters.is_active" :items="activeOptions" label="Активность" clearable variant="outlined"
              density="comfortable" />
          </v-col>

          <v-col cols="12" md="2">
            <v-checkbox v-model="filters.expiring" label="Истекающие" density="comfortable" />
          </v-col>

          <v-col cols="12" md="2">
            <v-select v-model="filters.tariff_plan_id" :items="tariffPlanOptions" label="Тарифный план" clearable
              variant="outlined" density="comfortable" :loading="loadingTariffPlans" />
          </v-col>

          <v-col cols="12" md="2">
            <v-select v-model="filters.partner_source" :items="CONTRACT_SOURCE_OPTIONS" label="GPS-система"
              clearable variant="outlined" density="comfortable" />
          </v-col>
        </v-row>
      </div>
    </AppleCard>

    <!-- Список договоров -->
    <AppleCard variant="outlined">
      <template #header>
        <div class="table-header">
          <div class="table-title">
            <v-icon icon="mdi-file-document-multiple" class="mr-2" />
            Договоры
            <v-chip v-if="filteredContracts.length > 0" size="small" class="ml-2">
              {{ filteredContracts.length }}
            </v-chip>
          </div>
          <div class="table-actions">
            <v-btn icon="mdi-refresh" size="small" variant="text" @click="loadContracts"
              :loading="loading" />
          </div>
        </div>
      </template>

      <v-data-table :headers="tableHeaders" :items="filteredContracts" :loading="loading" :items-per-page="itemsPerPage"
        :search="filters.search" class="contracts-table" no-data-text="Договоры не найдены"
        loading-text="Загрузка договоров..."         :sort-by="[{ key: 'created_at', order: 'desc' }]">
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
          <div class="contract-number">
            <v-chip size="small" :color="getContractStatusColor(item.status)" variant="tonal">
              {{ item.number }}
            </v-chip>
          </div>
        </template>

        <!-- Тип договора -->
        <template #item.contract_type="{ item }">
          <v-chip 
            v-if="item.contract_type"
            size="small" 
            :color="CONTRACT_TYPE_COLORS[item.contract_type]" 
            variant="tonal"
          >
            {{ CONTRACT_TYPE_LABELS[item.contract_type] }}
          </v-chip>
          <span v-else class="text-grey">—</span>
        </template>

        <!-- Название и клиент -->
        <template #item.title="{ item }">
          <div class="contract-info">
            <div class="contract-title">{{ item.title }}</div>
            <div class="contract-client">{{ contractDisplayName(item, '') }}</div>
          </div>
        </template>

        <!-- Тарифный план -->
        <template #item.tariff_plan="{ item }">
          <div class="tariff-info">
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
              <div class="tariff-price">
                {{ formatCurrency(contractTariffsMap.get(item.id)?.uniquePlans[0]?.price || 0) }}/мес
              </div>
            </template>
            <template v-else>
              <!-- Тариф из договора (fallback) -->
              <v-chip size="small" variant="tonal">
                {{ item.tariff_plan?.name || 'Не указан' }}
              </v-chip>
              <div class="tariff-price" v-if="item.tariff_plan?.price">
                {{ formatCurrency(item.tariff_plan?.price || 0) }}/мес
              </div>
            </template>
          </div>
        </template>

        <!-- Период действия -->
        <template #item.period="{ item }">
          <div class="period-info">
            <div class="period-dates">
              {{ formatDate(item.start_date) }} - {{ formatDate(item.end_date) }}
            </div>
            <div class="period-status" :class="getPeriodStatusClass(item)">
              {{ getPeriodStatusText(item) }}
            </div>
          </div>
        </template>

        <!-- Стоимость -->
        <template #item.total_amount="{ item }">
          <div class="amount-info">
            <!-- Для партнерских договоров показываем только количество объектов -->
            <template v-if="item.contract_type === 'partner'">
              <div class="amount-value">
                {{ item.objects?.length || 0 }} объектов
              </div>
            </template>
            <!-- Для клиентских договоров показываем стоимость и количество объектов -->
            <template v-else>
              <div class="amount-value">
                {{ formatCurrency(item.total_amount, item.currency) }}
              </div>
              <div class="amount-objects">
                {{ item.objects?.length || 0 }} объектов
              </div>
            </template>
          </div>
        </template>

        <!-- Статус -->
        <template #item.status="{ item }">
          <v-chip :color="getContractStatusColor(item.status)" size="small" variant="tonal">
            {{ getContractStatusLabel(item.status) }}
          </v-chip>
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="actions-cell">
            <v-btn icon="mdi-eye" size="small" variant="text" @click="viewContract(item)" />
            <v-btn icon="mdi-pencil" size="small" variant="text" @click="editContract(item)" />
            <v-btn icon="mdi-link" size="small" variant="text" @click="openObjectsDialog(item)" />
            <v-btn icon="mdi-calculator" size="small" variant="text" @click="calculateCost(item)" />
            <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="deleteContract(item)" />
          </div>
        </template>
      </v-data-table>
    </AppleCard>

    <!-- Диалоги -->
    <ContractDialog v-model="showContractDialog" :contract="selectedContract" :tariff-plans="tariffPlans"
      @success="onContractSuccess" @error="showSnackbar($event, 'error')" />

    <ContractViewDialog v-model="showViewDialog" :contract="selectedContract" @edit="editContract"
      @delete="deleteContract" />

    <ContractObjectsDialog v-model="showObjectsDialog" :contract="selectedContract" @success="onObjectsSuccess"
      @error="showSnackbar($event, 'error')" />

    <ExpiringContractsDialog v-model="showExpiringDialog" :contracts="expiringContracts" @refresh="loadContracts" />

    <!-- Snackbar для уведомлений -->
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
import { AppleButton, AppleCard, AppleInput } from '@/components/Apple';
import billingService from '@/services/billingService';
import contractsService from '@/services/contractsService';
import { contractDisplayName } from '@/utils/contractDisplay';
import type { BillingPlan } from '@/types/billing';
import type {
    CONTRACT_STATUS_COLORS,
    CONTRACT_STATUS_LABELS,
    CONTRACT_TYPE_COLORS,
    CONTRACT_TYPE_LABELS,
    ContractFilters,
    ContractStats,
    ContractWithRelations,
} from '@/types/contracts';
import { CONTRACT_SOURCE_OPTIONS } from '@/types/contracts';
import { debounce } from 'lodash-es';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

// Импорт компонентов диалогов
import ContractDialog from '@/components/Contracts/ContractDialog.vue';
import ContractObjectsDialog from '@/components/Contracts/ContractObjectsDialog.vue';
import ContractViewDialog from '@/components/Contracts/ContractViewDialog.vue';
import ExpiringContractsDialog from '@/components/Contracts/ExpiringContractsDialog.vue';

// Реактивные данные
const loading = ref(false);
const exporting = ref(false);
const loadingExpiring = ref(false);
const loadingTariffPlans = ref(false);
const demoMode = ref(false);
const contracts = ref<ContractWithRelations[]>([]);
const tariffPlans = ref<BillingPlan[]>([]);
const expiringContracts = ref<ContractWithRelations[]>([]);
const selectedContract = ref<ContractWithRelations | null>(null);
const itemsPerPage = ref(20);
const contractSubscriptions = ref<any[]>([]); // Подписки для всех договоров

// Диалоги
const showContractDialog = ref(false);
const showViewDialog = ref(false);
const showObjectsDialog = ref(false);
const showExpiringDialog = ref(false);

// Snackbar
const showSnackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

// Фильтры
const filters = ref<ContractFilters>({
  search: '',
  status: undefined,
  is_active: undefined,
  expiring: false,
  tariff_plan_id: undefined,
  partner_source: undefined,
  page: 1,
  limit: 20,
});

// Заголовки таблицы
const tableHeaders = [
  { title: '№', key: 'sequential_number', sortable: true, width: '80px' },
  { title: 'Дата', key: 'created_at', sortable: true, width: '140px' },
  { title: 'Номер', key: 'number', sortable: true, width: '120px' },
  { title: 'Тип', key: 'contract_type', sortable: true, width: '130px' },
  { title: 'Клиент', key: 'title', sortable: true },
  { title: 'Тариф', key: 'tariff_plan', sortable: false, width: '180px' },
  { title: 'Период', key: 'period', sortable: false, width: '200px' },
  { title: 'Сумма', key: 'total_amount', sortable: true, width: '150px' },
  { title: 'Статус', key: 'status', sortable: true, width: '120px' },
  { title: 'Действия', key: 'actions', sortable: false, width: '200px' },
];

// Опции для фильтров
const statusOptions = Object.entries(CONTRACT_STATUS_LABELS).map(([value, title]) => ({
  value,
  title,
}));

const activeOptions = [
  { value: true, title: 'Активные' },
  { value: false, title: 'Неактивные' },
];

// Вычисляемые свойства
const filteredContracts = computed(() => {
  let result = contracts.value;

  if (filters.value.status) {
    result = result.filter(contract => contract.status === filters.value.status);
  }

  if (filters.value.is_active !== undefined) {
    result = result.filter(contract => contract.is_active === filters.value.is_active);
  }

  if (filters.value.expiring) {
    result = result.filter(contract => contractsService.isContractExpiringSoon(contract));
  }

  if (filters.value.tariff_plan_id) {
    result = result.filter(contract => contract.tariff_plan_id === filters.value.tariff_plan_id);
  }

  if (filters.value.partner_source) {
    result = result.filter(contract => contract.partner_source === filters.value.partner_source);
  }

  return result;
});

const tariffPlanOptions = computed(() => {
  return tariffPlans.value.map(plan => ({
    value: plan.id,
    title: `${plan.name} (${contractsService.formatCurrency(plan.price)}/мес)`,
  }));
});

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

const hasActiveFilters = computed(() => {
  return !!(
    filters.value.search ||
    filters.value.status ||
    filters.value.is_active !== undefined ||
    filters.value.expiring ||
    filters.value.tariff_plan_id ||
    filters.value.partner_source
  );
});

const stats = computed(() => {
  const contractStats: ContractStats = {
    total: contracts.value.length,
    active: contracts.value.filter(c => c.status === 'active').length,
    expired: contracts.value.filter(c => c.status === 'expired').length,
    expiring_soon: contracts.value.filter(c => contractsService.isContractExpiringSoon(c)).length,
    draft: contracts.value.filter(c => c.status === 'draft').length,
    cancelled: contracts.value.filter(c => c.status === 'cancelled').length,
    total_amount: contracts.value.reduce((sum, c) => sum + parseFloat(c.total_amount), 0).toString(),
    active_amount: contracts.value
      .filter(c => c.status === 'active')
      .reduce((sum, c) => sum + parseFloat(c.total_amount), 0).toString(),
  };

  return [
    {
      key: 'total',
      label: 'Всего договоров',
      value: contractStats.total,
      icon: 'mdi-file-document-multiple',
      color: 'primary',
    },
    {
      key: 'active',
      label: 'Активные',
      value: contractStats.active,
      icon: 'mdi-check-circle',
      color: 'success',
    },
    {
      key: 'expiring',
      label: 'Истекающие',
      value: contractStats.expiring_soon,
      icon: 'mdi-clock-alert',
      color: 'warning',
    },
    {
      key: 'total_amount',
      label: 'Общая стоимость',
      value: contractsService.formatCurrency(contractStats.total_amount),
      icon: 'mdi-currency-rub',
      color: 'info',
    },
  ];
});

// Методы
const loadContracts = async () => {
  console.log('📄 Loading contracts...', { demoMode: demoMode.value, filters: filters.value });
  loading.value = true;
  try {
    if (demoMode.value) {
      console.log('🎭 Loading demo contracts...');
      contracts.value = await contractsService.getMockContracts();
      console.log('✅ Demo contracts loaded:', contracts.value.length);
    } else {
      console.log('🌐 Loading real contracts...');
      const response = await contractsService.getContracts(filters.value);
      contracts.value = response.contracts;
      console.log('✅ Real contracts loaded:', contracts.value.length);
      
      // Отладка: проверяем contract_type для каждого договора
      contracts.value.forEach((contract, index) => {
        if (index < 5) { // Выводим первые 5 для отладки
          console.log(`📋 Contract ${index + 1}:`, {
            number: contract.number,
            contract_type: contract.contract_type,
            partner_company_id: contract.partner_company_id,
            total_amount: contract.total_amount,
            objects_count: contract.objects?.length || 0
          });
        }
      });
      
      // Загружаем подписки для определения тарифов
      await loadSubscriptions();
    }
  } catch (error) {
    console.error('❌ Error loading contracts:', error);
    showSnackbarMessage('Ошибка загрузки договоров', 'error');
  } finally {
    loading.value = false;
  }
};

const loadTariffPlans = async () => {
  loadingTariffPlans.value = true;
  try {
    tariffPlans.value = await billingService.getBillingPlans();
  } catch (error) {
    console.error('Error loading tariff plans:', error);
    tariffPlans.value = [];
  } finally {
    loadingTariffPlans.value = false;
  }
};

const loadSubscriptions = async () => {
  try {
    const companyData = localStorage.getItem('axenta_company');
    if (!companyData) {
      console.warn('⚠️ No company data found in localStorage');
      return;
    }
    
    const company = JSON.parse(companyData);
    const companyId = parseInt(company.id, 10);
    
    const subscriptions = await billingService.getSubscriptions(companyId);
    contractSubscriptions.value = subscriptions || [];
    
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

const enableDemoMode = () => {
  console.log('🎭 Enabling demo mode...');
  demoMode.value = true;
  loadContracts();
  showSnackbarMessage('Демо режим включен', 'info');
};

const disableDemoMode = () => {
  demoMode.value = false;
  loadContracts();
  showSnackbarMessage('Демо режим выключен', 'info');
};

const clearFilters = () => {
  filters.value = {
    search: '',
    status: undefined,
    is_active: undefined,
    expiring: false,
    tariff_plan_id: undefined,
    partner_source: undefined,
    page: 1,
    limit: 20,
  };
};

const debouncedSearch = debounce(() => {
  // Поиск выполняется автоматически через computed свойство filteredContracts
}, 300);

const openCreateDialog = () => {
  // Перенаправляем на страницу создания договора
  router.push('/contracts/create');
};

const editContract = (contract: ContractWithRelations) => {
  console.log('📝 Редактирование договора:', contract.number);
  // Перенаправляем на страницу редактирования
  router.push({
    path: `/contracts/edit/${contract.id}`
  });
};

const viewContract = (contract: ContractWithRelations) => {
  selectedContract.value = contract;
  showViewDialog.value = true;
};

const openObjectsDialog = (contract: ContractWithRelations) => {
  selectedContract.value = contract;
  showObjectsDialog.value = true;
};

const calculateCost = async (contract: ContractWithRelations) => {
  try {
    // Проверяем наличие приложений к договору
    let appendices = contract.appendices;
    
    // Если приложения не загружены, загружаем их
    if (!appendices) {
      appendices = await contractsService.getContractAppendices(contract.id);
    }
    
    // Если приложений нет, показываем информационное сообщение
    if (!appendices || appendices.length === 0) {
      showSnackbarMessage(
        'У договора еще нет приложений. Добавьте приложения к договору для расчета стоимости.',
        'info'
      );
      return;
    }
    
    // Продолжаем с расчетом стоимости
    const calculation = await contractsService.calculateContractCost(contract.id);
    const message = `
      Расчет стоимости договора ${contract.number}:
      Всего объектов: ${calculation.total_objects}
      Активных: ${calculation.active_objects}
      Неактивных: ${calculation.inactive_objects}
      Рассчитанная стоимость: ${contractsService.formatCurrency(calculation.calculated_cost, calculation.currency)}
      Текущая стоимость: ${contractsService.formatCurrency(calculation.current_cost, calculation.currency)}
    `;
    showSnackbarMessage(message, 'info');
  } catch (error) {
    console.error('Error calculating cost:', error);
    showSnackbarMessage('Ошибка расчета стоимости', 'error');
  }
};

const deleteContract = async (contract: ContractWithRelations) => {
  if (!confirm(`Вы уверены, что хотите удалить договор ${contract.number}?`)) {
    return;
  }

  try {
    await contractsService.deleteContract(contract.id);
    await loadContracts();
    showSnackbarMessage('Договор успешно удален', 'success');
  } catch (error) {
    console.error('Error deleting contract:', error);
    showSnackbarMessage('Ошибка удаления договора', 'error');
  }
};

const showExpiringContracts = async () => {
  console.log('Показ истекающих договоров (временно отключено)');
  // loadingExpiring.value = true;
  // try {
  //   expiringContracts.value = await contractsService.getExpiringContracts(30);
  //   showExpiringDialog.value = true;
  // } catch (error) {
  //   console.error('Error loading expiring contracts:', error);
  //   showSnackbarMessage('Ошибка загрузки истекающих договоров', 'error');
  // } finally {
  //   loadingExpiring.value = false;
  // }
};

const exportContracts = async () => {
  exporting.value = true;
  try {
    // Временная заглушка для экспорта
    const csvData = contracts.value.map(contract => ({
      'Номер': contract.number,
      'Название': contract.title,
      'Клиент': contractDisplayName(contract, ''),
      'ИНН': contract.client_inn || '',
      'Телефон': contract.client_phone || '',
      'Email': contract.client_email || '',
      'Дата начала': contractsService.formatDate(contract.start_date),
      'Дата окончания': contractsService.formatDate(contract.end_date),
      'Статус': getContractStatusLabel(contract.status),
      'Тарифный план': contract.tariff_plan?.name || '',
      'Стоимость': contract.total_amount,
      'Валюта': contract.currency,
      'Объектов': contract.objects?.length || 0,
      'Приложений': contract.appendices?.length || 0,
    }));

    const csv = convertToCSV(csvData);
    downloadCSV(csv, 'contracts.csv');
    showSnackbarMessage('Данные экспортированы', 'success');
  } catch (error) {
    console.error('Error exporting contracts:', error);
    showSnackbarMessage('Ошибка экспорта', 'error');
  } finally {
    exporting.value = false;
  }
};

const onContractSuccess = (message: string) => {
  loadContracts();
  showSnackbarMessage(message, 'success');
};

const onObjectsSuccess = (message: string) => {
  loadContracts();
  showSnackbarMessage(message, 'success');
};

const showSnackbarMessage = (text: string, color: string) => {
  snackbarText.value = text;
  snackbarColor.value = color;
  showSnackbar.value = true;
};

// Утилиты для отображения
const getContractStatusColor = (status: string): string => {
  return CONTRACT_STATUS_COLORS[status as keyof typeof CONTRACT_STATUS_COLORS] || 'grey';
};

const getContractStatusLabel = (status: string): string => {
  return CONTRACT_STATUS_LABELS[status as keyof typeof CONTRACT_STATUS_LABELS] || status;
};

const formatCurrency = (amount: string | number, currency = 'RUB'): string => {
  return contractsService.formatCurrency(amount, currency);
};

const formatDate = (date: string): string => {
  return contractsService.formatDate(date);
};

const getPeriodStatusClass = (contract: ContractWithRelations): string => {
  const now = new Date();
  const endDate = new Date(contract.end_date);

  if (now > endDate) {
    return 'period-expired';
  } else if (contractsService.isContractExpiringSoon(contract)) {
    return 'period-expiring';
  } else {
    return 'period-active';
  }
};

const getPeriodStatusText = (contract: ContractWithRelations): string => {
  const now = new Date();
  const endDate = new Date(contract.end_date);

  if (now > endDate) {
    return 'Истек';
  } else if (contractsService.isContractExpiringSoon(contract)) {
    const days = contractsService.getDaysUntilExpiry(contract);
    return `Истекает через ${days} дн.`;
  } else {
    const days = contractsService.getDaysUntilExpiry(contract);
    return `${days} дней до истечения`;
  }
};

// Утилиты для экспорта
const convertToCSV = (data: any[]): string => {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',')
          ? `"${value}"`
          : value;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
};

const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Флаг для отслеживания обработки query параметра
const editQueryProcessed = ref(false);

// Функция для обработки query параметра редактирования
const handleEditQueryParam = () => {
  // Избегаем повторной обработки
  if (editQueryProcessed.value) {
    return;
  }

  if (route.query.edit && contracts.value.length > 0) {
    const contractId = parseInt(route.query.edit as string);
    console.log('🔍 Обработка query параметра edit:', contractId);
    console.log('📋 Всего контрактов загружено:', contracts.value.length);
    
    if (!isNaN(contractId)) {
      const contract = contracts.value.find(c => c.id === contractId);
      if (contract) {
        console.log('✅ Договор найден:', contract.number);
        editQueryProcessed.value = true;
        
        // Сразу открываем диалог
        console.log('📝 Открываем диалог редактирования для:', contract.number);
        selectedContract.value = contract;
        showContractDialog.value = true;
        
        // Очищаем query параметр после открытия диалога
        setTimeout(() => {
          router.replace({ path: '/contracts', query: {} });
        }, 100);
      } else {
        console.warn('⚠️ Договор не найден с ID:', contractId);
        console.log('📋 Доступные ID договоров:', contracts.value.map(c => c.id));
        // Договор не найден, показываем сообщение
        editQueryProcessed.value = true;
        showSnackbarMessage(`Договор с ID ${contractId} не найден`, 'error');
        router.replace({ path: '/contracts', query: {} });
      }
    }
  }
};

// Watchers
watch(filters, () => {
  if (!demoMode.value) {
    loadContracts();
  }
}, { deep: true });

// Отслеживаем загрузку контрактов для обработки query параметра
watch(() => contracts.value, (newContracts) => {
  console.log('👀 Контракты изменились, количество:', newContracts.length);
  if (newContracts.length > 0 && route.query.edit && !editQueryProcessed.value) {
    console.log('🔄 Попытка обработать query параметр после загрузки контрактов');
    setTimeout(() => {
      handleEditQueryParam();
    }, 100);
  }
}, { deep: false });

// Lifecycle
onMounted(async () => {
  console.log('🚀 Contracts.vue mounted');
  console.log('📌 Query параметры:', route.query);
  
  editQueryProcessed.value = false; // Сбрасываем флаг
  
  await Promise.all([
    loadContracts(),
    loadTariffPlans(),
  ]);
  
  console.log('📊 Загрузка завершена, контрактов:', contracts.value.length);
  
  // Проверяем query параметр после загрузки данных
  if (route.query.edit) {
    console.log('🔍 Обнаружен query параметр edit, обрабатываем...');
    setTimeout(() => {
      handleEditQueryParam();
    }, 200);
  }
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
  color: rgb(var(--v-theme-on-surface));
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

.alert-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert-title {
  font-weight: 600;
  font-size: 16px;
}

.alert-text {
  font-size: 14px;
  opacity: 0.9;
}

.stats-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.stat-card {
  height: 100px;
}

.filters-card {
  margin-bottom: 24px;
}

.filters-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.filters-content {
  padding: 16px 0;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.table-title {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 18px;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.contracts-table {
  --v-table-row-height: 72px;
}

.contract-number {
  font-family: 'SF Mono', monospace;
  font-weight: 600;
}

.contract-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contract-title {
  font-weight: 600;
  font-size: 14px;
}

.contract-client {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.tariff-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tariff-price {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.period-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.period-dates {
  font-size: 12px;
  font-family: 'SF Mono', monospace;
}

.period-status {
  font-size: 11px;
  font-weight: 600;
}

.period-active {
  color: rgb(var(--v-theme-success));
}

.period-expiring {
  color: rgb(var(--v-theme-warning));
}

.period-expired {
  color: rgb(var(--v-theme-error));
}

.amount-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: right;
}

.amount-value {
  font-weight: 600;
  font-family: 'SF Mono', monospace;
}

.amount-objects {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.actions-cell {
  display: flex;
  gap: 4px;
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

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filters-content .v-row {
    margin: 0;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .page-actions {
    flex-direction: column;
  }
}

/* Темная тема */
[data-theme="dark"] .contracts-table :deep(.v-data-table) {
  background-color: #1e1e1e !important;
  color: #ffffff !important;
}

[data-theme="dark"] .contracts-table :deep(thead) {
  background-color: #2c2c2e !important;
}

[data-theme="dark"] .contracts-table :deep(th) {
  color: #ffffff !important;
  border-color: #3a3a3c !important;
}

[data-theme="dark"] .contracts-table :deep(td) {
  color: #ffffff !important;
  border-color: #3a3a3c !important;
}

[data-theme="dark"] .contracts-table :deep(tr:hover) {
  background-color: #2c2c2e !important;
}

[data-theme="dark"] .tariff-price,
[data-theme="dark"] .period-dates {
  color: rgba(255, 255, 255, 0.7);
}
</style>

