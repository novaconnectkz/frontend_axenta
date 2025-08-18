<template>
  <div class="login-container">
    <div class="login-card">
      <h1>CRM - Вход в систему</h1>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">Логин:</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            required
            placeholder="Введите ваш логин"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Пароль:</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            placeholder="Введите ваш пароль"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label>
            <input
              v-model="showTenantField"
              type="checkbox"
              class="form-checkbox"
            />
            Указать ID компании
          </label>
        </div>
        
        <div v-if="showTenantField" class="form-group">
          <label for="tenantId">ID Компании:</label>
          <input
            id="tenantId"
            v-model="form.tenantId"
            type="text"
            placeholder="ID вашей компании"
            class="form-input"
          />
        </div>
        
        <button
          type="submit"
          :disabled="isLoading || !form.username || !form.password"
          class="login-button"
        >
          {{ isLoading ? 'Вход...' : 'Войти' }}
        </button>
      </form>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      

      
      <div class="info-text">
        <p>Используйте ваши учетные данные от Axenta Cloud</p>
        <p><strong>Backend:</strong> {{ backendUrl }}</p>
        <p><strong>Frontend:</strong> {{ frontendUrl }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth, type LoginForm } from '@/context/auth';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { config } from '@/config/env';

const router = useRouter();
const auth = useAuth();

// Форма
const form = ref<LoginForm>({
  username: '',
  password: '',
  tenantId: '',
});

// UI состояние
const showTenantField = ref(false);
const isLoading = computed(() => auth.isLoading.value);
const error = computed(() => auth.error.value);

// Информация о подключении
const backendUrl = config.backendUrl;
const frontendUrl = window.location.origin;



// Обработка входа
const handleLogin = async () => {
  if (!form.value.username || !form.value.password) {
    return;
  }

  try {
    await auth.login({
      username: form.value.username.trim(),
      password: form.value.password,
      tenantId: showTenantField.value && form.value.tenantId?.trim() 
        ? form.value.tenantId.trim() 
        : undefined,
    });

    // Успешный вход - перенаправляем
    const redirectTo = router.currentRoute.value.query.redirect as string || '/dashboard';
    await router.push(redirectTo);

  } catch (error: any) {
    console.error('Ошибка входа:', error);
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  backdrop-filter: blur(10px);
}

h1 {
  text-align: center;
  color: #1976d2;
  margin-bottom: 30px;
  font-size: 24px;
}

.login-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #1976d2;
}

.form-checkbox {
  margin-right: 8px;
}

.login-button {
  width: 100%;
  padding: 14px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.login-button:hover:not(:disabled) {
  background: #1565c0;
}

.login-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #c62828;
}

.connection-status {
  text-align: center;
  margin-bottom: 20px;
}

.status-ready {
  color: #4caf50;
  font-weight: 500;
}

.status-loading {
  color: #ff9800;
  font-weight: 500;
}

.info-text {
  text-align: center;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.info-text p {
  margin: 8px 0;
}

.info-text strong {
  color: #333;
}
</style>
