<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="500px">
    <v-card class="location-view-dialog" v-if="location">
      <v-card-title class="dialog-title">
        <v-icon icon="mdi-map-marker" class="title-icon" />
        Информация о локации
      </v-card-title>

      <v-card-text class="dialog-content">
        <!-- Основная информация -->
        <div class="info-section">
          <h3 class="section-title">Основная информация</h3>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Город</div>
              <div class="info-value">{{ location.city }}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Регион</div>
              <div class="info-value">{{ location.region }}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Страна</div>
              <div class="info-value">{{ location.country }}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Статус</div>
              <div class="info-value">
                <v-chip
                  :color="location.is_active ? 'success' : 'error'"
                  size="small"
                  variant="tonal"
                >
                  {{ location.is_active ? 'Активна' : 'Неактивна' }}
                </v-chip>
              </div>
            </div>
          </div>
        </div>

        <!-- Географические данные -->
        <div class="info-section">
          <h3 class="section-title">Географические данные</h3>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Координаты</div>
              <div class="info-value">
                <div v-if="location.latitude && location.longitude" class="coordinates">
                  <div class="coordinate-item">
                    <v-icon icon="mdi-latitude" size="small" />
                    {{ location.latitude.toFixed(6) }}
                  </div>
                  <div class="coordinate-item">
                    <v-icon icon="mdi-longitude" size="small" />
                    {{ location.longitude.toFixed(6) }}
                  </div>
                </div>
                <div v-else class="text-grey">Не указаны</div>
              </div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Часовой пояс</div>
              <div class="info-value">
                <v-chip size="small" variant="outlined">
                  {{ location.timezone }}
                </v-chip>
              </div>
            </div>
          </div>

          <!-- Карта (если есть координаты) -->
          <div v-if="location.latitude && location.longitude" class="map-section">
            <div class="map-placeholder">
              <v-icon icon="mdi-map" size="48" class="map-icon" />
              <div class="map-text">
                <div>Карта будет здесь</div>
                <div class="map-coordinates">
                  {{ location.latitude.toFixed(4) }}, {{ location.longitude.toFixed(4) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Системная информация -->
        <div class="info-section">
          <h3 class="section-title">Системная информация</h3>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">ID</div>
              <div class="info-value">{{ location.id }}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Создана</div>
              <div class="info-value">{{ formatDateTime(location.created_at) }}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Обновлена</div>
              <div class="info-value">{{ formatDateTime(location.updated_at) }}</div>
            </div>
          </div>
        </div>

        <!-- Статистика использования (если доступна) -->
        <div class="info-section" v-if="locationStats">
          <h3 class="section-title">Статистика использования</h3>
          
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ locationStats.installations_count || 0 }}</div>
              <div class="stat-label">Монтажей</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-value">{{ locationStats.installers_count || 0 }}</div>
              <div class="stat-label">Монтажников</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-value">{{ locationStats.objects_count || 0 }}</div>
              <div class="stat-label">Объектов</div>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="dialog-actions">
        <v-spacer />
        <AppleButton variant="secondary" @click="$emit('update:modelValue', false)">
          Закрыть
        </AppleButton>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import AppleButton from '@/components/Apple/AppleButton.vue';
import type { LocationBase } from '@/types/installations';
import { ref, watch } from 'vue';

// Props
interface Props {
  modelValue: boolean;
  location?: LocationBase | null;
}

const props = withDefaults(defineProps<Props>(), {
  location: null
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

// Состояние
const locationStats = ref<{
  installations_count: number;
  installers_count: number;
  objects_count: number;
} | null>(null);

// Загрузка статистики локации
const loadLocationStats = async (locationId: number) => {
  try {
    // TODO: Реализовать загрузку статистики локации
    // const stats = await installationsService.getLocationStatistics(locationId);
    // locationStats.value = stats;
    
    // Пока используем моковые данные
    locationStats.value = {
      installations_count: Math.floor(Math.random() * 50),
      installers_count: Math.floor(Math.random() * 10),
      objects_count: Math.floor(Math.random() * 100)
    };
  } catch (error) {
    console.warn('Ошибка загрузки статистики локации:', error);
    locationStats.value = null;
  }
};

// Отслеживание изменений локации
watch(() => props.location, (newLocation) => {
  if (newLocation) {
    loadLocationStats(newLocation.id);
  } else {
    locationStats.value = null;
  }
}, { immediate: true });

// Утилиты
const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
.location-view-dialog {
  border-radius: 16px;
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 24px 0;
  font-size: 20px;
  font-weight: 600;
}

.title-icon {
  color: rgb(var(--v-theme-primary));
}

.dialog-content {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.info-section {
  margin-bottom: 32px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: rgb(var(--v-theme-on-surface));
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.coordinates {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.coordinate-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: monospace;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.map-section {
  margin-top: 16px;
}

.map-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 32px;
  background: rgb(var(--v-theme-surface-variant));
  border: 2px dashed rgb(var(--v-theme-outline));
  border-radius: 12px;
  text-align: center;
}

.map-icon {
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: 0.6;
}

.map-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.map-coordinates {
  font-family: monospace;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 12px;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 4px;
}

.dialog-actions {
  padding: 0 24px 24px;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .map-placeholder {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
