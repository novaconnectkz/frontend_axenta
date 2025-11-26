<template>
  <BaseWidget
    title="Статистика объектов"
    icon="mdi-monitor"
    :widget-id="widgetId"
    :is-resize-mode="isResizeMode"
    :dimensions="dimensions"
    :loading="loading"
    :error="error"
    :has-data="!!data"
    @refresh="() => loadData(true)"
    @configure="$emit('configure')"
    @remove="$emit('remove')"
    @resize="$emit('resize', $event)"
  >
    <template #header-actions>
      <v-btn
        icon="mdi-view-list"
        size="small"
        variant="text"
        to="/objects"
        title="Все объекты"
      />
      <v-btn
        icon="mdi-plus"
        size="small"
        variant="text"
        to="/objects/create"
        title="Создать объект"
        color="success"
      />
    </template>
    <div v-if="data" class="objects-overview">
      <ActivityIndicator
        title="Статистика объектов"
        :data="activityData"
        :active-percentage="activePercentage"
        active-label="активных"
        summary-label="Общая активность объектов"
        size="medium"
        @item-click="onActivityItemClick"
      />

      <v-row v-if="data.scheduled_for_deletion > 0" class="mt-2">
        <v-col cols="12">
          <v-alert
            type="warning"
            variant="tonal"
            density="compact"
          >
            <template v-slot:prepend>
              <v-icon icon="mdi-calendar-remove" />
            </template>
            {{ data.scheduled_for_deletion }} объект(ов) запланировано к удалению
          </v-alert>
        </v-col>
      </v-row>
    </div>

    <template #actions>
      <!-- Кнопки перенесены в header как иконки -->
    </template>
  </BaseWidget>

  <!-- Диалог корзины объектов -->
  <ObjectsTrashDialog v-model="showTrashDialog" />
</template>

<script lang="ts">
import { createUpdateDebouncer, useObjectsWidget } from '@/composables/useRealTimeWidget';
import { dashboardService } from '@/services/dashboardService';
import type { ObjectStats, WidgetDimensions } from '@/types/dashboard';
import type { PropType } from 'vue';
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue';
import BaseWidget from './BaseWidget.vue';
import ObjectsTrashDialog from '@/components/Objects/ObjectsTrashDialog.vue';
import ActivityIndicator, { type ActivityIndicatorItem } from './ActivityIndicator.vue';
import { useAxentaAutoRefresh } from '@/services/axentaAutoRefreshService';

export default defineComponent({
  name: 'ObjectsOverviewWidget',
  components: {
    BaseWidget,
    ObjectsTrashDialog,
    ActivityIndicator
  },
  props: {
    refreshInterval: {
      type: Number,
      default: 300 // 5 минут
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
    const data = ref<ObjectStats | null>(null);
    const loading = ref(false);
    const error = ref<string | undefined>(undefined);
    const showTrashDialog = ref(false);
    
    // Real-time обновления
    const realTimeWidget = useObjectsWidget('objects-overview', props.refreshInterval);
    const updateDebouncer = createUpdateDebouncer(2000); // 2 секунды задержка
    
    // Автоматическое обновление данных
    const autoRefresh = useAxentaAutoRefresh();
    let unsubscribeFromAutoRefresh: (() => void) | null = null;

    const activePercentage = computed(() => {
      if (!data.value || data.value.total === 0) return 0;
      return (data.value.active / data.value.total) * 100;
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
          label: 'Неактивные',
          value: data.value.inactive,
          colorClass: 'warning',
          percentage: (data.value.inactive / data.value.total) * 100
        },
        {
          label: 'Корзина',
          value: data.value.deleted,
          colorClass: 'error',
          percentage: (data.value.deleted / data.value.total) * 100,
          clickable: true
        }
      ];
    });

    const openTrashDialog = () => {
      console.log('🗑️ Dashboard: Opening trash dialog...');
      showTrashDialog.value = true;
      console.log('🗑️ Dashboard: showTrashDialog set to:', showTrashDialog.value);
    };

    const onActivityItemClick = (item: ActivityIndicatorItem) => {
      if (item.label === 'Корзина') {
        openTrashDialog();
      }
    };

    const loadData = async (forceRefresh: boolean = false) => {
      try {
        loading.value = true;
        error.value = undefined;
        console.log('🔄 ObjectsOverviewWidget: Loading dashboard stats...', forceRefresh ? '(force refresh)' : '');
        const stats = await dashboardService.getStats(forceRefresh);
        console.log('📊 ObjectsOverviewWidget: Dashboard stats received:', stats);
        console.log('📊 ObjectsOverviewWidget: Objects stats:', stats.objects);
        console.log('🗑️ ObjectsOverviewWidget: Количество удаленных объектов:', stats.objects.deleted);
        data.value = stats.objects;
      } catch (err: any) {
        error.value = err.message || 'Ошибка загрузки данных объектов';
        console.error('❌ ObjectsOverviewWidget: Error loading objects data:', err);
      } finally {
        loading.value = false;
      }
    };

    // Обработка real-time обновлений
    const handleRealTimeUpdate = () => {
      // Debounced обновление данных при получении real-time событий
      loadData();
    };

    // Настройка real-time обновлений
    realTimeWidget.onUpdate('object_update', (updateData) => {
      updateDebouncer.debounce(updateData, handleRealTimeUpdate);
    });

    realTimeWidget.onUpdate('object_created', (updateData) => {
      updateDebouncer.debounce(updateData, handleRealTimeUpdate);
    });

    realTimeWidget.onUpdate('object_deleted', (updateData) => {
      updateDebouncer.debounce(updateData, handleRealTimeUpdate);
    });

    realTimeWidget.onUpdate('object_status_changed', (updateData) => {
      updateDebouncer.debounce(updateData, handleRealTimeUpdate);
    });

    // Запуск автообновления
    realTimeWidget.startAutoRefresh(loadData);

    onMounted(() => {
      loadData();
      
      // Подписываемся на автообновление
      unsubscribeFromAutoRefresh = autoRefresh.subscribe(() => {
        loadData();
      });
    });

    onUnmounted(() => {
      // Отписываемся от автообновления
      if (unsubscribeFromAutoRefresh) {
        unsubscribeFromAutoRefresh();
      }
      
      // Останавливаем real-time обновления
      realTimeWidget.stopAutoRefresh();
    });

    return {
      data,
      loading,
      error,
      activePercentage,
      activityData,
      loadData,
      lastUpdate: realTimeWidget.lastUpdate,
      showTrashDialog,
      openTrashDialog,
      onActivityItemClick
    };
  }
});
</script>

<style scoped>
.objects-overview {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: visible; /* Убираем прокрутку */
}


</style>
