<template>
  <div class="pa-4">
    <!-- Filters -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-text-field
          v-model="search"
          label="Поиск отчетов"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="typeFilter"
          label="Тип отчета"
          :items="reportTypeItems"
          variant="outlined"
          density="compact"
          hide-details
          clearable
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="statusFilter"
          label="Статус"
          :items="reportStatusItems"
          variant="outlined"
          density="compact"
          hide-details
          clearable
        />
      </v-col>
    </v-row>

    <!-- Reports Table -->
    <v-data-table
      :headers="headers"
      :items="filteredReports"
      :loading="loading"
      :items-per-page="10"
      class="elevation-1"
    >
      <template #item.type="{ item }">
        <v-chip
          :color="getReportTypeConfig(item.type).color"
          size="small"
          variant="tonal"
        >
          <v-icon start size="16">{{ getReportTypeConfig(item.type).icon }}</v-icon>
          {{ getReportTypeConfig(item.type).label }}
        </v-chip>
      </template>

      <template #item.format="{ item }">
        <v-chip size="small" variant="outlined">
          {{ item.format.toUpperCase() }}
        </v-chip>
      </template>

      <template #item.status="{ item }">
        <v-chip
          :color="getStatusColor(item.status)"
          size="small"
          variant="tonal"
        >
          <v-icon start size="16">{{ getStatusIcon(item.status) }}</v-icon>
          {{ getStatusText(item.status) }}
        </v-chip>
      </template>

      <template #item.file_size="{ item }">
        <span v-if="item.file_size">{{ formatFileSize(item.file_size) }}</span>
        <span v-else class="text-medium-emphasis">—</span>
      </template>

      <template #item.execution_time="{ item }">
        <span v-if="item.execution_time">{{ item.execution_time }}с</span>
        <span v-else class="text-medium-emphasis">—</span>
      </template>

      <template #item.created_at="{ item }">
        {{ formatDate(item.created_at) }}
      </template>

      <template #item.actions="{ item }">
        <v-btn
          icon="mdi-download"
          size="small"
          variant="text"
          :disabled="!item.file_url"
          @click="downloadReport(item)"
        />
        <v-btn
          icon="mdi-eye"
          size="small"
          variant="text"
          @click="viewReport(item)"
        />
        <v-btn
          icon="mdi-delete"
          size="small"
          variant="text"
          color="error"
          @click="deleteReport(item)"
        />
      </template>
    </v-data-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Report } from '@/types/reports'
import reportsService from '@/services/reportsService'

// Props
interface Props {
  reports: Report[]
  loading: boolean
}

interface Emits {
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Data
const search = ref('')
const typeFilter = ref('')
const statusFilter = ref('')

// Computed
const reportTypeConfigs = computed(() => reportsService.getReportTypeConfigs())

const reportTypeItems = computed(() => 
  Object.entries(reportTypeConfigs.value).map(([value, config]) => ({
    title: config.label,
    value
  }))
)

const reportStatusItems = computed(() => [
  { title: 'Ожидает', value: 'pending' },
  { title: 'Генерируется', value: 'generating' },
  { title: 'Завершен', value: 'completed' },
  { title: 'Ошибка', value: 'failed' },
  { title: 'Отменен', value: 'cancelled' }
])

const filteredReports = computed(() => {
  let filtered = [...props.reports]
  
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    filtered = filtered.filter(r => 
      r.name.toLowerCase().includes(searchLower) ||
      r.description.toLowerCase().includes(searchLower)
    )
  }
  
  if (typeFilter.value) {
    filtered = filtered.filter(r => r.type === typeFilter.value)
  }
  
  if (statusFilter.value) {
    filtered = filtered.filter(r => r.status === statusFilter.value)
  }
  
  return filtered
})

// Table headers
const headers = [
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Тип', key: 'type', sortable: true },
  { title: 'Формат', key: 'format', sortable: true },
  { title: 'Статус', key: 'status', sortable: true },
  { title: 'Размер', key: 'file_size', sortable: true },
  { title: 'Время', key: 'execution_time', sortable: true },
  { title: 'Создан', key: 'created_at', sortable: true },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Methods
const getReportTypeConfig = (type: string) => {
  return reportTypeConfigs.value[type] || {
    label: type,
    icon: 'mdi-file',
    color: 'grey'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'success'
    case 'generating': return 'info'
    case 'failed': return 'error'
    case 'cancelled': return 'warning'
    default: return 'grey'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return 'mdi-check-circle'
    case 'generating': return 'mdi-loading'
    case 'failed': return 'mdi-alert-circle'
    case 'cancelled': return 'mdi-cancel'
    default: return 'mdi-clock-outline'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'Ожидает'
    case 'generating': return 'Генерируется'
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

const downloadReport = (report: Report) => {
  if (report.file_url) {
    window.open(report.file_url, '_blank')
  }
}

const viewReport = (report: Report) => {
  console.log('Просмотр отчета:', report)
}

const deleteReport = async (report: Report) => {
  if (confirm('Вы уверены, что хотите удалить этот отчет?')) {
    try {
      await reportsService.deleteReport(report.id)
      emit('refresh')
    } catch (error) {
      console.error('Ошибка удаления отчета:', error)
    }
  }
}
</script>
