<template>
  <div class="performance-overview">
    <!-- Ключевые метрики -->
    <div class="metrics-grid">
      <MetricCard
        title="Hit Rate кэша"
        :value="formatPercentage(cacheMetrics.hit_rate)"
        :change="12.5"
        icon="mdi-memory"
        color="success"
        description="Процент попаданий в кэш"
      />
      
      <MetricCard
        title="Ключей в кэше"
        :value="cacheMetrics.key_count.toLocaleString()"
        :change="-5.2"
        icon="mdi-key"
        color="info"
        description="Общее количество ключей"
      />
      
      <MetricCard
        title="Использование памяти"
        :value="cacheMetrics.memory_usage"
        :change="8.1"
        icon="mdi-chip"
        color="warning"
        description="Память Redis кэша"
      />
      
      <MetricCard
        title="Алерты безопасности"
        :value="securityAlerts.length.toString()"
        :change="securityAlerts.length > 0 ? 100 : -50"
        icon="mdi-shield-alert"
        :color="securityAlerts.length > 0 ? 'error' : 'success'"
        description="Активные алерты"
      />
    </div>

    <!-- Графики и диаграммы -->
    <div class="charts-grid">
      <!-- График производительности кэша -->
      <v-card class="chart-card">
        <v-card-title>
          <v-icon start>mdi-chart-line</v-icon>
          Производительность кэша
        </v-card-title>
        <v-card-text>
          <canvas ref="cacheChart" width="400" height="200"></canvas>
        </v-card-text>
      </v-card>

      <!-- Диаграмма активности системы -->
      <v-card class="chart-card">
        <v-card-title>
          <v-icon start>mdi-chart-donut</v-icon>
          Системная активность
        </v-card-title>
        <v-card-text>
          <canvas ref="activityChart" width="400" height="200"></canvas>
        </v-card-text>
      </v-card>
    </div>

    <!-- Алерты безопасности -->
    <v-card v-if="securityAlerts.length > 0" class="alerts-card">
      <v-card-title>
        <v-icon start color="error">mdi-shield-alert</v-icon>
        Алерты безопасности
      </v-card-title>
      
      <v-card-text>
        <div class="alerts-list">
          <div
            v-for="alert in securityAlerts"
            :key="alert.type + alert.detected_at"
            class="alert-item"
            :class="`alert-${alert.severity}`"
          >
            <div class="alert-header">
              <v-icon 
                :color="getSeverityColor(alert.severity)"
                size="20"
              >
                {{ getSeverityIcon(alert.severity) }}
              </v-icon>
              
              <div class="alert-info">
                <div class="alert-description">{{ alert.description }}</div>
                <div class="alert-meta">
                  <span>{{ formatDate(alert.detected_at) }}</span>
                  <v-chip 
                    :color="getSeverityColor(alert.severity)"
                    size="small"
                    variant="outlined"
                  >
                    {{ alert.severity.toUpperCase() }}
                  </v-chip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
      
      <v-card-actions>
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-eye"
          @click="$emit('view-all-alerts')"
        >
          Все алерты
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Системная информация -->
    <div class="system-info-grid">
      <v-card>
        <v-card-title>
          <v-icon start>mdi-database</v-icon>
          База данных
        </v-card-title>
        <v-card-text>
          <div class="info-item">
            <span class="info-label">Статус:</span>
            <v-chip 
              :color="systemInfo.database.status === 'connected' ? 'success' : 'error'"
              size="small"
            >
              {{ systemInfo.database.status === 'connected' ? 'Подключено' : 'Ошибка' }}
            </v-chip>
          </div>
          <div class="info-item">
            <span class="info-label">Драйвер:</span>
            <span>{{ systemInfo.database.driver.toUpperCase() }}</span>
          </div>
        </v-card-text>
      </v-card>

      <v-card>
        <v-card-title>
          <v-icon start>mdi-memory</v-icon>
          Кэширование
        </v-card-title>
        <v-card-text>
          <div class="info-item">
            <span class="info-label">Статус:</span>
            <v-chip 
              :color="systemInfo.cache.status === 'connected' ? 'success' : 'error'"
              size="small"
            >
              {{ systemInfo.cache.status === 'connected' ? 'Подключено' : 'Ошибка' }}
            </v-chip>
          </div>
          <div class="info-item">
            <span class="info-label">Тип:</span>
            <span>{{ systemInfo.cache.type.toUpperCase() }}</span>
          </div>
        </v-card-text>
      </v-card>

      <v-card>
        <v-card-title>
          <v-icon start>mdi-cog</v-icon>
          Настройки производительности
        </v-card-title>
        <v-card-text>
          <div class="settings-list">
            <div class="setting-item">
              <v-icon 
                :color="systemInfo.performance.indexes_enabled ? 'success' : 'error'"
                size="16"
              >
                {{ systemInfo.performance.indexes_enabled ? 'mdi-check' : 'mdi-close' }}
              </v-icon>
              <span>Индексы БД</span>
            </div>
            
            <div class="setting-item">
              <v-icon 
                :color="systemInfo.performance.rate_limiting_enabled ? 'success' : 'error'"
                size="16"
              >
                {{ systemInfo.performance.rate_limiting_enabled ? 'mdi-check' : 'mdi-close' }}
              </v-icon>
              <span>Rate Limiting</span>
            </div>
            
            <div class="setting-item">
              <v-icon 
                :color="systemInfo.performance.audit_logging_enabled ? 'success' : 'error'"
                size="16"
              >
                {{ systemInfo.performance.audit_logging_enabled ? 'mdi-check' : 'mdi-close' }}
              </v-icon>
              <span>Аудит логирование</span>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Быстрые действия -->
    <v-card class="quick-actions-card">
      <v-card-title>
        <v-icon start>mdi-lightning-bolt</v-icon>
        Быстрые действия
      </v-card-title>
      
      <v-card-text>
        <div class="actions-grid">
          <v-btn
            color="primary"
            variant="outlined"
            prepend-icon="mdi-fire"
            @click="$emit('warmup-cache')"
          >
            Прогреть кэш
          </v-btn>
          
          <v-btn
            color="warning"
            variant="outlined"
            prepend-icon="mdi-delete-sweep"
            @click="$emit('clear-cache')"
          >
            Очистить кэш
          </v-btn>
          
          <v-btn
            color="info"
            variant="outlined"
            prepend-icon="mdi-database-cog"
            @click="$emit('optimize-db')"
          >
            Оптимизировать БД
          </v-btn>
          
          <v-btn
            color="success"
            variant="outlined"
            prepend-icon="mdi-refresh"
            @click="$emit('refresh')"
          >
            Обновить данные
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import type { CacheMetrics, SecurityAlert, SystemInfo } from '@/types/performance'
import Chart from 'chart.js/auto'
import { nextTick, onMounted, ref } from 'vue'
import MetricCard from './MetricCard.vue'

// Props
interface Props {
  systemInfo: SystemInfo
  cacheMetrics: CacheMetrics
  securityAlerts: SecurityAlert[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  refresh: []
  'warmup-cache': []
  'clear-cache': []
  'optimize-db': []
  'view-all-alerts': []
}>()

// Refs для графиков
const cacheChart = ref<HTMLCanvasElement>()
const activityChart = ref<HTMLCanvasElement>()

// Методы форматирования
const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('ru-RU')
}

const getSeverityColor = (severity: SecurityAlert['severity']): string => {
  const colors = {
    low: 'info',
    medium: 'warning',
    high: 'error',
    critical: 'error'
  }
  return colors[severity]
}

const getSeverityIcon = (severity: SecurityAlert['severity']): string => {
  const icons = {
    low: 'mdi-information',
    medium: 'mdi-alert',
    high: 'mdi-alert-circle',
    critical: 'mdi-alert-octagon'
  }
  return icons[severity]
}

// Создание графиков
const createCacheChart = () => {
  if (!cacheChart.value) return

  const ctx = cacheChart.value.getContext('2d')
  if (!ctx) return

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
      datasets: [
        {
          label: 'Hit Rate (%)',
          data: [85.2, 87.1, 89.5, 91.2, 88.7, 86.9],
          borderColor: 'rgb(76, 175, 80)',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Количество ключей',
          data: [2100, 2250, 2800, 3100, 2950, 2750],
          borderColor: 'rgb(33, 150, 243)',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Hit Rate (%)'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Количество ключей'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  })
}

const createActivityChart = () => {
  if (!activityChart.value) return

  const ctx = activityChart.value.getContext('2d')
  if (!ctx) return

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['API запросы', 'Запросы к БД', 'Кэш операции', 'Файловые операции'],
      datasets: [{
        data: [45, 25, 20, 10],
        backgroundColor: [
          'rgb(33, 150, 243)',
          'rgb(76, 175, 80)',
          'rgb(255, 152, 0)',
          'rgb(156, 39, 176)'
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  })
}

// Инициализация
onMounted(async () => {
  await nextTick()
  createCacheChart()
  createActivityChart()
})
</script>

<style scoped>
.performance-overview {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart-card {
  min-height: 300px;
}

.chart-card .v-card-text {
  height: 240px;
  position: relative;
}

.alerts-card {
  border-left: 4px solid rgb(var(--v-theme-error));
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.alert-item {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-outline-variant), 0.2);
}

.alert-item.alert-critical,
.alert-item.alert-high {
  background: rgba(var(--v-theme-error), 0.05);
  border-color: rgba(var(--v-theme-error), 0.2);
}

.alert-item.alert-medium {
  background: rgba(var(--v-theme-warning), 0.05);
  border-color: rgba(var(--v-theme-warning), 0.2);
}

.alert-item.alert-low {
  background: rgba(var(--v-theme-info), 0.05);
  border-color: rgba(var(--v-theme-info), 0.2);
}

.alert-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.alert-info {
  flex: 1;
}

.alert-description {
  font-weight: 500;
  margin-bottom: 8px;
}

.alert-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.system-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
}

.quick-actions-card .actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .system-info-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-actions-card .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .alert-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
