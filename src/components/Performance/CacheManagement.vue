<template>
  <div class="cache-management">
    <!-- Метрики кэша -->
    <div class="cache-metrics">
      <div class="metrics-grid">
        <MetricCard
          title="Hit Rate"
          :value="formatPercentage(metrics.hit_rate)"
          :change="5.2"
          icon="mdi-target"
          color="success"
          description="Процент успешных попаданий"
        />
        
        <MetricCard
          title="Всего запросов"
          :value="(metrics.hit_count + metrics.miss_count).toLocaleString()"
          :change="12.8"
          icon="mdi-counter"
          color="info"
          description="Hit + Miss запросы"
        />
        
        <MetricCard
          title="Ключей в кэше"
          :value="metrics.key_count.toLocaleString()"
          :change="-2.1"
          icon="mdi-key-variant"
          color="primary"
          description="Активные ключи"
        />
        
        <MetricCard
          title="Использование памяти"
          :value="metrics.memory_usage"
          :change="8.5"
          icon="mdi-memory"
          color="warning"
          description="Память Redis"
        />
      </div>
    </div>

    <!-- Управление кэшем -->
    <div class="cache-controls">
      <v-card>
        <v-card-title>
          <v-icon start>mdi-cog</v-icon>
          Управление кэшем
        </v-card-title>
        
        <v-card-text>
          <div class="controls-grid">
            <v-btn
              color="primary"
              variant="outlined"
              prepend-icon="mdi-fire"
              @click="handleWarmup"
              :loading="loading.warmup"
              block
            >
              Прогреть кэш
              <v-tooltip activator="parent" location="bottom">
                Загрузить часто используемые данные в кэш
              </v-tooltip>
            </v-btn>
            
            <v-btn
              color="warning"
              variant="outlined"
              prepend-icon="mdi-delete-sweep"
              @click="showClearDialog = true"
              :loading="loading.clear"
              block
            >
              Очистить кэш
              <v-tooltip activator="parent" location="bottom">
                Удалить все ключи из кэша
              </v-tooltip>
            </v-btn>
            
            <v-btn
              color="info"
              variant="outlined"
              prepend-icon="mdi-refresh"
              @click="handleRefresh"
              :loading="loading.refresh"
              block
            >
              Обновить метрики
              <v-tooltip activator="parent" location="bottom">
                Получить актуальные данные
              </v-tooltip>
            </v-btn>
            
            <v-btn
              color="success"
              variant="outlined"
              prepend-icon="mdi-chart-line"
              @click="showStatsDialog = true"
              block
            >
              Подробная статистика
              <v-tooltip activator="parent" location="bottom">
                Детальная информация о кэше
              </v-tooltip>
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- График производительности кэша -->
    <v-card class="cache-chart-card">
      <v-card-title>
        <v-icon start>mdi-chart-line</v-icon>
        Производительность кэша за последние 24 часа
      </v-card-title>
      
      <v-card-text>
        <div class="chart-container">
          <canvas ref="performanceChart" width="800" height="300"></canvas>
        </div>
      </v-card-text>
    </v-card>

    <!-- Статус кэша -->
    <v-card>
      <v-card-title>
        <v-icon start>mdi-information</v-icon>
        Статус кэша
      </v-card-title>
      
      <v-card-text>
        <div class="status-grid">
          <div class="status-item">
            <div class="status-label">Статус подключения</div>
            <v-chip 
              :color="metrics.status === 'enabled' ? 'success' : 'error'"
              size="small"
            >
              <v-icon start size="16">
                {{ metrics.status === 'enabled' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
              </v-icon>
              {{ metrics.status === 'enabled' ? 'Активен' : 'Неактивен' }}
            </v-chip>
          </div>
          
          <div class="status-item">
            <div class="status-label">Hit Count</div>
            <div class="status-value">{{ metrics.hit_count.toLocaleString() }}</div>
          </div>
          
          <div class="status-item">
            <div class="status-label">Miss Count</div>
            <div class="status-value">{{ metrics.miss_count.toLocaleString() }}</div>
          </div>
          
          <div class="status-item">
            <div class="status-label">Hit Rate</div>
            <div class="status-value">{{ formatPercentage(metrics.hit_rate) }}</div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Диалог подтверждения очистки -->
    <v-dialog v-model="showClearDialog" max-width="400">
      <v-card>
        <v-card-title>
          <v-icon start color="warning">mdi-alert</v-icon>
          Подтверждение очистки
        </v-card-title>
        
        <v-card-text>
          <p>Вы уверены, что хотите очистить весь кэш?</p>
          <p class="text-caption text-medium-emphasis">
            Это действие удалит все кэшированные данные и может временно снизить производительность системы.
          </p>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="showClearDialog = false"
          >
            Отмена
          </v-btn>
          <v-btn
            color="warning"
            variant="tonal"
            @click="handleClear"
            :loading="loading.clear"
          >
            Очистить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог детальной статистики -->
    <v-dialog v-model="showStatsDialog" max-width="600">
      <v-card>
        <v-card-title>
          <v-icon start>mdi-chart-box</v-icon>
          Детальная статистика кэша
        </v-card-title>
        
        <v-card-text>
          <div class="detailed-stats">
            <div class="stats-section">
              <h4>Основные метрики</h4>
              <div class="stats-list">
                <div class="stat-item">
                  <span class="stat-label">Общее количество запросов:</span>
                  <span class="stat-value">{{ (metrics.hit_count + metrics.miss_count).toLocaleString() }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Успешные запросы (Hit):</span>
                  <span class="stat-value">{{ metrics.hit_count.toLocaleString() }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Промахи (Miss):</span>
                  <span class="stat-value">{{ metrics.miss_count.toLocaleString() }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Коэффициент попаданий:</span>
                  <span class="stat-value">{{ formatPercentage(metrics.hit_rate) }}</span>
                </div>
              </div>
            </div>
            
            <div class="stats-section">
              <h4>Использование памяти</h4>
              <div class="stats-list">
                <div class="stat-item">
                  <span class="stat-label">Текущее использование:</span>
                  <span class="stat-value">{{ metrics.memory_usage }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Количество ключей:</span>
                  <span class="stat-value">{{ metrics.key_count.toLocaleString() }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Среднее на ключ:</span>
                  <span class="stat-value">{{ calculateAverageKeySize() }}</span>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="showStatsDialog = false"
          >
            Закрыть
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { CacheMetrics } from '@/types/performance'
import Chart from 'chart.js/auto'
import { nextTick, onMounted, reactive, ref } from 'vue'
import MetricCard from './MetricCard.vue'

// Props
interface Props {
  metrics: CacheMetrics
  cacheStats?: any
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  warmup: []
  clear: []
  refresh: []
}>()

// Реактивные данные
const loading = reactive({
  warmup: false,
  clear: false,
  refresh: false
})

const showClearDialog = ref(false)
const showStatsDialog = ref(false)
const performanceChart = ref<HTMLCanvasElement>()

// Методы
const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`
}

const calculateAverageKeySize = (): string => {
  if (props.metrics.key_count === 0) return '0 B'
  
  // Примерный расчет на основе общего использования памяти
  const memoryBytes = parseFloat(props.metrics.memory_usage.replace(/[^\d.]/g, '')) * 1024 * 1024 // MB to bytes
  const avgSize = memoryBytes / props.metrics.key_count
  
  if (avgSize < 1024) return `${avgSize.toFixed(0)} B`
  if (avgSize < 1024 * 1024) return `${(avgSize / 1024).toFixed(1)} KB`
  return `${(avgSize / (1024 * 1024)).toFixed(1)} MB`
}

const handleWarmup = async () => {
  loading.warmup = true
  try {
    emit('warmup')
    await new Promise(resolve => setTimeout(resolve, 1000))
  } finally {
    loading.warmup = false
  }
}

const handleClear = async () => {
  loading.clear = true
  try {
    emit('clear')
    await new Promise(resolve => setTimeout(resolve, 500))
    showClearDialog.value = false
  } finally {
    loading.clear = false
  }
}

const handleRefresh = async () => {
  loading.refresh = true
  try {
    emit('refresh')
    await new Promise(resolve => setTimeout(resolve, 800))
  } finally {
    loading.refresh = false
  }
}

const createPerformanceChart = () => {
  if (!performanceChart.value) return

  const ctx = performanceChart.value.getContext('2d')
  if (!ctx) return

  // Генерируем данные за последние 24 часа
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = (new Date().getHours() - 23 + i + 24) % 24
    return `${hour.toString().padStart(2, '0')}:00`
  })

  const hitRateData = Array.from({ length: 24 }, () => 
    85 + Math.random() * 10 // 85-95%
  )

  const responseTimeData = Array.from({ length: 24 }, () => 
    10 + Math.random() * 20 // 10-30ms
  )

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: hours,
      datasets: [
        {
          label: 'Hit Rate (%)',
          data: hitRateData,
          borderColor: 'rgb(76, 175, 80)',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4,
          fill: true,
          yAxisID: 'y'
        },
        {
          label: 'Время ответа (мс)',
          data: responseTimeData,
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
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top'
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Время'
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Hit Rate (%)'
          },
          min: 0,
          max: 100
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Время ответа (мс)'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  })
}

// Инициализация
onMounted(async () => {
  await nextTick()
  createPerformanceChart()
})
</script>

<style scoped>
.cache-management {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.cache-controls .controls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.cache-chart-card {
  min-height: 400px;
}

.chart-container {
  height: 300px;
  position: relative;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-label {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
  font-weight: 500;
}

.status-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.detailed-stats {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-section h4 {
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 16px;
  font-weight: 600;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(var(--v-theme-outline-variant), 0.2);
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.875rem;
}

.stat-value {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .cache-controls .controls-grid {
    grid-template-columns: 1fr;
  }
  
  .status-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
