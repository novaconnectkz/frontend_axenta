<template>
  <v-container fluid class="pa-0">
    <v-row>
      <v-col cols="12">
        <!-- Фильтры -->
        <v-card class="mb-4" elevation="0" outlined>
          <v-card-text>
            <v-row dense>
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="filters.search"
                  label="Поиск"
                  placeholder="Действие, пользователь..."
                  prepend-inner-icon="mdi-magnify"
                  outlined
                  dense
                  hide-details
                  clearable
                  @input="debouncedSearch"
                />
              </v-col>
              <v-col cols="12" sm="6" md="2">
                <v-select
                  v-model="filters.level"
                  :items="levelOptions"
                  item-title="text"
                  item-value="value"
                  label="Уровень"
                  outlined
                  dense
                  hide-details
                  clearable
                />
              </v-col>
              <v-col cols="12" sm="6" md="2">
                <v-select
                  v-model="filters.success"
                  :items="successOptions"
                  item-title="text"
                  item-value="value"
                  label="Статус"
                  outlined
                  dense
                  hide-details
                  clearable
                />
              </v-col>
              <v-col cols="12" sm="6" md="2">
                <v-text-field
                  v-model="filters.startDate"
                  label="Дата от"
                  type="date"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="6" md="2">
                <v-text-field
                  v-model="filters.endDate"
                  label="Дата до"
                  type="date"
                  outlined
                  dense
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="6" md="1" class="d-flex align-center">
                <v-btn
                  color="primary"
                  block
                  @click="loadLogs"
                  :loading="loading"
                  size="default"
                >
                  Применить
                </v-btn>
              </v-col>
            </v-row>
            <v-row dense class="mt-2">
              <v-col cols="12" sm="auto">
                <v-btn
                  variant="outlined"
                  color="secondary"
                  @click="exportLogs"
                  :loading="exporting"
                  prepend-icon="mdi-download"
                >
                  Экспорт в JSON
                </v-btn>
              </v-col>
              <v-col cols="12" sm="auto">
                <v-btn
                  variant="outlined"
                  @click="showStats = !showStats"
                  prepend-icon="mdi-chart-box"
                >
                  {{ showStats ? 'Скрыть статистику' : 'Показать статистику' }}
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Статистика -->
        <v-expand-transition>
          <v-card v-if="showStats" class="mb-4" elevation="0" outlined>
            <v-card-title>
              <v-icon left>mdi-chart-bar</v-icon>
              Статистика за последние {{ statsDays }} дней
            </v-card-title>
            <v-card-text>
              <v-row v-if="stats">
                <v-col cols="6" md="3">
                  <div class="text-center">
                    <div class="text-h4 primary--text">{{ stats.stats?.total_logs || 0 }}</div>
                    <div class="text-caption grey--text">Всего записей</div>
                  </div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-center">
                    <div class="text-h4 success--text">{{ stats.stats?.success_count || 0 }}</div>
                    <div class="text-caption grey--text">Успешных</div>
                  </div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-center">
                    <div class="text-h4 error--text">{{ stats.stats?.error_count || 0 }}</div>
                    <div class="text-caption grey--text">Ошибок</div>
                  </div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-center">
                    <div class="text-h4 info--text">{{ stats.stats?.unique_users || 0 }}</div>
                    <div class="text-caption grey--text">Уникальных пользователей</div>
                  </div>
                </v-col>
              </v-row>

              <!-- Топ действий -->
              <v-row v-if="stats?.top_actions?.length" class="mt-4">
                <v-col cols="12" md="6">
                  <div class="text-subtitle-1 font-weight-bold mb-2">Топ действий:</div>
                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th>Действие</th>
                        <th class="text-right">Количество</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in stats.top_actions.slice(0, 5)" :key="index">
                        <td>{{ item.action }}</td>
                        <td class="text-right">{{ item.count }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="text-subtitle-1 font-weight-bold mb-2">Распределение по уровням:</div>
                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th>Уровень</th>
                        <th class="text-right">Количество</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in stats.level_stats" :key="index">
                        <td>
                          <v-chip small :color="getLevelColor(item.level)" dark>
                            {{ getLevelName(item.level) }}
                          </v-chip>
                        </td>
                        <td class="text-right">{{ item.count }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-expand-transition>

        <!-- Таблица логов -->
        <v-card elevation="0" outlined>
          <v-data-table
            :headers="headers"
            :items="logs"
            :loading="loading"
            :server-items-length="totalLogs"
            :options.sync="options"
            :footer-props="{
              'items-per-page-options': [10, 25, 50, 100],
              'items-per-page-text': 'Записей на странице:'
            }"
            class="elevation-0"
            @update:options="loadLogs"
          >
            <template v-slot:[`item.timestamp`]="{ item }">
              <div class="text-no-wrap">
                {{ formatDate(item.timestamp) }}
              </div>
            </template>

            <template v-slot:[`item.level`]="{ item }">
              <v-chip size="small" :color="getLevelColor(item.level)">
                {{ getLevelName(item.level) }}
              </v-chip>
            </template>

            <template v-slot:[`item.success`]="{ item }">
              <v-icon :color="item.success ? 'success' : 'error'" size="small">
                {{ item.success ? 'mdi-check-circle' : 'mdi-close-circle' }}
              </v-icon>
            </template>

            <template v-slot:[`item.action`]="{ item }">
              <div class="text-truncate" style="max-width: 300px;" :title="item.action">
                {{ item.action }}
              </div>
            </template>

            <template v-slot:[`item.username`]="{ item }">
              <div class="d-flex align-center">
                <v-avatar size="24" color="primary" class="mr-2">
                  <span class="text-white text-caption">
                    {{ getInitials(item.username) }}
                  </span>
                </v-avatar>
                <div>
                  <div class="text-body-2">{{ item.username || 'Система' }}</div>
                  <div class="text-caption text-grey">{{ item.user_id }}</div>
                </div>
              </div>
            </template>

            <template v-slot:[`item.ip`]="{ item }">
              <div class="text-caption">{{ item.ip || '—' }}</div>
            </template>

            <template v-slot:[`item.actions`]="{ item }">
              <v-btn
                icon="mdi-eye"
                size="small"
                variant="text"
                @click="viewDetails(item)"
              />
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Диалог с деталями -->
    <v-dialog v-model="detailsDialog" max-width="800">
      <v-card v-if="selectedLog">
        <v-card-title class="d-flex align-center">
          <v-icon left>mdi-information</v-icon>
          Детали записи аудита
          <v-spacer></v-spacer>
          <v-btn icon @click="detailsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-4">
          <v-row dense>
            <v-col cols="12" md="6">
              <div class="text-caption grey--text">Время</div>
              <div class="text-body-1 mb-3">{{ formatDate(selectedLog.timestamp) }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption grey--text">Пользователь</div>
              <div class="text-body-1 mb-3">{{ selectedLog.username || 'Неизвестно' }} ({{ selectedLog.user_id }})</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption grey--text">Действие</div>
              <div class="text-body-1 mb-3">{{ selectedLog.action }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption grey--text">Статус</div>
              <div class="mb-3">
                <v-chip small :color="selectedLog.success ? 'success' : 'error'" dark>
                  {{ selectedLog.success ? 'Успешно' : 'Ошибка' }}
                </v-chip>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption grey--text">IP адрес</div>
              <div class="text-body-1 mb-3">{{ selectedLog.ip || '—' }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption grey--text">Роль</div>
              <div class="text-body-1 mb-3">{{ selectedLog.role || '—' }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption grey--text">Метод</div>
              <div class="text-body-1 mb-3">{{ selectedLog.method || '—' }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption grey--text">Путь</div>
              <div class="text-body-1 mb-3 text-truncate" :title="selectedLog.path">{{ selectedLog.path || '—' }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption grey--text">Код статуса</div>
              <div class="text-body-1 mb-3">{{ selectedLog.status_code || '—' }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption grey--text">Длительность</div>
              <div class="text-body-1 mb-3">{{ selectedLog.duration_ms ? selectedLog.duration_ms + ' мс' : '—' }}</div>
            </v-col>
            <v-col cols="12" v-if="selectedLog.user_agent">
              <div class="text-caption grey--text">User Agent</div>
              <div class="text-body-2 mb-3">{{ selectedLog.user_agent }}</div>
            </v-col>
            <v-col cols="12" v-if="selectedLog.error">
              <div class="text-caption error--text">Ошибка</div>
              <v-alert type="error" dense text class="mt-2">
                {{ selectedLog.error }}
              </v-alert>
            </v-col>
            <v-col cols="12" v-if="selectedLog.details && Object.keys(selectedLog.details).length">
              <div class="text-caption grey--text mb-2">Дополнительная информация</div>
              <v-card outlined>
                <v-card-text>
                  <pre class="text-caption">{{ JSON.stringify(selectedLog.details, null, 2) }}</pre>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import axios from 'axios'
import { useNotifications } from '@/composables/useNotifications'

const { showSuccess, showError } = useNotifications()

// Состояние
const loading = ref(false)
const exporting = ref(false)
const logs = ref([])
const totalLogs = ref(0)
const showStats = ref(false)
const stats = ref(null)
const statsDays = ref(7)
const detailsDialog = ref(false)
const selectedLog = ref(null)

// Фильтры
const filters = reactive({
  search: '',
  level: null,
  success: null,
  startDate: '',
  endDate: ''
})

// Опции таблицы
const options = ref({
  page: 1,
  itemsPerPage: 25,
  sortBy: ['timestamp'],
  sortDesc: [true]
})

// Заголовки таблицы
const headers = [
  { title: 'Время', key: 'timestamp', width: '180px', sortable: true },
  { title: 'Уровень', key: 'level', width: '100px', sortable: true },
  { title: 'Статус', key: 'success', width: '80px', align: 'center', sortable: true },
  { title: 'Пользователь', key: 'username', width: '200px', sortable: true },
  { title: 'Действие', key: 'action', sortable: true },
  { title: 'IP', key: 'ip', width: '130px', sortable: true },
  { title: '', key: 'actions', sortable: false, width: '60px' }
]

// Опции для фильтров
const levelOptions = [
  { text: 'Информация', value: 'info' },
  { text: 'Успех', value: 'success' },
  { text: 'Предупреждение', value: 'warning' },
  { text: 'Ошибка', value: 'error' }
]

const successOptions = [
  { text: 'Успешно', value: true },
  { text: 'Ошибка', value: false }
]

// API URL
import { config } from '@/config/env'

const API_URL = config.backendUrl

// Загрузка логов
const loadLogs = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('axenta_token')
    if (!token) {
      showError('Необходима авторизация')
      return
    }

    const params: any = {
      page: options.value.page,
      per_page: options.value.itemsPerPage,
      sort_by: options.value.sortBy[0] || 'timestamp',
      sort_order: options.value.sortDesc[0] ? 'desc' : 'asc'
    }

    if (filters.search) params.search = filters.search
    if (filters.level) params.level = filters.level
    if (filters.success !== null) params.success = filters.success
    if (filters.startDate) params.start_date = new Date(filters.startDate).toISOString()
    if (filters.endDate) params.end_date = new Date(filters.endDate).toISOString()

    const response = await axios.get(`${API_URL}/api/auth/audit/logs`, {
      headers: {
        Authorization: `Token ${token}`
      },
      params
    })

    if (response.data.status === 'success') {
      logs.value = response.data.data.items || []
      totalLogs.value = response.data.data.total || 0
    }
  } catch (error: any) {
    console.error('Ошибка загрузки логов:', error)
    showError(error.response?.data?.error || 'Ошибка загрузки логов')
  } finally {
    loading.value = false
  }
}

// Загрузка статистики
const loadStats = async () => {
  try {
    const token = localStorage.getItem('axenta_token')
    if (!token) return

    const response = await axios.get(`${API_URL}/api/auth/audit/stats`, {
      headers: {
        Authorization: `Token ${token}`
      },
      params: {
        days: statsDays.value
      }
    })

    if (response.data.status === 'success') {
      stats.value = response.data.data
    }
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error)
  }
}

// Экспорт логов
const exportLogs = async () => {
  exporting.value = true
  try {
    const token = localStorage.getItem('axenta_token')
    if (!token) {
      showError('Необходима авторизация')
      return
    }

    const params: any = {}
    if (filters.search) params.search = filters.search
    if (filters.level) params.level = filters.level
    if (filters.success !== null) params.success = filters.success
    if (filters.startDate) params.start_date = new Date(filters.startDate).toISOString()
    if (filters.endDate) params.end_date = new Date(filters.endDate).toISOString()

    const response = await axios.get(`${API_URL}/api/auth/audit/export`, {
      headers: {
        Authorization: `Token ${token}`
      },
      params
    })

    // Создаем и скачиваем файл
    const dataStr = JSON.stringify(response.data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)

    showSuccess('Логи успешно экспортированы')
  } catch (error: any) {
    console.error('Ошибка экспорта логов:', error)
    showError(error.response?.data?.error || 'Ошибка экспорта логов')
  } finally {
    exporting.value = false
  }
}

// Просмотр деталей
const viewDetails = (log: any) => {
  selectedLog.value = log
  detailsDialog.value = true
}

// Форматирование даты
const formatDate = (date: string) => {
  if (!date) return '—'
  const d = new Date(date)
  return d.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Получение цвета уровня
const getLevelColor = (level: string) => {
  const colors: Record<string, string> = {
    info: 'blue',
    success: 'green',
    warning: 'orange',
    error: 'red'
  }
  return colors[level] || 'grey'
}

// Получение названия уровня
const getLevelName = (level: string) => {
  const names: Record<string, string> = {
    info: 'Инфо',
    success: 'Успех',
    warning: 'Предупреждение',
    error: 'Ошибка'
  }
  return names[level] || level
}

// Получение инициалов
const getInitials = (name: string) => {
  if (!name) return 'S'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0]
  }
  return name.substring(0, 2).toUpperCase()
}

// Дебаунс для поиска
let searchTimeout: any = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadLogs()
  }, 500)
}

// Инициализация
onMounted(() => {
  loadLogs()
  loadStats()
})
</script>

<style scoped>
pre {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  max-height: 400px;
  overflow: auto;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 960px) {
  :deep(.v-data-table) {
    font-size: 0.875rem;
  }
  
  :deep(.v-data-table th),
  :deep(.v-data-table td) {
    padding: 0 8px !important;
  }
}

@media (max-width: 600px) {
  :deep(.v-data-table) {
    font-size: 0.75rem;
  }
  
  :deep(.v-data-table th),
  :deep(.v-data-table td) {
    padding: 0 4px !important;
  }
  
  /* Скрываем менее важные колонки на мобильных */
  :deep(.v-data-table th:nth-child(6)),
  :deep(.v-data-table td:nth-child(6)) {
    display: none;
  }
}

/* Обрезка длинного текста */
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Улучшенная прокрутка таблицы */
:deep(.v-data-table__wrapper) {
  overflow-x: auto;
  max-width: 100%;
}
</style>

