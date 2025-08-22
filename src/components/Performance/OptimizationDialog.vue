<template>
  <v-card>
    <v-card-title>
      <v-icon start>mdi-tune</v-icon>
      Рекомендации по оптимизации
    </v-card-title>

    <v-card-text>
      <div v-if="recommendations.length === 0" class="no-recommendations">
        <v-icon color="success" size="48">mdi-check-circle</v-icon>
        <h3>Оптимизация не требуется</h3>
        <p>Система работает оптимально</p>
      </div>

      <div v-else class="recommendations-list">
        <div v-for="recommendation in recommendations" :key="recommendation.id" class="recommendation-item"
          :class="`recommendation-${recommendation.severity}`">
          <div class="recommendation-header">
            <v-icon :color="getSeverityColor(recommendation.severity)" size="24">
              {{ getTypeIcon(recommendation.type) }}
            </v-icon>

            <div class="recommendation-content">
              <div class="recommendation-title">{{ recommendation.title }}</div>
              <div class="recommendation-description">{{ recommendation.description }}</div>

              <div class="recommendation-details">
                <div class="detail-item">
                  <strong>Влияние:</strong> {{ recommendation.impact }}
                </div>
                <div class="detail-item">
                  <strong>Усилия:</strong> {{ recommendation.effort }}
                </div>
                <div class="detail-item">
                  <strong>Тип:</strong>
                  <v-chip :color="getTypeColor(recommendation.type)" size="small" variant="outlined">
                    {{ getTypeLabel(recommendation.type) }}
                  </v-chip>
                </div>
              </div>
            </div>

            <div class="recommendation-actions">
              <v-btn :color="getSeverityColor(recommendation.severity)" variant="outlined"
                @click="applyRecommendation(recommendation.id)" :loading="applying === recommendation.id">
                Применить
              </v-btn>
            </div>
          </div>
        </div>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-btn v-if="recommendations.length > 0" color="primary" variant="outlined" prepend-icon="mdi-check-all"
        @click="applyAllRecommendations" :loading="applyingAll">
        Применить все
      </v-btn>

      <v-spacer />

      <v-btn color="grey" variant="text" @click="$emit('close')">
        Закрыть
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import type { OptimizationRecommendation } from '@/types/performance';
import { ref } from 'vue';

// Props
interface Props {
  recommendations: OptimizationRecommendation[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  apply: [recommendationId: string]
}>()

// Реактивные данные
const applying = ref<string | null>(null)
const applyingAll = ref(false)

// Методы
const getSeverityColor = (severity: OptimizationRecommendation['severity']): string => {
  const colors = {
    low: 'info',
    medium: 'warning',
    high: 'error'
  }
  return colors[severity]
}

const getTypeColor = (type: OptimizationRecommendation['type']): string => {
  const colors = {
    index: 'primary',
    cache: 'success',
    query: 'info',
    security: 'error'
  }
  return colors[type]
}

const getTypeIcon = (type: OptimizationRecommendation['type']): string => {
  const icons = {
    index: 'mdi-database-search',
    cache: 'mdi-memory',
    query: 'mdi-database-cog',
    security: 'mdi-shield-check'
  }
  return icons[type]
}

const getTypeLabel = (type: OptimizationRecommendation['type']): string => {
  const labels = {
    index: 'Индексы',
    cache: 'Кэширование',
    query: 'Запросы',
    security: 'Безопасность'
  }
  return labels[type]
}

const applyRecommendation = async (recommendationId: string) => {
  applying.value = recommendationId
  try {
    emit('apply', recommendationId)
    await new Promise(resolve => setTimeout(resolve, 2000))
  } finally {
    applying.value = null
  }
}

const applyAllRecommendations = async () => {
  applyingAll.value = true
  try {
    for (const recommendation of props.recommendations) {
      emit('apply', recommendation.id)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  } finally {
    applyingAll.value = false
  }
}
</script>

<style scoped>
.no-recommendations {
  text-align: center;
  padding: 40px 20px;
}

.no-recommendations h3 {
  color: rgb(var(--v-theme-success));
  margin: 16px 0 8px;
}

.no-recommendations p {
  color: rgb(var(--v-theme-on-surface-variant));
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 500px;
  overflow-y: auto;
}

.recommendation-item {
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-outline-variant), 0.2);
  background: rgba(var(--v-theme-surface-variant), 0.1);
}

.recommendation-item.recommendation-high {
  border-left: 4px solid rgb(var(--v-theme-error));
  background: rgba(var(--v-theme-error), 0.05);
}

.recommendation-item.recommendation-medium {
  border-left: 4px solid rgb(var(--v-theme-warning));
  background: rgba(var(--v-theme-warning), 0.05);
}

.recommendation-item.recommendation-low {
  border-left: 4px solid rgb(var(--v-theme-info));
  background: rgba(var(--v-theme-info), 0.05);
}

.recommendation-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.recommendation-content {
  flex: 1;
}

.recommendation-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: rgb(var(--v-theme-on-surface));
}

.recommendation-description {
  font-size: 0.95rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 16px;
  line-height: 1.5;
}

.recommendation-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-item strong {
  min-width: 80px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.recommendation-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (max-width: 768px) {
  .recommendation-header {
    flex-direction: column;
    gap: 12px;
  }

  .recommendation-actions {
    flex-direction: row;
    justify-content: flex-end;
  }

  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .detail-item strong {
    min-width: auto;
  }
}
</style>
