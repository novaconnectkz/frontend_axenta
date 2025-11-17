<template>
  <v-dialog v-model="show" max-width="900px" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-wizard-hat</v-icon>
        <span>Мастер создания подписки</span>
        <v-spacer></v-spacer>
        <v-btn icon variant="text" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <!-- Шаги мастера -->
        <v-stepper v-model="currentStep" class="elevation-0">
          <v-stepper-header>
            <v-stepper-item
              :complete="currentStep > 1"
              :title="'Шаг 1'"
              subtitle="Договор"
              value="1"
            ></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item
              :complete="currentStep > 2"
              :title="'Шаг 2'"
              subtitle="Тариф"
              :disabled="!canProceedToStep2"
              value="2"
            ></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item
              :complete="currentStep > 3"
              :title="'Шаг 3'"
              subtitle="Учетная запись"
              :disabled="currentStep < 2"
              value="3"
            ></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item
              :complete="currentStep > 4"
              :title="'Шаг 4'"
              subtitle="Период"
              :disabled="currentStep < 3"
              value="4"
            ></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item
              :complete="currentStep > 5"
              :title="'Шаг 5'"
              subtitle="Превью"
              :disabled="currentStep < 4"
              value="5"
            ></v-stepper-item>
          </v-stepper-header>

          <v-stepper-window>
            <!-- Шаг 1: Выбор договора -->
            <v-stepper-window-item value="1">
              <div class="pa-4">
                <h3 class="mb-4">Выберите договор</h3>
                
                <v-select
                  v-model="form.contract_id"
                  :items="contractOptions"
                  item-title="title"
                  item-value="id"
                  label="Договор"
                  variant="outlined"
                  :loading="loadingContracts"
                  :error="!!errors.contract_id"
                  :error-messages="errors.contract_id"
                  @update:model-value="onContractSelected"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-icon>mdi-file-document</v-icon>
                      </template>
                      <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ item.raw.client_name }} • {{ item.raw.status }}
                      </v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-select>

                <!-- Предупреждение о существующих подписках -->
                <v-alert
                  v-if="existingSubscriptions.length > 0"
                  type="warning"
                  class="mt-4"
                  variant="tonal"
                >
                  <div class="d-flex align-center">
                    <v-icon class="mr-2">mdi-alert</v-icon>
                    <div class="flex-grow-1">
                      <strong>Объект уже в подписке</strong>
                      <div class="text-caption mt-1">
                        Найдено {{ existingSubscriptions.length }} активных подписок для этого договора
                      </div>
                      <div v-for="sub in existingSubscriptions" :key="sub.id" class="mt-2">
                        <v-chip size="small" class="mr-2">
                          {{ sub.billing_plan?.name }}
                        </v-chip>
                        <span class="text-caption">
                          до {{ formatDate(sub.end_date || sub.next_payment_date) }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <template v-slot:append>
                    <v-checkbox
                      v-model="form.transfer_from_existing"
                      label="Перенести в новый тариф"
                      hide-details
                      density="compact"
                    ></v-checkbox>
                  </template>
                </v-alert>

                <!-- Ошибка прав доступа -->
                <v-alert
                  v-if="!hasTariffAccess && form.contract_id"
                  type="error"
                  class="mt-4"
                  variant="tonal"
                >
                  <v-icon class="mr-2">mdi-lock</v-icon>
                  <strong>Нет прав на тарифы в этом договоре</strong>
                  <div class="text-caption mt-1">
                    Выберите другой договор или обратитесь к администратору
                  </div>
                </v-alert>
              </div>
            </v-stepper-window-item>

            <!-- Шаг 2: Выбор тарифа -->
            <v-stepper-window-item value="2">
              <div class="pa-4">
                <h3 class="mb-4">Выберите тарифный план</h3>
                
                <v-select
                  v-model="form.billing_plan_id"
                  :items="availablePlans"
                  item-title="title"
                  item-value="id"
                  label="Тарифный план"
                  variant="outlined"
                  :loading="loadingPlans"
                  :error="!!errors.billing_plan_id"
                  :error-messages="errors.billing_plan_id"
                  @update:model-value="onPlanSelected"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-icon :color="item.raw.is_popular ? 'orange' : 'primary'">
                          {{ item.raw.is_popular ? 'mdi-star' : 'mdi-package-variant' }}
                        </v-icon>
                      </template>
                      <v-list-item-title>
                        {{ item.raw.name }}
                        <v-chip v-if="item.raw.is_popular" size="x-small" color="orange" class="ml-2">
                          Популярный
                        </v-chip>
                      </v-list-item-title>
                      <v-list-item-subtitle>
                        {{ formatPrice(item.raw.price, item.raw.currency) }} / {{ getPeriodText(item.raw.billing_period) }}
                      </v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-select>

                <!-- Описание тарифа -->
                <v-card v-if="selectedPlan" variant="outlined" class="mt-4">
                  <v-card-text>
                    <div class="text-body-2">{{ selectedPlan.description }}</div>
                    <v-divider class="my-2"></v-divider>
                    <div class="d-flex flex-wrap gap-2">
                      <v-chip size="small" v-if="selectedPlan.max_devices > 0">
                        <v-icon start size="small">mdi-devices</v-icon>
                        {{ selectedPlan.max_devices }} устройств
                      </v-chip>
                      <v-chip size="small" v-if="selectedPlan.max_users > 0">
                        <v-icon start size="small">mdi-account-multiple</v-icon>
                        {{ selectedPlan.max_users }} пользователей
                      </v-chip>
                      <v-chip size="small" v-if="selectedPlan.has_analytics">
                        <v-icon start size="small">mdi-chart-line</v-icon>
                        Аналитика
                      </v-chip>
                      <v-chip size="small" v-if="selectedPlan.has_api">
                        <v-icon start size="small">mdi-api</v-icon>
                        API
                      </v-chip>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </v-stepper-window-item>

            <!-- Шаг 3: Учетная запись и объекты -->
            <v-stepper-window-item value="3">
              <div class="pa-4">
                <h3 class="mb-4">Учетная запись и объекты</h3>
                
                <v-autocomplete
                  v-model="form.account_id"
                  :items="accountOptions"
                  item-title="title"
                  item-value="value"
                  label="Учетная запись"
                  placeholder="Начните вводить название учетной записи..."
                  variant="outlined"
                  :loading="loadingAccounts"
                  hint="Выберите учетную запись для автоматической привязки её объектов к подписке"
                  persistent-hint
                  clearable
                  :search="accountSearchQuery"
                  @update:search="handleAccountSearch"
                  no-data-text="Учетные записи не найдены"
                  loading-text="Загрузка учетных записей..."
                  :menu-props="{ maxHeight: 300 }"
                  @update:model-value="onAccountSelected"
                  @focus="handleAccountAutocompleteFocus"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-avatar size="small" :color="(item.raw as any)?.isActive ? 'success' : 'error'">
                          <v-icon :icon="(item.raw as any)?.isActive ? 'mdi-check' : 'mdi-close'" />
                        </v-avatar>
                      </template>
                      
                      <v-list-item-title>{{ (item.raw as any)?.name || item.title }}</v-list-item-title>
                      <v-list-item-subtitle>
                        <div class="d-flex align-center flex-wrap ga-2">
                          <v-chip
                            :color="getObjectsTotal(item.raw) > 0 ? 'primary' : 'grey'"
                            size="small"
                            variant="flat"
                            class="font-weight-medium"
                          >
                            <v-icon start size="small">mdi-package-variant</v-icon>
                            {{ getObjectsTotal(item.raw) }} объектов
                          </v-chip>
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
                  <template v-slot:selection="{ item }">
                    <div class="d-flex align-center ga-2">
                      <span v-if="item && typeof item === 'object' && (item as any).raw" class="font-weight-medium">
                        {{ (item as any).raw?.name || (item as any).raw?.title }}
                      </span>
                      <span v-else-if="selectedAccount" class="font-weight-medium">
                        {{ selectedAccount.name }}
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

                <!-- Список объектов учетной записи -->
                <v-card v-if="form.account_id" variant="outlined" class="mt-4">
                  <v-card-title class="text-subtitle-1 d-flex align-center justify-space-between">
                    <div class="d-flex align-center">
                      <v-icon icon="mdi-package-variant" size="small" class="mr-2" />
                      Объекты для привязки к подписке
                      <v-chip size="small" variant="tonal" color="primary" class="ml-2">
                        {{ accountObjects.length }}
                      </v-chip>
                    </div>
                    <div v-if="selectedObjects.length > 0" class="d-flex align-center">
                      <v-chip size="small" variant="outlined" color="primary" class="mr-2">
                        Выбрано: {{ selectedObjects.length }}
                      </v-chip>
                      <v-btn
                        variant="text"
                        size="small"
                        prepend-icon="mdi-close"
                        @click="selectedObjects = []"
                      >
                        Сбросить
                      </v-btn>
                    </div>
                  </v-card-title>
                  <v-divider />
                  
                  <!-- Поиск объектов -->
                  <v-card-text class="pb-0">
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
                  <div v-if="loadingAccountObjects" class="pa-3">
                    <v-progress-linear indeterminate color="primary" />
                    <div class="text-caption text-center mt-2">Загрузка объектов...</div>
                  </div>

                  <!-- Таблица объектов -->
                  <div v-else-if="filteredAccountObjects.length > 0" class="pa-3">
                    <v-data-table
                      v-model="selectedObjects"
                      :headers="objectsTableHeaders"
                      :items="filteredAccountObjects"
                      item-value="id"
                      show-select
                      density="compact"
                      hide-default-footer
                      :items-per-page="10"
                    >
                      <template #item.name="{ item }">
                        <div>
                          <div class="font-weight-medium">{{ item.name }}</div>
                          <div v-if="item.description" class="text-caption text-grey-600">
                            {{ item.description }}
                          </div>
                        </div>
                      </template>
                      <template #item.imei="{ item }">
                        <span v-if="item.imei">{{ item.imei }}</span>
                        <span v-else class="text-grey-400">—</span>
                      </template>
                      <template #item.phone_number="{ item }">
                        <span v-if="item.phone_number">{{ item.phone_number }}</span>
                        <span v-else class="text-grey-400">—</span>
                      </template>
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
                  <v-card-text v-else-if="!loadingAccountObjects">
                    <v-alert 
                      type="info" 
                      variant="tonal" 
                      density="compact"
                      text="У этой учетной записи нет объектов"
                    />
                  </v-card-text>
                </v-card>
              </div>
            </v-stepper-window-item>

            <!-- Шаг 4: Период -->
            <v-stepper-window-item value="4">
              <div class="pa-4">
                <h3 class="mb-4">Настройка периода</h3>
                
                <v-row>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="form.start_date"
                      label="Дата начала"
                      type="date"
                      variant="outlined"
                      :min="minStartDate"
                      :error="!!errors.start_date"
                      :error-messages="errors.start_date"
                      @update:model-value="onStartDateChanged"
                    >
                      <template v-slot:append>
                        <v-icon>mdi-calendar</v-icon>
                      </template>
                    </v-text-field>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model.number="form.contract_period_months"
                      label="Период договора (месяцев)"
                      type="number"
                      min="1"
                      variant="outlined"
                      hide-details
                      placeholder="Пусто = период из тарифа"
                      class="contract-period-input"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-switch
                      v-model="form.is_auto_renew"
                      color="primary"
                      hide-details
                    >
                      <template #label>
                        <span>Автоматическая пролонгация: {{ form.is_auto_renew ? 'Включена' : 'Отключена' }}</span>
                      </template>
                    ></v-switch>
                  </v-col>
                </v-row>

                <!-- Предложение разбить период -->
                <v-alert
                  v-if="shouldSplitPeriod"
                  type="info"
                  class="mt-4"
                  variant="tonal"
                >
                  <div class="d-flex align-center">
                    <v-icon class="mr-2">mdi-information</v-icon>
                    <div class="flex-grow-1">
                      <strong>Смена тарифа в середине месяца</strong>
                      <div class="text-caption mt-1">
                        Вы можете разбить период и рассчитать стоимость пропорционально
                      </div>
                    </div>
                  </div>
                  <template v-slot:append>
                    <v-checkbox
                      v-model="form.split_period"
                      label="Разбить период"
                      hide-details
                      density="compact"
                      @update:model-value="recalculatePrice"
                    ></v-checkbox>
                  </template>
                </v-alert>

                <!-- Информация о запланированной активации -->
                <v-alert
                  v-if="isScheduledStart"
                  type="info"
                  class="mt-4"
                  variant="tonal"
                >
                  <v-icon class="mr-2">mdi-clock-outline</v-icon>
                  <strong>Подписка будет запланирована</strong>
                  <div class="text-caption mt-1">
                    Подписка создастся со статусом "Запланированная" и активируется автоматически в 00:00 {{ formatDate(form.start_date) }}
                  </div>
                </v-alert>
              </div>
            </v-stepper-window-item>

            <!-- Шаг 5: Превью -->
            <v-stepper-window-item value="5">
              <div class="pa-4">
                <h3 class="mb-4">Превью подписки</h3>
                
                <!-- НДС/ЕСФ тоггл -->
                <v-card variant="outlined" class="mb-4">
                  <v-card-text>
                    <div class="d-flex align-center justify-space-between">
                      <div class="d-flex align-center">
                        <v-switch
                          v-model="showVAT"
                          label="Показать с НДС"
                          color="primary"
                          hide-details
                          density="compact"
                          class="mr-4"
                        ></v-switch>
                        <v-switch
                          v-model="requiresESF"
                          label="ЭСФ требуется"
                          color="orange"
                          hide-details
                          density="compact"
                          readonly
                        ></v-switch>
                        <v-icon
                          :color="requiresESF ? 'orange' : 'grey'"
                          class="ml-2"
                          :icon="requiresESF ? 'mdi-file-document-check' : 'mdi-file-document-remove'"
                        ></v-icon>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>

                <!-- Сводка -->
                <v-card variant="outlined">
                  <v-card-title>Сводка подписки</v-card-title>
                  <v-card-text>
                    <v-list>
                      <v-list-item>
                        <v-list-item-title>Договор</v-list-item-title>
                        <template v-slot:append>
                          <span class="text-body-2">{{ selectedContract?.title || selectedContract?.number }}</span>
                        </template>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Тарифный план</v-list-item-title>
                        <template v-slot:append>
                          <span class="text-body-2">{{ selectedPlan?.name }}</span>
                        </template>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Дата начала</v-list-item-title>
                        <template v-slot:append>
                          <span class="text-body-2">{{ formatDate(form.start_date) }}</span>
                        </template>
                      </v-list-item>
                      <v-list-item v-if="form.split_period && periodInfo">
                        <v-list-item-title>Период (пропорционально)</v-list-item-title>
                        <template v-slot:append>
                          <span class="text-body-2 text-orange">
                            {{ periodInfo.days }} дней
                          </span>
                        </template>
                      </v-list-item>
                      <v-divider class="my-2"></v-divider>
                      <v-list-item>
                        <v-list-item-title class="font-weight-bold">Базовая цена</v-list-item-title>
                        <template v-slot:append>
                          <span class="text-h6">{{ formatPrice(basePrice, selectedPlan?.currency || 'RUB') }}</span>
                        </template>
                      </v-list-item>
                      <v-list-item v-if="showVAT && taxAmount > 0">
                        <v-list-item-title>НДС ({{ taxRate }}%)</v-list-item-title>
                        <template v-slot:append>
                          <span class="text-body-2">{{ formatPrice(taxAmount, selectedPlan?.currency || 'RUB') }}</span>
                        </template>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title class="font-weight-bold text-h6">Итого</v-list-item-title>
                        <template v-slot:append>
                          <span class="text-h5 text-primary">{{ formatPrice(totalPrice, selectedPlan?.currency || 'RUB') }}</span>
                        </template>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </div>
            </v-stepper-window-item>
          </v-stepper-window>
        </v-stepper>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-btn
          v-if="currentStep > 1"
          variant="outlined"
          @click="previousStep"
        >
          Назад
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          @click="close"
        >
          Отмена
        </v-btn>
        <v-btn
          v-if="currentStep < 4"
          color="primary"
          :disabled="!canProceed"
          @click="nextStep"
        >
          Далее
        </v-btn>
        <v-btn
          v-else
          color="primary"
          :loading="creating"
          :disabled="!canCreate"
          @click="createSubscription"
        >
          Создать подписку
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { billingService } from '@/services/billingService'
import contractsService from '@/services/contractsService'
import { accountsService, type Account } from '@/services/accountsService'
import { getObjectsService } from '@/services/objectsService'
import type { BillingPlan, CreateSubscriptionData, Subscription } from '@/types/billing'
import type { Contract } from '@/types/contracts'

interface Props {
  modelValue: boolean
  companyId: number | string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'created', subscription: Subscription): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Конвертируем companyId в число, если это строка
const companyId = computed(() => {
  return typeof props.companyId === 'string' ? parseInt(props.companyId, 10) : props.companyId
})

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Состояние
const currentStep = ref(1)
const creating = ref(false)
const loadingContracts = ref(false)
const loadingPlans = ref(false)
const loadingSubscriptions = ref(false)

// Форма
const form = ref<CreateSubscriptionData & {
  contract_id?: number
  transfer_from_existing?: boolean
  split_period?: boolean
  contract_period_months?: number | null
  account_id?: number
}>({
  company_id: companyId.value,
  billing_plan_id: 0,
  start_date: new Date().toISOString().split('T')[0],
  is_auto_renew: true,
  status: 'active',
  contract_id: undefined,
  transfer_from_existing: false,
  split_period: false,
  contract_period_months: null,
  account_id: undefined
})

// Данные
const contracts = ref<Contract[]>([])
const plans = ref<BillingPlan[]>([])
const existingSubscriptions = ref<Subscription[]>([])
const billingSettings = ref<any>(null)
const accounts = ref<Account[]>([])
const loadingAccounts = ref(false)
const accountSearchQuery = ref('')
const accountObjects = ref<any[]>([])
const loadingAccountObjects = ref(false)
const selectedObjects = ref<number[]>([])
const objectsSearchQuery = ref('')

// Ошибки
const errors = ref<Record<string, string>>({})

// Флаги
const hasTariffAccess = ref(true)
const showVAT = ref(false)
const requiresESF = computed(() => {
  // Логика определения необходимости ЭСФ по стране покупателя из договора
  if (!selectedContract.value) return false
  // Если страна покупателя не Россия, может потребоваться ЭСФ
  // Проверяем по полю buyer_country_code (если есть в типе)
  const contract = selectedContract.value as any
  return contract.buyer_country_code && 
         contract.buyer_country_code !== 'RU'
})

// Вычисляемые свойства
const contractOptions = computed(() => {
  return contracts.value.map(contract => ({
    id: contract.id,
    title: `${contract.number} - ${contract.title || contract.client_name}`,
    client_name: contract.client_name,
    status: contract.status
  }))
})

const selectedContract = computed(() => {
  if (!form.value.contract_id) return null
  return contracts.value.find(c => c.id === form.value.contract_id)
})

const availablePlans = computed(() => {
  return plans.value
    .filter(plan => plan.is_active)
    .map(plan => ({
      id: plan.id,
      title: `${plan.name} - ${billingService.formatCurrency(plan.price, plan.currency)}`,
      ...plan
    }))
})

const selectedPlan = computed(() => {
  if (!form.value.billing_plan_id) return null
  return plans.value.find(p => p.id === form.value.billing_plan_id)
})

const canProceedToStep2 = computed(() => {
  return form.value.contract_id && hasTariffAccess.value
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return form.value.contract_id && hasTariffAccess.value
    case 2:
      return form.value.billing_plan_id > 0
    case 3:
      return true // Учетная запись не обязательна
    case 4:
      return !!form.value.start_date
    default:
      return true
  }
})

const canCreate = computed(() => {
  return form.value.billing_plan_id > 0 && 
         form.value.start_date && 
         !creating.value
})

const minStartDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const isScheduledStart = computed(() => {
  if (!form.value.start_date) return false
  const startDate = new Date(form.value.start_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return startDate > today
})

const shouldSplitPeriod = computed(() => {
  if (!form.value.start_date || !selectedPlan.value) return false
  const startDate = new Date(form.value.start_date)
  const today = new Date()
  // Проверяем, начинается ли подписка не с начала месяца
  return startDate.getDate() > 1 && startDate.getMonth() === today.getMonth()
})

const periodInfo = computed(() => {
  if (!form.value.start_date || !form.value.split_period) return null
  const startDate = new Date(form.value.start_date)
  const endOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
  const days = endOfMonth.getDate() - startDate.getDate() + 1
  return { days }
})

const taxRate = computed(() => {
  return billingSettings.value?.default_tax_rate || 20
})

const basePrice = computed(() => {
  if (!selectedPlan.value) return 0
  let price = selectedPlan.value.price
  
  // Если разбит период, пропорционально
  if (form.value.split_period && periodInfo.value && selectedPlan.value.billing_period === 'monthly') {
    const daysInMonth = new Date(new Date(form.value.start_date).getFullYear(), new Date(form.value.start_date).getMonth() + 1, 0).getDate()
    price = (price * periodInfo.value.days) / daysInMonth
  }
  
  return price
})

const taxAmount = computed(() => {
  if (!showVAT.value) return 0
  return (basePrice.value * taxRate.value) / 100
})

const totalPrice = computed(() => {
  return basePrice.value + (showVAT.value ? taxAmount.value : 0)
})

// Методы
const loadContracts = async () => {
  loadingContracts.value = true
  try {
    const result = await contractsService.getContracts({ limit: 1000 })
    contracts.value = result.contracts.filter(c => c.status === 'active')
  } catch (error) {
    console.error('Ошибка загрузки договоров:', error)
  } finally {
    loadingContracts.value = false
  }
}

const loadPlans = async () => {
  loadingPlans.value = true
  try {
    plans.value = await billingService.getBillingPlans(companyId.value)
  } catch (error) {
    console.error('Ошибка загрузки планов:', error)
  } finally {
    loadingPlans.value = false
  }
}

const loadBillingSettings = async () => {
  try {
    billingSettings.value = await billingService.getBillingSettings(companyId.value)
    showVAT.value = billingSettings.value?.tax_included || false
  } catch (error) {
    console.error('Ошибка загрузки настроек:', error)
  }
}

const checkExistingSubscriptions = async () => {
  if (!form.value.contract_id) {
    existingSubscriptions.value = []
    return
  }
  loadingSubscriptions.value = true
  try {
    const subscriptions = await billingService.getSubscriptions(companyId.value)
    // Проверяем подписки для выбранного договора (если есть связь через contract_id)
    // Пока проверяем все активные подписки компании
    existingSubscriptions.value = subscriptions.filter(
      s => (s.status === 'active' || s.status === 'scheduled') && s.company_id === companyId.value
    )
  } catch (error) {
    console.error('Ошибка проверки подписок:', error)
  } finally {
    loadingSubscriptions.value = false
  }
}

const checkTariffAccess = async () => {
  if (!form.value.contract_id) {
    hasTariffAccess.value = true
    return
  }
  
  // Проверяем права на тарифы для договора
  // Пока заглушка - всегда true, но можно добавить проверку через API
  try {
    const contract = contracts.value.find(c => c.id === form.value.contract_id)
    // Если у договора есть tariff_plan_id, значит есть доступ
    hasTariffAccess.value = !!contract?.tariff_plan_id
  } catch (error) {
    hasTariffAccess.value = false
  }
}

const onContractSelected = async () => {
  errors.value.contract_id = ''
  await checkTariffAccess()
  await checkExistingSubscriptions()
}

const onPlanSelected = () => {
  errors.value.billing_plan_id = ''
  recalculatePrice()
}

const onStartDateChanged = () => {
  errors.value.start_date = ''
  if (isScheduledStart.value) {
    form.value.status = 'scheduled'
  } else {
    form.value.status = 'active'
  }
  recalculatePrice()
}

const recalculatePrice = () => {
  // Пересчет уже происходит в computed свойствах
}

const nextStep = () => {
  if (canProceed.value) {
    currentStep.value++
  }
}

const previousStep = () => {
  currentStep.value--
}

const createSubscription = async () => {
  if (!canCreate.value) return
  
  creating.value = true
  errors.value = {}
  
  try {
    const subscriptionData: CreateSubscriptionData & {
      account_id?: number
      object_ids?: number[]
      contract_period_months?: number | null
    } = {
      company_id: form.value.company_id,
      billing_plan_id: form.value.billing_plan_id!,
      start_date: form.value.start_date,
      status: form.value.status,
      is_auto_renew: form.value.is_auto_renew,
      contract_id: form.value.contract_id,
      split_period: form.value.split_period,
      contract_period_months: form.value.contract_period_months,
    }
    
    // Добавляем account_id и object_ids, если они выбраны
    if (form.value.account_id) {
      subscriptionData.account_id = form.value.account_id
    }
    
    if (selectedObjects.value.length > 0) {
      subscriptionData.object_ids = selectedObjects.value
    }
    
    if (form.value.transfer_from_existing && existingSubscriptions.value.length > 0) {
      subscriptionData.transfer_from_subscription_id = existingSubscriptions.value[0].id
    }
    
    const subscription = await billingService.createSubscription(subscriptionData)
    emit('created', subscription)
    close()
  } catch (error: any) {
    console.error('Ошибка создания подписки:', error)
    if (error.response?.data?.error) {
      errors.value.general = error.response.data.error
    } else {
      errors.value.general = 'Ошибка создания подписки'
    }
  } finally {
    creating.value = false
  }
}

const close = () => {
  show.value = false
  currentStep.value = 1
  form.value = {
    company_id: companyId.value,
    billing_plan_id: 0,
    start_date: new Date().toISOString().split('T')[0],
    is_auto_renew: true,
    status: 'active',
    contract_id: undefined,
    transfer_from_existing: false,
    split_period: false,
    contract_period_months: null,
    account_id: undefined
  }
  errors.value = {}
  existingSubscriptions.value = []
  accountObjects.value = []
  selectedObjects.value = []
  objectsSearchQuery.value = ''
  accountSearchQuery.value = ''
}

const formatDate = (date?: string) => {
  if (!date) return ''
  return billingService.formatDate(date)
}

const formatPrice = (amount: number, currency = 'RUB') => {
  return billingService.formatCurrency(amount, currency)
}

const getPeriodText = (period: string) => {
  const periods: Record<string, string> = {
    monthly: 'месяц',
    yearly: 'год',
    'one-time': 'разово'
  }
  return periods[period] || period
}

// Заголовки таблицы объектов
const objectsTableHeaders = [
  { title: 'Название', key: 'name', sortable: true },
  { title: 'IMEI', key: 'imei', sortable: true },
  { title: 'Телефон', key: 'phone_number', sortable: true },
  { title: 'Статус', key: 'status', sortable: true },
]

// Отфильтрованные объекты
const filteredAccountObjects = computed(() => {
  if (!objectsSearchQuery.value.trim()) {
    return accountObjects.value
  }
  const query = objectsSearchQuery.value.toLowerCase().trim()
  return accountObjects.value.filter(obj => {
    return (
      (obj.name && obj.name.toLowerCase().includes(query)) ||
      (obj.imei && obj.imei.toLowerCase().includes(query)) ||
      (obj.phone_number && obj.phone_number.toLowerCase().includes(query)) ||
      (obj.description && obj.description.toLowerCase().includes(query))
    )
  })
})

// Опции учетных записей
const accountOptions = computed(() => {
  return accounts.value.map(account => ({
    value: account.id,
    title: account.name,
    raw: account,
  }))
})

// Выбранная учетная запись
const selectedAccount = computed(() => {
  if (!form.value.account_id) return null
  return accounts.value.find(acc => acc.id === form.value.account_id) || null
})

// Функции для работы с объектами
const getObjectsTotal = (account: any) => {
  return account?.objectsTotal || account?.objects_total || 0
}

const getObjectsActive = (account: any) => {
  return account?.objectsActive || account?.objects_active || 0
}

// Загрузка учетных записей
const loadAccounts = async (search = '') => {
  if (loadingAccounts.value) return
  
  loadingAccounts.value = true
  try {
    const response = await accountsService.getAccounts(1, 50, { search })
    accounts.value = response.results || []
  } catch (error) {
    console.error('Ошибка загрузки учетных записей:', error)
    accounts.value = []
  } finally {
    loadingAccounts.value = false
  }
}

// Загрузка объектов учетной записи
const loadAccountObjects = async (accountId: number) => {
  loadingAccountObjects.value = true
  try {
    const account = accounts.value.find(acc => acc.id === accountId)
    if (!account) {
      console.warn('Учетная запись не найдена:', accountId)
      accountObjects.value = []
      return
    }
    
    // Загружаем объекты через getObjects с фильтром по accountId
    const objectsService = getObjectsService()
    const response = await objectsService.getObjects(1, 100, {
      accountId: account.id,
      accountName: account.name
    })
    
    // Фильтруем только объекты без договоров
    accountObjects.value = (response.data?.items || []).filter((obj: any) => !obj.contract_id)
  } catch (error) {
    console.error('Ошибка загрузки объектов:', error)
    accountObjects.value = []
  } finally {
    loadingAccountObjects.value = false
  }
}

// Обработчики
const handleAccountSearch = (query: string) => {
  accountSearchQuery.value = query
  if (query.length >= 2) {
    loadAccounts(query)
  } else if (query.length === 0) {
    loadAccounts()
  }
}

const handleAccountAutocompleteFocus = () => {
  if (accounts.value.length === 0) {
    loadAccounts()
  }
}

const onAccountSelected = (accountId: number | undefined) => {
  if (accountId) {
    loadAccountObjects(accountId)
  } else {
    accountObjects.value = []
    selectedObjects.value = []
  }
}

// Загрузка данных при открытии
watch(show, (isOpen) => {
  if (isOpen) {
    loadContracts()
    loadPlans()
    loadBillingSettings()
    loadAccounts()
  }
})
</script>

<style scoped>
.contract-period-input :deep(input::placeholder) {
  font-size: 0.75rem;
  opacity: 0.6;
}
</style>

