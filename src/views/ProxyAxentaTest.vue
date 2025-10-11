<template>
  <div class="proxy-test-container">
    <div class="test-card">
      <h1>🌉 Тест через CORS прокси</h1>
      <p>Подключение к API Axenta через локальный прокси для обхода CORS</p>

      <div class="proxy-info">
        <h3>📡 Информация о прокси:</h3>
        <div class="info-item">
          <strong>Прокси сервер:</strong> http://localhost:3003
        </div>
        <div class="info-item">
          <strong>Перенаправляет на:</strong> https://axenta.cloud
        </div>
        <div class="info-item">
          <strong>Статус прокси:</strong> 
          <span :class="['status', proxyStatus]">{{ proxyMessage }}</span>
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

        <button type="submit" :disabled="isLoading || proxyStatus !== 'success'" class="login-btn">
          <span v-if="isLoading" class="spinner"></span>
          {{ isLoading ? 'Тестирование...' : '🚀 Тестировать через прокси' }}
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

          <div v-if="result.success && result.data?.access" class="token-info">
            <h4>🔑 Информация о токене:</h4>
            <p><strong>Access token:</strong> {{ result.data.access.substring(0, 30) }}...</p>
            <p><strong>Refresh token:</strong> {{ result.data.refresh ? result.data.refresh.substring(0, 30) + '...' : 'Нет' }}</p>
          </div>
        </div>
      </div>

      <div class="instructions">
        <h3>💡 Инструкции:</h3>
        <ol>
          <li>Убедитесь, что CORS прокси запущен (должен показывать "Работает")</li>
          <li>Введите реальные учетные данные Axenta</li>
          <li>Нажмите "Тестировать через прокси"</li>
          <li>Просмотрите результат и токены</li>
        </ol>
        
        <div class="note">
          <strong>Примечание:</strong> Если прокси не работает, запустите его командой:
          <code>cd /Users/com/backend_axenta/scripts && npm run start-proxy</code>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const isLoading = ref(false);
const proxyStatus = ref('unknown');
const proxyMessage = ref('Проверка...');

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

// Проверка статуса прокси
const checkProxy = async () => {
  try {
    const response = await axios.get('http://localhost:3003/', {
      timeout: 5000,
      validateStatus: () => true
    });
    
    if (response.status === 200 || response.status === 404) {
      proxyStatus.value = 'success';
      proxyMessage.value = 'Работает';
    } else {
      proxyStatus.value = 'error';
      proxyMessage.value = `Ошибка (${response.status})`;
    }
  } catch (error: any) {
    proxyStatus.value = 'error';
    proxyMessage.value = 'Не доступен';
  }
};

const testLogin = async () => {
  if (!credentials.value.username || !credentials.value.password) {
    return;
  }

  isLoading.value = true;
  result.value = null;

  try {
    console.log('🌉 Тест авторизации через CORS прокси...');
    
    // Используем локальный прокси вместо прямого обращения к Axenta
    const response = await axios.post(
      'http://localhost:3003/api/auth/login/',
      {
        username: credentials.value.username,
        password: credentials.value.password
      },
      {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Успешный ответ через прокси:', response);

    result.value = {
      success: true,
      status: response.status,
      message: 'Авторизация через прокси успешна!',
      data: response.data
    };

  } catch (error: any) {
    console.error('❌ Ошибка через прокси:', error);

    let status = 0;
    let message = 'Неизвестная ошибка';
    let data = null;

    if (error.response) {
      status = error.response.status;
      data = error.response.data;
      
      switch (status) {
        case 400:
          message = 'Неверные учетные данные (через прокси)';
          break;
        case 401:
          message = 'Не авторизован (через прокси)';
          break;
        case 403:
          message = 'Доступ запрещен (через прокси)';
          break;
        case 502:
          message = 'Сервер Axenta недоступен (502 через прокси)';
          break;
        case 503:
          message = 'Сервис недоступен (503 через прокси)';
          break;
        default:
          message = `Ошибка сервера (${status} через прокси)`;
      }
    } else if (error.code === 'ERR_NETWORK') {
      message = 'Ошибка сети - проверьте, что прокси запущен';
    } else if (error.code === 'ECONNABORTED') {
      message = 'Таймаут запроса через прокси';
    } else {
      message = error.message || 'Неизвестная ошибка прокси';
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

// Инициализация
onMounted(() => {
  checkProxy();
  
  // Периодическая проверка прокси
  setInterval(checkProxy, 10000);
});
</script>

<style scoped>
.proxy-test-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  padding: 20px;
}

.test-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  max-width: 700px;
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

.proxy-info {
  background: #e7f3ff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  border-left: 4px solid #17a2b8;
}

.proxy-info h3 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.info-item {
  margin-bottom: 10px;
  font-family: monospace;
  font-size: 14px;
}

.info-item strong {
  color: #495057;
}

.status.success {
  color: #28a745;
  font-weight: 600;
}

.status.error {
  color: #dc3545;
  font-weight: 600;
}

.status.unknown {
  color: #6c757d;
  font-weight: 600;
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
  border-color: #17a2b8;
}

.login-btn {
  width: 100%;
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
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

.data-section, .token-info {
  margin-top: 15px;
}

.data-section h4, .token-info h4 {
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

.token-info p {
  font-family: monospace;
  font-size: 12px;
  background: white;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.instructions {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
}

.instructions h3 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.instructions ol {
  margin-bottom: 15px;
  padding-left: 20px;
}

.instructions li {
  margin-bottom: 8px;
  color: #495057;
}

.note {
  background: #fff3cd;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #ffc107;
}

.note code {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}
</style>
