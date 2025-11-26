<template>
  <BaseWidget
    title="Обзор биллинга"
    icon="mdi-currency-usd"
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
    <div v-if="data" class="billing-overview">
      <v-row>
        <v-col cols="12" lg="4">
          <v-card variant="tonal" color="success">
            <v-card-text class="text-center billing-stat-card">
              <div class="stat-value">{{ formatCurrency(data.total_revenue) }}</div>
              <div class="stat-label">Общая выручка</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" lg="4">
          <v-card variant="tonal" color="primary">
            <v-card-text class="text-center billing-stat-card">
              <div class="stat-value">{{ formatCurrency(data.monthly_revenue) }}</div>
              <div class="stat-label">Выручка за месяц</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" lg="4">
          <v-card variant="tonal" color="info">
            <v-card-text class="text-center billing-stat-card">
              <div class="stat-value">{{ data.active_contracts }}</div>
              <div class="stat-label">Активных договоров</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="text-subtitle-1">
              <v-icon start icon="mdi-file-document-outline" />
              Счета
            </v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-clock-outline" color="warning" />
                  </template>
                  <v-list-item-title>Ожидают оплаты</v-list-item-title>
                  <template v-slot:append>
                    <v-chip color="warning" size="small">
                      {{ data.pending_invoices }}
                    </v-chip>
                  </template>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-alert-circle" color="error" />
                  </template>
                  <v-list-item-title>Просрочены</v-list-item-title>
                  <template v-slot:append>
                    <v-chip color="error" size="small">
                      {{ data.overdue_invoices }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="text-subtitle-1">
              <v-icon start icon="mdi-trending-up" />
              Тенденции
            </v-card-title>
            <v-card-text>
              <div class="trend-item">
                <div class="trend-label">Средний чек</div>
                <div class="trend-value">
                  {{ formatCurrency(averageInvoice) }}
                </div>
              </div>
              <v-divider class="my-2" />
              <div class="trend-item">
                <div class="trend-label">Активных договоров</div>
                <div class="trend-value">
                  {{ data.active_contracts }}
                </div>
              </div>
              <v-divider class="my-2" />
              <div class="trend-item">
                <div class="trend-label">Общая выручка</div>
                <div class="trend-value">
                  {{ formatCurrency(data.total_revenue) }}
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-if="data.overdue_invoices > 0" class="mt-4">
        <v-col cols="12">
          <v-alert
            type="error"
            variant="tonal"
            density="compact"
          >
            <template v-slot:prepend>
              <v-icon icon="mdi-alert-circle" />
            </template>
            Внимание! {{ data.overdue_invoices }} просроченных счетов требуют внимания
            <template v-slot:append>
              <v-btn
                color="error"
                variant="outlined"
                size="small"
                to="/billing/overdue"
              >
                Просмотреть
              </v-btn>
            </template>
          </v-alert>
        </v-col>
      </v-row>
    </div>

    <template #actions>
      <v-btn
        color="primary"
        variant="outlined"
        size="small"
        to="/billing"
      >
        Биллинг
      </v-btn>
      <v-spacer />
      <v-btn
        color="success"
        variant="outlined"
        size="small"
        to="/billing/invoices/create"
      >
        <v-icon start icon="mdi-plus" />
        Создать счет
      </v-btn>
    </template>
  </BaseWidget>
</template>

<script lang="ts">
import { dashboardService } from '@/services/dashboardService';
import type { BillingStats, WidgetDimensions } from '@/types/dashboard';
import type { PropType } from 'vue';
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue';
import BaseWidget from './BaseWidget.vue';

export default defineComponent({
  name: 'BillingOverviewWidget',
  components: {
    BaseWidget
  },
  props: {
    refreshInterval: {
      type: Number,
      default: 600 // 10 минут
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
    const data = ref<BillingStats | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    let refreshTimer: NodeJS.Timeout | null = null;

    const averageInvoice = computed(() => {
      if (!data.value) return 0;
      // Если нет активных договоров, возвращаем 0
      if (data.value.active_contracts === 0) return 0;
      // Если есть месячная выручка, используем её
      if (data.value.monthly_revenue > 0) {
        return data.value.monthly_revenue / data.value.active_contracts;
      }
      // Иначе вычисляем из общей выручки (приблизительно)
      if (data.value.total_revenue > 0) {
        return data.value.total_revenue / data.value.active_contracts;
      }
      return 0;
    });

    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    const loadData = async () => {
      try {
        loading.value = true;
        error.value = null;
        const stats = await dashboardService.getStats();
        data.value = stats.billing;
      } catch (err: any) {
        error.value = err.message || 'Ошибка загрузки данных биллинга';
        console.error('Ошибка загрузки данных биллинга:', err);
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
      data,
      loading,
      error,
      averageInvoice,
      formatCurrency,
      loadData
    };
  }
});
</script>

<style scoped>
.billing-overview {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Прокрутка если содержимое не помещается */
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 4px;
  white-space: nowrap;
  word-break: keep-all;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  word-break: keep-all;
  overflow-wrap: normal;
  line-height: 1.3;
  text-align: center;
}

.billing-stat-card {
  height: 70px; /* Фиксированная высота для статистических карточек */
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 12px 8px !important;
}

.trend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.trend-label {
  font-size: 0.875rem;
}

.trend-value {
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
}

.trend-value.positive {
  color: rgb(var(--v-theme-success));
}

.trend-value.negative {
  color: rgb(var(--v-theme-error));
}

/* Адаптивные размеры для длинных чисел */
@media (max-width: 1200px) {
  .stat-value {
    font-size: 1.25rem;
  }
}

@media (max-width: 768px) {
  .stat-value {
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .stat-value {
    font-size: 1rem;
  }
}
</style>
