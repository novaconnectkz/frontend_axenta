<template>
  <div class="system-health-tab">
    <!-- Заголовок и действия -->
    <div class="tab-header">
      <div class="header-info">
        <h3>Мониторинг системы</h3>
        <p>Состояние сервисов, производительность и доступность системы</p>
      </div>
      <div class="header-actions">
        <v-btn color="primary" variant="elevated" @click="runHealthCheck" :loading="checking">
          <v-icon icon="mdi-heart-pulse" class="mr-2" />
          Проверить здоровье
        </v-btn>
        <v-btn color="secondary" variant="outlined" @click="$emit('refresh')">
          <v-icon icon="mdi-refresh" class="mr-2" />
          Обновить
        </v-btn>
      </div>
    </div>

    <!-- Общее состояние системы -->
    <div class="overall-health-section">
      <v-card class="overall-health-card" elevation="3" :class="getOverallHealthClass(health?.overall)">
        <v-card-text class="text-center">
          <div class="health-icon-container">
            <v-icon :icon="getOverallHealthIcon(health?.overall)" :color="getOverallHealthColor(health?.overall)"
              size="64" />
          </div>
          <h2 class="health-status">
            {{ getOverallHealthText(health?.overall) }}
          </h2>
          <p class="health-subtitle">
            Общее состояние системы
          </p>
          <div class="health-meta">
            <div class="meta-item">
              <v-icon icon="mdi-clock" size="small" class="mr-1" />
              Последняя проверка: {{ health ? formatDate(health.lastCheck) : '—' }}
            </div>
            <div class="meta-item">
              <v-icon icon="mdi-chart-line" size="small" class="mr-1" />
              Uptime: {{ health ? health.uptime : 0 }}%
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Сервисы -->
    <div class="services-section">
      <h4 class="section-title">
        <v-icon icon="mdi-server-network" class="mr-2" />
        Состояние сервисов
      </h4>

      <v-row>
        <v-col v-for="service in health?.services || []" :key="service.name" cols="12" md="6" lg="4">
          <v-card class="service-card" elevation="2" :class="getServiceCardClass(service.status)">
            <v-card-title class="d-flex align-center">
              <v-icon :icon="getServiceIcon(service.name)" :color="getServiceColor(service.status)" class="mr-2" />
              {{ service.name }}
              <v-spacer />
              <v-chip :color="getServiceColor(service.status)" size="small" variant="elevated">
                <v-icon :icon="getServiceStatusIcon(service.status)" size="small" class="mr-1" />
                {{ getServiceStatusText(service.status) }}
              </v-chip>
            </v-card-title>

            <v-card-text>
              <div class="service-metrics">
                <div class="metric-item">
                  <div class="metric-header">
                    <span class="metric-label">Время ответа</span>
                    <span class="metric-value">{{ service.responseTime }}ms</span>
                  </div>
                  <v-progress-linear :model-value="Math.min((service.responseTime / 200) * 100, 100)"
                    :color="getResponseTimeColor(service.responseTime)" height="6" />
                </div>

                <div class="metric-item">
                  <div class="metric-header">
                    <span class="metric-label">Частота ошибок</span>
                    <span class="metric-value">{{ service.errorRate }}%</span>
                  </div>
                  <v-progress-linear :model-value="service.errorRate" :color="getErrorRateColor(service.errorRate)"
                    height="6" />
                </div>
              </div>

              <div class="service-info">
                <div class="info-row" v-if="service.url">
                  <span class="info-label">URL:</span>
                  <a :href="service.url" target="_blank" class="info-value link">
                    {{ service.url }}
                  </a>
                </div>
                <div class="info-row">
                  <span class="info-label">Последняя проверка:</span>
                  <span class="info-value">{{ formatDate(service.lastCheck) }}</span>
                </div>
              </div>
            </v-card-text>

            <v-card-actions>
              <v-btn size="small" variant="outlined" @click="checkService(service)"
                :loading="checkingServices.includes(service.name)">
                <v-icon icon="mdi-heart-pulse" class="mr-1" />
                Проверить
              </v-btn>
              <v-btn size="small" variant="text" @click="viewServiceDetails(service)">
                <v-icon icon="mdi-chart-line" class="mr-1" />
                Метрики
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Статистика производительности -->
    <div class="performance-section">
      <h4 class="section-title">
        <v-icon icon="mdi-speedometer" class="mr-2" />
        Производительность
      </h4>

      <v-row>
        <v-col cols="12" md="3">
          <v-card class="performance-card" elevation="2">
            <v-card-text class="text-center">
              <div class="performance-icon">
                <v-icon icon="mdi-clock-fast" color="primary" size="32" />
              </div>
              <div class="performance-value">
                {{ getAverageResponseTime() }}ms
              </div>
              <div class="performance-label">
                Среднее время ответа
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card class="performance-card" elevation="2">
            <v-card-text class="text-center">
              <div class="performance-icon">
                <v-icon icon="mdi-alert-circle" color="warning" size="32" />
              </div>
              <div class="performance-value">
                {{ getAverageErrorRate() }}%
              </div>
              <div class="performance-label">
                Средняя частота ошибок
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card class="performance-card" elevation="2">
            <v-card-text class="text-center">
              <div class="performance-icon">
                <v-icon icon="mdi-check-circle" color="success" size="32" />
              </div>
              <div class="performance-value">
                {{ getHealthyServicesCount() }}/{{ getTotalServicesCount() }}
              </div>
              <div class="performance-label">
                Здоровые сервисы
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card class="performance-card" elevation="2">
            <v-card-text class="text-center">
              <div class="performance-icon">
                <v-icon icon="mdi-chart-line" color="info" size="32" />
              </div>
              <div class="performance-value">
                {{ health?.uptime || 0 }}%
              </div>
              <div class="performance-label">
                Общий Uptime
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Диалог деталей сервиса -->
    <v-dialog v-model="serviceDetailsDialog" max-width="800px">
      <v-card v-if="selectedService">
        <v-card-title class="d-flex align-center">
          <v-icon :icon="getServiceIcon(selectedService.name)" :color="getServiceColor(selectedService.status)"
            class="mr-2" />
          Детали сервиса: {{ selectedService.name }}
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="serviceDetailsDialog = false" />
        </v-card-title>

        <v-card-text>
          <div class="service-details">
            <div class="details-section">
              <h5>Основная информация</h5>
              <div class="details-grid">
                <div class="detail-item">
                  <span class="detail-label">Статус:</span>
                  <v-chip :color="getServiceColor(selectedService.status)" size="small" variant="elevated">
                    {{ getServiceStatusText(selectedService.status) }}
                  </v-chip>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Время ответа:</span>
                  <span class="detail-value">{{ selectedService.responseTime }}ms</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Частота ошибок:</span>
                  <span class="detail-value">{{ selectedService.errorRate }}%</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Последняя проверка:</span>
                  <span class="detail-value">{{ formatDate(selectedService.lastCheck) }}</span>
                </div>
              </div>
            </div>

            <div class="details-section" v-if="selectedService.url">
              <h5>Подключение</h5>
              <div class="connection-info">
                <div class="connection-item">
                  <span class="connection-label">URL:</span>
                  <a :href="selectedService.url" target="_blank" class="connection-value">
                    {{ selectedService.url }}
                  </a>
                </div>
              </div>
            </div>

            <div class="details-section">
              <h5>Рекомендации</h5>
              <div class="recommendations">
                <v-alert v-if="selectedService.status === 'down'" type="error" variant="tonal" class="mb-3">
                  Сервис недоступен. Проверьте подключение и перезапустите сервис.
                </v-alert>
                <v-alert v-else-if="selectedService.status === 'degraded'" type="warning" variant="tonal" class="mb-3">
                  Производительность сервиса снижена. Рассмотрите возможность масштабирования.
                </v-alert>
                <v-alert v-else-if="selectedService.responseTime > 100" type="info" variant="tonal" class="mb-3">
                  Время ответа превышает рекомендуемое значение. Оптимизируйте производительность.
                </v-alert>
                <v-alert v-else type="success" variant="tonal" class="mb-3">
                  Сервис работает в штатном режиме.
                </v-alert>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-btn color="primary" @click="checkService(selectedService)"
            :loading="checkingServices.includes(selectedService.name)">
            <v-icon icon="mdi-heart-pulse" class="mr-2" />
            Проверить сейчас
          </v-btn>
          <v-spacer />
          <v-btn color="secondary" @click="serviceDetailsDialog = false">
            Закрыть
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { ServiceHealth, SystemHealth } from '@/types/documentation';
import { computed, ref } from 'vue';

// Props
interface Props {
  health: SystemHealth | null;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  refresh: [];
}>();

// Реактивные данные
const checking = ref(false);
const checkingServices = ref<string[]>([]);
const serviceDetailsDialog = ref(false);
const selectedService = ref<ServiceHealth | null>(null);

// Методы
const getOverallHealthIcon = (status?: string) => {
  const icons: Record<string, string> = {
    healthy: 'mdi-heart',
    warning: 'mdi-heart-pulse',
    critical: 'mdi-heart-broken'
  };
  return icons[status || ''] || 'mdi-help';
};

const getOverallHealthColor = (status?: string) => {
  const colors: Record<string, string> = {
    healthy: 'success',
    warning: 'warning',
    critical: 'error'
  };
  return colors[status || ''] || 'default';
};

const getOverallHealthClass = (status?: string) => {
  return {
    'health-healthy': status === 'healthy',
    'health-warning': status === 'warning',
    'health-critical': status === 'critical'
  };
};

const getOverallHealthText = (status?: string) => {
  const texts: Record<string, string> = {
    healthy: 'Система здорова',
    warning: 'Требует внимания',
    critical: 'Критическое состояние'
  };
  return texts[status || ''] || 'Неизвестно';
};

const getServiceIcon = (serviceName: string) => {
  const icons: Record<string, string> = {
    'API Gateway': 'mdi-api',
    'Database': 'mdi-database',
    'Redis Cache': 'mdi-memory',
    'File Storage': 'mdi-folder'
  };
  return icons[serviceName] || 'mdi-server';
};

const getServiceColor = (status: string) => {
  const colors: Record<string, string> = {
    up: 'success',
    down: 'error',
    degraded: 'warning'
  };
  return colors[status] || 'default';
};

const getServiceCardClass = (status: string) => {
  return {
    'service-up': status === 'up',
    'service-down': status === 'down',
    'service-degraded': status === 'degraded'
  };
};

const getServiceStatusIcon = (status: string) => {
  const icons: Record<string, string> = {
    up: 'mdi-check',
    down: 'mdi-close',
    degraded: 'mdi-alert'
  };
  return icons[status] || 'mdi-help';
};

const getServiceStatusText = (status: string) => {
  const texts: Record<string, string> = {
    up: 'Работает',
    down: 'Недоступен',
    degraded: 'Снижена производительность'
  };
  return texts[status] || status;
};

const getResponseTimeColor = (responseTime: number) => {
  if (responseTime < 50) return 'success';
  if (responseTime < 100) return 'warning';
  return 'error';
};

const getErrorRateColor = (errorRate: number) => {
  if (errorRate < 1) return 'success';
  if (errorRate < 5) return 'warning';
  return 'error';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Вычисляемые свойства
const getAverageResponseTime = computed(() => {
  if (!props.health?.services.length) return 0;
  const total = props.health.services.reduce((sum, service) => sum + service.responseTime, 0);
  return Math.round(total / props.health.services.length);
});

const getAverageErrorRate = computed(() => {
  if (!props.health?.services.length) return 0;
  const total = props.health.services.reduce((sum, service) => sum + service.errorRate, 0);
  return (total / props.health.services.length).toFixed(1);
});

const getHealthyServicesCount = computed(() => {
  if (!props.health?.services.length) return 0;
  return props.health.services.filter(service => service.status === 'up').length;
});

const getTotalServicesCount = computed(() => {
  return props.health?.services.length || 0;
});

// Методы действий
const runHealthCheck = async () => {
  checking.value = true;
  try {
    // Имитация проверки здоровья
    await new Promise(resolve => setTimeout(resolve, 2000));
    emit('refresh');
  } finally {
    checking.value = false;
  }
};

const checkService = async (service: ServiceHealth) => {
  checkingServices.value.push(service.name);
  try {
    // Имитация проверки сервиса
    await new Promise(resolve => setTimeout(resolve, 1000));
    emit('refresh');
  } finally {
    checkingServices.value = checkingServices.value.filter(name => name !== service.name);
  }
};

const viewServiceDetails = (service: ServiceHealth) => {
  selectedService.value = service;
  serviceDetailsDialog.value = true;
};
</script>

<style scoped>
.system-health-tab {
  height: 100%;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
}

.header-info h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--v-theme-primary);
  margin-bottom: 4px;
}

.header-info p {
  color: var(--v-theme-on-surface-variant);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--v-theme-primary);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.overall-health-section {
  margin-bottom: 32px;
}

.overall-health-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.health-healthy {
  border-left: 6px solid var(--v-theme-success);
  background: linear-gradient(135deg, var(--v-theme-success-lighten-5) 0%, var(--v-theme-surface) 100%);
}

.health-warning {
  border-left: 6px solid var(--v-theme-warning);
  background: linear-gradient(135deg, var(--v-theme-warning-lighten-5) 0%, var(--v-theme-surface) 100%);
}

.health-critical {
  border-left: 6px solid var(--v-theme-error);
  background: linear-gradient(135deg, var(--v-theme-error-lighten-5) 0%, var(--v-theme-surface) 100%);
}

.health-icon-container {
  margin-bottom: 16px;
}

.health-status {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.health-subtitle {
  font-size: 1.1rem;
  color: var(--v-theme-on-surface-variant);
  margin-bottom: 16px;
}

.health-meta {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: var(--v-theme-on-surface-variant);
}

.services-section,
.performance-section {
  margin-bottom: 32px;
}

.service-card {
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.service-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.service-up {
  border-left: 4px solid var(--v-theme-success);
}

.service-down {
  border-left: 4px solid var(--v-theme-error);
}

.service-degraded {
  border-left: 4px solid var(--v-theme-warning);
}

.service-metrics {
  margin-bottom: 16px;
}

.metric-item {
  margin-bottom: 12px;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 0.9rem;
  color: var(--v-theme-on-surface-variant);
}

.metric-value {
  font-weight: 600;
  font-size: 0.9rem;
}

.service-info {
  margin-top: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.info-label {
  font-weight: 500;
  color: var(--v-theme-on-surface-variant);
  font-size: 0.9rem;
}

.info-value {
  font-weight: 400;
  font-size: 0.9rem;
}

.info-value.link {
  color: var(--v-theme-primary);
  text-decoration: none;
}

.info-value.link:hover {
  text-decoration: underline;
}

.performance-card {
  height: 100%;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.performance-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.performance-icon {
  margin-bottom: 12px;
}

.performance-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--v-theme-primary);
  margin-bottom: 8px;
}

.performance-label {
  font-size: 0.9rem;
  color: var(--v-theme-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.service-details {
  max-height: 500px;
  overflow-y: auto;
}

.details-section {
  margin-bottom: 24px;
}

.details-section h5 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--v-theme-primary);
  margin-bottom: 12px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--v-theme-surface-variant);
  border-radius: 6px;
}

.detail-label {
  font-weight: 500;
  color: var(--v-theme-on-surface-variant);
}

.detail-value {
  font-weight: 600;
}

.connection-info {
  background: var(--v-theme-surface-variant);
  border-radius: 8px;
  padding: 16px;
}

.connection-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.connection-label {
  font-weight: 500;
  color: var(--v-theme-on-surface-variant);
}

.connection-value {
  color: var(--v-theme-primary);
  text-decoration: none;
}

.connection-value:hover {
  text-decoration: underline;
}

.recommendations {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Адаптивность */
@media (max-width: 768px) {
  .tab-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: stretch;
  }

  .header-actions .v-btn {
    flex: 1;
  }

  .health-meta {
    flex-direction: column;
    gap: 8px;
  }

  .info-row,
  .detail-item,
  .connection-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
