<template>
  <v-card variant="outlined" class="token-display">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="primary">mdi-key-variant</v-icon>
      JWT Токен
      <v-spacer />
      <v-chip
        :color="isTokenValid ? 'success' : 'error'"
        variant="tonal"
        size="small"
      >
        {{ isTokenValid ? 'Активен' : 'Истек' }}
      </v-chip>
    </v-card-title>

    <v-card-text>
      <div v-if="token">
        <!-- Информация о токене -->
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>Тип токена</v-list-item-title>
                <v-list-item-subtitle>{{ tokenType || 'Bearer' }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item v-if="tokenInfo && tokenInfo.type === 'jwt'">
                <v-list-item-title>Пользователь</v-list-item-title>
                <v-list-item-subtitle>{{ tokenInfo.username }} (ID: {{ tokenInfo.user_id }})</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item v-if="tokenInfo && tokenInfo.type === 'jwt'">
                <v-list-item-title>Роль</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip
                    :color="getRoleColor(tokenInfo.role)"
                    variant="tonal"
                    size="small"
                  >
                    {{ getRoleLabel(tokenInfo.role) }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item v-if="tokenInfo && tokenInfo.type !== 'jwt'">
                <v-list-item-title>Тип токена</v-list-item-title>
                <v-list-item-subtitle>{{ tokenInfo.message }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item v-if="tokenInfo">
                <v-list-item-title>Длина токена</v-list-item-title>
                <v-list-item-subtitle>{{ tokenInfo.length }} символов</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-list density="compact">
              <v-list-item v-if="tokenInfo && tokenInfo.type === 'jwt' && tokenInfo.company_id">
                <v-list-item-title>Компания</v-list-item-title>
                <v-list-item-subtitle>{{ tokenInfo.company_id }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item v-if="tokenInfo && tokenInfo.type === 'jwt' && tokenInfo.iat">
                <v-list-item-title>Выдан</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(tokenInfo.iat) }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item v-if="tokenInfo && tokenInfo.type === 'jwt' && tokenInfo.exp">
                <v-list-item-title>Истекает</v-list-item-title>
                <v-list-item-subtitle>
                  <span :class="isTokenValid ? 'text-success' : 'text-error'">
                    {{ formatDate(tokenInfo.exp) }}
                  </span>
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item v-if="tokenInfo && tokenInfo.type !== 'jwt'">
                <v-list-item-title>Статус</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip color="info" variant="tonal" size="small">
                    Внешний токен
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>

        <!-- Отображение токена -->
        <v-divider class="mb-4" />
        
        <div class="token-section">
          <div class="d-flex align-center mb-2">
            <v-icon class="mr-2">mdi-code-string</v-icon>
            <span class="text-subtitle-2">Access Token</span>
            <v-spacer />
            <v-btn-group density="compact" variant="outlined">
              <v-btn
                size="small"
                @click="toggleTokenVisibility"
                :color="showFullToken ? 'warning' : 'primary'"
              >
                <v-icon>{{ showFullToken ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
                {{ showFullToken ? 'Скрыть' : 'Показать' }}
              </v-btn>
              <v-btn
                size="small"
                color="success"
                @click="copyToken"
                :loading="copyingToken"
              >
                <v-icon>mdi-content-copy</v-icon>
                Копировать
              </v-btn>
            </v-btn-group>
          </div>

          <v-textarea
            :model-value="displayToken"
            readonly
            variant="outlined"
            density="compact"
            rows="3"
            class="token-textarea"
            :class="{ 'token-hidden': !showFullToken }"
            @click="copyToken"
            hide-details
          />
        </div>

        <!-- Refresh токен (если есть) -->
        <div v-if="refreshToken" class="token-section mt-4">
          <div class="d-flex align-center mb-2">
            <v-icon class="mr-2">mdi-refresh</v-icon>
            <span class="text-subtitle-2">Refresh Token</span>
            <v-spacer />
            <v-btn-group density="compact" variant="outlined">
              <v-btn
                size="small"
                @click="toggleRefreshTokenVisibility"
                :color="showFullRefreshToken ? 'warning' : 'primary'"
              >
                <v-icon>{{ showFullRefreshToken ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
                {{ showFullRefreshToken ? 'Скрыть' : 'Показать' }}
              </v-btn>
              <v-btn
                size="small"
                color="success"
                @click="copyRefreshToken"
                :loading="copyingRefreshToken"
              >
                <v-icon>mdi-content-copy</v-icon>
                Копировать
              </v-btn>
            </v-btn-group>
          </div>

          <v-textarea
            :model-value="displayRefreshToken"
            readonly
            variant="outlined"
            density="compact"
            rows="2"
            class="token-textarea"
            :class="{ 'token-hidden': !showFullRefreshToken }"
            @click="copyRefreshToken"
            hide-details
          />
        </div>

        <!-- Действия -->
        <v-divider class="my-4" />
        
        <div class="d-flex flex-wrap gap-2">
          <v-btn
            v-if="tokenInfo && tokenInfo.type === 'jwt'"
            color="info"
            variant="outlined"
            @click="decodeToken"
            :loading="decodingToken"
          >
            <v-icon left>mdi-code-json</v-icon>
            Декодировать токен
          </v-btn>
          
          <v-btn
            v-if="onRefresh"
            color="primary"
            variant="outlined"
            @click="handleRefresh"
            :loading="refreshingToken"
          >
            <v-icon left>mdi-refresh</v-icon>
            Обновить токен
          </v-btn>
          
          <v-btn
            color="warning"
            variant="outlined"
            @click="clearTokens"
          >
            <v-icon left>mdi-delete</v-icon>
            Очистить токены
          </v-btn>
        </div>
      </div>

      <div v-else class="text-center py-4">
        <v-icon size="64" color="grey">mdi-key-off</v-icon>
        <p class="text-h6 mt-2">Токен отсутствует</p>
        <p class="text-body-2 text-medium-emphasis">
          Войдите в систему для получения токена
        </p>
      </div>
    </v-card-text>

    <!-- Снэкбар для уведомлений -->
    <v-snackbar
      v-model="showCopySuccess"
      color="success"
      timeout="3000"
      location="bottom"
    >
      <v-icon left>mdi-check</v-icon>
      {{ copyMessage }}
    </v-snackbar>

    <!-- Диалог с декодированным токеном -->
    <v-dialog v-model="showTokenDialog" max-width="800">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-code-json</v-icon>
          Декодированный JWT токен
          <v-spacer />
          <v-btn
            icon
            variant="text"
            @click="showTokenDialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-tabs v-model="tokenTab">
            <v-tab value="header">Header</v-tab>
            <v-tab value="payload">Payload</v-tab>
            <v-tab value="signature">Signature</v-tab>
          </v-tabs>
          
          <v-tabs-window v-model="tokenTab" class="mt-4">
            <v-tabs-window-item value="header">
              <pre class="token-json">{{ JSON.stringify(decodedToken.header, null, 2) }}</pre>
            </v-tabs-window-item>
            
            <v-tabs-window-item value="payload">
              <pre class="token-json">{{ JSON.stringify(decodedToken.payload, null, 2) }}</pre>
            </v-tabs-window-item>
            
            <v-tabs-window-item value="signature">
              <v-alert type="info" variant="tonal">
                <strong>Подпись:</strong> {{ decodedToken.signature }}
              </v-alert>
              <p class="text-caption mt-2">
                Подпись используется для проверки целостности токена и не может быть декодирована.
              </p>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showTokenDialog = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'

export default defineComponent({
  name: 'TokenDisplay',
  props: {
    token: {
      type: String,
      default: null
    },
    refreshToken: {
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
    }
  },
  emits: ['clear'],
  setup(props, { emit }) {
    // UI состояние
    const showFullToken = ref(false)
    const showFullRefreshToken = ref(false)
    const showCopySuccess = ref(false)
    const showTokenDialog = ref(false)
    const copyMessage = ref('')
    const tokenTab = ref('payload')

    // Состояние загрузки
    const copyingToken = ref(false)
    const copyingRefreshToken = ref(false)
    const decodingToken = ref(false)
    const refreshingToken = ref(false)

    // Декодированный токен
    const decodedToken = ref({
      header: {},
      payload: {},
      signature: ''
    })

    // Вычисляемые свойства
    const displayToken = computed(() => {
      if (!props.token) return ''
      
      if (showFullToken.value) {
        return props.token
      } else {
        // Показываем только первые и последние символы
        const start = props.token.substring(0, 20)
        const end = props.token.substring(props.token.length - 20)
        return `${start}...${end}`
      }
    })

    const displayRefreshToken = computed(() => {
      if (!props.refreshToken) return ''
      
      if (showFullRefreshToken.value) {
        return props.refreshToken
      } else {
        const start = props.refreshToken.substring(0, 16)
        const end = props.refreshToken.substring(props.refreshToken.length - 16)
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
            message: 'Непрозрачный токен (не JWT)',
            length: props.token.length
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
          message: 'Неизвестный формат токена',
          length: props.token.length
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
    const toggleTokenVisibility = () => {
      showFullToken.value = !showFullToken.value
    }

    const toggleRefreshTokenVisibility = () => {
      showFullRefreshToken.value = !showFullRefreshToken.value
    }

    const copyToClipboard = async (text, message) => {
      try {
        await navigator.clipboard.writeText(text)
        copyMessage.value = message
        showCopySuccess.value = true
        return true
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
        
        // Fallback для старых браузеров
        try {
          const textArea = document.createElement('textarea')
          textArea.value = text
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          
          copyMessage.value = message
          showCopySuccess.value = true
          return true
        } catch (fallbackError) {
          console.error('Fallback copy failed:', fallbackError)
          copyMessage.value = 'Ошибка копирования'
          showCopySuccess.value = true
          return false
        }
      }
    }

    const copyToken = async () => {
      if (!props.token) return
      
      copyingToken.value = true
      try {
        await copyToClipboard(props.token, 'Access токен скопирован!')
      } finally {
        copyingToken.value = false
      }
    }

    const copyRefreshToken = async () => {
      if (!props.refreshToken) return
      
      copyingRefreshToken.value = true
      try {
        await copyToClipboard(props.refreshToken, 'Refresh токен скопирован!')
      } finally {
        copyingRefreshToken.value = false
      }
    }

    const decodeToken = () => {
      if (!props.token) return
      
      decodingToken.value = true
      try {
        const parts = props.token.split('.')
        if (parts.length !== 3) {
          throw new Error('Invalid JWT format')
        }

        decodedToken.value = {
          header: JSON.parse(atob(parts[0])),
          payload: JSON.parse(atob(parts[1])),
          signature: parts[2]
        }
        
        showTokenDialog.value = true
      } catch (error) {
        console.error('Failed to decode token:', error)
        copyMessage.value = 'Ошибка декодирования токена'
        showCopySuccess.value = true
      } finally {
        decodingToken.value = false
      }
    }

    const handleRefresh = async () => {
      if (!props.onRefresh) return
      
      refreshingToken.value = true
      try {
        await props.onRefresh()
        copyMessage.value = 'Токен обновлен!'
        showCopySuccess.value = true
      } catch (error) {
        console.error('Failed to refresh token:', error)
        copyMessage.value = 'Ошибка обновления токена'
        showCopySuccess.value = true
      } finally {
        refreshingToken.value = false
      }
    }

    const clearTokens = () => {
      emit('clear')
      copyMessage.value = 'Токены очищены'
      showCopySuccess.value = true
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
        admin: 'Администратор',
        manager: 'Менеджер',
        tech: 'Техник',
        accountant: 'Бухгалтер',
        user: 'Пользователь'
      }
      return labels[role] || role
    }

    const formatDate = (timestamp) => {
      if (!timestamp) return 'Не указано'
      
      try {
        const date = new Date(timestamp * 1000)
        return date.toLocaleString('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      } catch (error) {
        return 'Неверный формат'
      }
    }

    // Автоматически скрывать токен при его изменении
    watch(() => props.token, () => {
      showFullToken.value = false
    })

    watch(() => props.refreshToken, () => {
      showFullRefreshToken.value = false
    })

    return {
      // UI состояние
      showFullToken,
      showFullRefreshToken,
      showCopySuccess,
      showTokenDialog,
      copyMessage,
      tokenTab,

      // Состояние загрузки
      copyingToken,
      copyingRefreshToken,
      decodingToken,
      refreshingToken,

      // Данные
      decodedToken,

      // Вычисляемые свойства
      displayToken,
      displayRefreshToken,
      tokenInfo,
      isTokenValid,

      // Методы
      toggleTokenVisibility,
      toggleRefreshTokenVisibility,
      copyToken,
      copyRefreshToken,
      decodeToken,
      handleRefresh,
      clearTokens,
      getRoleColor,
      getRoleLabel,
      formatDate,
    }
  },
})
</script>

<style scoped>
.token-display {
  margin-bottom: 16px;
}

.token-section {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  padding: 16px;
}

.token-textarea {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.token-textarea:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.token-hidden .v-field__input {
  filter: blur(4px);
  transition: filter 0.3s ease;
}

.token-json {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.gap-2 {
  gap: 8px;
}

/* Анимации */
.v-enter-active,
.v-leave-active {
  transition: all 0.3s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Темная тема */
.v-theme--dark .token-section {
  background: rgba(255, 255, 255, 0.05);
}

.v-theme--dark .token-json {
  background: rgba(255, 255, 255, 0.05);
  color: #e0e0e0;
}
</style>
