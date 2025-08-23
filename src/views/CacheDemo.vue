<template>
  <div class="cache-demo-page">
    <!-- Заголовок -->
    <div class="demo-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <v-icon start color="primary">mdi-memory</v-icon>
            Демо интерфейса управления кэшем
          </h1>
          <p class="page-subtitle">
            Интерактивная демонстрация возможностей системы кэширования Redis
          </p>
        </div>
        
        <div class="demo-controls">
          <v-chip 
            color="success" 
            variant="outlined"
            prepend-icon="mdi-play"
            size="large"
          >
            Демо режим активен
          </v-chip>
          
          <v-btn
            color="primary"
            variant="outlined"
            prepend-icon="mdi-refresh"
            @click="resetDemo"
          >
            Сбросить демо
          </v-btn>
        </div>
      </div>

      <!-- Информационные карточки -->
      <div class="info-cards">
        <v-card class="info-card" variant="outlined">
          <v-card-text>
            <div class="info-content">
              <v-icon color="info" size="32">mdi-information</v-icon>
              <div>
                <h3>Реальные данные</h3>
                <p>Все метрики обновляются в реальном времени и имитируют работу настоящего Redis кэша</p>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="info-card" variant="outlined">
          <v-card-text>
            <div class="info-content">
              <v-icon color="success" size="32">mdi-chart-line</v-icon>
              <div>
                <h3>Интерактивные графики</h3>
                <p>Графики производительности показывают динамику работы кэша за последние 24 часа</p>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="info-card" variant="outlined">
          <v-card-text>
            <div class="info-content">
              <v-icon color="warning" size="32">mdi-cog</v-icon>
              <div>
                <h3>Управление кэшем</h3>
                <p>Тестируйте операции прогрева, очистки и мониторинга без влияния на реальную систему</p>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Основной интерфейс кэша -->
    <div class="cache-interface">
      <CacheManagement 
        :metrics="cacheMetrics"
        :cache-stats="cacheStats"
        @warmup="handleWarmup"
        @clear="handleClear"
        @refresh="handleRefresh"
      />
    </div>

    <!-- Дополнительные демо панели -->
    <div class="demo-panels">
      <!-- Топ ключей кэша -->
      <v-card class="demo-panel">
        <v-card-title>
          <v-icon start>mdi-key-variant</v-icon>
          Топ ключей кэша
        </v-card-title>
        
        <v-card-text>
          <div class="keys-list">
            <div 
              v-for="key in topKeys" 
              :key="key.key"
              class="key-item"
            >
              <div class="key-info">
                <div class="key-name">{{ key.key }}</div>
                <div class="key-details">
                  <v-chip size="x-small" color="primary">{{ key.type }}</v-chip>
                  <span class="key-stat">{{ key.hits.toLocaleString() }} hits</span>
                  <span class="key-stat">{{ key.size }}</span>
                  <span class="key-stat">TTL: {{ key.ttl }}</span>
                </div>
              </div>
              
              <div class="key-actions">
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-information"
                  @click="showKeyInfo(key)"
                />
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-delete"
                  color="error"
                  @click="deleteKey(key.key)"
                />
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- События кэша -->
      <v-card class="demo-panel">
        <v-card-title>
          <v-icon start>mdi-history</v-icon>
          Последние события
        </v-card-title>
        
        <v-card-text>
          <div class="events-list">
            <div 
              v-for="event in cacheEvents" 
              :key="event.id"
              class="event-item"
            >
              <div class="event-indicator">
                <v-icon 
                  :color="getEventColor(event.severity)"
                  size="16"
                >
                  {{ getEventIcon(event.type) }}
                </v-icon>
              </div>
              
              <div class="event-content">
                <div class="event-message">{{ event.message }}</div>
                <div class="event-time">
                  {{ formatTime(event.timestamp) }}
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Статистика по типам ключей -->
      <v-card class="demo-panel">
        <v-card-title>
          <v-icon start>mdi-chart-pie</v-icon>
          Распределение по типам
        </v-card-title>
        
        <v-card-text>
          <div class="key-types-stats">
            <div 
              v-for="(stats, type) in keyTypesStats" 
              :key="type"
              class="type-stat"
            >
              <div class="type-header">
                <span class="type-name">{{ type.toUpperCase() }}</span>
                <span class="type-percentage">{{ stats.percentage }}%</span>
              </div>
              
              <v-progress-linear
                :model-value="stats.percentage"
                :color="getTypeColor(type)"
                height="8"
                rounded
              />
              
              <div class="type-details">
                <span>{{ stats.count.toLocaleString() }} ключей</span>
                <span>{{ stats.memory }}</span>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Диалог информации о ключе -->
    <v-dialog v-model="showKeyDialog" max-width="500">
      <v-card v-if="selectedKey">
        <v-card-title>
          <v-icon start>mdi-key-variant</v-icon>
          Информация о ключе
        </v-card-title>
        
        <v-card-text>
          <div class="key-details-dialog">
            <div class="detail-row">
              <span class="detail-label">Ключ:</span>
              <code class="detail-value">{{ selectedKey.key }}</code>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Тип:</span>
              <v-chip size="small" :color="getTypeColor(selectedKey.type)">
                {{ selectedKey.type }}
              </v-chip>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Попадания:</span>
              <span class="detail-value">{{ selectedKey.hits.toLocaleString() }}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Размер:</span>
              <span class="detail-value">{{ selectedKey.size }}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">TTL:</span>
              <span class="detail-value">{{ selectedKey.ttl }}</span>
            </div>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            @click="showKeyDialog = false"
          >
            Закрыть
          </v-btn>
          <v-btn
            color="primary"
            variant="text"
            @click="editKeyTTL"
          >
            Изменить TTL
          </v-btn>
        </v-card-actions>
      </v-card>
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
import { cacheService } from '@/services/cacheService'
import { mockTopCacheKeys, mockCacheKeyTypes, mockCacheEvents } from '@/services/mockCacheData'
import type { CacheMetrics } from '@/types/performance'
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

// Импорт компонентов
import CacheManagement from '@/components/Performance/CacheManagement.vue'

// Реактивные данные
const cacheMetrics = ref<CacheMetrics>({} as CacheMetrics)
const cacheStats = ref<any>({})
const topKeys = ref(mockTopCacheKeys)
const cacheEvents = ref(mockCacheEvents)
const keyTypesStats = ref(mockCacheKeyTypes)

// Диалоги
const showKeyDialog = ref(false)
const selectedKey = ref<any>(null)

// Подписка на обновления
let unsubscribeFromCache: (() => void) | null = null

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

const handleWarmup = async () => {
  try {
    const result = await cacheService.warmupCache()
    showSnackbar(result.message, result.success ? 'success' : 'error')
  } catch (error) {
    showSnackbar('Ошибка при прогреве кэша', 'error')
  }
}

const handleClear = async () => {
  try {
    const result = await cacheService.clearCache()
    showSnackbar(result.message, result.success ? 'success' : 'error')
    
    if (result.success) {
      // Обновляем топ ключи после очистки
      topKeys.value = []
      cacheEvents.value.unshift({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: 'cache_clear',
        message: 'Кэш был полностью очищен',
        severity: 'info'
      })
    }
  } catch (error) {
    showSnackbar('Ошибка при очистке кэша', 'error')
  }
}

const handleRefresh = async () => {
  try {
    cacheMetrics.value = await cacheService.getCacheMetrics()
    cacheStats.value = await cacheService.getCacheStats()
    topKeys.value = await cacheService.getTopCacheKeys()
    cacheEvents.value = await cacheService.getCacheEvents()
    keyTypesStats.value = await cacheService.getCacheKeyTypes()
    
    showSnackbar('Данные обновлены')
  } catch (error) {
    showSnackbar('Ошибка при обновлении данных', 'error')
  }
}

const showKeyInfo = (key: any) => {
  selectedKey.value = key
  showKeyDialog.value = true
}

const deleteKey = async (keyName: string) => {
  try {
    const result = await cacheService.deleteKey(keyName)
    showSnackbar(result.message, result.success ? 'success' : 'error')
    
    if (result.success) {
      // Удаляем ключ из списка
      topKeys.value = topKeys.value.filter(k => k.key !== keyName)
      
      // Добавляем событие
      cacheEvents.value.unshift({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: 'key_deleted',
        message: `Ключ "${keyName}" был удален`,
        severity: 'info'
      })
    }
  } catch (error) {
    showSnackbar('Ошибка при удалении ключа', 'error')
  }
}

const editKeyTTL = async () => {
  if (!selectedKey.value) return
  
  const newTTL = prompt('Введите новый TTL в секундах:', '3600')
  if (newTTL && !isNaN(Number(newTTL))) {
    try {
      const result = await cacheService.setKeyTTL(selectedKey.value.key, Number(newTTL))
      showSnackbar(result.message, result.success ? 'success' : 'error')
      
      if (result.success) {
        // Обновляем TTL в списке
        const minutes = Math.floor(Number(newTTL) / 60)
        selectedKey.value.ttl = `${minutes}m`
        
        const keyIndex = topKeys.value.findIndex(k => k.key === selectedKey.value.key)
        if (keyIndex !== -1) {
          topKeys.value[keyIndex].ttl = `${minutes}m`
        }
      }
      
      showKeyDialog.value = false
    } catch (error) {
      showSnackbar('Ошибка при изменении TTL', 'error')
    }
  }
}

const resetDemo = async () => {
  try {
    // Сбрасываем все данные к начальным значениям
    await cacheService.clearCache()
    
    // Загружаем свежие демо данные
    setTimeout(async () => {
      await cacheService.warmupCache()
      await handleRefresh()
      showSnackbar('Демо данные сброшены и перезагружены')
    }, 1000)
  } catch (error) {
    showSnackbar('Ошибка при сбросе демо', 'error')
  }
}

const formatTime = (timestamp: string): string => {
  return formatDistanceToNow(new Date(timestamp), { 
    addSuffix: true, 
    locale: ru 
  })
}

const getEventColor = (severity: string): string => {
  const colors: Record<string, string> = {
    info: 'info',
    success: 'success',
    warning: 'warning',
    error: 'error'
  }
  return colors[severity] || 'grey'
}

const getEventIcon = (type: string): string => {
  const icons: Record<string, string> = {
    cache_clear: 'mdi-delete-sweep',
    cache_warmup: 'mdi-fire',
    memory_warning: 'mdi-memory',
    hit_rate_low: 'mdi-trending-down',
    connection_restored: 'mdi-connection',
    key_deleted: 'mdi-key-remove'
  }
  return icons[type] || 'mdi-information'
}

const getTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    string: 'blue',
    hash: 'green',
    json: 'orange',
    set: 'purple',
    list: 'red'
  }
  return colors[type] || 'grey'
}

// Инициализация
onMounted(async () => {
  // Загружаем начальные данные
  cacheMetrics.value = await cacheService.getCacheMetrics()
  cacheStats.value = await cacheService.getCacheStats()
  topKeys.value = await cacheService.getTopCacheKeys()
  cacheEvents.value = await cacheService.getCacheEvents()
  keyTypesStats.value = await cacheService.getCacheKeyTypes()
  
  // Подписываемся на обновления в реальном времени
  unsubscribeFromCache = cacheService.subscribeToMetrics((metrics) => {
    cacheMetrics.value = metrics
  })
})

// Очистка при размонтировании
onUnmounted(() => {
  if (unsubscribeFromCache) {
    unsubscribeFromCache()
  }
})
</script>

<style scoped>
.cache-demo-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.demo-header {
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
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-section p {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 1rem;
}

.demo-controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.info-card {
  border: 1px solid rgba(var(--v-theme-outline-variant), 0.2);
}

.info-content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.info-content h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: rgb(var(--v-theme-on-surface));
}

.info-content p {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.875rem;
  line-height: 1.4;
}

.cache-interface {
  margin-bottom: 32px;
}

.demo-panels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.demo-panel {
  border: 1px solid rgba(var(--v-theme-outline-variant), 0.2);
}

.keys-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.key-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid rgba(var(--v-theme-outline-variant), 0.2);
  border-radius: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

.key-info {
  flex: 1;
}

.key-name {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 4px;
}

.key-details {
  display: flex;
  gap: 12px;
  align-items: center;
}

.key-stat {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.key-actions {
  display: flex;
  gap: 4px;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.event-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid rgba(var(--v-theme-outline-variant), 0.1);
}

.event-item:last-child {
  border-bottom: none;
}

.event-indicator {
  flex-shrink: 0;
  margin-top: 2px;
}

.event-content {
  flex: 1;
}

.event-message {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 4px;
}

.event-time {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.key-types-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.type-stat {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.type-name {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.type-percentage {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.type-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.key-details-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(var(--v-theme-outline-variant), 0.1);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
}

.detail-value {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

@media (max-width: 768px) {
  .cache-demo-page {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .info-cards {
    grid-template-columns: 1fr;
  }
  
  .demo-panels {
    grid-template-columns: 1fr;
  }
  
  .key-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .key-details {
    flex-wrap: wrap;
  }
}
</style>
