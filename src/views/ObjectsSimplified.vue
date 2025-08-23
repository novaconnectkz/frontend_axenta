<template>
  <div class="objects-page">
    <!-- Заголовок страницы -->
    <div class="page-header">
      <div class="page-title-section">
        <v-icon icon="mdi-office-building" size="32" class="page-icon" />
        <div>
          <h1 class="page-title">Управление объектами</h1>
          <p class="page-subtitle">Мониторинг и управление объектами системы</p>
        </div>
      </div>
    </div>

    <!-- Поиск объектов -->
    <v-card class="search-card mb-4" variant="outlined" elevation="1">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-magnify" class="mr-2" color="primary" />
        <span>Поиск объектов</span>
        <v-spacer />
        <v-btn
          variant="text"
          size="small"
          prepend-icon="mdi-tune"
          @click="showAdvancedSearch = !showAdvancedSearch"
          :color="showAdvancedSearch ? 'primary' : 'default'"
        >
          {{ showAdvancedSearch ? 'Скрыть' : 'Расширенный' }}
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <!-- Основное поле поиска -->
        <v-text-field
          v-model="searchQuery"
          placeholder="Поиск по названию, IMEI, номеру телефона, адресу..."
          prepend-icon="mdi-magnify"
          clearable
          variant="outlined"
          density="comfortable"
          @input="handleSearch"
          class="mb-3"
        />
        
        <!-- Быстрые фильтры -->
        <div class="quick-filters mb-3">
          <div class="text-subtitle-2 mb-2">Быстрые фильтры:</div>
          <v-chip-group>
            <v-chip
              color="success"
              variant="outlined"
              size="small"
              clickable
              @click="filterActive(true)"
            >
              <v-icon icon="mdi-check-circle" size="16" class="mr-1" />
              Активные
            </v-chip>
            <v-chip
              color="warning"
              variant="outlined"
              size="small"
              clickable
              @click="filterActive(false)"
            >
              <v-icon icon="mdi-pause-circle" size="16" class="mr-1" />
              Неактивные
            </v-chip>
            <v-chip
              color="primary"
              variant="outlined"
              size="small"
              clickable
              @click="clearFilters"
            >
              <v-icon icon="mdi-refresh" size="16" class="mr-1" />
              Все
            </v-chip>
          </v-chip-group>
        </div>
        
        <!-- Расширенный поиск -->
        <v-expand-transition>
          <div v-if="showAdvancedSearch">
            <v-divider class="mb-3" />
            <div class="text-subtitle-2 mb-3">Расширенный поиск</div>
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="advancedFilters.accountName"
                  label="Название учетной записи"
                  placeholder="Поиск по учетной записи"
                  prepend-icon="mdi-account"
                  clearable
                  variant="outlined"
                  density="compact"
                  @input="handleAdvancedSearch"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="advancedFilters.creatorName"
                  label="Создатель (ФИО)"
                  placeholder="Поиск по создателю"
                  prepend-icon="mdi-account-circle"
                  clearable
                  variant="outlined"
                  density="compact"
                  @input="handleAdvancedSearch"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="advancedFilters.deviceTypeName"
                  label="Модель устройства"
                  placeholder="Поиск по модели"
                  prepend-icon="mdi-cellphone"
                  clearable
                  variant="outlined"
                  density="compact"
                  @input="handleAdvancedSearch"
                />
              </v-col>
            </v-row>
          </div>
        </v-expand-transition>
      </v-card-text>
    </v-card>

    <!-- Список объектов -->
    <v-card class="objects-table-card" variant="outlined">
      <template #title>
        <div class="table-header">
          <div class="table-title-section">
            <v-icon icon="mdi-format-list-bulleted" class="mr-2" />
            Список объектов
          </div>
          
          <!-- Кнопки массовых операций -->
          <div v-if="selectedObjects.length > 0" class="mass-actions">
            <v-chip
              :text="`Выбрано: ${selectedObjects.length}`"
              color="primary"
              variant="outlined"
              size="small"
              class="mr-2"
            />
            <v-btn
              variant="outlined"
              size="small"
              prepend-icon="mdi-check-circle"
              color="success"
              @click="setSelectedObjectsActivity(true)"
              class="mr-2"
            >
              Активировать
            </v-btn>
            <v-btn
              variant="outlined"
              size="small"
              prepend-icon="mdi-close-circle"
              color="error"
              @click="setSelectedObjectsActivity(false)"
              class="mr-2"
            >
              Деактивировать
            </v-btn>
            <v-btn
              variant="text"
              size="small"
              prepend-icon="mdi-close"
              @click="selectedObjects = []"
            >
              Отменить выбор
            </v-btn>
          </div>
        </div>
      </template>
      
      <!-- Таблица объектов -->
      <div class="table-container">
        <v-data-table
          :headers="tableHeaders"
          :items="objects"
          :loading="loading"
          :model-value="selectedObjects"
          @update:model-value="selectedObjects = $event"
          item-value="id"
          show-select
          class="objects-table"
          no-data-text="Объекты не найдены"
          loading-text="Загрузка объектов..."
        >
          <!-- Активность -->
          <template #item.is_active="{ item }">
            <v-tooltip :text="item.is_active ? 'Активный' : 'Неактивный'">
              <template #activator="{ props }">
                <v-icon
                  v-bind="props"
                  :icon="item.is_active ? 'mdi-circle' : 'mdi-circle'"
                  :color="item.is_active ? 'success' : 'error'"
                  size="16"
                  @click="toggleObjectActivity(item)"
                  style="cursor: pointer"
                />
              </template>
            </v-tooltip>
          </template>
          
          <!-- ID -->
          <template #item.id="{ item }">
            <span class="font-mono">{{ item.id }}</span>
          </template>
          
          <!-- Название учетной записи -->
          <template #item.accountName="{ item }">
            <span>{{ item.accountName || 'Не указано' }}</span>
          </template>
          
          <!-- Создатель -->
          <template #item.creatorName="{ item }">
            <span>{{ item.creatorName || 'Не указан' }}</span>
          </template>
          
          <!-- Модель устройства -->
          <template #item.deviceTypeName="{ item }">
            <span>{{ item.deviceTypeName || 'Не указана' }}</span>
          </template>
          
          <!-- Номера телефонов -->
          <template #item.phoneNumbers="{ item }">
            <div v-if="item.phoneNumbers && item.phoneNumbers.length > 0">
              <div v-for="phone in item.phoneNumbers" :key="phone" class="text-caption">
                {{ phone }}
              </div>
            </div>
            <span v-else class="text-medium-emphasis">Не указаны</span>
          </template>
          
          <!-- Дата создания -->
          <template #item.createdAt="{ item }">
            <div class="text-caption">
              {{ formatDate(item.createdAt || item.created_at) }}
            </div>
          </template>
          
          <!-- Дата последнего сообщения -->
          <template #item.lastMessageDatetime="{ item }">
            <div v-if="item.lastMessageDatetime" class="text-caption">
              {{ formatDate(item.lastMessageDatetime) }}
            </div>
            <div v-else class="text-caption text-medium-emphasis">
              Нет данных
            </div>
          </template>
          
          <!-- Уникальный ID -->
          <template #item.uniqueId="{ item }">
            <span class="font-mono">{{ item.uniqueId || item.external_id || 'Не указан' }}</span>
          </template>
        </v-data-table>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

// Reactive data
const loading = ref(false);
const selectedObjects = ref<number[]>([]);
const selectAll = ref(false);

// Поисковые переменные
const searchQuery = ref('');
const showAdvancedSearch = ref(false);
const advancedFilters = ref({
  accountName: '',
  creatorName: '',
  deviceTypeName: '',
});

// Фильтры
const activeFilter = ref<boolean | null>(null);

// Table headers
const tableHeaders = computed(() => [
  { title: 'Активность', value: 'is_active', sortable: false, width: 100 },
  { title: 'ID', value: 'id', sortable: true },
  { title: 'Название', value: 'name', sortable: true },
  { title: 'Название учетной записи', value: 'accountName', sortable: true },
  { title: 'Создатель (ФИО)', value: 'creatorName', sortable: true },
  { title: 'Модель устройства', value: 'deviceTypeName', sortable: true },
  { title: 'Номера телефонов', value: 'phoneNumbers', sortable: false },
  { title: 'Дата создания', value: 'createdAt', sortable: true },
  { title: 'Дата последнего сообщения', value: 'lastMessageDatetime', sortable: true },
  { title: 'Уникальный ID', value: 'uniqueId', sortable: true },
]);

// Mock data
const allObjects = ref([
  {
    id: 1,
    name: 'Тестовый объект 1',
    accountName: 'Тестовая учетная запись',
    creatorName: 'Иван Иванов',
    deviceTypeName: 'GPS Tracker v1.0',
    phoneNumbers: ['+7 900 123-45-67'],
    createdAt: '2024-01-15T10:30:00Z',
    created_at: '2024-01-15T10:30:00Z',
    lastMessageDatetime: '2024-01-20T15:45:00Z',
    uniqueId: 'UNIQUE-001',
    external_id: 'EXT-001',
    is_active: true
  },
  {
    id: 2,
    name: 'Тестовый объект 2',
    accountName: 'Другая учетная запись',
    creatorName: 'Петр Петров',
    deviceTypeName: 'GPS Tracker v2.0',
    phoneNumbers: ['+7 900 987-65-43', '+7 901 111-22-33'],
    createdAt: '2024-01-16T09:15:00Z',
    created_at: '2024-01-16T09:15:00Z',
    lastMessageDatetime: '2024-01-21T12:30:00Z',
    uniqueId: 'UNIQUE-002',
    external_id: 'EXT-002',
    is_active: false
  }
]);

// Фильтрованные объекты
const objects = computed(() => {
  let filtered = allObjects.value;
  
  // Фильтр по активности
  if (activeFilter.value !== null) {
    filtered = filtered.filter(obj => obj.is_active === activeFilter.value);
  }
  
  // Основной поиск
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(obj => 
      obj.name.toLowerCase().includes(query) ||
      obj.accountName?.toLowerCase().includes(query) ||
      obj.creatorName?.toLowerCase().includes(query) ||
      obj.deviceTypeName?.toLowerCase().includes(query) ||
      obj.uniqueId?.toLowerCase().includes(query) ||
      obj.phoneNumbers?.some(phone => phone.toLowerCase().includes(query))
    );
  }
  
  // Расширенный поиск
  if (advancedFilters.value.accountName) {
    const query = advancedFilters.value.accountName.toLowerCase();
    filtered = filtered.filter(obj => 
      obj.accountName?.toLowerCase().includes(query)
    );
  }
  
  if (advancedFilters.value.creatorName) {
    const query = advancedFilters.value.creatorName.toLowerCase();
    filtered = filtered.filter(obj => 
      obj.creatorName?.toLowerCase().includes(query)
    );
  }
  
  if (advancedFilters.value.deviceTypeName) {
    const query = advancedFilters.value.deviceTypeName.toLowerCase();
    filtered = filtered.filter(obj => 
      obj.deviceTypeName?.toLowerCase().includes(query)
    );
  }
  
  return filtered;
});

// Utility methods
const formatDate = (dateString: string): string => {
  if (!dateString) return 'Не указано';
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Функции для работы с активностью объектов
const toggleObjectActivity = (object: any) => {
  // Находим объект в массиве и переключаем его активность
  const index = allObjects.value.findIndex(obj => obj.id === object.id);
  if (index !== -1) {
    allObjects.value[index].is_active = !allObjects.value[index].is_active;
  }
};

// Методы поиска
const handleSearch = () => {
  // Поиск выполняется автоматически через computed свойство
  console.log('Поиск:', searchQuery.value);
};

const handleAdvancedSearch = () => {
  // Расширенный поиск выполняется автоматически через computed свойство
  console.log('Расширенный поиск:', advancedFilters.value);
};

const filterActive = (isActive: boolean) => {
  activeFilter.value = activeFilter.value === isActive ? null : isActive;
  console.log('Фильтр активности:', activeFilter.value);
};

const clearFilters = () => {
  searchQuery.value = '';
  activeFilter.value = null;
  advancedFilters.value = {
    accountName: '',
    creatorName: '',
    deviceTypeName: '',
  };
  console.log('Фильтры очищены');
};

const setSelectedObjectsActivity = (isActive: boolean) => {
  if (selectedObjects.value.length === 0) {
    return;
  }

  // Обновляем активность для всех выбранных объектов
  allObjects.value.forEach(obj => {
    if (selectedObjects.value.includes(obj.id)) {
      obj.is_active = isActive;
    }
  });
  
  // Очищаем выбор
  selectedObjects.value = [];
  
  // Здесь можно добавить вызов API для массового обновления
  console.log(`${isActive ? 'Активированы' : 'Деактивированы'} выбранные объекты`);
};
</script>

<style scoped>
.objects-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

/* Заголовок страницы */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0;
}

.page-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-icon {
  color: rgb(0, 122, 255);
}

.page-title {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: #1d1d1f;
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
  font-size: 1rem;
  color: #86868b;
  margin: 4px 0 0 0;
  line-height: 1.4;
}

/* Таблица */
.objects-table-card {
  margin: 0;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.table-title-section {
  display: flex;
  align-items: center;
}

.table-container {
  padding: 0;
}

.objects-table {
  background: transparent;
}

.font-mono {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.875rem;
}

/* Стили для массовых операций */
.mass-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

/* Адаптивность для массовых действий */
@media (max-width: 960px) {
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .mass-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
