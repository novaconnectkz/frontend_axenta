<template>
  <div class="create-user-page">
    <!-- Заголовок страницы -->
    <div class="page-header">
      <div class="page-title-section">
        <v-icon icon="mdi-account-plus" size="32" class="page-icon" />
        <div>
          <h1 class="page-title">Создание пользователя</h1>
          <p class="page-subtitle">Добавление нового пользователя в систему</p>
        </div>
      </div>

      <div class="page-actions">
        <AppleButton
          variant="secondary"
          prepend-icon="mdi-arrow-left"
          @click="goBack"
        >
          Назад
        </AppleButton>
      </div>
    </div>

    <!-- Форма создания пользователя -->
    <AppleCard class="form-card" variant="outlined">
      <v-form ref="formRef" v-model="formValid" @submit.prevent="handleSubmit">
        <div class="form-content">
          <!-- Основная информация -->
          <div class="form-section">
            <h3 class="section-title">
              <v-icon icon="mdi-account" class="mr-2" />
              Основная информация
            </h3>
            
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
          </div>

          <!-- Права доступа -->
          <div class="form-section">
            <h3 class="section-title">
              <v-icon icon="mdi-shield-account" class="mr-2" />
              Права доступа
            </h3>
            
            <v-row>
              <v-col cols="12">
                <v-switch
                  v-model="form.hasAdminAccess"
                  label="Административный доступ"
                  color="primary"
                  inset
                />
                <p class="text-caption text-medium-emphasis">
                  Предоставляет полный доступ ко всем функциям системы
                </p>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-combobox
                  v-model="form.visibleTabsNames"
                  :items="availableTabs"
                  label="Видимые вкладки"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="comfortable"
                  hint="Выберите вкладки, которые будут доступны пользователю"
                  persistent-hint
                />
              </v-col>
            </v-row>
          </div>

          <!-- Настройки доступа -->
          <div class="form-section">
            <h3 class="section-title">
              <v-icon icon="mdi-key" class="mr-2" />
              Настройки доступа
            </h3>
            
            <v-row>
              <v-col cols="12">
                <div class="access-builder">
                  <h4 class="access-title">Области доступа</h4>
                  <div class="access-items">
                    <div
                      v-for="(access, scope) in form.accesses"
                      :key="scope"
                      class="access-item"
                    >
                      <v-card variant="outlined" class="access-card">
                        <v-card-title class="access-scope">
                          {{ getScopeDisplayName(scope) }}
                        </v-card-title>
                        <v-card-text>
                          <v-chip-group
                            v-model="access.perms"
                            multiple
                            selected-class="text-primary"
                          >
                            <v-chip
                              v-for="perm in availablePermissions"
                              :key="perm.value"
                              :value="perm.value"
                              size="small"
                            >
                              {{ perm.label }}
                            </v-chip>
                          </v-chip-group>
                        </v-card-text>
                      </v-card>
                    </div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </div>
        </div>

        <!-- Кнопки действий -->
        <v-card-actions class="form-actions">
          <v-spacer />
          <AppleButton
            variant="secondary"
            @click="goBack"
            :disabled="submitting"
          >
            Отмена
          </AppleButton>
          <AppleButton
            type="submit"
            color="primary"
            :loading="submitting"
            :disabled="!formValid"
          >
            Создать пользователя
          </AppleButton>
        </v-card-actions>
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
  visibleTabsNames: ['monitoring', 'reports'],
  accesses: {
    objects: { perms: ['view'] },
    users: { perms: ['view'] },
    reports: { perms: ['view'] },
    monitoring: { perms: ['view'] }
  }
});

// Snackbar удален, используется глобальная система уведомлений

// Available options
const availableTabs = [
  'monitoring',
  'reports',
  'objects',
  'users',
  'installations',
  'warehouse',
  'billing',
  'settings'
];

const availablePermissions = [
  { value: 'view', label: 'Просмотр' },
  { value: 'edit', label: 'Редактирование' },
  { value: 'create', label: 'Создание' },
  { value: 'delete', label: 'Удаление' },
  { value: 'full', label: 'Полный доступ' }
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

// Computed
const getScopeDisplayName = (scope: string) => {
  const scopeNames: Record<string, string> = {
    objects: 'Объекты',
    users: 'Пользователи',
    reports: 'Отчеты',
    monitoring: 'Мониторинг',
    installations: 'Монтажи',
    warehouse: 'Склад',
    billing: 'Биллинг',
    settings: 'Настройки'
  };
  return scopeNames[scope] || scope;
};

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
      visibleTabsNames: form.visibleTabsNames,
      accesses: form.accesses
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
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-icon {
  color: rgb(var(--v-theme-primary));
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
}

.page-subtitle {
  font-size: 1rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 4px 0 0 0;
}

.page-actions {
  display: flex;
  gap: 12px;
}

.form-card {
  margin-bottom: 24px;
}

.form-content {
  padding: 24px;
}

.form-section {
  margin-bottom: 32px;
}

.form-section:last-of-type {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 20px;
  color: rgb(var(--v-theme-on-surface));
}

.access-builder {
  margin-top: 16px;
}

.access-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: rgb(var(--v-theme-on-surface));
}

.access-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.access-item {
  width: 100%;
}

.access-card {
  height: 100%;
}

.access-scope {
  font-size: 1rem;
  font-weight: 600;
  padding: 16px;
  color: rgb(var(--v-theme-primary));
}

.access-card .v-card-text {
  padding-top: 0;
}

.form-actions {
  padding: 24px;
  border-top: 1px solid rgb(var(--v-theme-outline-variant));
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .page-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .access-items {
    grid-template-columns: 1fr;
  }
}
</style>
