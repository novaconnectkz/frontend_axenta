<template>
  <BaseWidget
    title="Обзор объектов"
    icon="mdi-monitor"
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
    <div v-if="data" class="objects-overview">
      <v-row>
        <v-col cols="6" sm="3">
          <div class="stat-item">
            <div class="stat-value total">{{ data.total }}</div>
            <div class="stat-label">Всего объектов</div>
          </div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="stat-item">
            <div class="stat-value active">{{ data.active }}</div>
            <div class="stat-label">Активные</div>
          </div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="stat-item">
            <div class="stat-value inactive">{{ data.inactive }}</div>
            <div class="stat-label">Неактивные</div>
          </div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="stat-item clickable" @click="openTrashDialog">
            <div class="stat-value deleted">{{ data.deleted }}</div>
            <div class="stat-label">В корзине</div>
          </div>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12">
          <v-progress-linear
            :model-value="activePercentage"
            color="success"
            height="20"
            rounded
          >
            <template v-slot:default="{ value }">
              <strong>{{ Math.ceil(value) }}% активных</strong>
            </template>
          </v-progress-linear>
        </v-col>
      </v-row>

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
      <v-btn
        color="primary"
        variant="outlined"
        size="small"
        to="/objects"
      >
        Все объекты
      </v-btn>
      <v-spacer />
      <v-btn
        color="success"
        variant="outlined"
        size="small"
        to="/objects/create"
      >
        <v-icon start icon="mdi-plus" />
        Создать
      </v-btn>
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
import { useAxentaAutoRefresh } from '@/services/axentaAutoRefreshService';

export default defineComponent({
  name: 'ObjectsOverviewWidget',
  components: {
    BaseWidget,
    ObjectsTrashDialog
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

    const openTrashDialog = () => {
      console.log('🗑️ Dashboard: Opening trash dialog...');
      showTrashDialog.value = true;
      console.log('🗑️ Dashboard: showTrashDialog set to:', showTrashDialog.value);
    };

    const loadData = async () => {
      try {
        // loading.value = true; // Убираем loading, чтобы не было размытия экрана
        error.value = undefined;
        console.log('🔄 ObjectsOverviewWidget: Loading dashboard stats...');
        const stats = await dashboardService.getStats();
        console.log('📊 ObjectsOverviewWidget: Dashboard stats received:', stats);
        console.log('📊 ObjectsOverviewWidget: Objects stats:', stats.objects);
        console.log('🗑️ ObjectsOverviewWidget: Количество удаленных объектов:', stats.objects.deleted);
        data.value = stats.objects;
      } catch (err: any) {
        error.value = err.message || 'Ошибка загрузки данных объектов';
        console.error('❌ ObjectsOverviewWidget: Error loading objects data:', err);
      } finally {
        // loading.value = false; // Убираем loading состояние
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
      loadData,
      lastUpdate: realTimeWidget.lastUpdate,
      showTrashDialog,
      openTrashDialog
    };
  }
});
</script>

<style scoped>
.objects-overview {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Прокрутка если содержимое не помещается */
}

.stat-item {
  text-align: center;
  padding: 12px;
  min-width: 120px;
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 4px;
  white-space: nowrap;
  word-break: keep-all;
}

.stat-value.total {
  color: rgb(var(--v-theme-primary));
}

.stat-value.active {
  color: rgb(var(--v-theme-success));
}

.stat-value.inactive {
  color: rgb(var(--v-theme-warning));
}

.stat-value.deleted {
  color: rgb(var(--v-theme-error));
}

.stat-label {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
  text-transform: uppercase;
  letter-spacing: 0.5px;
  word-break: keep-all;
  overflow-wrap: normal;
  line-height: 1.3;
  text-align: center;
}

.stat-item.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px;
  padding: 12px;
}

.stat-item.clickable:hover {
  background-color: rgb(var(--v-theme-surface-variant));
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Адаптивные размеры для длинных чисел */
@media (max-width: 1200px) {
  .stat-value {
    font-size: 1.75rem;
  }
}

@media (max-width: 768px) {
  .stat-value {
    font-size: 1.5rem;
  }
  
  .stat-item {
    padding: 8px;
  }
}

@media (max-width: 480px) {
  .stat-value {
    font-size: 1.25rem;
  }
}
</style>
