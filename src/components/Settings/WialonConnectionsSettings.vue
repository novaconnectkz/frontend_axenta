<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

// Типы
interface WialonConnection {
  id: number
  name: string
  connection_type: 'hosting' | 'local'
  host: string
  data_center: string
  token_masked: string
  user_name: string
  local_version: string | null  // Версия Wialon Local (например: local_2504)
  cms_url: string | null        // URL CMS-интерфейса (опционально)
  is_active: boolean
  units_count: number
  last_sync_at: string | null
  last_error_at: string | null
  error_message: string
  sync_interval: number
  created_at: string
}

interface ConnectionFormData {
  name: string
  connection_type: 'hosting' | 'local'
  data_center: string
  host: string
  token: string
  sync_interval: number
  cms_url: string
}

// Состояние
const connections = ref<WialonConnection[]>([])
const loading = ref(false)
const showDialog = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingConnectionId = ref<number | null>(null)
const testingConnection = ref(false)
const testResult = ref<{ success: boolean; message: string; user_name?: string } | null>(null)

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

const showSuccess = (message: string) => {
  snackbar.value = { show: true, message, color: 'success' }
}

const showError = (message: string) => {
  snackbar.value = { show: true, message, color: 'error' }
}

const formData = ref<ConnectionFormData>({
  name: '',
  connection_type: 'hosting',
  data_center: 'com',
  host: '',
  token: '',
  sync_interval: 5,
  cms_url: '',
})

// Дата-центры Wialon Hosting
const dataCenters = [
  { title: 'Основной (hst-api.wialon.com)', value: 'com' },
  { title: 'США (hst-api.wialon.us)', value: 'us' },
  { title: 'Европа (hst-api.wialon.eu)', value: 'eu' },
  { title: 'Дополнительный (hst-api.wialon.org)', value: 'org' },
  { title: 'Альтернативный (hst-api.regwialon.com)', value: 'alt' },
]

import { config } from '@/config/env'

// API - используем централизованную конфигурацию
const API_BASE = config.backendUrl

const getAuthHeaders = () => {
  const token = localStorage.getItem('axenta_token')
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  }
}

// Загрузка подключений
const loadConnections = async () => {
  loading.value = true
  try {
    console.log('🔄 Загрузка подключений...', API_BASE)
    const response = await fetch(`${API_BASE}/api/wialon/connections`, {
      headers: getAuthHeaders(),
    })
    console.log('📡 Ответ:', response.status, response.statusText)
    const data = await response.json()
    console.log('📦 Данные:', data)
    if (data.success) {
      connections.value = data.data.connections || []
      console.log('✅ Загружено подключений:', connections.value.length)
    } else {
      console.error('❌ Ошибка от сервера:', data.error)
      showError(data.error || 'Ошибка загрузки')
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки подключений:', error)
    showError('Ошибка загрузки подключений Wialon')
  } finally {
    loading.value = false
  }
}

// Создание подключения
const createConnection = async () => {
  try {
    const body: Record<string, unknown> = {
      name: formData.value.name,
      connection_type: formData.value.connection_type,
      token: formData.value.token,
      sync_interval: formData.value.sync_interval,
    }

    if (formData.value.connection_type === 'hosting') {
      body.data_center = formData.value.data_center
    } else {
      body.host = formData.value.host
      if (formData.value.cms_url) {
        body.cms_url = formData.value.cms_url
      }
    }

    const response = await fetch(`${API_BASE}/api/wialon/connections`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    })
    const data = await response.json()
    
    if (data.success) {
      showSuccess('Подключение успешно создано')
      showDialog.value = false
      await loadConnections()
      resetForm()
    } else {
      showError(data.error || 'Ошибка создания подключения')
    }
  } catch (error) {
    console.error('Ошибка создания подключения:', error)
    showError('Ошибка создания подключения')
  }
}

// Обновление подключения
const updateConnection = async () => {
  if (!editingConnectionId.value) return
  
  try {
    const body: Record<string, unknown> = {
      name: formData.value.name,
      connection_type: formData.value.connection_type,
      sync_interval: formData.value.sync_interval,
    }

    if (formData.value.token) {
      body.token = formData.value.token
    }

    if (formData.value.connection_type === 'hosting') {
      body.data_center = formData.value.data_center
    } else {
      body.host = formData.value.host
      body.cms_url = formData.value.cms_url || ''
    }

    const response = await fetch(`${API_BASE}/api/wialon/connections/${editingConnectionId.value}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    })
    const data = await response.json()
    
    if (data.success) {
      showSuccess('Подключение успешно обновлено')
      showDialog.value = false
      await loadConnections()
      resetForm()
    } else {
      showError(data.error || 'Ошибка обновления подключения')
    }
  } catch (error) {
    console.error('Ошибка обновления подключения:', error)
    showError('Ошибка обновления подключения')
  }
}

// Удаление подключения
const deleteConnection = async (id: number) => {
  if (!confirm('Вы уверены, что хотите удалить это подключение?')) return
  
  try {
    const response = await fetch(`${API_BASE}/api/wialon/connections/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    
    if (data.success) {
      showSuccess('Подключение удалено')
      await loadConnections()
    } else {
      showError(data.error || 'Ошибка удаления подключения')
    }
  } catch (error) {
    console.error('Ошибка удаления подключения:', error)
    showError('Ошибка удаления подключения')
  }
}

// Тест подключения
const testConnection = async (id: number) => {
  testingConnection.value = true
  testResult.value = null
  
  try {
    const response = await fetch(`${API_BASE}/api/wialon/connections/${id}/test`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    
    testResult.value = {
      success: data.success,
      message: data.message,
      user_name: data.data?.user_name,
    }
    
    if (data.success) {
      showSuccess('Подключение работает')
      await loadConnections() // Обновляем для получения нового user_name
    } else {
      showError(data.message || 'Ошибка подключения')
    }
  } catch (error) {
    console.error('Ошибка теста подключения:', error)
    showError('Ошибка теста подключения')
  } finally {
    testingConnection.value = false
  }
}

// Переключение активности
const toggleActive = async (connection: WialonConnection) => {
  try {
    const response = await fetch(`${API_BASE}/api/wialon/connections/${connection.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_active: !connection.is_active }),
    })
    const data = await response.json()
    
    if (data.success) {
      showSuccess(connection.is_active ? 'Подключение отключено' : 'Подключение включено')
      await loadConnections()
    }
  } catch (error) {
    console.error('Ошибка переключения статуса:', error)
  }
}

// Открытие диалога редактирования
const openEditDialog = (connection: WialonConnection) => {
  dialogMode.value = 'edit'
  editingConnectionId.value = connection.id
  formData.value = {
    name: connection.name,
    connection_type: connection.connection_type,
    data_center: connection.data_center || 'com',
    host: connection.host,
    token: '', // Не показываем токен при редактировании
    sync_interval: connection.sync_interval,
    cms_url: connection.cms_url || '',
  }
  showDialog.value = true
}

// Открытие диалога создания
const openCreateDialog = () => {
  dialogMode.value = 'create'
  editingConnectionId.value = null
  resetForm()
  showDialog.value = true
}

// Сброс формы
const resetForm = () => {
  formData.value = {
    name: '',
    connection_type: 'hosting',
    data_center: 'com',
    host: '',
    token: '',
    sync_interval: 5,
    cms_url: '',
  }
  testResult.value = null
}

// Обработка сохранения
const handleSave = async () => {
  if (dialogMode.value === 'create') {
    await createConnection()
  } else {
    await updateConnection()
  }
}

// Открыть OAuth страницу Wialon для получения токена
const openWialonOAuth = () => {
  const accessType = -1 // Бессрочный токен (-1 = unlimited)
  const appName = 'Axenta'
  let oauthUrl = ''
  
  if (formData.value.connection_type === 'hosting') {
    // URL для OAuth авторизации Wialon Hosting 
    const oauthUrls: Record<string, string> = {
      'com': 'https://hosting.wialon.com',
      'us': 'https://hosting.wialon.us',
      'eu': 'https://hosting.wialon.eu',
      'org': 'https://hosting.wialon.org',
      'alt': 'https://hosting.regwialon.com',
    }
    const baseUrl = oauthUrls[formData.value.data_center] || oauthUrls['com']
    oauthUrl = `${baseUrl}/login.html?client_id=${appName}&access_type=${accessType}&activation_time=0&duration=0&flags=0x1`
  } else if (formData.value.connection_type === 'local' && formData.value.host) {
    const host = formData.value.host.replace(/\/$/, '')
    oauthUrl = `${host}/login.html?client_id=${appName}&access_type=${accessType}&activation_time=0&duration=0&flags=0x1`
  }
  
  if (!oauthUrl) {
    showError('Для получения токена введите URL хоста')
    return
  }

  // Открываем в новой вкладке
  window.open(oauthUrl, '_blank')
}

// Вставить токен из буфера обмена
const pasteTokenFromClipboard = async () => {
  try {
    const clipboardText = await navigator.clipboard.readText()
    
    // Извлекаем access_token если скопирован весь URL
    if (clipboardText.includes('access_token=')) {
      const match = clipboardText.match(/access_token=([^&\s]+)/)
      if (match) {
        formData.value.token = match[1]
        showSuccess('Токен извлечён из URL и вставлен!')
        return
      }
    }
    
    // Если это просто токен (без URL), вставляем как есть
    if (clipboardText && clipboardText.length > 20) {
      formData.value.token = clipboardText.trim()
      showSuccess('Токен вставлен!')
    } else {
      showError('Буфер обмена пуст или содержит неверные данные')
    }
  } catch (e) {
    showError('Не удалось прочитать буфер обмена. Вставьте токен вручную (Ctrl+V)')
  }
}

// Вычисляемые свойства
const isFormValid = computed(() => {
  if (!formData.value.name) return false
  if (dialogMode.value === 'create' && !formData.value.token) return false
  if (formData.value.connection_type === 'local' && !formData.value.host) return false
  return true
})

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Никогда'
  return new Date(dateString).toLocaleString('ru-RU')
}

const getConnectionStatusColor = (connection: WialonConnection) => {
  if (!connection.is_active) return 'grey'
  if (connection.last_error_at) return 'error'
  if (connection.last_sync_at) return 'success'
  return 'warning'
}

const getConnectionStatusIcon = (connection: WialonConnection) => {
  if (!connection.is_active) return 'mdi-power-off'
  if (connection.last_error_at) return 'mdi-alert-circle'
  if (connection.last_sync_at) return 'mdi-check-circle'
  return 'mdi-clock-outline'
}

// Инициализация
onMounted(() => {
  loadConnections()
})
</script>

<template>
  <div class="wialon-connections-settings">
    <!-- Заголовок с кнопкой добавления -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h3 class="text-h6 mb-1">Подключения Wialon</h3>
        <p class="text-body-2 text-medium-emphasis">
          Управление несколькими подключениями к Wialon Hosting и Wialon Local
        </p>
      </div>
      <v-btn color="primary" @click="openCreateDialog">
        <v-icon start>mdi-plus</v-icon>
        Добавить подключение
      </v-btn>
    </div>

    <!-- Загрузка -->
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <!-- Список подключений -->
    <div v-if="connections.length > 0" class="connections-list">
      <v-card
        v-for="connection in connections"
        :key="connection.id"
        class="mb-3"
        :class="{ 'opacity-60': !connection.is_active }"
      >
        <v-card-text class="d-flex align-center">
          <!-- Статус -->
          <v-icon
            :color="getConnectionStatusColor(connection)"
            size="32"
            class="mr-4"
          >
            {{ getConnectionStatusIcon(connection) }}
          </v-icon>

          <!-- Информация -->
          <div class="flex-grow-1">
            <div class="d-flex align-center mb-1">
              <span class="text-subtitle-1 font-weight-medium">
                {{ connection.name }}
                <span v-if="connection.user_name && !connection.name.includes(connection.user_name)" class="text-medium-emphasis">({{ connection.user_name }})</span>
              </span>
              <v-chip
                size="x-small"
                :color="connection.is_active ? 'success' : (connection.connection_type === 'hosting' ? 'primary' : 'secondary')"
                class="ml-2"
              >
                {{ connection.connection_type === 'hosting' ? 'Hosting' : 'Local' }}
              </v-chip>
            </div>
            
            <div class="text-body-2 text-medium-emphasis">
              <span>{{ connection.host }}</span>
              <span class="mx-2">•</span>
              <span>Объектов: {{ connection.units_count }}</span>
              <span v-if="connection.local_version" class="mx-2">•</span>
              <span v-if="connection.local_version" class="text-primary">{{ connection.local_version }}</span>
            </div>

            <div class="text-caption text-medium-emphasis mt-1">
              Последняя синхр.: {{ formatDate(connection.last_sync_at) }}
              <span v-if="connection.error_message" class="text-error ml-2">
                {{ connection.error_message }}
              </span>
            </div>
          </div>

          <!-- Действия -->
          <div class="d-flex align-center gap-2">
            <v-btn
              icon
              variant="text"
              size="small"
              :loading="testingConnection"
              @click="testConnection(connection.id)"
              title="Проверить подключение"
            >
              <v-icon>mdi-connection</v-icon>
            </v-btn>
            
            <v-btn
              icon
              variant="text"
              size="small"
              @click="toggleActive(connection)"
              :title="connection.is_active ? 'Отключить' : 'Включить'"
            >
              <v-icon>{{ connection.is_active ? 'mdi-toggle-switch' : 'mdi-toggle-switch-off' }}</v-icon>
            </v-btn>

            <v-btn
              icon
              variant="text"
              size="small"
              @click="openEditDialog(connection)"
              title="Редактировать"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>

            <v-btn
              icon
              variant="text"
              size="small"
              color="error"
              @click="deleteConnection(connection.id)"
              title="Удалить"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Пустой список -->
    <v-card v-else-if="!loading" class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-satellite-uplink</v-icon>
      <p class="text-h6 text-medium-emphasis mb-2">Нет подключений Wialon</p>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Добавьте подключение к Wialon Hosting или Wialon Local для синхронизации объектов
      </p>
      <v-btn color="primary" @click="openCreateDialog">
        <v-icon start>mdi-plus</v-icon>
        Добавить подключение
      </v-btn>
    </v-card>

    <!-- Диалог создания/редактирования -->
    <v-dialog v-model="showDialog" max-width="600">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon start color="primary">mdi-satellite-uplink</v-icon>
          {{ dialogMode === 'create' ? 'Новое подключение Wialon' : 'Редактирование подключения' }}
        </v-card-title>

        <v-card-text>
          <!-- Название -->
          <v-text-field
            v-model="formData.name"
            label="Название подключения"
            placeholder="Например: Основной офис"
            variant="outlined"
            class="mb-4"
          />

          <!-- Тип подключения -->
          <v-radio-group v-model="formData.connection_type" inline class="mb-4" color="primary">
            <v-radio label="Wialon Hosting (облачный)" value="hosting" color="primary" />
            <v-radio label="Wialon Local (локальный)" value="local" color="primary" />
          </v-radio-group>

          <!-- Дата-центр (для Hosting) -->
          <v-select
            v-if="formData.connection_type === 'hosting'"
            v-model="formData.data_center"
            :items="dataCenters"
            label="Дата-центр"
            variant="outlined"
            class="mb-4"
          />

          <!-- URL хоста (для Local) -->
          <v-text-field
            v-if="formData.connection_type === 'local'"
            v-model="formData.host"
            label="URL хоста"
            placeholder="https://wialon.mycompany.kz"
            hint="Полный URL вашего сервера Wialon Local"
            persistent-hint
            variant="outlined"
            class="mb-4"
          />

          <!-- API Token -->
          <v-text-field
            v-model="formData.token"
            :label="dialogMode === 'create' ? 'API Token' : 'API Token (оставьте пустым, чтобы не менять)'"
            :placeholder="dialogMode === 'create' ? 'Введите токен' : '••••••••'"
            type="password"
            variant="outlined"
            class="mb-2"
          />

          <!-- Кнопки получения токена -->
          <div class="d-flex gap-2 mb-2">
            <v-btn
              color="primary"
              variant="tonal"
              size="small"
              prepend-icon="mdi-key"
              @click="openWialonOAuth"
              :disabled="formData.connection_type === 'local' && !formData.host"
            >
              Получить токен
            </v-btn>
            <v-btn
              color="secondary"
              variant="tonal"
              size="small"
              prepend-icon="mdi-content-paste"
              @click="pasteTokenFromClipboard"
            >
              Вставить из буфера
            </v-btn>
          </div>
          <div class="text-caption text-medium-emphasis mb-3">
            <span v-if="formData.connection_type === 'hosting'">
              1. Нажмите "Получить токен" → авторизуйтесь в Wialon<br>
              2. Скопируйте URL из адресной строки (Ctrl+L, Ctrl+C)<br>
              3. Нажмите "Вставить из буфера" — токен извлечётся автоматически
            </span>
            <span v-else>
              <span v-if="!formData.host" class="text-warning">Сначала введите URL хоста</span>
              <span v-else>
                1. Нажмите "Получить токен" → авторизуйтесь<br>
                2. Скопируйте URL целиком → нажмите "Вставить из буфера"
              </span>
            </span>
          </div>

          <!-- Интервал синхронизации -->
          <v-text-field
            v-model.number="formData.sync_interval"
            label="Интервал синхронизации (минуты)"
            type="number"
            min="1"
            max="60"
            variant="outlined"
          />

          <!-- CMS URL (только для Wialon Local) -->
          <v-text-field
            v-if="formData.connection_type === 'local'"
            v-model="formData.cms_url"
            label="URL CMS-интерфейса (опционально)"
            placeholder="https://cms-app.gpsnetwork.ru"
            variant="outlined"
            hint="Укажите URL для CMS Manager, если он отличается от /cms_manager/"
            persistent-hint
          />

          <!-- Результат теста -->
          <v-alert
            v-if="testResult"
            :type="testResult.success ? 'success' : 'error'"
            class="mt-4"
            closable
            @click:close="testResult = null"
          >
            {{ testResult.message }}
            <span v-if="testResult.user_name"> ({{ testResult.user_name }})</span>
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDialog = false">Отмена</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :disabled="!isFormValid"
            @click="handleSave"
          >
            {{ dialogMode === 'create' ? 'Создать' : 'Сохранить' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar для уведомлений -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.wialon-connections-settings {
  padding: 16px;
}

.connections-list {
  display: flex;
  flex-direction: column;
}

.opacity-60 {
  opacity: 0.6;
}

.gap-2 {
  gap: 8px;
}
</style>
