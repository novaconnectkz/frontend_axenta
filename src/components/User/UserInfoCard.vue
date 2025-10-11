<template>
  <v-card :variant="variant" :class="cardClass">
    <v-card-title v-if="showTitle" class="d-flex align-center">
      <v-icon v-if="titleIcon" :icon="titleIcon" class="mr-2" />
      {{ title }}
      <v-spacer />
      <v-chip
        v-if="user?.accountType"
        :color="getAccountTypeColor(user.accountType)"
        size="small"
        variant="tonal"
      >
        {{ getAccountTypeLabel(user.accountType) }}
      </v-chip>
    </v-card-title>

    <v-card-text :class="{ 'pt-4': !showTitle }">
      <div v-if="user" class="user-info-content">
        <!-- Основная информация -->
        <div v-if="sections.includes('basic')" class="info-section">
          <h4 v-if="showSectionTitles" class="section-title mb-3">
            <v-icon icon="mdi-account" size="16" class="mr-1" />
            Основная информация
          </h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">ID:</span>
              <span class="info-value">{{ user.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Логин:</span>
              <span class="info-value">{{ user.username }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Имя:</span>
              <span class="info-value">{{ user.name }}</span>
            </div>
            <div v-if="user.email" class="info-item">
              <span class="info-label">Email:</span>
              <span class="info-value">
                <a :href="`mailto:${user.email}`" class="text-primary email-link">
                  {{ user.email }}
                </a>
              </span>
            </div>
          </div>
        </div>

        <!-- Статус и права -->
        <div v-if="sections.includes('status')" class="info-section">
          <h4 v-if="showSectionTitles" class="section-title mb-3">
            <v-icon icon="mdi-shield-account" size="16" class="mr-1" />
            Статус и права
          </h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Статус:</span>
              <v-chip 
                :color="user.isActive ? 'success' : 'error'" 
                size="small" 
                variant="tonal"
              >
                {{ user.isActive ? 'Активен' : 'Неактивен' }}
              </v-chip>
            </div>
            <div class="info-item">
              <span class="info-label">Администратор:</span>
              <v-chip 
                :color="user.isAdmin ? 'warning' : 'default'" 
                size="small" 
                variant="tonal"
              >
                {{ user.isAdmin ? 'Да' : 'Нет' }}
              </v-chip>
            </div>
          </div>
        </div>

        <!-- Информация об аккаунте -->
        <div v-if="sections.includes('account')" class="info-section">
          <h4 v-if="showSectionTitles" class="section-title mb-3">
            <v-icon icon="mdi-domain" size="16" class="mr-1" />
            Аккаунт
          </h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Компания:</span>
              <span class="info-value">{{ user.accountName || 'Не указано' }}</span>
            </div>
            <div v-if="user.accountId" class="info-item">
              <span class="info-label">ID аккаунта:</span>
              <span class="info-value">{{ user.accountId }}</span>
            </div>
            <div v-if="user.creatorName" class="info-item">
              <span class="info-label">Создатель:</span>
              <span class="info-value">{{ user.creatorName }}</span>
            </div>
            <div v-if="user.accountBlockingDatetime" class="info-item">
              <span class="info-label">Блокировка:</span>
              <span class="info-value text-error">
                <v-icon icon="mdi-alert" size="14" class="mr-1" />
                {{ formatDate(user.accountBlockingDatetime) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Системные настройки -->
        <div v-if="sections.includes('system')" class="info-section">
          <h4 v-if="showSectionTitles" class="section-title mb-3">
            <v-icon icon="mdi-cog" size="16" class="mr-1" />
            Системные настройки
          </h4>
          <div class="info-grid">
            <div v-if="user.language" class="info-item">
              <span class="info-label">Язык:</span>
              <v-chip size="small" variant="tonal" color="info">
                {{ getLanguageLabel(user.language) }}
              </v-chip>
            </div>
            <div v-if="user.timezone" class="info-item">
              <span class="info-label">Часовой пояс:</span>
              <span class="info-value">UTC{{ user.timezone >= 0 ? '+' : '' }}{{ user.timezone }}</span>
            </div>
            <div v-if="user.lastLogin" class="info-item">
              <span class="info-label">Последний вход:</span>
              <span class="info-value">{{ formatDate(user.lastLogin) }}</span>
            </div>
          </div>
        </div>

        <!-- Компактный режим -->
        <div v-if="compact && user" class="compact-info">
          <div class="d-flex align-center mb-2">
            <v-avatar size="32" class="mr-3">
              <span class="user-initials">{{ getUserInitials(user) }}</span>
            </v-avatar>
            <div>
              <div class="text-subtitle-2 font-weight-medium">{{ user.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ user.email }}</div>
            </div>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            <v-chip 
              :color="getAccountTypeColor(user.accountType)" 
              size="x-small" 
              variant="tonal"
            >
              {{ getAccountTypeLabel(user.accountType) }}
            </v-chip>
            <v-chip 
              v-if="user.isAdmin"
              color="warning" 
              size="x-small" 
              variant="tonal"
            >
              Админ
            </v-chip>
            <v-chip 
              :color="user.isActive ? 'success' : 'error'" 
              size="x-small" 
              variant="tonal"
            >
              {{ user.isActive ? 'Активен' : 'Неактивен' }}
            </v-chip>
          </div>
        </div>
      </div>

      <div v-else class="no-user-message text-center py-4">
        <v-icon size="48" color="grey">mdi-account-off</v-icon>
        <p class="text-body-2 mt-2">Данные пользователя недоступны</p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { User } from '@/context/auth'

interface Props {
  user?: User | null
  title?: string
  titleIcon?: string
  showTitle?: boolean
  showSectionTitles?: boolean
  sections?: Array<'basic' | 'status' | 'account' | 'system'>
  variant?: 'elevated' | 'flat' | 'tonal' | 'outlined' | 'text' | 'plain'
  compact?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Информация о пользователе',
  titleIcon: 'mdi-account-circle',
  showTitle: true,
  showSectionTitles: true,
  sections: () => ['basic', 'status', 'account', 'system'],
  variant: 'outlined',
  compact: false,
  class: ''
})

const cardClass = computed(() => {
  return `user-info-card ${props.class}`
})

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

const formatDate = (dateString: string) => {
  if (!dateString) return 'Не указано'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

const getUserInitials = (user: User) => {
  if (!user?.name) return 'U'
  const names = user.name.split(' ')
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase()
  }
  return names[0][0].toUpperCase()
}
</script>

<style scoped>
.user-info-card {
  transition: all 0.3s ease;
}

.user-info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.info-section {
  margin-bottom: 24px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.87);
  display: flex;
  align-items: center;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 24px;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.6);
  min-width: 120px;
  flex-shrink: 0;
}

.info-value {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.87);
  text-align: right;
  flex-grow: 1;
}

.email-link {
  text-decoration: none;
  transition: color 0.15s ease;
}

.email-link:hover {
  text-decoration: underline;
}

.compact-info {
  padding: 8px 0;
}

.user-initials {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-weight: 600;
  font-size: 0.75rem;
  color: white;
}

.no-user-message {
  opacity: 0.6;
}

/* Темная тема */
[data-theme="dark"] .section-title {
  color: rgba(255, 255, 255, 0.87);
}

[data-theme="dark"] .info-label {
  color: rgba(255, 255, 255, 0.6);
}

[data-theme="dark"] .info-value {
  color: rgba(255, 255, 255, 0.87);
}

/* Адаптивность */
@media (max-width: 600px) {
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
}
</style>
