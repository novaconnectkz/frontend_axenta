<template>
  <v-card variant="outlined" class="token-widget">
    <v-card-title class="d-flex align-center pa-3">
      <v-icon class="mr-2" color="primary">mdi-key-variant</v-icon>
      <span class="text-subtitle-1">JWT Токен</span>
      <v-spacer />
      <v-chip
        :color="isTokenValid ? 'success' : 'error'"
        variant="tonal"
        size="small"
      >
        {{ isTokenValid ? 'Активен' : 'Истек' }}
      </v-chip>
    </v-card-title>

    <v-card-text class="pa-3">
      <div v-if="token" class="token-content">
        <!-- Краткая информация -->
        <div class="token-info mb-3">
          <div class="d-flex align-center mb-2">
            <v-icon size="small" class="mr-1">mdi-account</v-icon>
            <span class="text-body-2">
              {{ tokenInfo?.type === 'jwt' ? (tokenInfo?.username || 'Неизвестно') : tokenInfo?.message || 'Токен' }}
            </span>
            <v-spacer />
            <v-chip
              v-if="tokenInfo?.type === 'jwt' && tokenInfo?.role"
              :color="getRoleColor(tokenInfo.role)"
              variant="tonal"
              size="x-small"
            >
              {{ getRoleLabel(tokenInfo.role) }}
            </v-chip>
            <v-chip
              v-else-if="tokenInfo?.type !== 'jwt'"
              color="info"
              variant="tonal"
              size="x-small"
            >
              {{ tokenInfo?.type === 'opaque' ? 'Внешний' : 'Неизвестный' }}
            </v-chip>
          </div>
          
          <div v-if="tokenInfo?.type === 'jwt' && tokenInfo?.exp" class="d-flex align-center">
            <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
            <span class="text-caption" :class="isTokenValid ? 'text-success' : 'text-error'">
              Истекает: {{ formatExpiry(tokenInfo.exp) }}
            </span>
          </div>
          
          <div v-else-if="tokenInfo?.type !== 'jwt'" class="d-flex align-center">
            <v-icon size="small" class="mr-1">mdi-information</v-icon>
            <span class="text-caption text-info">
              Длина: {{ tokenInfo?.length || props.token?.length || 0 }} символов
            </span>
          </div>
        </div>

        <!-- Токен с кнопкой копирования -->
        <div class="token-display">
          <v-text-field
            :model-value="displayToken"
            readonly
            variant="outlined"
            density="compact"
            hide-details
            class="token-field"
            @click="copyToken"
          >
            <template #append-inner>
              <v-btn
                icon
                size="small"
                variant="text"
                @click="copyToken"
                :loading="copying"
                :color="copied ? 'success' : 'primary'"
              >
                <v-icon size="small">
                  {{ copied ? 'mdi-check' : 'mdi-content-copy' }}
                </v-icon>
              </v-btn>
            </template>
          </v-text-field>
        </div>

        <!-- Дополнительные действия -->
        <div class="d-flex justify-space-between align-center mt-3">
          <v-btn
            size="small"
            variant="text"
            @click="toggleVisibility"
            :color="showFull ? 'warning' : 'primary'"
          >
            <v-icon size="small" class="mr-1">
              {{ showFull ? 'mdi-eye-off' : 'mdi-eye' }}
            </v-icon>
            {{ showFull ? 'Скрыть' : 'Показать' }}
          </v-btn>
          
          <v-btn
            v-if="onRefresh"
            size="small"
            variant="text"
            color="success"
            @click="handleRefresh"
            :loading="refreshing"
          >
            <v-icon size="small" class="mr-1">mdi-refresh</v-icon>
            Обновить
          </v-btn>
        </div>
      </div>

      <div v-else class="text-center py-4">
        <v-icon color="grey">mdi-key-off</v-icon>
        <p class="text-body-2 text-medium-emphasis mt-1">
          Токен отсутствует
        </p>
      </div>
    </v-card-text>

    <!-- Снэкбар для уведомлений -->
    <v-snackbar
      v-model="showSuccess"
      color="success"
      timeout="2000"
      location="bottom right"
    >
      <v-icon left>mdi-check</v-icon>
      {{ successMessage }}
    </v-snackbar>
  </v-card>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'

export default defineComponent({
  name: 'TokenWidget',
  props: {
    token: {
      type: String,
      default: null
    },
    tokenType: {
      type: String,
      default: 'Bearer'
    },
    onRefresh: {
      type: Function,
      default: null
    },
    compact: {
      type: Boolean,
      default: false
    }
  },
  emits: ['copied', 'refreshed'],
  setup(props, { emit }) {
    // UI состояние
    const showFull = ref(false)
    const copying = ref(false)
    const copied = ref(false)
    const refreshing = ref(false)
    const showSuccess = ref(false)
    const successMessage = ref('')

    // Вычисляемые свойства
    const displayToken = computed(() => {
      if (!props.token) return ''
      
      if (showFull.value) {
        return props.token
      } else {
        // Показываем только первые и последние символы
        const start = props.token.substring(0, 12)
        const end = props.token.substring(props.token.length - 12)
        return `${start}...${end}`
      }
    })

    const tokenInfo = computed(() => {
      if (!props.token) return null
      
      try {
        // Проверяем, является ли токен JWT (имеет 3 части, разделенные точками)
        const parts = props.token.split('.')
        if (parts.length !== 3) {
          // Это не JWT токен (возможно, токен от Axenta Cloud)
          return {
            type: 'opaque',
            message: 'Внешний токен'
          }
        }
        
        // Пытаемся декодировать JWT
        const payload = JSON.parse(atob(parts[1]))
        return {
          type: 'jwt',
          ...payload
        }
      } catch (error) {
        console.error('Failed to decode token:', error)
        return {
          type: 'unknown',
          message: 'Неизвестный токен'
        }
      }
    })

    const isTokenValid = computed(() => {
      if (!tokenInfo.value) return false
      
      // Для JWT токенов проверяем срок действия
      if (tokenInfo.value.type === 'jwt' && tokenInfo.value.exp) {
        return Date.now() < tokenInfo.value.exp * 1000
      }
      
      // Для других типов токенов считаем их валидными, если они существуют
      return !!props.token
    })

    // Методы
    const toggleVisibility = () => {
      showFull.value = !showFull.value
    }

    const copyToken = async () => {
      if (!props.token || copying.value) return
      
      copying.value = true
      try {
        await navigator.clipboard.writeText(props.token)
        copied.value = true
        successMessage.value = 'Токен скопирован!'
        showSuccess.value = true
        emit('copied', props.token)
        
        // Сбрасываем состояние "скопировано" через 2 секунды
        setTimeout(() => {
          copied.value = false
        }, 2000)
        
      } catch (error) {
        console.error('Failed to copy token:', error)
        
        // Fallback для старых браузеров
        try {
          const textArea = document.createElement('textarea')
          textArea.value = props.token
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          
          copied.value = true
          successMessage.value = 'Токен скопирован!'
          showSuccess.value = true
          emit('copied', props.token)
          
          setTimeout(() => {
            copied.value = false
          }, 2000)
          
        } catch (fallbackError) {
          console.error('Fallback copy failed:', fallbackError)
          successMessage.value = 'Ошибка копирования'
          showSuccess.value = true
        }
      } finally {
        copying.value = false
      }
    }

    const handleRefresh = async () => {
      if (!props.onRefresh || refreshing.value) return
      
      refreshing.value = true
      try {
        await props.onRefresh()
        successMessage.value = 'Токен обновлен!'
        showSuccess.value = true
        emit('refreshed')
      } catch (error) {
        console.error('Failed to refresh token:', error)
        successMessage.value = 'Ошибка обновления токена'
        showSuccess.value = true
      } finally {
        refreshing.value = false
      }
    }

    const getRoleColor = (role) => {
      const colors = {
        admin: 'success',
        manager: 'primary',
        tech: 'warning',
        accountant: 'info',
        user: 'grey'
      }
      return colors[role] || 'grey'
    }

    const getRoleLabel = (role) => {
      const labels = {
        admin: 'Админ',
        manager: 'Менеджер',
        tech: 'Техник',
        accountant: 'Бухгалтер',
        user: 'Пользователь'
      }
      return labels[role] || role
    }

    const formatExpiry = (timestamp) => {
      if (!timestamp) return 'Не указано'
      
      try {
        const date = new Date(timestamp * 1000)
        const now = new Date()
        const diff = date.getTime() - now.getTime()
        
        if (diff <= 0) return 'Истек'
        
        const minutes = Math.floor(diff / (1000 * 60))
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)
        
        if (days > 0) return `${days}д ${hours % 24}ч`
        if (hours > 0) return `${hours}ч ${minutes % 60}м`
        return `${minutes}м`
        
      } catch (error) {
        return 'Ошибка'
      }
    }

    // Автоматически скрывать токен при его изменении
    watch(() => props.token, () => {
      showFull.value = false
      copied.value = false
    })

    return {
      // UI состояние
      showFull,
      copying,
      copied,
      refreshing,
      showSuccess,
      successMessage,

      // Вычисляемые свойства
      displayToken,
      tokenInfo,
      isTokenValid,

      // Методы
      toggleVisibility,
      copyToken,
      handleRefresh,
      getRoleColor,
      getRoleLabel,
      formatExpiry,
    }
  },
})
</script>

<style scoped>
.token-widget {
  max-width: 100%;
}

.token-content {
  max-width: 100%;
}

.token-field {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}

.token-field :deep(.v-field__input) {
  cursor: pointer;
  user-select: all;
}

.token-field:hover :deep(.v-field__outline) {
  border-color: rgb(var(--v-theme-primary));
}

.token-info {
  border-left: 3px solid rgb(var(--v-theme-primary));
  padding-left: 12px;
  background: rgba(var(--v-theme-surface-variant), 0.1);
  border-radius: 0 4px 4px 0;
  padding: 8px 12px;
}

/* Анимации */
.v-enter-active,
.v-leave-active {
  transition: all 0.2s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
