<template>
  <v-dialog v-model="dialog" max-width="900px" scrollable>
    <v-card v-if="contract">
      <v-card-title class="dialog-header">
        <div class="header-content">
          <div class="header-info">
            <v-icon icon="mdi-file-document-multiple" class="mr-3" />
            <div>
              <div class="contract-number">{{ contract.number }}</div>
              <div class="contract-title">{{ contract.title }}</div>
            </div>
          </div>
          <div class="header-actions">
            <v-chip 
              :color="getContractStatusColor(contract.status)" 
              size="small"
              variant="tonal"
            >
              {{ getContractStatusLabel(contract.status) }}
            </v-chip>
          </div>
        </div>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
      </v-card-title>

      <v-divider />

      <v-card-text class="dialog-content">
        <v-container>
          <!-- Основная информация -->
          <div class="info-section">
            <h3 class="section-title">
              <v-icon icon="mdi-information" class="mr-2" />
              Основная информация
            </h3>
            
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Номер договора</div>
                <div class="info-value">{{ contract.number }}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Статус</div>
                <div class="info-value">
                  <v-chip 
                    :color="getContractStatusColor(contract.status)" 
                    size="small"
                    variant="tonal"
                  >
                    {{ getContractStatusLabel(contract.status) }}
                  </v-chip>
                </div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Название</div>
                <div class="info-value">{{ contract.title }}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Активность</div>
                <div class="info-value">
                  <v-chip 
                    :color="contract.is_active ? 'success' : 'grey'" 
                    size="small"
                    variant="tonal"
                  >
                    {{ contract.is_active ? 'Активный' : 'Неактивный' }}
                  </v-chip>
                </div>
              </div>
              
              <div v-if="contract.description" class="info-item full-width">
                <div class="info-label">Описание</div>
                <div class="info-value">{{ contract.description }}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Дата создания</div>
                <div class="info-value">{{ formatDateTime(contract.created_at) }}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Последнее обновление</div>
                <div class="info-value">{{ formatDateTime(contract.updated_at) }}</div>
              </div>
            </div>
          </div>

          <!-- Информация о клиенте -->
          <div class="info-section">
            <h3 class="section-title">
              <v-icon icon="mdi-account" class="mr-2" />
              Информация о клиенте
            </h3>
            
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Наименование</div>
                <div class="info-value">{{ contract.client_name }}</div>
              </div>
              
              <div v-if="contract.client_inn" class="info-item">
                <div class="info-label">ИНН</div>
                <div class="info-value">{{ contract.client_inn }}</div>
              </div>
              
              <div v-if="contract.client_kpp" class="info-item">
                <div class="info-label">КПП</div>
                <div class="info-value">{{ contract.client_kpp }}</div>
              </div>
              
              <div v-if="contract.client_email" class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">
                  <a :href="`mailto:${contract.client_email}`" class="email-link">
                    {{ contract.client_email }}
                  </a>
                </div>
              </div>
              
              <div v-if="contract.client_phone" class="info-item">
                <div class="info-label">Телефон</div>
                <div class="info-value">
                  <a :href="`tel:${contract.client_phone}`" class="phone-link">
                    {{ contract.client_phone }}
                  </a>
                </div>
              </div>
              
              <div v-if="contract.client_address" class="info-item full-width">
                <div class="info-label">Адрес</div>
                <div class="info-value">{{ contract.client_address }}</div>
              </div>
            </div>
          </div>

          <!-- Тарификация и стоимость -->
          <div class="info-section">
            <h3 class="section-title">
              <v-icon icon="mdi-currency-rub" class="mr-2" />
              Тарификация и стоимость
            </h3>
            
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Тарифный план</div>
                <div class="info-value">
                  <v-chip color="primary" size="small" variant="tonal">
                    {{ contract.tariff_plan?.name || 'Не указан' }}
                  </v-chip>
                </div>
              </div>
              
              <div v-if="contract.tariff_plan" class="info-item">
                <div class="info-label">Стоимость плана</div>
                <div class="info-value">
                  {{ formatCurrency(contract.tariff_plan.price, contract.currency) }}/мес
                </div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Общая стоимость</div>
                <div class="info-value amount-value">
                  {{ formatCurrency(contract.total_amount, contract.currency) }}
                </div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Валюта</div>
                <div class="info-value">{{ contract.currency }}</div>
              </div>
            </div>
          </div>

          <!-- Период действия -->
          <div class="info-section">
            <h3 class="section-title">
              <v-icon icon="mdi-calendar-range" class="mr-2" />
              Период действия
            </h3>
            
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Дата начала</div>
                <div class="info-value">{{ formatDate(contract.start_date) }}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Дата окончания</div>
                <div class="info-value">{{ formatDate(contract.end_date) }}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Статус периода</div>
                <div class="info-value">
                  <v-chip 
                    :color="getPeriodStatusColor(contract)" 
                    size="small"
                    variant="tonal"
                  >
                    {{ getPeriodStatusText(contract) }}
                  </v-chip>
                </div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Уведомлять за</div>
                <div class="info-value">{{ contract.notify_before }} дней</div>
              </div>
              
              <div v-if="contract.signed_at" class="info-item">
                <div class="info-label">Дата подписания</div>
                <div class="info-value">{{ formatDateTime(contract.signed_at) }}</div>
              </div>
            </div>
          </div>

          <!-- Привязанные объекты -->
          <div v-if="contract.objects && contract.objects.length > 0" class="info-section">
            <h3 class="section-title">
              <v-icon icon="mdi-link" class="mr-2" />
              Привязанные объекты ({{ contract.objects.length }})
            </h3>
            
            <div class="objects-list">
              <v-card
                v-for="object in contract.objects"
                :key="object.id"
                variant="outlined"
                class="object-card"
              >
                <v-card-text class="object-info">
                  <div class="object-header">
                    <div class="object-name">{{ object.name }}</div>
                    <v-chip 
                      :color="object.is_active ? 'success' : 'grey'" 
                      size="small"
                      variant="tonal"
                    >
                      {{ object.is_active ? 'Активный' : 'Неактивный' }}
                    </v-chip>
                  </div>
                  
                  <div class="object-details">
                    <div v-if="object.imei" class="object-detail">
                      <v-icon icon="mdi-identifier" size="small" class="mr-1" />
                      IMEI: {{ object.imei }}
                    </div>
                    <div v-if="object.phone_number" class="object-detail">
                      <v-icon icon="mdi-phone" size="small" class="mr-1" />
                      {{ object.phone_number }}
                    </div>
                    <div v-if="object.location" class="object-detail">
                      <v-icon icon="mdi-map-marker" size="small" class="mr-1" />
                      {{ object.location }}
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </div>

          <!-- Приложения к договору -->
          <div v-if="contract.appendices && contract.appendices.length > 0" class="info-section">
            <h3 class="section-title">
              <v-icon icon="mdi-file-document-plus" class="mr-2" />
              Приложения к договору ({{ contract.appendices.length }})
            </h3>
            
            <div class="appendices-list">
              <v-card
                v-for="appendix in contract.appendices"
                :key="appendix.id"
                variant="outlined"
                class="appendix-card"
              >
                <v-card-text class="appendix-info">
                  <div class="appendix-header">
                    <div class="appendix-number">{{ appendix.number }}</div>
                    <v-chip 
                      :color="getAppendixStatusColor(appendix.status)" 
                      size="small"
                      variant="tonal"
                    >
                      {{ getAppendixStatusLabel(appendix.status) }}
                    </v-chip>
                  </div>
                  
                  <div class="appendix-title">{{ appendix.title }}</div>
                  
                  <div class="appendix-details">
                    <div class="appendix-period">
                      {{ formatDate(appendix.start_date) }} - {{ formatDate(appendix.end_date) }}
                    </div>
                    <div class="appendix-amount">
                      {{ formatCurrency(appendix.amount, appendix.currency) }}
                    </div>
                  </div>
                  
                  <div v-if="appendix.description" class="appendix-description">
                    {{ appendix.description }}
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </div>

          <!-- Дополнительная информация -->
          <div class="info-section">
            <h3 class="section-title">
              <v-icon icon="mdi-information-outline" class="mr-2" />
              Дополнительная информация
            </h3>
            
            <div class="info-grid">
              <div v-if="contract.external_id" class="info-item">
                <div class="info-label">Внешний ID</div>
                <div class="info-value">{{ contract.external_id }}</div>
              </div>
              
              <div v-if="contract.notes" class="info-item full-width">
                <div class="info-label">Примечания</div>
                <div class="info-value">{{ contract.notes }}</div>
              </div>
            </div>
          </div>
        </v-container>
      </v-card-text>

      <v-divider />

      <v-card-actions class="dialog-actions">
        <v-spacer />
        <AppleButton variant="text" @click="closeDialog">
          Закрыть
        </AppleButton>
        <AppleButton 
          variant="outlined" 
          prepend-icon="mdi-pencil" 
          @click="editContract"
        >
          Редактировать
        </AppleButton>
        <AppleButton 
          variant="outlined" 
          prepend-icon="mdi-delete" 
          color="error"
          @click="deleteContract"
        >
          Удалить
        </AppleButton>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { 
  ContractWithRelations,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  CONTRACT_APPENDIX_STATUS_LABELS,
  CONTRACT_APPENDIX_STATUS_COLORS,
} from '@/types/contracts';
import contractsService from '@/services/contractsService';
import { AppleButton } from '@/components/Apple';

// Props
interface Props {
  modelValue: boolean;
  contract?: ContractWithRelations | null;
}

const props = withDefaults(defineProps<Props>(), {
  contract: null,
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  edit: [contract: ContractWithRelations];
  delete: [contract: ContractWithRelations];
}>();

// Computed
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// Methods
const closeDialog = () => {
  dialog.value = false;
};

const editContract = () => {
  if (props.contract) {
    emit('edit', props.contract);
    closeDialog();
  }
};

const deleteContract = () => {
  if (props.contract) {
    emit('delete', props.contract);
    closeDialog();
  }
};

const formatCurrency = (amount: string | number, currency = 'RUB'): string => {
  return contractsService.formatCurrency(amount, currency);
};

const formatDate = (date: string): string => {
  return contractsService.formatDate(date);
};

const formatDateTime = (date: string): string => {
  const d = new Date(date);
  return d.toLocaleString('ru-RU');
};

const getContractStatusColor = (status: string): string => {
  return CONTRACT_STATUS_COLORS[status as keyof typeof CONTRACT_STATUS_COLORS] || 'grey';
};

const getContractStatusLabel = (status: string): string => {
  return CONTRACT_STATUS_LABELS[status as keyof typeof CONTRACT_STATUS_LABELS] || status;
};

const getAppendixStatusColor = (status: string): string => {
  return CONTRACT_APPENDIX_STATUS_COLORS[status as keyof typeof CONTRACT_APPENDIX_STATUS_COLORS] || 'grey';
};

const getAppendixStatusLabel = (status: string): string => {
  return CONTRACT_APPENDIX_STATUS_LABELS[status as keyof typeof CONTRACT_APPENDIX_STATUS_LABELS] || status;
};

const getPeriodStatusColor = (contract: ContractWithRelations): string => {
  const now = new Date();
  const endDate = new Date(contract.end_date);
  
  if (now > endDate) {
    return 'error';
  } else if (contractsService.isContractExpiringSoon(contract)) {
    return 'warning';
  } else {
    return 'success';
  }
};

const getPeriodStatusText = (contract: ContractWithRelations): string => {
  const now = new Date();
  const endDate = new Date(contract.end_date);
  
  if (now > endDate) {
    return 'Истек';
  } else if (contractsService.isContractExpiringSoon(contract)) {
    const days = contractsService.getDaysUntilExpiry(contract);
    return `Истекает через ${days} дн.`;
  } else {
    const days = contractsService.getDaysUntilExpiry(contract);
    return `${days} дней до истечения`;
  }
};
</script>

<style scoped>
.dialog-header {
  padding: 20px 24px 16px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.header-info {
  display: flex;
  align-items: center;
}

.contract-number {
  font-size: 18px;
  font-weight: 600;
  font-family: 'SF Mono', monospace;
}

.contract-title {
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 2px;
}

.header-actions {
  display: flex;
  gap: 8px;
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
  margin-bottom: 32px;
  padding: 0 24px;
}

.info-section:last-child {
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

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface-variant));
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
}

.amount-value {
  font-weight: 600;
  font-family: 'SF Mono', monospace;
  font-size: 16px;
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

.objects-list,
.appendices-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.object-card,
.appendix-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.object-info,
.appendix-info {
  padding: 16px;
}

.object-header,
.appendix-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.object-name,
.appendix-number {
  font-weight: 600;
  font-size: 14px;
}

.object-details {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 8px;
}

.object-detail {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.appendix-title {
  font-size: 14px;
  margin-bottom: 8px;
}

.appendix-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 8px;
}

.appendix-amount {
  font-weight: 600;
  font-family: 'SF Mono', monospace;
}

.appendix-description {
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
  .dialog-header {
    padding: 16px 20px 12px;
  }

  .info-section {
    padding: 0 20px;
    margin-bottom: 24px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .dialog-actions {
    padding: 12px 20px 16px;
    flex-direction: column;
    gap: 8px;
  }

  .object-details {
    flex-direction: column;
    gap: 8px;
  }

  .appendix-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>

