<template>
  <div class="installers-manager">
    <!-- Заголовок и действия -->
    <div class="manager-header">
      <div class="header-info">
        <v-icon icon="mdi-account-hard-hat" size="24" class="header-icon" />
        <div>
          <h2 class="manager-title">Справочник монтажников</h2>
          <p class="manager-subtitle">Управление монтажниками, их специализацией и расписанием работы</p>
        </div>
      </div>
      
      <div class="header-actions">
        <AppleButton variant="secondary" prepend-icon="mdi-download" @click="exportInstallers">
          Экспорт
        </AppleButton>
        <AppleButton variant="secondary" prepend-icon="mdi-upload" @click="importInstallers">
          Импорт
        </AppleButton>
        <AppleButton prepend-icon="mdi-plus" @click="openCreateDialog">
          Добавить монтажника
        </AppleButton>
      </div>
    </div>

    <!-- Статистика -->
    <div class="stats-section">
      <div class="stats-grid">
        <AppleCard
          :title="stats.total.toString()"
          subtitle="Всего монтажников"
          icon="mdi-account-hard-hat"
          icon-color="primary"
          variant="outlined"
          class="stat-card"
        />
        <AppleCard
          :title="stats.active.toString()"
          subtitle="Активных"
          icon="mdi-check-circle"
          icon-color="success"
          variant="outlined"
          class="stat-card"
        />
        <AppleCard
          :title="stats.total_installations?.toString() || '0'"
          subtitle="Всего монтажей"
          icon="mdi-tools"
          icon-color="info"
          variant="outlined"
          class="stat-card"
        />
        <AppleCard
          :title="stats.average_rating?.toFixed(1) || '0'"
          subtitle="Средний рейтинг"
          icon="mdi-star"
          icon-color="warning"
          variant="outlined"
          class="stat-card"
        />
      </div>
    </div>

    <!-- Фильтры и поиск -->
    <div class="filters-section">
      <div class="filters-row">
        <v-text-field
          v-model="searchQuery"
          label="Поиск по имени, телефону или email"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          clearable
          class="search-field"
        />
        
        <v-select
          v-model="selectedType"
          :items="typeOptions"
          label="Тип"
          variant="outlined"
          density="compact"
          clearable
          class="filter-select"
        />
        
        <v-select
          v-model="selectedSpecialization"
          :items="specializationOptions"
          label="Специализация"
          variant="outlined"
          density="compact"
          clearable
          class="filter-select"
        />
        
        <v-select
          v-model="selectedStatus"
          :items="statusOptions"
          label="Статус"
          variant="outlined"
          density="compact"
          clearable
          class="filter-select"
        />
        
        <v-select
          v-model="activeFilter"
          :items="[
            { title: 'Все', value: null },
            { title: 'Активные', value: true },
            { title: 'Неактивные', value: false }
          ]"
          label="Активность"
          variant="outlined"
          density="compact"
          class="filter-select"
        />
      </div>
    </div>

    <!-- Таблица монтажников -->
    <div class="table-section">
      <v-data-table
        :headers="headers"
        :items="filteredInstallers"
        :loading="loading"
        :items-per-page="25"
        item-value="id"
        class="installers-table"
      >
        <!-- ФИО и контакты -->
        <template #item.name="{ item }">
          <div class="installer-info">
            <div class="installer-name">
              {{ item.first_name }} {{ item.last_name }}
            </div>
            <div class="installer-contacts">
              <span class="contact-item">
                <v-icon icon="mdi-phone" size="12" />
                {{ item.phone }}
              </span>
              <span class="contact-item">
                <v-icon icon="mdi-email" size="12" />
                {{ item.email }}
              </span>
            </div>
          </div>
        </template>

        <!-- Тип -->
        <template #item.type="{ item }">
          <v-chip
            :color="getTypeColor(item.type)"
            size="small"
            variant="tonal"
          >
            {{ getTypeLabel(item.type) }}
          </v-chip>
        </template>

        <!-- Специализация -->
        <template #item.specialization="{ item }">
          <div class="specialization-chips">
            <v-chip
              v-for="spec in item.specialization.slice(0, 2)"
              :key="spec"
              size="small"
              variant="outlined"
              class="spec-chip"
            >
              {{ spec }}
            </v-chip>
            <v-chip
              v-if="item.specialization.length > 2"
              size="small"
              variant="outlined"
              class="spec-chip"
            >
              +{{ item.specialization.length - 2 }}
            </v-chip>
          </div>
        </template>

        <!-- Статус -->
        <template #item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
            variant="tonal"
          >
            {{ getStatusLabel(item.status) }}
          </v-chip>
        </template>

        <!-- Активность -->
        <template #item.is_active="{ item }">
          <v-chip
            :color="item.is_active ? 'success' : 'error'"
            size="small"
            variant="tonal"
          >
            {{ item.is_active ? 'Активен' : 'Неактивен' }}
          </v-chip>
        </template>

        <!-- Рабочие дни -->
        <template #item.working_schedule="{ item }">
          <div class="working-schedule">
            <div class="working-days">
              <span
                v-for="day in 7"
                :key="day"
                :class="['day-indicator', { active: item.working_days.includes(day) }]"
              >
                {{ getDayShort(day) }}
              </span>
            </div>
            <div class="working-hours">
              {{ item.working_hours_start }} - {{ item.working_hours_end }}
            </div>
          </div>
        </template>

        <!-- Загруженность -->
        <template #item.workload="{ item }">
          <div class="workload-info">
            <div class="workload-text">
              {{ item.current_installations_count || 0 }} / {{ item.max_daily_installations }}
            </div>
            <v-progress-linear
              :model-value="getWorkloadPercentage(item)"
              :color="getWorkloadColor(item)"
              height="4"
              rounded
            />
          </div>
        </template>

        <!-- Рейтинг -->
        <template #item.rating="{ item }">
          <div v-if="item.rating" class="rating-info">
            <v-rating
              :model-value="item.rating"
              readonly
              size="small"
              density="compact"
              half-increments
            />
            <span class="rating-value">{{ item.rating.toFixed(1) }}</span>
          </div>
          <span v-else class="text-grey">Нет оценок</span>
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="actions-buttons">
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="text"
              @click="openViewDialog(item)"
              title="Просмотр"
            />
            <v-btn
              icon="mdi-calendar"
              size="small"
              variant="text"
              @click="openScheduleDialog(item)"
              title="Расписание"
            />
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click="openEditDialog(item)"
              title="Редактировать"
            />
            <v-btn
              :icon="item.is_active ? 'mdi-pause' : 'mdi-play'"
              size="small"
              variant="text"
              @click="toggleInstallerStatus(item)"
              :title="item.is_active ? 'Деактивировать' : 'Активировать'"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="confirmDelete(item)"
              title="Удалить"
            />
          </div>
        </template>
      </v-data-table>
    </div>

    <!-- Диалог создания/редактирования -->
    <InstallerDialog
      v-model="showInstallerDialog"
      :installer="selectedInstaller"
      :locations="locations"
      @save="handleInstallerSave"
    />

    <!-- Диалог просмотра -->
    <InstallerViewDialog
      v-model="showViewDialog"
      :installer="selectedInstaller"
    />

    <!-- Диалог расписания -->
    <InstallerScheduleDialog
      v-model="showScheduleDialog"
      :installer="selectedInstaller"
    />

    <!-- Диалог подтверждения удаления -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="Удаление монтажника"
      :message="`Вы уверены, что хотите удалить монтажника '${selectedInstaller?.first_name} ${selectedInstaller?.last_name}'?`"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import ConfirmDialog from '@/components/Common/ConfirmDialog.vue';
import { installationsService } from '@/services/installationsService';
import type {
    InstallerForm,
    InstallerStats,
    InstallerStatus,
    InstallerType,
    InstallerWithRelations,
    LocationBase
} from '@/types/installations';
import { useErrorHandler } from '@/utils/errorHandler';
import { computed, onMounted, ref, watch } from 'vue';
import InstallerDialog from './InstallerDialog.vue';
import InstallerScheduleDialog from './InstallerScheduleDialog.vue';
import InstallerViewDialog from './InstallerViewDialog.vue';

// Состояние
const loading = ref(false);
const searchQuery = ref('');
const selectedType = ref<InstallerType | null>(null);
const selectedSpecialization = ref<string | null>(null);
const selectedStatus = ref<InstallerStatus | null>(null);
const activeFilter = ref<boolean | null>(null);

// Данные
const installers = ref<InstallerWithRelations[]>([]);
const locations = ref<LocationBase[]>([]);
const stats = ref<InstallerStats>({
  total: 0,
  active: 0,
  by_type: {} as Record<InstallerType, number>,
  by_status: {} as Record<InstallerStatus, number>,
  average_rating: 0,
  total_installations: 0,
  busiest_installer: { id: 0, name: '', installations_count: 0 }
});

// Диалоги
const showInstallerDialog = ref(false);
const showViewDialog = ref(false);
const showScheduleDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedInstaller = ref<InstallerWithRelations | null>(null);

// Обработчик ошибок
const { handleError } = useErrorHandler();

// Заголовки таблицы
const headers = [
  { title: 'ФИО и контакты', key: 'name', sortable: true },
  { title: 'Тип', key: 'type', sortable: true },
  { title: 'Специализация', key: 'specialization', sortable: false },
  { title: 'Статус', key: 'status', sortable: true },
  { title: 'Активность', key: 'is_active', sortable: true },
  { title: 'Расписание', key: 'working_schedule', sortable: false },
  { title: 'Загруженность', key: 'workload', sortable: false },
  { title: 'Рейтинг', key: 'rating', sortable: true },
  { title: 'Действия', key: 'actions', sortable: false, width: 250 }
];

// Опции для фильтров
const typeOptions = [
  { title: 'Штатный', value: 'staff' },
  { title: 'Подрядчик', value: 'contractor' },
  { title: 'Партнер', value: 'partner' }
];

const statusOptions = [
  { title: 'Доступен', value: 'available' },
  { title: 'Занят', value: 'busy' },
  { title: 'В отпуске', value: 'vacation' },
  { title: 'Болеет', value: 'sick' }
];

const specializationOptions = computed(() => {
  const specializations = new Set<string>();
  installers.value.forEach(installer => {
    installer.specialization.forEach(spec => specializations.add(spec));
  });
  return Array.from(specializations).sort().map(spec => ({ title: spec, value: spec }));
});

// Фильтрованные монтажники
const filteredInstallers = computed(() => {
  let filtered = [...installers.value];

  // Поиск
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(installer =>
      `${installer.first_name} ${installer.last_name}`.toLowerCase().includes(query) ||
      installer.phone.toLowerCase().includes(query) ||
      installer.email.toLowerCase().includes(query)
    );
  }

  // Фильтр по типу
  if (selectedType.value) {
    filtered = filtered.filter(installer => installer.type === selectedType.value);
  }

  // Фильтр по специализации
  if (selectedSpecialization.value) {
    filtered = filtered.filter(installer => 
      installer.specialization.includes(selectedSpecialization.value!)
    );
  }

  // Фильтр по статусу
  if (selectedStatus.value) {
    filtered = filtered.filter(installer => installer.status === selectedStatus.value);
  }

  // Фильтр по активности
  if (activeFilter.value !== null) {
    filtered = filtered.filter(installer => installer.is_active === activeFilter.value);
  }

  return filtered;
});

// Загрузка данных
const loadData = async () => {
  loading.value = true;
  try {
    const [installersRes, locationsRes, statsRes] = await Promise.all([
      installationsService.getInstallers(1, 1000),
      installationsService.getLocations(1, 1000),
      installationsService.getInstallerStats().catch(() => ({
        total: 0,
        active: 0,
        by_type: {} as Record<InstallerType, number>,
        by_status: {} as Record<InstallerStatus, number>,
        average_rating: 0,
        total_installations: 0,
        busiest_installer: { id: 0, name: '', installations_count: 0 }
      }))
    ]);

    installers.value = installersRes.items;
    locations.value = locationsRes.items;
    stats.value = statsRes;
  } catch (error) {
    handleError(error, 'Ошибка загрузки данных монтажников');
  } finally {
    loading.value = false;
  }
};

// Обработчики диалогов
const openCreateDialog = () => {
  selectedInstaller.value = null;
  showInstallerDialog.value = true;
};

const openEditDialog = (installer: InstallerWithRelations) => {
  selectedInstaller.value = installer;
  showInstallerDialog.value = true;
};

const openViewDialog = (installer: InstallerWithRelations) => {
  selectedInstaller.value = installer;
  showViewDialog.value = true;
};

const openScheduleDialog = (installer: InstallerWithRelations) => {
  selectedInstaller.value = installer;
  showScheduleDialog.value = true;
};

const confirmDelete = (installer: InstallerWithRelations) => {
  selectedInstaller.value = installer;
  showDeleteDialog.value = true;
};

// Обработчики действий
const handleInstallerSave = async (data: InstallerForm) => {
  try {
    if (selectedInstaller.value) {
      await installationsService.updateInstaller(selectedInstaller.value.id, data);
    } else {
      await installationsService.createInstaller(data);
    }
    showInstallerDialog.value = false;
    await loadData();
  } catch (error) {
    handleError(error, 'Ошибка сохранения монтажника');
  }
};

const handleDelete = async () => {
  if (!selectedInstaller.value) return;

  try {
    await installationsService.deleteInstaller(selectedInstaller.value.id);
    showDeleteDialog.value = false;
    await loadData();
  } catch (error) {
    handleError(error, 'Ошибка удаления монтажника');
  }
};

const toggleInstallerStatus = async (installer: InstallerWithRelations) => {
  try {
    if (installer.is_active) {
      await installationsService.deactivateInstaller(installer.id);
    } else {
      await installationsService.activateInstaller(installer.id);
    }
    await loadData();
  } catch (error) {
    handleError(error, 'Ошибка изменения статуса монтажника');
  }
};

const exportInstallers = () => {
  // TODO: Реализовать экспорт монтажников
  console.log('Экспорт монтажников');
};

const importInstallers = () => {
  // TODO: Реализовать импорт монтажников
  console.log('Импорт монтажников');
};

// Утилиты
const getTypeColor = (type: InstallerType) => {
  const colors = {
    staff: 'success',
    contractor: 'warning',
    partner: 'info'
  };
  return colors[type] || 'grey';
};

const getTypeLabel = (type: InstallerType) => {
  const labels = {
    staff: 'Штатный',
    contractor: 'Подрядчик',
    partner: 'Партнер'
  };
  return labels[type] || type;
};

const getStatusColor = (status: InstallerStatus) => {
  const colors = {
    available: 'success',
    busy: 'warning',
    vacation: 'info',
    sick: 'error'
  };
  return colors[status] || 'grey';
};

const getStatusLabel = (status: InstallerStatus) => {
  const labels = {
    available: 'Доступен',
    busy: 'Занят',
    vacation: 'В отпуске',
    sick: 'Болеет'
  };
  return labels[status] || status;
};

const getDayShort = (day: number) => {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  return days[day - 1] || '';
};

const getWorkloadPercentage = (installer: InstallerWithRelations) => {
  const current = installer.current_installations_count || 0;
  const max = installer.max_daily_installations || 1;
  return Math.min((current / max) * 100, 100);
};

const getWorkloadColor = (installer: InstallerWithRelations) => {
  const percentage = getWorkloadPercentage(installer);
  if (percentage >= 90) return 'error';
  if (percentage >= 70) return 'warning';
  return 'success';
};

// Загрузка данных при монтировании
onMounted(() => {
  loadData();
});

// Автоматическое обновление при изменении фильтров
watch([searchQuery, selectedType, selectedSpecialization, selectedStatus, activeFilter], () => {
  // Фильтрация происходит автоматически через computed
}, { deep: true });
</script>

<style scoped>
.installers-manager {
  padding: 24px;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  color: rgb(var(--v-theme-primary));
}

.manager-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
}

.manager-subtitle {
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 4px 0 0 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  min-height: 100px;
}

.filters-section {
  margin-bottom: 24px;
}

.filters-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 16px;
  align-items: center;
}

.search-field {
  min-width: 300px;
}

.filter-select {
  min-width: 120px;
}

.table-section {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  overflow: hidden;
}

.installers-table {
  background: transparent;
}

.installer-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.installer-name {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.installer-contacts {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.specialization-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.spec-chip {
  font-size: 10px;
}

.working-schedule {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.working-days {
  display: flex;
  gap: 2px;
}

.day-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 10px;
  border-radius: 4px;
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
}

.day-indicator.active {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.working-hours {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-family: monospace;
}

.workload-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 80px;
}

.workload-text {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  text-align: center;
}

.rating-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-value {
  font-size: 12px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
}

.actions-buttons {
  display: flex;
  gap: 4px;
}

@media (max-width: 768px) {
  .installers-manager {
    padding: 16px;
  }

  .manager-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: stretch;
  }

  .filters-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .search-field,
  .filter-select {
    min-width: unset;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
