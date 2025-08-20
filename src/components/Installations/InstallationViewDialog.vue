<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="900"
  >
    <AppleCard v-if="installation">
      <template #header>
        <div class="dialog-header">
          <v-icon :icon="typeIcon" class="mr-2" />
          {{ installation.type }}
          <v-chip
            :color="statusColor"
            size="small"
            variant="flat"
            class="ml-2"
          >
            {{ statusLabel }}
          </v-chip>
          <v-chip
            v-if="installation.priority !== 'normal'"
            :color="priorityColor"
            size="small"
            variant="outlined"
            class="ml-2"
          >
            {{ priorityLabel }}
          </v-chip>
        </div>
      </template>

      <div class="dialog-content">
        <v-row>
          <!-- Основная информация -->
          <v-col cols="12" md="6">
            <div class="info-section">
              <h4 class="section-title">Основная информация</h4>
              
              <div class="info-item">
                <span class="label">Дата и время:</span>
                <span class="value">{{ formatDateTime(installation.scheduled_at) }}</span>
              </div>
              
              <div class="info-item">
                <span class="label">Планируемая длительность:</span>
                <span class="value">{{ formatDuration(installation.estimated_duration) }}</span>
              </div>
              
              <div v-if="installation.actual_duration" class="info-item">
                <span class="label">Фактическая длительность:</span>
                <span class="value">{{ formatDuration(installation.actual_duration) }}</span>
              </div>
              
              <div class="info-item">
                <span class="label">Создан:</span>
                <span class="value">{{ formatDateTime(installation.created_at) }}</span>
              </div>
              
              <div v-if="installation.updated_at !== installation.created_at" class="info-item">
                <span class="label">Обновлен:</span>
                <span class="value">{{ formatDateTime(installation.updated_at) }}</span>
              </div>
            </div>
          </v-col>

          <!-- Объект -->
          <v-col cols="12" md="6">
            <div class="info-section">
              <h4 class="section-title">Объект мониторинга</h4>
              
              <div class="object-info">
                <div class="object-header">
                  <v-icon icon="mdi-office-building" class="mr-2" />
                  <span class="object-name">{{ installation.object.name }}</span>
                </div>
                
                <div class="object-details">
                  <div v-if="installation.object.type" class="detail-item">
                    <span class="detail-label">Тип:</span>
                    <span>{{ installation.object.type }}</span>
                  </div>
                  
                  <div v-if="installation.object.imei" class="detail-item">
                    <span class="detail-label">IMEI:</span>
                    <span>{{ installation.object.imei }}</span>
                  </div>
                  
                  <div v-if="installation.object.phone_number" class="detail-item">
                    <span class="detail-label">Номер телефона:</span>
                    <span>{{ installation.object.phone_number }}</span>
                  </div>
                </div>
              </div>
            </div>
          </v-col>

          <!-- Монтажник -->
          <v-col cols="12" md="6">
            <div class="info-section">
              <h4 class="section-title">Монтажник</h4>
              
              <div class="installer-info">
                <div class="installer-header">
                  <v-avatar size="40" class="mr-3">
                    <v-icon icon="mdi-account-hard-hat" />
                  </v-avatar>
                  <div>
                    <div class="installer-name">
                      {{ installation.installer.first_name }} {{ installation.installer.last_name }}
                    </div>
                    <div class="installer-type">{{ getInstallerTypeLabel(installation.installer.type) }}</div>
                  </div>
                </div>
                
                <div class="installer-details">
                  <div class="detail-item">
                    <v-icon icon="mdi-phone" size="small" class="mr-2" />
                    <span>{{ installation.installer.phone }}</span>
                  </div>
                  
                  <div class="detail-item">
                    <v-icon icon="mdi-email" size="small" class="mr-2" />
                    <span>{{ installation.installer.email }}</span>
                  </div>
                  
                  <div v-if="installation.installer.specialization.length > 0" class="detail-item">
                    <v-icon icon="mdi-star" size="small" class="mr-2" />
                    <span>{{ installation.installer.specialization.join(', ') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </v-col>

          <!-- Местоположение -->
          <v-col cols="12" md="6">
            <div class="info-section">
              <h4 class="section-title">Местоположение</h4>
              
              <div v-if="installation.location" class="info-item">
                <span class="label">Локация:</span>
                <span class="value">
                  {{ installation.location.city }}, {{ installation.location.region }}
                </span>
              </div>
              
              <div class="info-item">
                <span class="label">Адрес:</span>
                <span class="value">{{ installation.address }}</span>
              </div>
              
              <div class="info-item">
                <span class="label">Контакт клиента:</span>
                <span class="value">{{ installation.client_contact }}</span>
              </div>
            </div>
          </v-col>

          <!-- Описание и заметки -->
          <v-col v-if="installation.description || installation.notes" cols="12">
            <div class="info-section">
              <h4 class="section-title">Описание и заметки</h4>
              
              <div v-if="installation.description" class="description-block">
                <h5 class="block-title">Описание работ:</h5>
                <p class="description-text">{{ installation.description }}</p>
              </div>
              
              <div v-if="installation.notes" class="description-block">
                <h5 class="block-title">Заметки:</h5>
                <p class="description-text">{{ installation.notes }}</p>
              </div>
            </div>
          </v-col>

          <!-- Результат -->
          <v-col v-if="installation.result" cols="12">
            <div class="info-section">
              <h4 class="section-title">Результат выполнения</h4>
              <p class="result-text">{{ installation.result }}</p>
            </div>
          </v-col>

          <!-- Стоимость -->
          <v-col v-if="installation.is_billable" cols="12" md="6">
            <div class="info-section">
              <h4 class="section-title">Стоимость</h4>
              
              <div v-if="installation.cost" class="info-item">
                <span class="label">Общая стоимость:</span>
                <span class="value cost-value">{{ formatCurrency(installation.cost) }}</span>
              </div>
              
              <div v-if="installation.labor_cost" class="info-item">
                <span class="label">Стоимость работ:</span>
                <span class="value">{{ formatCurrency(installation.labor_cost) }}</span>
              </div>
              
              <div v-if="installation.materials_cost" class="info-item">
                <span class="label">Стоимость материалов:</span>
                <span class="value">{{ formatCurrency(installation.materials_cost) }}</span>
              </div>
            </div>
          </v-col>

          <!-- Оборудование -->
          <v-col v-if="installation.equipment && installation.equipment.length > 0" cols="12" md="6">
            <div class="info-section">
              <h4 class="section-title">Оборудование</h4>
              
              <div class="equipment-list">
                <div
                  v-for="equipment in installation.equipment"
                  :key="equipment.id"
                  class="equipment-item"
                >
                  <v-icon icon="mdi-tools" size="small" class="mr-2" />
                  <div class="equipment-details">
                    <div class="equipment-name">{{ equipment.brand }} {{ equipment.model }}</div>
                    <div class="equipment-info">
                      <span class="equipment-type">{{ equipment.type }}</span>
                      <span v-if="equipment.serial_number" class="equipment-serial">
                        S/N: {{ equipment.serial_number }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </div>

      <template #actions>
        <div class="dialog-actions">
          <AppleButton
            variant="secondary"
            @click="$emit('update:modelValue', false)"
          >
            Закрыть
          </AppleButton>
        </div>
      </template>
    </AppleCard>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import AppleButton from "@/components/Apple/AppleButton.vue";
import AppleCard from "@/components/Apple/AppleCard.vue";
import type { InstallationWithRelations } from "@/types/installations";

interface Props {
  modelValue: boolean;
  installation?: InstallationWithRelations | null;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  installation: null,
});

const emit = defineEmits<Emits>();

// Цвет статуса
const statusColor = computed(() => {
  if (!props.installation) return "default";
  
  switch (props.installation.status) {
    case "planned":
      return "info";
    case "in_progress":
      return "warning";
    case "completed":
      return "success";
    case "cancelled":
      return "error";
    default:
      return "default";
  }
});

// Текст статуса
const statusLabel = computed(() => {
  if (!props.installation) return "";
  
  switch (props.installation.status) {
    case "planned":
      return "Запланирован";
    case "in_progress":
      return "Выполняется";
    case "completed":
      return "Завершен";
    case "cancelled":
      return "Отменен";
    default:
      return props.installation.status;
  }
});

// Цвет приоритета
const priorityColor = computed(() => {
  if (!props.installation) return "default";
  
  switch (props.installation.priority) {
    case "urgent":
      return "error";
    case "high":
      return "warning";
    case "low":
      return "info";
    default:
      return "default";
  }
});

// Текст приоритета
const priorityLabel = computed(() => {
  if (!props.installation) return "";
  
  switch (props.installation.priority) {
    case "urgent":
      return "Срочно";
    case "high":
      return "Высокий";
    case "low":
      return "Низкий";
    case "normal":
      return "Обычный";
    default:
      return props.installation.priority;
  }
});

// Иконка типа монтажа
const typeIcon = computed(() => {
  if (!props.installation) return "mdi-tools";
  
  switch (props.installation.type) {
    case "монтаж":
      return "mdi-tools";
    case "диагностика":
      return "mdi-stethoscope";
    case "демонтаж":
      return "mdi-wrench";
    case "обслуживание":
      return "mdi-cog";
    default:
      return "mdi-tools";
  }
});

// Функции форматирования
const formatDateTime = (dateString: string): string => {
  return format(new Date(dateString), "dd.MM.yyyy HH:mm", { locale: ru });
};

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}ч ${mins}м`;
  }
  return `${mins}м`;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
  }).format(amount);
};

const getInstallerTypeLabel = (type: string): string => {
  switch (type) {
    case "staff":
      return "Штатный";
    case "contractor":
      return "Подрядчик";
    case "partner":
      return "Партнер";
    default:
      return type;
  }
};
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  font-weight: 600;
}

.dialog-content {
  padding: 24px 0;
  max-height: 70vh;
  overflow-y: auto;
}

.info-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  margin: 0 0 16px 0;
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
  padding-bottom: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 16px;
}

.label {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
  flex-shrink: 0;
  min-width: 140px;
}

.value {
  color: rgb(var(--v-theme-on-surface));
  text-align: right;
  word-break: break-word;
}

.cost-value {
  font-weight: 600;
  color: rgb(var(--v-theme-success));
}

/* Объект */
.object-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.object-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.object-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.object-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 32px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.detail-label {
  font-weight: 500;
  min-width: 80px;
}

/* Монтажник */
.installer-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.installer-header {
  display: flex;
  align-items: center;
}

.installer-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.installer-type {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.installer-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Описание */
.description-block {
  margin-bottom: 16px;
}

.block-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: rgb(var(--v-theme-on-surface));
}

.description-text {
  margin: 0;
  line-height: 1.5;
  color: rgb(var(--v-theme-on-surface-variant));
}

.result-text {
  margin: 0;
  line-height: 1.5;
  color: rgb(var(--v-theme-on-surface));
  padding: 16px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 8px;
}

/* Оборудование */
.equipment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.equipment-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 8px;
}

.equipment-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.equipment-name {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.equipment-info {
  display: flex;
  gap: 12px;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.equipment-type {
  font-weight: 500;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
}

/* Адаптивность */
@media (max-width: 768px) {
  .dialog-content {
    max-height: 60vh;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .label {
    min-width: auto;
  }
  
  .value {
    text-align: left;
  }
  
  .object-details {
    padding-left: 0;
  }
  
  .installer-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .equipment-info {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
