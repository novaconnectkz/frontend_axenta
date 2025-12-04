<template>
  <v-dialog
    v-model="dialog"
    max-width="900px"
    scrollable
    @update:model-value="onDialogUpdate"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon :color="iconColor" size="28" class="mr-3">{{ icon }}</v-icon>
        <span class="text-h5">{{ title }}</span>
        <v-spacer></v-spacer>
        <v-btn
          icon
          variant="text"
          size="small"
          @click="close"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pa-6">
        <!-- Основное значение -->
        <div class="metric-main-value mb-6">
          <div class="text-h3 font-weight-bold" :style="{ color: iconColor }">
            {{ formattedValue }}
          </div>
          <div class="text-body-2 text-grey mt-2">
            {{ subtitle }}
          </div>
        </div>

        <!-- Описание -->
        <v-card variant="outlined" class="mb-4">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-medium mb-2">
              <v-icon size="20" class="mr-2">mdi-information</v-icon>
              Описание метрики
            </div>
            <p class="text-body-1">{{ description }}</p>
          </v-card-text>
        </v-card>

        <!-- Детальная информация -->
        <div v-if="hasDetails" class="metric-details">
          <div class="text-subtitle-1 font-weight-medium mb-3">
            <v-icon size="20" class="mr-2">mdi-chart-box</v-icon>
            Детальная информация
          </div>

          <!-- Таблица данных -->
          <v-data-table
            v-if="detailTableData && detailTableData.length > 0"
            :headers="detailTableHeaders"
            :items="detailTableData"
            :items-per-page="10"
            class="elevation-1"
            density="compact"
          >
            <template v-slot:item.amount="{ item }">
              <span v-if="item.amount !== undefined">
                {{ formatCurrency(item.amount) }}
              </span>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip
                v-if="item.status"
                :color="getStatusColor(item.status)"
                size="small"
                variant="tonal"
              >
                {{ getStatusLabel(item.status) }}
              </v-chip>
            </template>
            <template v-slot:item.date="{ item }">
              <span v-if="item.date">{{ formatDate(item.date) }}</span>
            </template>
            <template v-slot:item.total_amount="{ item }">
              <span v-if="item.total_amount !== undefined">
                {{ formatCurrency(item.total_amount) }}
              </span>
            </template>
            <template v-slot:item.paid_amount="{ item }">
              <span v-if="item.paid_amount !== undefined">
                {{ formatCurrency(item.paid_amount) }}
              </span>
            </template>
            <template v-slot:item.outstanding="{ item }">
              <span v-if="item.outstanding !== undefined">
                {{ formatCurrency(item.outstanding) }}
              </span>
            </template>
            <template v-slot:item.due_date="{ item }">
              <span v-if="item.due_date">{{ formatDate(item.due_date) }}</span>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn
                v-if="item.id && item.outstanding > 0 && item.status !== 'paid' && item.status !== 'cancelled'"
                color="success"
                size="small"
                variant="flat"
                @click="handlePayInvoice(item)"
                :loading="payingInvoiceId === item.id"
              >
                <v-icon icon="mdi-cash" size="small" class="mr-1" />
                Оплатить
              </v-btn>
            </template>
          </v-data-table>

          <!-- Дополнительная статистика -->
          <v-row v-if="additionalStats && additionalStats.length > 0" class="mt-4">
            <v-col
              v-for="(stat, index) in additionalStats"
              :key="index"
              cols="12"
              sm="6"
              md="4"
            >
              <v-card variant="outlined">
                <v-card-text class="text-center">
                  <div class="text-h6 font-weight-bold">{{ stat.value }}</div>
                  <div class="text-caption text-grey">{{ stat.label }}</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Дополнительная информация -->
        <v-card v-if="additionalInfo" variant="outlined" class="mt-4">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-medium mb-2">
              <v-icon size="20" class="mr-2">mdi-lightbulb-on</v-icon>
              Дополнительная информация
            </div>
            <div class="text-body-2">{{ additionalInfo }}</div>
          </v-card-text>
        </v-card>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="text"
          @click="close"
        >
          Закрыть
        </v-btn>
        <v-btn
          v-if="actionButton"
          color="primary"
          variant="flat"
          @click="handleAction"
        >
          {{ actionButton.label }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import billingService from '@/services/billingService'

interface DetailTableItem {
  [key: string]: any
  id?: number
  amount?: number
  total_amount?: number
  paid_amount?: number
  outstanding?: number
  status?: string
  date?: string
  due_date?: string
}

interface AdditionalStat {
  label: string
  value: string | number
}

interface Props {
  modelValue: boolean
  title: string
  value: string | number
  icon: string
  iconColor?: string
  format?: 'currency' | 'number' | 'percentage'
  currency?: string
  description: string
  subtitle?: string
  additionalInfo?: string
  detailTableHeaders?: Array<{ title: string; key: string; sortable?: boolean }>
  detailTableData?: DetailTableItem[]
  additionalStats?: AdditionalStat[]
  actionButton?: {
    label: string
    action: () => void
  }
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: 'primary',
  format: 'number',
  currency: 'RUB',
  subtitle: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'invoice-paid': [invoiceId: number]
}>()

const payingInvoiceId = ref<number | null>(null)

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const hasDetails = computed(() => {
  return (props.detailTableData && props.detailTableData.length > 0) ||
         (props.additionalStats && props.additionalStats.length > 0)
})

const formattedValue = computed(() => {
  const val = typeof props.value === 'string' ? parseFloat(props.value) : props.value
  
  if (props.format === 'currency') {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: props.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val || 0)
  }
  
  if (props.format === 'percentage') {
    return `${val.toFixed(1)}%`
  }
  
  return val.toLocaleString('ru-RU')
})

const close = () => {
  dialog.value = false
}

const onDialogUpdate = (value: boolean) => {
  if (!value) {
    close()
  }
}

const handleAction = () => {
  if (props.actionButton) {
    props.actionButton.action()
  }
}

const formatCurrency = (amount: number | string): string => {
  const val = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: props.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val || 0)
}

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    draft: 'grey',
    sent: 'blue',
    partially_paid: 'orange',
    paid: 'green',
    overdue: 'red',
    cancelled: 'grey',
    active: 'green',
    expired: 'red',
    cancelled: 'grey'
  }
  return colors[status] || 'grey'
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: 'Черновик',
    sent: 'Отправлен',
    partially_paid: 'Частично оплачен',
    paid: 'Оплачен',
    overdue: 'Просрочен',
    cancelled: 'Отменен',
    active: 'Активный',
    expired: 'Истекший'
  }
  return labels[status] || status
}

const handlePayInvoice = async (item: DetailTableItem) => {
  if (!item.id || !item.outstanding) {
    return
  }

  if (!confirm(`Оплатить счет на сумму ${formatCurrency(item.outstanding)}?`)) {
    return
  }

  payingInvoiceId.value = item.id

  try {
    await billingService.addManualPayment(item.id, {
      amount: item.outstanding.toString(),
      payment_method: 'manual',
      notes: `Оплата счета ${item.number || item.id}`
    })

    // Эмитим событие для обновления данных
    emit('invoice-paid', item.id)
    
    // Обновляем статус в локальных данных
    if (item.status) {
      if (item.outstanding >= (item.total_amount || 0)) {
        item.status = 'paid'
      } else {
        item.status = 'partially_paid'
      }
      item.paid_amount = (item.paid_amount || 0) + item.outstanding
      item.outstanding = 0
    }
  } catch (error: any) {
    console.error('Ошибка при оплате счета:', error)
    alert(error.message || 'Ошибка при оплате счета')
  } finally {
    payingInvoiceId.value = null
  }
}
</script>

<style scoped>
.metric-main-value {
  text-align: center;
  padding: 24px;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.1) 0%, rgba(var(--v-theme-primary), 0.05) 100%);
  border-radius: 12px;
}

.metric-details {
  margin-top: 24px;
}
</style>

