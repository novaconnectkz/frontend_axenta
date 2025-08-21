<template>
  <v-dialog v-model="dialog" max-width="800px" persistent>
    <v-card>
      <v-card-title class="dialog-header">
        <v-icon :icon="isEdit ? 'mdi-pencil' : 'mdi-plus'" class="mr-3" />
        {{ isEdit ? 'Редактирование договора' : 'Создание договора' }}
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
      </v-card-title>

      <v-divider />

      <v-card-text class="dialog-content">
        <v-form ref="formRef" v-model="formValid" @submit.prevent="saveContract">
          <v-container>
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
          </v-container>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="dialog-actions">
        <v-spacer />
        <AppleButton variant="text" @click="closeDialog">
          Отмена
        </AppleButton>
        <AppleButton 
          @click="saveContract" 
          :loading="saving"
          :disabled="!formValid"
          color="primary"
        >
          {{ isEdit ? 'Сохранить' : 'Создать' }}
        </AppleButton>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import type { 
  ContractWithRelations, 
  ContractForm,
  CONTRACT_STATUS_LABELS,
  CURRENCY_OPTIONS,
  NOTIFICATION_PERIOD_OPTIONS,
} from '@/types/contracts';
import type { BillingPlan } from '@/types/billing';
import contractsService from '@/services/contractsService';
import { AppleButton, AppleInput } from '@/components/Apple';

// Props
interface Props {
  modelValue: boolean;
  contract?: ContractWithRelations | null;
  tariffPlans: BillingPlan[];
}

const props = withDefaults(defineProps<Props>(), {
  contract: null,
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  success: [message: string];
  error: [message: string];
}>();

// Reactive data
const formRef = ref();
const formValid = ref(false);
const saving = ref(false);
const loadingTariffPlans = ref(false);

// Computed
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const isEdit = computed(() => !!props.contract);

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

const notificationOptions = NOTIFICATION_PERIOD_OPTIONS.map(option => ({
  value: option.value,
  title: option.title,
}));

const tariffPlanOptions = computed(() => {
  return props.tariffPlans.map(plan => ({
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
const resetForm = () => {
  form.value = { ...defaultForm };
  if (formRef.value) {
    formRef.value.resetValidation();
  }
};

const fillForm = (contract: ContractWithRelations) => {
  form.value = {
    number: contract.number,
    title: contract.title,
    description: contract.description || '',
    client_name: contract.client_name,
    client_inn: contract.client_inn || '',
    client_kpp: contract.client_kpp || '',
    client_email: contract.client_email || '',
    client_phone: contract.client_phone || '',
    client_address: contract.client_address || '',
    start_date: contract.start_date.split('T')[0],
    end_date: contract.end_date.split('T')[0],
    tariff_plan_id: contract.tariff_plan_id,
    total_amount: contract.total_amount,
    currency: contract.currency,
    status: contract.status,
    is_active: contract.is_active,
    notify_before: contract.notify_before,
    notes: contract.notes || '',
    external_id: contract.external_id || '',
  };
};

const onTariffPlanChange = (planId: number) => {
  const selectedPlan = props.tariffPlans.find(plan => plan.id === planId);
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
    if (isEdit.value && props.contract) {
      await contractsService.updateContract(props.contract.id, form.value);
      emit('success', 'Договор успешно обновлен');
    } else {
      await contractsService.createContract(form.value);
      emit('success', 'Договор успешно создан');
    }
    closeDialog();
  } catch (error: any) {
    console.error('Error saving contract:', error);
    emit('error', error.message || 'Ошибка сохранения договора');
  } finally {
    saving.value = false;
  }
};

const closeDialog = () => {
  dialog.value = false;
  nextTick(() => {
    resetForm();
  });
};

const formatCurrency = (amount: number, currency = 'RUB'): string => {
  return contractsService.formatCurrency(amount, currency);
};

// Watchers
watch(() => props.contract, (newContract) => {
  if (newContract) {
    fillForm(newContract);
  } else {
    resetForm();
  }
}, { immediate: true });

watch(() => props.modelValue, (newValue) => {
  if (newValue && props.contract) {
    fillForm(props.contract);
  } else if (newValue) {
    resetForm();
  }
});
</script>

<style scoped>
.dialog-header {
  padding: 20px 24px 16px;
  font-size: 20px;
  font-weight: 600;
}

.dialog-content {
  padding: 0;
  max-height: 70vh;
  overflow-y: auto;
}

.dialog-actions {
  padding: 16px 24px 20px;
}

.form-section {
  margin-bottom: 32px;
  padding: 0 24px;
}

.form-section:last-child {
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  color: rgb(var(--v-theme-primary));
}

:deep(.v-field) {
  margin-bottom: 8px;
}

:deep(.v-input--density-comfortable) {
  --v-input-control-height: 48px;
}

/* Responsive */
@media (max-width: 768px) {
  .dialog-header {
    padding: 16px 20px 12px;
    font-size: 18px;
  }

  .form-section {
    padding: 0 20px;
    margin-bottom: 24px;
  }

  .dialog-actions {
    padding: 12px 20px 16px;
  }
}
</style>

