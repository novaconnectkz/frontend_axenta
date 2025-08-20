<template>
  <AppleCard
    class="installation-card"
    :class="[`status-${installation.status}`, `priority-${installation.priority}`]"
    variant="outlined"
    @click="$emit('click', installation)"
  >
    <!-- Заголовок карточки -->
    <template #header>
      <div class="card-header">
        <div class="header-left">
          <v-icon :icon="typeIcon" class="mr-2" />
          <span class="installation-type">{{ installation.type }}</span>
          <v-chip
            v-if="installation.priority !== 'normal'"
            :color="priorityColor"
            size="small"
            variant="flat"
            class="ml-2"
          >
            {{ priorityLabel }}
          </v-chip>
        </div>
        
        <v-chip
          :color="statusColor"
          size="small"
          variant="flat"
        >
          {{ statusLabel }}
        </v-chip>
      </div>
    </template>

    <!-- Основное содержимое -->
    <div class="card-content">
      <!-- Объект и время -->
      <div class="object-section">
        <div class="object-info">
          <h4 class="object-name">{{ installation.object.name }}</h4>
          <div class="object-details">
            <span v-if="installation.object.type" class="object-type">
              {{ installation.object.type }}
            </span>
            <span v-if="installation.object.imei" class="object-imei">
              IMEI: {{ installation.object.imei }}
            </span>
          </div>
        </div>
        
        <div class="datetime-info">
          <div class="date">{{ formatDate(installation.scheduled_at) }}</div>
          <div class="time">{{ formatTime(installation.scheduled_at) }}</div>
        </div>
      </div>

      <!-- Монтажник и адрес -->
      <div class="details-section">
        <div class="installer-info">
          <v-icon icon="mdi-account-hard-hat" size="small" class="mr-2" />
          <span>{{ installation.installer.first_name }} {{ installation.installer.last_name }}</span>
        </div>
        
        <div v-if="installation.address" class="address-info">
          <v-icon icon="mdi-map-marker" size="small" class="mr-2" />
          <span>{{ installation.address }}</span>
        </div>
      </div>

      <!-- Дополнительная информация -->
      <div class="meta-section">
        <div class="duration-info">
          <v-icon icon="mdi-clock-outline" size="small" class="mr-1" />
          <span>{{ formatDuration(installation.estimated_duration) }}</span>
        </div>
        
        <div v-if="installation.is_billable && installation.cost" class="cost-info">
          <v-icon icon="mdi-currency-rub" size="small" class="mr-1" />
          <span>{{ formatCurrency(installation.cost) }}</span>
        </div>
        
        <div v-if="installation.equipment && installation.equipment.length > 0" class="equipment-info">
          <v-icon icon="mdi-tools" size="small" class="mr-1" />
          <span>{{ installation.equipment.length }} ед. оборудования</span>
        </div>
      </div>

      <!-- Описание -->
      <div v-if="installation.description" class="description-section">
        <p class="description">{{ installation.description }}</p>
      </div>
    </div>

    <!-- Действия -->
    <template #actions>
      <div class="card-actions">
        <AppleButton
          v-if="installation.status === 'planned'"
          variant="secondary"
          prepend-icon="mdi-play"
          size="small"
          @click.stop="$emit('start', installation)"
        >
          Начать
        </AppleButton>
        
        <AppleButton
          v-if="installation.status === 'in_progress'"
          variant="primary"
          prepend-icon="mdi-check"
          size="small"
          @click.stop="$emit('complete', installation)"
        >
          Завершить
        </AppleButton>
        
        <AppleButton
          variant="secondary"
          prepend-icon="mdi-pencil"
          size="small"
          @click.stop="$emit('edit', installation)"
        >
          Изменить
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
              v-if="installation.status !== 'completed'"
              prepend-icon="mdi-close"
              title="Отменить"
              @click="$emit('cancel', installation)"
            />
            <v-list-item
              prepend-icon="mdi-delete"
              title="Удалить"
              @click="$emit('delete', installation)"
            />
          </v-list>
        </v-menu>
      </div>
    </template>
  </AppleCard>
</template>

<script setup lang="ts">
import AppleButton from "@/components/Apple/AppleButton.vue";
import AppleCard from "@/components/Apple/AppleCard.vue";
import type { InstallationWithRelations } from "@/types/installations";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { computed } from "vue";

interface Props {
  installation: InstallationWithRelations;
}

interface Emits {
  (e: "click", installation: InstallationWithRelations): void;
  (e: "edit", installation: InstallationWithRelations): void;
  (e: "start", installation: InstallationWithRelations): void;
  (e: "complete", installation: InstallationWithRelations): void;
  (e: "cancel", installation: InstallationWithRelations): void;
  (e: "delete", installation: InstallationWithRelations): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Цвет статуса
const statusColor = computed(() => {
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
const formatDate = (dateString: string): string => {
  return format(new Date(dateString), "dd.MM.yyyy", { locale: ru });
};

const formatTime = (dateString: string): string => {
  return format(new Date(dateString), "HH:mm", { locale: ru });
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
</script>

<style scoped>
.installation-card {
  cursor: pointer;
  transition: all 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.installation-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Статусы */
.status-planned {
  border-left: 4px solid rgb(var(--v-theme-info));
}

.status-in_progress {
  border-left: 4px solid rgb(var(--v-theme-warning));
  background: rgba(var(--v-theme-warning), 0.05);
}

.status-completed {
  border-left: 4px solid rgb(var(--v-theme-success));
  background: rgba(var(--v-theme-success), 0.05);
}

.status-cancelled {
  border-left: 4px solid rgb(var(--v-theme-error));
  background: rgba(var(--v-theme-error), 0.05);
  opacity: 0.8;
}

/* Приоритеты */
.priority-urgent {
  box-shadow: 0 0 0 2px rgba(var(--v-theme-error), 0.3);
}

.priority-high {
  box-shadow: 0 0 0 1px rgba(var(--v-theme-warning), 0.5);
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

.installation-type {
  font-weight: 600;
  font-size: 1rem;
}

/* Содержимое */
.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0;
}

.object-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.object-info {
  flex: 1;
  min-width: 0;
}

.object-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: rgb(var(--v-theme-on-surface));
}

.object-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.datetime-info {
  text-align: right;
  flex-shrink: 0;
}

.datetime-info .date {
  font-weight: 600;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface));
}

.datetime-info .time {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 2px;
}

.details-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.installer-info,
.address-info {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.address-info {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-section {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.duration-info,
.cost-info,
.equipment-info {
  display: flex;
  align-items: center;
}

.description-section {
  margin-top: 8px;
}

.description {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
  .object-section {
    flex-direction: column;
    gap: 8px;
  }
  
  .datetime-info {
    text-align: left;
  }
  
  .meta-section {
    flex-direction: column;
    gap: 8px;
  }
  
  .card-actions {
    justify-content: stretch;
  }
  
  .card-actions .v-btn {
    flex: 1;
  }
}
</style>
