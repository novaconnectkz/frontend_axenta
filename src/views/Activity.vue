<template>
  <v-container fluid class="activity-page pa-6">
    <!-- Заголовок страницы -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">
          <v-icon icon="mdi-history" size="32" class="mr-3" />
          Вся активность
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          История событий и действий в системе
        </p>
      </div>
      <v-btn
        icon="mdi-refresh"
        variant="text"
        @click="loadActivities"
        :loading="loading"
      />
    </div>

    <!-- Панель фильтров -->
    <v-card class="mb-6 apple-card" elevation="0" variant="outlined">
      <v-card-text>
        <v-row dense>
          <!-- Фильтр по типу активности -->
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.types"
              :items="activityTypeOptions"
              label="Тип активности"
              multiple
              chips
              closable-chips
              density="compact"
              variant="outlined"
              hide-details
              clearable
            >
              <template v-slot:chip="{ props, item }">
                <v-chip
                  v-bind="props"
                  :color="getActivityColor(item.value)"
                  size="small"
                  variant="tonal"
                >
                  {{ item.title }}
                </v-chip>
              </template>
            </v-select>
          </v-col>

          <!-- Фильтр по периоду -->
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.dateRange"
              :items="dateRangeOptions"
              label="Период"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>

          <!-- Фильтр по пользователям -->
          <v-col cols="12" md="4">
            <v-autocomplete
              v-model="filters.users"
              :items="userOptions"
              label="Пользователи"
              multiple
              chips
              closable-chips
              density="compact"
              variant="outlined"
              hide-details
              clearable
            />
          </v-col>

          <!-- Кнопки действий -->
          <v-col cols="12" md="2" class="d-flex align-center justify-end">
            <v-btn
              variant="outlined"
              size="small"
              @click="clearFilters"
              :disabled="!hasActiveFilters"
              class="mr-2"
            >
              Очистить
            </v-btn>
            <v-chip
              v-if="hasActiveFilters"
              color="primary"
              size="small"
              variant="tonal"
            >
              {{ activeFiltersCount }}
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Список активностей -->
    <v-card class="apple-card" elevation="0" variant="outlined">
      <v-card-text v-if="loading && activities.length === 0" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="text-subtitle-1 mt-4 text-medium-emphasis">Загрузка активности...</p>
      </v-card-text>

      <v-card-text v-else-if="!loading && filteredActivities.length === 0" class="text-center py-12">
        <v-icon icon="mdi-history" size="64" color="disabled" class="mb-4" />
        <p class="text-h6 text-disabled mb-2">
          {{ hasActiveFilters ? 'Нет активности по выбранным фильтрам' : 'Нет активности' }}
        </p>
        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ hasActiveFilters ? 'Попробуйте изменить параметры фильтрации' : 'Активность будет отображаться здесь' }}
        </p>
        <v-btn
          v-if="hasActiveFilters"
          variant="outlined"
          @click="clearFilters"
        >
          Очистить фильтры
        </v-btn>
      </v-card-text>

      <v-list v-else density="comfortable" class="py-0">
        <template v-for="(activity, index) in paginatedActivities" :key="activity.id">
          <v-list-item
            class="activity-item px-6"
            :class="{ 'activity-item-even': index % 2 === 1 }"
          >
            <template v-slot:prepend>
              <v-avatar :color="getActivityColor(activity.type)" size="48" class="mr-4">
                <v-icon :icon="getActivityIcon(activity.type)" size="24" />
              </v-avatar>
            </template>

            <v-list-item-title class="text-subtitle-1 font-weight-medium mb-1">
              {{ activity.title }}
            </v-list-item-title>

            <v-list-item-subtitle class="text-body-2">
              <div class="mb-1">{{ activity.description }}</div>
              <div class="d-flex align-center activity-meta">
                <v-icon icon="mdi-account" size="14" class="mr-1" />
                <span class="activity-user mr-3">{{ activity.userName }}</span>
                <v-icon icon="mdi-clock-outline" size="14" class="mr-1" />
                <span class="activity-time" :title="formatFullTime(activity.timestamp)">
                  {{ formatTime(activity.timestamp) }}
                </span>
              </div>
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-chip
                :color="getActivityColor(activity.type)"
                size="small"
                variant="tonal"
                class="font-weight-medium"
              >
                {{ getActivityTypeLabel(activity.type) }}
              </v-chip>
            </template>
          </v-list-item>

          <v-divider v-if="index < paginatedActivities.length - 1" />
        </template>
      </v-list>

      <!-- Пагинация -->
      <v-card-actions v-if="filteredActivities.length > itemsPerPage" class="justify-center pa-4">
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="7"
          density="comfortable"
          rounded="circle"
        />
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import type { ActivityItem } from '@/types/dashboard';
import { dashboardService } from '@/services/dashboardService';

export default defineComponent({
  name: 'ActivityPage',
  
  setup() {
    // Состояние
    const activities = ref<ActivityItem[]>([]);
    const loading = ref(false);
    const currentPage = ref(1);
    const itemsPerPage = ref(20);

    // Фильтры
    const filters = ref({
      types: [] as string[],
      dateRange: 'all',
      users: [] as string[],
    });

    // Опции для фильтров
    const activityTypeOptions = [
      { title: 'Создание объекта', value: 'object_created' },
      { title: 'Обновление объекта', value: 'object_updated' },
      { title: 'Удаление объекта', value: 'object_deleted' },
      { title: 'Создание пользователя', value: 'user_created' },
      { title: 'Запланирован монтаж', value: 'installation_scheduled' },
      { title: 'Начат монтаж', value: 'installation_started' },
      { title: 'Завершен монтаж', value: 'installation_completed' },
      { title: 'Отменен монтаж', value: 'installation_cancelled' },
      { title: 'Создан счет', value: 'invoice_generated' },
      { title: 'Получен платеж', value: 'payment_received' },
      { title: 'Создан договор', value: 'contract_created' },
      { title: 'Обновлен договор', value: 'contract_updated' },
      { title: 'Создана подписка', value: 'subscription_created' },
      { title: 'Обновлена подписка', value: 'subscription_updated' },
      { title: 'Отменена подписка', value: 'subscription_cancelled' },
    ];

    const dateRangeOptions = [
      { title: 'Все время', value: 'all' },
      { title: 'Сегодня', value: 'today' },
      { title: 'Вчера', value: 'yesterday' },
      { title: 'Последние 7 дней', value: 'week' },
      { title: 'Последние 30 дней', value: 'month' },
      { title: 'Последние 90 дней', value: '90days' },
    ];

    // Computed
    const hasActiveFilters = computed(() => {
      return (
        filters.value.types.length > 0 ||
        filters.value.dateRange !== 'all' ||
        filters.value.users.length > 0
      );
    });

    const activeFiltersCount = computed(() => {
      let count = 0;
      if (filters.value.types.length > 0) count++;
      if (filters.value.dateRange !== 'all') count++;
      if (filters.value.users.length > 0) count++;
      return count;
    });

    const filteredActivities = computed(() => {
      return activities.value.filter((activity) => {
        // Фильтр по типу
        if (filters.value.types.length > 0 && !filters.value.types.includes(activity.type)) {
          return false;
        }

        // Фильтр по дате
        if (filters.value.dateRange !== 'all' && !isWithinDateRange(activity.timestamp, filters.value.dateRange)) {
          return false;
        }

        // Фильтр по пользователю
        if (filters.value.users.length > 0 && !filters.value.users.includes(activity.userName)) {
          return false;
        }

        return true;
      });
    });

    const totalPages = computed(() => {
      return Math.ceil(filteredActivities.value.length / itemsPerPage.value);
    });

    const paginatedActivities = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value;
      const end = start + itemsPerPage.value;
      return filteredActivities.value.slice(start, end);
    });

    const userOptions = computed(() => {
      const uniqueUsers = new Set<string>();
      activities.value.forEach(activity => {
        uniqueUsers.add(activity.userName);
      });
      return Array.from(uniqueUsers).map(userName => ({
        title: userName,
        value: userName
      }));
    });

    // Методы
    const loadActivities = async () => {
      loading.value = true;
      try {
        // Загружаем реальные данные из того же API, что и виджет на дашборде
        const activityData = await dashboardService.getRecentActivity(1000); // Загружаем больше записей
        
        // Данные уже в формате ActivityItem[], просто сохраняем их
        activities.value = activityData.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
      } catch (error) {
        console.error('Ошибка загрузки активностей:', error);
        // В случае ошибки показываем пустой список
        activities.value = [];
      } finally {
        loading.value = false;
      }
    };

    const getActivityTitle = (type: string): string => {
      const titles: Record<string, string> = {
        'object_created': 'Создан новый объект',
        'object_updated': 'Обновлен объект',
        'object_deleted': 'Удален объект',
        'user_created': 'Создан новый пользователь',
        'installation_scheduled': 'Запланирован монтаж',
        'installation_started': 'Начат монтаж',
        'installation_completed': 'Завершен монтаж',
        'installation_cancelled': 'Отменен монтаж',
        'invoice_generated': 'Сгенерирован счет',
        'payment_received': 'Получен платеж',
        'contract_created': 'Создан договор',
        'contract_updated': 'Обновлен договор',
        'subscription_created': 'Создана подписка',
        'subscription_updated': 'Обновлена подписка',
        'subscription_cancelled': 'Отменена подписка',
      };
      return titles[type] || 'Действие в системе';
    };

    const clearFilters = () => {
      filters.value = {
        types: [],
        dateRange: 'all',
        users: [],
      };
      currentPage.value = 1;
    };

    const getActivityColor = (type: string): string => {
      const colorMap: Record<string, string> = {
        'object_created': 'success',
        'object_updated': 'info',
        'object_deleted': 'error',
        'user_created': 'success',
        'installation_scheduled': 'info',
        'installation_started': 'warning',
        'installation_completed': 'success',
        'installation_cancelled': 'error',
        'invoice_generated': 'secondary',
        'payment_received': 'success',
        'contract_created': 'primary',
        'contract_updated': 'primary',
        'subscription_created': 'success',
        'subscription_updated': 'info',
        'subscription_cancelled': 'warning',
      };
      return colorMap[type] || 'primary';
    };

    const getActivityIcon = (type: string): string => {
      const iconMap: Record<string, string> = {
        'object_created': 'mdi-plus-circle',
        'object_updated': 'mdi-pencil',
        'object_deleted': 'mdi-delete',
        'user_created': 'mdi-account-plus',
        'installation_scheduled': 'mdi-calendar-clock',
        'installation_started': 'mdi-play-circle',
        'installation_completed': 'mdi-check-circle',
        'installation_cancelled': 'mdi-close-circle',
        'invoice_generated': 'mdi-file-document',
        'payment_received': 'mdi-cash-check',
        'contract_created': 'mdi-file-sign',
        'contract_updated': 'mdi-file-edit',
        'subscription_created': 'mdi-star',
        'subscription_updated': 'mdi-star-check',
        'subscription_cancelled': 'mdi-star-off',
      };
      return iconMap[type] || 'mdi-information';
    };

    const getActivityTypeLabel = (type: string): string => {
      const labelMap: Record<string, string> = {
        'object_created': 'Объект',
        'object_updated': 'Объект',
        'object_deleted': 'Объект',
        'user_created': 'Пользователь',
        'installation_scheduled': 'Монтаж',
        'installation_started': 'Монтаж',
        'installation_completed': 'Монтаж',
        'installation_cancelled': 'Монтаж',
        'invoice_generated': 'Счет',
        'payment_received': 'Платеж',
        'contract_created': 'Договор',
        'contract_updated': 'Договор',
        'subscription_created': 'Подписка',
        'subscription_updated': 'Подписка',
        'subscription_cancelled': 'Подписка',
      };
      return labelMap[type] || 'Система';
    };

    const formatTime = (timestamp: string): string => {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) {
        return 'только что';
      } else if (diffMinutes < 60) {
        return `${diffMinutes} мин назад`;
      } else if (diffHours < 24) {
        return `${diffHours} ч назад`;
      } else if (diffDays < 7) {
        return `${diffDays} дн назад`;
      } else {
        return date.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit'
        });
      }
    };

    const formatFullTime = (timestamp: string): string => {
      return new Date(timestamp).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const isWithinDateRange = (timestamp: string, range: string): boolean => {
      const activityDate = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - activityDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      switch (range) {
        case 'today':
          return diffDays < 1 && activityDate.getDate() === now.getDate();
        case 'yesterday':
          return diffDays >= 1 && diffDays < 2 && activityDate.getDate() === now.getDate() - 1;
        case 'week':
          return diffDays <= 7;
        case 'month':
          return diffDays <= 30;
        case '90days':
          return diffDays <= 90;
        case 'all':
        default:
          return true;
      }
    };

    // Загружаем данные при монтировании
    onMounted(() => {
      loadActivities();
    });

    return {
      activities,
      loading,
      filters,
      activityTypeOptions,
      dateRangeOptions,
      hasActiveFilters,
      activeFiltersCount,
      filteredActivities,
      paginatedActivities,
      currentPage,
      totalPages,
      itemsPerPage,
      userOptions,
      loadActivities,
      clearFilters,
      getActivityColor,
      getActivityIcon,
      getActivityTypeLabel,
      formatTime,
      formatFullTime,
    };
  },
});
</script>

<style scoped>
.activity-page {
  max-width: 1400px;
  margin: 0 auto;
}

.apple-card {
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgb(var(--v-theme-surface));
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.apple-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.activity-item {
  padding: 16px 24px;
  transition: background-color 0.15s ease;
}

.activity-item:hover {
  background: rgba(0, 122, 255, 0.04);
}

.activity-item-even {
  background: rgba(0, 0, 0, 0.02);
}

.activity-item-even:hover {
  background: rgba(0, 122, 255, 0.06);
}

.activity-meta {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 4px;
}

.activity-user {
  font-weight: 500;
}

.activity-time {
  color: rgb(var(--v-theme-on-surface-variant));
}

/* Apple-стиль для pagination */
:deep(.v-pagination__item) {
  border-radius: 50%;
  min-width: 36px;
  height: 36px;
}

:deep(.v-pagination__item--is-active) {
  background: rgb(var(--v-theme-primary)) !important;
  color: white;
}
</style>

