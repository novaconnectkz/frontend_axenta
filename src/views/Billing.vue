<template>
  <v-container>
    <!-- Заголовок страницы -->
    <v-row class="mb-6">
      <v-col>
        <h1 class="text-h3 font-weight-bold text-primary">Биллинг</h1>
        <p class="text-h6 text-grey-darken-2 mt-2">
          Управление тарифными планами и подписками
        </p>
      </v-col>
    </v-row>

    <!-- Вкладки -->
    <v-tabs v-model="activeTab" color="primary" class="mb-6">
      <v-tab value="plans">
        <v-icon left>mdi-package-variant</v-icon>
        Тарифные планы
      </v-tab>
      <v-tab value="subscriptions">
        <v-icon left>mdi-credit-card</v-icon>
        Подписки
      </v-tab>
    </v-tabs>

    <!-- Тарифные планы -->
    <v-window v-model="activeTab">
      <v-window-item value="plans">
        <!-- Панель управления планами -->
        <v-card class="mb-6">
          <v-card-title>
            <span>Тарифные планы</span>
            <v-spacer></v-spacer>
            <v-btn 
              color="primary" 
              @click="openPlanDialog()"
              prepend-icon="mdi-plus"
            >
              Добавить план
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <!-- Фильтры -->
            <v-row class="mb-4">
              <v-col cols="12" md="6" lg="4">
                <v-text-field
                  v-model="planSearchQuery"
                  label="Поиск по названию"
                  prepend-icon="mdi-magnify"
                  clearable
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6" lg="4">
                <v-select
                  v-model="planStatusFilter"
                  :items="statusOptions"
                  label="Статус"
                  variant="outlined"
                  density="compact"
                  clearable
                ></v-select>
              </v-col>
            </v-row>

            <!-- Таблица планов -->
            <v-data-table
              :headers="planHeaders"
              :items="filteredPlans"
              :loading="loadingPlans"
              class="elevation-1"
              item-value="id"
              :items-per-page="10"
            >
              <!-- Название с популярным значком -->
              <template v-slot:item.name="{ item }">
                <div class="d-flex align-center">
                  <span class="font-weight-medium">{{ item.name }}</span>
                  <v-chip
                    v-if="item.is_popular"
                    color="orange"
                    size="x-small"
                    class="ml-2"
                  >
                    Популярный
                  </v-chip>
                </div>
              </template>

              <!-- Цена -->
              <template v-slot:item.price="{ item }">
                <span class="font-weight-bold text-primary">
                  {{ formatPrice(item.price, item.currency) }}
                </span>
                <span class="text-caption text-grey ml-1">
                  / {{ getBillingPeriodText(item.billing_period) }}
                </span>
              </template>

              <!-- Возможности -->
              <template v-slot:item.features="{ item }">
                <div class="d-flex flex-wrap ga-1">
                  <v-chip
                    v-if="item.max_devices > 0"
                    size="x-small"
                    color="blue"
                  >
                    {{ item.max_devices }} устройств
                  </v-chip>
                  <v-chip
                    v-else-if="item.max_devices === 0"
                    size="x-small"
                    color="green"
                  >
                    ∞ устройств
                  </v-chip>
                  <v-chip
                    v-if="item.has_analytics"
                    size="x-small"
                    color="purple"
                  >
                    Аналитика
                  </v-chip>
                  <v-chip
                    v-if="item.has_api"
                    size="x-small"
                    color="indigo"
                  >
                    API
                  </v-chip>
                  <v-chip
                    v-if="item.has_support"
                    size="x-small"
                    color="teal"
                  >
                    Поддержка
                  </v-chip>
                </div>
              </template>

              <!-- Статус -->
              <template v-slot:item.is_active="{ item }">
                <v-chip
                  :color="item.is_active ? 'green' : 'red'"
                  size="small"
                >
                  {{ item.is_active ? 'Активен' : 'Неактивен' }}
                </v-chip>
              </template>

              <!-- Действия -->
              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  @click="openPlanDialog(item)"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="deletePlan(item)"
                ></v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- Подписки -->
      <v-window-item value="subscriptions">
        <v-card>
          <v-card-title>
            <span>Подписки</span>
            <v-spacer></v-spacer>
            <v-btn 
              color="primary" 
              @click="openSubscriptionDialog()"
              prepend-icon="mdi-plus"
            >
              Создать подписку
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <!-- Таблица подписок -->
            <v-data-table
              :headers="subscriptionHeaders"
              :items="subscriptions"
              :loading="loadingSubscriptions"
              class="elevation-1"
              item-value="id"
              :items-per-page="10"
            >
              <!-- План -->
              <template v-slot:item.billing_plan="{ item }">
                <div>
                  <div class="font-weight-medium">{{ item.billing_plan?.name }}</div>
                  <div class="text-caption text-grey">
                    {{ formatPrice(item.billing_plan?.price || 0, item.billing_plan?.currency || 'RUB') }}
                  </div>
                </div>
              </template>

              <!-- Даты -->
              <template v-slot:item.start_date="{ item }">
                {{ formatDate(item.start_date) }}
              </template>

              <template v-slot:item.next_payment_date="{ item }">
                <span v-if="item.next_payment_date">
                  {{ formatDate(item.next_payment_date) }}
                </span>
                <span v-else class="text-grey">—</span>
              </template>

              <!-- Статус подписки -->
              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="getSubscriptionStatusColor(item.status)"
                  size="small"
                >
                  {{ getSubscriptionStatusText(item.status) }}
                </v-chip>
              </template>

              <!-- Действия -->
              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  @click="openSubscriptionDialog(item)"
                ></v-btn>
                <v-btn
                  icon="mdi-cancel"
                  size="small"
                  variant="text"
                  color="error"
                  @click="cancelSubscription(item)"
                ></v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- Диалог создания/редактирования плана -->
    <v-dialog v-model="planDialog" max-width="800px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">
            {{ editingPlan?.id ? 'Редактировать план' : 'Создать план' }}
          </span>
        </v-card-title>

        <v-card-text>
          <v-form ref="planForm" v-model="planFormValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editingPlan.name"
                  label="Название плана"
                  :rules="[v => !!v || 'Название обязательно']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="editingPlan.price"
                  label="Цена"
                  type="number"
                  min="0"
                  step="0.01"
                  :rules="[v => v >= 0 || 'Цена не может быть отрицательной']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editingPlan.currency"
                  :items="currencies"
                  label="Валюта"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editingPlan.billing_period"
                  :items="billingPeriods"
                  label="Период биллинга"
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editingPlan.description"
                  label="Описание"
                  rows="3"
                ></v-textarea>
              </v-col>
            </v-row>

            <!-- Лимиты -->
            <v-divider class="my-4"></v-divider>
            <h4 class="mb-4">Лимиты и возможности</h4>
            
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="editingPlan.max_devices"
                  label="Максимум устройств"
                  type="number"
                  min="0"
                  hint="0 = безлимитно"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="editingPlan.max_users"
                  label="Максимум пользователей"
                  type="number"
                  min="0"
                  hint="0 = безлимитно"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="editingPlan.max_storage"
                  label="Хранилище (ГБ)"
                  type="number"
                  min="0"
                  hint="0 = безлимитно"
                ></v-text-field>
              </v-col>
            </v-row>

            <!-- Возможности -->
            <v-row>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editingPlan.has_analytics"
                  label="Аналитика"
                  color="primary"
                ></v-switch>
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editingPlan.has_api"
                  label="API доступ"
                  color="primary"
                ></v-switch>
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editingPlan.has_support"
                  label="Техническая поддержка"
                  color="primary"
                ></v-switch>
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editingPlan.has_custom_domain"
                  label="Пользовательский домен"
                  color="primary"
                ></v-switch>
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editingPlan.is_active"
                  label="Активен"
                  color="primary"
                ></v-switch>
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editingPlan.is_popular"
                  label="Популярный"
                  color="orange"
                ></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closePlanDialog">Отмена</v-btn>
          <v-btn 
            color="primary" 
            :loading="savingPlan"
            :disabled="!planFormValid"
            @click="savePlan"
          >
            {{ editingPlan?.id ? 'Обновить' : 'Создать' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог подписки -->
    <v-dialog v-model="subscriptionDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">
            {{ editingSubscription?.id ? 'Редактировать подписку' : 'Создать подписку' }}
          </span>
        </v-card-title>

        <v-card-text>
          <v-form ref="subscriptionForm" v-model="subscriptionFormValid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model.number="editingSubscription.company_id"
                  label="ID компании"
                  type="number"
                  :rules="[v => !!v || 'ID компании обязательно']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="editingSubscription.billing_plan_id"
                  :items="planSelectItems"
                  label="Тарифный план"
                  :rules="[v => !!v || 'Выберите тарифный план']"
                  required
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editingSubscription.start_date"
                  label="Дата начала"
                  type="date"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editingSubscription.status"
                  :items="subscriptionStatuses"
                  label="Статус"
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="editingSubscription.is_auto_renew"
                  label="Автопродление"
                  color="primary"
                ></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeSubscriptionDialog">Отмена</v-btn>
          <v-btn 
            color="primary" 
            :loading="savingSubscription"
            :disabled="!subscriptionFormValid"
            @click="saveSubscription"
          >
            {{ editingSubscription?.id ? 'Обновить' : 'Создать' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'

// Интерфейсы
interface BillingPlan {
  id?: number
  name: string
  description: string
  price: number
  currency: string
  billing_period: string
  max_devices: number
  max_users: number
  max_storage: number
  has_analytics: boolean
  has_api: boolean
  has_support: boolean
  has_custom_domain: boolean
  is_active: boolean
  is_popular: boolean
  company_id?: number
  created_at?: string
  updated_at?: string
}

interface Subscription {
  id?: number
  company_id: number
  billing_plan_id: number
  billing_plan?: BillingPlan
  start_date: string
  end_date?: string
  status: string
  is_auto_renew: boolean
  last_payment_date?: string
  next_payment_date?: string
  payment_method?: string
  created_at?: string
  updated_at?: string
}

// Реактивные данные
const activeTab = ref('plans')
const loadingPlans = ref(false)
const loadingSubscriptions = ref(false)
const plans = ref<BillingPlan[]>([])
const subscriptions = ref<Subscription[]>([])

// Поиск и фильтрация
const planSearchQuery = ref('')
const planStatusFilter = ref<boolean | null>(null)

// Диалоги
const planDialog = ref(false)
const subscriptionDialog = ref(false)
const planFormValid = ref(false)
const subscriptionFormValid = ref(false)
const savingPlan = ref(false)
const savingSubscription = ref(false)

// Редактируемые объекты
const editingPlan = ref<BillingPlan>({
  name: '',
  description: '',
  price: 0,
  currency: 'RUB',
  billing_period: 'monthly',
  max_devices: 0,
  max_users: 0,
  max_storage: 0,
  has_analytics: false,
  has_api: false,
  has_support: false,
  has_custom_domain: false,
  is_active: true,
  is_popular: false
})

const editingSubscription = ref<Subscription>({
  company_id: 0,
  billing_plan_id: 0,
  start_date: new Date().toISOString().split('T')[0],
  status: 'active',
  is_auto_renew: true
})

// Константы
const currencies = ['RUB', 'USD', 'EUR']
const billingPeriods = [
  { title: 'Месячный', value: 'monthly' },
  { title: 'Годовой', value: 'yearly' },
  { title: 'Одноразовый', value: 'one-time' }
]

const statusOptions = [
  { title: 'Активные', value: true },
  { title: 'Неактивные', value: false }
]

const subscriptionStatuses = [
  { title: 'Активная', value: 'active' },
  { title: 'Истекшая', value: 'expired' },
  { title: 'Отмененная', value: 'cancelled' },
  { title: 'Приостановленная', value: 'suspended' }
]

// Заголовки таблиц
const planHeaders = [
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Цена', key: 'price', sortable: true },
  { title: 'Возможности', key: 'features', sortable: false },
  { title: 'Статус', key: 'is_active', sortable: true },
  { title: 'Действия', key: 'actions', sortable: false }
]

const subscriptionHeaders = [
  { title: 'Компания', key: 'company_id', sortable: true },
  { title: 'Тарифный план', key: 'billing_plan', sortable: false },
  { title: 'Дата начала', key: 'start_date', sortable: true },
  { title: 'Следующий платеж', key: 'next_payment_date', sortable: true },
  { title: 'Статус', key: 'status', sortable: true },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Вычисляемые свойства
const filteredPlans = computed(() => {
  let filtered = plans.value

  if (planSearchQuery.value) {
    filtered = filtered.filter(plan => 
      plan.name.toLowerCase().includes(planSearchQuery.value.toLowerCase())
    )
  }

  if (planStatusFilter.value !== null) {
    filtered = filtered.filter(plan => plan.is_active === planStatusFilter.value)
  }

  return filtered
})

const planSelectItems = computed(() => 
  plans.value.filter(plan => plan.is_active).map(plan => ({
    title: `${plan.name} (${formatPrice(plan.price, plan.currency)})`,
    value: plan.id
  }))
)

// Методы
const fetchPlans = async () => {
  loadingPlans.value = true
  try {
    const response = await axios.get('http://localhost:8080/api/billing/plans')
    plans.value = response.data.data
  } catch (error) {
    console.error('Ошибка при загрузке планов:', error)
  } finally {
    loadingPlans.value = false
  }
}

const fetchSubscriptions = async () => {
  loadingSubscriptions.value = true
  try {
    // В реальном приложении company_id должен браться из контекста пользователя
    const response = await axios.get('http://localhost:8080/api/billing/subscriptions?company_id=1')
    subscriptions.value = response.data.data
  } catch (error) {
    console.error('Ошибка при загрузке подписок:', error)
  } finally {
    loadingSubscriptions.value = false
  }
}

const openPlanDialog = (plan?: BillingPlan) => {
  if (plan) {
    editingPlan.value = { ...plan }
  } else {
    editingPlan.value = {
      name: '',
      description: '',
      price: 0,
      currency: 'RUB',
      billing_period: 'monthly',
      max_devices: 0,
      max_users: 0,
      max_storage: 0,
      has_analytics: false,
      has_api: false,
      has_support: false,
      has_custom_domain: false,
      is_active: true,
      is_popular: false
    }
  }
  planDialog.value = true
}

const closePlanDialog = () => {
  planDialog.value = false
  planFormValid.value = false
}

const savePlan = async () => {
  if (!planFormValid.value) return

  savingPlan.value = true
  try {
    if (editingPlan.value.id) {
      await axios.put(`http://localhost:8080/api/billing/plans/${editingPlan.value.id}`, editingPlan.value)
    } else {
      await axios.post('http://localhost:8080/api/billing/plans', editingPlan.value)
    }
    await fetchPlans()
    closePlanDialog()
  } catch (error) {
    console.error('Ошибка при сохранении плана:', error)
  } finally {
    savingPlan.value = false
  }
}

const deletePlan = async (plan: BillingPlan) => {
  if (!confirm(`Вы уверены, что хотите удалить план "${plan.name}"?`)) return

  try {
    await axios.delete(`http://localhost:8080/api/billing/plans/${plan.id}`)
    await fetchPlans()
  } catch (error) {
    console.error('Ошибка при удалении плана:', error)
  }
}

const openSubscriptionDialog = (subscription?: Subscription) => {
  if (subscription) {
    editingSubscription.value = { ...subscription }
  } else {
    editingSubscription.value = {
      company_id: 0,
      billing_plan_id: 0,
      start_date: new Date().toISOString().split('T')[0],
      status: 'active',
      is_auto_renew: true
    }
  }
  subscriptionDialog.value = true
}

const closeSubscriptionDialog = () => {
  subscriptionDialog.value = false
  subscriptionFormValid.value = false
}

const saveSubscription = async () => {
  if (!subscriptionFormValid.value) return

  savingSubscription.value = true
  try {
    if (editingSubscription.value.id) {
      await axios.put(`http://localhost:8080/api/billing/subscriptions/${editingSubscription.value.id}`, editingSubscription.value)
    } else {
      await axios.post('http://localhost:8080/api/billing/subscriptions', editingSubscription.value)
    }
    await fetchSubscriptions()
    closeSubscriptionDialog()
  } catch (error) {
    console.error('Ошибка при сохранении подписки:', error)
  } finally {
    savingSubscription.value = false
  }
}

const cancelSubscription = async (subscription: Subscription) => {
  if (!confirm(`Вы уверены, что хотите отменить подписку?`)) return

  try {
    await axios.put(`http://localhost:8080/api/billing/subscriptions/${subscription.id}`, {
      status: 'cancelled'
    })
    await fetchSubscriptions()
  } catch (error) {
    console.error('Ошибка при отмене подписки:', error)
  }
}

// Вспомогательные функции
const formatPrice = (price: number, currency: string) => {
  const formatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency === 'RUB' ? 'RUB' : currency
  })
  return formatter.format(price)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('ru-RU')
}

const getBillingPeriodText = (period: string) => {
  const periods: Record<string, string> = {
    monthly: 'месяц',
    yearly: 'год',
    'one-time': 'разово'
  }
  return periods[period] || period
}

const getSubscriptionStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'green',
    expired: 'orange',
    cancelled: 'red',
    suspended: 'grey'
  }
  return colors[status] || 'grey'
}

const getSubscriptionStatusText = (status: string) => {
  const statuses: Record<string, string> = {
    active: 'Активная',
    expired: 'Истекшая',
    cancelled: 'Отмененная',
    suspended: 'Приостановленная'
  }
  return statuses[status] || status
}

// Инициализация
onMounted(() => {
  fetchPlans()
  fetchSubscriptions()
})
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}

.v-chip {
  font-weight: 500;
}

.text-primary {
  color: rgb(var(--v-theme-primary)) !important;
}
</style>
