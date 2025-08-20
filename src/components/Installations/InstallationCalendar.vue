<template>
  <div class="installation-calendar">
    <!-- Управление календарем -->
    <AppleCard variant="outlined" class="calendar-controls mb-4">
      <template #header>
        <div class="controls-header">
          <v-icon icon="mdi-calendar" class="mr-2" />
          Календарь монтажей
          <v-spacer />
          <div class="view-controls">
            <v-btn-toggle
              v-model="viewType"
              variant="outlined"
              density="compact"
              mandatory
            >
              <v-btn value="day" size="small">
                <v-icon>mdi-calendar-today</v-icon>
                День
              </v-btn>
              <v-btn value="week" size="small">
                <v-icon>mdi-calendar-week</v-icon>
                Неделя
              </v-btn>
              <v-btn value="month" size="small">
                <v-icon>mdi-calendar-month</v-icon>
                Месяц
              </v-btn>
            </v-btn-toggle>
          </div>
        </div>
      </template>
      
      <div class="controls-content">
        <v-row>
          <v-col cols="12" md="4">
            <v-date-picker
              v-model="selectedDate"
              @update:model-value="handleDateChange"
              show-adjacent-months
              elevation="0"
              hide-header
              width="100%"
            />
          </v-col>
          
          <v-col cols="12" md="8">
            <div class="navigation-section">
              <div class="date-navigation">
                <AppleButton
                  variant="secondary"
                  prepend-icon="mdi-chevron-left"
                  @click="navigateDate(-1)"
                  size="small"
                >
                  Назад
                </AppleButton>
                
                <div class="current-period">
                  <h3>{{ formattedCurrentPeriod }}</h3>
                </div>
                
                <AppleButton
                  variant="secondary"
                  append-icon="mdi-chevron-right"
                  @click="navigateDate(1)"
                  size="small"
                >
                  Вперед
                </AppleButton>
              </div>
              
              <div class="filters-section">
                <v-select
                  v-model="selectedInstallers"
                  :items="installerOptions"
                  label="Фильтр по монтажникам"
                  multiple
                  chips
                  clearable
                  density="compact"
                  variant="outlined"
                  class="installer-filter"
                />
              </div>
            </div>
          </v-col>
        </v-row>
      </div>
    </AppleCard>

    <!-- Основной календарь -->
    <div class="calendar-container" :class="`view-${viewType}`">
      <div v-if="loading" class="calendar-loading">
        <v-progress-circular indeterminate />
        <p class="mt-4">Загрузка календаря...</p>
      </div>
      
      <div v-else class="calendar-grid">
        <!-- Заголовки дней недели для недельного/дневного вида -->
        <div v-if="viewType !== 'month'" class="calendar-header">
          <div class="time-column">Время</div>
          <div
            v-for="day in visibleDays"
            :key="day.date"
            class="day-header"
            :class="{ 'today': isToday(day.date) }"
          >
            <div class="day-name">{{ day.dayName }}</div>
            <div class="day-date">{{ day.dayDate }}</div>
          </div>
        </div>

        <!-- Сетка времени для дневного/недельного вида -->
        <div v-if="viewType !== 'month'" class="time-grid">
          <div
            v-for="hour in timeSlots"
            :key="hour"
            class="time-row"
          >
            <div class="time-label">{{ formatTime(hour) }}</div>
            <div
              v-for="day in visibleDays"
              :key="`${day.date}-${hour}`"
              class="time-slot"
              :class="{ 'current-hour': isCurrentHour(day.date, hour) }"
              @click="handleSlotClick(day.date, hour)"
              @drop="handleDrop($event, day.date, hour)"
              @dragover.prevent
              @dragenter.prevent
            >
              <!-- События в этом временном слоте -->
              <InstallationEvent
                v-for="event in getEventsForSlot(day.date, hour)"
                :key="event.id"
                :installation="event"
                :draggable="true"
                @click="$emit('installation-click', event)"
                @dragstart="handleDragStart($event, event)"
                class="calendar-event"
              />
            </div>
          </div>
        </div>

        <!-- Месячный вид -->
        <div v-if="viewType === 'month'" class="month-grid">
          <div class="month-header">
            <div v-for="dayName in dayNames" :key="dayName" class="month-day-header">
              {{ dayName }}
            </div>
          </div>
          
          <div class="month-body">
                    <div
          v-for="(week, weekIndex) in monthWeeks"
          :key="weekIndex"
          class="month-week"
        >
              <div
                v-for="(day, dayIndex) in week"
                :key="`${weekIndex}-${dayIndex}`"
                class="month-day"
                :class="{
                  'today': isToday(day),
                  'other-month': !isSameMonth(day),
                  'has-events': getEventsForDay(day).length > 0
                }"
                @click="handleDayClick(day)"
                @drop="handleDrop($event, day)"
                @dragover.prevent
                @dragenter.prevent
              >
                <div class="day-number">{{ getDayNumber(day) }}</div>
                
                <div class="day-events">
                  <InstallationEvent
                    v-for="event in getEventsForDay(day).slice(0, 3)"
                    :key="event.id"
                    :installation="event"
                    :compact="true"
                    :draggable="true"
                    @click="$emit('installation-click', event)"
                    @dragstart="handleDragStart($event, event)"
                    class="month-event"
                  />
                  
                  <div
                    v-if="getEventsForDay(day).length > 3"
                    class="more-events"
                    @click="showMoreEvents(day)"
                  >
                    +{{ getEventsForDay(day).length - 3 }} еще
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Диалог "Еще события" для месячного вида -->
    <v-dialog v-model="showMoreDialog" max-width="600">
      <AppleCard>
        <template #header>
          <div class="more-events-header">
            <v-icon icon="mdi-calendar" class="mr-2" />
            События на {{ formatDate(moreEventsDate) }}
          </div>
        </template>
        
        <div class="more-events-list">
          <InstallationEvent
            v-for="event in moreEventsList"
            :key="event.id"
            :installation="event"
            @click="$emit('installation-click', event)"
            class="mb-2"
          />
        </div>
        
        <template #actions>
          <AppleButton @click="showMoreDialog = false">
            Закрыть
          </AppleButton>
        </template>
      </AppleCard>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import AppleButton from "@/components/Apple/AppleButton.vue";
import AppleCard from "@/components/Apple/AppleCard.vue";
import type { InstallationWithRelations, InstallerWithRelations } from "@/types/installations";
import {
    addDays,
    addMonths,
    addWeeks,
    endOfMonth,
    endOfWeek,
    format,
    getDate,
    getHours,
    isSameDay, isSameMonth as isSameMonthFn,
    isToday as isTodayFn,
    startOfMonth,
    startOfWeek
} from "date-fns";
import { ru } from "date-fns/locale";
import { computed, onMounted, ref, watch } from "vue";
import InstallationEvent from "./InstallationEvent.vue";

interface Props {
  installations: InstallationWithRelations[];
  installers: InstallerWithRelations[];
  loading?: boolean;
}

interface Emits {
  (e: "installation-click", installation: InstallationWithRelations): void;
  (e: "date-click", date: string): void;
  (e: "installation-drop", installationId: number, newDate: string, installerId?: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();

// Состояние календаря
const viewType = ref<"day" | "week" | "month">("week");
const selectedDate = ref(new Date());
const selectedInstallers = ref<number[]>([]);
const draggedInstallation = ref<InstallationWithRelations | null>(null);

// Диалог "Еще события"
const showMoreDialog = ref(false);
const moreEventsDate = ref<Date>(new Date());
const moreEventsList = ref<InstallationWithRelations[]>([]);

// Временные слоты (для дневного и недельного вида)
const timeSlots = Array.from({ length: 24 }, (_, i) => i);

// Названия дней недели
const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

// Опции для фильтра монтажников
const installerOptions = computed(() => 
  props.installers.map(installer => ({
    title: `${installer.first_name} ${installer.last_name}`,
    value: installer.id,
  }))
);

// Отфильтрованные монтажи
const filteredInstallations = computed(() => {
  if (selectedInstallers.value.length === 0) {
    return props.installations;
  }
  return props.installations.filter(installation =>
    selectedInstallers.value.includes(installation.installer_id)
  );
});

// Видимые дни для текущего вида
const visibleDays = computed(() => {
  const current = selectedDate.value;
  
  switch (viewType.value) {
    case "day":
      return [{
        date: format(current, "yyyy-MM-dd"),
        dayName: format(current, "EEEE", { locale: ru }),
        dayDate: format(current, "d MMMM", { locale: ru }),
      }];
      
    case "week":
      const weekStart = startOfWeek(current, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => {
        const day = addDays(weekStart, i);
        return {
          date: format(day, "yyyy-MM-dd"),
          dayName: format(day, "EEE", { locale: ru }),
          dayDate: format(day, "d MMM", { locale: ru }),
        };
      });
      
    default:
      return [];
  }
});

// Недели месяца для месячного вида
const monthWeeks = computed(() => {
  if (viewType.value !== "month") return [];
  
  const monthStart = startOfMonth(selectedDate.value);
  const monthEnd = endOfMonth(selectedDate.value);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const weeks: Date[][] = [];
  let currentDate = calendarStart;
  
  while (currentDate <= calendarEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    weeks.push(week);
  }
  
  return weeks;
});

// Форматированный текущий период
const formattedCurrentPeriod = computed(() => {
  const current = selectedDate.value;
  
  switch (viewType.value) {
    case "day":
      return format(current, "d MMMM yyyy", { locale: ru });
    case "week":
      const weekStart = startOfWeek(current, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(current, { weekStartsOn: 1 });
      return `${format(weekStart, "d MMM", { locale: ru })} - ${format(weekEnd, "d MMM yyyy", { locale: ru })}`;
    case "month":
      return format(current, "MMMM yyyy", { locale: ru });
    default:
      return "";
  }
});

// Вспомогательные функции

const formatTime = (hour: number): string => {
  return `${hour.toString().padStart(2, "0")}:00`;
};

const formatDate = (date: Date): string => {
  return format(date, "d MMMM yyyy", { locale: ru });
};

const isToday = (date: string | Date): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return isTodayFn(dateObj);
};

const isSameMonth = (date: Date): boolean => {
  return isSameMonthFn(date, selectedDate.value);
};

const isCurrentHour = (date: string, hour: number): boolean => {
  const now = new Date();
  const slotDate = new Date(date);
  return isSameDay(slotDate, now) && getHours(now) === hour;
};

const getDayNumber = (date: Date): number => {
  return getDate(date);
};

// Функции для работы с событиями

const getEventsForSlot = (date: string, hour: number): InstallationWithRelations[] => {
  return filteredInstallations.value.filter(installation => {
    const installationDate = new Date(installation.scheduled_at);
    const installationDateStr = format(installationDate, "yyyy-MM-dd");
    const installationHour = getHours(installationDate);
    
    return installationDateStr === date && installationHour === hour;
  });
};

const getEventsForDay = (date: Date): InstallationWithRelations[] => {
  const dateStr = format(date, "yyyy-MM-dd");
  return filteredInstallations.value.filter(installation => {
    const installationDate = new Date(installation.scheduled_at);
    const installationDateStr = format(installationDate, "yyyy-MM-dd");
    return installationDateStr === dateStr;
  });
};

// Обработчики событий

const handleDateChange = (date: Date) => {
  selectedDate.value = date;
};

const navigateDate = (direction: number) => {
  const current = selectedDate.value;
  
  switch (viewType.value) {
    case "day":
      selectedDate.value = addDays(current, direction);
      break;
    case "week":
      selectedDate.value = addWeeks(current, direction);
      break;
    case "month":
      selectedDate.value = addMonths(current, direction);
      break;
  }
};

const handleSlotClick = (date: string, hour: number) => {
  const clickedDate = new Date(`${date}T${hour.toString().padStart(2, "0")}:00:00`);
  emit("date-click", clickedDate.toISOString());
};

const handleDayClick = (date: Date) => {
  emit("date-click", date.toISOString());
};

const handleDragStart = (event: DragEvent, installation: InstallationWithRelations) => {
  draggedInstallation.value = installation;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", installation.id.toString());
  }
};

const handleDrop = (event: DragEvent, date: string | Date, hour?: number) => {
  event.preventDefault();
  
  if (!draggedInstallation.value) return;
  
  let newDate: string;
  
  if (typeof date === "string") {
    // Для дневного/недельного вида
    const hourStr = hour !== undefined ? hour.toString().padStart(2, "0") : "09";
    newDate = `${date}T${hourStr}:00:00`;
  } else {
    // Для месячного вида - сохраняем время из оригинального монтажа
    const originalTime = new Date(draggedInstallation.value.scheduled_at);
    const newDateTime = new Date(date);
    newDateTime.setHours(originalTime.getHours(), originalTime.getMinutes());
    newDate = newDateTime.toISOString();
  }
  
  emit("installation-drop", draggedInstallation.value.id, newDate);
  draggedInstallation.value = null;
};

const showMoreEvents = (date: Date) => {
  moreEventsDate.value = date;
  moreEventsList.value = getEventsForDay(date);
  showMoreDialog.value = true;
};

// Автоматически обновляем календарь при изменении вида
watch(viewType, () => {
  // При смене вида можно добавить дополнительную логику
});

onMounted(() => {
  // Инициализация календаря
});
</script>

<style scoped>
.installation-calendar {
  width: 100%;
}

.calendar-controls {
  margin-bottom: 16px;
}

.controls-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.view-controls {
  margin-left: auto;
}

.controls-content {
  padding: 16px 0;
}

.navigation-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.date-navigation {
  display: flex;
  align-items: center;
  gap: 16px;
}

.current-period {
  flex: 1;
  text-align: center;
}

.current-period h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.filters-section {
  flex: 1;
}

.installer-filter {
  max-width: 400px;
}

.calendar-container {
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.calendar-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.calendar-grid {
  width: 100%;
}

/* Заголовок календаря */
.calendar-header {
  display: grid;
  grid-template-columns: 80px repeat(auto-fit, 1fr);
  border-bottom: 1px solid rgb(var(--v-theme-outline));
  background: rgb(var(--v-theme-surface-variant));
}

.view-week .calendar-header {
  grid-template-columns: 80px repeat(7, 1fr);
}

.view-day .calendar-header {
  grid-template-columns: 80px 1fr;
}

.time-column {
  padding: 12px 8px;
  font-weight: 600;
  text-align: center;
  border-right: 1px solid rgb(var(--v-theme-outline));
}

.day-header {
  padding: 12px 8px;
  text-align: center;
  border-right: 1px solid rgb(var(--v-theme-outline));
  transition: background-color 0.2s;
}

.day-header:last-child {
  border-right: none;
}

.day-header.today {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.day-name {
  font-weight: 600;
  font-size: 0.875rem;
}

.day-date {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 2px;
}

/* Сетка времени */
.time-grid {
  max-height: 600px;
  overflow-y: auto;
}

.time-row {
  display: grid;
  grid-template-columns: 80px repeat(auto-fit, 1fr);
  min-height: 60px;
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
}

.view-week .time-row {
  grid-template-columns: 80px repeat(7, 1fr);
}

.view-day .time-row {
  grid-template-columns: 80px 1fr;
}

.time-label {
  padding: 8px;
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
  border-right: 1px solid rgb(var(--v-theme-outline));
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.time-slot {
  border-right: 1px solid rgb(var(--v-theme-outline-variant));
  position: relative;
  min-height: 60px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.time-slot:last-child {
  border-right: none;
}

.time-slot:hover {
  background: rgb(var(--v-theme-surface-variant));
}

.time-slot.current-hour {
  background: rgba(var(--v-theme-primary), 0.1);
}

/* Месячный вид */
.month-grid {
  width: 100%;
}

.month-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: rgb(var(--v-theme-surface-variant));
  border-bottom: 1px solid rgb(var(--v-theme-outline));
}

.month-day-header {
  padding: 12px 8px;
  text-align: center;
  font-weight: 600;
  font-size: 0.875rem;
  border-right: 1px solid rgb(var(--v-theme-outline));
}

.month-day-header:last-child {
  border-right: none;
}

.month-body {
  display: flex;
  flex-direction: column;
}

.month-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid rgb(var(--v-theme-outline));
}

.month-week:last-child {
  border-bottom: none;
}

.month-day {
  min-height: 120px;
  padding: 8px;
  border-right: 1px solid rgb(var(--v-theme-outline-variant));
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.month-day:last-child {
  border-right: none;
}

.month-day:hover {
  background: rgb(var(--v-theme-surface-variant));
}

.month-day.today {
  background: rgba(var(--v-theme-primary), 0.1);
}

.month-day.other-month {
  opacity: 0.5;
}

.month-day.has-events {
  background: rgba(var(--v-theme-info), 0.05);
}

.day-number {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 4px;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.month-event {
  font-size: 0.75rem;
}

.more-events {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  background: rgba(var(--v-theme-primary), 0.1);
  text-align: center;
  margin-top: 2px;
}

.more-events:hover {
  background: rgba(var(--v-theme-primary), 0.2);
}

/* События календаря */
.calendar-event {
  margin: 2px;
  position: relative;
  z-index: 1;
}

/* Диалог "Еще события" */
.more-events-header {
  display: flex;
  align-items: center;
  font-weight: 600;
}

.more-events-list {
  padding: 16px 0;
  max-height: 400px;
  overflow-y: auto;
}

/* Адаптивность */
@media (max-width: 768px) {
  .controls-content .v-row {
    flex-direction: column;
  }
  
  .date-navigation {
    flex-direction: column;
    gap: 8px;
  }
  
  .current-period h3 {
    font-size: 1rem;
  }
  
  .calendar-header {
    grid-template-columns: 60px repeat(auto-fit, 1fr);
  }
  
  .time-row {
    grid-template-columns: 60px repeat(auto-fit, 1fr);
  }
  
  .time-column {
    padding: 8px 4px;
    font-size: 0.75rem;
  }
  
  .day-header {
    padding: 8px 4px;
  }
  
  .day-name {
    font-size: 0.75rem;
  }
  
  .day-date {
    font-size: 0.625rem;
  }
  
  .month-day {
    min-height: 80px;
    padding: 4px;
  }
  
  .day-number {
    font-size: 0.75rem;
  }
}
</style>
