<template>
  <div class="apple-login">
    <div class="login-container">
      <!-- Логотип и заголовок -->
      <div class="logo-section">
        <div class="logo-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <rect width="60" height="60" rx="12" fill="url(#gradient)"/>
            <text x="30" y="40" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" font-size="32" font-weight="600" fill="white">А</text>
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#007AFF"/>
                <stop offset="100%" style="stop-color:#5856D6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 class="app-title">CRM</h1>
        <p class="app-subtitle">Система управления</p>
      </div>

      <!-- Информация для авторизации -->
      <div class="info-section">
        <div class="info-card">
          <h3>🔐 Вход в систему</h3>
          <p class="info-main">
            <strong>Используйте ваши учетные данные от Axenta Cloud</strong>
          </p>
          <p class="info-note">
            При первом входе система автоматически создаст локальную учетную запись<br>
            с вашими данными из Axenta (имя, email, роли)
          </p>
        </div>
      </div>

      <!-- Форма авторизации -->
      <div class="form-section">
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="input-group">
            <div class="input-container">
              <input
                v-model="form.username"
                type="text"
                placeholder="Логин"
                class="apple-input"
                :class="{ 'has-error': fieldErrors.username }"
                @input="clearFieldError('username')"
                required
              />
              <div class="input-icon">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
            <div v-if="fieldErrors.username" class="error-message">
              {{ fieldErrors.username }}
            </div>
          </div>

          <div class="input-group">
            <div class="input-container">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Пароль"
                class="apple-input"
                :class="{ 'has-error': fieldErrors.password }"
                @input="clearFieldError('password')"
                required
              />
              <div class="input-icon">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                </svg>
                <svg v-else width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/>
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                </svg>
              </button>
            </div>
            <div v-if="fieldErrors.password" class="error-message">
              {{ fieldErrors.password }}
            </div>
          </div>

          <!-- Дополнительные опции -->
          <div class="options-section">
            <label class="remember-me">
              <input v-model="rememberMe" type="checkbox" class="apple-checkbox">
              <span class="checkmark"></span>
              <span class="label-text">Запомнить меня</span>
            </label>
          </div>

          <!-- Кнопка входа -->
          <button
            type="submit"
            class="apple-button"
            :class="{ 'loading': isLoading }"
            :disabled="isLoading || !isFormValid"
          >
            <span v-if="!isLoading" class="button-content">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" class="button-icon">
                <path fill-rule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              Войти
            </span>
            <span v-else class="loading-spinner"></span>
          </button>
        </form>

        <!-- Сообщения об ошибках -->
        <div v-if="error" class="error-alert">
          <div class="error-content">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <span>{{ error }}</span>
          </div>
          <button @click="clearError" class="error-close">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>


      </div>

      <!-- Футер -->
      <div class="footer-section">
        <p class="footer-text">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20" class="shield-icon">
            <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          Безопасное подключение к Axenta Cloud
        </p>
        <p class="footer-subtitle">
          Используйте ваши учетные данные от Axenta Cloud
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth, type LoginForm } from '@/context/auth';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { config } from '@/config/env';

const router = useRouter();

// Получаем auth безопасно - ленивая инициализация
let auth: any = null;

const getAuth = () => {
  if (!auth) {
    try {
      auth = useAuth();
    } catch (e) {
      console.warn('Auth provider не доступен:', e);
      return null;
    }
  }
  return auth;
};

// Форма
const form = ref<LoginForm>({
  username: '',
  password: '',
});

// UI состояние
const showPassword = ref(false);
const rememberMe = ref(true);
const isLoading = ref(false);
const error = ref('');

// Ошибки полей
const fieldErrors = ref<Record<string, string>>({
  username: '',
  password: '',
});

// Проверяем, был ли пользователь перенаправлен из-за истечения сессии
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const reason = urlParams.get('reason');
  
  if (reason === 'session_expired') {
    error.value = 'Ваша сессия истекла. Пожалуйста, войдите заново.';
    console.log('🔔 Пользователь перенаправлен на страницу входа: сессия истекла');
    
    // Очищаем параметр из URL для чистоты
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
  }
  
  // Проверяем, есть ли сохраненный путь для редиректа после входа
  const redirectPath = localStorage.getItem('redirect_after_login');
  if (redirectPath) {
    console.log('📍 После входа будет редирект на:', redirectPath);
  }
});

// Валидация формы
const isFormValid = computed(() => {
  return form.value.username.length >= 3 && form.value.password.length >= 3;
});



// Методы
const clearFieldError = (field: string) => {
  fieldErrors.value[field] = '';
  error.value = '';
};

const clearError = () => {
  error.value = '';
  fieldErrors.value = { username: '', password: '' };
};

const handleLogin = async () => {
  clearError();

  if (!isFormValid.value) {
    error.value = 'Заполните все поля корректно';
    return;
  }

  isLoading.value = true;

  try {
    const authContext = getAuth();
    if (authContext) {
      // Используем auth context если доступен
      await authContext.login({
        username: form.value.username.trim(),
        password: form.value.password,
      });
      
      // Проверяем, есть ли сохраненный путь для редиректа
      const redirectPath = localStorage.getItem('redirect_after_login');
      if (redirectPath) {
        console.log('🔄 Перенаправление на сохраненный путь:', redirectPath);
        localStorage.removeItem('redirect_after_login');
        await router.push(redirectPath);
      } else {
        // Перенаправляем на dashboard
        await router.push('/dashboard');
      }
    } else {
      // Прямой запрос к API если auth context недоступен
      const response = await fetch(`${config.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: form.value.username.trim(),
          password: form.value.password,
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // Сохраняем данные
        localStorage.setItem('axenta_token', data.data.token);
        localStorage.setItem('axenta_user', JSON.stringify(data.data.user));
        
        if (data.data.company) {
          localStorage.setItem('axenta_company', JSON.stringify(data.data.company));
        }

        // Проверяем, есть ли сохраненный путь для редиректа
        const redirectPath = localStorage.getItem('redirect_after_login');
        if (redirectPath) {
          console.log('🔄 Перенаправление на сохраненный путь:', redirectPath);
          localStorage.removeItem('redirect_after_login');
          window.location.href = redirectPath;
        } else {
          // Перенаправляем
          window.location.href = '/dashboard';
        }
      } else {
        error.value = data.error || 'Ошибка авторизации';
      }
    }

  } catch (err: any) {
    console.error('Ошибка входа:', err);
    
    if (err.message.includes('username') || err.message.includes('логин')) {
      fieldErrors.value.username = err.message;
    } else if (err.message.includes('password') || err.message.includes('пароль')) {
      fieldErrors.value.password = err.message;
    } else {
      error.value = err.message || 'Ошибка входа в систему';
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  console.log('🍎 Apple Style Login mounted');
  
  // Если пользователь уже авторизован, перенаправляем
  if (auth?.isAuthenticated?.value) {
    router.push('/dashboard');
  }
});

// Следим за изменениями аутентификации - ленивая инициализация
onMounted(() => {
  const authContext = getAuth();
  if (authContext) {
    watch(
      () => authContext.isAuthenticated.value,
      (isAuth) => {
        if (isAuth) {
          router.push('/dashboard');
        }
      }
    );
  }
});
</script>

<style scoped>
.apple-login {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}

.login-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.logo-section {
  text-align: center;
  margin-bottom: 30px;
}

.info-section {
  margin-bottom: 30px;
}

.info-card {
  background: rgba(0, 122, 255, 0.1);
  border: 1px solid rgba(0, 122, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.info-card h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #007AFF;
}

.info-card p {
  margin: 4px 0;
  font-size: 14px;
  color: #1d1d1f;
}

.info-main {
  font-size: 14px !important;
  color: #007AFF !important;
  font-weight: 600 !important;
  margin: 0 0 8px 0 !important;
}

.info-note {
  font-size: 12px !important;
  color: #8e8e93 !important;
  margin: 8px 0 0 0 !important;
  line-height: 1.4 !important;
}

.logo-icon {
  margin-bottom: 16px;
  display: inline-block;
}

.app-title {
  font-size: 28px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.app-subtitle {
  font-size: 16px;
  color: #86868b;
  margin: 0;
  font-weight: 400;
}

.form-section {
  margin-bottom: 32px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  position: relative;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.apple-input {
  width: 100%;
  padding: 16px 50px 16px 16px;
  border: 1.5px solid #d2d2d7;
  border-radius: 12px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
  outline: none;
  color: #1d1d1f;
}

.apple-input:focus {
  border-color: #007aff;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.apple-input.has-error {
  border-color: #ff3b30;
  background: rgba(255, 59, 48, 0.05);
}

.apple-input::placeholder {
  color: #86868b;
}

.input-icon {
  position: absolute;
  right: 44px;
  color: #86868b;
  pointer-events: none;
}

.password-toggle {
  position: absolute;
  right: 16px;
  background: none;
  border: none;
  color: #86868b;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.password-toggle:hover {
  color: #007aff;
  background: rgba(0, 122, 255, 0.1);
}

.error-message {
  color: #ff3b30;
  font-size: 14px;
  margin-top: 8px;
  margin-left: 4px;
  font-weight: 400;
}

.options-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 24px 0;
}

.remember-me {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.apple-checkbox {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 1.5px solid #d2d2d7;
  border-radius: 6px;
  margin-right: 12px;
  position: relative;
  transition: all 0.2s ease;
}

.apple-checkbox:checked + .checkmark {
  background: #007aff;
  border-color: #007aff;
}

.apple-checkbox:checked + .checkmark::after {
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

.label-text {
  font-size: 16px;
  color: #1d1d1f;
  font-weight: 400;
}

.apple-button {
  width: 100%;
  padding: 16px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.apple-button:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.apple-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
}

.apple-button:disabled {
  background: #d2d2d7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.button-icon {
  transition: transform 0.2s ease;
}

.apple-button:hover .button-icon {
  transform: translateX(2px);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-alert {
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #ff3b30;
  font-size: 14px;
  font-weight: 500;
}

.error-close {
  background: none;
  border: none;
  color: #ff3b30;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.error-close:hover {
  background: rgba(255, 59, 48, 0.1);
}



.footer-section {
  text-align: center;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding-top: 24px;
}

.footer-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #86868b;
  font-size: 14px;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.shield-icon {
  color: #34c759;
}

.footer-subtitle {
  color: #86868b;
  font-size: 12px;
  margin: 0;
  font-weight: 400;
}

/* Адаптивность */
@media (max-width: 480px) {
  .login-container {
    padding: 24px;
    border-radius: 16px;
    margin: 10px;
  }
  
  .app-title {
    font-size: 24px;
  }
  
  .apple-input {
    padding: 14px 44px 14px 14px;
    font-size: 16px;
  }
  
  .apple-button {
    padding: 14px;
    font-size: 16px;
  }
}

/* Темная тема */
@media (prefers-color-scheme: dark) {
  .apple-login {
    background: linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%);
  }
  
  .login-container {
    background: rgba(28, 28, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .app-title {
    color: #f2f2f7;
  }
  
  .app-subtitle {
    color: #8e8e93;
  }
  
  .apple-input {
    background: rgba(44, 44, 46, 0.8);
    border-color: #48484a;
    color: #f2f2f7;
  }
  
  .apple-input::placeholder {
    color: #8e8e93;
  }
  
  .apple-input:focus {
    background: rgba(44, 44, 46, 0.95);
    border-color: #007aff;
  }
  
  .label-text {
    color: #f2f2f7;
  }
  
  .checkmark {
    border-color: #48484a;
  }
  
  .footer-text,
  .footer-subtitle {
    color: #8e8e93;
  }
}
</style>
