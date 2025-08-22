<template>
  <div class="locations-manager">
    <!-- Заголовок и действия -->
    <div class="manager-header">
      <div class="header-info">
        <v-icon icon="mdi-map-marker" size="24" class="header-icon" />
        <div>
          <h2 class="manager-title">Справочник локаций</h2>
          <p class="manager-subtitle">Управление городами и регионами для планирования монтажей</p>
        </div>
      </div>
      
      <div class="header-actions">
        <AppleButton variant="secondary" prepend-icon="mdi-download" @click="exportLocations">
          Экспорт
        </AppleButton>
        <AppleButton variant="secondary" prepend-icon="mdi-upload" @click="importLocations">
          Импорт
        </AppleButton>
        <AppleButton prepend-icon="mdi-plus" @click="openCreateDialog">
          Добавить локацию
        </AppleButton>
      </div>
    </div>

    <!-- Статистика -->
    <div class="stats-section">
      <div class="stats-grid">
        <AppleCard
          :title="stats.total.toString()"
          subtitle="Всего локаций"
          icon="mdi-map-marker"
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
          :title="Object.keys(stats.by_region).length.toString()"
          subtitle="Регионов"
          icon="mdi-earth"
          icon-color="info"
          variant="outlined"
          class="stat-card"
        />
        <AppleCard
          :title="stats.most_popular?.installations_count?.toString() || '0'"
          subtitle="Монтажей в топ городе"
          icon="mdi-trending-up"
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
          label="Поиск по названию города"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          clearable
          class="search-field"
        />
        
        <v-select
          v-model="selectedRegion"
          :items="regionOptions"
          label="Регион"
          variant="outlined"
          density="compact"
          clearable
          class="filter-select"
        />
        
        <v-select
          v-model="selectedCountry"
          :items="countryOptions"
          label="Страна"
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
          label="Статус"
          variant="outlined"
          density="compact"
          class="filter-select"
        />
      </div>
    </div>

    <!-- Таблица локаций -->
    <div class="table-section">
      <v-data-table
        :headers="headers"
        :items="filteredLocations"
        :loading="loading"
        :items-per-page="25"
        item-value="id"
        class="locations-table"
      >
        <!-- Город -->
        <template #item.city="{ item }">
          <div class="location-info">
            <div class="location-name">{{ item.city }}</div>
            <div class="location-region">{{ item.region }}, {{ item.country }}</div>
          </div>
        </template>

        <!-- Статус -->
        <template #item.is_active="{ item }">
          <v-chip
            :color="item.is_active ? 'success' : 'error'"
            size="small"
            variant="tonal"
          >
            {{ item.is_active ? 'Активна' : 'Неактивна' }}
          </v-chip>
        </template>

        <!-- Координаты -->
        <template #item.coordinates="{ item }">
          <div v-if="item.latitude && item.longitude" class="coordinates">
            {{ item.latitude.toFixed(4) }}, {{ item.longitude.toFixed(4) }}
          </div>
          <div v-else class="text-grey">Не указаны</div>
        </template>

        <!-- Часовой пояс -->
        <template #item.timezone="{ item }">
          <v-chip size="small" variant="outlined">
            {{ item.timezone }}
          </v-chip>
        </template>

        <!-- Дата создания -->
        <template #item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
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
              @click="toggleLocationStatus(item)"
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
    <LocationDialog
      v-model="showLocationDialog"
      :location="selectedLocation"
      @save="handleLocationSave"
    />

    <!-- Диалог просмотра -->
    <LocationViewDialog
      v-model="showViewDialog"
      :location="selectedLocation"
    />

    <!-- Диалог подтверждения удаления -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="Удаление локации"
      :message="`Вы уверены, что хотите удалить локацию '${selectedLocation?.city}'?`"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import LocationDialog from './LocationDialog.vue';
import LocationViewDialog from './LocationViewDialog.vue';
import ConfirmDialog from '@/components/Common/ConfirmDialog.vue';
import { installationsService } from '@/services/installationsService';
import type { LocationBase, LocationForm, LocationStats } from '@/types/installations';
import { useErrorHandler } from '@/utils/errorHandler';

// Состояние
const loading = ref(false);
const searchQuery = ref('');
const selectedRegion = ref<string | null>(null);
const selectedCountry = ref<string | null>(null);
const activeFilter = ref<boolean | null>(null);

// Данные
const locations = ref<LocationBase[]>([]);
const stats = ref<LocationStats>({
  total: 0,
  active: 0,
  by_region: {},
  most_popular: { id: 0, city: '', installations_count: 0 }
});

// Диалоги
const showLocationDialog = ref(false);
const showViewDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedLocation = ref<LocationBase | null>(null);

// Обработчик ошибок
const { handleError } = useErrorHandler();

// Заголовки таблицы
const headers = [
  { title: 'Город', key: 'city', sortable: true },
  { title: 'Статус', key: 'is_active', sortable: true },
  { title: 'Координаты', key: 'coordinates', sortable: false },
  { title: 'Часовой пояс', key: 'timezone', sortable: true },
  { title: 'Создана', key: 'created_at', sortable: true },
  { title: 'Действия', key: 'actions', sortable: false, width: 200 }
];

// Опции для фильтров
const regionOptions = computed(() => {
  const regions = [...new Set(locations.value.map(l => l.region))].sort();
  return regions.map(region => ({ title: region, value: region }));
});

const countryOptions = computed(() => {
  const countries = [...new Set(locations.value.map(l => l.country))].sort();
  return countries.map(country => ({ title: country, value: country }));
});

// Фильтрованные локации
const filteredLocations = computed(() => {
  let filtered = [...locations.value];

  // Поиск
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(location =>
      location.city.toLowerCase().includes(query) ||
      location.region.toLowerCase().includes(query) ||
      location.country.toLowerCase().includes(query)
    );
  }

  // Фильтр по региону
  if (selectedRegion.value) {
    filtered = filtered.filter(location => location.region === selectedRegion.value);
  }

  // Фильтр по стране
  if (selectedCountry.value) {
    filtered = filtered.filter(location => location.country === selectedCountry.value);
  }

  // Фильтр по активности
  if (activeFilter.value !== null) {
    filtered = filtered.filter(location => location.is_active === activeFilter.value);
  }

  return filtered;
});

// Загрузка данных
const loadData = async () => {
  loading.value = true;
  try {
    const [locationsRes, statsRes] = await Promise.all([
      installationsService.getLocations(1, 1000),
      installationsService.getLocationStats().catch(() => ({
        total: 0,
        active: 0,
        by_region: {},
        most_popular: { id: 0, city: '', installations_count: 0 }
      }))
    ]);

    locations.value = locationsRes.items;
    stats.value = statsRes;
  } catch (error) {
    handleError(error, 'Ошибка загрузки данных локаций');
  } finally {
    loading.value = false;
  }
};

// Обработчики диалогов
const openCreateDialog = () => {
  selectedLocation.value = null;
  showLocationDialog.value = true;
};

const openEditDialog = (location: LocationBase) => {
  selectedLocation.value = location;
  showLocationDialog.value = true;
};

const openViewDialog = (location: LocationBase) => {
  selectedLocation.value = location;
  showViewDialog.value = true;
};

const confirmDelete = (location: LocationBase) => {
  selectedLocation.value = location;
  showDeleteDialog.value = true;
};

// Обработчики действий
const handleLocationSave = async (data: LocationForm) => {
  try {
    if (selectedLocation.value) {
      await installationsService.updateLocation(selectedLocation.value.id, data);
    } else {
      await installationsService.createLocation(data);
    }
    showLocationDialog.value = false;
    await loadData();
  } catch (error) {
    handleError(error, 'Ошибка сохранения локации');
  }
};

const handleDelete = async () => {
  if (!selectedLocation.value) return;

  try {
    await installationsService.deleteLocation(selectedLocation.value.id);
    showDeleteDialog.value = false;
    await loadData();
  } catch (error) {
    handleError(error, 'Ошибка удаления локации');
  }
};

const toggleLocationStatus = async (location: LocationBase) => {
  try {
    await installationsService.updateLocation(location.id, {
      city: location.city,
      region: location.region,
      country: location.country,
      timezone: location.timezone,
      latitude: location.latitude,
      longitude: location.longitude,
      is_active: !location.is_active
    });
    await loadData();
  } catch (error) {
    handleError(error, 'Ошибка изменения статуса локации');
  }
};

const exportLocations = () => {
  // TODO: Реализовать экспорт локаций
  console.log('Экспорт локаций');
};

const importLocations = () => {
  // TODO: Реализовать импорт локаций
  console.log('Импорт локаций');
};

// Утилиты
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Загрузка данных при монтировании
onMounted(() => {
  loadData();
});

// Автоматическое обновление при изменении фильтров
watch([searchQuery, selectedRegion, selectedCountry, activeFilter], () => {
  // Фильтрация происходит автоматически через computed
}, { deep: true });
</script>

<style scoped>
.locations-manager {
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
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 16px;
  align-items: center;
}

.search-field {
  min-width: 300px;
}

.filter-select {
  min-width: 150px;
}

.table-section {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  overflow: hidden;
}

.locations-table {
  background: transparent;
}

.location-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.location-name {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.location-region {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.coordinates {
  font-family: monospace;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.actions-buttons {
  display: flex;
  gap: 4px;
}

@media (max-width: 768px) {
  .locations-manager {
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
