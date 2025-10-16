<template>
  <div class="create-user-page">
    <!-- Заголовок страницы -->
    <div class="page-header">
      <div class="page-title-section">
        <v-icon icon="mdi-account-plus" size="24" class="page-icon" />
        <h1 class="page-title">Создание пользователя</h1>
      </div>

      <AppleButton
        variant="secondary"
        prepend-icon="mdi-arrow-left"
        @click="goBack"
        size="small"
      >
        Назад
      </AppleButton>
    </div>

    <!-- Форма создания пользователя -->
    <AppleCard class="form-card" variant="outlined">
      <v-form ref="formRef" v-model="formValid" @submit.prevent="handleSubmit">
        <div class="form-content">
          <v-row>
            <v-col cols="12" md="6">
              <AppleInput
                v-model="form.name"
                label="Полное имя"
                placeholder="Введите полное имя"
                :rules="nameRules"
                required
                clearable
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <AppleInput
                v-model="form.username"
                label="Имя пользователя"
                placeholder="Введите имя пользователя"
                :rules="usernameRules"
                required
                clearable
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" md="6">
              <AppleInput
                v-model="form.email"
                label="Email"
                type="email"
                placeholder="user@example.com"
                :rules="emailRules"
                required
                clearable
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <AppleInput
                v-model="form.password"
                label="Пароль"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Введите пароль"
                :rules="passwordRules"
                required
                clearable
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" md="6">
              <v-switch
                v-model="form.hasAdminAccess"
                label="Административный доступ"
                color="primary"
                density="comfortable"
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="form.visibleTabsNames"
                :items="availableTabs"
                item-title="title"
                item-value="value"
                label="Видимые вкладки"
                multiple
                chips
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>
        </div>

        <!-- Кнопки действий -->
        <div class="form-actions">
          <AppleButton
            variant="secondary"
            @click="goBack"
            :disabled="submitting"
            size="small"
          >
            Отмена
          </AppleButton>
          <AppleButton
            type="submit"
            color="primary"
            :loading="submitting"
            :disabled="!formValid"
            size="small"
          >
            Создать
          </AppleButton>
        </div>
      </v-form>
    </AppleCard>

    <!-- Уведомления теперь обрабатываются глобальной системой -->
  </div>
</template>

<script setup lang="ts">
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import AppleInput from '@/components/Apple/AppleInput.vue';
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { config } from '@/config/env';
import { useNotifications } from '@/composables/useNotifications';
import { errorHandler } from '@/utils/errorHandler';

// Router
const router = useRouter();

// Notifications
const notifications = useNotifications();

// Refs
const formRef = ref();
const formValid = ref(false);
const submitting = ref(false);
const showPassword = ref(false);

// Form data
const form = reactive({
  name: '',
  username: '',
  email: '',
  password: '',
  hasAdminAccess: false,
  visibleTabsNames: ['monitoring', 'reports']
});

// Snackbar удален, используется глобальная система уведомлений

// Available options
const availableTabs = [
  { title: 'Мониторинг', value: 'monitoring' },
  { title: 'Треки', value: 'tracks' },
  { title: 'Отчеты', value: 'reports' },
  { title: 'Сообщения', value: 'messages' },
  { title: 'Уведомления', value: 'notifications' },
  { title: 'Геозоны', value: 'geofences' },
  { title: 'Водители', value: 'drivers' },
  { title: 'Прицепы', value: 'trailers' },
  { title: 'Объекты', value: 'objects' },
  { title: 'Пользователи', value: 'users' },
  { title: 'Здания', value: 'buildings' },
  { title: 'Устройства', value: 'devices' }
];


// Validation rules
const nameRules = [
  (v: string) => !!v || 'Имя обязательно для заполнения',
  (v: string) => v.length >= 2 || 'Имя должно содержать минимум 2 символа',
  (v: string) => v.length <= 100 || 'Имя не должно превышать 100 символов'
];

const usernameRules = [
  (v: string) => !!v || 'Имя пользователя обязательно',
  (v: string) => v.length >= 3 || 'Минимум 3 символа',
  (v: string) => v.length <= 50 || 'Максимум 50 символов',
  (v: string) => /^[a-zA-Z0-9_.-]+$/.test(v) || 'Только латинские буквы, цифры, точки, дефисы и подчеркивания'
];

const emailRules = [
  (v: string) => !!v || 'Email обязателен',
  (v: string) => /.+@.+\..+/.test(v) || 'Некорректный формат email'
];

const passwordRules = [
  (v: string) => !!v || 'Пароль обязателен',
  (v: string) => v.length >= 6 || 'Пароль должен содержать минимум 6 символов'
];


// Methods
const goBack = () => {
  router.push('/users');
};

// Удаляем старую функцию showSnackbar, используем новую систему уведомлений

const handleSubmit = async () => {
  if (!formValid.value) {
    notifications.showValidationError('Пожалуйста, исправьте ошибки в форме');
    return;
  }

  submitting.value = true;

  try {
    // Подготавливаем данные для отправки
    const requestData = {
      name: form.name,
      username: form.username,
      email: form.email,
      password: form.password,
      hasAdminAccess: form.hasAdminAccess,
      visibleTabsNames: form.visibleTabsNames
    };

    // Получаем токен из localStorage
    const token = localStorage.getItem('axenta_token');
    if (!token) {
      throw new Error('Токен авторизации не найден');
    }

    // Отправляем запрос
    const response = await fetch(`${config.apiBaseUrl}/cms/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify(requestData)
    });

    const data = await response.json();

    if (response.ok) {
      // Успешное создание
      notifications.showSuccess(
        'Пользователь создан',
        `Пользователь успешно создан! ID: ${data.id}`
      );
      
      // Перенаправляем на страницу пользователей через 2 секунды
      setTimeout(() => {
        router.push('/users');
      }, 2000);
    } else {
      // Ошибка от сервера - используем обработчик ошибок
      const apiError = {
        response: {
          status: response.status,
          data: data
        }
      };
      errorHandler.handleApiError(apiError, 'создание пользователя');
    }
  } catch (error: any) {
    // Обрабатываем ошибку через универсальный обработчик
    errorHandler.handleApiError(error, 'создание пользователя');
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.create-user-page {
  padding: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-icon {
  color: rgb(var(--v-theme-primary));
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
}

.form-card {
  margin-bottom: 16px;
}

.form-content {
  padding: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid rgb(var(--v-theme-outline-variant));
  background-color: rgb(var(--v-theme-surface-variant));
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .create-user-page {
    padding: 12px;
  }
}
</style>
