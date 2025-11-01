<template>
  <div class="create-contract-page">
    <!-- Заголовок страницы -->
    <div class="page-header">
      <div class="page-title-section">
        <v-icon icon="mdi-file-document-plus" size="32" class="page-icon" />
        <div>
          <h1 class="page-title">Создание договора</h1>
          <p class="page-subtitle">Создание нового договора с привязкой объектов</p>
        </div>
      </div>

      <div class="page-actions">
        <AppleButton
          variant="secondary"
          prepend-icon="mdi-arrow-left"
          @click="goBack"
        >
          Назад к списку
        </AppleButton>
      </div>
    </div>

    <!-- Форма создания договора -->
    <AppleCard class="form-card" variant="outlined">
      <v-form ref="formRef" v-model="formValid" @submit.prevent="saveContract">
        <div class="form-content">
          <!-- Основная информация -->
          <div class="form-section">
            <h3 class="section-title">
              <v-icon icon="mdi-file-document" class="mr-2" />
              Основная информация
            </h3>
            
            <v-row>
              <v-col cols="12" md="6">
                <AppleInput
                  v-model="form.number"
                  label="Номер договора"
                  :rules="[rules.required]"
                  prepend-icon="mdi-identifier"
                  required
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.status"
                  :items="statusOptions"
                  label="Статус"
                  variant="outlined"
                  density="comfortable"
                  prepend-icon="mdi-flag"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <AppleInput
                  v-model="form.title"
                  label="Название договора"
                  :rules="[rules.required]"
                  prepend-icon="mdi-format-title"
                  required
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="form.description"
                  label="Описание"
                  variant="outlined"
                  density="comfortable"
                  prepend-icon="mdi-text"
                  rows="3"
                />
              </v-col>
            </v-row>
          </div>

          <!-- Учетная запись и объекты -->
          <div class="form-section">
            <h3 class="section-title">
              <v-icon icon="mdi-account-group" class="mr-2" />
              Учетная запись и объекты
            </h3>
            
            <v-row>
              <v-col cols="12">
                <v-autocomplete
                  v-model="form.account_id"
                  :items="accountOptions"
                  item-title="title"
                  item-value="value"
                  label="Учетная запись"
                  placeholder="Начните вводить название учетной записи..."
                  variant="outlined"
                  density="comfortable"
                  prepend-icon="mdi-account"
                  :loading="loadingAccounts"
                  hint="Выберите учетную запись для автоматической привязки её объектов к договору"
                  persistent-hint
                  clearable
                  :custom-filter="filterAccounts"
                  no-data-text="Учетные записи не найдены"
                  loading-text="Загрузка учетных записей..."
                  :menu-props="{ maxHeight: 300 }"
                  @update:model-value="onAccountSelected"
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props" @click="debugAccountItem(item)">
                      <template #prepend>
                        <v-avatar size="small" :color="(item.raw as any)?.isActive ? 'success' : 'error'">
                          <v-icon :icon="(item.raw as any)?.isActive ? 'mdi-check' : 'mdi-close'" />
                        </v-avatar>
                      </template>
                      
                      <v-list-item-title>{{ (item.raw as any)?.name || item.title }}</v-list-item-title>
                      <v-list-item-subtitle>
                        <div class="d-flex align-center flex-wrap ga-2">
                          <!-- Всегда показываем чип с количеством объектов -->
                          <v-chip
                            :color="getObjectsTotal(item.raw) > 0 ? 'primary' : 'grey'"
                            size="small"
                            variant="flat"
                            class="font-weight-medium"
                          >
                            <v-icon start size="small">mdi-package-variant</v-icon>
                            {{ getObjectsTotal(item.raw) }} объектов
                          </v-chip>
                          <!-- Показываем активные объекты, если они есть -->
                          <v-chip
                            v-if="getObjectsActive(item.raw) > 0"
                            color="success"
                            size="small"
                            variant="flat"
                          >
                            <v-icon start size="small">mdi-check-circle</v-icon>
                            {{ getObjectsActive(item.raw) }} активных
                          </v-chip>
                          <span v-if="(item.raw as any)?.type" class="text-caption text-grey-600">
                            • {{ (item.raw as any)?.type === 'client' ? 'Клиент' : (item.raw as any)?.type === 'partner' ? 'Партнер' : (item.raw as any)?.type }}
                          </span>
                        </div>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </template>
                  <template #selection="{ item }">
                    <div class="d-flex align-center ga-2">
                      <span v-if="item && typeof item === 'object' && (item as any).raw" class="font-weight-medium">
                        {{ (item as any).raw?.name || (item as any).raw?.title }}
                      </span>
                      <span v-else-if="selectedAccount" class="font-weight-medium">
                        {{ selectedAccount.name }}
                      </span>
                      <span v-else-if="form.account_id" class="font-weight-medium">
                        {{ accountOptions.find(opt => opt.value === form.account_id)?.title || selectedAccountName || '' }}
                      </span>
                      <v-chip
                        v-if="selectedAccount && selectedAccount.objectsTotal !== undefined"
                        :color="selectedAccount.objectsTotal > 0 ? 'primary' : 'grey'"
                        size="small"
                        variant="flat"
                        class="ml-2"
                      >
                        {{ selectedAccount.objectsTotal || 0 }} объектов
                      </v-chip>
                    </div>
                  </template>
                </v-autocomplete>
              </v-col>
            </v-row>

            <!-- Список объектов учетной записи без договоров -->
            <v-row v-if="form.account_id">
              <v-col cols="12">
                <v-card variant="outlined" class="objects-card">
                  <v-card-title class="text-subtitle-1 pa-3 d-flex align-center justify-space-between">
                    <div class="d-flex align-center">
                      <v-icon icon="mdi-package-variant" size="small" class="mr-2" />
                      Объекты для привязки к договору
                      <v-chip size="small" variant="tonal" color="primary" class="ml-2">
                        {{ accountObjects.length }}
                      </v-chip>
                    </div>
                    <div v-if="selectedObjectsForContract.length > 0" class="d-flex align-center">
                      <v-chip size="small" variant="outlined" color="primary" class="mr-2">
                        Выбрано: {{ selectedObjectsForContract.length }}
                      </v-chip>
                      <AppleButton
                        variant="text"
                        size="small"
                        prepend-icon="mdi-close"
                        @click="selectedObjectsForContract = []"
                      >
                        Сбросить
                      </AppleButton>
                    </div>
                  </v-card-title>
                  <v-divider />
                  
                  <!-- Поиск объектов -->
                  <v-card-text class="pa-3 pb-0">
                    <v-text-field
                      v-model="objectsSearchQuery"
                      placeholder="Поиск по названию, IMEI, телефону..."
                      prepend-inner-icon="mdi-magnify"
                      variant="outlined"
                      density="compact"
                      clearable
                      hide-details
                    />
                  </v-card-text>

                  <!-- Индикатор загрузки -->
                  <div v-if="loadingAccountObjects" class="pa-4">
                    <v-progress-linear indeterminate color="primary" />
                    <div class="text-caption text-center mt-2">Загрузка объектов...</div>
                  </div>

                  <!-- Таблица объектов -->
                  <div v-else-if="filteredAccountObjects.length > 0" class="objects-table-container">
                    <v-data-table
                      v-model="selectedObjectsForContract"
                      :headers="objectsTableHeaders"
                      :items="filteredAccountObjects"
                      item-value="id"
                      show-select
                      density="comfortable"
                      class="objects-table"
                      hide-default-footer
                      :items-per-page="10"
                    >
                      <!-- Колонка с именем объекта -->
                      <template #item.name="{ item }">
                        <div class="object-name-cell">
                          <div class="font-weight-medium">{{ item.name }}</div>
                          <div v-if="item.description" class="text-caption text-grey-600">
                            {{ item.description }}
                          </div>
                        </div>
                      </template>

                      <!-- Колонка с IMEI -->
                      <template #item.imei="{ item }">
                        <span v-if="item.imei">{{ item.imei }}</span>
                        <span v-else class="text-grey-400">—</span>
                      </template>

                      <!-- Колонка с телефоном -->
                      <template #item.phone_number="{ item }">
                        <span v-if="item.phone_number">{{ item.phone_number }}</span>
                        <span v-else class="text-grey-400">—</span>
                      </template>

                      <!-- Колонка со статусом -->
                      <template #item.status="{ item }">
                        <v-chip
                          :color="item.is_active ? 'success' : 'grey'"
                          size="small"
                          variant="tonal"
                        >
                          {{ item.is_active ? 'Активный' : 'Неактивный' }}
                        </v-chip>
                      </template>
                    </v-data-table>
                  </div>

                  <!-- Сообщение, если объектов нет -->
                  <v-card-text v-else-if="!loadingAccountObjects" class="pa-4">
                    <v-alert 
                      type="info" 
                      variant="tonal" 
                      density="compact"
                      text="У этой учетной записи нет объектов без привязки к договорам"
                    />
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <!-- Информация о клиенте -->
          <div class="form-section">
            <h3 class="section-title">
              <v-icon icon="mdi-account" class="mr-2" />
              Информация о клиенте
            </h3>
            
            <v-row>
              <v-col cols="12" md="8">
                <AppleInput
                  v-model="form.client_name"
                  label="Наименование клиента"
                  :rules="[rules.required]"
                  prepend-icon="mdi-domain"
                  required
                />
              </v-col>
              
              <v-col cols="12" md="4">
                <AppleInput
                  v-model="form.client_inn"
                  label="ИНН"
                  prepend-icon="mdi-card-account-details"
                  :rules="[rules.inn]"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="4">
                <AppleInput
                  v-model="form.client_kpp"
                  label="КПП"
                  prepend-icon="mdi-card-account-details-outline"
                />
              </v-col>
              
              <v-col cols="12" md="4">
                <AppleInput
                  v-model="form.client_email"
                  label="Email"
                  prepend-icon="mdi-email"
                  :rules="[rules.email]"
                  type="email"
                />
              </v-col>
              
              <v-col cols="12" md="4">
                <AppleInput
                  v-model="form.client_phone"
                  label="Телефон"
                  prepend-icon="mdi-phone"
                  :rules="[rules.phone]"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="form.client_address"
                  label="Адрес"
                  variant="outlined"
                  density="comfortable"
                  prepend-icon="mdi-map-marker"
                  rows="2"
                />
              </v-col>
            </v-row>
          </div>

          <!-- Тарификация и стоимость -->
          <div class="form-section">
            <h3 class="section-title">
              <v-icon icon="mdi-currency-rub" class="mr-2" />
              Тарификация и стоимость
            </h3>
            
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.tariff_plan_id"
                  :items="tariffPlanOptions"
                  label="Тарифный план"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="comfortable"
                  prepend-icon="mdi-package-variant"
                  :loading="loadingTariffPlans"
                  required
                  @update:model-value="onTariffPlanChange"
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #prepend>
                        <v-avatar size="small" color="primary">
                          <v-icon icon="mdi-package-variant" />
                        </v-avatar>
                      </template>
                      
                      <v-list-item-title>{{ item.title }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ formatCurrency((item.raw as any)?.price || 0) }}/мес
                        • До {{ (item.raw as any)?.max_devices || 0 }} устройств
                      </v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
              
              <v-col cols="12" md="3">
                <AppleInput
                  v-model="form.total_amount"
                  label="Общая стоимость"
                  prepend-icon="mdi-calculator"
                  :rules="[rules.number]"
                  type="number"
                  step="0.01"
                />
              </v-col>
              
              <v-col cols="12" md="3">
                <v-select
                  v-model="form.currency"
                  :items="currencyOptions"
                  label="Валюта"
                  variant="outlined"
                  density="comfortable"
                  prepend-icon="mdi-cash"
                />
              </v-col>
            </v-row>
          </div>

          <!-- Период действия -->
          <div class="form-section">
            <h3 class="section-title">
              <v-icon icon="mdi-calendar-range" class="mr-2" />
              Период действия
            </h3>
            
            <v-row>
              <v-col cols="12" md="4">
                <AppleInput
                  v-model="form.start_date"
                  label="Дата начала"
                  :rules="[rules.required]"
                  prepend-icon="mdi-calendar-start"
                  type="date"
                  required
                />
              </v-col>
              
              <v-col cols="12" md="4">
                <AppleInput
                  v-model="form.end_date"
                  label="Дата окончания"
                  :rules="[rules.required, rules.endDateAfterStart]"
                  prepend-icon="mdi-calendar-end"
                  type="date"
                  required
                />
              </v-col>
              
              <v-col cols="12" md="4">
                <v-select
                  v-model="form.notify_before"
                  :items="notificationOptions"
                  label="Уведомлять за"
                  variant="outlined"
                  density="comfortable"
                  prepend-icon="mdi-bell"
                />
              </v-col>
            </v-row>
          </div>

          <!-- Дополнительные параметры -->
          <div class="form-section">
            <h3 class="section-title">
              <v-icon icon="mdi-cog" class="mr-2" />
              Дополнительные параметры
            </h3>
            
            <v-row>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="form.is_active"
                  label="Активный договор"
                  color="success"
                  density="comfortable"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <AppleInput
                  v-model="form.external_id"
                  label="Внешний ID"
                  prepend-icon="mdi-identifier"
                  hint="ID в внешних системах (1С, Битрикс24)"
                  persistent-hint
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="form.notes"
                  label="Примечания"
                  variant="outlined"
                  density="comfortable"
                  prepend-icon="mdi-note-text"
                  rows="3"
                />
              </v-col>
            </v-row>
          </div>
        </div>

        <!-- Действия формы -->
        <div class="form-actions">
          <v-divider class="mb-4" />
          <div class="actions-buttons">
            <AppleButton variant="text" @click="goBack">
              Отмена
            </AppleButton>
            <v-spacer />
            <AppleButton 
              @click="saveContract" 
              :loading="saving"
              :disabled="!formValid"
              color="primary"
              prepend-icon="mdi-check"
            >
              Создать договор
            </AppleButton>
          </div>
        </div>
      </v-form>
    </AppleCard>

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
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { 
  ContractForm,
} from '@/types/contracts';
import {
  CONTRACT_STATUS_LABELS,
  CURRENCY_OPTIONS,
  NOTIFICATION_PERIOD_OPTIONS,
} from '@/types/contracts';
import type { BillingPlan } from '@/types/billing';
import type { Account } from '@/services/accountsService';
import contractsService from '@/services/contractsService';
import accountsService from '@/services/accountsService';
import billingService from '@/services/billingService';
import { getObjectsService } from '@/services/objectsService';
import { AppleButton, AppleInput, AppleCard } from '@/components/Apple';

const router = useRouter();

// Reactive data
const formRef = ref();
const formValid = ref(false);
const saving = ref(false);
const loadingTariffPlans = ref(false);
const loadingAccounts = ref(false);
const accounts = ref<Account[]>([]);
const tariffPlans = ref<BillingPlan[]>([]);
const accountObjects = ref<any[]>([]);
const loadingAccountObjects = ref(false);
const selectedAccountName = ref('');
const selectedObjectsForContract = ref<number[]>([]);
const objectsSearchQuery = ref('');

// Заголовки таблицы объектов
const objectsTableHeaders = [
  { title: 'Название', key: 'name', sortable: true },
  { title: 'IMEI', key: 'imei', sortable: true },
  { title: 'Телефон', key: 'phone_number', sortable: true },
  { title: 'Статус', key: 'status', sortable: true },
];

// Отфильтрованные объекты по поисковому запросу
const filteredAccountObjects = computed(() => {
  if (!objectsSearchQuery.value.trim()) {
    return accountObjects.value;
  }

  const query = objectsSearchQuery.value.toLowerCase().trim();
  return accountObjects.value.filter(obj => {
    return (
      (obj.name && obj.name.toLowerCase().includes(query)) ||
      (obj.imei && obj.imei.toLowerCase().includes(query)) ||
      (obj.phone_number && obj.phone_number.toLowerCase().includes(query)) ||
      (obj.description && obj.description.toLowerCase().includes(query))
    );
  });
});

// Snackbar
const showSnackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

// Form data
const defaultForm: ContractForm = {
  number: '',
  title: '',
  description: '',
  client_name: '',
  client_inn: '',
  client_kpp: '',
  client_email: '',
  client_phone: '',
  client_address: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +1 год
  tariff_plan_id: 0,
  total_amount: '',
  currency: 'RUB',
  status: 'draft',
  is_active: true,
  notify_before: 30,
  notes: '',
  external_id: '',
  account_id: undefined,
};

const form = ref<ContractForm>({ ...defaultForm });

// Options
const statusOptions = Object.entries(CONTRACT_STATUS_LABELS).map(([value, title]) => ({
  value,
  title,
}));

const currencyOptions = CURRENCY_OPTIONS.map(option => ({
  value: option.value,
  title: option.title,
}));

const notificationOptions = computed(() => {
  return NOTIFICATION_PERIOD_OPTIONS.map(option => ({
    value: option.value,
    title: option.title,
  }));
});

const accountOptions = computed(() => {
  return accounts.value.map(account => ({
    value: account.id,
    title: account.name, // Только название учетной записи
    raw: account,
  }));
});

// Найти учетную запись по ID для отображения
const findAccountById = (accountId: number | undefined) => {
  if (!accountId) return null;
  return accounts.value.find(acc => acc.id === accountId) || null;
};

// Computed для отображения выбранной учетной записи
const selectedAccount = computed(() => {
  if (!form.value.account_id) return null;
  return findAccountById(form.value.account_id);
});

const tariffPlanOptions = computed(() => {
  return tariffPlans.value.map(plan => ({
    value: plan.id,
    title: plan.name,
    raw: plan,
  }));
});

// Validation rules
const rules = {
  required: (value: any) => !!value || 'Поле обязательно для заполнения',
  email: (value: string) => {
    if (!value) return true;
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value) || 'Неверный формат email';
  },
  phone: (value: string) => {
    if (!value) return true;
    const pattern = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return pattern.test(value) || 'Неверный формат телефона';
  },
  inn: (value: string) => {
    if (!value) return true;
    const pattern = /^[0-9]{10,12}$/;
    return pattern.test(value) || 'ИНН должен содержать 10 или 12 цифр';
  },
  number: (value: string) => {
    if (!value) return true;
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 || 'Должно быть положительное число';
  },
  endDateAfterStart: (value: string) => {
    if (!value || !form.value.start_date) return true;
    return new Date(value) > new Date(form.value.start_date) || 'Дата окончания должна быть после даты начала';
  },
};

// Methods
const goBack = () => {
  router.back();
};

const onTariffPlanChange = (planId: number) => {
  const selectedPlan = tariffPlans.value.find(plan => plan.id === planId);
  if (selectedPlan && !form.value.total_amount) {
    // Автоматически устанавливаем стоимость на основе тарифного плана
    const monthlyPrice = selectedPlan.price;
    const startDate = new Date(form.value.start_date);
    const endDate = new Date(form.value.end_date);
    const months = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    form.value.total_amount = (monthlyPrice * Math.max(1, months)).toString();
  }
};

const saveContract = async () => {
  if (!formRef.value || !formValid.value) return;

  saving.value = true;
  try {
    // Создаем договор
    const createdContract = await contractsService.createContract(form.value);
    
    // Если есть выбранные объекты, привязываем их к договору
    if (selectedObjectsForContract.value.length > 0 && createdContract.id) {
      try {
        await contractsService.attachObjectsToContract(createdContract.id, {
          object_ids: selectedObjectsForContract.value,
        });
        console.log(`✅ Привязано ${selectedObjectsForContract.value.length} объектов к договору`);
        showSnackbarMessage(
          `Договор создан и привязано ${selectedObjectsForContract.value.length} объектов`,
          'success'
        );
      } catch (attachError: any) {
        console.error('Ошибка привязки объектов к договору:', attachError);
        // Не блокируем создание договора, если привязка не удалась
        showSnackbarMessage(
          'Договор создан, но не все объекты удалось привязать. Вы можете привязать их позже.',
          'warning'
        );
        setTimeout(() => {
          router.push('/billing');
        }, 2000);
        return;
      }
    } else {
      showSnackbarMessage('Договор успешно создан', 'success');
    }

    setTimeout(() => {
      router.push('/billing');
    }, 1500);
  } catch (error: any) {
    console.error('Error saving contract:', error);
    showSnackbarMessage(error.message || 'Ошибка сохранения договора', 'error');
  } finally {
    saving.value = false;
  }
};

const showSnackbarMessage = (text: string, color: string) => {
  snackbarText.value = text;
  snackbarColor.value = color;
  showSnackbar.value = true;
};

// Загрузка списка учетных записей (все доступные)
const loadAccounts = async () => {
  if (loadingAccounts.value) return;
  loadingAccounts.value = true;
  try {
    let allAccounts: Account[] = [];
    let page = 1;
    let hasMore = true;
    const perPage = 100;
    const maxPages = 50; // Защита от бесконечных циклов

    // Загружаем все страницы с учетными записями
    while (hasMore && page <= maxPages) {
      const response = await accountsService.getAccounts({ 
        page, 
        per_page: perPage,
        ordering: 'name'
        // Не используем фильтр is_active, чтобы загрузить все записи
      });
      
      if (response.results && response.results.length > 0) {
        allAccounts = allAccounts.concat(response.results);
        hasMore = !!response.next;
        page++;
        console.log(`📋 Загружено ${allAccounts.length} из ${response.count || 'неизвестно'} учетных записей`);
        
        // Логируем структуру первой учетной записи для проверки полей
        if (page === 2 && response.results.length > 0) {
          const firstAccount = response.results[0];
          console.log('📊 Структура учетной записи:', {
            id: firstAccount.id,
            name: firstAccount.name,
            objectsTotal: firstAccount.objectsTotal,
            objectsActive: firstAccount.objectsActive,
            objects_total: firstAccount.objects_total,
            objects_active: firstAccount.objects_active,
            allFields: Object.keys(firstAccount)
          });
        }
      } else {
        hasMore = false;
      }
    }

    accounts.value = allAccounts;
    console.log(`✅ Всего загружено ${accounts.value.length} учетных записей`);
    
    // Проверяем количество объектов для первых нескольких учетных записей
    if (accounts.value.length > 0) {
      console.log('📊 Проверка количества объектов в первых 3 учетных записях:');
      accounts.value.slice(0, 3).forEach(acc => {
        console.log(`  - ${acc.name}: objectsTotal=${acc.objectsTotal}, objectsActive=${acc.objectsActive}`);
      });
    }
  } catch (error) {
    console.error('Ошибка загрузки учетных записей:', error);
  } finally {
    loadingAccounts.value = false;
  }
};

// Отладочная функция для проверки структуры item при клике
const debugAccountItem = (item: any) => {
  console.log('🔍 DEBUG: Структура item в выпадающем списке:', {
    item,
    itemRaw: item?.raw,
    itemTitle: item?.title,
    itemValue: item?.value,
    objectsTotal: item?.raw?.objectsTotal,
    objects_total: item?.raw?.objects_total,
    objectsActive: item?.raw?.objectsActive,
    objects_active: item?.raw?.objects_active,
    allKeys: item?.raw ? Object.keys(item.raw) : []
  });
};

// Вспомогательные функции для получения количества объектов из учетной записи
const getObjectsTotal = (account: any): number => {
  if (!account) {
    return 0;
  }
  
  // Проверяем разные возможные варианты полей (camelCase и snake_case)
  let total = account.objectsTotal ?? 
               account.objects_total ?? 
               account.objectsCount ?? 
               account.objects_count ?? 
               0;
  
  // Если не нашли, проверяем вложенную структуру
  if (!total && account.raw) {
    total = account.raw.objectsTotal ?? 
            account.raw.objects_total ?? 
            account.raw.objectsCount ?? 
            account.raw.objects_count ?? 
            0;
  }
  
  const numValue = typeof total === 'number' ? total : (total ? parseInt(String(total), 10) : 0) || 0;
  
  // Логируем для отладки при каждом вызове (временно)
  if (account && account.name) {
    console.debug(`🔍 getObjectsTotal для "${account.name}":`, {
      accountType: typeof account,
      objectsTotal: account.objectsTotal,
      objects_total: account.objects_total,
      hasRaw: !!account.raw,
      rawObjectsTotal: account.raw?.objectsTotal,
      result: numValue,
      allAccountKeys: Object.keys(account || {})
    });
  }
  
  return numValue;
};

const getObjectsActive = (account: any): number => {
  if (!account) {
    console.warn('⚠️ getObjectsActive: account is null or undefined');
    return 0;
  }
  
  // Проверяем разные возможные варианты полей (camelCase и snake_case)
  const active = account.objectsActive ?? 
                 account.objects_active ?? 
                 account.activeObjects ?? 
                 account.active_objects ??
                 (account.raw ? (account.raw.objectsActive ?? account.raw.objects_active) : null) ??
                 0;
  
  return typeof active === 'number' ? active : parseInt(String(active), 10) || 0;
};

// Функция фильтрации учетных записей для поиска
const filterAccounts = (_value: string, query: string, item: any) => {
  if (!query) return true;
  
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return true;
  
  const account = item?.raw || item;
  if (!account) return false;
  
  // Поиск по названию учетной записи
  if (account.name && account.name.toLowerCase().includes(searchTerm)) {
    return true;
  }
  
  // Поиск по ID учетной записи
  if (account.id && account.id.toString().includes(searchTerm)) {
    return true;
  }
  
  // Поиск по Admin ID
  if (account.adminId && account.adminId.toString().includes(searchTerm)) {
    return true;
  }
  
  // Поиск по типу учетной записи
  if (account.type) {
    const typeText = account.type === 'client' ? 'клиент' : 
                    account.type === 'partner' ? 'партнер' : 
                    account.type.toLowerCase();
    if (typeText.includes(searchTerm)) {
      return true;
    }
  }
  
  // Поиск по title (отображаемому тексту)
  if (item?.title && item.title.toLowerCase().includes(searchTerm)) {
    return true;
  }
  
  return false;
};

// Обработчик выбора учетной записи
const onAccountSelected = async (accountId: number | undefined) => {
  console.log('🔵 onAccountSelected called with:', accountId);
  
  if (!accountId) {
    accountObjects.value = [];
    selectedAccountName.value = '';
    selectedObjectsForContract.value = [];
    objectsSearchQuery.value = '';
    return;
  }

  const account = findAccountById(accountId);
  if (account) {
    selectedAccountName.value = account.name;
    console.log('🔵 Selected account:', account.name);
  } else {
    console.warn('⚠️ Account not found for ID:', accountId);
  }

  // Очищаем предыдущий выбор объектов
  selectedObjectsForContract.value = [];
  objectsSearchQuery.value = '';

  // Загружаем объекты этой учетной записи, которые не привязаны к договорам
  await loadAccountObjects(accountId);
};

// Загрузка объектов учетной записи без привязки к договорам
const loadAccountObjects = async (accountId: number) => {
  loadingAccountObjects.value = true;
  accountObjects.value = [];
  
  try {
    const account = findAccountById(accountId);
    if (!account) {
      console.warn('⚠️ Учетная запись не найдена:', accountId);
      return;
    }

    console.log('🔍 Начинаем загрузку объектов для учетной записи:', {
      accountId,
      accountName: account.name,
      objectsTotal: account.objectsTotal,
      objectsActive: account.objectsActive
    });

    const objectsService = getObjectsService();
    
    // Загружаем все объекты учетной записи
    // Используем accountName для фильтрации, но убираем фильтр is_active чтобы видеть все объекты
    let allObjects: any[] = [];
    let page = 1;
    let hasMore = true;
    const perPage = 100;
    const maxPages = 20; // Ограничение для предотвращения бесконечных циклов

    console.log('📡 Отправляем запрос на получение объектов для учетной записи:', {
      accountId: account.id,
      accountName: account.name,
      objectsTotal: account.objectsTotal,
      objectsActive: account.objectsActive
    });

    while (hasMore && page <= maxPages) {
      try {
        // Используем accountId для более точной фильтрации объектов по выбранной учетной записи
        const response = await objectsService.getObjects(page, perPage, {
          accountId: account.id, // Фильтруем по ID учетной записи - это гарантирует, что показываются объекты только выбранной компании
          accountName: account.name, // Дополнительный фильтр по имени для совместимости
          // Убираем фильтр is_active, чтобы загрузить все объекты (и активные, и неактивные)
        });
        
        console.log(`📋 Страница ${page}: фильтр accountId=${account.id}, accountName="${account.name}"`);

        console.log(`📋 Страница ${page}: получено объектов:`, response.data?.items?.length || 0);

        if (response.data && response.data.items && response.data.items.length > 0) {
          // Логируем первые несколько объектов для отладки
          if (page === 1 && response.data.items.length > 0) {
            console.log('📦 Первые объекты до фильтрации:', response.data.items.slice(0, 3).map((obj: any) => ({
              id: obj.id,
              name: obj.name,
              contract_id: obj.contract_id,
              accountId: obj.accountId || obj.company_id,
              accountName: obj.accountName
            })));
          }

          allObjects = allObjects.concat(response.data.items);
          hasMore = response.data.items.length === perPage && page < maxPages;
          page++;
        } else {
          hasMore = false;
        }
      } catch (pageError) {
        console.error(`❌ Ошибка загрузки страницы ${page}:`, pageError);
        hasMore = false;
      }
    }

    console.log(`📊 Всего загружено объектов до фильтрации: ${allObjects.length} для учетной записи "${account.name}" (ID: ${account.id})`);

    // КРИТИЧЕСКИ ВАЖНО: Фильтруем объекты на стороне фронтенда, чтобы показать ТОЛЬКО объекты выбранной учетной записи
    // Axenta Cloud API может не применять фильтры правильно, поэтому делаем дополнительную проверку
    const filteredObjects = allObjects.filter((obj: any) => {
      // Получаем accountId объекта (может быть в разных полях)
      const objAccountId = obj.accountId || obj.company_id;
      
      // Получаем accountName объекта для сравнения
      const objAccountName = obj.accountName || '';
      
      // Проверяем по accountId (наиболее надежный способ)
      if (objAccountId && Number(objAccountId) === Number(account.id)) {
        return true;
      }
      
      // Если accountId не совпадает или отсутствует, проверяем по accountName (дополнительная проверка)
      // Используем точное сравнение с учетом возможных различий в регистре/пробелах
      if (objAccountName && objAccountName.trim() === account.name.trim()) {
        return true;
      }
      
      // Если ни accountId, ни accountName не совпадают, объект не принадлежит выбранной учетной записи
      return false;
    });

    console.log(`🔍 После фильтрации: ${filteredObjects.length} объектов соответствуют учетной записи "${account.name}" (ID: ${account.id})`);
    
    // Логируем объекты, которые не прошли фильтрацию (если есть)
    if (allObjects.length > filteredObjects.length) {
      const excluded = allObjects.filter((obj: any) => {
        const objAccountId = obj.accountId || obj.company_id;
        const objAccountName = obj.accountName || '';
        return !(
          (objAccountId && Number(objAccountId) === Number(account.id)) ||
          (objAccountName.trim() === account.name.trim())
        );
      });
      if (excluded.length > 0) {
        console.warn(`⚠️ Исключено ${excluded.length} объектов, которые не принадлежат выбранной учетной записи:`, 
          excluded.slice(0, 5).map((obj: any) => ({
            name: obj.name,
            accountId: obj.accountId || obj.company_id,
            accountName: obj.accountName,
            expectedAccountId: account.id,
            expectedAccountName: account.name
          }))
        );
      }
    }

    // Показываем только отфильтрованные объекты
    accountObjects.value = filteredObjects;

    console.log(`✅ Загружено и отфильтровано ${accountObjects.value.length} объектов для учетной записи "${account.name}" (ID: ${account.id})`);
    
    // Если объектов нет, проверяем почему
    if (accountObjects.value.length === 0 && allObjects.length > 0) {
      console.warn('⚠️ Объекты были загружены, но ни один не соответствует выбранной учетной записи');
      console.log('📋 Информация о загруженных объектах:', {
        totalLoaded: allObjects.length,
        accountId: account.id,
        accountName: account.name,
        sampleObjects: allObjects.slice(0, 3).map((obj: any) => ({
          name: obj.name,
          accountId: obj.accountId || obj.company_id,
          accountName: obj.accountName
        }))
      });
    } else if (accountObjects.value.length === 0) {
      console.warn('⚠️ Для учетной записи не найдено объектов');
      console.log('💡 Возможные причины:');
      console.log('   - В учетной записи действительно нет объектов');
      console.log('   - Поле accountId или accountName в объектах не совпадает с выбранной учетной записью');
      console.log('   - Объекты находятся в другой учетной записи');
      
      // Пробуем загрузить без фильтра для проверки, работает ли API вообще
      try {
        const testResponse = await objectsService.getObjects(1, 10, {});
        console.log('🧪 Тестовый запрос без фильтров вернул:', testResponse.data?.items?.length || 0, 'объектов');
        if (testResponse.data?.items && testResponse.data.items.length > 0) {
          console.log('📦 Первый объект из тестового запроса:', {
            name: testResponse.data.items[0].name,
            accountName: testResponse.data.items[0].accountName,
          });
          console.log('💡 Если accountName первого объекта отличается от выбранной учетной записи, значит нужно проверить соответствие');
        }
      } catch (testError) {
        console.error('❌ Ошибка тестового запроса:', testError);
      }
    }
  } catch (error: any) {
    console.error('❌ Ошибка загрузки объектов учетной записи:', error);
    console.error('📋 Детали ошибки:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    accountObjects.value = [];
  } finally {
    loadingAccountObjects.value = false;
  }
};

// Загрузка тарифных планов
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

const formatCurrency = (amount: number, currency = 'RUB'): string => {
  return contractsService.formatCurrency(amount, currency);
};

// Watcher для автоматической загрузки объектов при изменении account_id
watch(() => form.value.account_id, async (newAccountId, oldAccountId) => {
  console.log('🔵 watch account_id changed:', { newAccountId, oldAccountId });
  if (newAccountId && newAccountId !== oldAccountId) {
    await onAccountSelected(newAccountId);
  } else if (!newAccountId) {
    accountObjects.value = [];
    selectedAccountName.value = '';
    selectedObjectsForContract.value = [];
    objectsSearchQuery.value = '';
  }
});

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadTariffPlans(),
    loadAccounts(),
  ]);
});
</script>

<style scoped>
.create-contract-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 4px 0 0 0;
}

.form-card {
  margin-bottom: 24px;
}

.form-content {
  padding: 24px;
}

.form-section {
  margin-bottom: 32px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  color: rgb(var(--v-theme-primary));
}

.form-actions {
  padding: 0 24px 24px;
}

.actions-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Responsive */
@media (max-width: 768px) {
  .create-contract-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .form-content {
    padding: 16px;
  }

  .form-section {
    margin-bottom: 24px;
  }
}

.objects-card {
  margin-top: 16px;
}

.objects-table-container {
  max-height: 500px;
  overflow-y: auto;
}

.objects-table {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.object-name-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>

