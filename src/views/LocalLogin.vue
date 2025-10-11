<template>
  <div class="local-login">
    <v-container class="fill-height">
      <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="4">
          <v-card class="pa-4" elevation="8">
            <v-card-title class="text-center mb-4">
              <h2>Локальный вход в CRM</h2>
            </v-card-title>
            
            <v-card-text>
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

                <!-- Дополнительные опции -->
                <div class="d-flex justify-space-between align-center mb-4">
                  <v-checkbox
                    v-model="rememberMe"
                    label="Запомнить меня"
                    density="compact"
                    hide-details
                  />
                  
                  <v-btn
                    variant="text"
                    size="small"
                    color="primary"
                    @click="$router.push('/login')"
                  >
                    Axenta Cloud вход
                  </v-btn>
                </div>

                <!-- Кнопка входа -->
                <v-btn
                  type="submit"
                  color="primary"
                  size="large"
                  block
                  :loading="isLoading"
                  :disabled="!isFormValid || isLoading"
                  class="mb-3"
                >
                  <v-icon left>mdi-login</v-icon>
                  Войти локально
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

          <!-- Дополнительная информация -->
          <v-card class="mt-4 pa-3" variant="tonal">
            <v-card-text class="text-center">
              <p class="text-body-2 mb-2">
                <v-icon size="small" class="mr-1">mdi-server-security</v-icon>
                Локальная авторизация CRM
              </p>
              <p class="text-caption text-medium-emphasis">
                Используйте локальные учетные данные для входа в систему
              </p>
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
import { useLocalAuth } from '@/composables/useLocalAuth'

export default defineComponent({
  name: 'LocalLogin',
  setup() {
    const router = useRouter()
    const localAuth = useLocalAuth()

    // Форма
    const loginForm = ref(null)
    const isFormValid = ref(false)
    const form = ref({
      username: '',
      password: '',
    })

    // UI состояние
    const showPassword = ref(false)
    const rememberMe = ref(true)
    const successMessage = ref('')

    // Ошибки полей
    const fieldErrors = ref({
      username: [],
      password: [],
    })

    // Правила валидации
    const usernameRules = [
      (v) => !!v || 'Логин обязателен',
      (v) => v.length >= 3 || 'Минимум 3 символа',
      (v) => v.length <= 64 || 'Максимум 64 символа',
      (v) => /^[a-zA-Z0-9_.-]+$/.test(v) || 'Только латинские буквы, цифры, точки, дефисы и подчеркивания',
    ]

    const passwordRules = [
      (v) => !!v || 'Пароль обязателен',
      (v) => v.length >= 3 || 'Минимум 3 символа',
      (v) => v.length <= 128 || 'Максимум 128 символов',
    ]

    // Методы
    const clearFieldError = (field) => {
      fieldErrors.value[field] = []
      localAuth.clearError()
    }

    const clearError = () => {
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
        const userData = await localAuth.login(form.value.username, form.value.password)
        
        successMessage.value = `Добро пожаловать, ${userData.name || userData.username}!`
        
        // Небольшая задержка для показа сообщения об успехе
        setTimeout(() => {
          const redirectTo = router.currentRoute.value.query.redirect || '/dashboard'
          router.push(redirectTo)
        }, 1500)

      } catch (error) {
        console.error('Ошибка локального входа:', error)
        
        // Обрабатываем специфичные ошибки
        if (error.message.includes('username') || error.message.includes('логин')) {
          fieldErrors.value.username = [error.message]
        } else if (error.message.includes('password') || error.message.includes('пароль')) {
          fieldErrors.value.password = [error.message]
        }
        // Общая ошибка уже установлена в localAuth.error
      }
    }

    // Автофокус на поле логина
    onMounted(() => {
      // Если пользователь уже авторизован, перенаправляем
      if (localAuth.isAuthenticated.value) {
        router.push('/dashboard')
      }
    })

    // Следим за изменениями аутентификации
    watch(
      () => localAuth.isAuthenticated.value,
      (isAuth) => {
        if (isAuth) {
          router.push('/dashboard')
        }
      }
    )

    return {
      // Refs
      loginForm,
      isFormValid,
      form,
      showPassword,
      rememberMe,
      fieldErrors,
      successMessage,

      // From localAuth
      isLoading: localAuth.isLoading,
      error: localAuth.error,

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
.local-login {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
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
