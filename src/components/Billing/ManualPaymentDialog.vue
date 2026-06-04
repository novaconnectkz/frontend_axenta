<template>
  <v-dialog v-model="dialog" max-width="500px" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-cash" class="mr-2" color="primary"></v-icon>
        <span class="text-h6">🪙 Внести платёж вручную</span>
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-form ref="form" v-model="formValid">
          <!-- Счёт -->
          <v-autocomplete
            v-model="selectedInvoiceId"
            :items="invoiceItems"
            item-title="number"
            item-value="id"
            label="Счёт"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            :rules="[v => !!v || 'Выберите счёт']"
            :disabled="invoice !== null"
            placeholder="Поиск по номеру счета, клиенту..."
            hide-details="auto"
            :custom-filter="invoiceFilter"
            clearable
            no-data-text="Счета не найдены"
          >
            <template v-slot:item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps">
                <template v-slot:prepend>
                  <v-icon icon="mdi-file-document" class="mr-2"></v-icon>
                </template>
                <v-list-item-title>{{ item.raw.number }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ contractDisplayName(item.raw.contract, 'Клиент не указан') }}
                  • {{ formatCurrency(item.raw.total_amount) }}
                  <span v-if="parseFloat(item.raw.paid_amount || '0') > 0">
                    (Остаток: {{ formatCurrency((parseFloat(item.raw.total_amount) - parseFloat(item.raw.paid_amount || '0')).toString()) }})
                  </span>
                </v-list-item-subtitle>
              </v-list-item>
            </template>
          </v-autocomplete>

          <!-- Клиент (автоматически) -->
          <v-text-field
            :model-value="contractDisplayName(selectedInvoice?.contract, '—')"
            label="Клиент"
            variant="outlined"
            density="comfortable"
            readonly
            class="mb-3"
            prepend-inner-icon="mdi-account"
            hide-details
          />

          <!-- Сумма -->
          <v-text-field
            v-model="amount"
            label="Сумма"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            :rules="amountRules"
            prepend-inner-icon="mdi-currency-rub"
            type="number"
            step="0.01"
            min="0.01"
            suffix="₽"
            hide-details="auto"
          />

          <!-- Дата -->
          <v-text-field
            v-model="paymentDate"
            label="Дата"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            type="date"
            prepend-inner-icon="mdi-calendar"
            :max="todayDate"
            :rules="dateRules"
            hide-details="auto"
          />

          <!-- Комментарий -->
          <v-textarea
            v-model="comment"
            label="Комментарий"
            variant="outlined"
            density="comfortable"
            rows="3"
            prepend-inner-icon="mdi-comment-text"
            placeholder="Оплата получена по выписке банка"
            hide-details
          />
        </v-form>

        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          density="compact"
          closable
          @click:close="error = ''"
          class="mt-4"
        >
          {{ error }}
        </v-alert>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn
          variant="text"
          @click="closeDialog"
          :disabled="loading"
        >
          Отмена
        </v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          variant="flat"
          @click="addPayment"
          :loading="loading"
          :disabled="!formValid || !canAddPayment"
        >
          <v-icon icon="mdi-check" class="mr-1"></v-icon>
          Добавить платёж
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Invoice } from '@/types/billing'
import { billingService } from '@/services/billingService'
import { contractDisplayName } from '@/utils/contractDisplay'

// Props
const props = defineProps<{
  modelValue: boolean
  invoice?: Invoice | null // Опциональный счёт (если открыт из карточки счёта)
  invoices?: Invoice[] // Список счетов для выбора (если открыт из общего списка)
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'payment-added': [invoice: Invoice]
}>()

// Data
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = ref<any>(null)
const formValid = ref(false)
const selectedInvoiceId = ref<number | null>(null)
const amount = ref<string>('')
const paymentDate = ref<string>('')
const comment = ref<string>('')
const loading = ref(false)
const error = ref('')

// Функция для получения текущей даты в формате YYYY-MM-DD (локальное время)
const getTodayDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Получаем текущую дату для ограничения выбора даты (в локальном часовом поясе)
const todayDate = computed(() => getTodayDate())

// Выбранный счёт
const selectedInvoice = computed(() => {
  if (props.invoice) {
    return props.invoice
  }
  if (selectedInvoiceId.value && props.invoices) {
    return props.invoices.find(inv => inv.id === selectedInvoiceId.value) || null
  }
  return null
})

// Список счетов для выпадающего списка (только неоплаченные или частично оплаченные)
const invoiceItems = computed(() => {
  if (props.invoice) {
    // Проверяем, можно ли добавить платеж к переданному счету
    const remaining = parseFloat(props.invoice.total_amount) - parseFloat(props.invoice.paid_amount || '0')
    if (props.invoice.status === 'paid' || props.invoice.status === 'cancelled' || remaining <= 0) {
      return []
    }
    return [props.invoice]
  }
  if (!props.invoices) return []
  
  // Фильтруем: показываем только неоплаченные или частично оплаченные счета (остаток > 0)
  return props.invoices.filter(inv => {
    // Исключаем отмененные и полностью оплаченные счета
    if (inv.status === 'paid' || inv.status === 'cancelled') return false
    // Проверяем остаток к оплате
    const remaining = parseFloat(inv.total_amount) - parseFloat(inv.paid_amount || '0')
    return remaining > 0
  })
})

// Правила валидации для суммы
const amountRules = [
  (v: string) => !!v || 'Укажите сумму платежа',
  (v: string) => {
    const num = parseFloat(v)
    if (isNaN(num) || num <= 0) {
      return 'Сумма должна быть больше нуля'
    }
    // Проверяем, не превышает ли сумма остаток к оплате
    if (selectedInvoice.value) {
      const remaining = parseFloat(selectedInvoice.value.total_amount) - parseFloat(selectedInvoice.value.paid_amount || '0')
      if (remaining <= 0) {
        return 'Счет уже полностью оплачен'
      }
      if (num > remaining) {
        return `Сумма не может превышать остаток к оплате: ${formatCurrency(remaining.toString())}`
      }
    }
    return true
  }
]

// Правила валидации для даты
const dateRules = [
  (v: string) => {
    if (!v) return true // Дата необязательна
    const selectedDate = new Date(v + 'T00:00:00') // Устанавливаем начало дня для локального времени
    const today = new Date()
    today.setHours(23, 59, 59, 999) // Конец сегодняшнего дня
    if (selectedDate > today) {
      return 'Дата не может быть в будущем'
    }
    return true
  }
]

// Проверка возможности добавления платежа
const canAddPayment = computed(() => {
  if (!selectedInvoice.value) return false
  if (!amount.value) return false
  
  const numAmount = parseFloat(amount.value)
  if (isNaN(numAmount) || numAmount <= 0) return false
  
  const remaining = parseFloat(selectedInvoice.value.total_amount) - parseFloat(selectedInvoice.value.paid_amount || '0')
  return numAmount <= remaining
})

// Методы
const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}

// Функция фильтрации счетов для поиска
const invoiceFilter = (_value: string, query: string, item: any) => {
  if (!query) return true
  
  const searchTerm = query.toLowerCase().trim()
  if (!searchTerm) return true
  
  const invoice = item?.raw || item
  if (!invoice) return false
  
  // Поиск по номеру счета
  if (invoice.number && invoice.number.toLowerCase().includes(searchTerm)) {
    return true
  }
  
  // Поиск по названию клиента
  const clientName = contractDisplayName(invoice.contract, '')
  if (clientName && clientName.toLowerCase().includes(searchTerm)) {
    return true
  }
  
  // Поиск по сумме (если введено число)
  if (!isNaN(parseFloat(searchTerm))) {
    const amount = parseFloat(invoice.total_amount || '0')
    if (amount.toString().includes(searchTerm)) {
      return true
    }
  }
  
  return false
}

// Инициализация при открытии диалога
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    // Всегда устанавливаем текущую дату при открытии
    paymentDate.value = getTodayDate()
    
    // Если передан конкретный счёт, выбираем его
    if (props.invoice) {
      // Проверяем, можно ли добавить платеж к этому счету
      const remaining = parseFloat(props.invoice.total_amount) - parseFloat(props.invoice.paid_amount || '0')
      if (props.invoice.status === 'paid' || props.invoice.status === 'cancelled' || remaining <= 0) {
        error.value = 'Нельзя добавить платеж к полностью оплаченному или отмененному счету'
        selectedInvoiceId.value = null
        amount.value = ''
      } else {
        selectedInvoiceId.value = props.invoice.id
        // Предзаполняем сумму остатком к оплате
        amount.value = remaining > 0 ? remaining.toFixed(2) : ''
        error.value = ''
      }
    } else {
      selectedInvoiceId.value = null
      amount.value = ''
      error.value = ''
    }
    
    comment.value = ''
  }
}, { immediate: true })

// Обновляем сумму и дату при изменении выбранного счёта
watch(selectedInvoiceId, (invoiceId) => {
  if (invoiceId && props.invoices) {
    const invoice = props.invoices.find(inv => inv.id === invoiceId)
    if (invoice) {
      // Предзаполняем сумму остатком к оплате при выборе счета
      const remaining = parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount || '0')
      amount.value = remaining > 0 ? remaining.toFixed(2) : ''
    }
  }
  // Всегда устанавливаем текущую дату при выборе счета
  if (invoiceId) {
    paymentDate.value = getTodayDate()
  }
})

// Обновляем сумму и дату при изменении самого объекта счета
watch(selectedInvoice, (invoice) => {
  if (invoice) {
    // Предзаполняем сумму остатком к оплате
    const remaining = parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount || '0')
    if (remaining > 0) {
      amount.value = remaining.toFixed(2)
    }
    
    // Устанавливаем текущую дату
    paymentDate.value = getTodayDate()
  }
})

const addPayment = async () => {
  if (!formValid.value || !canAddPayment.value || !selectedInvoice.value) return
  
  // Валидация формы
  const { valid } = await form.value?.validate()
  if (!valid) return
  
  loading.value = true
  error.value = ''
  
  try {
    // Всегда отправляем дату платежа (обязательное поле)
    const paymentData: ManualPaymentData = {
      amount: amount.value,
      payment_date: paymentDate.value || getTodayDate(),
      comment: comment.value || ''
    }
    
    const updatedInvoice = await billingService.addManualPayment(selectedInvoice.value.id, paymentData)
    
    emit('payment-added', updatedInvoice)
    closeDialog()
  } catch (err: any) {
    console.error('Ошибка при добавлении ручного платежа:', err)
    error.value = err.response?.data?.error || err.message || 'Ошибка при добавлении платежа'
  } finally {
    loading.value = false
  }
}

const closeDialog = () => {
  dialog.value = false
  // Сбрасываем форму при закрытии
  setTimeout(() => {
    selectedInvoiceId.value = null
    amount.value = ''
    paymentDate.value = getTodayDate() // Устанавливаем текущую дату
    comment.value = ''
    error.value = ''
    form.value?.resetValidation()
  }, 300)
}
</script>

<style scoped>
:deep(.v-field__input) {
  min-height: 40px;
}
</style>

