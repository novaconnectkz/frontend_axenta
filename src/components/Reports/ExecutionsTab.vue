<template>
  <div class="pa-4">
    <!-- Filters -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-select
          v-model="statusFilter"
          label="Статус выполнения"
          :items="statusItems"
          variant="outlined"
          density="compact"
          hide-details
          clearable
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="dateFrom"
          label="Дата с"
          type="date"
          variant="outlined"
          density="compact"
          hide-details
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="dateTo"
          label="Дата по"
          type="date"
          variant="outlined"
          density="compact"
          hide-details
        />
      </v-col>
    </v-row>

    <!-- Executions Table -->
    <v-data-table
      :headers="headers"
      :items="filteredExecutions"
      :loading="loading"
      :items-per-page="10"
      class="elevation-1"
    >
      <template #item.schedule_id="{ item }">
        <div v-if="item.schedule">
          <div class="text-body-2">{{ item.schedule.name }}</div>
          <div class="text-caption text-medium-emphasis">
            ID: {{ item.schedule_id }}
          </div>
        </div>
        <span v-else class="text-medium-emphasis">{{ item.schedule_id }}</span>
      </template>

      <template #item.status="{ item }">
        <v-chip
          :color="getExecutionStatusColor(item.status)"
          size="small"
          variant="tonal"
        >
          <v-icon start size="16">{{ getExecutionStatusIcon(item.status) }}</v-icon>
          {{ getExecutionStatusText(item.status) }}
        </v-chip>
      </template>

      <template #item.execution_time="{ item }">
        <span v-if="item.execution_time">{{ item.execution_time }}с</span>
        <span v-else class="text-medium-emphasis">—</span>
      </template>

      <template #item.file_size="{ item }">
        <span v-if="item.file_size">{{ formatFileSize(item.file_size) }}</span>
        <span v-else class="text-medium-emphasis">—</span>
      </template>

      <template #item.started_at="{ item }">
        {{ formatDate(item.started_at) }}
      </template>

      <template #item.recipients_sent="{ item }">
        <div v-if="item.recipients_sent.length > 0">
          <v-chip
            v-for="recipient in item.recipients_sent.slice(0, 2)"
            :key="recipient"
            size="x-small"
            variant="tonal"
            color="success"
            class="mr-1 mb-1"
          >
            {{ recipient }}
          </v-chip>
          <v-chip
            v-if="item.recipients_sent.length > 2"
            size="x-small"
            variant="tonal"
            color="success"
          >
            +{{ item.recipients_sent.length - 2 }}
          </v-chip>
        </div>
        <div v-if="item.recipients_failed.length > 0" class="mt-1">
          <v-chip
            v-for="recipient in item.recipients_failed.slice(0, 2)"
            :key="recipient"
            size="x-small"
            variant="tonal"
            color="error"
            class="mr-1"
          >
            {{ recipient }}
          </v-chip>
          <v-chip
            v-if="item.recipients_failed.length > 2"
            size="x-small"
            variant="tonal"
            color="error"
          >
            +{{ item.recipients_failed.length - 2 }}
          </v-chip>
        </div>
        <span v-if="item.recipients_sent.length === 0 && item.recipients_failed.length === 0" class="text-medium-emphasis">
          —
        </span>
      </template>

      <template #item.actions="{ item }">
        <v-btn
          icon="mdi-download"
          size="small"
          variant="text"
          :disabled="!item.file_url || item.status !== 'completed'"
          @click="downloadExecution(item)"
        />
        <v-btn
          icon="mdi-eye"
          size="small"
          variant="text"
          @click="viewExecution(item)"
        />
        <v-btn
          v-if="item.status === 'running'"
          icon="mdi-stop"
          size="small"
          variant="text"
          color="warning"
          @click="cancelExecution(item)"
        />
        <v-btn
          v-if="item.status === 'failed'"
          icon="mdi-refresh"
          size="small"
          variant="text"
          color="primary"
          @click="retryExecution(item)"
        />
      </template>

      <template #item.error_message="{ item }">
        <div v-if="item.error_message" class="text-error">
          <v-tooltip>
            <template #activator="{ props }">
              <v-icon v-bind="props" size="16" color="error">mdi-alert-circle</v-icon>
            </template>
            {{ item.error_message }}
          </v-tooltip>
        </div>
        <span v-else class="text-medium-emphasis">—</span>
      </template>
    </v-data-table>

    <!-- Execution Details Dialog -->
    <v-dialog v-model="showDetailsDialog" max-width="800">
      <v-card v-if="selectedExecution">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-3" color="primary">mdi-information</v-icon>
          <span class="text-h5">Детали выполнения</span>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="showDetailsDialog = false"
          />
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <div class="text-subtitle-2 mb-2">Основная информация</div>
              <v-table density="compact">
                <tbody>
                  <tr>
                    <td class="font-weight-medium">ID выполнения:</td>
                    <td>{{ selectedExecution.id }}</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">Расписание:</td>
                    <td>{{ selectedExecution.schedule?.name || selectedExecution.schedule_id }}</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">Статус:</td>
                    <td>
                      <v-chip
                        :color="getExecutionStatusColor(selectedExecution.status)"
                        size="small"
                        variant="tonal"
                      >
                        {{ getExecutionStatusText(selectedExecution.status) }}
                      </v-chip>
                    </td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">Начало:</td>
                    <td>{{ formatDate(selectedExecution.started_at) }}</td>
                  </tr>
                  <tr v-if="selectedExecution.completed_at">
                    <td class="font-weight-medium">Завершение:</td>
                    <td>{{ formatDate(selectedExecution.completed_at) }}</td>
                  </tr>
                  <tr v-if="selectedExecution.execution_time">
                    <td class="font-weight-medium">Время выполнения:</td>
                    <td>{{ selectedExecution.execution_time }}с</td>
                  </tr>
                </tbody>
              </v-table>
            </v-col>

            <v-col cols="12" md="6">
              <div class="text-subtitle-2 mb-2">Результат</div>
              <v-table density="compact">
                <tbody>
                  <tr v-if="selectedExecution.file_url">
                    <td class="font-weight-medium">Файл:</td>
                    <td>
                      <v-btn
                        variant="text"
                        size="small"
                        color="primary"
                        prepend-icon="mdi-download"
                        @click="downloadExecution(selectedExecution)"
                      >
                        Скачать
                      </v-btn>
                    </td>
                  </tr>
                  <tr v-if="selectedExecution.file_size">
                    <td class="font-weight-medium">Размер:</td>
                    <td>{{ formatFileSize(selectedExecution.file_size) }}</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">Отправлено:</td>
                    <td>{{ selectedExecution.recipients_sent.length }} получателей</td>
                  </tr>
                  <tr v-if="selectedExecution.recipients_failed.length > 0">
                    <td class="font-weight-medium">Ошибки отправки:</td>
                    <td class="text-error">{{ selectedExecution.recipients_failed.length }} получателей</td>
                  </tr>
                </tbody>
              </v-table>
            </v-col>

            <v-col v-if="selectedExecution.error_message" cols="12">
              <div class="text-subtitle-2 mb-2">Ошибка</div>
              <v-alert type="error" variant="outlined">
                {{ selectedExecution.error_message }}
              </v-alert>
            </v-col>

            <v-col v-if="selectedExecution.recipients_sent.length > 0" cols="12">
              <div class="text-subtitle-2 mb-2">Успешно отправлено</div>
              <v-chip-group>
                <v-chip
                  v-for="recipient in selectedExecution.recipients_sent"
                  :key="recipient"
                  size="small"
                  variant="tonal"
                  color="success"
                >
                  {{ recipient }}
                </v-chip>
              </v-chip-group>
            </v-col>

            <v-col v-if="selectedExecution.recipients_failed.length > 0" cols="12">
              <div class="text-subtitle-2 mb-2">Ошибки отправки</div>
              <v-chip-group>
                <v-chip
                  v-for="recipient in selectedExecution.recipients_failed"
                  :key="recipient"
                  size="small"
                  variant="tonal"
                  color="error"
                >
                  {{ recipient }}
                </v-chip>
              </v-chip-group>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showDetailsDialog = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ReportExecution } from '@/types/reports'

// Props
interface Props {
  executions: ReportExecution[]
  loading: boolean
}

interface Emits {
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Data
const statusFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const showDetailsDialog = ref(false)
const selectedExecution = ref<ReportExecution | null>(null)

// Computed
const statusItems = computed(() => [
  { title: 'Запланирован', value: 'scheduled' },
  { title: 'Выполняется', value: 'running' },
  { title: 'Завершен', value: 'completed' },
  { title: 'Ошибка', value: 'failed' },
  { title: 'Отменен', value: 'cancelled' }
])

const filteredExecutions = computed(() => {
  let filtered = [...props.executions]
  
  if (statusFilter.value) {
    filtered = filtered.filter(e => e.status === statusFilter.value)
  }
  
  if (dateFrom.value) {
    filtered = filtered.filter(e => e.started_at >= dateFrom.value)
  }
  
  if (dateTo.value) {
    filtered = filtered.filter(e => e.started_at <= dateTo.value)
  }
  
  return filtered
})

// Table headers
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Расписание', key: 'schedule_id', sortable: false },
  { title: 'Статус', key: 'status', sortable: true },
  { title: 'Время выполнения', key: 'execution_time', sortable: true },
  { title: 'Размер файла', key: 'file_size', sortable: true },
  { title: 'Запущен', key: 'started_at', sortable: true },
  { title: 'Получатели', key: 'recipients_sent', sortable: false },
  { title: 'Ошибки', key: 'error_message', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Methods
const getExecutionStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'success'
    case 'running': return 'info'
    case 'failed': return 'error'
    case 'cancelled': return 'warning'
    default: return 'grey'
  }
}

const getExecutionStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return 'mdi-check-circle'
    case 'running': return 'mdi-loading'
    case 'failed': return 'mdi-alert-circle'
    case 'cancelled': return 'mdi-cancel'
    default: return 'mdi-clock-outline'
  }
}

const getExecutionStatusText = (status: string) => {
  switch (status) {
    case 'scheduled': return 'Запланирован'
    case 'running': return 'Выполняется'
    case 'completed': return 'Завершен'
    case 'failed': return 'Ошибка'
    case 'cancelled': return 'Отменен'
    default: return status
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const downloadExecution = (execution: ReportExecution) => {
  if (execution.file_url) {
    window.open(execution.file_url, '_blank')
  }
}

const viewExecution = (execution: ReportExecution) => {
  selectedExecution.value = execution
  showDetailsDialog.value = true
}

const cancelExecution = (execution: ReportExecution) => {
  if (confirm('Вы уверены, что хотите отменить выполнение?')) {
    console.log('Отмена выполнения:', execution)
    // Here you would call API to cancel execution
  }
}

const retryExecution = (execution: ReportExecution) => {
  if (confirm('Повторить выполнение отчета?')) {
    console.log('Повтор выполнения:', execution)
    // Here you would call API to retry execution
  }
}
</script>
