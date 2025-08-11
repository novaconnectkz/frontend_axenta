<template>
  <div class="login-container">
    <!-- Background gradient -->
    <div class="background-gradient"></div>

    <!-- Floating shapes for decoration -->
    <div class="floating-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>

    <!-- Main login card -->
    <div class="login-wrapper">
      <div class="login-card">
        <!-- Header with logo and greeting -->
        <div class="login-header">
          <div class="logo-container">
            <div class="logo-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
              </svg>
            </div>
          </div>
          <h1 class="welcome-title">Добро пожаловать в AxentaCRM</h1>
          <p class="welcome-subtitle">Войдите в систему управления</p>
        </div>

        <!-- Login form -->
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <div class="input-container">
              <input v-model="form.username" type="text" id="username" class="form-input"
                :class="{ 'has-error': usernameError }" placeholder=" " :disabled="isLoading" @blur="validateUsername"
                @input="clearUsernameError" />
              <label for="username" class="form-label">Логин</label>
              <div class="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </div>
            </div>
            <div class="error-message" v-if="usernameError">{{ usernameError }}</div>
          </div>

          <div class="form-group">
            <div class="input-container">
              <input v-model="form.password" :type="showPassword ? 'text' : 'password'" id="password" class="form-input"
                :class="{ 'has-error': passwordError }" placeholder=" " :disabled="isLoading" @blur="validatePassword"
                @input="clearPasswordError" />
              <label for="password" class="form-label">Пароль</label>
              <div class="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" />
                  <circle cx="12" cy="16" r="1" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                  <path
                    d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <button type="button" class="password-toggle" @click="togglePasswordVisibility" :disabled="isLoading">
                <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 4.02811 7.65663 6.17 6.06"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path
                    d="M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path
                    d="M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1749 15.0074 10.8016 14.8565C10.4283 14.7056 10.0887 14.481 9.80385 14.1962C9.51900 13.9113 9.29439 13.5717 9.14351 13.1984C8.99264 12.8251 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4858 9.58525 10.1546 9.88 9.88"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </button>
            </div>
            <div class="error-message" v-if="passwordError">{{ passwordError }}</div>
          </div>

          <!-- Remember password checkbox -->
          <div class="form-options">
            <label class="remember-checkbox">
              <input type="checkbox" v-model="rememberPassword" :disabled="isLoading" />
              <span class="checkmark"></span>
              <span class="checkbox-label">Запомнить пароль</span>
            </label>
          </div>

          <!-- Submit button -->
          <button type="submit" class="login-button" :class="{ 'loading': isLoading, 'disabled': !isFormValid }"
            :disabled="!isFormValid || isLoading">
            <span v-if="!isLoading" class="button-text">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="button-icon">
                <path
                  d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <polyline points="10,17 15,12 10,7" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
                <line x1="21" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
              Войти
            </span>
            <div v-else class="loading-spinner"></div>
          </button>

          <!-- Error message -->
          <div v-if="error" class="error-alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
              <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
              <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
            {{ error }}
          </div>

          <!-- Success message -->
          <div v-if="successMessage" class="success-alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4905 2.02168 11.3363C2.16356 9.18203 2.99721 7.13414 4.39828 5.49707C5.79935 3.85999 7.69279 2.71157 9.79619 2.24586C11.8996 1.78015 14.1003 1.98525 16.07 2.83"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
            {{ successMessage }}
          </div>
        </form>


      </div>

      <!-- Footer -->
      <footer class="login-footer">
        <p class="footer-text">
          © {{ currentYear }} by ProfMonitor
        </p>
        <p class="footer-version">
          AxentaCRM v{{ appVersion }}
        </p>
      </footer>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth, type LoginForm } from '../context/auth'

export default defineComponent({
  name: 'LoginPage',

  setup() {
    const form = ref<LoginForm>({
      username: '',
      password: ''
    })
    const successMessage = ref('')
    const rememberPassword = ref(false)
    const showPassword = ref(false)
    const usernameError = ref('')
    const passwordError = ref('')
    const auth = useAuth()
    const router = useRouter()

    // Версия приложения и текущий год
    const appVersion = ref('1.0.0')
    const currentYear = new Date().getFullYear()

    // Функции валидации
    const validateUsername = () => {
      const username = form.value.username.trim()
      if (!username) {
        usernameError.value = 'Логин обязателен'
        return false
      }
      if (username.length < 3) {
        usernameError.value = 'Минимум 3 символа'
        return false
      }
      if (username.length > 64) {
        usernameError.value = 'Максимум 64 символа'
        return false
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        usernameError.value = 'Только латинские буквы, цифры, _ и -'
        return false
      }
      usernameError.value = ''
      return true
    }

    const validatePassword = () => {
      const password = form.value.password
      if (!password) {
        passwordError.value = 'Пароль обязателен'
        return false
      }
      if (password.length < 3) {
        passwordError.value = 'Минимум 3 символа'
        return false
      }
      if (password.length > 64) {
        passwordError.value = 'Максимум 64 символа'
        return false
      }
      passwordError.value = ''
      return true
    }

    // Очистка ошибок
    const clearUsernameError = () => {
      if (usernameError.value) usernameError.value = ''
    }

    const clearPasswordError = () => {
      if (passwordError.value) passwordError.value = ''
    }

    // Проверка валидности формы
    const isFormValid = computed(() => {
      return (
        form.value.username.length >= 3 &&
        form.value.username.length <= 64 &&
        /^[a-zA-Z0-9_-]+$/.test(form.value.username) &&
        form.value.password.length >= 3 &&
        form.value.password.length <= 64 &&
        !usernameError.value &&
        !passwordError.value
      )
    })

    // Получаем значения из auth контекста
    const isLoading = computed(() => auth.isLoading.value)
    const error = computed(() => auth.error.value)

    // Переключение видимости пароля
    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value
    }

    // Функции для работы с localStorage
    const saveCredentials = () => {
      if (rememberPassword.value) {
        localStorage.setItem('axenta_remember_password', 'true')
        localStorage.setItem('axenta_username', form.value.username)
        localStorage.setItem('axenta_password', form.value.password)
      } else {
        localStorage.removeItem('axenta_remember_password')
        localStorage.removeItem('axenta_username')
        localStorage.removeItem('axenta_password')
      }
    }

    const loadSavedCredentials = () => {
      const shouldRemember = localStorage.getItem('axenta_remember_password')
      if (shouldRemember === 'true') {
        const savedUsername = localStorage.getItem('axenta_username')
        const savedPassword = localStorage.getItem('axenta_password')
        if (savedUsername && savedPassword) {
          form.value.username = savedUsername
          form.value.password = savedPassword
          rememberPassword.value = true
        }
      }
    }

    // Обработчик авторизации
    const handleLogin = async () => {
      if (!isFormValid.value || isLoading.value) return

      // Валидация перед отправкой
      const isUsernameValid = validateUsername()
      const isPasswordValid = validatePassword()

      if (!isUsernameValid || !isPasswordValid) return

      try {
        await auth.login(form.value)

        // Сохраняем данные, если выбрано "Запомнить пароль"
        saveCredentials()

        successMessage.value = 'Успешная авторизация! Переход в систему...'

        // Небольшая задержка для показа сообщения об успехе
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)

      } catch (err: any) {
        console.error('Ошибка авторизации:', err)
        // Ошибка уже обработана в auth.login()
      }
    }



    // Отслеживание изменений в чекбоксе "Запомнить пароль"
    watch(rememberPassword, (newValue) => {
      if (!newValue) {
        // Если сняли галочку, удаляем сохраненные данные
        localStorage.removeItem('axenta_remember_password')
        localStorage.removeItem('axenta_username')
        localStorage.removeItem('axenta_password')
      }
    })

    // Загружаем сохраненные данные при монтировании
    onMounted(() => {
      loadSavedCredentials()

      // Проверяем, если пользователь уже авторизован
      if (auth.isAuthenticated.value) {
        router.push('/dashboard')
      }
    })

    return {
      // Форма и данные
      form,
      successMessage,
      rememberPassword,
      showPassword,
      usernameError,
      passwordError,
      appVersion,
      currentYear,

      // Вычисляемые значения
      isFormValid,
      isLoading,
      error,

      // Методы
      handleLogin,
      togglePasswordVisibility,
      validateUsername,
      validatePassword,
      clearUsernameError,
      clearPasswordError
    }
  }
})
</script>

<style scoped>
/* Основной контейнер */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

/* Фоновый градиент */
.background-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg,
      #667eea 0%,
      #764ba2 25%,
      #f093fb 50%,
      #f5576c 75%,
      #4facfe 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

/* Плавающие фигуры */
.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  backdrop-filter: blur(10px);
  animation: float 20s infinite linear;
}

.shape-1 {
  width: 80px;
  height: 80px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 120px;
  height: 120px;
  top: 60%;
  right: 15%;
  animation-delay: -7s;
}

.shape-3 {
  width: 60px;
  height: 60px;
  bottom: 30%;
  left: 20%;
  animation-delay: -14s;
}

@keyframes float {
  0% {
    transform: translateY(0px) rotate(0deg);
  }

  33% {
    transform: translateY(-20px) rotate(120deg);
  }

  66% {
    transform: translateY(20px) rotate(240deg);
  }

  100% {
    transform: translateY(0px) rotate(360deg);
  }
}

/* Обёртка логина */
.login-wrapper {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  padding: 20px;
}

/* Основная карточка */
.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.2);
}

/* Шапка */
.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-container {
  margin-bottom: 20px;
}

.logo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 20px;
  color: white;
  margin: 0 auto;
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.logo-icon:hover {
  transform: scale(1.05);
  box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.welcome-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
  font-weight: 400;
}

/* Форма */
.login-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.input-container {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 16px 50px 16px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #667eea;
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.has-error {
  border-color: #ff6b6b;
}

.form-input:not(:placeholder-shown)+.form-label,
.form-input:focus+.form-label {
  transform: translateY(-24px) scale(0.85);
  color: #667eea;
}

.form-label {
  position: absolute;
  left: 16px;
  top: 16px;
  color: #888;
  font-size: 16px;
  pointer-events: none;
  transition: all 0.3s ease;
  background: white;
  padding: 0 4px;
  transform-origin: left;
}

.input-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #888;
  pointer-events: none;
  transition: color 0.3s ease;
}

.form-input:focus~.input-icon {
  color: #667eea;
}

.password-toggle {
  position: absolute;
  right: 45px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.password-toggle:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.error-message {
  color: #ff6b6b;
  font-size: 14px;
  margin-top: 6px;
  margin-left: 4px;
}

/* Опции формы */
.form-options {
  margin-bottom: 25px;
}

.remember-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.remember-checkbox input[type="checkbox"] {
  display: none;
}

.checkmark {
  position: relative;
  width: 20px;
  height: 20px;
  background: #fff;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  margin-right: 12px;
  transition: all 0.3s ease;
}

.remember-checkbox input:checked+.checkmark {
  background: #667eea;
  border-color: #667eea;
}

.remember-checkbox input:checked+.checkmark:after {
  content: '';
  position: absolute;
  left: 6px;
  top: 2px;
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-label {
  font-size: 15px;
  color: #555;
}

/* Кнопка входа */
.login-button {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.login-button:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.login-button.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-button.loading {
  cursor: not-allowed;
}

.button-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.button-icon {
  transition: transform 0.3s ease;
}

.login-button:hover .button-icon {
  transform: translateX(2px);
}

/* Анимация загрузки */
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Уведомления */
.error-alert,
.success-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  margin-top: 15px;
}

.error-alert {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.2);
}

.success-alert {
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
  border: 1px solid rgba(72, 187, 120, 0.2);
}



/* Футер */
.login-footer {
  text-align: center;
  margin-top: 30px;
  padding: 20px;
  color: rgba(255, 255, 255, 0.8);
}

.footer-text {
  font-size: 14px;
  margin: 0 0 5px 0;
  font-weight: 500;
}

.footer-version {
  font-size: 12px;
  margin: 0;
  opacity: 0.7;
}

/* Адаптивность */
@media (max-width: 480px) {
  .login-wrapper {
    padding: 10px;
  }

  .login-card {
    padding: 30px 20px;
  }

  .welcome-title {
    font-size: 24px;
  }

  .welcome-subtitle {
    font-size: 14px;
  }

  .logo-icon {
    width: 60px;
    height: 60px;
  }

  .form-input {
    font-size: 16px;
    /* Предотвращаем зум на iOS */
  }
}

@media (max-width: 360px) {
  .login-card {
    padding: 25px 15px;
  }

  .welcome-title {
    font-size: 22px;
  }
}

/* Анимация появления */
.login-card {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Акценты для тёмной темы */
@media (prefers-color-scheme: dark) {
  .login-card {
    background: rgba(30, 30, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .welcome-title {
    color: #fff;
  }

  .welcome-subtitle {
    color: #ccc;
  }

  .form-input {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  .form-input:focus {
    background: rgba(255, 255, 255, 0.15);
  }

  .form-label {
    color: #ccc;
    background: rgba(30, 30, 30, 0.95);
  }

  .checkbox-label {
    color: #ccc;
  }

  .checkmark {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }
}
</style>
