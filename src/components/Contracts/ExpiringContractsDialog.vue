<template>
  <v-dialog v-model="dialog" max-width="800px" scrollable>
    <v-card>
      <v-card-title class="dialog-header">
        <v-icon icon="mdi-clock-alert" class="mr-3" />
        Истекающие договоры
        <v-chip v-if="contracts.length > 0" size="small" color="warning" class="ml-3">
          {{ contracts.length }}
        </v-chip>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
      </v-card-title>

      <v-divider />

      <v-card-text class="dialog-content">
        <v-container>
          <!-- Информация о периоде -->
          <div class="info-section">
            <v-alert type="warning" variant="tonal" class="period-alert">
              <template #prepend>
                <v-icon icon="mdi-information" />
              </template>
              
              <div class="alert-content">
                <div class="alert-title">Уведомления об истечении договоров</div>
                <div class="alert-text">
                  Отображаются договоры, которые истекают в течение ближайших 30 дней.
                  Рекомендуется своевременно продлевать или перезаключать договоры.
                </div>
              </div>
            </v-alert>
          </div>

          <!-- Список истекающих договоров -->
          <div v-if="contracts.length === 0" class="empty-section">
            <v-icon icon="mdi-check-circle" size="64" class="empty-icon" />
            <div class="empty-title">Все договоры актуальны</div>
            <div class="empty-text">
              Нет договоров, которые истекают в ближайшие 30 дней
            </div>
          </div>

          <div v-else class="contracts-section">
            <h3 class="section-title">
              <v-icon icon="mdi-file-document-multiple" class="mr-2" />
              Требуют внимания ({{ contracts.length }})
            </h3>

            <div class="contracts-list">
              <v-card
                v-for="contract in sortedContracts"
                :key="contract.id"
                variant="outlined"
                class="contract-card"
                :class="getContractCardClass(contract)"
              >
                <v-card-text class="contract-info">
                  <div class="contract-header">
                    <div class="contract-main">
                      <div class="contract-number">
                        <v-chip 
                          :color="getUrgencyColor(contract)" 
                          size="small"
                          variant="tonal"
                        >
                          {{ contract.number }}
                        </v-chip>
                      </div>
                      
                      <div class="contract-title">{{ contract.title }}</div>
                      <div class="contract-client">{{ contract.client_name }}</div>
                    </div>

                    <div class="contract-status">
                      <div class="expiry-info">
                        <div class="expiry-date">
                          Истекает: {{ formatDate(contract.end_date) }}
                        </div>
                        <div class="expiry-countdown" :class="getCountdownClass(contract)">
                          {{ getExpiryText(contract) }}
                        </div>
                      </div>
                      
                      <v-chip 
                        :color="getContractStatusColor(contract.status)" 
                        size="small"
                        variant="tonal"
                      >
                        {{ getContractStatusLabel(contract.status) }}
                      </v-chip>
                    </div>
                  </div>

                  <div class="contract-details">
                    <div class="detail-item">
                      <v-icon icon="mdi-currency-rub" size="small" class="mr-1" />
                      <span class="detail-label">Стоимость:</span>
                      <span class="detail-value">
                        {{ formatCurrency(contract.total_amount, contract.currency) }}
                      </span>
                    </div>
                    
                    <div class="detail-item">
                      <v-icon icon="mdi-link" size="small" class="mr-1" />
                      <span class="detail-label">Объектов:</span>
                      <span class="detail-value">{{ contract.objects?.length || 0 }}</span>
                    </div>
                    
                    <div class="detail-item">
                      <v-icon icon="mdi-package-variant" size="small" class="mr-1" />
                      <span class="detail-label">Тариф:</span>
                      <span class="detail-value">{{ contract.tariff_plan?.name || 'Не указан' }}</span>
                    </div>
                    
                    <div v-if="contract.client_email" class="detail-item">
                      <v-icon icon="mdi-email" size="small" class="mr-1" />
                      <span class="detail-label">Email:</span>
                      <span class="detail-value">
                        <a :href="`mailto:${contract.client_email}`" class="email-link">
                          {{ contract.client_email }}
                        </a>
                      </span>
                    </div>
                    
                    <div v-if="contract.client_phone" class="detail-item">
                      <v-icon icon="mdi-phone" size="small" class="mr-1" />
                      <span class="detail-label">Телефон:</span>
                      <span class="detail-value">
                        <a :href="`tel:${contract.client_phone}`" class="phone-link">
                          {{ contract.client_phone }}
                        </a>
                      </span>
                    </div>
                  </div>

                  <div class="contract-actions">
                    <AppleButton
                      size="small"
                      variant="outlined"
                      prepend-icon="mdi-eye"
                      @click="viewContract(contract)"
                    >
                      Просмотр
                    </AppleButton>
                    
                    <AppleButton
                      size="small"
                      variant="outlined"
                      prepend-icon="mdi-pencil"
                      @click="editContract(contract)"
                    >
                      Редактировать
                    </AppleButton>
                    
                    <AppleButton
                      size="small"
                      variant="outlined"
                      prepend-icon="mdi-email-send"
                      color="primary"
                      @click="sendNotification(contract)"
                      :loading="sendingNotifications.includes(contract.id)"
                    >
                      Уведомить
                    </AppleButton>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </div>
        </v-container>
      </v-card-text>

      <v-divider />

      <v-card-actions class="dialog-actions">
        <AppleButton
          variant="outlined"
          prepend-icon="mdi-refresh"
          @click="refreshContracts"
          :loading="refreshing"
        >
          Обновить
        </AppleButton>
        
        <v-spacer />
        
        <AppleButton
          v-if="contracts.length > 0"
          variant="outlined"
          prepend-icon="mdi-email-multiple"
          @click="sendAllNotifications"
          :loading="sendingAll"
          color="primary"
        >
          Уведомить всех
        </AppleButton>
        
        <AppleButton variant="text" @click="closeDialog">
          Закрыть
        </AppleButton>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { 
  ContractWithRelations,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
} from '@/types/contracts';
import contractsService from '@/services/contractsService';
import { AppleButton } from '@/components/Apple';

// Props
interface Props {
  modelValue: boolean;
  contracts: ContractWithRelations[];
}

const props = withDefaults(defineProps<Props>(), {
  contracts: () => [],
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  refresh: [];
}>();

// Reactive data
const refreshing = ref(false);
const sendingAll = ref(false);
const sendingNotifications = ref<number[]>([]);

// Computed
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const sortedContracts = computed(() => {
  return [...props.contracts].sort((a, b) => {
    const daysA = contractsService.getDaysUntilExpiry(a);
    const daysB = contractsService.getDaysUntilExpiry(b);
    return daysA - daysB;
  });
});

// Methods
const closeDialog = () => {
  dialog.value = false;
};

const refreshContracts = () => {
  refreshing.value = true;
  emit('refresh');
  setTimeout(() => {
    refreshing.value = false;
  }, 1000);
};

const viewContract = (contract: ContractWithRelations) => {
  // Эмитируем событие для открытия диалога просмотра в родительском компоненте
  console.log('View contract:', contract.number);
  // В реальном приложении здесь будет роутинг или эмит события
};

const editContract = (contract: ContractWithRelations) => {
  // Эмитируем событие для открытия диалога редактирования в родительском компоненте
  console.log('Edit contract:', contract.number);
  // В реальном приложении здесь будет роутинг или эмит события
};

const sendNotification = async (contract: ContractWithRelations) => {
  sendingNotifications.value.push(contract.id);
  
  try {
    // Имитируем отправку уведомления
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log(`Notification sent for contract: ${contract.number}`);
    // В реальном приложении здесь будет вызов API для отправки уведомления
    
  } catch (error) {
    console.error('Error sending notification:', error);
  } finally {
    const index = sendingNotifications.value.indexOf(contract.id);
    if (index > -1) {
      sendingNotifications.value.splice(index, 1);
    }
  }
};

const sendAllNotifications = async () => {
  sendingAll.value = true;
  
  try {
    // Имитируем массовую отправку уведомлений
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    console.log(`Sent notifications for ${props.contracts.length} contracts`);
    // В реальном приложении здесь будет вызов API для массовой отправки уведомлений
    
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
  } finally {
    sendingAll.value = false;
  }
};

const formatDate = (date: string): string => {
  return contractsService.formatDate(date);
};

const formatCurrency = (amount: string | number, currency = 'RUB'): string => {
  return contractsService.formatCurrency(amount, currency);
};

const getContractStatusColor = (status: string): string => {
  return CONTRACT_STATUS_COLORS[status as keyof typeof CONTRACT_STATUS_COLORS] || 'grey';
};

const getContractStatusLabel = (status: string): string => {
  return CONTRACT_STATUS_LABELS[status as keyof typeof CONTRACT_STATUS_LABELS] || status;
};

const getUrgencyColor = (contract: ContractWithRelations): string => {
  const days = contractsService.getDaysUntilExpiry(contract);
  
  if (days <= 0) return 'error';
  if (days <= 7) return 'error';
  if (days <= 14) return 'warning';
  return 'info';
};

const getContractCardClass = (contract: ContractWithRelations): string => {
  const days = contractsService.getDaysUntilExpiry(contract);
  
  if (days <= 0) return 'expired';
  if (days <= 7) return 'critical';
  if (days <= 14) return 'warning';
  return 'normal';
};

const getCountdownClass = (contract: ContractWithRelations): string => {
  const days = contractsService.getDaysUntilExpiry(contract);
  
  if (days <= 0) return 'countdown-expired';
  if (days <= 7) return 'countdown-critical';
  if (days <= 14) return 'countdown-warning';
  return 'countdown-normal';
};

const getExpiryText = (contract: ContractWithRelations): string => {
  const days = contractsService.getDaysUntilExpiry(contract);
  
  if (days <= 0) return 'Истек';
  if (days === 1) return 'Истекает завтра';
  if (days <= 7) return `Истекает через ${days} дн.`;
  return `${days} дней до истечения`;
};
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

.info-section {
  padding: 0 24px 24px;
}

.period-alert {
  margin: 0;
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

.empty-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.5;
  color: rgb(var(--v-theme-success));
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.empty-text {
  font-size: 16px;
  text-align: center;
}

.contracts-section {
  padding: 0 24px 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  color: rgb(var(--v-theme-primary));
}

.contracts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contract-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: all 0.2s ease;
}

.contract-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.contract-card.expired {
  border-left: 4px solid rgb(var(--v-theme-error));
}

.contract-card.critical {
  border-left: 4px solid rgb(var(--v-theme-error));
}

.contract-card.warning {
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.contract-card.normal {
  border-left: 4px solid rgb(var(--v-theme-info));
}

.contract-info {
  padding: 20px;
}

.contract-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 16px;
}

.contract-main {
  flex: 1;
  min-width: 0;
}

.contract-number {
  margin-bottom: 8px;
}

.contract-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
  line-height: 1.3;
}

.contract-client {
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.contract-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.expiry-info {
  text-align: right;
}

.expiry-date {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 2px;
}

.expiry-countdown {
  font-size: 13px;
  font-weight: 600;
}

.countdown-expired {
  color: rgb(var(--v-theme-error));
}

.countdown-critical {
  color: rgb(var(--v-theme-error));
}

.countdown-warning {
  color: rgb(var(--v-theme-warning));
}

.countdown-normal {
  color: rgb(var(--v-theme-info));
}

.contract-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.detail-label {
  color: rgb(var(--v-theme-on-surface-variant));
  min-width: fit-content;
}

.detail-value {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.email-link,
.phone-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.email-link:hover,
.phone-link:hover {
  text-decoration: underline;
}

.contract-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* Responsive */
@media (max-width: 768px) {
  .dialog-header {
    padding: 16px 20px 12px;
    font-size: 18px;
  }

  .info-section,
  .contracts-section {
    padding: 0 20px 20px;
  }

  .empty-section {
    padding: 40px 20px;
  }

  .contract-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .contract-status {
    align-items: flex-start;
    width: 100%;
  }

  .expiry-info {
    text-align: left;
  }

  .contract-details {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .contract-actions {
    flex-direction: column;
    gap: 8px;
  }

  .dialog-actions {
    padding: 12px 20px 16px;
    flex-direction: column;
    gap: 8px;
  }
}
</style>

