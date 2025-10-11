<template>
  <div class="diagnostics-container">
    <div class="diagnostics-card">
      <div class="header">
        <h1>🔧 Диагностика API Axenta</h1>
        <p>Детальная проверка подключения с retry механизмом</p>
      </div>

      <div class="status-section">
        <h2>📊 Текущий статус</h2>
        <div class="status-grid">
          <div class="status-item">
            <span class="label">Подключение:</span>
            <span :class="['status', connectionStatus]">{{ connectionMessage }}</span>
          </div>
          <div class="status-item">
            <span class="label">API Endpoint:</span>
            <span class="value">https://axenta.cloud/api/auth/login/</span>
          </div>
          <div class="status-item">
            <span class="label">Последняя проверка:</span>
            <span class="value">{{ lastCheck || 'Не проверялось' }}</span>
          </div>
        </div>
      </div>

      <div class="test-section">
        <h2>🧪 Тестирование</h2>
        
        <div class="test-controls">
          <button @click="runDiagnostics" :disabled="isRunning" class="test-btn">
            <span v-if="isRunning" class="spinner"></span>
            {{ isRunning ? 'Тестирование...' : '🚀 Запустить диагностику' }}
          </button>
          
          <button @click="testWithCredentials" :disabled="isRunning" class="test-btn secondary">
            🔐 Тест с учетными данными
          </button>
        </div>

        <div v-if="showCredentialsForm" class="credentials-form">
          <div class="form-group">
            <label>Email:</label>
            <input v-model="testCredentials.username" type="email" placeholder="user@example.com">
          </div>
          <div class="form-group">
            <label>Пароль:</label>
            <input v-model="testCredentials.password" type="password" placeholder="password">
          </div>
          <button @click="runAuthTest" :disabled="isRunning" class="test-btn">
            {{ isRunning ? 'Тестирование...' : 'Тестировать авторизацию' }}
          </button>
        </div>
      </div>

      <div v-if="diagnosticsResults.length > 0" class="results-section">
        <h2>📋 Результаты диагностики</h2>
        
        <div class="results-list">
          <div 
            v-for="(result, index) in diagnosticsResults" 
            :key="index"
            :class="['result-item', result.success ? 'success' : 'error']"
          >
            <div class="result-header">
              <span class="icon">{{ result.success ? '✅' : '❌' }}</span>
              <span class="title">{{ result.title }}</span>
              <span v-if="result.timing" class="timing">{{ result.timing }}ms</span>
            </div>
            <div class="result-message">{{ result.message }}</div>
            <div v-if="result.details" class="result-details">
              <details>
                <summary>Подробности</summary>
                <pre>{{ JSON.stringify(result.details, null, 2) }}</pre>
              </details>
            </div>
          </div>
        </div>
      </div>

      <div class="recommendations-section">
        <h2>💡 Рекомендации</h2>
        <div class="recommendations">
          <div class="recommendation">
            <strong>Если получаете 502 ошибки:</strong>
            <ul>
              <li>Это проблема сервера Axenta, не вашего кода</li>
              <li>Попробуйте через несколько минут</li>
              <li>Используйте retry механизм (уже встроен)</li>
            </ul>
          </div>
          
          <div class="recommendation">
            <strong>Если подключение не работает:</strong>
            <ul>
              <li>Проверьте интернет соединение</li>
              <li>Убедитесь, что нет блокировки CORS</li>
              <li>Проверьте настройки прокси/VPN</li>
            </ul>
          </div>
          
          <div class="recommendation">
            <strong>Альтернативные способы тестирования:</strong>
            <ul>
              <li><code>curl -X POST https://axenta.cloud/api/auth/login/ -H "Content-Type: application/json" -d '{"username":"test","password":"test"}'</code></li>
              <li>Используйте наш автономный веб-интерфейс на порту 3000</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { testAxentaConnection, testAxentaAuth, getAxentaDiagnostics, type ApiTestResult } from '@/utils/axentaApiHelper';

// Реактивные данные
const isRunning = ref(false);
const connectionStatus = ref('unknown');
const connectionMessage = ref('Не проверялось');
const lastCheck = ref('');
const showCredentialsForm = ref(false);

const testCredentials = ref({
  username: '',
  password: ''
});

interface DiagnosticResult {
  title: string;
  success: boolean;
  message: string;
  timing?: number;
  details?: any;
}

const diagnosticsResults = ref<DiagnosticResult[]>([]);

// Методы
const updateConnectionStatus = (result: ApiTestResult) => {
  connectionStatus.value = result.success ? 'success' : 'error';
  connectionMessage.value = result.message;
  lastCheck.value = new Date().toLocaleTimeString();
};

const runDiagnostics = async () => {
  isRunning.value = true;
  diagnosticsResults.value = [];
  
  try {
    // 1. Тест базового подключения
    diagnosticsResults.value.push({
      title: 'Тестирование подключения к Axenta Cloud',
      success: false,
      message: 'Выполняется...'
    });
    
    const connectionResult = await testAxentaConnection(3, 1000);
    diagnosticsResults.value[0] = {
      title: 'Подключение к Axenta Cloud',
      success: connectionResult.success,
      message: connectionResult.message,
      timing: connectionResult.timing,
      details: connectionResult
    };
    
    updateConnectionStatus(connectionResult);
    
    // 2. Полная диагностика
    diagnosticsResults.value.push({
      title: 'Получение диагностической информации',
      success: false,
      message: 'Выполняется...'
    });
    
    const fullDiagnostics = await getAxentaDiagnostics();
    diagnosticsResults.value[1] = {
      title: 'Диагностика системы',
      success: fullDiagnostics.connection.success,
      message: `CORS: ${fullDiagnostics.cors ? 'OK' : 'Проблемы'}, SSL: ${fullDiagnostics.ssl ? 'OK' : 'Проблемы'}`,
      timing: fullDiagnostics.timing,
      details: fullDiagnostics
    };
    
    // 3. Тест API с неверными данными (должен вернуть 400)
    diagnosticsResults.value.push({
      title: 'Тестирование API endpoint',
      success: false,
      message: 'Выполняется...'
    });
    
    const apiResult = await testAxentaAuth('test', 'test', 2, 1000);
    diagnosticsResults.value[2] = {
      title: 'API Endpoint (/api/auth/login/)',
      success: apiResult.status === 400, // 400 это нормально для неверных данных
      message: apiResult.status === 400 ? 'API работает корректно (400 для неверных данных)' : apiResult.message,
      timing: apiResult.timing,
      details: apiResult
    };
    
  } catch (error: any) {
    diagnosticsResults.value.push({
      title: 'Критическая ошибка',
      success: false,
      message: error.message,
      details: error
    });
  } finally {
    isRunning.value = false;
  }
};

const testWithCredentials = () => {
  showCredentialsForm.value = !showCredentialsForm.value;
};

const runAuthTest = async () => {
  if (!testCredentials.value.username || !testCredentials.value.password) {
    return;
  }
  
  isRunning.value = true;
  
  try {
    const result = await testAxentaAuth(
      testCredentials.value.username, 
      testCredentials.value.password, 
      3, 
      2000
    );
    
    diagnosticsResults.value.unshift({
      title: 'Тест авторизации с реальными данными',
      success: result.success,
      message: result.message,
      timing: result.timing,
      details: result
    });
    
  } catch (error: any) {
    diagnosticsResults.value.unshift({
      title: 'Ошибка теста авторизации',
      success: false,
      message: error.message,
      details: error
    });
  } finally {
    isRunning.value = false;
  }
};

// Инициализация
onMounted(() => {
  // Автоматический тест подключения при загрузке
  runDiagnostics();
});
</script>

<style scoped>
.diagnostics-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.diagnostics-card {
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

.status-section, .test-section, .results-section, .recommendations-section {
  padding: 30px;
  border-bottom: 1px solid #e9ecef;
}

.status-section h2, .test-section h2, .results-section h2, .recommendations-section h2 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.status-grid {
  display: grid;
  gap: 15px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
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

.status.unknown {
  color: #6c757d;
  font-weight: 600;
}

.value {
  font-family: monospace;
  color: #6c757d;
}

.test-controls {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
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

.test-btn.secondary {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
}

.test-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,123,255,0.3);
}

.test-btn:disabled {
  opacity: 0.6;
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

.credentials-form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-top: 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #495057;
}

.form-group input {
  width: 100%;
  padding: 10px 15px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.result-item {
  border-radius: 12px;
  padding: 20px;
  border-left: 4px solid;
}

.result-item.success {
  background: #d4edda;
  border-left-color: #28a745;
}

.result-item.error {
  background: #f8d7da;
  border-left-color: #dc3545;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.result-header .title {
  font-weight: 600;
  flex: 1;
}

.result-header .timing {
  font-size: 12px;
  opacity: 0.7;
  font-family: monospace;
}

.result-message {
  color: #495057;
  margin-bottom: 10px;
}

.result-details details {
  margin-top: 10px;
}

.result-details summary {
  cursor: pointer;
  font-weight: 600;
  color: #007bff;
}

.result-details pre {
  background: white;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  font-size: 12px;
  overflow-x: auto;
  margin-top: 10px;
}

.recommendations {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.recommendation {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid #007bff;
}

.recommendation strong {
  color: #2c3e50;
  display: block;
  margin-bottom: 10px;
}

.recommendation ul {
  margin: 0;
  padding-left: 20px;
}

.recommendation li {
  margin-bottom: 5px;
  color: #495057;
}

.recommendation code {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

@media (max-width: 768px) {
  .diagnostics-card {
    margin: 10px;
    border-radius: 12px;
  }
  
  .header, .status-section, .test-section, .results-section, .recommendations-section {
    padding: 20px;
  }
  
  .header h1 {
    font-size: 1.8em;
  }
  
  .test-controls {
    flex-direction: column;
  }
}
</style>
