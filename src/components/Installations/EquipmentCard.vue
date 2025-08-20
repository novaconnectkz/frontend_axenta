<template>
  <AppleCard
    class="equipment-card"
    :class="[`status-${equipment.status}`, `condition-${equipment.condition}`]"
    variant="outlined"
    @click="$emit('click', equipment)"
  >
    <!-- Заголовок карточки -->
    <template #header>
      <div class="card-header">
        <div class="header-left">
          <v-icon :icon="typeIcon" class="mr-2" />
          <div>
            <div class="equipment-name">{{ equipment.brand }} {{ equipment.model }}</div>
            <div class="equipment-type">{{ equipment.type }}</div>
          </div>
        </div>
        
        <div class="header-right">
          <v-chip
            :color="statusColor"
            size="small"
            variant="flat"
          >
            {{ statusLabel }}
          </v-chip>
        </div>
      </div>
    </template>

    <!-- Основное содержимое -->
    <div class="card-content">
      <!-- Идентификаторы -->
      <div class="identifiers-section">
        <div class="identifier-item">
          <span class="identifier-label">S/N:</span>
          <span class="identifier-value">{{ equipment.serial_number }}</span>
        </div>
        
        <div v-if="equipment.imei" class="identifier-item">
          <span class="identifier-label">IMEI:</span>
          <span class="identifier-value">{{ equipment.imei }}</span>
        </div>
        
        <div v-if="equipment.phone_number" class="identifier-item">
          <span class="identifier-label">Телефон:</span>
          <span class="identifier-value">{{ equipment.phone_number }}</span>
        </div>
      </div>

      <!-- Состояние и статус -->
      <div class="status-section">
        <div class="status-item">
          <span class="status-label">Состояние:</span>
          <v-chip
            :color="conditionColor"
            size="small"
            variant="outlined"
          >
            {{ conditionLabel }}
          </v-chip>
        </div>
        
        <div v-if="equipment.object_id" class="status-item">
          <span class="status-label">Установлено:</span>
          <v-chip
            size="small"
            variant="tonal"
            color="info"
          >
            На объекте
          </v-chip>
        </div>
      </div>

      <!-- Даты и стоимость -->
      <div v-if="hasDateInfo || hasCostInfo" class="details-section">
        <div v-if="equipment.purchase_date" class="detail-item">
          <v-icon icon="mdi-calendar" size="small" class="mr-2" />
          <span>Закуплено: {{ formatDate(equipment.purchase_date) }}</span>
        </div>
        
        <div v-if="equipment.warranty_expires_at" class="detail-item" :class="warrantyClass">
          <v-icon icon="mdi-shield-check" size="small" class="mr-2" />
          <span>Гарантия до: {{ formatDate(equipment.warranty_expires_at) }}</span>
        </div>
        
        <div v-if="equipment.purchase_price" class="detail-item">
          <v-icon icon="mdi-currency-rub" size="small" class="mr-2" />
          <span>Стоимость: {{ formatCurrency(equipment.purchase_price) }}</span>
        </div>
      </div>

      <!-- Заметки -->
      <div v-if="equipment.notes" class="notes-section">
        <p class="notes-text">{{ equipment.notes }}</p>
      </div>

      <!-- QR код -->
      <div v-if="equipment.qr_code" class="qr-section">
        <v-chip
          size="small"
          variant="tonal"
          prepend-icon="mdi-qrcode"
          @click.stop="showQRCode"
        >
          QR код
        </v-chip>
      </div>
    </div>

    <!-- Действия -->
    <template #actions>
      <div class="card-actions">
        <AppleButton
          variant="secondary"
          prepend-icon="mdi-pencil"
          size="small"
          @click.stop="$emit('edit', equipment)"
        >
          Изменить
        </AppleButton>
        
        <AppleButton
          v-if="equipment.status === 'in_stock'"
          color="success"
          prepend-icon="mdi-package-up"
          size="small"
          @click.stop="$emit('install', equipment)"
        >
          Установить
        </AppleButton>
        
        <AppleButton
          v-if="equipment.status === 'installed'"
          variant="secondary"
          prepend-icon="mdi-package-down"
          size="small"
          @click.stop="handleUninstall"
        >
          Снять
        </AppleButton>
        
        <v-menu>
          <template #activator="{ props }">
            <AppleButton
              variant="text"
              icon="mdi-dots-vertical"
              size="small"
              v-bind="props"
              @click.stop
            />
          </template>
          
          <v-list density="compact">
            <v-list-item
              v-if="equipment.qr_code"
              prepend-icon="mdi-qrcode"
              title="Показать QR код"
              @click="showQRCode"
            />
            <v-list-item
              prepend-icon="mdi-history"
              title="История операций"
              @click="showHistory"
            />
            <v-list-item
              prepend-icon="mdi-content-copy"
              title="Дублировать"
              @click="duplicateEquipment"
            />
            <v-divider />
            <v-list-item
              prepend-icon="mdi-delete"
              title="Удалить"
              @click="$emit('delete', equipment)"
            />
          </v-list>
        </v-menu>
      </div>
    </template>
  </AppleCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { format, isBefore, addMonths } from "date-fns";
import { ru } from "date-fns/locale";
import AppleButton from "@/components/Apple/AppleButton.vue";
import AppleCard from "@/components/Apple/AppleCard.vue";
import type { EquipmentBase } from "@/types/installations";

interface Props {
  equipment: EquipmentBase;
}

interface Emits {
  (e: "click", equipment: EquipmentBase): void;
  (e: "edit", equipment: EquipmentBase): void;
  (e: "delete", equipment: EquipmentBase): void;
  (e: "install", equipment: EquipmentBase): void;
  (e: "uninstall", equipment: EquipmentBase): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Цвет статуса
const statusColor = computed(() => {
  switch (props.equipment.status) {
    case "in_stock":
      return "success";
    case "reserved":
      return "warning";
    case "installed":
      return "info";
    case "maintenance":
      return "error";
    default:
      return "default";
  }
});

// Текст статуса
const statusLabel = computed(() => {
  switch (props.equipment.status) {
    case "in_stock":
      return "На складе";
    case "reserved":
      return "Зарезервировано";
    case "installed":
      return "Установлено";
    case "maintenance":
      return "На обслуживании";
    default:
      return props.equipment.status;
  }
});

// Цвет состояния
const conditionColor = computed(() => {
  switch (props.equipment.condition) {
    case "new":
      return "success";
    case "used":
      return "info";
    case "refurbished":
      return "warning";
    case "damaged":
      return "error";
    default:
      return "default";
  }
});

// Текст состояния
const conditionLabel = computed(() => {
  switch (props.equipment.condition) {
    case "new":
      return "Новое";
    case "used":
      return "Б/У";
    case "refurbished":
      return "Восстановленное";
    case "damaged":
      return "Поврежденное";
    default:
      return props.equipment.condition;
  }
});

// Иконка типа оборудования
const typeIcon = computed(() => {
  const type = props.equipment.type.toLowerCase();
  
  if (type.includes("gps") || type.includes("трекер")) {
    return "mdi-crosshairs-gps";
  } else if (type.includes("сенсор") || type.includes("sensor")) {
    return "mdi-radar";
  } else if (type.includes("камера") || type.includes("camera")) {
    return "mdi-camera";
  } else if (type.includes("сигнализ")) {
    return "mdi-shield-alert";
  }
  
  return "mdi-tools";
});

// Класс для гарантии
const warrantyClass = computed(() => {
  if (!props.equipment.warranty_expires_at) return "";
  
  const warranty = new Date(props.equipment.warranty_expires_at);
  const now = new Date();
  const threeMonthsFromNow = addMonths(now, 3);

  if (isBefore(warranty, now)) {
    return "warranty-expired";
  } else if (isBefore(warranty, threeMonthsFromNow)) {
    return "warranty-expiring";
  }
  return "warranty-valid";
});

// Наличие дополнительной информации
const hasDateInfo = computed(() => 
  props.equipment.purchase_date || props.equipment.warranty_expires_at
);

const hasCostInfo = computed(() => 
  props.equipment.purchase_price
);

// Функции форматирования
const formatDate = (dateString: string): string => {
  return format(new Date(dateString), "dd.MM.yyyy", { locale: ru });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
  }).format(amount);
};

// Обработчики действий
const handleUninstall = () => {
  emit("uninstall", props.equipment);
};

const showQRCode = () => {
  // TODO: Реализовать показ QR кода
  console.log("Show QR code for equipment:", props.equipment.id);
};

const showHistory = () => {
  // TODO: Реализовать показ истории
  console.log("Show history for equipment:", props.equipment.id);
};

const duplicateEquipment = () => {
  // TODO: Реализовать дублирование оборудования
  console.log("Duplicate equipment:", props.equipment.id);
};
</script>

<style scoped>
.equipment-card {
  cursor: pointer;
  transition: all 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.equipment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Статусы */
.status-in_stock {
  border-left: 4px solid rgb(var(--v-theme-success));
  background: rgba(var(--v-theme-success), 0.05);
}

.status-reserved {
  border-left: 4px solid rgb(var(--v-theme-warning));
  background: rgba(var(--v-theme-warning), 0.05);
}

.status-installed {
  border-left: 4px solid rgb(var(--v-theme-info));
  background: rgba(var(--v-theme-info), 0.05);
}

.status-maintenance {
  border-left: 4px solid rgb(var(--v-theme-error));
  background: rgba(var(--v-theme-error), 0.05);
}

/* Состояния */
.condition-damaged {
  opacity: 0.8;
}

/* Заголовок */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.equipment-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.equipment-type {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.header-right {
  flex-shrink: 0;
}

/* Содержимое */
.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0;
}

/* Идентификаторы */
.identifiers-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.identifier-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
}

.identifier-label {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
  min-width: 60px;
}

.identifier-value {
  color: rgb(var(--v-theme-on-surface));
  font-family: monospace;
}

/* Статус */
.status-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.status-label {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

/* Детали */
.details-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.detail-item.warranty-expired {
  color: rgb(var(--v-theme-error));
}

.detail-item.warranty-expiring {
  color: rgb(var(--v-theme-warning));
}

.detail-item.warranty-valid {
  color: rgb(var(--v-theme-success));
}

/* Заметки */
.notes-section {
  margin-top: 8px;
}

.notes-text {
  margin: 0;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* QR код */
.qr-section {
  margin-top: 8px;
}

/* Действия */
.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

/* Адаптивность */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .header-left {
    justify-content: center;
  }
  
  .header-right {
    align-self: center;
  }
  
  .status-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .card-actions {
    justify-content: stretch;
  }
  
  .card-actions .v-btn:not(.v-btn--icon) {
    flex: 1;
  }
}
</style>
