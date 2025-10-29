<template>
  <v-dialog
    v-model="show"
    max-width="500"
  >
    <AppleCard>
      <template #header>
        <v-icon icon="mdi-key" class="mr-2" color="warning" />
        Смена пароля пользователя
      </template>
      
      <div class="dialog-content">
        <p class="mb-4">
          Смена пароля для пользователя <strong>{{ user?.username }}</strong>
        </p>
        
        <AppleInput
          v-model="form.password"
          label="Новый пароль"
          type="password"
          placeholder="Введите новый пароль"
          required
          :error-message="errors.password"
        />
        
        <AppleInput
          v-model="form.confirmPassword"
          label="Подтвердите новый пароль"
          type="password"
          placeholder="Повторите новый пароль"
          required
          :error-message="errors.confirmPassword"
          class="mt-4"
        />
      </div>
      
      <template #footer>
        <div class="dialog-actions">
          <AppleButton
            variant="secondary"
            @click="closeDialog"
          >
            Отмена
          </AppleButton>
          <AppleButton
            variant="danger"
            @click="resetPassword"
            :loading="resetting"
          >
            Изменить пароль
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
import type { UserWithRelations } from '@/types/users';
import { computed, ref, watch } from 'vue';

// Props
interface Props {
  modelValue: boolean;
  user?: UserWithRelations | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  user: null,
});

// Emits
interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success', message: string): void;
  (e: 'error', message: string): void;
}

const emit = defineEmits<Emits>();

// Reactive data
const resetting = ref(false);

const form = ref({
  password: '',
  confirmPassword: '',
});

const errors = ref<Record<string, string>>({});

// Computed
const show = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

// Methods
const resetForm = () => {
  form.value = {
    password: '',
    confirmPassword: '',
  };
  errors.value = {};
};

const validateForm = (): boolean => {
  errors.value = {};
  
  if (!form.value.password.trim()) {
    errors.value.password = 'Новый пароль обязателен';
    return false;
  }
  
  if (form.value.password.length < 6) {
    errors.value.password = 'Пароль должен содержать минимум 6 символов';
    return false;
  }
  
  if (!form.value.confirmPassword.trim()) {
    errors.value.confirmPassword = 'Подтверждение пароля обязательно';
    return false;
  }
  
  if (form.value.password !== form.value.confirmPassword) {
    errors.value.confirmPassword = 'Пароли не совпадают';
    return false;
  }
  
  return true;
};

const resetPassword = async () => {
  if (!validateForm() || !props.user) {
    return;
  }
  
  try {
    resetting.value = true;
    
    const response = await usersService.updateUserPassword(
      props.user.id,
      form.value.password,
      form.value.confirmPassword
    );
    
    if (response.status === 'success') {
      emit('success', 'Пароль успешно изменен');
      closeDialog();
    } else {
      emit('error', response.message || 'Ошибка смены пароля');
    }
  } catch (error: any) {
    console.error('Ошибка смены пароля:', error);
    emit('error', 'Ошибка смены пароля');
  } finally {
    resetting.value = false;
  }
};

const closeDialog = () => {
  show.value = false;
  resetForm();
};

// Watchers
watch(show, (newShow) => {
  if (!newShow) {
    resetForm();
  }
});
</script>

<style scoped>
.dialog-content {
  padding: 20px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
