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
          <v-btn
            color="primary"
            variant="outlined"
            prepend-icon="mdi-refresh"
            @click="refreshData"
            :loading="loading"
          >
            Обновить
          </v-btn>
          
          <v-btn
            color="success"
            prepend-icon="mdi-tune"
            @click="optimizeSystem"
            :loading="optimizing"
          >
            Оптимизировать
          </v-btn>
        </div>
      </div>

      <!-- Системное здоровье -->
      <v-card class="system-health-card" variant="outlined">
        <v-card-text>
          <div class="health-status">
            <div class="status-indicator">
              <v-icon 
                :color="systemHealth.status === 'healthy' ? 'success' : 'error'"
                size="24"
              >
                {{ systemHealth.status === 'healthy' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
              </v-icon>
              <span class="status-text">
                Система {{ systemHealth.status === 'healthy' ? 'работает нормально' : 'требует внимания' }}
              </span>
            </div>
            
            <div class="health-checks">
              <div 
                v-for="(check, key) in systemHealth.checks" 
                :key="key"
                class="health-check"
              >
                <v-icon 
                  :color="check.status ? 'success' : 'error'"
                  size="16"
                >
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
        <PerformanceOverview 
          :system-info="systemInfo"
          :cache-metrics="cacheMetrics"
          :security-alerts="securityAlerts"
          @refresh="refreshData"
        />
      </v-tabs-window-item>

      <!-- Кэширование -->
      <v-tabs-window-item value="cache">
        <CacheManagement 
          :metrics="cacheMetrics"
          :cache-stats="cacheStats"
          @warmup="warmupCache"
          @clear="clearCache"
          @refresh="refreshCacheData"
        />
      </v-tabs-window-item>

      <!-- База данных -->
      <v-tabs-window-item value="database">
        <DatabasePerformance 
          :indexes="databaseIndexes"
          :index-usage="indexUsage"
          :table-stats="tableStats"
          @create-indexes="createIndexes"
          @optimize="optimizeDatabase"
          @refresh="refreshDatabaseData"
        />
      </v-tabs-window-item>

      <!-- Безопасность -->
      <v-tabs-window-item value="security">
        <SecurityMonitoring 
          :alerts="securityAlerts"
          :rate-limit-info="rateLimitInfo"
          @clear-rate-limit="clearRateLimit"
          @refresh="refreshSecurityData"
        />
      </v-tabs-window-item>

      <!-- Аудит логи -->
      <v-tabs-window-item value="audit">
        <AuditLogs 
          :logs="auditLogs"
          :stats="auditStats"
          :filters="auditFilters"
          @filter="updateAuditFilters"
          @export="exportAuditLogs"
          @cleanup="cleanupAuditLogs"
          @refresh="refreshAuditData"
        />
      </v-tabs-window-item>
    </v-tabs-window>

    <!-- Диалоги -->
    <v-dialog v-model="showOptimizationDialog" max-width="600">
      <OptimizationDialog 
        :recommendations="optimizationRecommendations"
        @close="showOptimizationDialog = false"
        @apply="applyOptimization"
      />
    </v-dialog>

    <!-- Снэкбар для уведомлений -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="snackbar.show = false"
        >
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { performanceService } from '@/services/performanceService'
import type {
    AuditFilters,
    AuditLog,
    AuditStats,
    CacheMetrics,
    DatabaseIndex,
    IndexUsage,
    RateLimitInfo,
    SecurityAlert,
    SystemHealth,
    SystemInfo,
    TableStats
} from '@/types/performance'
import { onMounted, reactive, ref } from 'vue'

// Импорт компонентов
import AuditLogs from '@/components/Performance/AuditLogs.vue'
import CacheManagement from '@/components/Performance/CacheManagement.vue'
import DatabasePerformance from '@/components/Performance/DatabasePerformance.vue'
import OptimizationDialog from '@/components/Performance/OptimizationDialog.vue'
import PerformanceOverview from '@/components/Performance/PerformanceOverview.vue'
import SecurityMonitoring from '@/components/Performance/SecurityMonitoring.vue'

// Реактивные данные
const activeTab = ref('overview')
const loading = ref(false)
const optimizing = ref(false)
const showOptimizationDialog = ref(false)

// Данные системы
const systemInfo = ref<SystemInfo>(performanceService.getMockSystemInfo())
const systemHealth = ref<SystemHealth>(performanceService.getMockSystemHealth())
const cacheMetrics = ref<CacheMetrics>(performanceService.getMockCacheMetrics())
const cacheStats = ref<any>({})
const securityAlerts = ref<SecurityAlert[]>(performanceService.getMockSecurityAlerts())
const auditLogs = ref<AuditLog[]>(performanceService.getMockAuditLogs())
const auditStats = ref<AuditStats>(performanceService.getMockAuditStats())
const databaseIndexes = ref<Record<string, DatabaseIndex[]> | DatabaseIndex[]>(performanceService.getMockDatabaseIndexes())
const indexUsage = ref<IndexUsage[]>(performanceService.getMockIndexUsage())
const tableStats = ref<TableStats[]>(performanceService.getMockTableStats())
const rateLimitInfo = ref<RateLimitInfo>(performanceService.getMockRateLimitInfo())

// Фильтры аудита
const auditFilters = reactive<AuditFilters>({
  limit: 50,
  offset: 0
})

// Рекомендации по оптимизации
const optimizationRecommendations = ref([
  {
    id: '1',
    type: 'index' as const,
    severity: 'medium' as const,
    title: 'Создать индекс для таблицы objects',
    description: 'Обнаружены медленные запросы к таблице objects. Рекомендуется создать составной индекс.',
    impact: 'Ускорение запросов на 40-60%',
    effort: 'Низкий'
  },
  {
    id: '2',
    type: 'cache' as const,
    severity: 'low' as const,
    title: 'Увеличить TTL для статических данных',
    description: 'Статические данные кэшируются на короткий период, что приводит к лишним запросам.',
    impact: 'Снижение нагрузки на БД на 15-20%',
    effort: 'Очень низкий'
  },
  {
    id: '3',
    type: 'security' as const,
    severity: 'high' as const,
    title: 'Настроить строгий rate limiting',
    description: 'Обнаружены попытки брутфорс атак. Необходимо ужесточить ограничения.',
    impact: 'Повышение безопасности',
    effort: 'Средний'
  }
])

// Снэкбар
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success',
  timeout: 4000
})

// Методы
const showSnackbar = (message: string, color: string = 'success') => {
  snackbar.message = message
  snackbar.color = color
  snackbar.show = true
}

const refreshData = async () => {
  loading.value = true
  try {
    // В реальном приложении здесь будут API вызовы
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Обновляем демо данные
    systemInfo.value = performanceService.getMockSystemInfo()
    systemHealth.value = performanceService.getMockSystemHealth()
    cacheMetrics.value = performanceService.getMockCacheMetrics()
    securityAlerts.value = performanceService.getMockSecurityAlerts()
    
    showSnackbar('Данные обновлены')
  } catch (error) {
    showSnackbar('Ошибка при обновлении данных', 'error')
  } finally {
    loading.value = false
  }
}

const optimizeSystem = async () => {
  optimizing.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    showSnackbar('Система оптимизирована')
  } catch (error) {
    showSnackbar('Ошибка при оптимизации', 'error')
  } finally {
    optimizing.value = false
  }
}

const refreshCacheData = async () => {
  try {
    cacheMetrics.value = performanceService.getMockCacheMetrics()
    showSnackbar('Данные кэша обновлены')
  } catch (error) {
    showSnackbar('Ошибка при обновлении данных кэша', 'error')
  }
}

const warmupCache = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    showSnackbar('Кэш прогрет')
  } catch (error) {
    showSnackbar('Ошибка при прогреве кэша', 'error')
  }
}

const clearCache = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    cacheMetrics.value.key_count = 0
    cacheMetrics.value.hit_count = 0
    cacheMetrics.value.miss_count = 0
    showSnackbar('Кэш очищен')
  } catch (error) {
    showSnackbar('Ошибка при очистке кэша', 'error')
  }
}

const refreshDatabaseData = async () => {
  try {
    databaseIndexes.value = performanceService.getMockDatabaseIndexes()
    indexUsage.value = performanceService.getMockIndexUsage()
    tableStats.value = performanceService.getMockTableStats()
    showSnackbar('Данные БД обновлены')
  } catch (error) {
    showSnackbar('Ошибка при обновлении данных БД', 'error')
  }
}

const createIndexes = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 3000))
    showSnackbar('Индексы созданы')
  } catch (error) {
    showSnackbar('Ошибка при создании индексов', 'error')
  }
}

const optimizeDatabase = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 5000))
    showSnackbar('База данных оптимизирована')
  } catch (error) {
    showSnackbar('Ошибка при оптимизации БД', 'error')
  }
}

const refreshSecurityData = async () => {
  try {
    securityAlerts.value = performanceService.getMockSecurityAlerts()
    rateLimitInfo.value = performanceService.getMockRateLimitInfo()
    showSnackbar('Данные безопасности обновлены')
  } catch (error) {
    showSnackbar('Ошибка при обновлении данных безопасности', 'error')
  }
}

const clearRateLimit = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    rateLimitInfo.value.current = 0
    rateLimitInfo.value.remaining = rateLimitInfo.value.limit
    showSnackbar('Rate limit сброшен')
  } catch (error) {
    showSnackbar('Ошибка при сбросе rate limit', 'error')
  }
}

const refreshAuditData = async () => {
  try {
    auditLogs.value = performanceService.getMockAuditLogs()
    auditStats.value = performanceService.getMockAuditStats()
    showSnackbar('Аудит логи обновлены')
  } catch (error) {
    showSnackbar('Ошибка при обновлении аудит логов', 'error')
  }
}

const updateAuditFilters = (filters: AuditFilters) => {
  Object.assign(auditFilters, filters)
  refreshAuditData()
}

const exportAuditLogs = async (filters?: AuditFilters) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    showSnackbar('Аудит логи экспортированы')
  } catch (error) {
    showSnackbar('Ошибка при экспорте', 'error')
  }
}

const cleanupAuditLogs = async (retentionDays: number) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    showSnackbar(`Логи старше ${retentionDays} дней удалены`)
  } catch (error) {
    showSnackbar('Ошибка при очистке логов', 'error')
  }
}

const applyOptimization = async (recommendationId: string) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    optimizationRecommendations.value = optimizationRecommendations.value.filter(
      r => r.id !== recommendationId
    )
    showSnackbar('Оптимизация применена')
  } catch (error) {
    showSnackbar('Ошибка при применении оптимизации', 'error')
  }
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
}
</style>
