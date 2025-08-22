<template>
  <div class="security-monitoring">
    <!-- Алерты безопасности -->
    <v-card class="alerts-card mb-6" :class="{ 'has-alerts': alerts.length > 0 }">
      <v-card-title>
        <v-icon start :color="alerts.length > 0 ? 'error' : 'success'">
          {{ alerts.length > 0 ? 'mdi-shield-alert' : 'mdi-shield-check' }}
        </v-icon>
        Алерты безопасности

        <v-spacer />

        <v-chip :color="alerts.length > 0 ? 'error' : 'success'" size="small">
          {{ alerts.length }}
        </v-chip>
      </v-card-title>

      <v-card-text>
        <div v-if="alerts.length === 0" class="no-alerts">
          <v-icon color="success" size="48">mdi-shield-check</v-icon>
          <h3>Угроз не обнаружено</h3>
          <p>Система безопасности работает нормально</p>
        </div>

        <div v-else class="alerts-list">
          <div v-for="alert in alerts" :key="alert.type + alert.detected_at" class="alert-item"
            :class="`alert-${alert.severity}`">
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

              <div class="alert-actions">
                <v-btn icon="mdi-information" variant="text" size="small" @click="viewAlertDetails(alert)" />
              </div>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions v-if="alerts.length > 0">
        <v-btn color="primary" variant="outlined" prepend-icon="mdi-refresh" @click="$emit('refresh')">
          Обновить
        </v-btn>

        <v-spacer />

        <v-btn color="error" variant="text" prepend-icon="mdi-alert-remove" @click="acknowledgeAllAlerts">
          Подтвердить все
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Rate Limiting информация -->
    <v-card class="rate-limit-card mb-6">
      <v-card-title>
        <v-icon start>mdi-speedometer</v-icon>
        Rate Limiting
      </v-card-title>

      <v-card-text>
        <div class="rate-limit-info">
          <div class="rate-limit-stats">
            <div class="stat-item">
              <div class="stat-label">Текущие запросы</div>
              <div class="stat-value">{{ rateLimitInfo.current }}</div>
            </div>

            <div class="stat-item">
              <div class="stat-label">Лимит</div>
              <div class="stat-value">{{ rateLimitInfo.limit }}</div>
            </div>

            <div class="stat-item">
              <div class="stat-label">Осталось</div>
              <div class="stat-value" :class="getRemainingColor()">
                {{ rateLimitInfo.remaining }}
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-label">Сброс через</div>
              <div class="stat-value">{{ getResetTime() }}</div>
            </div>
          </div>

          <div class="rate-limit-progress">
            <v-progress-linear :model-value="getRateUsagePercentage()" :color="getRateProgressColor()" height="8"
              rounded />
            <div class="progress-label">
              {{ getRateUsagePercentage().toFixed(1) }}% использовано
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-btn color="warning" variant="outlined" prepend-icon="mdi-delete-sweep" @click="handleClearRateLimit"
          :loading="clearingRateLimit">
          Сбросить лимит
        </v-btn>

        <v-btn color="info" variant="outlined" prepend-icon="mdi-refresh" @click="$emit('refresh')">
          Обновить
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Рекомендации по безопасности -->
    <v-card class="recommendations-card">
      <v-card-title>
        <v-icon start>mdi-lightbulb</v-icon>
        Рекомендации по безопасности
      </v-card-title>

      <v-card-text>
        <div class="recommendations-list">
          <div v-for="recommendation in securityRecommendations" :key="recommendation.id" class="recommendation-item"
            :class="`recommendation-${recommendation.priority}`">
            <div class="recommendation-header">
              <v-icon :color="getPriorityColor(recommendation.priority)" size="20">
                {{ getPriorityIcon(recommendation.priority) }}
              </v-icon>

              <div class="recommendation-content">
                <div class="recommendation-title">{{ recommendation.title }}</div>
                <div class="recommendation-description">{{ recommendation.description }}</div>
              </div>

              <div class="recommendation-actions">
                <v-btn :color="getPriorityColor(recommendation.priority)" variant="outlined" size="small"
                  @click="applyRecommendation(recommendation)">
                  Применить
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Диалог детального просмотра алерта -->
    <v-dialog v-model="showAlertDialog" max-width="600">
      <v-card v-if="selectedAlert">
        <v-card-title>
          <v-icon start :color="getSeverityColor(selectedAlert.severity)">
            {{ getSeverityIcon(selectedAlert.severity) }}
          </v-icon>
          Детали алерта безопасности
        </v-card-title>

        <v-card-text>
          <div class="alert-details">
            <div class="detail-item">
              <strong>Тип:</strong> {{ selectedAlert.type }}
            </div>
            <div class="detail-item">
              <strong>Серьезность:</strong>
              <v-chip :color="getSeverityColor(selectedAlert.severity)" size="small">
                {{ selectedAlert.severity.toUpperCase() }}
              </v-chip>
            </div>
            <div class="detail-item">
              <strong>Описание:</strong> {{ selectedAlert.description }}
            </div>
            <div v-if="selectedAlert.ip_address" class="detail-item">
              <strong>IP адрес:</strong> {{ selectedAlert.ip_address }}
            </div>
            <div v-if="selectedAlert.user_id" class="detail-item">
              <strong>ID пользователя:</strong> {{ selectedAlert.user_id }}
            </div>
            <div class="detail-item">
              <strong>Количество:</strong> {{ selectedAlert.count }}
            </div>
            <div class="detail-item">
              <strong>Обнаружено:</strong> {{ formatDate(selectedAlert.detected_at) }}
            </div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-btn color="error" variant="outlined" prepend-icon="mdi-block-helper" @click="blockIP(selectedAlert)">
            Заблокировать IP
          </v-btn>

          <v-spacer />

          <v-btn color="grey" variant="text" @click="showAlertDialog = false">
            Закрыть
          </v-btn>

          <v-btn color="primary" variant="text" @click="acknowledgeAlert(selectedAlert)">
            Подтвердить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { RateLimitInfo, SecurityAlert } from '@/types/performance';
import { ref } from 'vue';

// Props
interface Props {
  alerts: SecurityAlert[]
  rateLimitInfo: RateLimitInfo
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'clear-rate-limit': []
  refresh: []
}>()

// Реактивные данные
const clearingRateLimit = ref(false)
const showAlertDialog = ref(false)
const selectedAlert = ref<SecurityAlert | null>(null)

// Рекомендации по безопасности
const securityRecommendations = ref([
  {
    id: '1',
    priority: 'high' as const,
    title: 'Настроить строгий rate limiting',
    description: 'Обнаружены попытки брутфорс атак. Рекомендуется ужесточить ограничения.'
  },
  {
    id: '2',
    priority: 'medium' as const,
    title: 'Включить двухфакторную аутентификацию',
    description: 'Повысьте безопасность аккаунтов, включив 2FA для всех пользователей.'
  },
  {
    id: '3',
    priority: 'low' as const,
    title: 'Обновить SSL сертификаты',
    description: 'Проверьте срок действия SSL сертификатов и обновите при необходимости.'
  }
])

// Методы
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

const getPriorityColor = (priority: string): string => {
  const colors = {
    low: 'info',
    medium: 'warning',
    high: 'error'
  }
  return colors[priority] || 'info'
}

const getPriorityIcon = (priority: string): string => {
  const icons = {
    low: 'mdi-information',
    medium: 'mdi-alert',
    high: 'mdi-alert-circle'
  }
  return icons[priority] || 'mdi-information'
}

const getRateUsagePercentage = (): number => {
  return (props.rateLimitInfo.current / props.rateLimitInfo.limit) * 100
}

const getRateProgressColor = (): string => {
  const percentage = getRateUsagePercentage()
  if (percentage >= 90) return 'error'
  if (percentage >= 70) return 'warning'
  return 'success'
}

const getRemainingColor = (): string => {
  const percentage = getRateUsagePercentage()
  if (percentage >= 90) return 'error--text'
  if (percentage >= 70) return 'warning--text'
  return 'success--text'
}

const getResetTime = (): string => {
  const resetDate = new Date(props.rateLimitInfo.reset_time * 1000)
  const now = new Date()
  const diff = resetDate.getTime() - now.getTime()

  if (diff <= 0) return 'Сейчас'

  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  if (minutes > 0) {
    return `${minutes}м ${seconds}с`
  }
  return `${seconds}с`
}

const viewAlertDetails = (alert: SecurityAlert) => {
  selectedAlert.value = alert
  showAlertDialog.value = true
}

const handleClearRateLimit = async () => {
  clearingRateLimit.value = true
  try {
    emit('clear-rate-limit')
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally {
    clearingRateLimit.value = false
  }
}

const acknowledgeAlert = (alert: SecurityAlert) => {
  // Логика подтверждения алерта
  console.log('Acknowledging alert:', alert)
  showAlertDialog.value = false
}

const acknowledgeAllAlerts = () => {
  // Логика подтверждения всех алертов
  console.log('Acknowledging all alerts')
}

const blockIP = (alert: SecurityAlert) => {
  // Логика блокировки IP
  console.log('Blocking IP:', alert.ip_address)
  showAlertDialog.value = false
}

const applyRecommendation = (recommendation: any) => {
  // Логика применения рекомендации
  console.log('Applying recommendation:', recommendation)
}
</script>

<style scoped>
.security-monitoring {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.alerts-card.has-alerts {
  border-left: 4px solid rgb(var(--v-theme-error));
}

.no-alerts {
  text-align: center;
  padding: 40px 20px;
}

.no-alerts h3 {
  color: rgb(var(--v-theme-success));
  margin: 16px 0 8px;
}

.no-alerts p {
  color: rgb(var(--v-theme-on-surface-variant));
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

.rate-limit-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.rate-limit-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.rate-limit-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-label {
  text-align: center;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.recommendation-item {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-outline-variant), 0.2);
}

.recommendation-item.recommendation-high {
  border-left: 4px solid rgb(var(--v-theme-error));
}

.recommendation-item.recommendation-medium {
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.recommendation-item.recommendation-low {
  border-left: 4px solid rgb(var(--v-theme-info));
}

.recommendation-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.recommendation-content {
  flex: 1;
}

.recommendation-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.recommendation-description {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.alert-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  padding: 8px 0;
  border-bottom: 1px solid rgba(var(--v-theme-outline-variant), 0.2);
}

.detail-item:last-child {
  border-bottom: none;
}

@media (max-width: 768px) {
  .rate-limit-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .alert-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .recommendation-header,
  .alert-header {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
