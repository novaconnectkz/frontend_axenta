<template>
  <div class="status-container">
    <div class="status-card">
      <h1>✅ Статус исправлений</h1>
      
      <div class="status-list">
        <div class="status-item success">
          <span class="icon">✅</span>
          <span class="text">Синтаксические ошибки исправлены</span>
        </div>
        
        <div class="status-item success">
          <span class="icon">✅</span>
          <span class="text">Конфигурация обновлена на https://axenta.cloud</span>
        </div>
        
        <div class="status-item success">
          <span class="icon">✅</span>
          <span class="text">Retry механизм добавлен</span>
        </div>
        
        <div class="status-item success">
          <span class="icon">✅</span>
          <span class="text">Улучшена обработка ошибок</span>
        </div>
      </div>

      <div class="config-display">
        <h2>📋 Текущая конфигурация</h2>
        <div class="config-item">
          <strong>Backend URL:</strong> {{ config.backendUrl }}
        </div>
        <div class="config-item">
          <strong>API Base URL:</strong> {{ config.apiBaseUrl }}
        </div>
        <div class="config-item">
          <strong>WebSocket URL:</strong> {{ config.wsBaseUrl }}
        </div>
      </div>

      <div class="actions">
        <button @click="goToLogin" class="action-btn primary">
          🔐 Перейти к авторизации
        </button>
        <button @click="goToDiagnostics" class="action-btn secondary">
          🔧 Открыть диагностику
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { config } from '@/config/env';

const router = useRouter();

const goToLogin = () => {
  router.push('/login');
};

const goToDiagnostics = () => {
  router.push('/axenta-diagnostics');
};
</script>

<style scoped>
.status-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  padding: 20px;
}

.status-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  text-align: center;
}

.status-card h1 {
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 2.5em;
  font-weight: 300;
}

.status-list {
  margin-bottom: 30px;
}

.status-item {
  display: flex;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  text-align: left;
}

.status-item.success {
  background: #d4edda;
  color: #155724;
}

.status-item .icon {
  margin-right: 15px;
  font-size: 1.2em;
}

.status-item .text {
  font-weight: 500;
}

.config-display {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  text-align: left;
}

.config-display h2 {
  color: #2c3e50;
  margin-bottom: 15px;
  text-align: center;
}

.config-item {
  margin-bottom: 10px;
  font-family: monospace;
  font-size: 14px;
  padding: 8px;
  background: white;
  border-radius: 6px;
}

.config-item strong {
  color: #495057;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.action-btn {
  padding: 15px 30px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn.primary {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
}

.action-btn.secondary {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.2);
}

@media (max-width: 768px) {
  .status-card {
    padding: 30px 20px;
  }
  
  .status-card h1 {
    font-size: 2em;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>
