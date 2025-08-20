<template>
  <div class="installations-page">
    <!-- Заголовок страницы -->
    <div class="page-header">
      <div class="page-title-section">
        <v-icon icon="mdi-tools" size="32" class="page-icon" />
        <div>
          <h1 class="page-title">Планирование монтажей</h1>
          <p class="page-subtitle">Управление монтажами, монтажниками и оборудованием</p>
        </div>
      </div>

      <div class="page-actions">
        <v-btn variant="outlined" prepend-icon="mdi-calendar-today" @click="goToToday" class="mr-2">
          Сегодня
        </v-btn>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
          Новый монтаж
        </v-btn>
      </div>
    </div>

    <!-- Уведомление о демо режиме -->
    <v-alert v-if="isDemoMode" type="info" variant="tonal" class="mb-4 demo-alert" closable
      @click:close="hideDemoAlert = true" v-show="!hideDemoAlert">
      <template #prepend>
        <v-icon>mdi-information</v-icon>
      </template>
      <div class="demo-alert-content">
        <strong>Демо режим активен</strong>
        <p class="mb-0">Отображаются демонстрационные данные для ознакомления с интерфейсом управления монтажами.</p>
      </div>
    </v-alert>

    <!-- Статистика -->
    <div class="stats-section mb-6">
      <v-row>
        <v-col cols="12" sm="6" md="3" v-for="stat in stats" :key="stat.key">
          <v-card class="stat-card">
            <v-card-text>
              <div class="d-flex align-center">
                <v-icon :icon="stat.icon" :color="stat.color" size="24" class="mr-3" />
                <div>
                  <div class="text-h5 font-weight-bold">{{ stat.value }}</div>
                  <div class="text-caption text-medium-emphasis">{{ stat.label }}</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Вкладки -->
    <v-tabs v-model="activeTab" class="mb-4">
      <v-tab value="list">
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        Список монтажей
      </v-tab>
      <v-tab value="installers">
        <v-icon class="mr-2">mdi-account-hard-hat</v-icon>
        Монтажники
      </v-tab>
      <v-tab value="equipment">
        <v-icon class="mr-2">mdi-tools</v-icon>
        Оборудование
      </v-tab>
      <v-tab value="locations">
        <v-icon class="mr-2">mdi-map-marker</v-icon>
        Локации
      </v-tab>
    </v-tabs>

    <!-- Содержимое вкладок -->
    <v-tabs-window v-model="activeTab">
      <!-- Список монтажей -->
      <v-tabs-window-item value="list">
        <v-card>
          <v-card-title>
            Монтажи ({{ installations.length }})
            <v-spacer />
            <v-text-field v-model="searchQuery" placeholder="Поиск..." prepend-inner-icon="mdi-magnify"
              variant="outlined" density="compact" hide-details style="max-width: 300px;" />
          </v-card-title>
          <v-data-table :headers="installationHeaders" :items="filteredInstallations" :loading="loading" item-key="id"
            class="elevation-0">
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
        </v-card>
      </v-tabs-window-item>

      <!-- Монтажники -->
      <v-tabs-window-item value="installers">
        <v-card>
          <v-card-title>Монтажники ({{ installers.length }})</v-card-title>
          <v-card-text>
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
                    <v-chip :color="installer.status === 'available' ? 'success' : 'warning'" size="small"
                      variant="tonal" class="mb-2">
                      {{ installer.status }}
                    </v-chip>
                    <div class="text-body-2">
                      <div><strong>Телефон:</strong> {{ installer.phone }}</div>
                      <div><strong>Email:</strong> {{ installer.email }}</div>
                      <div><strong>Специализация:</strong> {{ installer.specialization.join(', ') }}</div>
                      <div v-if="installer.total_installations_count">
                        <strong>Выполнено монтажей:</strong> {{ installer.total_installations_count }}
                      </div>
                      <div v-if="installer.rating">
                        <strong>Рейтинг:</strong> ⭐ {{ installer.rating }}
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>

      <!-- Оборудование -->
      <v-tabs-window-item value="equipment">
        <v-card>
          <v-card-title>Оборудование ({{ equipment.length }})</v-card-title>
          <v-card-text>
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
                      <div v-if="item.phone_number"><strong>Номер:</strong> {{ item.phone_number }}</div>
                      <div><strong>Состояние:</strong> {{ item.condition }}</div>
                      <div v-if="item.purchase_price">
                        <strong>Стоимость:</strong> {{ item.purchase_price.toLocaleString() }} ₽
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>

      <!-- Локации -->
      <v-tabs-window-item value="locations">
        <v-card>
          <v-card-title>Локации ({{ locations.length }})</v-card-title>
          <v-card-text>
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
                      <div v-if="location.latitude && location.longitude">
                        <strong>Координаты:</strong> {{ location.latitude.toFixed(4) }}, {{
                          location.longitude.toFixed(4) }}
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<script setup lang="ts">
import { installationsService } from "@/services/installationsService";
import type {
  EquipmentBase,
  InstallationStats,
  InstallationWithRelations,
  InstallerWithRelations,
  LocationBase,
} from "@/types/installations";
import { useErrorHandler } from "@/utils/errorHandler";
import { computed, onMounted, ref } from "vue";

// Состояние компонента
const activeTab = ref("list");
const loading = ref(false);
const hideDemoAlert = ref(false);
const searchQuery = ref("");

// Данные
const installations = ref<InstallationWithRelations[]>([]);
const installers = ref<InstallerWithRelations[]>([]);
const equipment = ref<EquipmentBase[]>([]);
const locations = ref<LocationBase[]>([]);
const installationStats = ref<InstallationStats | null>(null);

// Обработчик ошибок
const { handleError } = useErrorHandler();

// Проверка демо режима
const isDemoMode = computed(() => installationsService.isMockMode());

// Статистика для отображения
const stats = computed(() => {
  if (!installationStats.value) return [];

  const stats = installationStats.value;
  return [
    {
      key: "total",
      label: "Всего монтажей",
      value: stats.total,
      icon: "mdi-tools",
      color: "primary"
    },
    {
      key: "today",
      label: "Сегодня",
      value: stats.today,
      icon: "mdi-calendar-today",
      color: "success"
    },
    {
      key: "overdue",
      label: "Просроченные",
      value: stats.overdue,
      icon: "mdi-clock-alert",
      color: "error"
    },
    {
      key: "completion_rate",
      label: "Завершенность",
      value: `${Math.round(stats.completion_rate)}%`,
      icon: "mdi-check-circle",
      color: "info"
    }
  ];
});

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

// Заголовки таблицы монтажей
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

// Загрузка данных
const loadData = async () => {
  loading.value = true;
  try {
    const [installationsRes, installersRes, equipmentRes, locationsRes, statsRes] = await Promise.all([
      installationsService.getInstallations(1, 1000),
      installationsService.getInstallers(1, 1000),
      installationsService.getEquipment(1, 1000),
      installationsService.getLocations(1, 1000),
      installationsService.getInstallationStats(),
    ]);

    installations.value = installationsRes.items;
    installers.value = installersRes.items;
    equipment.value = equipmentRes.items;
    locations.value = locationsRes.items;
    installationStats.value = statsRes;
  } catch (error) {
    handleError(error, "Ошибка загрузки данных");
  } finally {
    loading.value = false;
  }
};

// Утилиты форматирования
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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
};

const viewInstallation = (installation: InstallationWithRelations) => {
  console.log('Просмотр монтажа:', installation.id);
};

const editInstallation = (installation: InstallationWithRelations) => {
  console.log('Редактирование монтажа:', installation.id);
};

const goToToday = () => {
  console.log('Переход к сегодняшней дате');
};

// Загрузка данных при монтировании
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.installations-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-icon {
  color: rgb(var(--v-theme-primary));
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
}

.page-subtitle {
  font-size: 16px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 4px 0 0 0;
}

.page-actions {
  display: flex;
  gap: 12px;
}

.stats-section {
  margin-bottom: 24px;
}

.stat-card {
  height: 100%;
}

.demo-alert {
  border-left: 4px solid rgb(var(--v-theme-info));
}

.demo-alert-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.demo-alert-content strong {
  font-weight: 600;
  color: rgb(var(--v-theme-info));
}

.demo-alert-content p {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.875rem;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .installations-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .page-actions {
    justify-content: stretch;
  }
}
</style>
