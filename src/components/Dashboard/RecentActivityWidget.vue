<template>
  <BaseWidget
    title="Последняя активность"
    icon="mdi-history"
    :loading="loading"
    :error="error"
    @refresh="loadData"
    @configure="$emit('configure')"
    @remove="$emit('remove')"
  >
    <div v-if="activities.length > 0" class="recent-activity">
      <v-list density="compact">
        <template v-for="(activity, index) in activities" :key="activity.id">
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
              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <v-chip
                    v-bind="props"
                    :color="getActivityColor(activity.type)"
                    size="x-small"
                    variant="tonal"
                  >
                    {{ getActivityTypeLabel(activity.type) }}
                  </v-chip>
                </template>
                <span>{{ formatFullTime(activity.timestamp) }}</span>
              </v-tooltip>
            </template>
          </v-list-item>

          <v-divider v-if="index < activities.length - 1" />
        </template>
      </v-list>
    </div>

    <div v-else-if="!loading" class="no-activity">
      <div class="text-center py-8">
        <v-icon icon="mdi-history" size="48" color="disabled" class="mb-4" />
        <div class="text-subtitle-1 text-disabled">Нет недавней активности</div>
        <div class="text-caption text-disabled">Активность будет отображаться здесь</div>
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
        variant="text"
        @click="showFilters = !showFilters"
      />
    </template>
  </BaseWidget>
</template>

<script lang="ts">
import { dashboardService } from '@/services/dashboardService';
import type { ActivityItem } from '@/types/dashboard';
import { defineComponent, onMounted, onUnmounted, ref } from 'vue';
import BaseWidget from './BaseWidget.vue';

export default defineComponent({
  name: 'RecentActivityWidget',
  components: {
    BaseWidget
  },
  props: {
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
    let refreshTimer: NodeJS.Timeout | null = null;

    const getActivityIcon = (type: string): string => {
      const iconMap: Record<string, string> = {
        'object_created': 'mdi-plus-circle',
        'object_updated': 'mdi-pencil-circle',
        'object_deleted': 'mdi-delete-circle',
        'user_created': 'mdi-account-plus',
        'installation_scheduled': 'mdi-calendar-plus',
        'invoice_generated': 'mdi-file-document-plus',
        'payment_received': 'mdi-cash-check'
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
        'invoice_generated': 'secondary',
        'payment_received': 'success'
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
        'invoice_generated': 'Счет',
        'payment_received': 'Платеж'
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

    const loadData = async () => {
      try {
        loading.value = true;
        error.value = null;
        activities.value = await dashboardService.getRecentActivity(props.limit);
      } catch (err: any) {
        error.value = err.message || 'Ошибка загрузки активности';
        console.error('Ошибка загрузки активности:', err);
      } finally {
        loading.value = false;
      }
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
      getActivityIcon,
      getActivityColor,
      getActivityTypeLabel,
      formatTime,
      formatFullTime,
      loadData
    };
  }
});
</script>

<style scoped>
.recent-activity {
  height: 100%;
  overflow-y: auto;
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
</style>
