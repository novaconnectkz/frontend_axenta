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
                  >
                    <template #append-inner>
                      <v-btn
                        v-if="!isEdit && showNumeratorSelection && selectedNumeratorId"
                        icon="mdi-reload"
                        size="small"
                        variant="text"
                        @click="generateNumber"
                        :loading="generatingNumber"
                        title="Сгенерировать номер"
                      ></v-btn>
                    </template>
                  </AppleInput>
                  <div v-if="!isEdit && showNumeratorSelection" class="mt-2">
                    <v-select
                      v-model="selectedNumeratorId"
                      :items="numeratorOptions"
                      label="Нумератор"
                      variant="outlined"
                      density="compact"
                      prepend-icon="mdi-format-list-numbered"
                      hint="Выберите нумератор для автоматической генерации номера"
                      persistent-hint
                      clearable
                      :loading="loadingNumerators"
                    >
                      <template #append-item>
                        <v-list-item 
                          class="d-flex justify-center cursor-pointer"
                          @click="router.push('/billing?tab=settings')"
                        >
                          <v-icon>mdi-format-list-numbered</v-icon>
                          <span class="ml-2">Настроить нумераторы</span>
                        </v-list-item>
                      </template>
                    </v-select>
                  </div>
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
            <div class="form-section" v-if="!isEdit">
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
                  >
                    <template #item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template #prepend>
                          <v-avatar size="small" :color="(item.raw as unknown as Account).isActive ? 'success' : 'error'">
                            <v-icon :icon="(item.raw as unknown as Account).isActive ? 'mdi-check' : 'mdi-close'" />
                          </v-avatar>
                        </template>
                        
                        <v-list-item-title>{{ (item.raw as unknown as Account).name }}</v-list-item-title>
                        <v-list-item-subtitle>
                          <span class="font-weight-medium">{{ (item.raw as unknown as Account).objectsActive ?? 0 }} активных объектов</span>
                          <span v-if="(item.raw as unknown as Account).objectsTotal !== undefined && (item.raw as unknown as Account).objectsTotal > 0 && (item.raw as unknown as Account).objectsTotal !== (item.raw as unknown as Account).objectsActive" class="text-caption text-grey-600 ml-1">
                            (всего: {{ (item.raw as unknown as Account).objectsTotal }})
                          </span>
                          <span v-if="(item.raw as unknown as Account).type" class="text-caption text-grey-500 ml-2">
                            • {{ (item.raw as unknown as Account).type === 'client' ? 'Клиент' : (item.raw as unknown as Account).type === 'partner' ? 'Партнер' : (item.raw as unknown as Account).type }}
                          </span>
                        </v-list-item-subtitle>
                      </v-list-item>
                    </template>
                    <template #selection="{ item }">
                      <span v-if="item && item.raw" class="font-weight-medium">{{ (item.raw as unknown as Account).name }}</span>
                      <span v-else-if="selectedAccount" class="font-weight-medium">{{ selectedAccount.name }}</span>
                    </template>
                  </v-autocomplete>
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
                    label="Полное наименование клиента"
                    :rules="[rules.required]"
                    prepend-icon="mdi-domain"
                    required
                  />
                </v-col>
                
                <v-col cols="12" md="4">
                  <div style="position: relative;" ref="innAutocompleteRef">
                    <AppleInput
                      ref="innInputRef"
                      :model-value="form.client_inn"
                      @update:modelValue="handleInnUpdate"
                      label="ИНН"
                      prepend-icon="mdi-card-account-details"
                      :rules="[rules.inn]"
                      :loading="loadingOrganizationData"
                      hint="Введите ИНН или ОГРН для поиска организации"
                      persistent-hint
                      @valueChange="handleInnUpdate"
                      @input="handleInnUpdate"
                      @focus="handleInnFocus"
                      @blur="handleInnBlur"
                    />
                    <!-- Выпадающее меню с результатами -->
                    <v-menu
                      v-model="showOrganizationMenu"
                      :activator="innAutocompleteRef"
                      location="bottom"
                      :max-height="400"
                      eager
                      offset-y
                    >
                      <v-list v-if="organizationSuggestions.length > 0" density="compact">
                        <v-list-item
                          v-for="(suggestion, index) in organizationSuggestions"
                          :key="index"
                          @click="onOrganizationSelect(suggestion)"
                          class="cursor-pointer"
                        >
                          <template #prepend>
                            <v-avatar size="small" color="primary">
                              <v-icon icon="mdi-domain" />
                            </v-avatar>
                          </template>
                          <v-list-item-title>{{ suggestion.name }}</v-list-item-title>
                          <v-list-item-subtitle>
                            <span v-if="suggestion.inn">ИНН: {{ suggestion.inn }}</span>
                            <span v-if="suggestion.kpp" class="ml-2">КПП: {{ suggestion.kpp }}</span>
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                      <v-list v-else-if="loadingOrganizationData" density="compact">
                        <v-list-item>
                          <v-list-item-title>Поиск организации...</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </div>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" md="12">
                  <AppleInput
                    v-model="form.client_short_name"
                    label="Сокращенное название с ОПФ"
                    prepend-icon="mdi-domain"
                    hint="Автоматически заполняется при выборе организации по ИНН"
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

            <!-- Скидки (только для партнерских договоров) -->
            <div class="form-section" v-if="isPartnerContract">
              <h3 class="section-title">
                <v-icon icon="mdi-percent" class="mr-2" />
                Скидки
              </h3>
              
              <v-row>
                <v-col cols="12">
                  <v-alert
                    density="compact"
                    type="info"
                    variant="tonal"
                    icon="mdi-information"
                    class="mb-4"
                  >
                    Можно использовать только один тип скидки. Приоритет: фиксированная > процентная > автоматическая.
                  </v-alert>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="form.discount_type"
                    :items="discountTypeOptions"
                    label="Тип скидки"
                    variant="outlined"
                    density="comfortable"
                    prepend-icon="mdi-tag"
                    hint="Выберите тип скидки для партнерского договора"
                    persistent-hint
                  />
                </v-col>

                <!-- Процентная скидка -->
                <v-col cols="12" md="6" v-if="form.discount_type === 'manual_percent'">
                  <AppleInput
                    v-model="form.manual_discount_percent"
                    label="Процент скидки"
                    prepend-icon="mdi-percent"
                    type="number"
                    min="0"
                    max="100"
                    suffix="%"
                    hint="0-100%"
                    persistent-hint
                    :rules="[
                      (v) => v === undefined || v === null || v === '' || (Number(v) >= 0 && Number(v) <= 100) || 'Значение должно быть от 0 до 100'
                    ]"
                  />
                </v-col>

                <!-- Фиксированная скидка -->
                <v-col cols="12" md="6" v-if="form.discount_type === 'manual_fixed'">
                  <AppleInput
                    v-model="form.manual_discount_fixed"
                    label="Фиксированная скидка"
                    prepend-icon="mdi-currency-rub"
                    type="number"
                    min="0"
                    suffix="₽"
                    hint="Сумма скидки в рублях"
                    persistent-hint
                    :rules="[rules.number]"
                  />
                </v-col>

                <!-- Автоматическая скидка (только описание) -->
                <v-col cols="12" v-if="form.discount_type === 'auto'">
                  <v-alert
                    density="compact"
                    type="success"
                    variant="tonal"
                    icon="mdi-auto-fix"
                  >
                    <strong>Автоматическая скидка</strong> рассчитывается по количеству объектов:<br>
                    • 1000+ объектов = 10%<br>
                    • 2000+ объектов = 20%<br>
                    • 4000+ объектов = 30%
                  </v-alert>
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
import { computed, nextTick, ref, watch, onMounted } from 'vue';
import type { DaDataOrganization } from '@/services/dadataService';
import { useRouter } from 'vue-router';
import type { 
  ContractWithRelations, 
  ContractForm,
  ContractNumerator,
} from '@/types/contracts';
import {
  CONTRACT_STATUS_LABELS,
  CURRENCY_OPTIONS,
  NOTIFICATION_PERIOD_OPTIONS,
  DISCOUNT_TYPE_OPTIONS,
} from '@/types/contracts';
import type { BillingPlan, BillingSettings } from '@/types/billing';
import type { Account } from '@/services/accountsService';
import contractsService from '@/services/contractsService';
import accountsService from '@/services/accountsService';
import dadataService from '@/services/dadataService';
import billingService from '@/services/billingService';
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
const loadingAccounts = ref(false);
const accounts = ref<Account[]>([]);
const generatingNumber = ref(false);
const numerators = ref<ContractNumerator[]>([]);
const loadingNumerators = ref(false);
const selectedNumeratorId = ref<number | null>(null);
const billingSettings = ref<BillingSettings | null>(null);
const loadingBillingSettings = ref(false);
const loadingOrganizationData = ref(false);
const selectedOrganization = ref<any>(null);
const innSearchQuery = ref<string>('');
const organizationSuggestions = ref<Array<{name: string; inn: string; kpp?: string; raw: DaDataOrganization}>>([]);
const innSearchTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const innAutocompleteRef = ref<any>(null);
const innInputRef = ref<any>(null);
const showOrganizationMenu = ref(false);
const router = useRouter();

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
const accountOptions = computed(() => {
  return accounts.value.map(account => ({
    value: account.id,
    title: account.name, // Только название учетной записи
    raw: account,
  }));
});

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
  client_short_name: '',
  client_inn: '',
  client_kpp: '',
  client_email: '',
  client_phone: '',
  client_address: '',
  status: 'draft',
  account_id: undefined,
  // Скидки (для партнерских договоров)
  discount_type: 'none',
  manual_discount_percent: 0,
  manual_discount_fixed: 0,
  use_auto_discount: false,
};

const form = ref<ContractForm>({ ...defaultForm });

// Обработчик обновления ИНН из событий компонента
const handleInnUpdate = (val: string | Event) => {
  let actualValue: string;
  if (val instanceof Event) {
    const target = val.target as HTMLInputElement;
    actualValue = target.value;
  } else {
    actualValue = String(val || '');
  }
  
  form.value.client_inn = actualValue;
  handleInnValueChanged(actualValue);
};

// Функция для обработки изменения ИНН - вызывается напрямую из событий
const handleInnValueChanged = (value: string) => {
  const actualValue = String(value || '').trim();
  
  // Обновляем form.client_inn (уже обновлен в handleInnUpdate, но на всякий случай)
  if (form.value.client_inn !== actualValue) {
    form.value.client_inn = actualValue;
  }
  
  // Проверяем валидность и запускаем поиск
  if (actualValue.length >= 10 && /^\d{10}$|^\d{12}$|^\d{13}$/.test(actualValue)) {
    innSearchQuery.value = actualValue;
    onInnSearch(actualValue);
  } else {
    if (actualValue === '') {
      organizationSuggestions.value = [];
      showOrganizationMenu.value = false;
    }
  }
};

// Watch для автоматического отслеживания form.client_inn (дополнительная проверка)
watch(
  () => form.value.client_inn,
  (newValue, oldValue) => {
    if (newValue !== oldValue && newValue) {
      const searchValue = String(newValue || '').trim();
      if (searchValue.length >= 10 && /^\d{10}$|^\d{12}$|^\d{13}$/.test(searchValue)) {
        // Вызываем напрямую, т.к. form.client_inn уже обновлен
        innSearchQuery.value = searchValue;
        onInnSearch(searchValue);
      }
    }
  },
  { immediate: false }
);

// Watch для очистки полей скидок при изменении типа
watch(
  () => form.value.discount_type,
  (newType) => {
    // Очищаем все поля скидок
    if (newType !== 'manual_percent' && newType !== 'manual') {
      form.value.manual_discount_percent = 0;
    }
    if (newType !== 'manual_fixed') {
      form.value.manual_discount_fixed = 0;
    }
    if (newType !== 'auto') {
      form.value.use_auto_discount = false;
    } else {
      form.value.use_auto_discount = true;
    }
  }
);

// Watch для сброса скидок при изменении типа договора
watch(
  () => form.value.contract_type,
  (newType) => {
    // Если переключились на не партнерский договор, сбрасываем скидки
    if (newType !== 'partner') {
      form.value.discount_type = 'none';
      form.value.manual_discount_percent = 0;
      form.value.manual_discount_fixed = 0;
      form.value.use_auto_discount = false;
    }
  }
);

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

const tariffPlanOptions = computed(() => {
  return props.tariffPlans.map(plan => ({
    value: plan.id,
    title: plan.name,
    raw: plan,
  }));
});

const numeratorOptions = computed(() => {
  return numerators.value.map(numerator => ({
    value: numerator.id,
    title: numerator.name,
    subtitle: `${numerator.template} (Счетчик: ${numerator.counter_value})`,
    raw: numerator,
  }));
});

// Опции типов скидок для партнерских договоров
const discountTypeOptions = DISCOUNT_TYPE_OPTIONS.map(option => ({
  value: option.value,
  title: option.title,
}));

// Проверка: является ли договор партнерским
const isPartnerContract = computed(() => {
  return form.value.contract_type === 'partner';
});

// Показывать выбор нумератора только если способ нумерации = "numerator"
const showNumeratorSelection = computed(() => {
  return billingSettings.value?.contract_numbering_method === 'numerator';
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
    const pattern = /^[0-9]{10}$|^[0-9]{12}$|^[0-9]{13}$/;
    return pattern.test(value) || 'ИНН должен содержать 10 или 12 цифр, ОГРН - 13 цифр';
  },
  number: (value: string) => {
    if (!value) return true;
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 || 'Должно быть положительное число';
  },
};

// Methods
const resetForm = () => {
  form.value = { ...defaultForm };
  selectedOrganization.value = null;
  innSearchQuery.value = '';
  organizationSuggestions.value = [];
  showOrganizationMenu.value = false;
  if (innSearchTimeout.value) {
    clearTimeout(innSearchTimeout.value);
    innSearchTimeout.value = null;
  }
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
    client_short_name: contract.client_short_name || '',
    client_inn: contract.client_inn || '',
    client_kpp: contract.client_kpp || '',
    client_email: contract.client_email || '',
    client_phone: contract.client_phone || '',
    client_address: contract.client_address || '',
    status: contract.status,
    account_id: undefined, // Не загружаем account_id при редактировании
    // Скидки (для партнерских договоров)
    discount_type: (contract as any).discount_type || 'none',
    manual_discount_percent: (contract as any).manual_discount_percent || 0,
    manual_discount_fixed: (contract as any).manual_discount_fixed || 0,
    use_auto_discount: (contract as any).use_auto_discount || false,
  };
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
      } else {
        hasMore = false;
      }
    }

    accounts.value = allAccounts;
    console.log(`✅ Всего загружено ${accounts.value.length} учетных записей`);
  } catch (error) {
    console.error('Ошибка загрузки учетных записей:', error);
  } finally {
    loadingAccounts.value = false;
  }
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

const onTariffPlanChange = (planId: number) => {
  const selectedPlan = props.tariffPlans.find(plan => plan.id === planId);
  if (selectedPlan && !form.value.total_amount) {
    // Период договора будет установлен через подписку
    // Поэтому пока просто устанавливаем месячную стоимость
    form.value.total_amount = selectedPlan.price.toString();
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

// Load billing settings
const loadBillingSettings = async () => {
  // Получаем company_id из localStorage
  const companyData = localStorage.getItem('axenta_company');
  let companyId: number | undefined;
  
  if (companyData) {
    try {
      const company = JSON.parse(companyData);
      companyId = parseInt(company.id, 10);
    } catch (e) {
      console.warn('Invalid company data in localStorage');
    }
  }
  
  if (!companyId) return;
  
  loadingBillingSettings.value = true;
  try {
    billingSettings.value = await billingService.getBillingSettings(companyId);
  } catch (error) {
    console.error('Error loading billing settings:', error);
  } finally {
    loadingBillingSettings.value = false;
  }
};

// Load numerators
const loadNumerators = async () => {
  // Получаем company_id из localStorage
  const companyData = localStorage.getItem('axenta_company');
  let companyId: number | undefined;
  
  if (companyData) {
    try {
      const company = JSON.parse(companyData);
      companyId = parseInt(company.id, 10);
    } catch (e) {
      console.warn('Invalid company data in localStorage');
    }
  }
  
  if (!companyId) return;
  
  loadingNumerators.value = true;
  try {
    numerators.value = await contractsService.getContractNumerators(companyId);
    
    // Auto-select default numerator if exists
    const defaultNumerator = numerators.value.find(n => n.is_default);
    if (defaultNumerator && !isEdit.value) {
      selectedNumeratorId.value = defaultNumerator.id;
    }
  } catch (error) {
    console.error('Error loading numerators:', error);
  } finally {
    loadingNumerators.value = false;
  }
};

// handleInnValueUpdate больше не используется - используем прямой watch

// Обработчик фокуса на поле ИНН
const handleInnFocus = () => {
  // Если есть результаты, показываем меню
  if (organizationSuggestions.value.length > 0) {
    showOrganizationMenu.value = true;
  }
};

// Обработчик потери фокуса
const handleInnBlur = () => {
  // Закрываем меню с небольшой задержкой, чтобы клик по элементу успел сработать
  setTimeout(() => {
    showOrganizationMenu.value = false;
  }, 200);
};

// Поиск организаций по ИНН/ОГРН с debounce
const onInnSearch = (value: string | null) => {
  const searchValue = (value || '').toString();
  
  // Очищаем предыдущий таймер
  if (innSearchTimeout.value) {
    clearTimeout(innSearchTimeout.value);
    innSearchTimeout.value = null;
  }
  
  // Очищаем результаты при очистке поля
  if (!searchValue || searchValue.trim() === '') {
    organizationSuggestions.value = [];
    selectedOrganization.value = null;
    return;
  }
  
  const cleanValue = searchValue.trim().replace(/\s+/g, '');
  
  // Проверяем, что это валидный ИНН или ОГРН
  if (!/^\d{10}$|^\d{12}$|^\d{13}$/.test(cleanValue)) {
    organizationSuggestions.value = [];
    return;
  }
  
  // Устанавливаем debounce на 500ms
  innSearchTimeout.value = setTimeout(async () => {
    await searchOrganizations(cleanValue);
  }, 500);
};

// Поиск организаций в DaData
const searchOrganizations = async (query: string) => {
  loadingOrganizationData.value = true;
  try {
    const orgData = await dadataService.findOrganizationById(query);
    
    if (orgData) {
      const extractedData = dadataService.extractOrganizationData(orgData);
      
      // Получаем название организации из данных
      let orgName = extractedData.client_name || '';
      // Если название не найдено, пытаемся получить из структуры orgData
      if (!orgName && orgData.value) {
        orgName = orgData.value;
      }
      if (!orgName) {
        // Пытаемся получить из вложенной структуры data
        const data = (orgData as any).data;
        if (data?.name) {
          if (typeof data.name === 'object') {
            orgName = data.name.full_with_opf || data.name.full || data.name.short_with_opf || data.name.short || '';
          } else if (typeof data.name === 'string') {
            orgName = data.name;
          }
        }
      }
      
      // Добавляем найденную организацию в список предложений
      const suggestion = {
        name: orgName || 'Организация',
        inn: extractedData.client_inn || query,
        kpp: extractedData.client_kpp,
        raw: orgData,
      };
      
      organizationSuggestions.value = [suggestion];
      
      // Даём Vue время обновить DOM
      await nextTick();
      
      // Открываем меню с результатами
      if (organizationSuggestions.value.length > 0) {
        showOrganizationMenu.value = true;
      }
    } else {
      organizationSuggestions.value = [];
    }
  } catch (error: any) {
    console.error('Ошибка поиска организации:', error);
    organizationSuggestions.value = [];
    // Показываем ошибку пользователю только если это не проблема с API ключом
    if (!error.message?.includes('API ключ DaData не настроен')) {
      emit('error', error.message || 'Ошибка при поиске организации');
    }
  } finally {
    loadingOrganizationData.value = false;
  }
};

// Обработчик выбора организации из списка
const onOrganizationSelect = (selected: any) => {
  // Если выбран объект из списка предложений
  if (selected && typeof selected === 'object' && selected.raw) {
    const orgData: DaDataOrganization = selected.raw;
    const extractedData = dadataService.extractOrganizationData(orgData);
    
    // Заполняем все поля данными из выбранной организации
    if (extractedData.client_name) {
      form.value.client_name = extractedData.client_name;
    }
    
    if (extractedData.client_short_name) {
      form.value.client_short_name = extractedData.client_short_name;
    }
    
    if (extractedData.client_inn) {
      form.value.client_inn = extractedData.client_inn;
    }
    
    if (extractedData.client_kpp) {
      form.value.client_kpp = extractedData.client_kpp;
    }
    
    if (extractedData.client_address) {
      form.value.client_address = extractedData.client_address;
    }
    
    if (extractedData.client_phone) {
      form.value.client_phone = extractedData.client_phone;
    }
    
    if (extractedData.client_email) {
      form.value.client_email = extractedData.client_email;
    }
    
    // Закрываем меню
    showOrganizationMenu.value = false;
    organizationSuggestions.value = [];
  }
};

// Generate contract number
const generateNumber = async () => {
  if (!selectedNumeratorId.value) return;
  
  // Если номер уже введен вручную, спрашиваем подтверждение
  if (form.value.number && form.value.number.trim() !== '') {
    const confirmed = confirm('Номер договора уже заполнен. Заменить его автоматически сгенерированным номером?');
    if (!confirmed) return;
  }
  
  generatingNumber.value = true;
  try {
    // Получаем company_id из localStorage
    const companyData = localStorage.getItem('axenta_company');
    let companyId: number | undefined;
    
    if (companyData) {
      try {
        const company = JSON.parse(companyData);
        companyId = parseInt(company.id, 10);
      } catch (e) {
        console.warn('Invalid company data in localStorage');
      }
    }
    
    const result = await contractsService.generateContractNumber(
      selectedNumeratorId.value,
      {
        client_id: form.value.account_id,
        company_id: companyId,
      }
    );
    form.value.number = result.number;
  } catch (error: any) {
    console.error('Error generating number:', error);
    emit('error', error.message || 'Ошибка генерации номера');
  } finally {
    generatingNumber.value = false;
  }
};

// Watcher для отслеживания изменений form.client_inn - ПРЯМОЙ вызов
watch(
  () => form.value.client_inn,
  (newValue, oldValue) => {
    console.log('🔍🔍🔍🔍🔍 WATCH FIRED: form.client_inn changed:', { 
      newValue, 
      oldValue, 
      newType: typeof newValue,
      oldType: typeof oldValue
    });
    
    const searchValue = (newValue || '').toString();
    const oldSearchValue = (oldValue || '').toString();
    
    // Вызываем поиск ТОЛЬКО если значение изменилось и не пустое
    if (searchValue !== oldSearchValue && searchValue.trim() !== '') {
      console.log('🔍 WATCH: Calling onInnSearch directly');
      innSearchQuery.value = searchValue;
      onInnSearch(searchValue);
    } else if (searchValue.trim() === '') {
      organizationSuggestions.value = [];
      showOrganizationMenu.value = false;
    }
  },
  { immediate: false }
);

// Альтернативный watch через глубокое отслеживание form объекта
watch(
  () => form.value,
  (newForm, oldForm) => {
    if (newForm.client_inn !== oldForm?.client_inn) {
      console.log('🔍 WATCH (deep): form.client_inn changed via deep watch');
      const searchValue = (newForm.client_inn || '').toString();
      if (searchValue.trim() !== '') {
        innSearchQuery.value = searchValue;
        onInnSearch(searchValue);
      }
    }
  },
  { deep: true, immediate: false }
);

// Watchers
watch(() => props.contract, (newContract) => {
  if (newContract) {
    fillForm(newContract);
  } else {
    resetForm();
  }
}, { immediate: true });

// Убрали автогенерацию при выборе нумератора - пользователь сам нажимает кнопку
// watch(() => selectedNumeratorId.value, (newId) => {
//   if (newId && !isEdit.value) {
//     generateNumber();
//   }
// });

watch(() => props.modelValue, (newValue) => {
  console.log('🔵 ContractDialog modelValue changed:', newValue, { isEdit: isEdit.value });
  if (newValue && props.contract) {
    fillForm(props.contract);
  } else if (newValue) {
    resetForm();
    // Загружаем список учетных записей при открытии диалога создания
    if (!isEdit.value) {
      console.log('🔵 Loading accounts for new contract...');
      loadAccounts();
      loadBillingSettings();
      loadNumerators();
    }
  }
  
  // Тестовый вызов при открытии диалога
  if (newValue && !isEdit.value) {
    console.log('🔍 Dialog opened, watch should be ready');
  }
}, { immediate: true });

// Lifecycle
onMounted(() => {
  console.log('🔍 ContractDialog mounted, initializing...');
  console.log('🔍 Initial form.client_inn:', form.value.client_inn);
  console.log('🔍 Testing API connection...');
  
  // Тестовый вызов API для проверки
  setTimeout(async () => {
    try {
      const testResult = await dadataService.findOrganizationById('6455051190');
      console.log('🔍 Test API call result:', testResult ? 'SUCCESS' : 'NO RESULT');
      if (testResult) {
        console.log('🔍 Test organization name:', testResult.value);
      }
    } catch (error) {
      console.error('🔍 Test API call error:', error);
    }
  }, 1000);
  
  // Функция для установки прямого обработчика на input
  const setupDirectInputListener = () => {
    console.log('🔴 setupDirectInputListener called');
    console.log('🔴 innInputRef.value:', innInputRef.value);
    
    if (!innInputRef.value) {
      console.log('🔴❌ innInputRef.value is null/undefined');
      return false;
    }
    
    const inputElement = (innInputRef.value as any)?.inputRef;
    console.log('🔴 inputElement:', inputElement);
    console.log('🔴 inputElement type:', typeof inputElement);
    
    if (!inputElement) {
      console.log('🔴❌ inputElement is null/undefined');
      // Попробуем получить через другой путь
      const input = innInputRef.value.$el?.querySelector('input');
      console.log('🔴 Trying $el.querySelector:', input);
      if (input) {
        console.log('🔴 Found input via $el.querySelector');
        const directHandler = (event: Event) => {
          const target = event.target as HTMLInputElement;
          const value = target.value;
          console.log('🔴🔴🔴 DIRECT EVENT LISTENER (querySelector) triggered with:', value);
          form.value.client_inn = value;
          handleInnValueChanged(value);
        };
        input.addEventListener('input', directHandler);
        console.log('🔴✅ Direct listener added via querySelector');
        return true;
      }
      return false;
    }
    
    console.log('🔴 Setting up DIRECT input event listener on element');
    // Удаляем старый обработчик если есть
    const oldHandler = (inputElement as any)._innDirectHandler;
    if (oldHandler) {
      console.log('🔴 Removing old handler');
      inputElement.removeEventListener('input', oldHandler);
    }
    
    const directHandler = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const value = target.value;
      console.log('🔴🔴🔴 DIRECT EVENT LISTENER triggered with:', value);
      form.value.client_inn = value;
      handleInnValueChanged(value);
    };
    
    // Сохраняем ссылку на обработчик для возможного удаления
    (inputElement as any)._innDirectHandler = directHandler;
    inputElement.addEventListener('input', directHandler);
    console.log('🔴✅ Direct event listener added successfully');
    console.log('🔴 Input element:', inputElement);
    console.log('🔴 Input value:', (inputElement as HTMLInputElement).value);
    return true;
  };

  // Добавляем обработчик при монтировании
  setTimeout(() => {
    if (!setupDirectInputListener()) {
      // Повторная попытка через 500ms
      setTimeout(() => setupDirectInputListener(), 500);
    }
  }, 100);
  
  // Добавляем обработчик при открытии диалога
  watch(() => props.modelValue, (isOpen) => {
    if (isOpen) {
      console.log('🔴 Dialog opened, setting up input listener...');
      // Ждем пока DOM обновится
      nextTick(() => {
        console.log('🔴 After nextTick, innInputRef.value:', !!innInputRef.value);
        setTimeout(() => {
          const success = setupDirectInputListener();
          if (success) {
            console.log('🔴✅ Direct listener setup SUCCESS');
          } else {
            console.log('🔴❌ Direct listener setup FAILED, retrying...');
            // Еще одна попытка через больший интервал
            setTimeout(() => {
              setupDirectInputListener();
            }, 1000);
          }
        }, 200);
      });
    }
  });
  
  loadBillingSettings();
  loadNumerators();
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

