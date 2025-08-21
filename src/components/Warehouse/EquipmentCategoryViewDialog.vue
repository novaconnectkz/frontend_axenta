<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600px"
  >
    <v-card v-if="category">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon icon="mdi-tag" class="mr-2" />
          {{ category.name }}
        </div>
        <v-chip
          :color="category.is_active ? 'success' : 'grey'"
          variant="tonal"
        >
          {{ category.is_active ? 'Активна' : 'Неактивна' }}
        </v-chip>
      </v-card-title>

      <v-card-text>
        <v-row>
          <!-- Основная информация -->
          <v-col cols="12">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-1">
                <v-icon icon="mdi-information" class="mr-2" />
                Основная информация
              </v-card-title>
              <v-card-text>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Название:</span>
                    <span class="info-value font-weight-bold">{{ category.name }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Код:</span>
                    <v-chip size="small" variant="outlined">{{ category.code }}</v-chip>
                  </div>
                  <div v-if="category.description" class="info-item">
                    <span class="info-label">Описание:</span>
                    <span class="info-value">{{ category.description }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Минимальный остаток:</span>
                    <v-chip
                      :color="getCurrentStockColor()"
                      size="small"
                      variant="tonal"
                    >
                      {{ category.min_stock_level }} шт.
                    </v-chip>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Статистика оборудования -->
          <v-col cols="12">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-1">
                <v-icon icon="mdi-chart-bar" class="mr-2" />
                Статистика оборудования
              </v-card-title>
              <v-card-text>
                <div class="stats-grid">
                  <div class="stat-item">
                    <div class="stat-value total">{{ equipmentStats.total }}</div>
                    <div class="stat-label">Всего</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value available">{{ equipmentStats.available }}</div>
                    <div class="stat-label">Доступно</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value installed">{{ equipmentStats.installed }}</div>
                    <div class="stat-label">Установлено</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value reserved">{{ equipmentStats.reserved }}</div>
                    <div class="stat-label">Зарезервировано</div>
                  </div>
                </div>

                <!-- Индикатор уровня запасов -->
                <div class="stock-level mt-4">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <span class="text-subtitle-2">Уровень запасов:</span>
                    <v-chip
                      :color="getStockLevelColor()"
                      size="small"
                      variant="tonal"
                    >
                      {{ getStockLevelText() }}
                    </v-chip>
                  </div>
                  <v-progress-linear
                    :model-value="stockLevelPercentage"
                    :color="getStockLevelColor()"
                    height="12"
                    rounded
                  >
                    <template #default="{ value }">
                      <strong>{{ Math.ceil(value) }}%</strong>
                    </template>
                  </v-progress-linear>
                  <div class="d-flex justify-space-between text-caption text-medium-emphasis mt-1">
                    <span>Минимум: {{ category.min_stock_level }}</span>
                    <span>Текущий: {{ equipmentStats.available }}</span>
                  </div>
                </div>

                <!-- Предупреждение о низком остатке -->
                <v-alert
                  v-if="isLowStock"
                  type="warning"
                  variant="tonal"
                  density="compact"
                  class="mt-3"
                >
                  <template #prepend>
                    <v-icon icon="mdi-alert" />
                  </template>
                  Внимание! Остаток ниже минимального уровня
                </v-alert>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- История -->
          <v-col cols="12">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-1">
                <v-icon icon="mdi-clock" class="mr-2" />
                История
              </v-card-title>
              <v-card-text>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Создана:</span>
                    <span class="info-value">{{ formatDateTime(category.created_at) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Обновлена:</span>
                    <span class="info-value">{{ formatDateTime(category.updated_at) }}</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn
          variant="outlined"
          @click="$emit('update:modelValue', false)"
        >
          Закрыть
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { EquipmentCategory } from '@/types/warehouse';

// Props
interface Props {
  modelValue: boolean;
  category: EquipmentCategory | null;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

// Mock статистика оборудования для категории
const mockEquipmentStats: Record<number, any> = {
  1: { total: 25, available: 18, installed: 5, reserved: 2 },
  2: { total: 8, available: 3, installed: 4, reserved: 1 },
  3: { total: 15, available: 12, installed: 2, reserved: 1 },
  4: { total: 3, available: 2, installed: 1, reserved: 0 },
  5: { total: 12, available: 8, installed: 3, reserved: 1 },
};

// Вычисляемые свойства
const equipmentStats = computed(() => {
  if (!props.category) return { total: 0, available: 0, installed: 0, reserved: 0 };
  return mockEquipmentStats[props.category.id] || { total: 0, available: 0, installed: 0, reserved: 0 };
});

const isLowStock = computed(() => {
  if (!props.category) return false;
  return equipmentStats.value.available < props.category.min_stock_level;
});

const stockLevelPercentage = computed(() => {
  if (!props.category || props.category.min_stock_level === 0) return 100;
  const percentage = (equipmentStats.value.available / props.category.min_stock_level) * 100;
  return Math.min(percentage, 100);
});

// Методы
const getCurrentStockColor = () => {
  if (equipmentStats.value.available === 0) return 'error';
  if (isLowStock.value) return 'warning';
  return 'success';
};

const getStockLevelColor = () => {
  if (stockLevelPercentage.value < 50) return 'error';
  if (stockLevelPercentage.value < 100) return 'warning';
  return 'success';
};

const getStockLevelText = () => {
  if (stockLevelPercentage.value < 50) return 'Критически низкий';
  if (stockLevelPercentage.value < 100) return 'Низкий';
  return 'Нормальный';
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('ru-RU');
};
</script>

<style scoped>
:deep(.v-card-title) {
  background: rgba(var(--v-theme-primary), 0.1);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
}

.info-grid {
  display: grid;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(var(--v-theme-outline-variant), 0.3);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
  font-weight: 500;
  min-width: 120px;
}

.info-value {
  font-size: 0.875rem;
  text-align: right;
  flex: 1;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 12px;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-value.total {
  color: rgb(var(--v-theme-primary));
}

.stat-value.available {
  color: rgb(var(--v-theme-success));
}

.stat-value.installed {
  color: rgb(var(--v-theme-info));
}

.stat-value.reserved {
  color: rgb(var(--v-theme-warning));
}

.stat-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.stock-level {
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 12px;
  padding: 16px;
}

/* Адаптивность */
@media (max-width: 768px) {
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .info-label {
    min-width: auto;
  }
  
  .info-value {
    text-align: left;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
