<template>
  <div
    class="installation-event"
    :class="[
      `status-${installation.status}`,
      `priority-${installation.priority}`,
      { compact, draggable }
    ]"
    :draggable="draggable"
    @click.stop="$emit('click', installation)"
    @dragstart="$emit('dragstart', $event)"
  >
    <!-- Индикатор статуса -->
    <div class="status-indicator" :style="{ backgroundColor: statusColor }" />
    
    <!-- Содержимое события -->
    <div class="event-content">
      <div class="event-header">
        <div class="event-title">
          <v-icon :icon="typeIcon" size="small" class="mr-1" />
          {{ installation.type }}
        </div>
        
        <div v-if="!compact" class="event-time">
          {{ formatTime(installation.scheduled_at) }}
        </div>
      </div>
      
      <div class="event-details">
        <div class="object-info">
          <span class="object-name">{{ installation.object.name }}</span>
          <v-chip
            v-if="installation.priority !== 'normal'"
            :color="priorityColor"
            size="x-small"
            variant="flat"
            class="ml-1"
          >
            {{ priorityLabel }}
          </v-chip>
        </div>
        
        <div v-if="!compact" class="installer-info">
          <v-icon icon="mdi-account-hard-hat" size="x-small" class="mr-1" />
          {{ installation.installer.first_name }} {{ installation.installer.last_name }}
        </div>
        
        <div v-if="!compact && installation.address" class="address-info">
          <v-icon icon="mdi-map-marker" size="x-small" class="mr-1" />
          {{ installation.address }}
        </div>
      </div>
      
      <!-- Действия -->
      <div v-if="!compact" class="event-actions">
        <v-btn
          v-if="installation.status === 'planned'"
          icon="mdi-play"
          size="x-small"
          variant="text"
          color="success"
          @click.stop="$emit('start', installation)"
        />
        
        <v-btn
          v-if="installation.status === 'in_progress'"
          icon="mdi-check"
          size="x-small"
          variant="text"
          color="primary"
          @click.stop="$emit('complete', installation)"
        />
        
        <v-btn
          icon="mdi-pencil"
          size="x-small"
          variant="text"
          @click.stop="$emit('edit', installation)"
        />
        
        <v-btn
          v-if="installation.status !== 'completed'"
          icon="mdi-close"
          size="x-small"
          variant="text"
          color="error"
          @click.stop="$emit('cancel', installation)"
        />
      </div>
    </div>
    
    <!-- Индикатор перетаскивания -->
    <div v-if="draggable" class="drag-handle">
      <v-icon icon="mdi-drag-vertical" size="x-small" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { InstallationWithRelations } from "@/types/installations";

interface Props {
  installation: InstallationWithRelations;
  compact?: boolean;
  draggable?: boolean;
}

interface Emits {
  (e: "click", installation: InstallationWithRelations): void;
  (e: "dragstart", event: DragEvent): void;
  (e: "start", installation: InstallationWithRelations): void;
  (e: "complete", installation: InstallationWithRelations): void;
  (e: "edit", installation: InstallationWithRelations): void;
  (e: "cancel", installation: InstallationWithRelations): void;
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  draggable: false,
});

const emit = defineEmits<Emits>();

// Цвет статуса
const statusColor = computed(() => {
  switch (props.installation.status) {
    case "planned":
      return "#2196F3"; // blue
    case "in_progress":
      return "#FF9800"; // orange
    case "completed":
      return "#4CAF50"; // green
    case "cancelled":
      return "#F44336"; // red
    default:
      return "#9E9E9E"; // grey
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
    default:
      return "Обычный";
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

// Форматирование времени
const formatTime = (dateString: string): string => {
  return format(new Date(dateString), "HH:mm", { locale: ru });
};
</script>

<style scoped>
.installation-event {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  min-height: 60px;
  display: flex;
  align-items: stretch;
}

.installation-event:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.installation-event.compact {
  min-height: 32px;
  padding: 4px 6px;
}

.installation-event.draggable {
  cursor: grab;
}

.installation-event.draggable:active {
  cursor: grabbing;
}

/* Индикатор статуса */
.status-indicator {
  width: 4px;
  margin-right: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.compact .status-indicator {
  width: 3px;
  margin-right: 6px;
}

/* Содержимое события */
.event-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.event-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.event-title {
  font-weight: 600;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  color: rgb(var(--v-theme-on-surface));
}

.compact .event-title {
  font-size: 0.75rem;
}

.event-time {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
  flex-shrink: 0;
}

.event-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.object-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.object-name {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
  font-weight: 500;
}

.compact .object-name {
  font-size: 0.625rem;
}

.installer-info,
.address-info {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
  display: flex;
  align-items: center;
  opacity: 0.8;
}

.address-info {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Действия */
.event-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.installation-event:hover .event-actions {
  opacity: 1;
}

/* Индикатор перетаскивания */
.drag-handle {
  display: flex;
  align-items: center;
  padding: 0 4px;
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: 0.5;
  cursor: grab;
}

.installation-event:hover .drag-handle {
  opacity: 1;
}

/* Статусы */
.status-planned {
  border-left: 4px solid #2196F3;
}

.status-in_progress {
  border-left: 4px solid #FF9800;
  background: rgba(255, 152, 0, 0.05);
}

.status-completed {
  border-left: 4px solid #4CAF50;
  background: rgba(76, 175, 80, 0.05);
}

.status-cancelled {
  border-left: 4px solid #F44336;
  background: rgba(244, 67, 54, 0.05);
  opacity: 0.7;
}

/* Приоритеты */
.priority-urgent {
  box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.3);
}

.priority-high {
  box-shadow: 0 0 0 1px rgba(255, 152, 0, 0.5);
}

.priority-low {
  opacity: 0.8;
}

/* Компактный режим */
.compact .event-content {
  gap: 2px;
}

.compact .event-details {
  gap: 1px;
}

.compact .event-actions {
  display: none;
}

/* Адаптивность */
@media (max-width: 768px) {
  .installation-event {
    padding: 6px;
    min-height: 50px;
  }
  
  .event-title {
    font-size: 0.75rem;
  }
  
  .event-time {
    font-size: 0.625rem;
  }
  
  .object-name,
  .installer-info,
  .address-info {
    font-size: 0.625rem;
  }
  
  .event-actions {
    opacity: 1;
  }
}
</style>
