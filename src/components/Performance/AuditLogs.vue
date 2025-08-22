<template>
  <div class="audit-logs">
    <!-- Фильтры -->
    <v-card class="filters-card mb-6">
      <v-card-title>
        <v-icon start>mdi-filter</v-icon>
        Фильтры аудит логов
      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-select v-model="localFilters.action" :items="actionItems" label="Действие" clearable variant="outlined"
              density="compact" />
          </v-col>

          <v-col cols="12" md="3">
            <v-select v-model="localFilters.resource" :items="resourceItems" label="Ресурс" clearable variant="outlined"
              density="compact" />
          </v-col>

          <v-col cols="12" md="2">
            <v-text-field v-model="localFilters.user_id" label="ID пользователя" type="number" clearable
              variant="outlined" density="compact" />
          </v-col>

          <v-col cols="12" md="2">
            <v-text-field v-model="localFilters.ip_address" label="IP адрес" clearable variant="outlined"
              density="compact" />
          </v-col>

          <v-col cols="12" md="2">
            <v-btn color="primary" @click="applyFilters" block>
              Применить
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Статистика -->
    <div class="stats-grid mb-6">
      <v-card>
        <v-card-text>
          <div class="stat-item">
            <div class="stat-value">{{ stats.total_logs.toLocaleString() }}</div>
            <div class="stat-label">Всего логов</div>
          </div>
        </v-card-text>
      </v-card>

      <v-card>
        <v-card-text>
          <div class="stat-item">
            <div class="stat-value success--text">{{ stats.successful_logs.toLocaleString() }}</div>
            <div class="stat-label">Успешных</div>
          </div>
        </v-card-text>
      </v-card>

      <v-card>
        <v-card-text>
          <div class="stat-item">
            <div class="stat-value error--text">{{ stats.failed_logs.toLocaleString() }}</div>
            <div class="stat-label">Неуспешных</div>
          </div>
        </v-card-text>
      </v-card>

      <v-card>
        <v-card-text>
          <div class="stat-item">
            <div class="stat-value">{{ ((stats.successful_logs / stats.total_logs) * 100).toFixed(1) }}%</div>
            <div class="stat-label">Успешность</div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Таблица логов -->
    <v-card>
      <v-card-title>
        <v-icon start>mdi-file-document</v-icon>
        Аудит логи

        <v-spacer />

        <v-btn color="primary" variant="outlined" prepend-icon="mdi-download" @click="handleExport"
          :loading="exporting">
          Экспорт
        </v-btn>

        <v-btn color="warning" variant="outlined" prepend-icon="mdi-delete-sweep" @click="showCleanupDialog = true"
          class="ml-2">
          Очистка
        </v-btn>

        <v-btn color="info" variant="outlined" prepend-icon="mdi-refresh" @click="$emit('refresh')" class="ml-2">
          Обновить
        </v-btn>
      </v-card-title>

      <v-data-table :headers="headers" :items="logs" :loading="loading" class="audit-table" density="compact">
        <template #item.success="{ item }">
          <v-chip :color="item.success ? 'success' : 'error'" size="small">
            <v-icon start size="16">
              {{ item.success ? 'mdi-check' : 'mdi-close' }}
            </v-icon>
            {{ item.success ? 'Успех' : 'Ошибка' }}
          </v-chip>
        </template>

        <template #item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>

        <template #item.actions="{ item }">
          <v-btn icon="mdi-eye" variant="text" size="small" @click="viewDetails(item)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Диалог детального просмотра -->
    <v-dialog v-model="showDetailsDialog" max-width="800">
      <v-card v-if="selectedLog">
        <v-card-title>
          <v-icon start>mdi-information</v-icon>
          Детали аудит лога
        </v-card-title>

        <v-card-text>
          <div class="details-grid">
            <div class="detail-item">
              <strong>ID:</strong> {{ selectedLog.id }}
            </div>
            <div class="detail-item">
              <strong>Действие:</strong> {{ selectedLog.action }}
            </div>
            <div class="detail-item">
              <strong>Ресурс:</strong> {{ selectedLog.resource }}
            </div>
            <div class="detail-item">
              <strong>Пользователь:</strong> {{ selectedLog.user_id || 'Система' }}
            </div>
            <div class="detail-item">
              <strong>IP адрес:</strong> {{ selectedLog.ip_address }}
            </div>
            <div class="detail-item">
              <strong>Статус:</strong>
              <v-chip :color="selectedLog.success ? 'success' : 'error'" size="small">
                {{ selectedLog.success ? 'Успех' : 'Ошибка' }}
              </v-chip>
            </div>
            <div class="detail-item">
              <strong>Время:</strong> {{ formatDate(selectedLog.created_at) }}
            </div>
          </div>

          <v-divider class="my-4" />

          <div v-if="selectedLog.details" class="mb-4">
            <strong>Детали:</strong>
            <pre class="details-json">{{ formatJSON(selectedLog.details) }}</pre>
          </div>

          <div v-if="selectedLog.old_values" class="mb-4">
            <strong>Старые значения:</strong>
            <pre class="details-json">{{ formatJSON(selectedLog.old_values) }}</pre>
          </div>

          <div v-if="selectedLog.new_values" class="mb-4">
            <strong>Новые значения:</strong>
            <pre class="details-json">{{ formatJSON(selectedLog.new_values) }}</pre>
          </div>

          <div v-if="selectedLog.error_message" class="mb-4">
            <strong>Сообщение об ошибке:</strong>
            <div class="error-message">{{ selectedLog.error_message }}</div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" @click="showDetailsDialog = false">
            Закрыть
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог очистки -->
    <v-dialog v-model="showCleanupDialog" max-width="400">
      <v-card>
        <v-card-title>
          <v-icon start color="warning">mdi-alert</v-icon>
          Очистка логов
        </v-card-title>

        <v-card-text>
          <p>Удалить логи старше указанного количества дней?</p>

          <v-text-field v-model.number="retentionDays" label="Количество дней" type="number" variant="outlined" :min="1"
            :max="365" />

          <v-alert type="warning" variant="tonal" class="mt-4">
            Это действие необратимо!
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="showCleanupDialog = false">
            Отмена
          </v-btn>
          <v-btn color="warning" variant="tonal" @click="handleCleanup" :loading="cleaning">
            Очистить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { AuditFilters, AuditLog, AuditStats } from '@/types/performance'
import { reactive, ref } from 'vue'

// Props
interface Props {
  logs: AuditLog[]
  stats: AuditStats
  filters: AuditFilters
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  filter: [filters: AuditFilters]
  export: [filters?: AuditFilters]
  cleanup: [retentionDays: number]
  refresh: []
}>()

// Реактивные данные
const loading = ref(false)
const exporting = ref(false)
const cleaning = ref(false)
const showDetailsDialog = ref(false)
const showCleanupDialog = ref(false)
const selectedLog = ref<AuditLog | null>(null)
const retentionDays = ref(90)

const localFilters = reactive<AuditFilters>({ ...props.filters })

// Заголовки таблицы
const headers = [
  { title: 'ID', key: 'id', width: '80px' },
  { title: 'Время', key: 'created_at', width: '150px' },
  { title: 'Действие', key: 'action' },
  { title: 'Ресурс', key: 'resource' },
  { title: 'Пользователь', key: 'user_id', width: '100px' },
  { title: 'IP адрес', key: 'ip_address', width: '120px' },
  { title: 'Статус', key: 'success', width: '100px' },
  { title: 'Действия', key: 'actions', width: '80px', sortable: false }
]

// Опции для фильтров
const actionItems = [
  'user.login',
  'user.logout',
  'object.create',
  'object.update',
  'object.delete',
  'contract.create',
  'contract.update',
  'installation.create',
  'installation.complete'
]

const resourceItems = [
  'user',
  'object',
  'contract',
  'installation',
  'equipment',
  'system'
]

// Методы
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('ru-RU')
}

const formatJSON = (jsonString: string): string => {
  try {
    return JSON.stringify(JSON.parse(jsonString), null, 2)
  } catch {
    return jsonString
  }
}

const applyFilters = () => {
  emit('filter', { ...localFilters })
}

const viewDetails = (log: AuditLog) => {
  selectedLog.value = log
  showDetailsDialog.value = true
}

const handleExport = async () => {
  exporting.value = true
  try {
    emit('export', { ...localFilters })
  } finally {
    exporting.value = false
  }
}

const handleCleanup = async () => {
  cleaning.value = true
  try {
    emit('cleanup', retentionDays.value)
    showCleanupDialog.value = false
  } finally {
    cleaning.value = false
  }
}
</script>

<style scoped>
.audit-logs {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.filters-card {
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.audit-table :deep(.v-data-table__wrapper) {
  max-height: 600px;
  overflow-y: auto;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.detail-item {
  padding: 8px 0;
  border-bottom: 1px solid rgba(var(--v-theme-outline-variant), 0.2);
}

.detail-item:last-child {
  border-bottom: none;
}

.details-json {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  padding: 12px;
  border-radius: 8px;
  font-size: 0.875rem;
  overflow-x: auto;
  max-height: 200px;
}

.error-message {
  background: rgba(var(--v-theme-error), 0.1);
  color: rgb(var(--v-theme-error));
  padding: 12px;
  border-radius: 8px;
  font-family: monospace;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
