<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="800px">
    <v-card class="installer-schedule-dialog" v-if="installer">
      <v-card-title class="dialog-title">
        <v-icon icon="mdi-calendar-account" class="title-icon" />
        Расписание монтажника: {{ installer.first_name }} {{ installer.last_name }}
      </v-card-title>

      <v-card-text class="dialog-content">
        <!-- Фильтры периода -->
        <div class="period-controls">
          <div class="period-buttons">
            <AppleButton
              v-for="period in periodOptions"
              :key="period.value"
              :variant="selectedPeriod === period.value ? 'primary' : 'secondary'"
              size="small"
              @click="selectPeriod(period.value)"
            >
              {{ period.label }}
            </AppleButton>
          </div>
          
          <div class="custom-period" v-if="selectedPeriod === 'custom'">
            <v-text-field
              v-model="customDateFrom"
              label="С"
              type="date"
              variant="outlined"
              density="compact"
              class="date-field"
            />
            <v-text-field
              v-model="customDateTo"
              label="По"
              type="date"
              variant="outlined"
              density="compact"
              class="date-field"
            />
            <AppleButton @click="loadSchedule" size="small">
              Применить
            </AppleButton>
          </div>
        </div>

        <!-- Информация о монтажнике -->
        <div class="installer-info-section">
          <div class="installer-summary">
            <div class="summary-item">
              <v-icon icon="mdi-account-hard-hat" class="summary-icon" />
              <div>
                <div class="summary-label">Тип</div>
                <div class="summary-value">{{ getTypeLabel(installer.type) }}</div>
              </div>
            </div>
            
            <div class="summary-item">
              <v-icon icon="mdi-clock" class="summary-icon" />
              <div>
                <div class="summary-label">Рабочие часы</div>
                <div class="summary-value">{{ installer.working_hours_start }} - {{ installer.working_hours_end }}</div>
              </div>
            </div>
            
            <div class="summary-item">
              <v-icon icon="mdi-calendar-week" class="summary-icon" />
              <div>
                <div class="summary-label">Рабочие дни</div>
                <div class="summary-value">{{ getWorkingDaysText(installer.working_days) }}</div>
              </div>
            </div>
            
            <div class="summary-item">
              <v-icon icon="mdi-speedometer" class="summary-icon" />
              <div>
                <div class="summary-label">Макс. монтажей в день</div>
                <div class="summary-value">{{ installer.max_daily_installations }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Календарь расписания -->
        <div class="schedule-section">
          <h3 class="section-title">
            Расписание на {{ formatPeriod(dateFrom, dateTo) }}
          </h3>
          
          <div v-if="loading" class="loading-section">
            <v-progress-circular indeterminate color="primary" />
            <span>Загрузка расписания...</span>
          </div>
          
          <div v-else-if="schedule" class="schedule-content">
            <!-- Статистика периода -->
            <div class="period-stats">
              <div class="stat-item">
                <div class="stat-value">{{ schedule.items.length }}</div>
                <div class="stat-label">Запланировано</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ Math.round(schedule.total_duration / 60) }}ч</div>
                <div class="stat-label">Общее время</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ schedule.available_slots.length }}</div>
                <div class="stat-label">Свободных слотов</div>
              </div>
            </div>

            <!-- Список монтажей -->
            <div class="schedule-list">
              <div v-if="schedule.items.length === 0" class="empty-schedule">
                <v-icon icon="mdi-calendar-blank" size="48" class="empty-icon" />
                <div class="empty-text">Нет запланированных монтажей на выбранный период</div>
              </div>
              
              <div v-else>
                <div
                  v-for="item in schedule.items"
                  :key="item.installation_id"
                  class="schedule-item"
                >
                  <div class="schedule-time">
                    <div class="schedule-date">{{ formatDate(item.scheduled_at) }}</div>
                    <div class="schedule-hour">{{ formatTime(item.scheduled_at) }}</div>
                    <div class="schedule-duration">{{ item.estimated_duration }}мин</div>
                  </div>
                  
                  <div class="schedule-details">
                    <div class="schedule-title">
                      <v-chip
                        :color="getPriorityColor(item.priority)"
                        size="small"
                        variant="tonal"
                        class="priority-chip"
                      >
                        {{ getPriorityLabel(item.priority) }}
                      </v-chip>
                      <span class="installation-type">{{ item.type }}</span>
                    </div>
                    
                    <div class="schedule-object">
                      <v-icon icon="mdi-router" size="small" />
                      {{ item.object_name }}
                    </div>
                    
                    <div class="schedule-client">
                      <v-icon icon="mdi-account" size="small" />
                      {{ item.client_contact }}
                    </div>
                    
                    <div class="schedule-address">
                      <v-icon icon="mdi-map-marker" size="small" />
                      {{ item.address }}
                    </div>
                  </div>
                  
                  <div class="schedule-status">
                    <v-chip
                      :color="getInstallationStatusColor(item.status)"
                      size="small"
                      variant="tonal"
                    >
                      {{ getInstallationStatusLabel(item.status) }}
                    </v-chip>
                  </div>
                </div>
              </div>
            </div>

            <!-- Свободные слоты -->
            <div v-if="schedule.available_slots.length > 0" class="available-slots">
              <h4 class="slots-title">Свободные временные слоты</h4>
              <div class="slots-list">
                <v-chip
                  v-for="(slot, index) in schedule.available_slots"
                  :key="index"
                  size="small"
                  variant="outlined"
                  color="success"
                  class="slot-chip"
                >
                  {{ formatTime(slot.start) }} - {{ formatTime(slot.end) }}
                </v-chip>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="dialog-actions">
        <v-spacer />
        <AppleButton variant="secondary" @click="$emit('update:modelValue', false)">
          Закрыть
        </AppleButton>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import AppleButton from '@/components/Apple/AppleButton.vue';
import { installationsService } from '@/services/installationsService';
import type {
    InstallationPriority,
    InstallationStatus,
    InstallerSchedule,
    InstallerType,
    InstallerWithRelations
} from '@/types/installations';
import { useErrorHandler } from '@/utils/errorHandler';
import { computed, ref, watch } from 'vue';

// Props
interface Props {
  modelValue: boolean;
  installer?: InstallerWithRelations | null;
}

const props = withDefaults(defineProps<Props>(), {
  installer: null
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

// Состояние
const loading = ref(false);
const schedule = ref<InstallerSchedule | null>(null);
const selectedPeriod = ref('week');
const customDateFrom = ref('');
const customDateTo = ref('');

// Обработчик ошибок
const { handleError } = useErrorHandler();

// Опции периодов
const periodOptions = [
  { label: 'Сегодня', value: 'today' },
  { label: 'Неделя', value: 'week' },
  { label: 'Месяц', value: 'month' },
  { label: 'Произвольный', value: 'custom' }
];

// Вычисляемые даты
const dateFrom = computed(() => {
  if (selectedPeriod.value === 'custom') {
    return customDateFrom.value;
  }
  
  const now = new Date();
  switch (selectedPeriod.value) {
    case 'today':
      return now.toISOString().split('T')[0];
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1); // Понедельник
      return weekStart.toISOString().split('T')[0];
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    default:
      return now.toISOString().split('T')[0];
  }
});

const dateTo = computed(() => {
  if (selectedPeriod.value === 'custom') {
    return customDateTo.value;
  }
  
  const now = new Date();
  switch (selectedPeriod.value) {
    case 'today':
      return now.toISOString().split('T')[0];
    case 'week':
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - now.getDay() + 7); // Воскресенье
      return weekEnd.toISOString().split('T')[0];
    case 'month':
      return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    default:
      return now.toISOString().split('T')[0];
  }
});

// Загрузка расписания
const loadSchedule = async () => {
  if (!props.installer || !dateFrom.value || !dateTo.value) return;

  loading.value = true;
  try {
    schedule.value = await installationsService.getInstallerSchedule(
      props.installer.id,
      dateFrom.value,
      dateTo.value
    );
  } catch (error) {
    handleError(error, 'Ошибка загрузки расписания');
    // Создаем моковое расписание для демо
    schedule.value = {
      installer: props.installer,
      items: [],
      total_duration: 0,
      available_slots: [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '17:00' }
      ]
    };
  } finally {
    loading.value = false;
  }
};

// Обработчики
const selectPeriod = (period: string) => {
  selectedPeriod.value = period;
  if (period !== 'custom') {
    loadSchedule();
  }
};

// Утилиты
const getTypeLabel = (type: InstallerType) => {
  const labels = {
    staff: 'Штатный',
    contractor: 'Подрядчик',
    partner: 'Партнер'
  };
  return labels[type] || type;
};

const getWorkingDaysText = (days: number[]) => {
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  return days.map(day => dayNames[day - 1]).join(', ');
};

const getPriorityColor = (priority: InstallationPriority) => {
  const colors = {
    low: 'success',
    normal: 'info',
    high: 'warning',
    urgent: 'error'
  };
  return colors[priority] || 'grey';
};

const getPriorityLabel = (priority: InstallationPriority) => {
  const labels = {
    low: 'Низкий',
    normal: 'Обычный',
    high: 'Высокий',
    urgent: 'Срочный'
  };
  return labels[priority] || priority;
};

const getInstallationStatusColor = (status: InstallationStatus) => {
  const colors = {
    planned: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'error'
  };
  return colors[status] || 'grey';
};

const getInstallationStatusLabel = (status: InstallationStatus) => {
  const labels = {
    planned: 'Запланирован',
    in_progress: 'В работе',
    completed: 'Завершен',
    cancelled: 'Отменен'
  };
  return labels[status] || status;
};

const formatPeriod = (from: string, to: string) => {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  
  if (from === to) {
    return fromDate.toLocaleDateString('ru-RU');
  }
  
  return `${fromDate.toLocaleDateString('ru-RU')} - ${toDate.toLocaleDateString('ru-RU')}`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Отслеживание изменений
watch(() => props.installer, (newInstaller) => {
  if (newInstaller) {
    loadSchedule();
  } else {
    schedule.value = null;
  }
}, { immediate: true });

watch([dateFrom, dateTo], () => {
  if (selectedPeriod.value !== 'custom') {
    loadSchedule();
  }
});
</script>

<style scoped>
.installer-schedule-dialog {
  border-radius: 16px;
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 24px 0;
  font-size: 18px;
  font-weight: 600;
}

.title-icon {
  color: rgb(var(--v-theme-primary));
}

.dialog-content {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.period-controls {
  margin-bottom: 24px;
}

.period-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.custom-period {
  display: flex;
  gap: 12px;
  align-items: center;
}

.date-field {
  width: 150px;
}

.installer-info-section {
  margin-bottom: 24px;
  padding: 16px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 12px;
}

.installer-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-icon {
  color: rgb(var(--v-theme-primary));
}

.summary-label {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.summary-value {
  font-size: 14px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.schedule-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: rgb(var(--v-theme-on-surface));
}

.loading-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 48px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.period-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  padding: 16px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 4px;
}

.schedule-list {
  margin-bottom: 24px;
}

.empty-schedule {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px;
  text-align: center;
}

.empty-icon {
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: 0.6;
}

.empty-text {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 16px;
}

.schedule-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  margin-bottom: 12px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: 12px;
  transition: all 0.2s ease;
}

.schedule-item:hover {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.1);
}

.schedule-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 80px;
  text-align: center;
}

.schedule-date {
  font-size: 12px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
}

.schedule-hour {
  font-size: 16px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.schedule-duration {
  font-size: 11px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.schedule-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.schedule-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.priority-chip {
  font-size: 10px;
}

.installation-type {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.schedule-object,
.schedule-client,
.schedule-address {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.schedule-status {
  display: flex;
  align-items: flex-start;
}

.available-slots {
  margin-top: 24px;
}

.slots-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: rgb(var(--v-theme-on-surface));
}

.slots-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.slot-chip {
  font-family: monospace;
  font-size: 11px;
}

.dialog-actions {
  padding: 0 24px 24px;
}

@media (max-width: 768px) {
  .installer-summary {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .period-buttons {
    flex-wrap: wrap;
  }

  .custom-period {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .date-field {
    width: 100%;
  }

  .period-stats {
    flex-direction: column;
    gap: 16px;
  }

  .schedule-item {
    flex-direction: column;
    gap: 12px;
  }

  .schedule-time {
    flex-direction: row;
    justify-content: space-between;
    min-width: unset;
  }
}
</style>
