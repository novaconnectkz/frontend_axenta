<template>
  <v-dialog
    v-model="show"
    max-width="800"
    persistent
  >
    <AppleCard>
      <template #header>
        <div class="dialog-header">
          <v-icon :icon="isEdit ? 'mdi-pencil' : 'mdi-plus'" class="mr-2" />
          {{ isEdit ? 'Редактирование пользователя' : 'Создание пользователя' }}
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="closeDialog"
          />
        </div>
      </template>
      
      <v-form ref="formRef" @submit.prevent="saveUser">
        <div class="form-content">
          <v-row>
            <v-col cols="12" md="6">
              <AppleInput
                v-model="form.username"
                label="Логин"
                placeholder="Введите логин"
                required
                :error-message="errors.username"
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <AppleInput
                v-model="form.email"
                label="Email"
                type="email"
                placeholder="user@example.com"
                required
                :error-message="errors.email"
              />
            </v-col>
            
            <v-col cols="12" md="6" v-if="!isEdit">
              <AppleInput
                v-model="form.password"
                label="Пароль"
                type="password"
                placeholder="Введите пароль"
                required
                :error-message="errors.password"
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <AppleInput
                v-model="form.first_name"
                label="Имя"
                placeholder="Введите имя"
                required
                :error-message="errors.first_name"
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <AppleInput
                v-model="form.last_name"
                label="Фамилия"
                placeholder="Введите фамилию"
                required
                :error-message="errors.last_name"
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <AppleInput
                v-model="form.phone"
                label="Телефон"
                placeholder="+7 (XXX) XXX-XX-XX"
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <AppleInput
                v-model="form.telegram_id"
                label="Telegram ID"
                placeholder="@username или ID"
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="form.user_type"
                :items="userTypeOptions"
                label="Тип пользователя"
                variant="outlined"
                density="comfortable"
                :error-messages="errors.user_type"
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="form.role_id"
                :items="roleOptions"
                label="Роль"
                variant="outlined"
                density="comfortable"
                :error-messages="errors.role_id"
                :loading="loadingRoles"
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="form.template_id"
                :items="templateOptions"
                label="Шаблон пользователя"
                clearable
                variant="outlined"
                density="comfortable"
                :loading="loadingTemplates"
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-switch
                v-model="form.is_active"
                label="Активный пользователь"
                color="success"
                hide-details
              />
            </v-col>
            
            <v-col cols="12">
              <AppleInput
                v-model="form.name"
                label="Полное имя (для контрагентов)"
                placeholder="ООО Компания или ФИО"
              />
            </v-col>
          </v-row>
        </div>
      </v-form>
      
      <template #footer>
        <div class="dialog-actions">
          <AppleButton
            variant="secondary"
            @click="closeDialog"
          >
            Отмена
          </AppleButton>
          <AppleButton
            @click="saveUser"
            :loading="saving"
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
import usersService from '@/services/usersService';
import type {
    UserForm,
    UserWithRelations
} from '@/types/users';
import { computed, ref, watch } from 'vue';

// Props
interface Props {
  modelValue: boolean;
  user?: UserWithRelations | null;
  roleOptions?: Array<{ title: string; value: number }>;
  templateOptions?: Array<{ title: string; value: number }>;
  loadingRoles?: boolean;
  loadingTemplates?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  user: null,
  roleOptions: () => [],
  templateOptions: () => [],
  loadingRoles: false,
  loadingTemplates: false,
});

// Emits
interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved', user: UserWithRelations): void;
  (e: 'error', message: string): void;
}

const emit = defineEmits<Emits>();

// Reactive data
const saving = ref(false);
const formRef = ref();

const form = ref<UserForm>({
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  name: '',
  phone: '',
  telegram_id: '',
  is_active: true,
  user_type: 'user',
  role_id: 0,
  template_id: undefined,
});

const errors = ref<Record<string, string>>({});

// Computed
const show = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const isEdit = computed(() => !!props.user);

// Options
const userTypeOptions = [
  { title: 'Пользователь', value: 'user' },
  { title: 'Клиент', value: 'client' },
  { title: 'Монтажник', value: 'installer' },
  { title: 'Менеджер', value: 'manager' },
  { title: 'Администратор', value: 'admin' },
];

// Methods
const resetForm = () => {
  form.value = {
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    name: '',
    phone: '',
    telegram_id: '',
    is_active: true,
    user_type: 'user',
    role_id: 0,
    template_id: undefined,
  };
  errors.value = {};
};

const fillForm = (user: UserWithRelations) => {
  form.value = {
    username: user.username,
    email: user.email,
    password: '', // Пароль не заполняем при редактировании
    first_name: user.first_name,
    last_name: user.last_name,
    name: user.name || '',
    phone: user.phone || '',
    telegram_id: user.telegram_id || '',
    is_active: user.is_active,
    user_type: user.user_type,
    role_id: user.role_id,
    template_id: user.template_id,
  };
};

const validateForm = (): boolean => {
  errors.value = {};
  
  if (!form.value.username.trim()) {
    errors.value.username = 'Логин обязателен';
    return false;
  }
  if (!form.value.email.trim()) {
    errors.value.email = 'Email обязателен';
    return false;
  }
  if (!isEdit.value && !form.value.password) {
    errors.value.password = 'Пароль обязателен';
    return false;
  }
  if (!form.value.first_name.trim()) {
    errors.value.first_name = 'Имя обязательно';
    return false;
  }
  if (!form.value.last_name.trim()) {
    errors.value.last_name = 'Фамилия обязательна';
    return false;
  }
  if (!form.value.role_id) {
    errors.value.role_id = 'Роль обязательна';
    return false;
  }
  
  return true;
};

const saveUser = async () => {
  if (!validateForm()) {
    return;
  }
  
  try {
    saving.value = true;
    
    const response = isEdit.value
      ? await usersService.updateUser(props.user!.id, form.value)
      : await usersService.createUser(form.value);
    
    if (response.status === 'success') {
      emit('saved', response.data);
      closeDialog();
    } else {
      emit('error', response.error || 'Ошибка сохранения пользователя');
    }
  } catch (error: any) {
    console.error('Ошибка сохранения пользователя:', error);
    emit('error', 'Ошибка сохранения пользователя');
  } finally {
    saving.value = false;
  }
};

const closeDialog = () => {
  show.value = false;
  resetForm();
};

// Watchers
watch(() => props.user, (newUser) => {
  if (newUser) {
    fillForm(newUser);
  } else {
    resetForm();
  }
}, { immediate: true });

watch(show, (newShow) => {
  if (!newShow) {
    resetForm();
  }
});
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.form-content {
  padding: 20px 0;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
