<template>
  <BaseWidget
    title="Статистика Учетные записи"
    icon="mdi-briefcase-account"
    :widget-id="widgetId"
    :is-resize-mode="isResizeMode"
    :dimensions="dimensions"
    :loading="loading"
    :error="error"
    :has-data="!!data"
    @refresh="loadData"
    @configure="$emit('configure')"
    @remove="$emit('remove')"
    @resize="$emit('resize', $event)"
  >
    <template #header-actions>
      <v-btn
        icon="mdi-briefcase-account"
        size="small"
        variant="text"
        to="/accounts"
        title="Все учетные записи"
      />
      <v-btn
        icon="mdi-plus"
        size="small"
        variant="text"
        to="/accounts/create"
        title="Добавить учетную запись"
        color="success"
      />
    </template>
    <div v-if="data" class="accounts-overview">
      <ActivityIndicator
        title="Статистика Учетные записи"
        :data="activityData"
        :active-percentage="activePercentage"
        active-label="активных"
        summary-label="Общая активность учетных записей"
        size="medium"
        @item-click="onActivityItemClick"
      />

      <v-row v-if="data.blocked > 0" class="mt-2">
        <v-col cols="12">
          <v-alert
            type="warning"
            variant="tonal"
            density="compact"
          >
            <template v-slot:prepend>
              <v-icon icon="mdi-lock" />
            </template>
            {{ data.blocked }} заблокированных учетных записей из {{ data.total }}
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
import type { AccountStats, WidgetDimensions } from '@/types/dashboard';
import type { PropType } from 'vue';
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue';
import BaseWidget from './BaseWidget.vue';
import ActivityIndicator, { type ActivityIndicatorItem } from './ActivityIndicator.vue';

export default defineComponent({
  name: 'AccountsOverviewWidget',
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
    const data = ref<AccountStats | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    let refreshTimer: NodeJS.Timeout | null = null;

    const activePercentage = computed(() => {
      if (!data.value || data.value.total === 0) return 0;
      return Math.round((data.value.active / data.value.total) * 100);
    });

    const clientsPercentage = computed(() => {
      if (!data.value || data.value.total === 0) return 0;
      return Math.round((data.value.clients / data.value.total) * 100);
    });

    const partnersPercentage = computed(() => {
      if (!data.value || data.value.total === 0) return 0;
      return Math.round((data.value.partners / data.value.total) * 100);
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
          percentage: activePercentage.value
        },
        {
          label: 'Клиенты',
          value: data.value.clients,
          colorClass: 'info',
          percentage: clientsPercentage.value
        },
        {
          label: 'Партнеры',
          value: data.value.partners,
          colorClass: 'secondary',
          percentage: partnersPercentage.value
        }
      ];
    });

    const onActivityItemClick = (item: ActivityIndicatorItem) => {
      // Для учетных записей можно добавить специальную логику при клике
      console.log('Clicked on account activity item:', item);
    };

    const loadData = async () => {
      try {
        loading.value = true;
        error.value = null;
        const stats = await dashboardService.getStats();
        data.value = stats.accounts;
      } catch (err: any) {
        error.value = err.message || 'Ошибка загрузки данных учетных записей';
        console.error('Ошибка загрузки данных учетных записей:', err);
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
      activePercentage,
      activityData,
      loadData,
      onActivityItemClick
    };
  }
});
</script>

<style scoped>
.accounts-overview {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: visible; /* Убираем прокрутку */
}
</style>

