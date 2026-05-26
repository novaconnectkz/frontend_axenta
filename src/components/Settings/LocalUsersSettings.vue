<!--
  Управление локальными пользователями ACRM (AUTH_MODE=local).
  Список + создание + удаление + сброс пароля.
  BE endpoints: GET/POST/DELETE /api/local/users(+register/:id)
  Доступ: list+register — admin+superadmin; delete+reset — superadmin only.
  Каждое действие требует Bearer JWT (local-auth middleware).
-->
<template>
  <div class="local-users-settings">
    <!-- Header -->
    <v-card-text class="pa-0 mb-4">
      <div class="d-flex align-center justify-space-between flex-wrap gap-3">
        <div>
          <div class="text-subtitle-1 font-weight-medium">Локальные учётные записи</div>
          <div class="text-caption text-medium-emphasis">
            Пользователи с собственным паролем (bcrypt) — без зависимости от Axenta Cloud
          </div>
        </div>
        <v-btn
          color="primary"
          prepend-icon="mdi-account-plus"
          :disabled="!canAdmin"
          @click="openCreateDialog"
        >
          Создать
        </v-btn>
      </div>
    </v-card-text>

    <!-- Ошибки/инфо -->
    <v-alert
      v-if="alert.message"
      :type="alert.type"
      class="mb-4"
      closable
      @click:close="alert.message = ''"
    >
      {{ alert.message }}
    </v-alert>

    <!-- Список -->
    <v-card variant="outlined">
      <v-data-table
        :headers="headers"
        :items="users"
        :loading="loading"
        :items-per-page="50"
        density="compact"
        no-data-text="Пока нет локальных учёток"
        loading-text="Загружаем..."
      >
        <template #item.role="{ item }">
          <v-chip
            size="small"
            :color="roleColor(item.role)"
            variant="tonal"
          >
            {{ roleLabel(item.role) }}
          </v-chip>
        </template>

        <template #item.is_active="{ item }">
          <v-icon v-if="item.is_active" icon="mdi-check-circle" color="success" />
          <v-icon v-else icon="mdi-cancel" color="grey" />
        </template>

        <template #item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>

        <template #item.actions="{ item }">
          <div class="d-inline-flex align-center" style="white-space: nowrap; gap: 4px;">
            <v-btn
              icon="mdi-history"
              variant="text"
              size="x-small"
              density="compact"
              :disabled="!canAdmin"
              @click="openHistoryDialog(item)"
              title="История событий"
            />
            <v-btn
              icon="mdi-pencil"
              variant="text"
              size="x-small"
              density="compact"
              :disabled="!canAdmin"
              @click="openEditDialog(item)"
              title="Редактировать"
            />
            <v-btn
              icon="mdi-key-variant"
              variant="text"
              size="x-small"
              density="compact"
              :disabled="!isSuperadmin"
              @click="openResetDialog(item)"
              title="Сбросить пароль"
            />
            <v-btn
              icon="mdi-delete"
              variant="text"
              size="x-small"
              density="compact"
              color="error"
              :disabled="!isSuperadmin || item.id === currentUserId || isSuperadminUser(item)"
              @click="confirmDelete(item)"
              :title="isSuperadminUser(item) ? 'Суперадмина нельзя удалить' : 'Удалить'"
            />
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Диалог создания -->
    <v-dialog v-model="createDialog.open" max-width="500">
      <v-card>
        <v-card-title>Создать локальную учётку</v-card-title>
        <v-card-text>
          <v-form ref="createForm" @submit.prevent="submitCreate">
            <v-text-field
              v-model="createDialog.form.username"
              label="Логин"
              :rules="[r.required, r.minLen(3)]"
              autocomplete="off"
              autofocus
            />
            <v-text-field
              v-model="createDialog.form.email"
              label="Email"
              type="email"
              :rules="[r.required, r.email]"
              autocomplete="off"
            />
            <v-text-field
              v-model="createDialog.form.name"
              label="Имя"
              :rules="[r.required]"
              autocomplete="off"
            />
            <v-select
              v-model="createDialog.form.role"
              label="Роль"
              :items="roleOptions"
              item-title="label"
              item-value="value"
            />
            <v-alert type="info" variant="tonal" density="compact" class="mt-2">
              Временный пароль будет сгенерирован автоматически и отправлен на email пользователя.
              Юзер сменит его при первом входе в разделе «Профиль».
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="createDialog.open = false">Отмена</v-btn>
          <v-btn
            color="primary"
            :loading="createDialog.submitting"
            @click="submitCreate"
          >
            Создать
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог истории событий -->
    <v-dialog v-model="historyDialog.open" max-width="800">
      <v-card>
        <v-card-title>
          История: {{ historyDialog.target?.username }}
        </v-card-title>
        <v-card-text class="pa-0" style="max-height: 60vh; overflow-y: auto;">
          <div v-if="historyDialog.loading" class="text-center py-6">
            <v-progress-circular indeterminate color="primary" />
          </div>
          <div v-else-if="historyDialog.entries.length === 0" class="text-center py-6 text-medium-emphasis">
            История пуста
          </div>
          <v-timeline v-else density="compact" side="end" class="pa-4">
            <v-timeline-item
              v-for="e in historyDialog.entries"
              :key="e.id"
              :dot-color="eventColor(e.action)"
              :icon="eventIcon(e.action)"
              size="small"
            >
              <template #opposite>
                <div class="text-caption">{{ formatDateFull(e.timestamp) }}</div>
              </template>
              <div>
                <div class="font-weight-medium">{{ eventLabel(e.action) }}</div>
                <div v-if="e.username" class="text-caption">
                  Выполнил: <code>{{ e.username }}</code>
                </div>
                <div v-if="e.details?.email" class="text-caption">
                  email: <code>{{ e.details.email }}</code>
                </div>
                <div v-if="e.details?.fields" class="text-caption">
                  поля: <code>{{ Array.isArray(e.details.fields) ? e.details.fields.join(', ') : e.details.fields }}</code>
                </div>
                <div v-if="e.details?.error" class="text-caption text-error">
                  Ошибка: {{ e.details.error }}
                </div>
                <div v-if="e.ip" class="text-caption text-medium-emphasis">IP: {{ e.ip }}</div>
              </div>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="historyDialog.open = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог редактирования -->
    <v-dialog v-model="editDialog.open" max-width="500">
      <v-card>
        <v-card-title>
          Редактировать: {{ editDialog.target?.username }}
        </v-card-title>
        <v-card-text>
          <v-alert
            v-if="editDialog.target && isSuperadminUser(editDialog.target)"
            type="info" variant="tonal" class="mb-4" density="compact"
          >
            Суперадмин: можно менять email/имя. Деактивация заблокирована.
          </v-alert>
          <v-text-field
            v-model="editDialog.form.email"
            label="Email"
            type="email"
            :rules="[r.required, r.email]"
            autocomplete="off"
          />
          <v-text-field
            v-model="editDialog.form.name"
            label="Имя"
            :rules="[r.required]"
            autocomplete="off"
          />
          <v-switch
            v-model="editDialog.form.is_active"
            label="Активен"
            color="success"
            :disabled="editDialog.target ? isSuperadminUser(editDialog.target) : false"
            inset
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="editDialog.open = false">Отмена</v-btn>
          <v-btn
            color="primary"
            :loading="editDialog.submitting"
            @click="submitEdit"
          >
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог сброса пароля -->
    <v-dialog v-model="resetDialog.open" max-width="500">
      <v-card>
        <v-card-title>
          Сброс пароля: {{ resetDialog.target?.username }}
        </v-card-title>
        <v-card-text>
          <v-alert type="warning" variant="tonal" class="mb-4" density="compact">
            Все активные сессии пользователя будут инвалидированы (token_version+1).
          </v-alert>
          <v-text-field
            v-model="resetDialog.newPassword"
            label="Новый пароль (мин. 10 символов)"
            :type="resetDialog.showPassword ? 'text' : 'password'"
            :rules="[r.required, r.minLen(10)]"
            :append-inner-icon="resetDialog.showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="resetDialog.showPassword = !resetDialog.showPassword"
            autocomplete="new-password"
          />
          <v-btn
            size="small"
            variant="text"
            prepend-icon="mdi-dice-multiple"
            @click="generateResetPassword"
          >
            Сгенерировать
          </v-btn>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="resetDialog.open = false">Отмена</v-btn>
          <v-btn
            color="warning"
            :loading="resetDialog.submitting"
            @click="submitReset"
          >
            Сбросить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Подтверждение удаления -->
    <v-dialog v-model="deleteDialog.open" max-width="450">
      <v-card>
        <v-card-title>Удалить «{{ deleteDialog.target?.username }}»?</v-card-title>
        <v-card-text>
          Действие необратимо. Все refresh-токены пользователя будут удалены.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog.open = false">Отмена</v-btn>
          <v-btn
            color="error"
            :loading="deleteDialog.submitting"
            @click="submitDelete"
          >
            Удалить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { config } from '@/config/env'

interface LocalUser {
  id: number
  username: string
  email: string
  name: string
  role: 'superadmin' | 'admin' | 'user' | string
  company_id: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

// API URL — единая база с остальным FE
const API_URL = (config as any)?.apiBaseUrl || ''

// Текущий юзер из axenta_token (JWT). Берём role из localStorage (Settings.vue
// родитель не передаёт, поэтому декодируем JWT-payload здесь).
const decodeJwt = (token: string): any => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    return JSON.parse(atob(b64))
  } catch { return null }
}

const currentClaims = computed(() => {
  const t = localStorage.getItem('axenta_token') || ''
  return decodeJwt(t) || {}
})
const currentRole = computed<string>(() => String(currentClaims.value?.role || ''))
const currentUserId = computed<number | null>(() => {
  const sub = currentClaims.value?.sub
  return sub != null ? Number(sub) : null
})
const isSuperadmin = computed(() => currentRole.value === 'superadmin')
const canAdmin = computed(() => isSuperadmin.value || currentRole.value === 'admin')

// State
const users = ref<LocalUser[]>([])
const loading = ref(false)
const alert = ref<{ type: 'success' | 'error' | 'info' | 'warning', message: string }>({
  type: 'info', message: ''
})

const headers = [
  { title: 'Логин', key: 'username', cellProps: { style: 'white-space:nowrap;' } },
  { title: 'Имя', key: 'name', cellProps: { style: 'white-space:normal; word-break:break-word;' } },
  { title: 'Email', key: 'email', cellProps: { style: 'white-space:normal; word-break:break-all;' } },
  { title: 'Роль', key: 'role', cellProps: { style: 'white-space:nowrap;' } },
  { title: 'Активен', key: 'is_active', align: 'center' as const },
  { title: 'Создан', key: 'created_at', cellProps: { style: 'white-space:nowrap;' } },
  { title: '', key: 'actions', sortable: false, align: 'end' as const, cellProps: { style: 'white-space:nowrap;' } },
]

const roleOptions = [
  { label: 'Пользователь', value: 'user' },
  { label: 'Администратор', value: 'admin' },
]

// Создание
const createForm = ref<any>(null)
const createDialog = ref({
  open: false,
  showPassword: false,
  submitting: false,
  form: {
    username: '',
    email: '',
    name: '',
    role: 'user' as 'user' | 'admin',
  }
})

// Сброс
const resetDialog = ref<{
  open: boolean,
  target: LocalUser | null,
  newPassword: string,
  showPassword: boolean,
  submitting: boolean
}>({
  open: false, target: null, newPassword: '', showPassword: false, submitting: false
})

// История событий
interface AuditEntry {
  id: number
  timestamp: string
  action: string
  username?: string
  ip?: string
  details?: Record<string, any>
}
const historyDialog = ref<{
  open: boolean,
  target: LocalUser | null,
  entries: AuditEntry[],
  loading: boolean
}>({
  open: false, target: null, entries: [], loading: false
})

// Редактирование
const editDialog = ref<{
  open: boolean,
  target: LocalUser | null,
  form: { email: string, name: string, is_active: boolean },
  submitting: boolean
}>({
  open: false, target: null,
  form: { email: '', name: '', is_active: true },
  submitting: false
})

// Удаление
const deleteDialog = ref<{
  open: boolean,
  target: LocalUser | null,
  submitting: boolean
}>({
  open: false, target: null, submitting: false
})

const r = {
  required: (v: any) => !!v || 'Обязательное поле',
  minLen: (n: number) => (v: string) => (v && v.length >= n) || `Минимум ${n} символов`,
  email: (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) || 'Невалидный email',
}

const roleLabel = (role: string) => {
  switch (role) {
    case 'superadmin': return 'Суперадмин'
    case 'admin': return 'Администратор'
    case 'user': return 'Пользователь'
    default: return role
  }
}

const roleColor = (role: string) => {
  switch (role) {
    case 'superadmin': return 'red'
    case 'admin': return 'orange'
    case 'user': return 'blue'
    default: return 'grey'
  }
}

const formatDate = (iso?: string) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  } catch { return iso }
}

const authHeader = () => {
  const t = localStorage.getItem('axenta_token') || ''
  return { Authorization: `Bearer ${t}` }
}

const showError = (msg: string) => {
  alert.value = { type: 'error', message: msg }
}
const showSuccess = (msg: string) => {
  alert.value = { type: 'success', message: msg }
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const resp = await axios.get(`${API_URL}/local/users`, { headers: authHeader() })
    users.value = (resp.data?.data || []) as LocalUser[]
  } catch (err: any) {
    showError(err.response?.data?.error || 'Не удалось загрузить список')
  } finally {
    loading.value = false
  }
}

// Криптослучайный пароль (16 символов, a-zA-Z0-9)
const genPassword = () => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(b => alphabet[b % alphabet.length]).join('')
}

const generateResetPassword = () => {
  resetDialog.value.newPassword = genPassword()
  resetDialog.value.showPassword = true
}

const openCreateDialog = () => {
  createDialog.value.form = { username: '', email: '', name: '', role: 'user' }
  createDialog.value.showPassword = false
  createDialog.value.open = true
}

const submitCreate = async () => {
  const { valid } = (await createForm.value?.validate()) || { valid: true }
  if (valid === false) return
  createDialog.value.submitting = true
  try {
    const resp = await axios.post(
      `${API_URL}/local/register`,
      createDialog.value.form,
      { headers: { ...authHeader(), 'Content-Type': 'application/json' } }
    )
    const u = createDialog.value.form.username
    const e = createDialog.value.form.email
    const emailed = resp.data?.emailed
    if (emailed === false) {
      alert.value = {
        type: 'warning',
        message: `Пользователь ${u} создан, но письмо с паролем НЕ отправлено: ${resp.data?.email_error || 'unknown'}. Проверьте SMTP в /control-plane.`,
      }
    } else {
      showSuccess(`Пользователь ${u} создан. Письмо с паролем отправлено на ${e}.`)
    }
    createDialog.value.open = false
    await fetchUsers()
  } catch (err: any) {
    showError(err.response?.data?.error || 'Ошибка создания')
  } finally {
    createDialog.value.submitting = false
  }
}

const formatDateFull = (iso?: string) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
  } catch { return iso }
}

const eventLabel = (action: string): string => {
  const map: Record<string, string> = {
    'local_user.created': 'Создан',
    'local_user.welcome_email_sent': '✉️ Welcome-email отправлен',
    'local_user.welcome_email_failed': '⚠️ Welcome-email НЕ отправлен',
    'local_user.password_changed': 'Сменил пароль сам',
    'local_user.password_reset_by_admin': 'Пароль сброшен админом',
    'local_user.reset_requested': '✉️ Forgot-password: ссылка отправлена',
    'local_user.reset_email_failed': '⚠️ Forgot-password: email НЕ отправлен',
    'local_user.reset_completed': 'Пароль сброшен по email-ссылке',
    'local_user.updated': 'Обновлены данные',
    'local_user.deleted': 'Удалён',
  }
  return map[action] || action
}

const eventIcon = (action: string): string => {
  if (action.includes('email_sent') || action.includes('reset_requested')) return 'mdi-email-check'
  if (action.includes('email_failed')) return 'mdi-email-alert'
  if (action.includes('password_changed')) return 'mdi-key-change'
  if (action.includes('password_reset')) return 'mdi-lock-reset'
  if (action.includes('created')) return 'mdi-account-plus'
  if (action.includes('deleted')) return 'mdi-account-remove'
  if (action.includes('updated')) return 'mdi-account-edit'
  return 'mdi-circle-small'
}

const eventColor = (action: string): string => {
  if (action.includes('failed')) return 'error'
  if (action.includes('deleted')) return 'error'
  if (action.includes('email_sent') || action.includes('reset_requested')) return 'info'
  if (action.includes('password')) return 'warning'
  if (action.includes('created')) return 'success'
  return 'primary'
}

const openHistoryDialog = async (target: LocalUser) => {
  historyDialog.value = { open: true, target, entries: [], loading: true }
  try {
    const resp = await axios.get(
      `${API_URL}/local/users/${target.id}/history`,
      { headers: authHeader() }
    )
    historyDialog.value.entries = (resp.data?.data || []) as AuditEntry[]
  } catch (err: any) {
    showError(err.response?.data?.error || 'Ошибка загрузки истории')
    historyDialog.value.entries = []
  } finally {
    historyDialog.value.loading = false
  }
}

const isSuperadminUser = (u: LocalUser): boolean => {
  return u?.role === 'superadmin' || (u as any)?.is_superadmin === true
}

const openEditDialog = (target: LocalUser) => {
  editDialog.value = {
    open: true,
    target,
    form: {
      email: target.email || '',
      name: target.name || '',
      is_active: target.is_active !== false,
    },
    submitting: false,
  }
}

const submitEdit = async () => {
  if (!editDialog.value.target) return
  if (!editDialog.value.form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(editDialog.value.form.email)) {
    showError('Невалидный email'); return
  }
  if (!editDialog.value.form.name.trim()) {
    showError('Имя не может быть пустым'); return
  }
  editDialog.value.submitting = true
  try {
    const payload: any = {
      email: editDialog.value.form.email,
      name: editDialog.value.form.name,
    }
    // is_active отправляем только если изменилось (superadmin его всё равно не сможет менять)
    if (editDialog.value.form.is_active !== editDialog.value.target.is_active) {
      payload.is_active = editDialog.value.form.is_active
    }
    await axios.patch(
      `${API_URL}/local/users/${editDialog.value.target.id}`,
      payload,
      { headers: { ...authHeader(), 'Content-Type': 'application/json' } }
    )
    showSuccess(`Данные ${editDialog.value.target.username} обновлены`)
    editDialog.value.open = false
    await fetchUsers()
  } catch (err: any) {
    showError(err.response?.data?.error || 'Ошибка сохранения')
  } finally {
    editDialog.value.submitting = false
  }
}

const openResetDialog = (target: LocalUser) => {
  resetDialog.value = {
    open: true, target, newPassword: '', showPassword: false, submitting: false
  }
}

const submitReset = async () => {
  if (resetDialog.value.newPassword.length < 10) {
    showError('Пароль минимум 10 символов')
    return
  }
  resetDialog.value.submitting = true
  try {
    await axios.post(
      `${API_URL}/local/users/${resetDialog.value.target?.id}/reset-password`,
      { new_password: resetDialog.value.newPassword },
      { headers: { ...authHeader(), 'Content-Type': 'application/json' } }
    )
    showSuccess(`Пароль ${resetDialog.value.target?.username} сброшен`)
    resetDialog.value.open = false
  } catch (err: any) {
    showError(err.response?.data?.error || 'Ошибка сброса пароля')
  } finally {
    resetDialog.value.submitting = false
  }
}

const confirmDelete = (target: LocalUser) => {
  deleteDialog.value = { open: true, target, submitting: false }
}

const submitDelete = async () => {
  deleteDialog.value.submitting = true
  try {
    await axios.delete(
      `${API_URL}/local/users/${deleteDialog.value.target?.id}`,
      { headers: authHeader() }
    )
    showSuccess(`Пользователь ${deleteDialog.value.target?.username} удалён`)
    deleteDialog.value.open = false
    await fetchUsers()
  } catch (err: any) {
    showError(err.response?.data?.error || 'Ошибка удаления')
  } finally {
    deleteDialog.value.submitting = false
  }
}

onMounted(fetchUsers)
</script>

<style scoped>
.local-users-settings {
  width: 100%;
  min-width: 0;
}
.local-users-settings :deep(.v-data-table),
.local-users-settings :deep(.v-table) {
  width: 100%;
  max-width: 100%;
}
.local-users-settings :deep(.v-table__wrapper) {
  overflow-x: hidden !important;
  max-width: 100%;
}
.local-users-settings :deep(.v-data-table table),
.local-users-settings :deep(.v-table table) {
  width: 100% !important;
  min-width: 0 !important;
}
.local-users-settings :deep(.v-data-table td),
.local-users-settings :deep(.v-data-table th) {
  padding-inline: 4px !important;
}
.local-users-settings :deep(.v-data-table td:first-child),
.local-users-settings :deep(.v-data-table th:first-child) {
  padding-inline-start: 8px !important;
}
.local-users-settings :deep(.v-data-table td:last-child),
.local-users-settings :deep(.v-data-table th:last-child) {
  padding-inline-end: 8px !important;
}
</style>
