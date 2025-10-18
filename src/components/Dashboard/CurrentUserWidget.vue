<template>
  <BaseWidget
    title="Текущий пользователь"
    icon="mdi-account-circle"
    :widget-id="widgetId"
    :is-resize-mode="isResizeMode"
    :dimensions="dimensions"
    :loading="false"
    :error="null"
    :refreshable="false"
    @configure="$emit('configure')"
    @remove="$emit('remove')"
    @resize="$emit('resize', $event)"
  >
    <div v-if="auth.user.value" class="current-user-widget">
      <!-- Заголовок с аватаром -->
      <div class="user-header mb-4">
        <v-avatar size="64" class="user-avatar">
          <span class="user-initials">{{ getUserInitials() }}</span>
        </v-avatar>
        <div class="user-title-info">
          <h3 class="user-name">{{ auth.user.value.name }}</h3>
          <p class="user-email">{{ auth.user.value.email }}</p>
          <div class="user-badges mt-2">
            <v-chip 
              :color="getAccountTypeColor(auth.user.value.accountType)" 
              size="small" 
              variant="tonal"
              class="me-2"
            >
              {{ getAccountTypeLabel(auth.user.value.accountType) }}
            </v-chip>
            <v-chip 
              v-if="auth.user.value.isAdmin"
              color="warning" 
              size="small" 
              variant="tonal"
            >
              Администратор
            </v-chip>
          </div>
        </div>
      </div>

      <!-- Основная информация -->
      <div class="user-stats">
        <v-row>
          <v-col cols="6">
            <div class="stat-card">
              <v-icon icon="mdi-identifier" color="primary" class="stat-icon" />
              <div class="stat-content">
                <div class="stat-label">ID пользователя</div>
                <div class="stat-value">{{ auth.user.value.id }}</div>
              </div>
            </div>
          </v-col>
          <v-col cols="6">
            <div class="stat-card">
              <v-icon icon="mdi-domain" color="deep-purple" class="stat-icon" />
              <div class="stat-content">
                <div class="stat-label">Компания</div>
                <div class="stat-value">{{ auth.user.value.accountName || 'Не указано' }}</div>
              </div>
            </div>
          </v-col>
          <v-col cols="6" v-if="auth.user.value.accountId">
            <div class="stat-card">
              <v-icon icon="mdi-office-building" color="blue" class="stat-icon" />
              <div class="stat-content">
                <div class="stat-label">ID аккаунта</div>
                <div class="stat-value">{{ auth.user.value.accountId }}</div>
              </div>
            </div>
          </v-col>
          <v-col cols="6" v-if="auth.user.value.lastLogin">
            <div class="stat-card">
              <v-icon icon="mdi-clock-outline" color="green" class="stat-icon" />
              <div class="stat-content">
                <div class="stat-label">Последний вход</div>
                <div class="stat-value">{{ formatLastLogin(auth.user.value.lastLogin) }}</div>
              </div>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- Предупреждение о блокировке -->
      <v-alert
        v-if="auth.user.value.accountBlockingDatetime"
        type="warning"
        variant="tonal"
        class="mt-4"
      >
        <template #title>
          <v-icon icon="mdi-alert" class="me-2" />
          Внимание: Блокировка аккаунта
        </template>
        <div>
          Аккаунт будет заблокирован {{ formatBlockingDate(auth.user.value.accountBlockingDatetime) }}
        </div>
      </v-alert>

      <!-- Системная информация -->
      <div v-if="auth.user.value.language || auth.user.value.timezone" class="system-info mt-4">
        <v-divider class="mb-3" />
        <div class="system-info-title mb-2">
          <v-icon icon="mdi-cog" size="16" class="me-1" />
          Системные настройки
        </div>
        <div class="system-info-grid">
          <div v-if="auth.user.value.language" class="system-info-item">
            <v-icon icon="mdi-translate" size="14" class="me-2" />
            <span>{{ getLanguageLabel(auth.user.value.language) }}</span>
          </div>
          <div v-if="auth.user.value.timezone" class="system-info-item">
            <v-icon icon="mdi-earth" size="14" class="me-2" />
            <span>UTC{{ auth.user.value.timezone >= 0 ? '+' : '' }}{{ auth.user.value.timezone }}</span>
          </div>
        </div>
      </div>

      <!-- Быстрые действия -->
      <div class="quick-actions mt-4">
        <v-divider class="mb-3" />
        <div class="d-flex gap-2 flex-wrap">
          <v-btn
            color="primary"
            variant="outlined"
            size="small"
            prepend-icon="mdi-account"
            @click="goToProfile"
          >
            Профиль
          </v-btn>
          <v-btn
            color="secondary"
            variant="outlined"
            size="small"
            prepend-icon="mdi-cog"
            @click="goToSettings"
          >
            Настройки
          </v-btn>
        </div>
      </div>
    </div>

    <div v-else class="no-user-state text-center py-8">
      <v-icon size="64" color="grey">mdi-account-off</v-icon>
      <p class="text-h6 mt-2">Пользователь не авторизован</p>
      <p class="text-body-2 text-medium-emphasis">
        Войдите в систему для просмотра информации
      </p>
    </div>
  </BaseWidget>
</template>

<script setup lang="ts">
import { useAuth } from '@/context/auth'
import { useRouter } from 'vue-router'
import BaseWidget from './BaseWidget.vue'
import type { WidgetDimensions } from '@/types/dashboard'

interface Props {
  widgetId: string
  isResizeMode?: boolean
  dimensions?: WidgetDimensions
}

defineProps<Props>()

const emit = defineEmits<{
  configure: []
  remove: []
  resize: [dimensions: WidgetDimensions]
}>()

const auth = useAuth()
const router = useRouter()

const getUserInitials = () => {
  const user = auth.user.value
  if (!user?.name) return 'U'
  const names = user.name.split(' ')
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase()
  }
  return names[0][0].toUpperCase()
}

const getAccountTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    partner: 'deep-purple',
    client: 'blue-grey',
    premium: 'amber',
    basic: 'blue',
    trial: 'orange',
    demo: 'purple',
    free: 'grey'
  }
  return colors[type] || 'primary'
}

const getAccountTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    partner: 'Партнерский',
    client: 'Клиентский',
    premium: 'Премиум',
    basic: 'Базовый',
    trial: 'Пробный',
    demo: 'Демо',
    free: 'Бесплатный'
  }
  return labels[type] || type
}

const getLanguageLabel = (lang: string) => {
  const languages: Record<string, string> = {
    ru: 'Русский',
    en: 'English',
    de: 'Deutsch',
    fr: 'Français',
    es: 'Español'
  }
  return languages[lang] || lang
}

const formatLastLogin = (dateString: string) => {
  if (!dateString) return 'Не указано'
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Только что'
    } else if (diffInHours < 24) {
      return `${diffInHours} ч. назад`
    } else if (diffInHours < 48) {
      return 'Вчера'
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short'
      })
    }
  } catch (error) {
    return 'Неизвестно'
  }
}

const formatBlockingDate = (dateString: string) => {
  if (!dateString) return 'Не указано'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

const goToProfile = () => {
  router.push('/profile')
}

const goToSettings = () => {
  router.push('/settings')
}

</script>

<style scoped>
.current-user-widget {
  padding: 8px;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-shrink: 0;
}

.user-initials {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-weight: 600;
  font-size: 1.5rem;
  color: white;
}

.user-title-info {
  flex-grow: 1;
  min-width: 0;
}

.user-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: rgba(var(--v-theme-on-surface), 0.87);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 4px 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.user-stats {
  margin-top: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 8px;
  transition: all 0.15s ease;
}

.stat-card:hover {
  background: rgba(var(--v-theme-surface-variant), 0.7);
  transform: translateY(-1px);
}

.stat-icon {
  flex-shrink: 0;
}

.stat-content {
  flex-grow: 1;
  min-width: 0;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-bottom: 2px;
}

.stat-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.87);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.system-info-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.6);
  display: flex;
  align-items: center;
}

.system-info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.system-info-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.quick-actions {
  margin-top: 16px;
}

.no-user-state {
  opacity: 0.6;
}

/* Темная тема */
[data-theme="dark"] .user-name {
  color: rgba(255, 255, 255, 0.87);
}

[data-theme="dark"] .user-email {
  color: rgba(255, 255, 255, 0.6);
}

[data-theme="dark"] .stat-card {
  background: rgba(255, 255, 255, 0.05);
}

[data-theme="dark"] .stat-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

[data-theme="dark"] .stat-label {
  color: rgba(255, 255, 255, 0.6);
}

[data-theme="dark"] .stat-value {
  color: rgba(255, 255, 255, 0.87);
}

[data-theme="dark"] .system-info-title {
  color: rgba(255, 255, 255, 0.6);
}

[data-theme="dark"] .system-info-item {
  color: rgba(255, 255, 255, 0.7);
}

/* Адаптивность */
@media (max-width: 600px) {
  .user-header {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .user-name {
    white-space: normal;
  }
  
  .user-email {
    white-space: normal;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
  
  .system-info-grid {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
