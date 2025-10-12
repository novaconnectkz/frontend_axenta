<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <AppleCard>
      <template #title>
        <div class="dialog-header">
          <v-icon icon="mdi-account-edit" class="dialog-icon" />
          <span>Изменение роли Axenta</span>
        </div>
      </template>

      <div class="dialog-content" v-if="user">
        <!-- Информация о пользователе -->
        <div class="user-info-section">
          <div class="user-avatar">
            <v-avatar :color="getUserTypeColor(user.axenta_user_type)" size="48">
              <v-icon :icon="getUserTypeIcon(user.axenta_user_type)" color="white" size="24" />
            </v-avatar>
          </div>
          <div class="user-details">
            <h4>{{ user.first_name }} {{ user.last_name }}</h4>
            <p class="user-email">{{ user.email }}</p>
            <p class="user-username">@{{ user.username }}</p>
          </div>
        </div>

        <!-- Текущее состояние -->
        <div class="current-state-section">
          <h5>Текущее состояние</h5>
          <div class="state-grid">
            <div class="state-item">
              <span class="state-label">Тип Axenta:</span>
              <v-chip
                :color="getAxentaTypeColor(user.axenta_user_type)"
                :text="getAxentaTypeLabel(user.axenta_user_type)"
                size="small"
                variant="flat"
              />
            </div>
            <div class="state-item">
              <span class="state-label">Источник:</span>
              <v-chip
                :color="user.is_axenta_user ? 'primary' : 'warning'"
                :text="user.is_axenta_user ? 'Axenta' : 'Локальный'"
                size="small"
                variant="outlined"
              />
            </div>
            <div class="state-item" v-if="user.axenta_user_id">
              <span class="state-label">ID в Axenta:</span>
              <code class="axenta-id">{{ user.axenta_user_id }}</code>
            </div>
          </div>
        </div>

        <!-- Форма изменения -->
        <v-form ref="formRef" v-model="formValid" @submit.prevent="handleSubmit">
          <div class="form-section">
            <h5>Новые настройки</h5>
            
            <div class="form-row">
              <v-select
                v-model="form.axenta_user_type"
                :items="axentaTypeOptions"
                label="Тип пользователя Axenta"
                :rules="[rules.required]"
                required
                variant="outlined"
                density="comfortable"
              />
            </div>

            <div class="form-row" v-if="form.axenta_user_type !== 'local'">
              <AppleInput
                v-model="form.axenta_user_id"
                label="ID пользователя в Axenta"
                placeholder="Введите ID из системы Axenta"
                :rules="form.axenta_user_type !== 'local' ? [rules.required] : []"
                clearable
              />
            </div>

            <div class="form-row">
              <v-switch
                v-model="form.is_axenta_user"
                label="Пользователь из Axenta"
                color="primary"
                :disabled="form.axenta_user_type === 'local'"
                hide-details
              />
            </div>
          </div>
        </v-form>

        <!-- Предупреждения -->
        <v-alert
          v-if="showWarning"
          :type="warningType"
          variant="tonal"
          class="warning-alert"
        >
          <div class="alert-content">
            <v-icon :icon="warningIcon" />
            <div>
              <strong>{{ warningTitle }}</strong><br>
              {{ warningMessage }}
            </div>
          </div>
        </v-alert>
      </div>

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
            :disabled="!formValid || !hasChanges"
          >
            Сохранить изменения
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
import type { UpdateAxentaRoleForm, UserWithRelations, AxentaUserType } from '@/types/users';

// Props
const props = defineProps<{
  modelValue: boolean;
  user?: UserWithRelations | null;
}>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  success: [message: string];
  error: [message: string];
}>();

// Reactive data
const loading = ref(false);
const formValid = ref(false);
const formRef = ref();

const form = ref<UpdateAxentaRoleForm>({
  axenta_user_type: 'local',
  axenta_user_id: '',
  is_axenta_user: false,
});

// Computed
const dialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const user = computed(() => props.user);

const axentaTypeOptions = [
  { title: 'Партнер', value: 'partner', subtitle: 'Пользователь-партнер из Axenta' },
  { title: 'Клиент', value: 'client', subtitle: 'Пользователь-клиент из Axenta' },
  { title: 'Локальный', value: 'local', subtitle: 'Локальный пользователь системы' },
];

const hasChanges = computed(() => {
  if (!user.value) return false;
  
  return (
    form.value.axenta_user_type !== user.value.axenta_user_type ||
    form.value.axenta_user_id !== (user.value.axenta_user_id || '') ||
    form.value.is_axenta_user !== user.value.is_axenta_user
  );
});

const showWarning = computed(() => {
  if (!user.value) return false;
  
  // Предупреждение при смене с Axenta на локального
  if (user.value.is_axenta_user && form.value.axenta_user_type === 'local') {
    return true;
  }
  
  // Предупреждение при смене типа Axenta пользователя
  if (user.value.is_axenta_user && form.value.axenta_user_type !== user.value.axenta_user_type) {
    return true;
  }
  
  return false;
});

const warningType = computed(() => {
  if (form.value.axenta_user_type === 'local') return 'warning';
  return 'info';
});

const warningIcon = computed(() => {
  if (form.value.axenta_user_type === 'local') return 'mdi-alert';
  return 'mdi-information';
});

const warningTitle = computed(() => {
  if (form.value.axenta_user_type === 'local') return 'Внимание!';
  return 'Информация';
});

const warningMessage = computed(() => {
  if (!user.value) return '';
  
  if (user.value.is_axenta_user && form.value.axenta_user_type === 'local') {
    return 'Пользователь будет отключен от Axenta и станет локальным. Синхронизация с Axenta прекратится.';
  }
  
  if (user.value.is_axenta_user && form.value.axenta_user_type !== user.value.axenta_user_type) {
    return `Тип пользователя в Axenta будет изменен с "${getAxentaTypeLabel(user.value.axenta_user_type)}" на "${getAxentaTypeLabel(form.value.axenta_user_type)}".`;
  }
  
  return '';
});

// Validation rules
const rules = {
  required: (value: any) => !!value || 'Поле обязательно для заполнения',
};

// Methods
const initForm = () => {
  if (!user.value) return;
  
  form.value = {
    axenta_user_type: (user.value.axenta_user_type || 'local') as AxentaUserType,
    axenta_user_id: user.value.axenta_user_id || '',
    is_axenta_user: user.value.is_axenta_user || false,
  };
};

const handleSubmit = async () => {
  if (!formRef.value || !user.value) return;
  
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    const response = await axentaUsersService.updateUserAxentaRole(user.value.id, form.value);
    
    if (response.status === 'success') {
      emit('success', 'Роль пользователя успешно обновлена');
      dialog.value = false;
    } else {
      emit('error', response.error || 'Ошибка обновления роли');
    }
  } catch (error: any) {
    console.error('Ошибка обновления роли:', error);
    emit('error', 'Ошибка обновления роли');
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  dialog.value = false;
};

// Utility functions
const getUserTypeColor = (type?: string) => {
  switch (type) {
    case 'partner': return '#2196F3';
    case 'client': return '#4CAF50';
    case 'local': return '#FF9800';
    default: return '#9E9E9E';
  }
};

const getUserTypeIcon = (type?: string) => {
  switch (type) {
    case 'partner': return 'mdi-handshake';
    case 'client': return 'mdi-account-group';
    case 'local': return 'mdi-account';
    default: return 'mdi-account-question';
  }
};

const getAxentaTypeColor = (type?: string) => {
  switch (type) {
    case 'partner': return 'primary';
    case 'client': return 'success';
    case 'local': return 'warning';
    default: return 'grey';
  }
};

const getAxentaTypeLabel = (type?: string) => {
  switch (type) {
    case 'partner': return 'Партнер';
    case 'client': return 'Клиент';
    case 'local': return 'Локальный';
    default: return 'Неизвестно';
  }
};

// Watchers
watch(dialog, (newValue) => {
  if (newValue) {
    initForm();
  }
});

watch(() => form.value.axenta_user_type, (newType) => {
  if (newType === 'local') {
    form.value.is_axenta_user = false;
    form.value.axenta_user_id = '';
  } else {
    form.value.is_axenta_user = true;
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

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 20px 0;
}

.user-info-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--surface-variant);
  border-radius: 12px;
}

.user-details h4 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.user-email {
  margin: 0 0 2px 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.user-username {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.current-state-section h5,
.form-section h5 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.state-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.state-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.state-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.axenta-id {
  background: var(--surface-variant);
  padding: 4px 8px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.875rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  flex-direction: column;
}

.warning-alert {
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
  .user-info-section {
    flex-direction: column;
    text-align: center;
  }
  
  .state-item {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .dialog-actions {
    flex-direction: column-reverse;
    gap: 8px;
  }
}
</style>
