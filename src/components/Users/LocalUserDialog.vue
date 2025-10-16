<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <AppleCard>
      <template #title>
        <div class="dialog-header">
          <v-icon icon="mdi-account-plus" class="dialog-icon" />
          <span>Создание локального пользователя</span>
        </div>
      </template>

      <v-form ref="formRef" v-model="formValid" @submit.prevent="handleSubmit">
        <div class="form-content">
          <div class="form-row">
            <AppleInput
              v-model="form.username"
              label="Имя пользователя"
              :rules="[rules.required, rules.username, rules.usernameAvailability]"
              :error-message="usernameError"
              :error="!!usernameError"
              :loading="checkingUsername"
              required
              clearable
              @blur="checkUsernameAvailability"
            />
            
            <AppleInput
              v-model="form.email"
              label="Email"
              type="email"
              :rules="[rules.required, rules.email]"
              required
              clearable
            />
          </div>

          <div class="form-row">
            <AppleInput
              v-model="form.first_name"
              label="Имя"
              :rules="[rules.required]"
              required
              clearable
            />
            
            <AppleInput
              v-model="form.last_name"
              label="Фамилия"
              :rules="[rules.required]"
              required
              clearable
            />
          </div>

          <div class="form-row">
            <AppleInput
              v-model="form.phone"
              label="Телефон"
              placeholder="+7 (900) 123-45-67"
              clearable
            />
            
            <v-select
              v-model="form.role_id"
              :items="roleOptions"
              label="Роль"
              :rules="[rules.required]"
              required
              variant="outlined"
              density="comfortable"
              :loading="loadingRoles"
            />
          </div>

          <div class="form-row">
            <AppleInput
              v-model="form.password"
              label="Пароль"
              type="password"
              :rules="[rules.required, rules.password]"
              required
              clearable
            >
              <template #append-inner>
                <v-tooltip text="Сгенерировать пароль">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-dice-5"
                      size="small"
                      variant="text"
                      @click="generatePassword"
                    />
                  </template>
                </v-tooltip>
              </template>
            </AppleInput>
          </div>

          <!-- Информация о локальном пользователе -->
          <v-alert
            type="info"
            variant="tonal"
            class="info-alert"
          >
            <div class="alert-content">
              <v-icon icon="mdi-information" />
              <div>
                <strong>Локальный пользователь</strong><br>
                Пользователь будет создан в локальной системе и не будет синхронизирован с Axenta.
                Для входа используется логин и пароль.
              </div>
            </div>
          </v-alert>
        </div>
      </v-form>

      <template #actions>
        <div class="dialog-actions">
          <AppleButton
            variant="outlined"
            @click="handleCancel"
            :disabled="loading"
          >
            Отмена
          </AppleButton>
          
          <AppleButton
            @click="handleSubmit"
            :loading="loading"
            :disabled="!formValid"
          >
            Создать пользователя
          </AppleButton>
        </div>
      </template>
    </AppleCard>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import AppleInput from '@/components/Apple/AppleInput.vue';
import axentaUsersService from '@/services/axentaUsersService';
import usersService from '@/services/usersService';
import type { LocalUserForm, Role } from '@/types/users';

// Props
const props = defineProps<{
  modelValue: boolean;
}>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  success: [message: string];
  error: [message: string];
}>();

// Reactive data
const loading = ref(false);
const loadingRoles = ref(false);
const formValid = ref(false);
const formRef = ref();
const roles = ref<Role[]>([]);
const usernameError = ref('');
const checkingUsername = ref(false);

const form = ref<LocalUserForm>({
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  phone: '',
  role_id: 0,
});

// Computed
const dialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const roleOptions = computed(() => 
  roles.value.map(role => ({
    title: role.display_name,
    value: role.id,
    subtitle: role.description,
  }))
);

// Validation rules
const rules = {
  required: (value: any) => !!value || 'Поле обязательно для заполнения',
  email: (value: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value) || 'Некорректный email адрес';
  },
  username: (value: string) => {
    if (value.length < 3) return 'Минимум 3 символа';
    if (value.length > 50) return 'Максимум 50 символов';
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Только латинские буквы, цифры, _ и -';
    return true;
  },
  usernameAvailability: () => {
    if (usernameError.value) return usernameError.value;
    return true;
  },
  password: (value: string) => {
    if (value.length < 6) return 'Минимум 6 символов';
    if (value.length > 128) return 'Максимум 128 символов';
    return true;
  },
};

// Methods
const checkUsernameAvailability = async () => {
  const username = form.value.username.trim();
  
  // Сбрасываем ошибку при пустом поле
  if (!username) {
    usernameError.value = '';
    return;
  }
  
  // Проверяем базовые правила валидации
  if (username.length < 3 || username.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(username)) {
    return; // Базовые правила уже обработаны в rules.username
  }
  
  checkingUsername.value = true;
  usernameError.value = '';
  
  try {
    const response = await axentaUsersService.checkUsername(username);
    
    if (response.status === 'success' && response.data) {
      if (!response.data.available) {
        usernameError.value = response.data.message;
      } else {
        usernameError.value = '';
      }
    } else {
      console.error('Ошибка проверки имени пользователя:', response.error);
      // Не показываем ошибку пользователю, если сервер недоступен
    }
  } catch (error: any) {
    console.error('Ошибка проверки имени пользователя:', error);
    // Не показываем ошибку пользователю, если сервер недоступен
  } finally {
    checkingUsername.value = false;
  }
};

const loadRoles = async () => {
  loadingRoles.value = true;
  try {
    const response = await usersService.getRoles(1, 100, { active_only: true });
    if (response.status === 'success') {
      roles.value = response.data.items;
      
      // Выбираем роль "user" по умолчанию
      const userRole = roles.value.find(role => role.name === 'user');
      if (userRole && !form.value.role_id) {
        form.value.role_id = userRole.id;
      }
    }
  } catch (error: any) {
    console.error('Ошибка загрузки ролей:', error);
  } finally {
    loadingRoles.value = false;
  }
};

const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  form.value.password = password;
};

const resetForm = () => {
  form.value = {
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role_id: 0,
  };
  
  // Сбрасываем ошибку имени пользователя
  usernameError.value = '';
  
  // Выбираем роль "user" по умолчанию
  const userRole = roles.value.find(role => role.name === 'user');
  if (userRole) {
    form.value.role_id = userRole.id;
  }
  
  formRef.value?.resetValidation();
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    const response = await axentaUsersService.createLocalUser(form.value);
    
    if (response.status === 'success') {
      emit('success', 'Локальный пользователь успешно создан');
      dialog.value = false;
      resetForm();
    } else {
      emit('error', response.error || 'Ошибка создания пользователя');
    }
  } catch (error: any) {
    console.error('Ошибка создания пользователя:', error);
    emit('error', 'Ошибка создания пользователя');
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  dialog.value = false;
  resetForm();
};

// Watchers
watch(dialog, (newValue) => {
  if (newValue) {
    loadRoles();
    resetForm();
  }
});
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.25rem;
  font-weight: 600;
}

.dialog-icon {
  color: var(--primary-color);
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}

.form-row:last-child {
  grid-template-columns: 1fr;
}

.info-alert {
  margin-top: 16px;
}

.alert-content {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 0 0 0;
}

/* Responsive */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .dialog-actions {
    flex-direction: column-reverse;
    gap: 8px;
  }
}
</style>
