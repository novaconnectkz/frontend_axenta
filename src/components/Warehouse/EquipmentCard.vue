<template>
  <v-card class="equipment-card" elevation="2" :class="cardClass">
    <v-card-title class="d-flex align-center justify-space-between pb-2">
      <div class="d-flex align-center">
        <v-icon :icon="getTypeIcon(equipment.type)" class="mr-2" />
        <div>
          <div class="text-subtitle-1 font-weight-bold">{{ equipment.model }}</div>
          <div class="text-caption text-medium-emphasis">{{ equipment.brand }}</div>
        </div>
      </div>
      <v-menu>
        <template #activator="{ props }">
          <v-btn
            icon="mdi-dots-vertical"
            variant="text"
            size="small"
            v-bind="props"
          />
        </template>
        <v-list density="compact">
          <v-list-item @click="$emit('view-details')">
            <template #prepend>
              <v-icon icon="mdi-eye" />
            </template>
            <v-list-item-title>Просмотр</v-list-item-title>
          </v-list-item>
          <v-list-item @click="$emit('edit', equipment)">
            <template #prepend>
              <v-icon icon="mdi-pencil" />
            </template>
            <v-list-item-title>Редактировать</v-list-item-title>
          </v-list-item>
          <v-divider />
          <v-list-item
            v-if="equipment.status === 'in_stock'"
            @click="$emit('install', { object_id: null })"
          >
            <template #prepend>
              <v-icon icon="mdi-arrow-right" color="success" />
            </template>
            <v-list-item-title>Установить</v-list-item-title>
          </v-list-item>
          <v-list-item
            v-if="equipment.status === 'installed'"
            @click="$emit('uninstall')"
          >
            <template #prepend>
              <v-icon icon="mdi-arrow-left" color="warning" />
            </template>
            <v-list-item-title>Снять</v-list-item-title>
          </v-list-item>
          <v-list-item @click="$emit('transfer', { equipment_id: equipment.id })">
            <template #prepend>
              <v-icon icon="mdi-swap-horizontal" color="info" />
            </template>
            <v-list-item-title>Переместить</v-list-item-title>
          </v-list-item>
          <v-divider />
          <v-list-item
            @click="$emit('delete')"
            :disabled="equipment.status === 'installed'"
          >
            <template #prepend>
              <v-icon icon="mdi-delete" color="error" />
            </template>
            <v-list-item-title>Удалить</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-card-title>

    <v-card-text class="py-2">
      <!-- Статус и состояние -->
      <div class="d-flex align-center justify-space-between mb-3">
        <v-chip
          :color="getStatusColor(equipment.status)"
          size="small"
          variant="tonal"
        >
          {{ getStatusLabel(equipment.status) }}
        </v-chip>
        <v-chip
          :color="getConditionColor(equipment.condition)"
          size="small"
          variant="outlined"
        >
          {{ getConditionLabel(equipment.condition) }}
        </v-chip>
      </div>

      <!-- Основная информация -->
      <div class="equipment-info">
        <div class="info-row">
          <v-icon icon="mdi-barcode" size="16" class="mr-2" />
          <span class="text-caption text-medium-emphasis">S/N:</span>
          <span class="text-body-2 font-weight-medium ml-1">{{ equipment.serial_number }}</span>
        </div>

        <div v-if="equipment.imei" class="info-row">
          <v-icon icon="mdi-cellphone" size="16" class="mr-2" />
          <span class="text-caption text-medium-emphasis">IMEI:</span>
          <span class="text-body-2 ml-1">{{ equipment.imei }}</span>
        </div>

        <div v-if="equipment.phone_number" class="info-row">
          <v-icon icon="mdi-phone" size="16" class="mr-2" />
          <span class="text-caption text-medium-emphasis">Телефон:</span>
          <span class="text-body-2 ml-1">{{ equipment.phone_number }}</span>
        </div>

        <div v-if="equipment.mac_address" class="info-row">
          <v-icon icon="mdi-network" size="16" class="mr-2" />
          <span class="text-caption text-medium-emphasis">MAC:</span>
          <span class="text-body-2 ml-1">{{ equipment.mac_address }}</span>
        </div>

        <div v-if="equipment.warehouse_location" class="info-row">
          <v-icon icon="mdi-map-marker" size="16" class="mr-2" />
          <span class="text-caption text-medium-emphasis">Локация:</span>
          <span class="text-body-2 font-weight-medium ml-1">{{ equipment.warehouse_location }}</span>
        </div>

        <div v-if="equipment.category" class="info-row">
          <v-icon icon="mdi-tag" size="16" class="mr-2" />
          <span class="text-caption text-medium-emphasis">Категория:</span>
          <span class="text-body-2 ml-1">{{ equipment.category.name }}</span>
        </div>
      </div>

      <!-- Цена и гарантия -->
      <v-divider class="my-3" />
      <div class="d-flex align-center justify-space-between">
        <div class="text-body-2">
          <v-icon icon="mdi-currency-rub" size="16" class="mr-1" />
          {{ formatPrice(equipment.purchase_price) }}
        </div>
        <div v-if="equipment.warranty_until" class="text-caption" :class="getWarrantyClass(equipment.warranty_until)">
          <v-icon icon="mdi-shield" size="14" class="mr-1" />
          до {{ formatDate(equipment.warranty_until) }}
        </div>
      </div>

      <!-- QR код -->
      <div v-if="equipment.qr_code" class="qr-code-section mt-3">
        <v-divider class="mb-2" />
        <div class="d-flex align-center justify-center">
          <v-chip
            size="small"
            variant="outlined"
            prepend-icon="mdi-qrcode"
          >
            {{ equipment.qr_code }}
          </v-chip>
        </div>
      </div>

      <!-- Заметки -->
      <div v-if="equipment.notes" class="notes-section mt-3">
        <v-divider class="mb-2" />
        <div class="text-caption text-medium-emphasis mb-1">Заметки:</div>
        <div class="text-body-2">{{ truncateNotes(equipment.notes) }}</div>
      </div>
    </v-card-text>

    <v-card-actions class="pt-0">
      <v-btn
        color="primary"
        variant="outlined"
        size="small"
        block
        @click="$emit('view-details')"
      >
        Подробнее
      </v-btn>
    </v-card-actions>

    <!-- Индикаторы состояния -->
    <div class="status-indicators">
      <v-tooltip v-if="isWarrantyExpired" text="Гарантия истекла">
        <template #activator="{ props }">
          <v-icon
            icon="mdi-shield-alert"
            color="error"
            size="16"
            v-bind="props"
            class="status-indicator"
          />
        </template>
      </v-tooltip>
      
      <v-tooltip v-if="needsMaintenance" text="Требует обслуживания">
        <template #activator="{ props }">
          <v-icon
            icon="mdi-wrench-clock"
            color="warning"
            size="16"
            v-bind="props"
            class="status-indicator"
          />
        </template>
      </v-tooltip>

      <v-tooltip v-if="equipment.object_id" text="Установлено на объекте">
        <template #activator="{ props }">
          <v-icon
            icon="mdi-check-circle"
            color="success"
            size="16"
            v-bind="props"
            class="status-indicator"
          />
        </template>
      </v-tooltip>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { EquipmentBase, EquipmentForm, EquipmentInstallForm, EquipmentTransferForm } from '@/types/warehouse';
import {
  EQUIPMENT_STATUS_COLORS,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_CONDITION_COLORS,
  EQUIPMENT_CONDITION_LABELS,
  EQUIPMENT_TYPE_OPTIONS,
} from '@/types/warehouse';

// Props
interface Props {
  equipment: EquipmentBase;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  edit: [equipment: EquipmentBase];
  delete: [];
  install: [data: EquipmentInstallForm];
  uninstall: [];
  transfer: [data: Partial<EquipmentTransferForm>];
  'view-details': [];
}>();

// Вычисляемые свойства
const cardClass = computed(() => {
  const classes = ['equipment-card'];
  
  if (props.equipment.status === 'broken' || props.equipment.condition === 'damaged') {
    classes.push('equipment-card--damaged');
  } else if (props.equipment.status === 'maintenance') {
    classes.push('equipment-card--maintenance');
  } else if (props.equipment.status === 'reserved') {
    classes.push('equipment-card--reserved');
  }
  
  return classes;
});

const isWarrantyExpired = computed(() => {
  if (!props.equipment.warranty_until) return false;
  return new Date(props.equipment.warranty_until) < new Date();
});

const needsMaintenance = computed(() => {
  if (!props.equipment.last_maintenance_at) return false;
  const lastMaintenance = new Date(props.equipment.last_maintenance_at);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return lastMaintenance < sixMonthsAgo;
});

// Методы
const getTypeIcon = (type: string) => {
  const typeOption = EQUIPMENT_TYPE_OPTIONS.find(opt => opt.value === type);
  return typeOption?.icon || 'mdi-package-variant';
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

const getWarrantyClass = (warrantyDate: string) => {
  const date = new Date(warrantyDate);
  const now = new Date();
  const monthsLeft = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  if (monthsLeft < 0) return 'text-error';
  if (monthsLeft < 3) return 'text-warning';
  return '';
};

const truncateNotes = (notes: string) => {
  if (notes.length <= 100) return notes;
  return notes.substring(0, 100) + '...';
};
</script>

<style scoped>
.equipment-card {
  height: 100%;
  position: relative;
  transition: all 0.3s ease;
}

.equipment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.equipment-card--damaged {
  border-left: 4px solid rgb(var(--v-theme-error));
}

.equipment-card--maintenance {
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.equipment-card--reserved {
  border-left: 4px solid rgb(var(--v-theme-info));
}

.equipment-info {
  min-height: 120px;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  min-height: 20px;
}

.qr-code-section {
  text-align: center;
}

.notes-section {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 8px;
  padding: 8px;
}

.status-indicators {
  position: absolute;
  top: 8px;
  right: 40px;
  display: flex;
  gap: 4px;
}

.status-indicator {
  background: rgba(var(--v-theme-surface), 0.9);
  border-radius: 50%;
  padding: 2px;
}

/* Адаптивность */
@media (max-width: 768px) {
  .equipment-card {
    margin-bottom: 8px;
  }
  
  .info-row {
    font-size: 0.875rem;
  }
}
</style>
