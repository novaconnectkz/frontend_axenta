<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-send" class="mr-2" color="primary"></v-icon>
        <span class="text-h6">Отправить счет клиенту</span>
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <div v-if="invoice" class="mb-4">
          <div class="invoice-info">
            <p><strong>Счет:</strong> {{ invoice.number }}</p>
            <p><strong>Клиент:</strong> {{ invoice.contract?.client_short_name || invoice.contract?.client_name || 'Не указан' }}</p>
            <p><strong>Сумма:</strong> {{ invoice.total_amount }} {{ invoice.currency }}</p>
            <p><strong>Срок оплаты:</strong> {{ formatDate(invoice.due_date) }}</p>
          </div>
        </div>

        <v-divider class="my-4" />

        <div class="mb-4">
          <h3 class="text-subtitle-1 mb-3">Выберите каналы отправки:</h3>
          
          <!-- Email -->
          <div class="channel-option mb-3">
            <v-checkbox
              v-model="selectedChannels"
              value="email"
              hide-details
            >
              <template v-slot:label>
                <div class="d-flex align-center">
                  <v-icon icon="mdi-email" class="mr-2" color="primary"></v-icon>
                  <span>Email</span>
                </div>
              </template>
            </v-checkbox>
            <v-text-field
              v-if="selectedChannels.includes('email')"
              v-model="contactInfo.email"
              label="Email адрес"
              type="email"
              variant="outlined"
              density="compact"
              class="mt-2"
              :rules="emailRules"
              prepend-inner-icon="mdi-at"
            ></v-text-field>
          </div>

          <!-- Telegram -->
          <div class="channel-option mb-3">
            <v-checkbox
              v-model="selectedChannels"
              value="telegram"
              hide-details
            >
              <template v-slot:label>
                <div class="d-flex align-center">
                  <v-icon icon="mdi-telegram" class="mr-2" color="info"></v-icon>
                  <span>Telegram</span>
                </div>
              </template>
            </v-checkbox>
            <v-text-field
              v-if="selectedChannels.includes('telegram')"
              v-model="contactInfo.telegram"
              label="Telegram ID или username"
              variant="outlined"
              density="compact"
              class="mt-2"
              prepend-inner-icon="mdi-at"
              hint="Например: @username или 123456789"
            ></v-text-field>
          </div>

          <!-- MAX -->
          <div class="channel-option mb-3">
            <v-checkbox
              v-model="selectedChannels"
              value="max"
              hide-details
            >
              <template v-slot:label>
                <div class="d-flex align-center">
                  <v-icon icon="mdi-message-text" class="mr-2" color="success"></v-icon>
                  <span>MAX Messenger</span>
                </div>
              </template>
            </v-checkbox>
            <v-text-field
              v-if="selectedChannels.includes('max')"
              v-model="contactInfo.max"
              label="MAX ID"
              variant="outlined"
              density="compact"
              class="mt-2"
              prepend-inner-icon="mdi-identifier"
              hint="ID пользователя в MAX мессенджере"
            ></v-text-field>
          </div>
        </div>

        <v-alert
          v-if="selectedChannels.length === 0"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          Выберите хотя бы один канал отправки
        </v-alert>

        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          density="compact"
          closable
          @click:close="error = ''"
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
          @click="sendInvoice"
          :loading="loading"
          :disabled="!canSend"
        >
          <v-icon icon="mdi-send" class="mr-1"></v-icon>
          Отправить
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Invoice, InvoiceSendChannel, SendInvoiceData } from '@/types/billing'
import { billingService } from '@/services/billingService'

// Props
const props = defineProps<{
  modelValue: boolean
  invoice: Invoice | null
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'sent': [invoice: Invoice]
}>()

// Data
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const selectedChannels = ref<InvoiceSendChannel[]>([])
const contactInfo = ref({
  email: '',
  telegram: '',
  max: ''
})
const loading = ref(false)
const error = ref('')

// Email validation rules
const emailRules = [
  (v: string) => !!v || 'Email обязателен',
  (v: string) => /.+@.+\..+/.test(v) || 'Email должен быть корректным'
]

// Computed
const canSend = computed(() => {
  if (selectedChannels.value.length === 0) return false
  
  // Проверяем, что для каждого выбранного канала указана контактная информация
  for (const channel of selectedChannels.value) {
    if (!contactInfo.value[channel]) return false
  }
  
  return true
})

// Watch для автозаполнения email из договора
watch(() => props.invoice, (newInvoice) => {
  if (newInvoice) {
    // Автоматически выбираем email, если он есть в договоре
    if (newInvoice.contract?.client_email) {
      contactInfo.value.email = newInvoice.contract.client_email
      if (!selectedChannels.value.includes('email')) {
        selectedChannels.value.push('email')
      }
    }
    
    // Автозаполнение из предыдущих отправок
    if (newInvoice.send_to_email && !contactInfo.value.email) {
      contactInfo.value.email = newInvoice.send_to_email
    }
    if (newInvoice.send_to_telegram && !contactInfo.value.telegram) {
      contactInfo.value.telegram = newInvoice.send_to_telegram
    }
    if (newInvoice.send_to_max && !contactInfo.value.max) {
      contactInfo.value.max = newInvoice.send_to_max
    }
  }
}, { immediate: true })

// Methods
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU')
}

const sendInvoice = async () => {
  if (!props.invoice || !canSend.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    const data: SendInvoiceData = {
      channels: selectedChannels.value,
      contact_info: {}
    }
    
    // Добавляем только выбранные каналы
    selectedChannels.value.forEach(channel => {
      if (contactInfo.value[channel]) {
        data.contact_info[channel] = contactInfo.value[channel]
      }
    })
    
    const updatedInvoice = await billingService.sendInvoice(props.invoice.id, data)
    
    emit('sent', updatedInvoice)
    closeDialog()
  } catch (err: any) {
    console.error('Ошибка при отправке счета:', err)
    error.value = err.response?.data?.error || err.message || 'Ошибка при отправке счета'
  } finally {
    loading.value = false
  }
}

const closeDialog = () => {
  dialog.value = false
  // Сбрасываем форму при закрытии
  setTimeout(() => {
    selectedChannels.value = []
    contactInfo.value = {
      email: '',
      telegram: '',
      max: ''
    }
    error.value = ''
  }, 300)
}
</script>

<style scoped>
.invoice-info {
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
  padding: 16px;
  border-radius: 8px;
}

.invoice-info p {
  margin: 4px 0;
  line-height: 1.6;
}

.channel-option {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s;
}

.channel-option:hover {
  background-color: rgba(var(--v-theme-surface-variant), 0.1);
}

:deep(.v-checkbox .v-selection-control) {
  min-height: unset;
}
</style>

