<template>
  <div class="create-account-page">
    <!-- Заголовок страницы -->
    <div class="page-header">
      <div class="page-title-section">
        <v-icon icon="mdi-domain-plus" size="32" class="page-icon" />
        <div>
          <h1 class="page-title">Создание учетной записи</h1>
          <p class="page-subtitle">Создание новой учетной записи и администратора</p>
        </div>
      </div>
      
      <div class="page-actions">
        <AppleButton
          variant="secondary"
          prepend-icon="mdi-arrow-left"
          @click="goBack"
        >
          Назад к списку
        </AppleButton>
      </div>
    </div>

    <!-- Форма создания -->
    <AppleCard class="create-form-card" variant="outlined">
      <template #header>
        <div class="form-header">
          <v-icon icon="mdi-account-plus" class="form-icon" />
          <span>Информация об учетной записи</span>
        </div>
      </template>
      
      <v-form ref="formRef" @submit.prevent="createAccount">
        <div class="form-content">
          <!-- Основная информация -->
          <div class="form-section">
            <h4 class="form-section-title">Основная информация</h4>
            
            <div class="form-row">
              <AppleInput
                v-model="form.name"
                label="Название учетной записи"
                placeholder="Введите название"
                required
                :error-message="errors.name"
                :error="!!errors.name"
                clearable
              />
              
              <v-select
                v-model="form.type"
                :items="typeOptions"
                label="Тип учетной записи"
                variant="outlined"
                density="comfortable"
                required
                :error-messages="errors.type"
              />
            </div>
            
            <div class="form-row">
              <AppleInput
                v-model="form.comment"
                label="Комментарий"
                placeholder="Введите комментарий"
                clearable
              />
              
              <AppleInput
                v-model="form.blockingDatetime"
                label="Дата блокировки"
                type="datetime-local"
                placeholder="Выберите дату блокировки"
                clearable
              />
            </div>
          </div>
          
          <!-- Секция администратора -->
          <div class="form-section">
            <h4 class="form-section-title">Данные администратора</h4>
            
            <div class="form-row">
              <AppleInput
                v-model="form.admin.name"
                label="Имя администратора"
                placeholder="Введите имя"
                required
                :error-message="errors['admin.name']"
                :error="!!errors['admin.name']"
                clearable
              />
              
              <AppleInput
                v-model="form.admin.username"
                label="Логин администратора"
                placeholder="Введите логин"
                required
                :error-message="errors['admin.username']"
                :error="!!errors['admin.username']"
                clearable
              />
            </div>
            
            <div class="form-row">
              <AppleInput
                v-model="form.admin.email"
                label="Email администратора"
                type="email"
                placeholder="admin@example.com"
                required
                :error-message="errors['admin.email']"
                :error="!!errors['admin.email']"
                clearable
              />
              
              <AppleInput
                v-model="form.adminId"
                label="ID администратора"
                type="number"
                placeholder="Введите ID администратора"
                clearable
              />
            </div>
            
            <div class="form-row">
              <AppleInput
                v-model="form.admin.password"
                label="Пароль администратора"
                type="password"
                placeholder="Введите пароль"
                required
                :error-message="errors['admin.password']"
                :error="!!errors['admin.password']"
                clearable
              />
              
              <AppleInput
                v-model="form.admin.confirmPassword"
                label="Подтверждение пароля"
                type="password"
                placeholder="Подтвердите пароль"
                required
                :error-message="errors['admin.confirmPassword']"
                :error="!!errors['admin.confirmPassword']"
                clearable
              />
            </div>
            
            <div class="form-row">
              <v-select
                v-model="form.admin.visibleTabsNames"
                :items="visibleTabsOptions"
                label="Видимые вкладки"
                variant="outlined"
                density="comfortable"
                multiple
                chips
                clearable
                :error-messages="errors['admin.visibleTabsNames']"
              />
            </div>
          </div>
        </div>
      </v-form>
      
      <template #footer>
        <div class="form-actions">
          <AppleButton
            variant="secondary"
            @click="goBack"
            :disabled="saving"
          >
            Отмена
          </AppleButton>
          
          <AppleButton
            @click="createAccount"
            :loading="saving"
            :disabled="!isFormValid"
            prepend-icon="mdi-check"
          >
            Создать учетную запись
          </AppleButton>
        </div>
      </template>
    </AppleCard>

    <!-- Snackbar для уведомлений -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="bottom right">
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Красивые уведомления об успехе -->
    <SuccessNotification
      v-model="successNotification.show"
      :title="successNotification.title"
      :message="successNotification.message"
      :details="successNotification.details"
      :icon="successNotification.icon"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import AppleInput from '@/components/Apple/AppleInput.vue';
import SuccessNotification from '@/components/Common/SuccessNotification.vue';
import accountsService from '@/services/accountsService';
import type { Account } from '@/services/accountsService';

// Router
const router = useRouter();

// Reactive data
const saving = ref(false);
const formRef = ref();

// Интерфейс для формы создания учетной записи
interface AccountForm {
  name: string;
  type: 'client' | 'partner';
  comment: string;
  blockingDatetime: string;
  adminId: number | null;
  admin: {
    name: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    visibleTabsNames: string[];
  };
}

const form = ref<AccountForm>({
  name: '',
  type: 'client',
  comment: '',
  blockingDatetime: '',
  adminId: null,
  admin: {
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    visibleTabsNames: ['monitoring'],
  },
});

const errors = ref<Record<string, string>>({});

// Snackbar для уведомлений
const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000
});

// Красивые уведомления об успехе
const successNotification = ref({
  show: false,
  title: '',
  message: '',
  details: '',
  icon: 'mdi-check-circle'
});

// Computed
const isFormValid = computed(() => {
  // Проверяем обязательные поля
  const hasRequiredFields = form.value.name.trim() && 
                           form.value.type && 
                           form.value.admin.name.trim() && 
                           form.value.admin.username.trim() && 
                           form.value.admin.email.trim() && 
                           form.value.admin.password.trim() &&
                           form.value.admin.confirmPassword.trim();
  
  // Проверяем совпадение паролей
  const passwordsMatch = form.value.admin.password === form.value.admin.confirmPassword;
  
  // Проверяем отсутствие ошибок
  const hasNoErrors = !Object.values(errors.value).some(error => error);
  
  return hasRequiredFields && passwordsMatch && hasNoErrors;
});

// Options
const typeOptions = [
  { title: 'Клиент', value: 'client' },
  { title: 'Партнер', value: 'partner' },
];

const visibleTabsOptions = [
  { title: 'Мониторинг', value: 'monitoring' },
  { title: 'Объекты', value: 'objects' },
  { title: 'Пользователи', value: 'users' },
  { title: 'Монтажи', value: 'installations' },
  { title: 'Склад', value: 'warehouse' },
  { title: 'Договоры', value: 'contracts' },
  { title: 'Биллинг', value: 'billing' },
  { title: 'Отчеты', value: 'reports' },
  { title: 'Настройки', value: 'settings' },
];

// Methods
const resetForm = () => {
  form.value = {
    name: '',
    type: 'client',
    comment: '',
    blockingDatetime: '',
    adminId: null,
    admin: {
      name: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      visibleTabsNames: ['monitoring'],
    },
  };
  errors.value = {};
};

const validateForm = (): boolean => {
  errors.value = {};
  
  if (!form.value.name.trim()) {
    errors.value.name = 'Название учетной записи обязательно';
    return false;
  }
  
  if (!form.value.type) {
    errors.value.type = 'Тип учетной записи обязателен';
    return false;
  }
  
  if (!form.value.admin.name.trim()) {
    errors.value['admin.name'] = 'Имя администратора обязательно';
    return false;
  }
  
  if (!form.value.admin.username.trim()) {
    errors.value['admin.username'] = 'Логин администратора обязателен';
    return false;
  }
  
  if (!form.value.admin.email.trim()) {
    errors.value['admin.email'] = 'Email администратора обязателен';
    return false;
  }
  
  if (!form.value.admin.password.trim()) {
    errors.value['admin.password'] = 'Пароль администратора обязателен';
    return false;
  }
  
  if (!form.value.admin.confirmPassword.trim()) {
    errors.value['admin.confirmPassword'] = 'Подтверждение пароля обязательно';
    return false;
  }
  
  if (form.value.admin.password !== form.value.admin.confirmPassword) {
    errors.value['admin.confirmPassword'] = 'Пароли не совпадают';
    return false;
  }
  
  return true;
};

const createAccount = async () => {
  if (!validateForm()) {
    return;
  }
  
  try {
    saving.value = true;
    
    // Подготавливаем данные для API
    const accountData: any = {
      name: form.value.name,
      type: form.value.type,
      comment: form.value.comment || null,
      blockingDatetime: form.value.blockingDatetime || null,
      admin: {
        name: form.value.admin.name,
        username: form.value.admin.username,
        email: form.value.admin.email,
        password: form.value.admin.password,
        confirmPassword: form.value.admin.confirmPassword,
        visibleTabsNames: form.value.admin.visibleTabsNames,
      },
    };

    // Добавляем adminId только если он указан
    if (form.value.adminId) {
      accountData.adminId = form.value.adminId;
    }
    
    const response = await accountsService.createAccount(accountData);
    
    if (response.status === 'success') {
      // Показываем уведомление об успехе
      successNotification.value = {
        show: true,
        title: 'Учетная запись создана',
        message: `Учетная запись "${form.value.name}" успешно создана`,
        details: `Тип: ${form.value.type === 'client' ? 'Клиент' : 'Партнер'}`,
        icon: 'mdi-check-circle'
      };
      
      // Сбрасываем форму
      resetForm();
      
      // Через 2 секунды перенаправляем на страницу списка
      setTimeout(() => {
        router.push('/accounts');
      }, 2000);
    } else {
      showSnackbar(response.error || 'Ошибка создания учетной записи', 'error');
    }
  } catch (error: any) {
    console.error('Ошибка создания учетной записи:', error);
    showSnackbar('Ошибка создания учетной записи', 'error');
  } finally {
    saving.value = false;
  }
};

const goBack = () => {
  router.push('/accounts');
};

const showSnackbar = (text: string, color: string = 'info') => {
  snackbar.value.text = text;
  snackbar.value.color = color;
  snackbar.value.show = true;
};

// Следим за изменением паролей для валидации
import { watch } from 'vue';

watch([() => form.value.admin.password, () => form.value.admin.confirmPassword], () => {
  if (form.value.admin.password && form.value.admin.confirmPassword) {
    if (form.value.admin.password !== form.value.admin.confirmPassword) {
      errors.value['admin.confirmPassword'] = 'Пароли не совпадают';
    } else {
      delete errors.value['admin.confirmPassword'];
    }
  }
});
</script>

<style scoped>
.create-account-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
  gap: 24px;
}

.page-title-section {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
}

.page-icon {
  color: var(--color-primary);
  margin-top: 4px;
}

.page-title {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.page-subtitle {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.page-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.create-form-card {
  max-width: 800px;
  margin: 0 auto;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.form-icon {
  color: var(--color-primary);
}

.form-content {
  padding: 0;
}

.form-section {
  margin-bottom: 32px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-section-title {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(60, 60, 67, 0.08);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-row:last-child {
  margin-bottom: 0;
}

/* Для полей, которые должны занимать всю ширину */
.form-row:has(.v-select) {
  grid-template-columns: 1fr;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Адаптивность */
@media (max-width: 768px) {
  .create-account-page {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .page-subtitle {
    font-size: 14px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .form-section {
    margin-bottom: 24px;
  }
  
  .form-section-title {
    font-size: 15px;
    margin-bottom: 12px;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
}

/* Темная тема */
[data-theme="dark"] .form-section-title {
  border-bottom-color: rgba(84, 84, 136, 0.08);
  color: var(--text-primary);
}
</style>
