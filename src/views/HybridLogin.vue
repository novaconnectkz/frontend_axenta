<template>
  <div class="hybrid-login">
    <v-container class="fill-height">
      <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="4">
          <v-card class="pa-4" elevation="8">
            <v-card-title class="text-center mb-4">
              <h2>Вход в Axenta CRM</h2>
            </v-card-title>
            
            <v-card-text>
              <!-- Переключатель типа авторизации -->
              <v-tabs v-model="authType" class="mb-4" centered>
                <v-tab value="cloud">
                  <v-icon left>mdi-cloud</v-icon>
                  Axenta Cloud
                </v-tab>
                <v-tab value="local">
                  <v-icon left>mdi-server</v-icon>
                  Локальная
                </v-tab>
              </v-tabs>

              <v-form 
                ref="loginForm"
                v-model="isFormValid"
                @submit.prevent="handleLogin"
              >
                <!-- Поле логина -->
                <v-text-field
                  v-model="form.username"
                  label="Логин"
                  placeholder="Введите ваш логин"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  density="comfortable"
                  class="mb-3"
                  :rules="usernameRules"
                  :error-messages="fieldErrors.username"
                  @input="clearFieldError('username')"
                  required
                />

                <!-- Поле пароля -->
                <v-text-field
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  label="Пароль"
                  placeholder="Введите ваш пароль"
                  prepend-inner-icon="mdi-lock"
                  :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  variant="outlined"
                  density="comfortable"
                  class="mb-4"
                  :rules="passwordRules"
                  :error-messages="fieldErrors.password"
                  @click:append-inner="showPassword = !showPassword"
                  @input="clearFieldError('password')"
                  @keyup.enter="handleLogin"
                  required
                />

                <!-- Кнопка входа -->
                <v-btn
                  type="submit"
                  :color="authType === 'cloud' ? 'primary' : 'success'"
                  size="large"
                  block
                  :loading="isLoading"
                  :disabled="!isFormValid || isLoading"
                  class="mb-3"
                >
                  <v-icon left>
                    {{ authType === 'cloud' ? 'mdi-cloud-upload' : 'mdi-server' }}
                  </v-icon>
                  {{ authType === 'cloud' ? 'Войти через Axenta Cloud' : 'Войти локально' }}
                </v-btn>

                <!-- Общая ошибка -->
                <v-alert
                  v-if="error"
                  type="error"
                  variant="tonal"
                  class="mt-4"
                  :text="error"
                  closable
                  @click:close="clearError"
                />

                <!-- Сообщение об успехе -->
                <v-alert
                  v-if="successMessage"
                  type="success"
                  variant="tonal"
                  class="mt-4"
                  :text="successMessage"
                />
              </v-form>
            </v-card-text>
          </v-card>

          <!-- Информация о типе авторизации -->
          <v-card class="mt-4 pa-3" variant="tonal">
            <v-card-text class="text-center">
              <div v-if="authType === 'cloud'">
                <p class="text-body-2 mb-2">
                  <v-icon size="small" class="mr-1">mdi-cloud-check</v-icon>
                  Авторизация через Axenta Cloud
                </p>
                <p class="text-caption text-medium-emphasis">
                  Используйте ваши учетные данные от axenta.cloud
                </p>
              </div>
              <div v-else>
                <p class="text-body-2 mb-2">
                  <v-icon size="small" class="mr-1">mdi-server-security</v-icon>
                  Локальная авторизация
                </p>
                <p class="text-caption text-medium-emphasis">
                  Используйте локальные учетные данные CRM системы
                </p>
              </div>
            </v-card-text>
          </v-card>

          <!-- Тестовые данные для разработки -->
          <v-card v-if="authType === 'local'" class="mt-4 pa-3" variant="outlined">
            <v-card-title class="text-subtitle-1">
              <v-icon class="mr-2">mdi-test-tube</v-icon>
              Тестовые данные
            </v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>Администратор</v-list-item-title>
                  <v-list-item-subtitle>admin / admin123</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Менеджер</v-list-item-title>
                  <v-list-item-subtitle>manager / manager123</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/context/auth'
import { useLocalAuth } from '@/composables/useLocalAuth'

export default defineComponent({
  name: 'HybridLogin',
  setup() {
    const router = useRouter()
    const auth = useAuth()
    const localAuth = useLocalAuth()

    // Тип авторизации
    const authType = ref('cloud') // 'cloud' или 'local'

    // Форма
    const loginForm = ref(null)
    const isFormValid = ref(false)
    const form = ref({
      username: '',
      password: '',
    })

    // UI состояние
    const showPassword = ref(false)
    const successMessage = ref('')

    // Ошибки полей
    const fieldErrors = ref({
      username: [],
      password: [],
    })

    // Вычисляемые свойства
    const isLoading = computed(() => {
      return authType.value === 'cloud' ? auth.isLoading.value : localAuth.isLoading.value
    })

    const error = computed(() => {
      return authType.value === 'cloud' ? auth.error.value : localAuth.error.value
    })

    // Правила валидации
    const usernameRules = [
      (v) => !!v || 'Логин обязателен',
      (v) => v.length >= 3 || 'Минимум 3 символа',
      (v) => v.length <= 64 || 'Максимум 64 символа',
    ]

    const passwordRules = [
      (v) => !!v || 'Пароль обязателен',
      (v) => v.length >= 3 || 'Минимум 3 символа',
    ]

    // Методы
    const clearFieldError = (field) => {
      fieldErrors.value[field] = []
      if (authType.value === 'cloud') {
        auth.clearError()
      } else {
        localAuth.clearError()
      }
    }

    const clearError = () => {
      auth.clearError()
      localAuth.clearError()
      fieldErrors.value = { username: [], password: [] }
      successMessage.value = ''
    }

    const validateForm = async () => {
      if (!loginForm.value) return false
      const { valid } = await loginForm.value.validate()
      return valid
    }

    const handleLogin = async () => {
      clearError()

      if (!(await validateForm())) {
        return
      }

      try {
        if (authType.value === 'cloud') {
          // Axenta Cloud авторизация
          await auth.login({
            username: form.value.username.trim(),
            password: form.value.password,
          })
          successMessage.value = 'Успешный вход через Axenta Cloud!'
        } else {
          // Локальная авторизация
          const userData = await localAuth.login(form.value.username, form.value.password)
          successMessage.value = `Добро пожаловать, ${userData.name || userData.username}!`
        }
        
        // Небольшая задержка для показа сообщения об успехе
        setTimeout(() => {
          const redirectTo = router.currentRoute.value.query.redirect || '/dashboard'
          router.push(redirectTo)
        }, 1500)

      } catch (error) {
        console.error('Ошибка входа:', error)
        
        // Обрабатываем специфичные ошибки
        if (error.message.includes('username') || error.message.includes('логин')) {
          fieldErrors.value.username = [error.message]
        } else if (error.message.includes('password') || error.message.includes('пароль')) {
          fieldErrors.value.password = [error.message]
        }
      }
    }

    // Автофокус на поле логина
    onMounted(() => {
      // Если пользователь уже авторизован, перенаправляем
      if (auth.isAuthenticated.value || localAuth.isAuthenticated.value) {
        router.push('/dashboard')
      }
    })

    // Следим за изменениями аутентификации
    watch(
      [() => auth.isAuthenticated.value, () => localAuth.isAuthenticated.value],
      ([cloudAuth, localAuthValue]) => {
        if (cloudAuth || localAuthValue) {
          router.push('/dashboard')
        }
      }
    )

    return {
      // Refs
      authType,
      loginForm,
      isFormValid,
      form,
      showPassword,
      fieldErrors,
      successMessage,

      // Computed
      isLoading,
      error,

      // Rules
      usernameRules,
      passwordRules,

      // Methods
      clearFieldError,
      clearError,
      handleLogin,
    }
  },
})
</script>

<style scoped>
.hybrid-login {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.fill-height {
  height: 100vh;
}

.v-card {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.v-btn--loading {
  pointer-events: none;
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
</style>
