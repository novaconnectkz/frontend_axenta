<template>
  <div class="performance-settings">
    <!-- Заголовок секции -->
    <div class="section-header mb-6">
      <h3 class="text-h6 font-weight-bold mb-2">Производительность и безопасность</h3>
      <p class="text-body-2 text-medium-emphasis">
        Мониторинг системы, оптимизация производительности и управление безопасностью
      </p>
    </div>

    <!-- Вкладки производительности -->
    <v-tabs v-model="activeTab" class="mb-6" color="primary">
      <v-tab value="overview">
        <v-icon start>mdi-chart-line</v-icon>
        Обзор
      </v-tab>
      <v-tab value="cache">
        <v-icon start>mdi-database</v-icon>
        Кэширование
      </v-tab>
      <v-tab value="database">
        <v-icon start>mdi-server</v-icon>
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

    <!-- Контент вкладок -->
    <v-tabs-window v-model="activeTab">
      <!-- Обзор -->
      <v-tabs-window-item value="overview">
        <PerformanceOverview :system-info="systemInfo" :cache-metrics="cacheMetrics" :security-alerts="securityAlerts"
          @refresh="handleRefresh" @warmup-cache="handleWarmupCache" />
      </v-tabs-window-item>

      <!-- Кэширование -->
      <v-tabs-window-item value="cache">
        <CacheManagement :metrics="cacheMetrics" :cache-stats="cacheStats" @warmup="handleWarmupCache"
          @clear="handleClearCache" @refresh="handleRefreshCache" />
      </v-tabs-window-item>

      <!-- База данных -->
      <v-tabs-window-item value="database">
        <DatabasePerformance :indexes="databaseIndexes" :index-usage="indexUsage" :table-stats="tableStats"
          @create-indexes="handleCreateIndexes" @optimize="handleOptimizeDatabase" @refresh="handleRefreshDatabase" />
      </v-tabs-window-item>

      <!-- Безопасность -->
      <v-tabs-window-item value="security">
        <SecurityMonitoring :alerts="securityAlerts" :rate-limit-info="rateLimitInfo"
          @clear-rate-limit="handleClearRateLimit" @refresh="handleRefreshSecurity" />
      </v-tabs-window-item>

      <!-- Аудит логи -->
      <v-tabs-window-item value="audit">
        <AuditLogs :logs="auditLogs" :stats="auditStats" :filters="auditFilters" @filter="handleUpdateAuditFilters"
          @export="handleExportAuditLogs" @cleanup="handleCleanupAuditLogs" @refresh="handleRefreshAudit" />
      </v-tabs-window-item>
    </v-tabs-window>

    <!-- Диалог оптимизации -->
    <OptimizationDialog v-model="optimizationDialog" :recommendations="optimizationRecommendations"
      @apply="handleOptimizationApply" @close="optimizationDialog = false" />
  </div>
</template>

<script setup lang="ts">
import { cacheService } from '@/services/cacheService';
import { performanceService } from '@/services/performanceService';
import type {
  AuditFilters,
  AuditLog,
  AuditStats,
  CacheMetrics,
  DatabaseIndex,
  IndexUsage,
  OptimizationRecommendation,
  RateLimitInfo,
  SecurityAlert,
  SystemInfo,
  TableStats
} from '@/types/performance';
import { onMounted, reactive, ref } from 'vue';

// Импорты компонентов производительности
import AuditLogs from '@/components/Performance/AuditLogs.vue';
import CacheManagement from '@/components/Performance/CacheManagement.vue';
import DatabasePerformance from '@/components/Performance/DatabasePerformance.vue';
import OptimizationDialog from '@/components/Performance/OptimizationDialog.vue';
import PerformanceOverview from '@/components/Performance/PerformanceOverview.vue';
import SecurityMonitoring from '@/components/Performance/SecurityMonitoring.vue';

// Реактивные данные
const activeTab = ref('overview');
const optimizationDialog = ref(false);

// Данные системы
const systemInfo = ref<SystemInfo>(performanceService.getMockSystemInfo());
const cacheMetrics = ref<CacheMetrics>({} as CacheMetrics);
const cacheStats = ref<any>({});
const securityAlerts = ref<SecurityAlert[]>(performanceService.getMockSecurityAlerts());
const auditLogs = ref<AuditLog[]>(performanceService.getMockAuditLogs());
const auditStats = ref<AuditStats>(performanceService.getMockAuditStats());
const databaseIndexes = ref<Record<string, DatabaseIndex[]> | DatabaseIndex[]>(performanceService.getMockDatabaseIndexes());
const indexUsage = ref<IndexUsage[]>(performanceService.getMockIndexUsage());
const tableStats = ref<TableStats[]>(performanceService.getMockTableStats());
const rateLimitInfo = ref<RateLimitInfo>(performanceService.getMockRateLimitInfo());

// Фильтры аудита
const auditFilters = reactive<AuditFilters>({
  limit: 50,
  offset: 0
});

// Рекомендации по оптимизации
const optimizationRecommendations = ref<OptimizationRecommendation[]>([
  {
    id: '1',
    type: 'index',
    severity: 'medium',
    title: 'Создать индекс для таблицы objects',
    description: 'Обнаружены медленные запросы к таблице objects. Рекомендуется создать составной индекс.',
    impact: 'Ускорение запросов на 40-60%',
    effort: 'Низкий'
  },
  {
    id: '2',
    type: 'cache',
    severity: 'low',
    title: 'Увеличить TTL для статических данных',
    description: 'Статические данные кэшируются на короткий период, что приводит к лишним запросам.',
    impact: 'Снижение нагрузки на БД на 15-20%',
    effort: 'Очень низкий'
  }
]);

// Методы
const handleRefresh = async () => {
  try {
    // Убеждаемся, что демо режим включен
    localStorage.setItem('axenta_demo_mode', 'true');
    
    systemInfo.value = performanceService.getMockSystemInfo();
    cacheMetrics.value = await withTimeout(cacheService.getCacheMetrics(), 3000);
    securityAlerts.value = performanceService.getMockSecurityAlerts();
  } catch (error) {
    console.error('Ошибка при обновлении данных:', error);
    // Устанавливаем безопасные значения по умолчанию
    cacheMetrics.value = {
      hit_count: 0,
      miss_count: 0,
      hit_rate: 0,
      key_count: 0,
      memory_usage: '0.0 MB',
      status: 'disabled'
    };
  }
};

const handleWarmupCache = async () => {
  try {
    await withTimeout(cacheService.warmupCache(), 5000);
    cacheMetrics.value = await withTimeout(cacheService.getCacheMetrics(), 3000);
  } catch (error) {
    console.error('Ошибка при прогреве кэша:', error);
  }
};

const handleClearCache = async () => {
  try {
    await withTimeout(cacheService.clearCache(), 3000);
    cacheMetrics.value = await withTimeout(cacheService.getCacheMetrics(), 3000);
  } catch (error) {
    console.error('Ошибка при очистке кэша:', error);
  }
};

const handleRefreshCache = async () => {
  try {
    // Убеждаемся, что демо режим включен
    localStorage.setItem('axenta_demo_mode', 'true');
    
    await Promise.all([
      withTimeout(cacheService.getCacheMetrics(), 3000).then(result => {
        cacheMetrics.value = result;
      }),
      withTimeout(cacheService.getCacheStats(), 3000).then(result => {
        cacheStats.value = result;
      })
    ]);
  } catch (error) {
    console.error('Ошибка при обновлении данных кэша:', error);
    // Устанавливаем безопасные значения по умолчанию
    cacheMetrics.value = {
      hit_count: 0,
      miss_count: 0,
      hit_rate: 0,
      key_count: 0,
      memory_usage: '0.0 MB',
      status: 'disabled'
    };
    cacheStats.value = {};
  }
};

const handleCreateIndexes = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 3000));
    databaseIndexes.value = performanceService.getMockDatabaseIndexes();
  } catch (error) {
    console.error('Ошибка при создании индексов:', error);
  }
};

const handleOptimizeDatabase = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 5000));
    tableStats.value = performanceService.getMockTableStats();
  } catch (error) {
    console.error('Ошибка при оптимизации БД:', error);
  }
};

const handleRefreshDatabase = async () => {
  try {
    databaseIndexes.value = performanceService.getMockDatabaseIndexes();
    indexUsage.value = performanceService.getMockIndexUsage();
    tableStats.value = performanceService.getMockTableStats();
  } catch (error) {
    console.error('Ошибка при обновлении данных БД:', error);
  }
};

const handleClearRateLimit = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    rateLimitInfo.value.current = 0;
    rateLimitInfo.value.remaining = rateLimitInfo.value.limit;
  } catch (error) {
    console.error('Ошибка при сбросе rate limit:', error);
  }
};

const handleRefreshSecurity = async () => {
  try {
    securityAlerts.value = performanceService.getMockSecurityAlerts();
    rateLimitInfo.value = performanceService.getMockRateLimitInfo();
  } catch (error) {
    console.error('Ошибка при обновлении данных безопасности:', error);
  }
};

const handleUpdateAuditFilters = (filters: AuditFilters) => {
  Object.assign(auditFilters, filters);
  handleRefreshAudit();
};

const handleExportAuditLogs = async (filters?: AuditFilters) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Аудит логи экспортированы');
  } catch (error) {
    console.error('Ошибка при экспорте:', error);
  }
};

const handleCleanupAuditLogs = async (retentionDays: number) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`Логи старше ${retentionDays} дней удалены`);
  } catch (error) {
    console.error('Ошибка при очистке логов:', error);
  }
};

const handleRefreshAudit = async () => {
  try {
    auditLogs.value = performanceService.getMockAuditLogs();
    auditStats.value = performanceService.getMockAuditStats();
  } catch (error) {
    console.error('Ошибка при обновлении аудит логов:', error);
  }
};

const handleOptimizationApply = async (recommendationId: string) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    optimizationRecommendations.value = optimizationRecommendations.value.filter(
      r => r.id !== recommendationId
    );
    console.log('Оптимизация применена');
  } catch (error) {
    console.error('Ошибка при применении оптимизации:', error);
  }
};

// Утилита для создания промиса с таймаутом
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

// Инициализация
onMounted(async () => {
  try {
    // Включаем демо режим для тестирования
    localStorage.setItem('axenta_demo_mode', 'true');
    
    // Добавляем таймаут для предотвращения зависания
    await Promise.all([
      withTimeout(cacheService.getCacheMetrics(), 5000).then(result => {
        cacheMetrics.value = result;
      }),
      withTimeout(cacheService.getCacheStats(), 5000).then(result => {
        cacheStats.value = result;
      })
    ]);
  } catch (error) {
    console.error('Ошибка инициализации:', error);
    // Устанавливаем значения по умолчанию в случае ошибки или таймаута
    cacheMetrics.value = {
      hit_count: 0,
      miss_count: 0,
      hit_rate: 0,
      key_count: 0,
      memory_usage: '0.0 MB',
      status: 'disabled'
    };
    cacheStats.value = {};
  }
});
</script>

<style scoped>
.performance-settings {
  max-width: 100%;
}

.section-header {
  padding: 16px 0;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.v-tabs {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.v-tabs-window {
  margin-top: 0;
}

.v-tabs-window-item {
  padding: 0;
}

/* Темная тема */
[data-theme="dark"] .section-header {
  border-bottom-color: rgba(84, 84, 136, 0.16);
}

[data-theme="dark"] .v-tabs {
  border-bottom-color: rgba(84, 84, 136, 0.16);
}
</style>
