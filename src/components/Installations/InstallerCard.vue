<template>
  <AppleCard
    class="installer-card"
    :class="[`type-${installer.type}`, `status-${installer.status}`, { inactive: !installer.is_active }]"
    variant="outlined"
    @click="$emit('click', installer)"
  >
    <!-- Заголовок карточки -->
    <template #header>
      <div class="card-header">
        <div class="header-left">
          <v-avatar size="40" class="mr-3">
            <v-icon icon="mdi-account-hard-hat" />
          </v-avatar>
          <div>
            <div class="installer-name">
              {{ installer.first_name }} {{ installer.last_name }}
            </div>
            <div class="installer-type">{{ getTypeLabel(installer.type) }}</div>
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
          
          <v-chip
            v-if="!installer.is_active"
            color="error"
            size="small"
            variant="outlined"
            class="ml-1"
          >
            Неактивен
          </v-chip>
        </div>
      </div>
    </template>

    <!-- Основное содержимое -->
    <div class="card-content">
      <!-- Контактная информация -->
      <div class="contact-section">
        <div class="contact-item">
          <v-icon icon="mdi-phone" size="small" class="mr-2" />
          <a :href="`tel:${installer.phone}`" class="contact-link">
            {{ installer.phone }}
          </a>
        </div>
        
        <div class="contact-item">
          <v-icon icon="mdi-email" size="small" class="mr-2" />
          <a :href="`mailto:${installer.email}`" class="contact-link">
            {{ installer.email }}
          </a>
        </div>
      </div>

      <!-- Специализация -->
      <div v-if="installer.specialization.length > 0" class="specialization-section">
        <h5 class="section-title">Специализация</h5>
        <div class="specialization-chips">
          <v-chip
            v-for="spec in installer.specialization"
            :key="spec"
            size="small"
            variant="outlined"
            class="specialization-chip"
          >
            {{ spec }}
          </v-chip>
        </div>
      </div>

      <!-- Рабочие параметры -->
      <div class="work-params-section">
        <h5 class="section-title">Рабочие параметры</h5>
        
        <div class="param-item">
          <span class="param-label">Макс. монтажей в день:</span>
          <span class="param-value">{{ installer.max_daily_installations }}</span>
        </div>
        
        <div class="param-item">
          <span class="param-label">Рабочие дни:</span>
          <span class="param-value">{{ formatWorkingDays(installer.working_days) }}</span>
        </div>
        
        <div class="param-item">
          <span class="param-label">Рабочие часы:</span>
          <span class="param-value">
            {{ installer.working_hours_start }} - {{ installer.working_hours_end }}
          </span>
        </div>
      </div>

      <!-- Локации -->
      <div v-if="installer.locations && installer.locations.length > 0" class="locations-section">
        <h5 class="section-title">Регионы работы</h5>
        <div class="locations-list">
          <v-chip
            v-for="location in installer.locations.slice(0, 3)"
            :key="location.id"
            size="small"
            variant="tonal"
            class="location-chip"
          >
            {{ location.city }}
          </v-chip>
          <v-chip
            v-if="installer.locations.length > 3"
            size="small"
            variant="text"
            class="more-locations"
          >
            +{{ installer.locations.length - 3 }} еще
          </v-chip>
        </div>
      </div>

      <!-- Статистика -->
      <div v-if="installer.total_installations_count || installer.rating" class="stats-section">
        <h5 class="section-title">Статистика</h5>
        
        <div class="stats-grid">
          <div v-if="installer.total_installations_count" class="stat-item">
            <v-icon icon="mdi-tools" size="small" class="stat-icon" />
            <div class="stat-info">
              <div class="stat-value">{{ installer.total_installations_count }}</div>
              <div class="stat-label">Монтажей</div>
            </div>
          </div>
          
          <div v-if="installer.current_installations_count" class="stat-item">
            <v-icon icon="mdi-calendar-today" size="small" class="stat-icon" />
            <div class="stat-info">
              <div class="stat-value">{{ installer.current_installations_count }}</div>
              <div class="stat-label">Текущих</div>
            </div>
          </div>
          
          <div v-if="installer.rating" class="stat-item">
            <v-icon icon="mdi-star" size="small" class="stat-icon" />
            <div class="stat-info">
              <div class="stat-value">{{ installer.rating.toFixed(1) }}</div>
              <div class="stat-label">Рейтинг</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Действия -->
    <template #actions>
      <div class="card-actions">
        <AppleButton
          variant="secondary"
          prepend-icon="mdi-pencil"
          size="small"
          @click.stop="$emit('edit', installer)"
        >
          Изменить
        </AppleButton>
        
        <AppleButton
          :variant="installer.is_active ? 'secondary' : 'primary'"
          :prepend-icon="installer.is_active ? 'mdi-pause' : 'mdi-play'"
          :color="installer.is_active ? 'warning' : 'success'"
          size="small"
          @click.stop="$emit('toggle', installer)"
        >
          {{ installer.is_active ? 'Деактивировать' : 'Активировать' }}
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
              prepend-icon="mdi-calendar"
              title="Просмотр расписания"
              @click="viewSchedule"
            />
            <v-list-item
              prepend-icon="mdi-chart-line"
              title="Статистика"
              @click="viewStats"
            />
            <v-divider />
            <v-list-item
              prepend-icon="mdi-delete"
              title="Удалить"
              @click="$emit('delete', installer)"
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
import type { InstallerWithRelations } from "@/types/installations";
import { computed } from "vue";

interface Props {
  installer: InstallerWithRelations;
}

interface Emits {
  (e: "click", installer: InstallerWithRelations): void;
  (e: "edit", installer: InstallerWithRelations): void;
  (e: "delete", installer: InstallerWithRelations): void;
  (e: "toggle", installer: InstallerWithRelations): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Цвет статуса
const statusColor = computed(() => {
  switch (props.installer.status) {
    case "available":
      return "success";
    case "busy":
      return "warning";
    case "vacation":
      return "info";
    case "sick":
      return "error";
    default:
      return "default";
  }
});

// Текст статуса
const statusLabel = computed(() => {
  switch (props.installer.status) {
    case "available":
      return "Доступен";
    case "busy":
      return "Занят";
    case "vacation":
      return "В отпуске";
    case "sick":
      return "На больничном";
    default:
      return props.installer.status;
  }
});

// Функции форматирования
const getTypeLabel = (type: string): string => {
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

const formatWorkingDays = (days: number[]): string => {
  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  return days.map(day => dayNames[day - 1]).join(", ");
};

// Обработчики действий
const viewSchedule = () => {
  // TODO: Реализовать просмотр расписания
  console.log("View schedule for installer:", props.installer.id);
};

const viewStats = () => {
  // TODO: Реализовать просмотр статистики
  console.log("View stats for installer:", props.installer.id);
};
</script>

<style scoped>
.installer-card {
  cursor: pointer;
  transition: all 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.installer-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.installer-card.inactive {
  opacity: 0.7;
}

/* Типы */
.type-staff {
  border-left: 4px solid rgb(var(--v-theme-primary));
}

.type-contractor {
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.type-partner {
  border-left: 4px solid rgb(var(--v-theme-info));
}

/* Статусы */
.status-available {
  background: rgba(var(--v-theme-success), 0.05);
}

.status-busy {
  background: rgba(var(--v-theme-warning), 0.05);
}

.status-vacation {
  background: rgba(var(--v-theme-info), 0.05);
}

.status-sick {
  background: rgba(var(--v-theme-error), 0.05);
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

.installer-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.installer-type {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.header-right {
  display: flex;
  align-items: center;
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

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: rgb(var(--v-theme-primary));
}

/* Контакты */
.contact-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.contact-link {
  color: inherit;
  text-decoration: none;
}

.contact-link:hover {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
}

/* Специализация */
.specialization-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.specialization-chip {
  font-size: 0.75rem;
}

/* Рабочие параметры */
.work-params-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.param-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.param-label {
  color: rgb(var(--v-theme-on-surface-variant));
}

.param-value {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

/* Локации */
.locations-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.location-chip {
  font-size: 0.75rem;
}

.more-locations {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-primary));
}

/* Статистика */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  color: rgb(var(--v-theme-primary));
}

.stat-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.stat-label {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
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
    justify-content: center;
  }
  
  .param-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .card-actions {
    justify-content: stretch;
  }
  
  .card-actions .v-btn:not(.v-btn--icon) {
    flex: 1;
  }
}
</style>
