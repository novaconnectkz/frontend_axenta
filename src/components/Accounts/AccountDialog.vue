<template>
  <v-dialog
    v-model="show"
    max-width="800"
    persistent
  >
    <AppleCard>
      <template #header>
        <div class="dialog-header">
          <v-icon :icon="isEdit ? 'mdi-pencil' : 'mdi-plus'" class="dialog-icon" />
          <span>{{ isEdit ? 'Редактирование учетной записи' : 'Создание учетной записи' }}</span>
        </div>
      </template>
      
      <v-form ref="formRef" @submit.prevent="saveAccount">
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
        <div class="dialog-actions">
          <AppleButton
            variant="secondary"
            @click="closeDialog"
            :disabled="saving"
          >
            Отмена
          </AppleButton>
          
          <AppleButton
            @click="saveAccount"
            :loading="saving"
            :disabled="!isFormValid"
          >
            {{ isEdit ? 'Сохранить' : 'Создать' }}
          </AppleButton>
        </div>
      </template>
    </AppleCard>
  </v-dialog>
</template>

<script setup lang="ts">
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import AppleInput from '@/components/Apple/AppleInput.vue';
import accountsService from '@/services/accountsService';
import type { Account } from '@/services/accountsService';
import { computed, ref, watch } from 'vue';

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

// Props
interface Props {
  modelValue: boolean;
  account?: Account | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  account: null,
});

// Emits
interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved', account: Account): void;
  (e: 'error', message: string): void;
}

const emit = defineEmits<Emits>();

// Reactive data
const saving = ref(false);
const formRef = ref();

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

// Computed
const show = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const isEdit = computed(() => !!props.account);

// Проверяем, можно ли отправить форму
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

const fillForm = (account: Account) => {
  form.value = {
    name: account.name,
    type: account.type,
    comment: account.comment || '',
    blockingDatetime: account.blockingDatetime || '',
    adminId: account.adminId || null,
    admin: {
      name: account.adminFullname || '',
      username: '', // Не заполняем при редактировании
      email: account.contactEmail || '',
      password: '', // Пароль не заполняем при редактировании
      confirmPassword: '',
      visibleTabsNames: ['monitoring'],
    },
  };
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

const saveAccount = async () => {
  if (!validateForm()) {
    return;
  }
  
  try {
    saving.value = true;
    
    // Подготавливаем данные для API согласно документации
    const accountData = {
      name: form.value.name,
      type: form.value.type,
      comment: form.value.comment || null,
      blockingDatetime: form.value.blockingDatetime || null,
      adminId: form.value.adminId,
      admin: {
        name: form.value.admin.name,
        username: form.value.admin.username,
        email: form.value.admin.email,
        password: form.value.admin.password,
        confirmPassword: form.value.admin.confirmPassword,
        visibleTabsNames: form.value.admin.visibleTabsNames,
      },
    };
    
    const response = isEdit.value
      ? await accountsService.updateAccount(props.account!.id, accountData)
      : await accountsService.createAccount(accountData);
    
    if (response.status === 'success') {
      emit('saved', response.data);
      closeDialog();
    } else {
      emit('error', response.error || 'Ошибка сохранения учетной записи');
    }
  } catch (error: any) {
    console.error('Ошибка сохранения учетной записи:', error);
    emit('error', 'Ошибка сохранения учетной записи');
  } finally {
    saving.value = false;
  }
};

const closeDialog = () => {
  show.value = false;
  resetForm();
};

// Watchers
watch(() => props.account, (newAccount) => {
  if (newAccount) {
    fillForm(newAccount);
  } else {
    resetForm();
  }
}, { immediate: true });

watch(show, (newShow) => {
  if (!newShow) {
    resetForm();
  }
});

// Следим за изменением паролей для валидации
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
.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.dialog-icon {
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

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Адаптивность */
@media (max-width: 768px) {
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
}

/* Темная тема */
[data-theme="dark"] .form-section-title {
  border-bottom-color: rgba(84, 84, 136, 0.08);
  color: var(--text-primary);
}
</style>
