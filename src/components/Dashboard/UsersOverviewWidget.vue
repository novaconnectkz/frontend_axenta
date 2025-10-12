<template>
  <BaseWidget
    title="Обзор пользователей"
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
import type { UserStats, WidgetDimensions } from '@/types/dashboard';
import type { PropType } from 'vue';
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

</style>
