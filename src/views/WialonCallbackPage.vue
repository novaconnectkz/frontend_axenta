<template>
  <div class="wialon-callback-page">
    <v-container class="fill-height">
      <v-row justify="center" align="center">
        <v-col cols="12" sm="8" md="6" lg="4">
          <v-card class="pa-6 text-center" elevation="8">
            <v-icon v-if="status === 'success'" color="success" size="64" class="mb-4">
              mdi-check-circle
            </v-icon>
            <v-icon v-else-if="status === 'error'" color="error" size="64" class="mb-4">
              mdi-alert-circle
            </v-icon>
            <v-progress-circular v-else indeterminate color="primary" size="64" class="mb-4" />
            
            <h2 class="text-h5 mb-4">{{ title }}</h2>
            <p class="text-body-1 text-medium-emphasis mb-4">{{ message }}</p>
            
            <v-alert v-if="token" type="success" variant="tonal" class="mb-4 text-left">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-caption text-medium-emphasis">Токен (72 символа):</div>
                  <code class="text-caption">{{ token.substring(0, 20) }}...{{ token.substring(token.length - 8) }}</code>
                </div>
                <v-btn icon variant="text" @click="copyToken" color="primary">
                  <v-icon>mdi-content-copy</v-icon>
                </v-btn>
              </div>
            </v-alert>
            
            <v-btn v-if="status !== 'loading'" color="primary" @click="closeWindow" class="mt-2">
              Закрыть окно
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const status = ref<'loading' | 'success' | 'error'>('loading');
const title = ref('Обработка авторизации...');
const message = ref('Пожалуйста, подождите');
const token = ref('');

const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
});

const showSnackbar = (text: string, color: string = 'info') => {
  snackbar.value = { show: true, text, color };
};

const copyToken = async () => {
  try {
    await navigator.clipboard.writeText(token.value);
    showSnackbar('Токен скопирован! Вставьте его в поле токена.', 'success');
  } catch (error) {
    showSnackbar('Ошибка копирования', 'error');
  }
};

const closeWindow = () => {
  window.close();
  // Если окно не закрылось (например, открыто не через window.open)
  setTimeout(() => {
    window.location.href = '/settings';
  }, 500);
};

onMounted(() => {
  // Парсим параметры URL
  const urlParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  
  // Wialon возвращает токен в hash (#access_token=...)
  let accessToken = urlParams.get('access_token');
  
  if (!accessToken && hash) {
    const hashParams = new URLSearchParams(hash.substring(1));
    accessToken = hashParams.get('access_token');
  }
  
  // Проверяем наличие ошибки
  const error = urlParams.get('error');
  const errorDescription = urlParams.get('error_description');
  
  if (error) {
    status.value = 'error';
    title.value = 'Ошибка авторизации';
    message.value = errorDescription || 'Не удалось получить токен. Попробуйте снова.';
    return;
  }
  
  if (accessToken) {
    status.value = 'success';
    title.value = 'Авторизация успешна!';
    message.value = 'Токен автоматически вставлен в форму настроек.';
    token.value = accessToken;
    
    // Отправляем токен в родительское окно
    if (window.opener) {
      window.opener.postMessage(
        { type: 'wialon_token', token: accessToken },
        window.location.origin
      );
      
      // Автоматически закрываем окно через 2 секунды
      setTimeout(() => {
        window.close();
      }, 2000);
    }
    
    // Также копируем в буфер обмена на всякий случай
    navigator.clipboard.writeText(accessToken)
      .then(() => showSnackbar('Токен отправлен в форму и скопирован!', 'success'))
      .catch(() => {});
  } else {
    status.value = 'error';
    title.value = 'Токен не получен';
    message.value = 'Wialon не вернул токен авторизации. Попробуйте снова.';
  }
});
</script>

<style scoped>
.wialon-callback-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
