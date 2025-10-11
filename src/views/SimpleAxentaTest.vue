<template>
  <div class="simple-test-container">
    <div class="test-card">
      <h1>🔐 Простой тест API Axenta</h1>
      <p>Минимальная реализация без проблемных заголовков</p>

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

        <button type="submit" :disabled="isLoading" class="login-btn">
          <span v-if="isLoading" class="spinner"></span>
          {{ isLoading ? 'Тестирование...' : '🚀 Тестировать' }}
        </button>
      </form>

      <div v-if="result" class="result-section">
        <div :class="['result-card', result.success ? 'success' : 'error']">
          <h3>{{ result.success ? '✅ Успех' : '❌ Ошибка' }}</h3>
          <p><strong>Статус:</strong> {{ result.status }}</p>
          <p><strong>Сообщение:</strong> {{ result.message }}</p>
          
          <div v-if="result.data" class="data-section">
            <h4>📦 Данные ответа:</h4>
            <pre>{{ JSON.stringify(result.data, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <div class="info-section">
        <h3>ℹ️ Информация</h3>
        <ul>
          <li><strong>URL:</strong> https://axenta.cloud/api/auth/login/</li>
          <li><strong>Метод:</strong> POST</li>
          <li><strong>Заголовки:</strong> только Content-Type</li>
          <li><strong>CORS:</strong> зависит от настроек сервера</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

const isLoading = ref(false);
const credentials = ref({
  username: '',
  password: ''
});

const result = ref<{
  success: boolean;
  status: number;
  message: string;
  data?: any;
} | null>(null);

const testLogin = async () => {
  if (!credentials.value.username || !credentials.value.password) {
    return;
  }

  isLoading.value = true;
  result.value = null;

  try {
    console.log('🔐 Простой тест авторизации...');
    
    const response = await axios.post(
      'https://axenta.cloud/api/auth/login/',
      {
        username: credentials.value.username,
        password: credentials.value.password
      },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
          // Только самые необходимые заголовки
        }
      }
    );

    console.log('✅ Успешный ответ:', response);

    result.value = {
      success: true,
      status: response.status,
      message: 'Авторизация успешна!',
      data: response.data
    };

  } catch (error: any) {
    console.error('❌ Ошибка:', error);

    let status = 0;
    let message = 'Неизвестная ошибка';
    let data = null;

    if (error.response) {
      status = error.response.status;
      data = error.response.data;
      
      switch (status) {
        case 400:
          message = 'Неверные учетные данные';
          break;
        case 401:
          message = 'Не авторизован';
          break;
        case 403:
          message = 'Доступ запрещен';
          break;
        case 502:
          message = 'Сервер временно недоступен (502)';
          break;
        case 503:
          message = 'Сервис недоступен (503)';
          break;
        default:
          message = `Ошибка сервера (${status})`;
      }
    } else if (error.code === 'ERR_NETWORK') {
      message = 'Ошибка сети (возможно CORS)';
    } else if (error.code === 'ECONNABORTED') {
      message = 'Таймаут запроса';
    } else {
      message = error.message || 'Неизвестная ошибка';
    }

    result.value = {
      success: false,
      status,
      message,
      data
    };
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.simple-test-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.test-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

.test-card h1 {
  color: #2c3e50;
  margin-bottom: 10px;
  text-align: center;
}

.test-card p {
  color: #6c757d;
  text-align: center;
  margin-bottom: 30px;
}

.login-form {
  margin-bottom: 30px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.result-section {
  margin-bottom: 30px;
}

.result-card {
  border-radius: 12px;
  padding: 20px;
  border-left: 4px solid;
}

.result-card.success {
  background: #d4edda;
  border-left-color: #28a745;
  color: #155724;
}

.result-card.error {
  background: #f8d7da;
  border-left-color: #dc3545;
  color: #721c24;
}

.result-card h3 {
  margin-bottom: 15px;
}

.result-card p {
  margin-bottom: 10px;
}

.data-section {
  margin-top: 15px;
}

.data-section h4 {
  margin-bottom: 10px;
}

.data-section pre {
  background: white;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  font-size: 12px;
  overflow-x: auto;
}

.info-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
}

.info-section h3 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.info-section ul {
  list-style: none;
  padding: 0;
}

.info-section li {
  padding: 5px 0;
  border-bottom: 1px solid #e9ecef;
}

.info-section li:last-child {
  border-bottom: none;
}
</style>
