<template>
  <BaseWidget
    title="Обзор пользователей"
    icon="mdi-account-group"
    :loading="loading"
    :error="error"
    @refresh="loadData"
    @configure="$emit('configure')"
    @remove="$emit('remove')"
  >
    <div v-if="data" class="users-overview">
      <v-row>
        <v-col cols="6" sm="3">
          <div class="stat-item">
            <div class="stat-value total">{{ data.total }}</div>
            <div class="stat-label">Всего пользователей</div>
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
            <div class="stat-value admins">{{ data.admins }}</div>
            <div class="stat-label">Администраторы</div>
          </div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="stat-item">
            <div class="stat-value regular">{{ data.regular_users }}</div>
            <div class="stat-label">Обычные</div>
          </div>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <div class="chart-container">
            <canvas ref="usersChart"></canvas>
          </div>
        </v-col>
        <v-col cols="12" md="6">
          <v-list density="compact">
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-account-check" color="success" />
              </template>
              <v-list-item-title>Активные пользователи</v-list-item-title>
              <template v-slot:append>
                <v-chip color="success" size="small">
                  {{ data.active }}
                </v-chip>
              </template>
            </v-list-item>
            
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-account-off" color="warning" />
              </template>
              <v-list-item-title>Неактивные пользователи</v-list-item-title>
              <template v-slot:append>
                <v-chip color="warning" size="small">
                  {{ data.inactive }}
                </v-chip>
              </template>
            </v-list-item>

            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-shield-account" color="primary" />
              </template>
              <v-list-item-title>Администраторы</v-list-item-title>
              <template v-slot:append>
                <v-chip color="primary" size="small">
                  {{ adminPercentage }}%
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>
    </div>

    <template #actions>
      <v-btn
        color="primary"
        variant="outlined"
        size="small"
        to="/users"
      >
        Все пользователи
      </v-btn>
      <v-spacer />
      <v-btn
        color="success"
        variant="outlined"
        size="small"
        to="/users/create"
      >
        <v-icon start icon="mdi-plus" />
        Добавить
      </v-btn>
    </template>
  </BaseWidget>
</template>

<script lang="ts">
import { dashboardService } from '@/services/dashboardService';
import type { UserStats } from '@/types/dashboard';
import { computed, defineComponent, nextTick, onMounted, onUnmounted, ref } from 'vue';
import BaseWidget from './BaseWidget.vue';

export default defineComponent({
  name: 'UsersOverviewWidget',
  components: {
    BaseWidget
  },
  props: {
    refreshInterval: {
      type: Number,
      default: 300
    }
  },
  emits: ['configure', 'remove'],
  setup(props) {
    const data = ref<UserStats | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const usersChart = ref<HTMLCanvasElement | null>(null);
    let refreshTimer: NodeJS.Timeout | null = null;
    let chartInstance: any = null;

    const adminPercentage = computed(() => {
      if (!data.value || data.value.total === 0) return 0;
      return Math.round((data.value.admins / data.value.total) * 100);
    });

    const loadData = async () => {
      try {
        loading.value = true;
        error.value = null;
        const stats = await dashboardService.getStats();
        data.value = stats.users;
        
        await nextTick();
        updateChart();
      } catch (err: any) {
        error.value = err.message || 'Ошибка загрузки данных пользователей';
        console.error('Ошибка загрузки данных пользователей:', err);
      } finally {
        loading.value = false;
      }
    };

    const updateChart = async () => {
      if (!usersChart.value || !data.value) return;

      // Простая реализация без Chart.js для демонстрации
      // В реальном проекте лучше использовать Chart.js или другую библиотеку
      const ctx = usersChart.value.getContext('2d');
      if (!ctx) return;

      const { active, inactive } = data.value;
      const total = active + inactive;
      
      if (total === 0) return;

      const activeAngle = (active / total) * 2 * Math.PI;
      const centerX = usersChart.value.width / 2;
      const centerY = usersChart.value.height / 2;
      const radius = Math.min(centerX, centerY) - 10;

      ctx.clearRect(0, 0, usersChart.value.width, usersChart.value.height);

      // Активные пользователи
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, activeAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fillStyle = '#4CAF50';
      ctx.fill();

      // Неактивные пользователи
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, activeAngle, 2 * Math.PI);
      ctx.lineTo(centerX, centerY);
      ctx.fillStyle = '#FF9800';
      ctx.fill();
    };

    const initChart = () => {
      if (usersChart.value) {
        usersChart.value.width = 150;
        usersChart.value.height = 150;
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
      await nextTick();
      initChart();
      await loadData();
      startAutoRefresh();
    });

    onUnmounted(() => {
      stopAutoRefresh();
      if (chartInstance) {
        chartInstance.destroy();
      }
    });

    return {
      data,
      loading,
      error,
      usersChart,
      adminPercentage,
      loadData
    };
  }
});
</script>

<style scoped>
.users-overview {
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

.stat-value.admins {
  color: rgb(var(--v-theme-info));
}

.stat-value.regular {
  color: rgb(var(--v-theme-secondary));
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

.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 150px;
}

/* Исправление для списков */
.users-overview :deep(.v-list-item-title) {
  white-space: normal !important;
  word-break: keep-all !important;
  overflow: visible !important;
  text-overflow: unset !important;
  line-height: 1.3 !important;
}

.users-overview :deep(.v-list-item) {
  min-height: 48px !important;
  padding: 8px 16px !important;
}
</style>
