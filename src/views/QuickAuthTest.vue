<template>
  <div class="quick-auth-container">
    <div class="auth-card">
      <h1>🚀 Быстрый тест авторизации Axenta</h1>
      <p>Проверка исправленной системы авторизации</p>

      <div class="config-info">
        <h3>📋 Текущая конфигурация:</h3>
        <div class="config-item">
          <strong>Backend URL:</strong> {{ config.backendUrl }}
        </div>
        <div class="config-item">
          <strong>API Base URL:</strong> {{ config.apiBaseUrl }}
        </div>
        <div class="config-item">
          <strong>Auth Endpoint:</strong> {{ config.apiBaseUrl }}/auth/login/
        </div>
      </div>

      <form @submit.prevent="testLogin" class="login-form">
        <div class="form-group">
          <label>Email:</label>
          <input 
            v-model="credentials.username" 
            type="email" 
            placeholder="user@example.com"
            required
          >
        </div>
        
        <div class="form-group">
          <label>Пароль:</label>
          <input 
            v-model="credentials.password" 
            type="password" 
            placeholder="password"
            required
          >
        </div>

        <button type="submit" :disabled="auth.isLoading.value" class="login-btn">
          {{ auth.isLoading.value ? 'Авторизация...' : '🔐 Войти' }}
        </button>
      </form>

      <div v-if="auth.error.value" class="error-message">
        ❌ {{ auth.error.value }}
      </div>

      <div v-if="auth.user.value" class="success-message">
        ✅ Успешная авторизация!
        <div class="user-info">
          <strong>Пользователь:</strong> {{ auth.user.value.name }}<br>
          <strong>Email:</strong> {{ auth.user.value.email }}<br>
          <strong>Компания:</strong> {{ auth.company.value?.name }}
        </div>
      </div>

      <div class="debug-info">
        <h3>🔍 Отладочная информация:</h3>
        <div class="debug-item">
          <strong>Токен:</strong> {{ auth.token.value ? 'Есть (' + auth.token.value.substring(0, 20) + '...)' : 'Нет' }}
        </div>
        <div class="debug-item">
          <strong>Авторизован:</strong> {{ auth.isAuthenticated.value ? 'Да' : 'Нет' }}
        </div>
      </div>

      <div class="actions">
        <button @click="auth.logout()" v-if="auth.isAuthenticated.value" class="logout-btn">
          🚪 Выйти
        </button>
        <button @click="goToDashboard" v-if="auth.isAuthenticated.value" class="dashboard-btn">
          📊 Перейти к дашборду
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/context/auth';
import { config } from '@/config/env';

const router = useRouter();
const auth = useAuth();

const credentials = ref({
  username: '',
  password: ''
});

const testLogin = async () => {
  try {
    await auth.login(credentials.value);
  } catch (error) {
    console.error('Login failed:', error);
  }
};

const goToDashboard = () => {
  router.push('/dashboard');
};
</script>

<style scoped>
.quick-auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

.auth-card h1 {
  color: #2c3e50;
  margin-bottom: 10px;
  text-align: center;
}

.auth-card p {
  color: #6c757d;
  text-align: center;
  margin-bottom: 30px;
}

.config-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
}

.config-info h3 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.config-item {
  margin-bottom: 10px;
  font-family: monospace;
  font-size: 14px;
}

.config-item strong {
  color: #495057;
}

.login-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #495057;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 16px;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
}

.login-btn {
  width: 100%;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.login-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.user-info {
  margin-top: 10px;
  font-size: 14px;
}

.debug-info {
  background: #e9ecef;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.debug-info h3 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.debug-item {
  margin-bottom: 8px;
  font-family: monospace;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 10px;
}

.logout-btn, .dashboard-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.logout-btn {
  background: #dc3545;
  color: white;
}

.dashboard-btn {
  background: #28a745;
  color: white;
}
</style>
