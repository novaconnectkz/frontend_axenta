<template>
  <div class="axenta-test-container">
    <div class="test-card">
      <div class="header">
        <h1>🔍 Тест подключения к Axenta API</h1>
        <p>Проверка авторизации и получения данных из реального API Axenta</p>
      </div>

      <div class="connection-status">
        <div class="status-item">
          <span class="label">Статус подключения:</span>
          <span :class="['status', connectionStatus.status === 200 ? 'success' : 'error']">
            {{ connectionStatus.message }}
          </span>
        </div>
        <div class="status-item">
          <span class="label">API URL:</span>
          <span class="value">{{ config.backendUrl }}/api</span>
        </div>
      </div>

      <form @submit.prevent="testLogin" class="login-form">
        <h2>🔐 Авторизация</h2>
        
        <div class="form-group">
          <label for="username">Email пользователя:</label>
          <input
            id="username"
            v-model="credentials.username"
            type="email"
            placeholder="user@example.com"
            required
            :disabled="isLoading"
          >
        </div>

        <div class="form-group">
          <label for="password">Пароль:</label>
          <input
            id="password"
            v-model="credentials.password"
            type="password"
            placeholder="Введите пароль"
            required
            :disabled="isLoading"
          >
        </div>

        <button type="submit" :disabled="isLoading" class="test-btn">
          <span v-if="isLoading" class="spinner"></span>
          {{ isLoading ? 'Подключение...' : '🚀 Тестировать API' }}
        </button>
      </form>

      <div v-if="authResult" class="result-section">
        <h3>📋 Результат авторизации</h3>
        <div class="result-card" :class="authResult.success ? 'success' : 'error'">
          <div class="result-header">
            <span class="icon">{{ authResult.success ? '✅' : '❌' }}</span>
            <span class="message">{{ authResult.message }}</span>
          </div>
          <div v-if="authResult.data" class="result-data">
            <pre>{{ JSON.stringify(authResult.data, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <div v-if="accountsResult" class="result-section">
        <h3>📊 Результат получения аккаунтов</h3>
        <div class="result-card" :class="accountsResult.success ? 'success' : 'error'">
          <div class="result-header">
            <span class="icon">{{ accountsResult.success ? '✅' : '❌' }}</span>
            <span class="message">{{ accountsResult.message }}</span>
          </div>
          
          <div v-if="accountsResult.success && accountsResult.data" class="accounts-data">
            <div class="accounts-stats">
              <div class="stat">
                <span class="stat-value">{{ accountsResult.data.results?.length || 0 }}</span>
                <span class="stat-label">Загружено</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ accountsResult.data.count || 0 }}</span>
                <span class="stat-label">Всего</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ totalObjects }}</span>
                <span class="stat-label">Объектов</span>
              </div>
            </div>

            <div v-if="accountsResult.data.results?.length" class="accounts-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Менеджер</th>
                    <th>Сервисная компания</th>
                    <th>Объектов</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="account in accountsResult.data.results" :key="account.id">
                    <td>{{ account.id }}</td>
                    <td>{{ account.name || 'Не указано' }}</td>
                    <td>{{ account.manager || 'Не назначен' }}</td>
                    <td>{{ account.service_company || 'Не указана' }}</td>
                    <td>{{ account.objects_count || 0 }}</td>
                    <td>
                      <span :class="['status-badge', getStatusClass(account.status)]">
                        {{ account.status || 'Неизвестно' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <details class="raw-data">
              <summary>📦 Сырые данные JSON</summary>
              <pre>{{ JSON.stringify(accountsResult.data, null, 2) }}</pre>
            </details>
          </div>
        </div>
      </div>

      <div class="info-section">
        <h3>💡 Информация</h3>
        <ul>
          <li>Этот компонент тестирует прямое подключение к API Axenta Cloud</li>
          <li>Используется endpoint: <code>{{ config.backendUrl }}/api/auth/login/</code></li>
          <li>При успешной авторизации загружаются аккаунты из <code>/api/cms/accounts/</code></li>
          <li>Все данные отображаются в реальном времени</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { config } from '@/config/env';
import { axentaApiService, type AxentaAuthResponse, type AxentaAccountsResponse } from '@/services/axentaApiService';

// Реактивные данные
const isLoading = ref(false);
const credentials = ref({
  username: '',
  password: ''
});

const connectionStatus = ref({
  status: 0,
  message: 'Проверка...'
});

const authResult = ref<{
  success: boolean;
  message: string;
  data?: AxentaAuthResponse;
} | null>(null);

const accountsResult = ref<{
  success: boolean;
  message: string;
  data?: AxentaAccountsResponse;
} | null>(null);

// Вычисляемые свойства
const totalObjects = computed(() => {
  if (!accountsResult.value?.data?.results) return 0;
  return accountsResult.value.data.results.reduce((sum, account) => sum + (account.objects_count || 0), 0);
});

// Методы
const getStatusClass = (status: string) => {
  const normalizedStatus = status?.toLowerCase();
  if (normalizedStatus === 'active' || normalizedStatus === 'активен') return 'active';
  if (normalizedStatus === 'inactive' || normalizedStatus === 'неактивен') return 'inactive';
  return 'unknown';
};

const checkConnection = async () => {
  try {
    const result = await axentaApiService.testConnection();
    connectionStatus.value = result;
  } catch (error: any) {
    connectionStatus.value = {
      status: 0,
      message: `Ошибка: ${error.message}`
    };
  }
};

const testLogin = async () => {
  if (!credentials.value.username || !credentials.value.password) {
    return;
  }

  isLoading.value = true;
  authResult.value = null;
  accountsResult.value = null;

  try {
    // Тестируем авторизацию
    const authData = await axentaApiService.login(
      credentials.value.username,
      credentials.value.password
    );

    authResult.value = {
      success: true,
      message: 'Авторизация успешна!',
      data: authData
    };

    // Если авторизация успешна, загружаем аккаунты
    try {
      const accountsData = await axentaApiService.getAccounts();
      
      accountsResult.value = {
        success: true,
        message: `Загружено ${accountsData.results?.length || 0} аккаунтов из ${accountsData.count || 0}`,
        data: accountsData
      };
    } catch (accountsError: any) {
      accountsResult.value = {
        success: false,
        message: `Ошибка загрузки аккаунтов: ${accountsError.message}`
      };
    }

  } catch (error: any) {
    authResult.value = {
      success: false,
      message: error.message || 'Ошибка авторизации'
    };
  } finally {
    isLoading.value = false;
  }
};

// Инициализация
onMounted(() => {
  checkConnection();
});
</script>

<style scoped>
.axenta-test-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.test-card {
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  overflow: hidden;
}

.header {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  padding: 30px;
  text-align: center;
}

.header h1 {
  font-size: 2.2em;
  margin-bottom: 10px;
  font-weight: 300;
}

.header p {
  opacity: 0.9;
  font-size: 1.1em;
}

.connection-status {
  background: #f8f9fa;
  padding: 20px 30px;
  border-bottom: 1px solid #e9ecef;
}

.status-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: 600;
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

.value {
  font-family: monospace;
  color: #6c757d;
}

.login-form {
  padding: 30px;
  border-bottom: 1px solid #e9ecef;
}

.login-form h2 {
  color: #2c3e50;
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
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
}

.test-btn {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.test-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,123,255,0.3);
}

.test-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
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
  padding: 30px;
  border-bottom: 1px solid #e9ecef;
}

.result-section h3 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.result-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.result-card.success {
  border: 2px solid #28a745;
}

.result-card.error {
  border: 2px solid #dc3545;
}

.result-header {
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.result-card.success .result-header {
  background: #d4edda;
  color: #155724;
}

.result-card.error .result-header {
  background: #f8d7da;
  color: #721c24;
}

.result-data {
  padding: 20px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.result-data pre {
  background: white;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  font-size: 14px;
  overflow-x: auto;
}

.accounts-data {
  padding: 20px;
}

.accounts-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}

.stat-value {
  display: block;
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9em;
  opacity: 0.9;
}

.accounts-table {
  overflow-x: auto;
  margin-bottom: 20px;
}

.accounts-table table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.accounts-table th {
  background: #f8f9fa;
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #e9ecef;
}

.accounts-table td {
  padding: 15px;
  border-bottom: 1px solid #e9ecef;
}

.accounts-table tr:hover {
  background: #f8f9fa;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.unknown {
  background: #e2e3e5;
  color: #6c757d;
}

.raw-data {
  margin-top: 20px;
}

.raw-data summary {
  cursor: pointer;
  padding: 10px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-weight: 600;
}

.raw-data pre {
  margin-top: 10px;
  background: #f8f9fa;
  padding: 20px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  overflow-x: auto;
}

.info-section {
  padding: 30px;
  background: #f8f9fa;
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
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.info-section li:last-child {
  border-bottom: none;
}

.info-section code {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

@media (max-width: 768px) {
  .test-card {
    margin: 10px;
    border-radius: 12px;
  }
  
  .header, .login-form, .result-section, .info-section {
    padding: 20px;
  }
  
  .header h1 {
    font-size: 1.8em;
  }
  
  .accounts-stats {
    grid-template-columns: 1fr;
  }
}
</style>
