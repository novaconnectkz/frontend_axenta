<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="900px"
  >
    <v-card v-if="equipment">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon :icon="getTypeIcon(equipment.type)" class="mr-2" />
          {{ equipment.model }} {{ equipment.brand }}
        </div>
        <div class="d-flex align-center ga-2">
          <v-chip
            :color="getStatusColor(equipment.status)"
            variant="tonal"
          >
            {{ getStatusLabel(equipment.status) }}
          </v-chip>
          <v-chip
            :color="getConditionColor(equipment.condition)"
            variant="outlined"
          >
            {{ getConditionLabel(equipment.condition) }}
          </v-chip>
        </div>
      </v-card-title>

      <v-card-text>
        <v-row>
          <!-- Основная информация -->
          <v-col cols="12" md="6">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-1">
                <v-icon icon="mdi-information" class="mr-2" />
                Основная информация
              </v-card-title>
              <v-card-text>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Тип:</span>
                    <span class="info-value">{{ getTypeLabel(equipment.type) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Модель:</span>
                    <span class="info-value">{{ equipment.model }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Производитель:</span>
                    <span class="info-value">{{ equipment.brand }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Серийный номер:</span>
                    <span class="info-value font-weight-medium">{{ equipment.serial_number }}</span>
                  </div>
                  <div v-if="equipment.category" class="info-item">
                    <span class="info-label">Категория:</span>
                    <v-chip color="primary" size="small" variant="outlined">
                      {{ equipment.category.name }}
                    </v-chip>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Идентификаторы -->
          <v-col cols="12" md="6">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-1">
                <v-icon icon="mdi-identifier" class="mr-2" />
                Идентификаторы
              </v-card-title>
              <v-card-text>
                <div class="info-grid">
                  <div v-if="equipment.imei" class="info-item">
                    <span class="info-label">IMEI:</span>
                    <span class="info-value font-mono">{{ equipment.imei }}</span>
                  </div>
                  <div v-if="equipment.phone_number" class="info-item">
                    <span class="info-label">Телефон:</span>
                    <span class="info-value font-mono">{{ equipment.phone_number }}</span>
                  </div>
                  <div v-if="equipment.mac_address" class="info-item">
                    <span class="info-label">MAC адрес:</span>
                    <span class="info-value font-mono">{{ equipment.mac_address }}</span>
                  </div>
                  <div v-if="equipment.qr_code" class="info-item">
                    <span class="info-label">QR код:</span>
                    <v-chip size="small" variant="outlined" prepend-icon="mdi-qrcode">
                      {{ equipment.qr_code }}
                    </v-chip>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Местоположение и статус -->
          <v-col cols="12" md="6">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-1">
                <v-icon icon="mdi-map-marker" class="mr-2" />
                Местоположение
              </v-card-title>
              <v-card-text>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Статус:</span>
                    <v-chip
                      :color="getStatusColor(equipment.status)"
                      size="small"
                      variant="tonal"
                    >
                      {{ getStatusLabel(equipment.status) }}
                    </v-chip>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Состояние:</span>
                    <v-chip
                      :color="getConditionColor(equipment.condition)"
                      size="small"
                      variant="outlined"
                    >
                      {{ getConditionLabel(equipment.condition) }}
                    </v-chip>
                  </div>
                  <div v-if="equipment.warehouse_location" class="info-item">
                    <span class="info-label">Склад:</span>
                    <span class="info-value font-weight-medium">{{ equipment.warehouse_location }}</span>
                  </div>
                  <div v-if="equipment.object_id" class="info-item">
                    <span class="info-label">Объект:</span>
                    <v-chip color="info" size="small" variant="tonal">
                      ID: {{ equipment.object_id }}
                    </v-chip>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Финансовая информация -->
          <v-col cols="12" md="6">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-1">
                <v-icon icon="mdi-currency-rub" class="mr-2" />
                Финансовая информация
              </v-card-title>
              <v-card-text>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Закупочная цена:</span>
                    <span class="info-value font-weight-bold">{{ formatPrice(equipment.purchase_price) }}</span>
                  </div>
                  <div v-if="equipment.purchase_date" class="info-item">
                    <span class="info-label">Дата закупки:</span>
                    <span class="info-value">{{ formatDate(equipment.purchase_date) }}</span>
                  </div>
                  <div v-if="equipment.warranty_until" class="info-item">
                    <span class="info-label">Гарантия до:</span>
                    <span class="info-value" :class="getWarrantyClass(equipment.warranty_until)">
                      {{ formatDate(equipment.warranty_until) }}
                      <v-icon
                        v-if="isWarrantyExpired"
                        icon="mdi-alert"
                        color="error"
                        size="16"
                        class="ml-1"
                      />
                    </span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Технические характеристики -->
          <v-col v-if="specifications" cols="12">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-1">
                <v-icon icon="mdi-cog" class="mr-2" />
                Технические характеристики
              </v-card-title>
              <v-card-text>
                <div class="specifications-grid">
                  <div
                    v-for="(value, key) in specifications"
                    :key="key"
                    class="spec-item"
                  >
                    <span class="spec-label">{{ formatSpecKey(key) }}:</span>
                    <span class="spec-value">{{ value }}</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Заметки -->
          <v-col v-if="equipment.notes" cols="12">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-1">
                <v-icon icon="mdi-note-text" class="mr-2" />
                Заметки
              </v-card-title>
              <v-card-text>
                <div class="notes-content">{{ equipment.notes }}</div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Даты -->
          <v-col cols="12">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-1">
                <v-icon icon="mdi-clock" class="mr-2" />
                История
              </v-card-title>
              <v-card-text>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Создано:</span>
                    <span class="info-value">{{ formatDateTime(equipment.created_at) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Обновлено:</span>
                    <span class="info-value">{{ formatDateTime(equipment.updated_at) }}</span>
                  </div>
                  <div v-if="equipment.last_maintenance_at" class="info-item">
                    <span class="info-label">Последнее обслуживание:</span>
                    <span class="info-value">{{ formatDateTime(equipment.last_maintenance_at) }}</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn
          variant="outlined"
          @click="$emit('update:modelValue', false)"
        >
          Закрыть
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { EquipmentBase } from '@/types/warehouse';
import {
  EQUIPMENT_STATUS_COLORS,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_CONDITION_COLORS,
  EQUIPMENT_CONDITION_LABELS,
  EQUIPMENT_TYPE_OPTIONS,
} from '@/types/warehouse';

// Props
interface Props {
  modelValue: boolean;
  equipment: EquipmentBase | null;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

// Вычисляемые свойства
const specifications = computed(() => {
  if (!props.equipment?.specifications) return null;
  try {
    return JSON.parse(props.equipment.specifications);
  } catch {
    return null;
  }
});

const isWarrantyExpired = computed(() => {
  if (!props.equipment?.warranty_until) return false;
  return new Date(props.equipment.warranty_until) < new Date();
});

// Методы
const getTypeIcon = (type: string) => {
  const typeOption = EQUIPMENT_TYPE_OPTIONS.find(opt => opt.value === type);
  return typeOption?.icon || 'mdi-package-variant';
};

const getTypeLabel = (type: string) => {
  const typeOption = EQUIPMENT_TYPE_OPTIONS.find(opt => opt.value === type);
  return typeOption?.title || type;
};

const getStatusColor = (status: string) => 
  EQUIPMENT_STATUS_COLORS[status as keyof typeof EQUIPMENT_STATUS_COLORS] || 'grey';

const getStatusLabel = (status: string) => 
  EQUIPMENT_STATUS_LABELS[status as keyof typeof EQUIPMENT_STATUS_LABELS] || status;

const getConditionColor = (condition: string) => 
  EQUIPMENT_CONDITION_COLORS[condition as keyof typeof EQUIPMENT_CONDITION_COLORS] || 'grey';

const getConditionLabel = (condition: string) => 
  EQUIPMENT_CONDITION_LABELS[condition as keyof typeof EQUIPMENT_CONDITION_LABELS] || condition;

const formatPrice = (price: string) => {
  const num = parseFloat(price);
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(num);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU');
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('ru-RU');
};

const getWarrantyClass = (warrantyDate: string) => {
  const date = new Date(warrantyDate);
  const now = new Date();
  const monthsLeft = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  if (monthsLeft < 0) return 'text-error';
  if (monthsLeft < 3) return 'text-warning';
  return '';
};

const formatSpecKey = (key: string) => {
  // Преобразование ключей спецификаций в читаемый вид
  const keyMap: Record<string, string> = {
    voltage: 'Напряжение',
    power: 'Мощность',
    gps_accuracy: 'Точность GPS',
    resolution: 'Разрешение',
    lens: 'Объектив',
    night_vision: 'Ночное видение',
    detection_range: 'Дальность обнаружения',
    detection_angle: 'Угол обнаружения',
    length: 'Длина',
    category: 'Категория',
    bandwidth: 'Пропускная способность',
    ports: 'Порты',
    type: 'Тип',
    range_temp: 'Диапазон температур',
    range_humidity: 'Диапазон влажности',
    accelerometer: 'Акселерометр',
  };
  return keyMap[key] || key;
};
</script>

<style scoped>
:deep(.v-card-title) {
  background: rgba(var(--v-theme-primary), 0.1);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
}

.info-grid {
  display: grid;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(var(--v-theme-outline-variant), 0.3);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
  font-weight: 500;
  min-width: 120px;
}

.info-value {
  font-size: 0.875rem;
  text-align: right;
  flex: 1;
}

.specifications-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.spec-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 8px;
}

.spec-label {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
  font-weight: 500;
}

.spec-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

.notes-content {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
  padding: 16px;
  white-space: pre-wrap;
  line-height: 1.5;
}

.font-mono {
  font-family: 'Courier New', monospace;
}

/* Адаптивность */
@media (max-width: 768px) {
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .info-label {
    min-width: auto;
  }
  
  .info-value {
    text-align: left;
  }
  
  .specifications-grid {
    grid-template-columns: 1fr;
  }
  
  .spec-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
