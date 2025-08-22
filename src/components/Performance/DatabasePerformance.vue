<template>
  <div class="database-performance">
    <!-- Быстрые действия -->
    <div class="quick-actions mb-6">
      <v-card>
        <v-card-title>
          <v-icon start>mdi-lightning-bolt</v-icon>
          Быстрые действия
        </v-card-title>

        <v-card-text>
          <div class="actions-grid">
            <v-btn color="primary" variant="outlined" prepend-icon="mdi-plus" @click="handleCreateIndexes"
              :loading="creatingIndexes">
              Создать индексы
            </v-btn>

            <v-btn color="success" variant="outlined" prepend-icon="mdi-tune" @click="handleOptimize"
              :loading="optimizing">
              Оптимизировать БД
            </v-btn>

            <v-btn color="info" variant="outlined" prepend-icon="mdi-refresh" @click="$emit('refresh')">
              Обновить данные
            </v-btn>

            <v-btn color="warning" variant="outlined" prepend-icon="mdi-chart-line" @click="showStatsDialog = true">
              Статистика
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Индексы базы данных -->
    <v-card class="mb-6">
      <v-card-title>
        <v-icon start>mdi-database-search</v-icon>
        Индексы базы данных
      </v-card-title>

      <v-card-text>
        <v-tabs v-model="activeIndexTab">
          <v-tab v-for="(tableIndexes, tableName) in indexes" :key="tableName" :value="tableName">
            {{ tableName }}
            <v-chip size="small" class="ml-2" variant="outlined">
              {{ Array.isArray(tableIndexes) ? tableIndexes.length : 0 }}
            </v-chip>
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="activeIndexTab">
          <v-tabs-window-item v-for="(tableIndexes, tableName) in indexes" :key="tableName" :value="tableName">
            <div class="mt-4">
              <v-data-table :headers="indexHeaders" :items="Array.isArray(tableIndexes) ? tableIndexes : []"
                density="compact" class="indexes-table">
                <template #item.definition="{ item }">
                  <code class="index-definition">{{ item.definition }}</code>
                </template>
              </v-data-table>
            </div>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>
    </v-card>

    <!-- Использование индексов -->
    <v-card class="mb-6">
      <v-card-title>
        <v-icon start>mdi-chart-bar</v-icon>
        Использование индексов
      </v-card-title>

      <v-card-text>
        <v-data-table :headers="usageHeaders" :items="indexUsage" density="compact" class="usage-table">
          <template #item.scan_count="{ item }">
            <v-chip :color="getScanCountColor(item.scan_count)" size="small">
              {{ item.scan_count.toLocaleString() }}
            </v-chip>
          </template>

          <template #item.tup_read="{ item }">
            {{ item.tup_read.toLocaleString() }}
          </template>

          <template #item.tup_fetch="{ item }">
            {{ item.tup_fetch.toLocaleString() }}
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Статистика таблиц -->
    <v-card>
      <v-card-title>
        <v-icon start>mdi-table</v-icon>
        Статистика таблиц
      </v-card-title>

      <v-card-text>
        <v-data-table :headers="statsHeaders" :items="tableStats" density="compact" class="stats-table">
          <template #item.live_tuples="{ item }">
            <v-chip color="success" size="small" variant="outlined">
              {{ item.live_tuples.toLocaleString() }}
            </v-chip>
          </template>

          <template #item.dead_tuples="{ item }">
            <v-chip :color="item.dead_tuples > 100 ? 'warning' : 'info'" size="small" variant="outlined">
              {{ item.dead_tuples.toLocaleString() }}
            </v-chip>
          </template>

          <template #item.last_vacuum="{ item }">
            {{ item.last_vacuum ? formatDate(item.last_vacuum) : 'Никогда' }}
          </template>

          <template #item.last_analyze="{ item }">
            {{ item.last_analyze ? formatDate(item.last_analyze) : 'Никогда' }}
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Диалог статистики -->
    <v-dialog v-model="showStatsDialog" max-width="800">
      <v-card>
        <v-card-title>
          <v-icon start>mdi-chart-line</v-icon>
          Детальная статистика БД
        </v-card-title>

        <v-card-text>
          <div class="stats-overview">
            <div class="stats-section">
              <h4>Общая информация</h4>
              <div class="stats-list">
                <div class="stat-item">
                  <span class="stat-label">Всего таблиц:</span>
                  <span class="stat-value">{{ tableStats.length }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Всего индексов:</span>
                  <span class="stat-value">{{ getTotalIndexesCount() }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Живых записей:</span>
                  <span class="stat-value">{{ getTotalLiveTuples().toLocaleString() }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Мертвых записей:</span>
                  <span class="stat-value">{{ getTotalDeadTuples().toLocaleString() }}</span>
                </div>
              </div>
            </div>

            <div class="stats-section">
              <h4>Активность</h4>
              <div class="stats-list">
                <div class="stat-item">
                  <span class="stat-label">Всего вставок:</span>
                  <span class="stat-value">{{ getTotalInserts().toLocaleString() }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Всего обновлений:</span>
                  <span class="stat-value">{{ getTotalUpdates().toLocaleString() }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Всего удалений:</span>
                  <span class="stat-value">{{ getTotalDeletes().toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" @click="showStatsDialog = false">
            Закрыть
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { DatabaseIndex, IndexUsage, TableStats } from '@/types/performance'
import { ref } from 'vue'

// Props
interface Props {
  indexes: Record<string, DatabaseIndex[]> | DatabaseIndex[]
  indexUsage: IndexUsage[]
  tableStats: TableStats[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'create-indexes': []
  optimize: []
  refresh: []
}>()

// Реактивные данные
const activeIndexTab = ref(Object.keys(props.indexes)[0] || '')
const creatingIndexes = ref(false)
const optimizing = ref(false)
const showStatsDialog = ref(false)

// Заголовки таблиц
const indexHeaders = [
  { title: 'Название', key: 'name' },
  { title: 'Определение', key: 'definition' }
]

const usageHeaders = [
  { title: 'Схема', key: 'schema', width: '100px' },
  { title: 'Таблица', key: 'table' },
  { title: 'Индекс', key: 'index' },
  { title: 'Прочитано', key: 'tup_read', width: '120px' },
  { title: 'Получено', key: 'tup_fetch', width: '120px' },
  { title: 'Сканирований', key: 'scan_count', width: '130px' }
]

const statsHeaders = [
  { title: 'Схема', key: 'schema', width: '100px' },
  { title: 'Таблица', key: 'table' },
  { title: 'Вставки', key: 'inserts', width: '100px' },
  { title: 'Обновления', key: 'updates', width: '120px' },
  { title: 'Удаления', key: 'deletes', width: '100px' },
  { title: 'Живых записей', key: 'live_tuples', width: '130px' },
  { title: 'Мертвых записей', key: 'dead_tuples', width: '140px' },
  { title: 'Последний VACUUM', key: 'last_vacuum', width: '150px' },
  { title: 'Последний ANALYZE', key: 'last_analyze', width: '150px' }
]

// Методы
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('ru-RU')
}

const getScanCountColor = (count: number): string => {
  if (count > 1000) return 'success'
  if (count > 100) return 'info'
  if (count > 10) return 'warning'
  return 'error'
}

const getTotalIndexesCount = (): number => {
  if (Array.isArray(props.indexes)) {
    return props.indexes.length
  }

  return Object.values(props.indexes).reduce((total, tableIndexes) => {
    return total + (Array.isArray(tableIndexes) ? tableIndexes.length : 0)
  }, 0)
}

const getTotalLiveTuples = (): number => {
  return props.tableStats.reduce((total, stat) => total + stat.live_tuples, 0)
}

const getTotalDeadTuples = (): number => {
  return props.tableStats.reduce((total, stat) => total + stat.dead_tuples, 0)
}

const getTotalInserts = (): number => {
  return props.tableStats.reduce((total, stat) => total + stat.inserts, 0)
}

const getTotalUpdates = (): number => {
  return props.tableStats.reduce((total, stat) => total + stat.updates, 0)
}

const getTotalDeletes = (): number => {
  return props.tableStats.reduce((total, stat) => total + stat.deletes, 0)
}

const handleCreateIndexes = async () => {
  creatingIndexes.value = true
  try {
    emit('create-indexes')
    await new Promise(resolve => setTimeout(resolve, 3000)) // Симуляция
  } finally {
    creatingIndexes.value = false
  }
}

const handleOptimize = async () => {
  optimizing.value = true
  try {
    emit('optimize')
    await new Promise(resolve => setTimeout(resolve, 5000)) // Симуляция
  } finally {
    optimizing.value = false
  }
}
</script>

<style scoped>
.database-performance {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.indexes-table,
.usage-table,
.stats-table {
  margin-top: 16px;
}

.indexes-table :deep(.v-data-table__wrapper),
.usage-table :deep(.v-data-table__wrapper),
.stats-table :deep(.v-data-table__wrapper) {
  max-height: 400px;
  overflow-y: auto;
}

.index-definition {
  font-size: 0.75rem;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  padding: 4px 8px;
  border-radius: 4px;
  display: block;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stats-overview {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-section h4 {
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 16px;
  font-weight: 600;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(var(--v-theme-outline-variant), 0.2);
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.875rem;
}

.stat-value {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

@media (max-width: 768px) {
  .actions-grid {
    grid-template-columns: 1fr;
  }

  .stats-overview {
    gap: 16px;
  }

  .stat-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
