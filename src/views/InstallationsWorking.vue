<template>
  <div class="installations-page">
    <!-- Заголовок страницы -->
    <div class="page-header mb-6">
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon icon="mdi-tools" size="32" class="mr-3" />
          <div>
            <h1 class="text-h4 font-weight-bold">Планирование монтажей</h1>
            <p class="text-subtitle-1 text-medium-emphasis ma-0">
              Управление монтажами, монтажниками и оборудованием
            </p>
          </div>
        </div>
        <div class="d-flex align-center ga-2">
          <v-btn
            color="primary"
            variant="outlined"
            prepend-icon="mdi-calendar-today"
            @click="goToToday"
          >
            Сегодня
          </v-btn>
          <v-btn
            color="success"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
          >
            Новый монтаж
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Уведомление о демо режиме -->
    <v-alert
      v-if="isDemoMode"
      type="info"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="hideDemoAlert = true"
      v-show="!hideDemoAlert"
    >
      <template #prepend>
        <v-icon>mdi-information</v-icon>
      </template>
      <div>
        <strong>Демо режим активен</strong>
        <p class="mb-0">Отображаются демонстрационные данные для ознакомления с интерфейсом управления монтажами.</p>
      </div>
    </v-alert>

    <!-- Статистика -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3" v-for="stat in stats" :key="stat.key">
        <v-card :color="stat.color" variant="tonal">
          <v-card-text class="text-center">
            <v-icon :icon="stat.icon" size="40" class="mb-2" />
            <div class="text-h4 font-weight-bold">{{ stat.value }}</div>
            <div class="text-subtitle-2">{{ stat.label }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Вкладки -->
    <v-card>
      <v-tabs v-model="activeTab" bg-color="primary" show-arrows>
        <v-tab value="list">
          <v-icon start icon="mdi-format-list-bulleted" />
          Список монтажей
        </v-tab>
        <v-tab value="installers">
          <v-icon start icon="mdi-account-hard-hat" />
          Монтажники
        </v-tab>
        <v-tab value="equipment">
          <v-icon start icon="mdi-tools" />
          Оборудование
        </v-tab>
        <v-tab value="locations">
          <v-icon start icon="mdi-map-marker" />
          Локации
        </v-tab>
      </v-tabs>

      <v-card-text>
        <v-window v-model="activeTab">
          <!-- Список монтажей -->
          <v-window-item value="list">
            <div class="mb-4">
              <v-text-field
                v-model="searchQuery"
                placeholder="Поиск монтажей..."
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
              />
            </div>

            <v-data-table
              :headers="installationHeaders"
              :items="filteredInstallations"
              :loading="loading"
              item-key="id"
              class="elevation-0"
            >
              <template #item.status="{ item }">
                <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
                  {{ getStatusText(item.status) }}
                </v-chip>
              </template>
              <template #item.priority="{ item }">
                <v-chip :color="getPriorityColor(item.priority)" size="small" variant="tonal">
                  {{ getPriorityText(item.priority) }}
                </v-chip>
              </template>
              <template #item.scheduled_at="{ item }">
                {{ formatDate(item.scheduled_at) }}
              </template>
              <template #item.installer="{ item }">
                {{ item.installer.first_name }} {{ item.installer.last_name }}
              </template>
              <template #item.actions="{ item }">
                <v-btn icon="mdi-eye" variant="text" size="small" @click="viewInstallation(item)" />
                <v-btn icon="mdi-pencil" variant="text" size="small" @click="editInstallation(item)" />
              </template>
            </v-data-table>
          </v-window-item>

          <!-- Монтажники -->
          <v-window-item value="installers">
            <v-row>
              <v-col cols="12" md="6" lg="4" v-for="installer in installers" :key="installer.id">
                <v-card variant="outlined">
                  <v-card-text>
                    <div class="d-flex align-center mb-2">
                      <v-avatar color="primary" class="mr-3">
                        {{ installer.first_name[0] }}{{ installer.last_name[0] }}
                      </v-avatar>
                      <div>
                        <div class="font-weight-medium">
                          {{ installer.first_name }} {{ installer.last_name }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                          {{ installer.type }}
                        </div>
                      </div>
                    </div>
                    <v-chip
                      :color="installer.status === 'available' ? 'success' : 'warning'"
                      size="small"
                      variant="tonal"
                      class="mb-2"
                    >
                      {{ installer.status }}
                    </v-chip>
                    <div class="text-body-2">
                      <div><strong>Телефон:</strong> {{ installer.phone }}</div>
                      <div><strong>Email:</strong> {{ installer.email }}</div>
                      <div><strong>Специализация:</strong> {{ installer.specialization.join(', ') }}</div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <!-- Оборудование -->
          <v-window-item value="equipment">
            <v-row>
              <v-col cols="12" md="6" lg="4" v-for="item in equipment" :key="item.id">
                <v-card variant="outlined">
                  <v-card-text>
                    <div class="d-flex align-center justify-space-between mb-2">
                      <div class="font-weight-medium">{{ item.model }}</div>
                      <v-chip :color="getEquipmentStatusColor(item.status)" size="small" variant="tonal">
                        {{ getEquipmentStatusText(item.status) }}
                      </v-chip>
                    </div>
                    <div class="text-body-2">
                      <div><strong>Тип:</strong> {{ item.type }}</div>
                      <div><strong>Бренд:</strong> {{ item.brand }}</div>
                      <div><strong>Серийный номер:</strong> {{ item.serial_number }}</div>
                      <div v-if="item.imei"><strong>IMEI:</strong> {{ item.imei }}</div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <!-- Локации -->
          <v-window-item value="locations">
            <v-row>
              <v-col cols="12" md="6" lg="4" v-for="location in locations" :key="location.id">
                <v-card variant="outlined">
                  <v-card-text>
                    <div class="d-flex align-center mb-2">
                      <v-icon icon="mdi-map-marker" color="primary" class="mr-2" />
                      <div class="font-weight-medium">{{ location.city }}</div>
                    </div>
                    <div class="text-body-2">
                      <div><strong>Регион:</strong> {{ location.region }}</div>
                      <div><strong>Страна:</strong> {{ location.country }}</div>
                      <div><strong>Часовой пояс:</strong> {{ location.timezone }}</div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

// Состояние компонента
const activeTab = ref('list');
const loading = ref(false);
const hideDemoAlert = ref(false);
const searchQuery = ref('');
const isDemoMode = ref(true);

// Простые mock данные для демонстрации
const installations = ref([
  {
    id: 1,
    type: 'монтаж',
    status: 'planned',
    priority: 'high',
    scheduled_at: '2024-12-20T10:00:00Z',
    object: { name: 'Toyota Camry' },
    installer: { first_name: 'Алексей', last_name: 'Иванов' },
    client_contact: 'Иван Петрович (+7 999 111-11-11)',
    address: 'г. Москва, ул. Тверская, д. 12',
    description: 'Установка GPS трекера и сигнализации',
  },
  {
    id: 2,
    type: 'диагностика',
    status: 'in_progress',
    priority: 'urgent',
    scheduled_at: '2024-12-19T14:30:00Z',
    object: { name: 'BMW X5' },
    installer: { first_name: 'Дмитрий', last_name: 'Петров' },
    client_contact: 'Мария Сергеевна (+7 999 222-22-22)',
    address: 'г. Москва, ул. Арбат, д. 25',
    description: 'Диагностика неисправности GPS трекера',
  },
  {
    id: 3,
    type: 'монтаж',
    status: 'completed',
    priority: 'normal',
    scheduled_at: '2024-12-18T11:00:00Z',
    object: { name: 'Mercedes-Benz C-Class' },
    installer: { first_name: 'Сергей', last_name: 'Сидоров' },
    client_contact: 'Александр Викторович (+7 999 333-33-33)',
    address: 'г. Санкт-Петербург, Невский пр., д. 100',
    description: 'Установка иммобилайзера',
  },
]);

const installers = ref([
  {
    id: 1,
    first_name: 'Алексей',
    last_name: 'Иванов',
    type: 'staff',
    phone: '+7 (999) 123-45-67',
    email: 'a.ivanov@axenta.ru',
    specialization: ['GPS трекеры', 'Сигнализации', 'Иммобилайзеры'],
    status: 'available',
  },
  {
    id: 2,
    first_name: 'Дмитрий',
    last_name: 'Петров',
    type: 'staff',
    phone: '+7 (999) 234-56-78',
    email: 'd.petrov@axenta.ru',
    specialization: ['GPS трекеры', 'Камеры', 'Датчики'],
    status: 'busy',
  },
  {
    id: 3,
    first_name: 'Сергей',
    last_name: 'Сидоров',
    type: 'contractor',
    phone: '+7 (999) 345-67-89',
    email: 's.sidorov@contractor.ru',
    specialization: ['Диагностика', 'Обслуживание', 'GPS трекеры'],
    status: 'available',
  },
]);

const equipment = ref([
  {
    id: 1,
    type: 'GPS трекер',
    model: 'StarLine M17',
    brand: 'StarLine',
    serial_number: 'SL17001234',
    imei: '860123456789012',
    status: 'in_stock',
  },
  {
    id: 2,
    type: 'GPS трекер',
    model: 'Pandora DXL 3970',
    brand: 'Pandora',
    serial_number: 'PD39701567',
    status: 'reserved',
  },
  {
    id: 3,
    type: 'Сигнализация',
    model: 'Pandora DX-90',
    brand: 'Pandora',
    serial_number: 'PD90002345',
    status: 'installed',
  },
]);

const locations = ref([
  {
    id: 1,
    city: 'Москва',
    region: 'Московская область',
    country: 'Россия',
    timezone: 'Europe/Moscow',
  },
  {
    id: 2,
    city: 'Санкт-Петербург',
    region: 'Ленинградская область',
    country: 'Россия',
    timezone: 'Europe/Moscow',
  },
  {
    id: 3,
    city: 'Екатеринбург',
    region: 'Свердловская область',
    country: 'Россия',
    timezone: 'Asia/Yekaterinburg',
  },
]);

// Статистика
const stats = computed(() => [
  {
    key: 'total',
    label: 'Всего монтажей',
    value: installations.value.length,
    icon: 'mdi-tools',
    color: 'primary',
  },
  {
    key: 'today',
    label: 'Сегодня',
    value: 1,
    icon: 'mdi-calendar-today',
    color: 'success',
  },
  {
    key: 'overdue',
    label: 'Просроченные',
    value: 0,
    icon: 'mdi-clock-alert',
    color: 'error',
  },
  {
    key: 'completion_rate',
    label: 'Завершенность',
    value: '75%',
    icon: 'mdi-check-circle',
    color: 'info',
  },
]);

// Фильтрованные монтажи
const filteredInstallations = computed(() => {
  if (!searchQuery.value) return installations.value;

  const query = searchQuery.value.toLowerCase();
  return installations.value.filter(installation =>
    installation.description?.toLowerCase().includes(query) ||
    installation.client_contact.toLowerCase().includes(query) ||
    installation.address.toLowerCase().includes(query) ||
    installation.object.name.toLowerCase().includes(query)
  );
});

// Заголовки таблицы
const installationHeaders = [
  { title: 'ID', key: 'id', width: '80px' },
  { title: 'Тип', key: 'type' },
  { title: 'Статус', key: 'status' },
  { title: 'Приоритет', key: 'priority' },
  { title: 'Объект', key: 'object.name' },
  { title: 'Монтажник', key: 'installer' },
  { title: 'Дата', key: 'scheduled_at' },
  { title: 'Действия', key: 'actions', sortable: false, width: '120px' },
];

// Утилиты форматирования
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'planned': return 'info';
    case 'in_progress': return 'warning';
    case 'completed': return 'success';
    case 'cancelled': return 'error';
    default: return 'grey';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'planned': return 'Запланирован';
    case 'in_progress': return 'В работе';
    case 'completed': return 'Завершен';
    case 'cancelled': return 'Отменен';
    default: return status;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low': return 'grey';
    case 'normal': return 'info';
    case 'high': return 'orange';
    case 'urgent': return 'error';
    default: return 'grey';
  }
};

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'low': return 'Низкий';
    case 'normal': return 'Обычный';
    case 'high': return 'Высокий';
    case 'urgent': return 'Срочный';
    default: return priority;
  }
};

const getEquipmentStatusColor = (status: string) => {
  switch (status) {
    case 'in_stock': return 'success';
    case 'reserved': return 'warning';
    case 'installed': return 'info';
    case 'maintenance': return 'error';
    default: return 'grey';
  }
};

const getEquipmentStatusText = (status: string) => {
  switch (status) {
    case 'in_stock': return 'На складе';
    case 'reserved': return 'Зарезервировано';
    case 'installed': return 'Установлено';
    case 'maintenance': return 'Обслуживание';
    default: return status;
  }
};

// Обработчики действий
const openCreateDialog = () => {
  console.log('Создание нового монтажа');
  // TODO: Открыть диалог создания
};

const viewInstallation = (installation: any) => {
  console.log('Просмотр монтажа:', installation.id);
  // TODO: Открыть диалог просмотра
};

const editInstallation = (installation: any) => {
  console.log('Редактирование монтажа:', installation.id);
  // TODO: Открыть диалог редактирования
};

const goToToday = () => {
  console.log('Переход к сегодняшней дате');
  // TODO: Переключить на календарь с сегодняшней датой
};

// Инициализация
onMounted(() => {
  console.log('Страница монтажей загружена успешно');
});
</script>

<style scoped>
.installations-page {
  padding: 24px;
}

.page-header {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgb(var(--v-theme-outline-variant));
}

.page-title {
  color: rgb(var(--v-theme-on-surface));
}

.page-subtitle {
  color: rgb(var(--v-theme-on-surface-variant));
}

/* Адаптивность */
@media (max-width: 768px) {
  .installations-page {
    padding: 16px;
  }
  
  .page-header {
    padding: 16px;
  }
  
  .page-header .d-flex {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
