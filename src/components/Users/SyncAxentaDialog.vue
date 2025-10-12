<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <AppleCard>
      <template #title>
        <div class="dialog-header">
          <v-icon icon="mdi-sync" class="dialog-icon" />
          <span>Синхронизация с Axenta</span>
        </div>
      </template>

      <div class="dialog-content">
        <!-- Информация о пользователе (если передан) -->
        <div v-if="user" class="user-info-section">
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

        <!-- Форма синхронизации -->
        <v-form ref="formRef" v-model="formValid" @submit.prevent="handleSubmit">
          <div class="form-section">
            <h5 v-if="!user">Синхронизация нового пользователя</h5>
            <h5 v-else>Повторная синхронизация</h5>
            
            <div class="form-row">
              <AppleInput
                v-model="form.username"
                label="Имя пользователя в Axenta"
                :rules="[rules.required]"
                required
                clearable
                :readonly="!!user"
                :hint="user ? 'Имя пользователя нельзя изменить при повторной синхронизации' : 'Введите имя пользователя из системы Axenta'"
              />
            </div>

            <div class="form-row">
              <AppleInput
                v-model="form.token"
                label="Токен Axenta API"
                type="password"
                :rules="[rules.required]"
                required
                clearable
                placeholder="Введите токен для доступа к Axenta API"
              >
                <template #append-inner>
                  <v-tooltip text="Получить токен в Axenta">
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon="mdi-help-circle"
                        size="small"
                        variant="text"
                        @click="showTokenHelp = true"
                      />
                    </template>
                  </v-tooltip>
                </template>
              </AppleInput>
            </div>
          </div>
        </v-form>

        <!-- Информация о синхронизации -->
        <v-alert
          type="info"
          variant="tonal"
          class="info-alert"
        >
          <div class="alert-content">
            <v-icon icon="mdi-information" />
            <div>
              <strong>Что произойдет при синхронизации:</strong>
              <ul class="sync-info-list">
                <li v-if="!user">Пользователь будет создан в локальной системе</li>
                <li v-else>Данные пользователя будут обновлены из Axenta</li>
                <li>Тип пользователя (партнер/клиент) будет определен автоматически</li>
                <li>Роль в системе будет назначена в соответствии с типом Axenta</li>
                <li>Пользователь будет помечен как пользователь Axenta</li>
              </ul>
            </div>
          </div>
        </v-alert>

        <!-- Результат синхронизации -->
        <div v-if="syncResult" class="sync-result-section">
          <v-alert
            :type="syncResult.success ? 'success' : 'error'"
            variant="tonal"
          >
            <div class="alert-content">
              <v-icon :icon="syncResult.success ? 'mdi-check-circle' : 'mdi-alert-circle'" />
              <div>
                <strong>{{ syncResult.success ? 'Синхронизация успешна' : 'Ошибка синхронизации' }}</strong><br>
                {{ syncResult.message }}
              </div>
            </div>
          </v-alert>
          
          <div v-if="syncResult.success && syncResult.userData" class="synced-user-info">
            <h6>Синхронизированные данные:</h6>
            <div class="synced-data-grid">
              <div class="synced-data-item">
                <span class="data-label">Тип Axenta:</span>
                <v-chip
                  :color="getAxentaTypeColor(syncResult.userData.axenta_user_type)"
                  :text="getAxentaTypeLabel(syncResult.userData.axenta_user_type)"
                  size="small"
                  variant="flat"
                />
              </div>
              <div class="synced-data-item">
                <span class="data-label">ID в Axenta:</span>
                <code class="axenta-id">{{ syncResult.userData.axenta_user_id }}</code>
              </div>
              <div class="synced-data-item">
                <span class="data-label">Email:</span>
                <span>{{ syncResult.userData.email }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #actions>
        <div class="dialog-actions">
          <AppleButton
            variant="outlined"
            @click="handleCancel"
            :disabled="loading"
          >
            {{ syncResult?.success ? 'Закрыть' : 'Отмена' }}
          </AppleButton>
          
          <AppleButton
            v-if="!syncResult?.success"
            @click="handleSubmit"
            :loading="loading"
            :disabled="!formValid"
          >
            {{ user ? 'Синхронизировать' : 'Создать и синхронизировать' }}
          </AppleButton>
        </div>
      </template>
    </AppleCard>

    <!-- Диалог помощи по токену -->
    <v-dialog v-model="showTokenHelp" max-width="500px">
      <AppleCard>
        <template #title>
          <div class="dialog-header">
            <v-icon icon="mdi-help-circle" class="dialog-icon" />
            <span>Как получить токен Axenta</span>
          </div>
        </template>

        <div class="token-help-content">
          <ol class="help-steps">
            <li>Войдите в систему Axenta Cloud</li>
            <li>Перейдите в раздел "API" или "Интеграции"</li>
            <li>Создайте новый API токен или используйте существующий</li>
            <li>Скопируйте токен и вставьте его в поле выше</li>
          </ol>
          
          <v-alert type="warning" variant="tonal" class="token-warning">
            <strong>Внимание:</strong> Токен предоставляет доступ к данным пользователя в Axenta. 
            Не передавайте его третьим лицам.
          </v-alert>
        </div>

        <template #actions>
          <AppleButton @click="showTokenHelp = false">
            Понятно
          </AppleButton>
        </template>
      </AppleCard>
    </v-dialog>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import AppleInput from '@/components/Apple/AppleInput.vue';
import axentaUsersService from '@/services/axentaUsersService';
import type { SyncAxentaUserForm, UserWithRelations } from '@/types/users';

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
const showTokenHelp = ref(false);
const syncResult = ref<{
  success: boolean;
  message: string;
  userData?: UserWithRelations;
} | null>(null);

const form = ref<SyncAxentaUserForm>({
  username: '',
  token: '',
});

// Computed
const dialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const user = computed(() => props.user);

// Validation rules
const rules = {
  required: (value: any) => !!value || 'Поле обязательно для заполнения',
};

// Methods
const initForm = () => {
  form.value = {
    username: user.value?.username || '',
    token: '',
  };
  syncResult.value = null;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    const response = await axentaUsersService.syncUserWithAxenta(form.value);
    
    if (response.status === 'success') {
      syncResult.value = {
        success: true,
        message: user.value 
          ? 'Пользователь успешно синхронизирован с Axenta'
          : 'Пользователь успешно создан и синхронизирован с Axenta',
        userData: response.data,
      };
      
      emit('success', syncResult.value.message);
    } else {
      syncResult.value = {
        success: false,
        message: response.error || 'Ошибка синхронизации с Axenta',
      };
    }
  } catch (error: any) {
    console.error('Ошибка синхронизации:', error);
    syncResult.value = {
      success: false,
      message: 'Ошибка синхронизации с Axenta',
    };
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  dialog.value = false;
  if (syncResult.value?.success) {
    // Если синхронизация была успешной, сбрасываем форму
    initForm();
  }
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

.form-section h5 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.info-alert {
  margin-top: 16px;
}

.alert-content {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.sync-info-list {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.sync-info-list li {
  margin-bottom: 4px;
}

.sync-result-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.synced-user-info h6 {
  margin: 0 0 12px 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.synced-data-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.synced-data-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.data-label {
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

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 0 0 0;
}

.token-help-content {
  padding: 20px 0;
}

.help-steps {
  margin-bottom: 20px;
  padding-left: 20px;
}

.help-steps li {
  margin-bottom: 8px;
}

.token-warning {
  margin-top: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .user-info-section {
    flex-direction: column;
    text-align: center;
  }
  
  .synced-data-item {
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
