<template>
  <div style="padding: 20px; font-family: Arial, sans-serif;">
    <h1 style="color: #1976d2; text-align: center;">Axenta CRM - Диагностическая форма входа</h1>
    
    <div style="max-width: 400px; margin: 0 auto; background: #f5f5f5; padding: 20px; border-radius: 8px;">
      <form @submit.prevent="handleLogin">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Логин:</label>
          <input
            v-model="username"
            type="text"
            required
            placeholder="Введите ваш логин"
            style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;"
          />
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Пароль:</label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="Введите ваш пароль"
            style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;"
          />
        </div>
        
        <button
          type="submit"
          :disabled="isLoading || !username || !password"
          style="width: 100%; padding: 12px; background: #1976d2; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer;"
        >
          {{ isLoading ? 'Вход...' : 'Войти в систему' }}
        </button>
      </form>
      
      <div v-if="error" style="margin-top: 15px; padding: 10px; background: #ffebee; color: #c62828; border-radius: 4px;">
        <strong>Ошибка:</strong> {{ error }}
      </div>
      
      <div v-if="debugInfo" style="margin-top: 15px; padding: 10px; background: #e3f2fd; border-radius: 4px; font-size: 12px;">
        <strong>Отладочная информация:</strong><br>
        {{ debugInfo }}
      </div>
      
      <div style="margin-top: 20px; text-align: center; color: #666; font-size: 14px;">
        <p><strong>Backend:</strong> http://localhost:8080</p>
        <p><strong>Frontend:</strong> http://localhost:5173</p>
        <p><strong>Статус:</strong> {{ connectionStatus }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { config } from '@/config/env';
import axios from 'axios';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Форма
const username = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);
const debugInfo = ref('');

// Статус подключения
const connectionStatus = computed(() => {
  if (isLoading.value) return 'Подключение...';
  return 'Готов к подключению';
});

// Обработка входа
const handleLogin = async () => {
  if (!username.value || !password.value) {
    error.value = 'Заполните все поля';
    return;
  }

  isLoading.value = true;
  error.value = '';
  debugInfo.value = '';

  try {
    debugInfo.value = `Отправка запроса на ${config.apiBaseUrl}/api/auth/login...`;
    
    const response = await axios.post(`${config.apiBaseUrl}/api/auth/login`, {
      username: username.value,
      password: password.value
    });
    
    debugInfo.value += `\nОтвет получен: ${JSON.stringify(response.data, null, 2)}`;
    
    if (response.data.status === 'success') {
      // Сохраняем токен и пользователя
      localStorage.setItem('axenta_token', response.data.data.token);
      localStorage.setItem('axenta_user', JSON.stringify(response.data.data.user));
      
      if (response.data.data.company) {
        localStorage.setItem('axenta_company', JSON.stringify(response.data.data.company));
      }
      
      debugInfo.value += '\nВход выполнен успешно! Перенаправление...';
      
      // Переходим на дашборд
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
      
    } else {
      error.value = response.data.error || 'Ошибка входа';
    }
  } catch (err: any) {
    console.error('Login error:', err);
    error.value = err.response?.data?.error || `Ошибка подключения: ${err.message}`;
    debugInfo.value += `\nОшибка: ${err.message}`;
    
    if (err.response) {
      debugInfo.value += `\nСтатус: ${err.response.status}`;
      debugInfo.value += `\nДанные: ${JSON.stringify(err.response.data, null, 2)}`;
    }
  } finally {
    isLoading.value = false;
  }
};
</script>
