<template>
  <BaseWidget
    title="Последняя активность"
    icon="mdi-history"
    :widget-id="widgetId"
    :is-resize-mode="isResizeMode"
    :dimensions="dimensions"
    :loading="loading"
    :error="error"
    @refresh="loadData"
    @configure="$emit('configure')"
    @remove="$emit('remove')"
    @resize="$emit('resize', $event)"
  >
    <!-- Sources Settings Panel -->
    <v-expand-transition>
      <div v-if="showSourcesSettings" class="filters-panel">
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="text-subtitle-1">
            <v-icon start icon="mdi-cog" />
            Настройка источников активности
          </v-card-title>
          <v-card-text>
            <div class="text-caption text-disabled mb-4">
              Выберите источники активности, которые будут отображаться в виджете
            </div>
            <v-row dense>
              <v-col
                v-for="source in availableSources"
                :key="source.value"
                cols="12"
                md="6"
              >
                <v-card
                  :variant="enabledSources.includes(source.value) ? 'tonal' : 'outlined'"
                  :color="enabledSources.includes(source.value) ? 'primary' : undefined"
                  class="source-card"
                  @click="toggleSource(source.value)"
                  style="cursor: pointer;"
                >
                  <v-card-text class="d-flex align-center pa-3">
                    <v-checkbox
                      :model-value="enabledSources.includes(source.value)"
                      :label="source.title"
                      hide-details
                      density="compact"
                      @click.stop="toggleSource(source.value)"
                    >
                      <template v-slot:prepend>
                        <v-icon :icon="source.icon" class="mr-2" />
                      </template>
                    </v-checkbox>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
            <v-row dense class="mt-2">
              <v-col cols="auto">
                <v-btn
                  size="small"
                  variant="outlined"
                  @click="enabledSources = availableSources.map(s => s.value); saveSources()"
                >
                  Включить все
                </v-btn>
              </v-col>
              <v-col cols="auto">
                <v-btn
                  size="small"
                  variant="outlined"
                  @click="enabledSources = []; saveSources()"
                >
                  Отключить все
                </v-btn>
              </v-col>
              <v-col cols="auto" class="ml-auto">
                <v-chip color="primary" size="small" variant="tonal">
                  Включено: {{ enabledSources.length }} / {{ availableSources.length }}
                </v-chip>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>
    </v-expand-transition>

    <!-- Filters Panel -->
    <v-expand-transition>
      <div v-if="showFilters" class="filters-panel">
        <v-card variant="outlined" class="mb-4">
          <v-card-text class="pb-2">
            <v-row dense>
              <!-- Activity Type Filter -->
              <v-col cols="12" md="4">
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

              <!-- Date Range Filter -->
              <v-col cols="12" md="4">
                <v-select
                  v-model="filters.dateRange"
                  :items="dateRangeOptions"
                  label="Период"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>

              <!-- User Filter -->
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
                />
              </v-col>
            </v-row>

            <v-row dense class="mt-2">
              <v-col cols="auto">
                <v-btn
                  size="small"
                  variant="outlined"
                  @click="clearFilters"
                  :disabled="!hasActiveFilters"
                >
                  Очистить фильтры
                </v-btn>
              </v-col>
              <v-col cols="auto" v-if="hasActiveFilters">
                <v-chip color="primary" size="small" variant="tonal">
                  Активных фильтров: {{ activeFiltersCount }}
                </v-chip>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>
    </v-expand-transition>

    <div v-if="filteredActivities.length > 0" class="recent-activity">
      <v-list density="compact">
        <template v-for="(activity, index) in filteredActivities" :key="activity.id">
          <v-list-item>
            <template v-slot:prepend>
              <v-avatar :color="getActivityColor(activity.type)" size="32">
                <v-icon :icon="getActivityIcon(activity.type)" size="16" />
              </v-avatar>
            </template>

            <v-list-item-title class="text-wrap">
              {{ activity.title }}
            </v-list-item-title>

            <v-list-item-subtitle class="text-wrap">
              <div>{{ activity.description }}</div>
              <div class="activity-meta">
                <span class="activity-user">{{ activity.userName }}</span>
                <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
              </div>
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-chip
                :color="getActivityColor(activity.type)"
                size="x-small"
                variant="tonal"
              >
                {{ getActivityTypeLabel(activity.type) }}
              </v-chip>
            </template>
          </v-list-item>

          <v-divider v-if="index < filteredActivities.length - 1" />
        </template>
      </v-list>
    </div>

    <div v-else-if="!loading" class="no-activity">
      <div class="text-center py-8">
        <v-icon icon="mdi-history" size="48" color="disabled" class="mb-4" />
        <div class="text-subtitle-1 text-disabled">
          {{ hasActiveFilters ? 'Нет активности по выбранным фильтрам' : 'Нет недавней активности' }}
        </div>
        <div class="text-caption text-disabled">
          {{ hasActiveFilters ? 'Попробуйте изменить параметры фильтрации' : 'Активность будет отображаться здесь' }}
        </div>
        <v-btn
          v-if="hasActiveFilters"
          variant="outlined"
          size="small"
          class="mt-4"
          @click="clearFilters"
        >
          Очистить фильтры
        </v-btn>
      </div>
    </div>

    <template #actions>
      <v-btn
        color="primary"
        variant="outlined"
        size="small"
        to="/activity"
      >
        Вся активность
      </v-btn>
      <v-spacer />
      <v-btn
        icon="mdi-filter"
        size="small"
        :variant="hasActiveFilters ? 'tonal' : 'text'"
        :color="hasActiveFilters ? 'primary' : undefined"
        @click="showFilters = !showFilters"
      >
        <v-badge
          v-if="hasActiveFilters"
          :content="activeFiltersCount"
          color="error"
          offset-x="2"
          offset-y="2"
        >
          <v-icon>mdi-filter</v-icon>
        </v-badge>
        <v-icon v-else>mdi-filter</v-icon>
      </v-btn>
      <v-btn
        icon="mdi-cog"
        size="small"
        :variant="showSourcesSettings ? 'tonal' : 'text'"
        :color="showSourcesSettings ? 'primary' : undefined"
        @click="showSourcesSettings = !showSourcesSettings"
        title="Настройка источников"
      />
    </template>
  </BaseWidget>
</template>

<script lang="ts">
import { dashboardService } from '@/services/dashboardService';
import type { ActivityItem } from '@/types/dashboard';
import { defineComponent, onMounted, onUnmounted, ref, computed, watch } from 'vue';
import BaseWidget from './BaseWidget.vue';

export default defineComponent({
  name: 'RecentActivityWidget',
  components: {
    BaseWidget
  },
  props: {
    widgetId: {
      type: String,
      required: true
    },
    isResizeMode: {
      type: Boolean,
      default: false
    },
    dimensions: {
      type: Object,
      default: () => ({ width: 12, height: 4 })
    },
    refreshInterval: {
      type: Number,
      default: 120 // 2 минуты
    },
    limit: {
      type: Number,
      default: 10
    }
  },
  emits: ['configure', 'remove'],
  setup(props) {
    const activities = ref<ActivityItem[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const showFilters = ref(false);
    const showSourcesSettings = ref(false);
    let refreshTimer: NodeJS.Timeout | null = null;

    // Load saved filters from localStorage
    const loadSavedFilters = () => {
      try {
        const saved = localStorage.getItem('activity-widget-filters');
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            types: parsed.types || [],
            dateRange: parsed.dateRange || 'all',
            users: parsed.users || []
          };
        }
      } catch (error) {
        console.warn('Failed to load saved filters:', error);
      }
      return {
        types: [] as string[],
        dateRange: 'all',
        users: [] as string[]
      };
    };

    // Load saved activity sources from localStorage
    const loadSavedSources = (): string[] => {
      try {
        const saved = localStorage.getItem('activity-widget-sources');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (error) {
        console.warn('Failed to load saved sources:', error);
      }
      // По умолчанию все источники включены
      return ['objects', 'users', 'invoices', 'contracts', 'installations', 'subscriptions'];
    };

    // Activity sources configuration
    const availableSources = [
      { title: 'Объекты', value: 'objects', icon: 'mdi-cube-outline' },
      { title: 'Пользователи', value: 'users', icon: 'mdi-account-outline' },
      { title: 'Счета', value: 'invoices', icon: 'mdi-file-document-outline' },
      { title: 'Договоры', value: 'contracts', icon: 'mdi-file-document-multiple-outline' },
      { title: 'Монтажи', value: 'installations', icon: 'mdi-tools' },
      { title: 'Подписки', value: 'subscriptions', icon: 'mdi-star-outline' }
    ];

    const enabledSources = ref<string[]>(loadSavedSources());

    // Filter state
    const filters = ref(loadSavedFilters());

    // Filter options
    const activityTypeOptions = [
      { title: 'Объекты созданы', value: 'object_created' },
      { title: 'Объекты обновлены', value: 'object_updated' },
      { title: 'Объекты удалены', value: 'object_deleted' },
      { title: 'Пользователи созданы', value: 'user_created' },
      { title: 'Монтажи запланированы', value: 'installation_scheduled' },
      { title: 'Монтажи начаты', value: 'installation_started' },
      { title: 'Монтажи завершены', value: 'installation_completed' },
      { title: 'Монтажи отменены', value: 'installation_cancelled' },
      { title: 'Счета сгенерированы', value: 'invoice_generated' },
      { title: 'Платежи получены', value: 'payment_received' },
      { title: 'Договоры созданы', value: 'contract_created' },
      { title: 'Договоры обновлены', value: 'contract_updated' },
      { title: 'Подписки созданы', value: 'subscription_created' },
      { title: 'Подписки обновлены', value: 'subscription_updated' },
      { title: 'Подписки отменены', value: 'subscription_cancelled' }
    ];

    const dateRangeOptions = [
      { title: 'Все время', value: 'all' },
      { title: 'Последний час', value: 'hour' },
      { title: 'Сегодня', value: 'today' },
      { title: 'Вчера', value: 'yesterday' },
      { title: 'Последние 7 дней', value: 'week' },
      { title: 'Последние 30 дней', value: 'month' }
    ];

    const getActivityIcon = (type: string): string => {
      const iconMap: Record<string, string> = {
        'object_created': 'mdi-plus-circle',
        'object_updated': 'mdi-pencil-circle',
        'object_deleted': 'mdi-delete-circle',
        'user_created': 'mdi-account-plus',
        'installation_scheduled': 'mdi-calendar-plus',
        'installation_started': 'mdi-play-circle',
        'installation_completed': 'mdi-check-circle',
        'installation_cancelled': 'mdi-cancel',
        'invoice_generated': 'mdi-file-document-plus',
        'payment_received': 'mdi-cash-check',
        'contract_created': 'mdi-file-document-plus',
        'contract_updated': 'mdi-file-document-edit',
        'subscription_created': 'mdi-star-plus',
        'subscription_updated': 'mdi-star',
        'subscription_cancelled': 'mdi-star-remove'
      };
      return iconMap[type] || 'mdi-information';
    };

    const getActivityColor = (type: string): string => {
      const colorMap: Record<string, string> = {
        'object_created': 'success',
        'object_updated': 'primary',
        'object_deleted': 'error',
        'user_created': 'info',
        'installation_scheduled': 'warning',
        'installation_started': 'info',
        'installation_completed': 'success',
        'installation_cancelled': 'error',
        'invoice_generated': 'secondary',
        'payment_received': 'success',
        'contract_created': 'primary',
        'contract_updated': 'primary',
        'subscription_created': 'success',
        'subscription_updated': 'info',
        'subscription_cancelled': 'warning'
      };
      return colorMap[type] || 'primary';
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
        'subscription_cancelled': 'Подписка'
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

    // Unique users for filter options
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

    // Date filtering helper
    const isWithinDateRange = (timestamp: string, range: string): boolean => {
      const activityDate = new Date(timestamp);
      const now = new Date();
      
      switch (range) {
        case 'all':
          return true;
        case 'hour':
          return (now.getTime() - activityDate.getTime()) <= 60 * 60 * 1000;
        case 'today':
          return activityDate.toDateString() === now.toDateString();
        case 'yesterday': {
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          return activityDate.toDateString() === yesterday.toDateString();
        }
        case 'week':
          return (now.getTime() - activityDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
        case 'month':
          return (now.getTime() - activityDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
        default:
          return true;
      }
    };

    // Filtered activities
    const filteredActivities = computed(() => {
      return activities.value.filter(activity => {
        // Type filter
        if (filters.value.types.length > 0 && !filters.value.types.includes(activity.type)) {
          return false;
        }

        // Date range filter
        if (!isWithinDateRange(activity.timestamp, filters.value.dateRange)) {
          return false;
        }

        // User filter
        if (filters.value.users.length > 0 && !filters.value.users.includes(activity.userName)) {
          return false;
        }

        return true;
      });
    });

    // Filter state helpers
    const hasActiveFilters = computed(() => {
      return filters.value.types.length > 0 || 
             filters.value.dateRange !== 'all' || 
             filters.value.users.length > 0;
    });

    const activeFiltersCount = computed(() => {
      let count = 0;
      if (filters.value.types.length > 0) count++;
      if (filters.value.dateRange !== 'all') count++;
      if (filters.value.users.length > 0) count++;
      return count;
    });

    const clearFilters = () => {
      filters.value.types = [];
      filters.value.dateRange = 'all';
      filters.value.users = [];
    };

    // Save filters to localStorage when they change
    watch(filters, (newFilters) => {
      try {
        localStorage.setItem('activity-widget-filters', JSON.stringify(newFilters));
      } catch (error) {
        console.warn('Failed to save filters:', error);
      }
    }, { deep: true });

    const loadData = async () => {
      try {
        // loading.value = true; // Убираем loading, чтобы не было размытия экрана
        error.value = null;
        // Передаем включенные источники в запрос
        activities.value = await dashboardService.getRecentActivity(props.limit, enabledSources.value);
      } catch (err: any) {
        error.value = err.message || 'Ошибка загрузки активности';
        console.error('Ошибка загрузки активности:', err);
      } finally {
        // loading.value = false; // Убираем loading состояние
      }
    };

    // Save sources to localStorage
    const saveSources = () => {
      try {
        localStorage.setItem('activity-widget-sources', JSON.stringify(enabledSources.value));
        // Перезагружаем данные с новыми источниками
        loadData();
      } catch (error) {
        console.warn('Failed to save sources:', error);
      }
    };

    // Toggle source
    const toggleSource = (source: string) => {
      const index = enabledSources.value.indexOf(source);
      if (index > -1) {
        enabledSources.value.splice(index, 1);
      } else {
        enabledSources.value.push(source);
      }
      saveSources();
    };

    const startAutoRefresh = () => {
      if (props.refreshInterval > 0) {
        refreshTimer = setInterval(() => {
          loadData();
        }, props.refreshInterval * 1000);
      }
    };

    const stopAutoRefresh = () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
      }
    };

    onMounted(() => {
      loadData();
      startAutoRefresh();
    });

    onUnmounted(() => {
      stopAutoRefresh();
    });

    return {
      activities,
      loading,
      error,
      showFilters,
      showSourcesSettings,
      filters,
      activityTypeOptions,
      dateRangeOptions,
      userOptions,
      filteredActivities,
      hasActiveFilters,
      activeFiltersCount,
      clearFilters,
      getActivityIcon,
      getActivityColor,
      getActivityTypeLabel,
      formatTime,
      formatFullTime,
      loadData,
      availableSources,
      enabledSources,
      toggleSource,
      saveSources
    };
  }
});
</script>

<style scoped>
.filters-panel {
  margin-bottom: 16px;
}

.recent-activity {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Прокрутка для списка активности */
}

.no-activity {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
  font-size: 0.75rem;
}

.activity-user {
  font-weight: 500;
  color: rgb(var(--v-theme-primary));
}

.activity-time {
  color: rgb(var(--v-theme-on-surface-variant));
}

.v-list-item__title {
  font-size: 0.875rem;
  line-height: 1.2;
}

.v-list-item__subtitle {
  font-size: 0.8rem;
  line-height: 1.2;
  opacity: 0.8;
}

/* Scrollbar styling */
.recent-activity::-webkit-scrollbar {
  width: 4px;
}

.recent-activity::-webkit-scrollbar-track {
  background: transparent;
}

.recent-activity::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 2px;
}

.recent-activity::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-on-surface), 0.3);
}

.source-card {
  transition: all 0.2s ease;
}

.source-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
