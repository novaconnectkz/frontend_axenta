import type { CacheMetrics, CacheStats, RealTimeMetrics } from '@/types/performance'

// Демо данные для метрик кэша
export const mockCacheMetrics: CacheMetrics = {
  hit_count: 45678,
  miss_count: 3421,
  hit_rate: 93.0,
  key_count: 12847,
  memory_usage: "256.7 MB",
  status: "enabled"
}

// Демо данные для статистики кэша
export const mockCacheStats: CacheStats = {
  status: "active",
  key_count: 12847,
  memory: "256.7 MB"
}

// Генерация исторических данных для графиков
export const generateCacheHistoryData = () => {
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = (new Date().getHours() - 23 + i + 24) % 24
    return `${hour.toString().padStart(2, '0')}:00`
  })

  const hitRateData = Array.from({ length: 24 }, (_, i) => {
    // Симуляция реалистичных данных с небольшими колебаниями
    const baseRate = 90 + Math.sin(i * 0.5) * 5 // Базовый уровень 85-95%
    const noise = (Math.random() - 0.5) * 4 // Случайные колебания ±2%
    return Math.max(80, Math.min(98, baseRate + noise))
  })

  const responseTimeData = Array.from({ length: 24 }, (_, i) => {
    // Симуляция времени ответа с пиками в часы пик
    const isPeakHour = (i >= 8 && i <= 10) || (i >= 18 && i <= 20)
    const baseTime = isPeakHour ? 25 : 15
    const noise = Math.random() * 10
    return Math.max(5, baseTime + noise)
  })

  const memoryUsageData = Array.from({ length: 24 }, (_, i) => {
    // Симуляция использования памяти
    const baseUsage = 200 + Math.sin(i * 0.3) * 50
    const noise = (Math.random() - 0.5) * 20
    return Math.max(150, Math.min(350, baseUsage + noise))
  })

  const requestsPerSecondData = Array.from({ length: 24 }, (_, i) => {
    // Симуляция количества запросов в секунду
    const isPeakHour = (i >= 8 && i <= 10) || (i >= 18 && i <= 20)
    const baseRequests = isPeakHour ? 150 : 80
    const noise = Math.random() * 30
    return Math.max(20, baseRequests + noise)
  })

  return {
    labels: hours,
    hitRate: hitRateData,
    responseTime: responseTimeData,
    memoryUsage: memoryUsageData,
    requestsPerSecond: requestsPerSecondData
  }
}

// Демо данные для топ ключей кэша
export const mockTopCacheKeys = [
  {
    key: "user_sessions:*",
    hits: 12456,
    size: "45.2 MB",
    ttl: "1h",
    type: "hash"
  },
  {
    key: "api_responses:companies:*",
    hits: 8934,
    size: "23.1 MB", 
    ttl: "30m",
    type: "string"
  },
  {
    key: "dashboard_widgets:*",
    hits: 6721,
    size: "18.7 MB",
    ttl: "15m", 
    type: "json"
  },
  {
    key: "user_permissions:*",
    hits: 5432,
    size: "12.3 MB",
    ttl: "2h",
    type: "set"
  },
  {
    key: "reports_cache:*",
    hits: 3876,
    size: "34.5 MB",
    ttl: "1h",
    type: "string"
  },
  {
    key: "installation_data:*",
    hits: 2945,
    size: "15.8 MB",
    ttl: "45m",
    type: "hash"
  },
  {
    key: "warehouse_inventory:*",
    hits: 2134,
    size: "8.9 MB",
    ttl: "20m",
    type: "list"
  },
  {
    key: "contract_details:*",
    hits: 1876,
    size: "11.2 MB",
    ttl: "1h",
    type: "json"
  }
]

// Демо данные для статистики по типам ключей
export const mockCacheKeyTypes = {
  string: { count: 5432, memory: "89.3 MB", percentage: 42.3 },
  hash: { count: 3456, memory: "76.1 MB", percentage: 26.9 },
  json: { count: 2341, memory: "45.7 MB", percentage: 18.2 },
  set: { count: 1234, memory: "23.4 MB", percentage: 9.6 },
  list: { count: 384, memory: "22.2 MB", percentage: 3.0 }
}

// Генерация данных в реальном времени
export const generateRealTimeMetrics = (): RealTimeMetrics => {
  const now = new Date()
  
  return {
    timestamp: now.toISOString(),
    cache_hit_rate: 90 + Math.random() * 8, // 90-98%
    active_connections: 45 + Math.floor(Math.random() * 20), // 45-65
    queries_per_second: 120 + Math.floor(Math.random() * 60), // 120-180
    response_time: 15 + Math.random() * 10, // 15-25ms
    error_rate: Math.random() * 0.5 // 0-0.5%
  }
}

// Демо данные для событий кэша
export const mockCacheEvents = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    type: "cache_clear",
    message: "Кэш был очищен пользователем admin",
    severity: "info" as const
  },
  {
    id: "2", 
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    type: "cache_warmup",
    message: "Выполнен прогрев кэша для основных данных",
    severity: "success" as const
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    type: "memory_warning",
    message: "Использование памяти кэша превысило 80%",
    severity: "warning" as const
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    type: "hit_rate_low",
    message: "Коэффициент попаданий упал ниже 85%",
    severity: "warning" as const
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    type: "connection_restored",
    message: "Соединение с Redis восстановлено",
    severity: "success" as const
  }
]

// Функция для симуляции изменения метрик
export const updateCacheMetrics = (currentMetrics: CacheMetrics): CacheMetrics => {
  const hitCountIncrease = Math.floor(Math.random() * 50) + 10
  const missCountIncrease = Math.floor(Math.random() * 5) + 1
  
  const newHitCount = currentMetrics.hit_count + hitCountIncrease
  const newMissCount = currentMetrics.miss_count + missCountIncrease
  const newHitRate = (newHitCount / (newHitCount + newMissCount)) * 100
  
  const keyCountChange = Math.floor(Math.random() * 20) - 10 // ±10 ключей
  const newKeyCount = Math.max(0, currentMetrics.key_count + keyCountChange)
  
  // Симуляция изменения использования памяти
  const memoryValue = parseFloat(currentMetrics.memory_usage.replace(/[^\d.]/g, ''))
  const memoryChange = (Math.random() - 0.5) * 10 // ±5 MB
  const newMemoryValue = Math.max(100, memoryValue + memoryChange)
  
  return {
    ...currentMetrics,
    hit_count: newHitCount,
    miss_count: newMissCount,
    hit_rate: Number(newHitRate.toFixed(1)),
    key_count: newKeyCount,
    memory_usage: `${newMemoryValue.toFixed(1)} MB`
  }
}

// Конфигурация для демо режима
export const cacheConfig = {
  updateInterval: 5000, // 5 секунд
  maxHistoryPoints: 50,
  alertThresholds: {
    hitRate: 85, // Минимальный процент попаданий
    memoryUsage: 80, // Максимальный процент использования памяти
    responseTime: 50 // Максимальное время ответа в мс
  }
}
