<template>
  <BaseWidget
    title="Статистика пользователей"
    icon="mdi-account-group"
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
    <template #header-actions>
      <v-btn
        icon="mdi-account-group"
        size="small"
        variant="text"
        to="/users"
        title="Все пользователи"
      />
      <v-btn
        icon="mdi-plus"
        size="small"
        variant="text"
        to="/users/create"
        title="Добавить пользователя"
        color="success"
      />
    </template>
    <div v-if="data" class="users-overview">
      <ActivityIndicator
        title="Статистика пользователей"
        :data="activityData"
        :active-percentage="activePercentage"
        active-label="активных"
        summary-label="Общая активность пользователей"
        size="medium"
        @item-click="onActivityItemClick"
      />

      <v-row v-if="data.admins > 0" class="mt-2">
        <v-col cols="12">
          <v-alert
            type="info"
            variant="tonal"
            density="compact"
          >
            <template v-slot:prepend>
              <v-icon icon="mdi-shield-account" />
            </template>
            {{ data.admins }} администратор(ов) из {{ data.total }} пользователей ({{ adminPercentage }}%)
          </v-alert>
        </v-col>
      </v-row>
    </div>

    <template #actions>
      <!-- Кнопки перенесены в header как иконки -->
    </template>
  </BaseWidget>
</template>

<script lang="ts">
import { dashboardService } from '@/services/dashboardService';
import type { UserStats, WidgetDimensions } from '@/types/dashboard';
import type { PropType } from 'vue';
import { computed, defineComponent, nextTick, onMounted, onUnmounted, ref } from 'vue';
import BaseWidget from './BaseWidget.vue';
import ActivityIndicator, { type ActivityIndicatorItem } from './ActivityIndicator.vue';

export default defineComponent({
  name: 'UsersOverviewWidget',
  components: {
    BaseWidget,
    ActivityIndicator
  },
  props: {
    refreshInterval: {
      type: Number,
      default: 300
    },
    widgetId: {
      type: String,
      required: true
    },
    isResizeMode: {
      type: Boolean,
      default: false
    },
    dimensions: {
      type: Object as PropType<WidgetDimensions>,
      default: null
    }
  },
  emits: ['configure', 'remove', 'resize'],
  setup(props) {
    const data = ref<UserStats | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    let refreshTimer: NodeJS.Timeout | null = null;

    const adminPercentage = computed(() => {
      if (!data.value || data.value.total === 0) return 0;
      return Math.round((data.value.admins / data.value.total) * 100);
    });

    const activePercentage = computed(() => {
      if (!data.value || data.value.total === 0) return 0;
      return Math.round((data.value.active / data.value.total) * 100);
    });

    const activityData = computed((): ActivityIndicatorItem[] => {
      if (!data.value) return [];
      
      return [
        {
          label: 'Всего',
          value: data.value.total,
          colorClass: 'primary',
          percentage: 100
        },
        {
          label: 'Активные',
          value: data.value.active,
          colorClass: 'success',
          percentage: (data.value.active / data.value.total) * 100
        },
        {
          label: 'Админы',
          value: data.value.admins,
          colorClass: 'info',
          percentage: (data.value.admins / data.value.total) * 100
        },
        {
          label: 'Обычные',
          value: data.value.regular_users,
          colorClass: 'secondary',
          percentage: (data.value.regular_users / data.value.total) * 100
        }
      ];
    });

    const onActivityItemClick = (item: ActivityIndicatorItem) => {
      // Для пользователей пока не нужно специальных действий при клике
      console.log('Clicked on user activity item:', item);
    };

    const loadData = async () => {
      try {
        // loading.value = true; // Убираем loading, чтобы не было размытия экрана
        error.value = null;
        const stats = await dashboardService.getStats();
        data.value = stats.users;
      } catch (err: any) {
        error.value = err.message || 'Ошибка загрузки данных пользователей';
        console.error('Ошибка загрузки данных пользователей:', err);
      } finally {
        // loading.value = false; // Убираем loading состояние
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

    onMounted(async () => {
      await loadData();
      startAutoRefresh();
    });

    onUnmounted(() => {
      stopAutoRefresh();
    });

    return {
      data,
      loading,
      error,
      adminPercentage,
      activePercentage,
      activityData,
      loadData,
      onActivityItemClick
    };
  }
});
</script>

<style scoped>
.users-overview {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: visible; /* Убираем прокрутку */
}



</style>
