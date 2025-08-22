<template>
  <div class="performance-page">
    <!-- Заголовок -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">Производительность и Безопасность</h1>
          <p class="page-subtitle">Мониторинг системы, оптимизация и аудит безопасности</p>
        </div>

        <div class="header-actions">
          <v-btn color="primary" variant="outlined" prepend-icon="mdi-refresh" @click="refreshData" :loading="loading">
            Обновить
          </v-btn>

          <v-btn color="success" prepend-icon="mdi-tune" @click="optimizeSystem" :loading="optimizing">
            Оптимизировать
          </v-btn>
        </div>
      </div>

      <!-- Системное здоровье -->
      <v-card class="system-health-card" variant="outlined">
        <v-card-text>
          <div class="health-status">
            <div class="status-indicator">
              <v-icon :color="systemHealth.status === 'healthy' ? 'success' : 'error'" size="24">
                {{ systemHealth.status === 'healthy' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
              </v-icon>
              <span class="status-text">
                Система {{ systemHealth.status === 'healthy' ? 'работает нормально' : 'требует внимания' }}
              </span>
            </div>

            <div class="health-checks">
              <div v-for="(check, key) in systemHealth.checks" :key="key" class="health-check">
                <v-icon :color="check.status ? 'success' : 'error'" size="16">
                  {{ check.status ? 'mdi-check' : 'mdi-close' }}
                </v-icon>
                <span>{{ check.name }}</span>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Вкладки -->
    <v-tabs v-model="activeTab" class="performance-tabs">
      <v-tab value="overview">
        <v-icon start>mdi-view-dashboard</v-icon>
        Обзор
      </v-tab>

      <v-tab value="cache">
        <v-icon start>mdi-memory</v-icon>
        Кэширование
      </v-tab>

      <v-tab value="database">
        <v-icon start>mdi-database</v-icon>
        База данных
      </v-tab>

      <v-tab value="security">
        <v-icon start>mdi-shield-check</v-icon>
        Безопасность
      </v-tab>

      <v-tab value="audit">
        <v-icon start>mdi-file-document</v-icon>
        Аудит логи
      </v-tab>
    </v-tabs>

    <!-- Содержимое вкладок -->
    <v-tabs-window v-model="activeTab" class="tabs-content">
      <!-- Обзор -->
      <v-tabs-window-item value="overview">
        <div class="overview-content">
          <!-- Ключевые метрики -->
          <div class="metrics-grid">
            <v-card>
              <v-card-text>
                <div class="metric-header">
                  <v-icon color="success" size="24">mdi-target</v-icon>
                  <span class="metric-change positive">+5.2%</span>
                </div>
                <div class="metric-content">
                  <div class="metric-value">{{ formatPercentage(cacheMetrics.hit_rate) }}</div>
                  <div class="metric-title">Hit Rate кэша</div>
                  <div class="metric-description">Процент попаданий в кэш</div>
                </div>
              </v-card-text>
            </v-card>

            <v-card>
              <v-card-text>
                <div class="metric-header">
                  <v-icon color="info" size="24">mdi-key-variant</v-icon>
                  <span class="metric-change negative">-2.1%</span>
                </div>
                <div class="metric-content">
                  <div class="metric-value">{{ cacheMetrics.key_count.toLocaleString() }}</div>
                  <div class="metric-title">Ключей в кэше</div>
                  <div class="metric-description">Активные ключи</div>
                </div>
              </v-card-text>
            </v-card>

            <v-card>
              <v-card-text>
                <div class="metric-header">
                  <v-icon color="warning" size="24">mdi-memory</v-icon>
                  <span class="metric-change positive">+8.1%</span>
                </div>
                <div class="metric-content">
                  <div class="metric-value">{{ cacheMetrics.memory_usage }}</div>
                  <div class="metric-title">Использование памяти</div>
                  <div class="metric-description">Память Redis кэша</div>
                </div>
              </v-card-text>
            </v-card>

            <v-card>
              <v-card-text>
                <div class="metric-header">
                  <v-icon :color="securityAlerts.length > 0 ? 'error' : 'success'" size="24">mdi-shield-alert</v-icon>
                  <span class="metric-change" :class="securityAlerts.length > 0 ? 'negative' : 'positive'">
                    {{ securityAlerts.length > 0 ? '+100%' : '-50%' }}
                  </span>
                </div>
                <div class="metric-content">
                  <div class="metric-value">{{ securityAlerts.length }}</div>
                  <div class="metric-title">Алерты безопасности</div>
                  <div class="metric-description">Активные алерты</div>
                </div>
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
                <div v-for="alert in securityAlerts.slice(0, 3)" :key="alert.type + alert.detected_at"
                  class="alert-item" :class="`alert-${alert.severity}`">
                  <div class="alert-header">
                    <v-icon :color="getSeverityColor(alert.severity)" size="20">
                      {{ getSeverityIcon(alert.severity) }}
                    </v-icon>

                    <div class="alert-info">
                      <div class="alert-description">{{ alert.description }}</div>
                      <div class="alert-meta">
                        <span>{{ formatDate(alert.detected_at) }}</span>
                        <v-chip :color="getSeverityColor(alert.severity)" size="small" variant="outlined">
                          {{ alert.severity.toUpperCase() }}
                        </v-chip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-tabs-window-item>

      <!-- Остальные вкладки с простым содержимым -->
      <v-tabs-window-item value="cache">
        <v-card>
          <v-card-title>Управление кэшем</v-card-title>
          <v-card-text>
            <p>Hit Rate: {{ formatPercentage(cacheMetrics.hit_rate) }}</p>
            <p>Ключей: {{ cacheMetrics.key_count.toLocaleString() }}</p>
            <p>Память: {{ cacheMetrics.memory_usage }}</p>

            <div class="mt-4">
              <v-btn color="primary" class="mr-2" @click="warmupCache">Прогреть кэш</v-btn>
              <v-btn color="warning" @click="clearCache">Очистить кэш</v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>

      <v-tabs-window-item value="database">
        <v-card>
          <v-card-title>База данных</v-card-title>
          <v-card-text>
            <p>Статус: Подключено</p>
            <p>Драйвер: PostgreSQL</p>
            <p>Индексы: Активны</p>

            <div class="mt-4">
              <v-btn color="primary" class="mr-2">Создать индексы</v-btn>
              <v-btn color="success">Оптимизировать</v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>

      <v-tabs-window-item value="security">
        <v-card>
          <v-card-title>Безопасность</v-card-title>
          <v-card-text>
            <p>Алертов: {{ securityAlerts.length }}</p>
            <p>Rate Limit: {{ rateLimitInfo.current }}/{{ rateLimitInfo.limit }}</p>

            <div class="mt-4">
              <v-btn color="error" class="mr-2">Сбросить лимиты</v-btn>
              <v-btn color="info">Обновить</v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>

      <v-tabs-window-item value="audit">
        <v-card>
          <v-card-title>Аудит логи</v-card-title>
          <v-card-text>
            <p>Всего логов: {{ auditStats.total_logs.toLocaleString() }}</p>
            <p>Успешных: {{ auditStats.successful_logs.toLocaleString() }}</p>
            <p>Неуспешных: {{ auditStats.failed_logs.toLocaleString() }}</p>

            <div class="mt-4">
              <v-btn color="primary" class="mr-2">Экспорт</v-btn>
              <v-btn color="warning">Очистка</v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<script setup lang="ts">
import { performanceService } from '@/services/performanceService'
import type {
  AuditStats,
  CacheMetrics,
  RateLimitInfo,
  SecurityAlert,
  SystemHealth,
  SystemInfo,
} from '@/types/performance'
import { onMounted, ref } from 'vue'

// Реактивные данные
const activeTab = ref('overview')
const loading = ref(false)
const optimizing = ref(false)

// Данные системы
const systemInfo = ref<SystemInfo>(performanceService.getMockSystemInfo())
const systemHealth = ref<SystemHealth>(performanceService.getMockSystemHealth())
const cacheMetrics = ref<CacheMetrics>(performanceService.getMockCacheMetrics())
const securityAlerts = ref<SecurityAlert[]>(performanceService.getMockSecurityAlerts())
const auditStats = ref<AuditStats>(performanceService.getMockAuditStats())
const rateLimitInfo = ref<RateLimitInfo>(performanceService.getMockRateLimitInfo())

// Методы
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

const refreshData = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    // Обновляем демо данные
    systemInfo.value = performanceService.getMockSystemInfo()
    systemHealth.value = performanceService.getMockSystemHealth()
    cacheMetrics.value = performanceService.getMockCacheMetrics()
  } finally {
    loading.value = false
  }
}

const optimizeSystem = async () => {
  optimizing.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
  } finally {
    optimizing.value = false
  }
}

const warmupCache = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000))
}

const clearCache = async () => {
  await new Promise(resolve => setTimeout(resolve, 500))
}

// Инициализация
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.performance-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.title-section h1 {
  font-size: 2rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 8px;
}

.title-section p {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 1rem;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.system-health-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, rgba(var(--v-theme-success), 0.05) 100%);
  border: 1px solid rgba(var(--v-theme-outline-variant), 0.2);
}

.health-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-text {
  font-weight: 500;
  font-size: 1.1rem;
}

.health-checks {
  display: flex;
  gap: 24px;
}

.health-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
}

.performance-tabs {
  margin-bottom: 24px;
}

.performance-tabs :deep(.v-tab) {
  text-transform: none;
  font-weight: 500;
}

.tabs-content {
  min-height: 600px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.metric-change {
  padding: 4px 8px;
  border-radius: 12px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  font-size: 0.75rem;
  font-weight: 500;
}

.metric-change.positive {
  color: rgb(var(--v-theme-success));
}

.metric-change.negative {
  color: rgb(var(--v-theme-error));
}

.metric-content {
  text-align: left;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.2;
  margin-bottom: 4px;
}

.metric-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 8px;
}

.metric-description {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: 0.8;
  line-height: 1.3;
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

@media (max-width: 768px) {
  .performance-page {
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
  }

  .health-status {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .health-checks {
    flex-wrap: wrap;
    gap: 16px;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .alert-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
