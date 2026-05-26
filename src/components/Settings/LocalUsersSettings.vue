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
        density="comfortable"
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
          <v-btn
            icon="mdi-key-variant"
            variant="text"
            size="small"
            :disabled="!isSuperadmin"
            @click="openResetDialog(item)"
            title="Сбросить пароль"
          />
          <v-btn
            icon="mdi-delete"
            variant="text"
            size="small"
            color="error"
            :disabled="!isSuperadmin || item.id === currentUserId"
            @click="confirmDelete(item)"
            title="Удалить"
          />
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
            <v-text-field
              v-model="createDialog.form.password"
              label="Пароль (мин. 10 символов)"
              :type="createDialog.showPassword ? 'text' : 'password'"
              :rules="[r.required, r.minLen(10)]"
              :append-inner-icon="createDialog.showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="createDialog.showPassword = !createDialog.showPassword"
              autocomplete="new-password"
            />
            <v-btn
              size="small"
              variant="text"
              prepend-icon="mdi-dice-multiple"
              @click="generatePassword"
            >
              Сгенерировать
            </v-btn>
            <v-select
              v-model="createDialog.form.role"
              label="Роль"
              :items="roleOptions"
              item-title="label"
              item-value="value"
            />
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
  { title: 'ID', key: 'id', width: '70px' },
  { title: 'Логин', key: 'username' },
  { title: 'Имя', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Роль', key: 'role', width: '120px' },
  { title: 'Активен', key: 'is_active', width: '100px', align: 'center' as const },
  { title: 'Создан', key: 'created_at', width: '160px' },
  { title: '', key: 'actions', sortable: false, width: '120px', align: 'end' as const },
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
    password: '',
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
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
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
    const resp = await axios.get(`${API_URL}/api/local/users`, { headers: authHeader() })
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

const generatePassword = () => {
  const pw = genPassword()
  createDialog.value.form.password = pw
  createDialog.value.showPassword = true
}
const generateResetPassword = () => {
  resetDialog.value.newPassword = genPassword()
  resetDialog.value.showPassword = true
}

const openCreateDialog = () => {
  createDialog.value.form = { username: '', email: '', name: '', password: '', role: 'user' }
  createDialog.value.showPassword = false
  createDialog.value.open = true
}

const submitCreate = async () => {
  const { valid } = (await createForm.value?.validate()) || { valid: true }
  if (valid === false) return
  createDialog.value.submitting = true
  try {
    await axios.post(
      `${API_URL}/api/local/register`,
      createDialog.value.form,
      { headers: { ...authHeader(), 'Content-Type': 'application/json' } }
    )
    showSuccess(`Пользователь ${createDialog.value.form.username} создан`)
    createDialog.value.open = false
    await fetchUsers()
  } catch (err: any) {
    showError(err.response?.data?.error || 'Ошибка создания')
  } finally {
    createDialog.value.submitting = false
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
      `${API_URL}/api/local/users/${resetDialog.value.target?.id}/reset-password`,
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
      `${API_URL}/api/local/users/${deleteDialog.value.target?.id}`,
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
}
</style>
