<template>
  <div class="auth-login">
    <v-container class="fill-height">
      <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="4">
          <v-card class="pa-4" elevation="8">
            <v-card-title class="text-center mb-4">
              <h2>Вход в CRM</h2>
            </v-card-title>
            
            <v-card-text>
              <v-form 
                ref="loginForm"
                v-model="isFormValid"
                @submit.prevent="handleLogin"
              >
                <!-- Поле выбора компании (опционально) -->
                <v-text-field
                  v-if="showTenantField"
                  v-model="form.tenantId"
                  label="ID Компании"
                  placeholder="Введите ID вашей компании"
                  prepend-inner-icon="mdi-domain"
                  variant="outlined"
                  density="comfortable"
                  class="mb-3"
                  :rules="tenantRules"
                  hint="Оставьте пустым для автоматического определения"
                  persistent-hint
                />

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
                    @click="showAdvanced = !showAdvanced"
                  >
                    {{ showAdvanced ? 'Скрыть' : 'Дополнительно' }}
                  </v-btn>
                </div>

                <!-- Дополнительные настройки -->
                <v-expand-transition>
                  <div v-show="showAdvanced" class="mb-4">
                    <v-divider class="mb-3" />
                    <v-switch
                      v-model="showTenantField"
                      label="Указать ID компании вручную"
                      color="primary"
                      density="compact"
                      hide-details
                    />
                  </div>
                </v-expand-transition>

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
                  Войти
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


              </v-form>
            </v-card-text>
          </v-card>

          <!-- Дополнительная информация -->
          <v-card class="mt-4 pa-3" variant="tonal">
            <v-card-text class="text-center">
              <p class="text-body-2 mb-2">
                <v-icon size="small" class="mr-1">mdi-shield-check</v-icon>
                Безопасное подключение к Axenta Cloud
              </p>
              <p class="text-caption text-medium-emphasis">
                Используйте ваши учетные данные от Axenta Cloud для входа в CRM систему
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { useAuth, type LoginForm } from '@/context/auth';
import type { VuetifyFormRef } from '@/types';
import { defineComponent, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'AuthLogin',
  setup() {
    const router = useRouter();
    const auth = useAuth();

    // Форма
    const loginForm = ref<VuetifyFormRef | null>(null);
    const isFormValid = ref(false);
    const form = ref<LoginForm>({
      username: '',
      password: '',
      tenantId: '',
    });

    // UI состояние
    const showPassword = ref(false);
    const showAdvanced = ref(false);
    const showTenantField = ref(false);
    const rememberMe = ref(true);

    // Ошибки полей
    const fieldErrors = ref<Record<string, string[]>>({
      username: [],
      password: [],
    });



    // Правила валидации
    const usernameRules = [
      (v: string) => !!v || 'Логин обязателен',
      (v: string) => v.length >= 3 || 'Минимум 3 символа',
      (v: string) => v.length <= 64 || 'Максимум 64 символа',
      (v: string) => /^[a-zA-Z0-9_.-]+$/.test(v) || 'Только латинские буквы, цифры, точки, дефисы и подчеркивания',
    ];

    const passwordRules = [
      (v: string) => !!v || 'Пароль обязателен',
      (v: string) => v.length >= 3 || 'Минимум 3 символа',
      (v: string) => v.length <= 64 || 'Максимум 64 символа',
    ];

    const tenantRules = [
      (v: string) => !v || v.length >= 1 || 'ID компании должен содержать минимум 1 символ',
      (v: string) => !v || /^[a-zA-Z0-9_-]+$/.test(v) || 'Только латинские буквы, цифры, дефисы и подчеркивания',
    ];

    // Методы
    const clearFieldError = (field: string) => {
      fieldErrors.value[field] = [];
      auth.clearError();
    };

    const clearError = () => {
      auth.clearError();
      fieldErrors.value = { username: [], password: [] };
    };

    const validateForm = async (): Promise<boolean> => {
      if (!loginForm.value) return false;
      const { valid } = await loginForm.value.validate();
      return valid;
    };

    const handleLogin = async () => {
      clearError();

      if (!(await validateForm())) {
        return;
      }

      try {
        const credentials: LoginForm = {
          username: form.value.username.trim(),
          password: form.value.password,
        };

        if (showTenantField.value && form.value.tenantId?.trim()) {
          credentials.tenantId = form.value.tenantId.trim();
        }

        await auth.login(credentials);

        // Успешный вход - перенаправляем на главную страницу
        const redirectTo = router.currentRoute.value.query.redirect as string || '/dashboard';
        await router.push(redirectTo);

      } catch (error: any) {
        console.error('Ошибка входа:', error);
        
        // Обрабатываем специфичные ошибки
        if (error.message.includes('username') || error.message.includes('логин')) {
          fieldErrors.value.username = [error.message];
        } else if (error.message.includes('password') || error.message.includes('пароль')) {
          fieldErrors.value.password = [error.message];
        }
        // Общая ошибка уже установлена в auth.error
      }
    };

    // Автофокус на поле логина
    onMounted(() => {
      // Если пользователь уже авторизован, перенаправляем
      if (auth.isAuthenticated.value) {
        router.push('/dashboard');
      }
    });

    // Следим за изменениями аутентификации
    watch(
      () => auth.isAuthenticated.value,
      (isAuth) => {
        if (isAuth) {
          router.push('/dashboard');
        }
      }
    );

    return {
      // Refs
      loginForm,
      isFormValid,
      form,
      showPassword,
      showAdvanced,
      showTenantField,
      rememberMe,
      fieldErrors,



      // From auth context
      isLoading: auth.isLoading,
      error: auth.error,

      // Rules
      usernameRules,
      passwordRules,
      tenantRules,

      // Methods
      clearFieldError,
      clearError,
      handleLogin,
    };
  },
});
</script>

<style scoped>
.auth-login {
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
