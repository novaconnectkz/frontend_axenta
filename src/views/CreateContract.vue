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
                <v-select
                  v-model="form.account_id"
                  :items="accountOptions"
                  label="Учетная запись"
                  variant="outlined"
                  density="comfortable"
                  prepend-icon="mdi-account"
                  :loading="loadingAccounts"
                  hint="Выберите учетную запись для автоматической привязки её объектов к договору"
                  persistent-hint
                  clearable
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #prepend>
                        <v-avatar size="small" :color="item.raw.isActive ? 'success' : 'error'">
                          <v-icon :icon="item.raw.isActive ? 'mdi-check' : 'mdi-close'" />
                        </v-avatar>
                      </template>
                      
                      <v-list-item-title>{{ item.title }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ item.raw.objectsActive }} активных объектов
                      </v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-select>
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
                        {{ formatCurrency(item.raw.price) }}/мес
                        • До {{ item.raw.max_devices }} устройств
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
import { computed, onMounted, ref } from 'vue';
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
    title: `${account.name}${account.objectsTotal > 0 ? ` (${account.objectsTotal} объектов)` : ''}`,
    raw: account,
  }));
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
    await contractsService.createContract(form.value);
    showSnackbarMessage('Договор успешно создан', 'success');
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

// Загрузка списка учетных записей
const loadAccounts = async () => {
  if (loadingAccounts.value) return;
  loadingAccounts.value = true;
  try {
    const response = await accountsService.getAccounts({ is_active: true });
    accounts.value = response.results || [];
  } catch (error) {
    console.error('Ошибка загрузки учетных записей:', error);
  } finally {
    loadingAccounts.value = false;
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
</style>

