<template>
  <BaseWidget
    title="Обзор объектов"
    icon="mdi-monitor"
    :loading="loading"
    :error="error"
    @refresh="loadData"
    @configure="$emit('configure')"
    @remove="$emit('remove')"
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
          <div class="stat-item">
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
</template>

<script lang="ts">
import { createUpdateDebouncer, useObjectsWidget } from '@/composables/useRealTimeWidget';
import { dashboardService } from '@/services/dashboardService';
import type { ObjectStats } from '@/types/dashboard';
import { computed, defineComponent, onMounted, ref } from 'vue';
import BaseWidget from './BaseWidget.vue';

export default defineComponent({
  name: 'ObjectsOverviewWidget',
  components: {
    BaseWidget
  },
  props: {
    refreshInterval: {
      type: Number,
      default: 300 // 5 минут
    }
  },
  emits: ['configure', 'remove'],
  setup(props) {
    const data = ref<ObjectStats | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    
    // Real-time обновления
    const realTimeWidget = useObjectsWidget('objects-overview', props.refreshInterval);
    const updateDebouncer = createUpdateDebouncer(2000); // 2 секунды задержка

    const activePercentage = computed(() => {
      if (!data.value || data.value.total === 0) return 0;
      return (data.value.active / data.value.total) * 100;
    });

    const loadData = async () => {
      try {
        loading.value = true;
        error.value = null;
        const stats = await dashboardService.getStats();
        data.value = stats.objects;
      } catch (err: any) {
        error.value = err.message || 'Ошибка загрузки данных объектов';
        console.error('Ошибка загрузки данных объектов:', err);
      } finally {
        loading.value = false;
      }
    };

    // Обработка real-time обновлений
    const handleRealTimeUpdate = (updates: any[]) => {
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
    });

    return {
      data,
      loading,
      error,
      activePercentage,
      loadData,
      lastUpdate: realTimeWidget.lastUpdate
    };
  }
});
</script>

<style scoped>
.objects-overview {
  height: 100%;
}

.stat-item {
  text-align: center;
  padding: 12px;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 4px;
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
}
</style>
