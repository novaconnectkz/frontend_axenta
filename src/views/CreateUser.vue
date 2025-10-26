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
              <v-autocomplete
                v-model="form.accountId"
                :items="accountOptions"
                item-title="displayName"
                item-value="id"
                label="Учетная запись"
                placeholder="Начните вводить название или ID..."
                variant="outlined"
                density="comfortable"
                :loading="loadingAccounts"
                :rules="accountRules"
                required
                clearable
                :search="searchQuery"
                @update:search="searchQuery = $event"
                :filter="filterAccounts"
                no-data-text="Учетные записи не найдены"
                loading-text="Загрузка учетных записей..."
                :menu-props="{ maxHeight: 300 }"
                hide-no-data
                auto-select-first
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #title>
                      <span class="font-weight-medium">{{ item.raw.name }}</span>
                    </template>
                    <template #subtitle>
                      <span class="text-caption text-grey-600">Admin ID: {{ item.raw.adminId }}</span>
                      <span v-if="item.raw.type" class="text-caption text-grey-500 ml-2">
                        • {{ item.raw.type === 'client' ? 'Клиент' : item.raw.type === 'partner' ? 'Партнер' : item.raw.type }}
                      </span>
                    </template>
                  </v-list-item>
                </template>
                <template #selection="{ item }">
                  <span class="font-weight-medium">{{ item.raw.name }}</span>
                  <span class="text-caption text-grey-600 ml-2">(Admin ID: {{ item.raw.adminId }})</span>
                </template>
              </v-autocomplete>
              
              <!-- Информационное сообщение о создании пользователя -->
              <v-alert
                type="info"
                variant="tonal"
                density="compact"
                class="mt-2"
                :text="true"
              >
                <template #text>
                  <div class="text-caption">
                    <strong>Информация:</strong> Пользователь будет создан в выбранной учетной записи 
                    с использованием токена администратора этой учетной записи.
                  </div>
                </template>
              </v-alert>
              
              <!-- Информация о количестве загруженных учетных записей -->
              <div v-if="!loadingAccounts && accountOptions.length > 0" class="text-caption text-grey-600 mt-1">
                Загружено {{ accountOptions.length }} из {{ totalAccountsCount || accountOptions.length }} учетных записей
                <v-btn 
                  v-if="totalAccountsCount > accountOptions.length" 
                  variant="text" 
                  size="x-small" 
                  color="primary"
                  @click="loadMoreAccounts"
                  :loading="loadingAccounts"
                  class="ml-2"
                >
                  Загрузить еще
                </v-btn>
              </div>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-switch
                v-model="form.hasAdminAccess"
                label="Административный доступ"
                color="primary"
                density="comfortable"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
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
import { ref, reactive, onMounted } from 'vue';
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
  accountId: null,
  hasAdminAccess: false,
  visibleTabsNames: ['monitoring', 'reports']
});

// Snackbar удален, используется глобальная система уведомлений

// Account options
const accountOptions = ref([]);
const loadingAccounts = ref(false);
const searchQuery = ref('');
const totalAccountsCount = ref(0);

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

const accountRules = [
  (v: any) => !!v || 'Учетная запись обязательна для выбора'
];


// Methods
const goBack = () => {
  router.push('/users');
};

// Загрузка учетных записей
const loadAccounts = async () => {
  loadingAccounts.value = true;
  try {
    // Для CMS endpoints нужен токен Axenta Cloud
    const token = localStorage.getItem('axenta_token');
    if (!token) {
      throw new Error('Токен Axenta Cloud не найден. Необходимо авторизоваться через Axenta Cloud.');
    }

    let allAccounts = [];
    let page = 1;
    let hasMore = true;
    const perPage = 100; // Максимальное количество записей на страницу
    const maxPages = 50; // Максимальное количество страниц для предотвращения бесконечных циклов

    // Загружаем все страницы с учетными записями
    while (hasMore && page <= maxPages) {
      const response = await fetch(`${config.apiBaseUrl}/auth/accounts?page=${page}&per_page=${perPage}&ordering=name`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        if (data.results && data.results.length > 0) {
          allAccounts = allAccounts.concat(data.results);
          
          // Сохраняем общее количество учетных записей
          if (data.count) {
            totalAccountsCount.value = data.count;
          }
          
          // Проверяем, есть ли еще страницы
          hasMore = data.next !== null && data.next !== undefined;
          page++;
          
          // Логируем прогресс загрузки
          console.log(`📋 Загружено ${allAccounts.length} из ${data.count || 'неизвестно'} учетных записей`);
        } else {
          hasMore = false;
        }
      } else {
        throw new Error(data.error || 'Ошибка загрузки учетных записей');
      }
    }

    // Добавляем поле displayName для удобного отображения и поиска
    accountOptions.value = allAccounts.map(account => ({
      ...account,
      displayName: `${account.name} (ID: ${account.id})`
    }));

    console.log(`✅ Всего загружено ${accountOptions.value.length} учетных записей`);
    
    // Предупреждаем, если не все записи загружены
    if (totalAccountsCount.value > 0 && accountOptions.value.length < totalAccountsCount.value) {
      console.warn(`⚠️ Загружено не все учетные записи: ${accountOptions.value.length} из ${totalAccountsCount.value}`);
      notifications.showWarning(
        'Не все учетные записи загружены', 
        `Загружено ${accountOptions.value.length} из ${totalAccountsCount.value} учетных записей. Используйте поиск для навигации.`
      );
    }
    
  } catch (error: any) {
    console.error('Ошибка загрузки учетных записей:', error);
    notifications.showError('Ошибка загрузки учетных записей', error.message);
  } finally {
    loadingAccounts.value = false;
  }
};

// Функция для получения токена пользователя CMS
const getUserCmsToken = async (adminId: number): Promise<string> => {
  try {
    console.log('🔐 Получение токена пользователя CMS для администратора:', adminId);
    
    // Получаем текущий токен для авторизации
    const currentToken = localStorage.getItem('axenta_token');
    
    if (!currentToken) {
      throw new Error('Токен Axenta Cloud не найден. Необходимо авторизоваться через Axenta Cloud.');
    }

    // Отправляем запрос на получение токена пользователя CMS
    const response = await fetch(`${config.apiBaseUrl}/cms/users/login_as/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${currentToken}`
      },
      body: JSON.stringify({
        userId: adminId,
        type: 'monitoring'
      })
    });

    const data = await response.json();

    if (response.ok && data.data && data.data.redirectUrl) {
      // Извлекаем токен из URL
      const url = new URL(data.data.redirectUrl);
      const token = url.searchParams.get('authToken');
      
      if (token) {
        console.log('✅ Получен токен пользователя CMS');
        return token;
      } else {
        throw new Error('Токен не найден в URL перенаправления');
      }
    } else {
      throw new Error(data.error || data.message || 'Ошибка получения токена пользователя CMS');
    }
  } catch (error: any) {
    console.error('❌ Ошибка получения токена пользователя CMS:', error);
    throw error;
  }
};

// Функция для загрузки дополнительных учетных записей
const loadMoreAccounts = async () => {
  if (loadingAccounts.value) return;
  
  loadingAccounts.value = true;
  try {
    // Для CMS endpoints нужен токен Axenta Cloud
    const token = localStorage.getItem('axenta_token');
    if (!token) {
      throw new Error('Токен Axenta Cloud не найден. Необходимо авторизоваться через Axenta Cloud.');
    }

    const currentPage = Math.floor(accountOptions.value.length / 100) + 1;
    const response = await fetch(`${config.apiBaseUrl}/auth/accounts?page=${currentPage}&per_page=100&ordering=name`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      }
    });

    const data = await response.json();

    if (response.ok && data.results && data.results.length > 0) {
      const newAccounts = data.results.map(account => ({
        ...account,
        displayName: `${account.name} (ID: ${account.id})`
      }));
      
      accountOptions.value = accountOptions.value.concat(newAccounts);
      
      if (data.count) {
        totalAccountsCount.value = data.count;
      }
      
      console.log(`📋 Дополнительно загружено ${newAccounts.length} учетных записей. Всего: ${accountOptions.value.length}`);
    }
  } catch (error: any) {
    console.error('Ошибка загрузки дополнительных учетных записей:', error);
    notifications.showError('Ошибка загрузки', error.message);
  } finally {
    loadingAccounts.value = false;
  }
};

// Функция фильтрации учетных записей для поиска
const filterAccounts = (value: string, query: string) => {
  if (!query) return true;
  
  const searchTerm = query.toLowerCase();
  
  // Поиск по названию учетной записи
  if (value.name && value.name.toLowerCase().includes(searchTerm)) {
    return true;
  }
  
  // Поиск по ID учетной записи
  if (value.id && value.id.toString().includes(searchTerm)) {
    return true;
  }
  
  // Поиск по Admin ID
  if (value.adminId && value.adminId.toString().includes(searchTerm)) {
    return true;
  }
  
  // Поиск по типу учетной записи
  if (value.type) {
    const typeText = value.type === 'client' ? 'клиент' : 
                    value.type === 'partner' ? 'партнер' : 
                    value.type.toLowerCase();
    if (typeText.includes(searchTerm)) {
      return true;
    }
  }
  
  // Поиск по displayName (название + ID)
  if (value.displayName && value.displayName.toLowerCase().includes(searchTerm)) {
    return true;
  }
  
  return false;
};

// Удаляем старую функцию showSnackbar, используем новую систему уведомлений

const handleSubmit = async () => {
  if (!formValid.value) {
    notifications.showValidationError('Пожалуйста, исправьте ошибки в форме');
    return;
  }

  submitting.value = true;

  try {
    // Находим выбранную учетную запись
    const selectedAccount = accountOptions.value.find(acc => acc.id === form.accountId);
    if (!selectedAccount) {
      notifications.showError('Ошибка', 'Выбранная учетная запись не найдена');
      return;
    }

    console.log('🔍 Выбранная учетная запись:', selectedAccount);
    console.log('🔍 Admin ID для получения токена:', selectedAccount.adminId);

    // Получаем токен администратора выбранной учетной записи
    console.log('🔐 Получение токена администратора для учетной записи:', selectedAccount.name);
    const adminToken = await getUserCmsToken(selectedAccount.adminId);
    
    console.log('🔐 Получен токен администратора:', adminToken ? 'EXISTS' : 'MISSING');
    console.log('🔐 Токен администратора (первые 20 символов):', adminToken ? adminToken.substring(0, 20) + '...' : 'NONE');

    // Подготавливаем данные для отправки с правильной структурой
    const requestData = {
      name: form.name,
      username: form.username,
      email: form.email,
      password: form.password,
      confirmPassword: form.password, // Добавляем confirmPassword
      language: "ru", // Добавляем language
      timezone: 3, // Добавляем timezone
      visibleTabsNames: form.visibleTabsNames,
      accesses: {
        common: {}
      }
      // Убираем hasAdminAccess, так как оно вызывает ошибку
    };

            // Используем токен администратора для создания нового пользователя
            console.log('📡 Отправляем запрос на создание пользователя с токеном администратора:', {
              url: `${config.apiBaseUrl}/users/`,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${adminToken.substring(0, 20)}...`
              },
              data: requestData
            });
            
            const response = await fetch(`${config.apiBaseUrl}/users/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${adminToken}`
              },
              body: JSON.stringify(requestData)
            });

    const data = await response.json();

    console.log('📡 Ответ сервера:', {
      status: response.status,
      statusText: response.statusText,
      data: data
    });

    if (response.ok) {
      // Успешное создание
      notifications.showSuccess(
        'Пользователь создан',
        `Пользователь успешно создан! ID: ${data.id}, Учетная запись: ${data.accountName}`
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

// Загружаем учетные записи при монтировании компонента
onMounted(() => {
  loadAccounts();
});
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
