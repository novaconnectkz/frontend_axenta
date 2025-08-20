<template>
  <div class="roles-management">
    <div class="roles-header">
      <div class="roles-title-section">
        <v-icon icon="mdi-shield-account" size="24" class="mr-2" />
        <h3>Управление ролями</h3>
      </div>
      <div class="roles-actions">
        <AppleButton
          variant="secondary"
          prepend-icon="mdi-plus"
          size="small"
          @click="openCreateRoleDialog"
        >
          Создать роль
        </AppleButton>
      </div>
    </div>

    <div class="roles-list">
      <div
        v-for="role in roles"
        :key="role.id"
        class="role-card"
        :class="{ 'system-role': role.is_system }"
      >
        <div class="role-header">
          <div class="role-info">
            <v-chip
              :text="role.display_name"
              :color="role.color || 'primary'"
              variant="tonal"
            />
            <div class="role-details">
              <span class="role-name">{{ role.name }}</span>
              <span class="role-description">{{ role.description || 'Описание не указано' }}</span>
            </div>
          </div>
          <div class="role-stats">
            <v-chip
              :text="`Пользователей: ${role.users?.length || 0}`"
              size="small"
              variant="outlined"
            />
            <v-chip
              :text="`Прав: ${role.permissions?.length || 0}`"
              size="small"
              variant="outlined"
              class="ml-2"
            />
          </div>
        </div>

        <div class="role-actions">
          <AppleButton
            variant="text"
            size="small"
            prepend-icon="mdi-shield-key"
            @click="managePermissions(role)"
          >
            Права доступа
          </AppleButton>
          <AppleButton
            variant="text"
            size="small"
            prepend-icon="mdi-pencil"
            @click="editRole(role)"
            :disabled="role.is_system"
          >
            Изменить
          </AppleButton>
          <AppleButton
            variant="text"
            size="small"
            prepend-icon="mdi-delete"
            @click="deleteRole(role)"
            :disabled="role.is_system"
            class="text-error"
          >
            Удалить
          </AppleButton>
        </div>
      </div>
    </div>

    <!-- Диалог создания/редактирования роли -->
    <v-dialog
      v-model="roleDialog.show"
      max-width="600"
      persistent
    >
      <AppleCard>
        <template #header>
          <div class="dialog-header">
            <v-icon :icon="roleDialog.isEdit ? 'mdi-pencil' : 'mdi-plus'" class="mr-2" />
            {{ roleDialog.isEdit ? 'Редактирование роли' : 'Создание роли' }}
            <v-spacer />
            <v-btn
              icon="mdi-close"
              variant="text"
              size="small"
              @click="closeRoleDialog"
            />
          </div>
        </template>
        
        <v-form ref="roleFormRef" @submit.prevent="saveRole">
          <div class="form-content">
            <v-row>
              <v-col cols="12" md="6">
                <AppleInput
                  v-model="roleForm.name"
                  label="Системное имя роли"
                  placeholder="admin, manager, user"
                  required
                  :error-message="roleErrors.name"
                  :disabled="roleDialog.isEdit"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <AppleInput
                  v-model="roleForm.display_name"
                  label="Отображаемое имя"
                  placeholder="Администратор, Менеджер"
                  required
                  :error-message="roleErrors.display_name"
                />
              </v-col>
              
              <v-col cols="12">
                <AppleInput
                  v-model="roleForm.description"
                  label="Описание роли"
                  placeholder="Краткое описание назначения роли"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="roleForm.color"
                  label="Цвет роли"
                  type="color"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="roleForm.priority"
                  label="Приоритет роли"
                  type="number"
                  min="0"
                  max="100"
                  variant="outlined"
                  density="comfortable"
                  hint="Чем выше число, тем выше приоритет"
                  persistent-hint
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-switch
                  v-model="roleForm.is_active"
                  label="Активная роль"
                  color="success"
                  hide-details
                />
              </v-col>
            </v-row>
          </div>
        </v-form>
        
        <template #footer>
          <div class="dialog-actions">
            <AppleButton
              variant="secondary"
              @click="closeRoleDialog"
            >
              Отмена
            </AppleButton>
            <AppleButton
              @click="saveRole"
              :loading="saving"
            >
              {{ roleDialog.isEdit ? 'Сохранить' : 'Создать' }}
            </AppleButton>
          </div>
        </template>
      </AppleCard>
    </v-dialog>

    <!-- Диалог управления правами -->
    <RolePermissionsDialog
      v-model="permissionsDialog.show"
      :role="permissionsDialog.role"
      @saved="onPermissionsSaved"
      @error="$emit('error', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import AppleInput from '@/components/Apple/AppleInput.vue';
import usersService from '@/services/usersService';
import type { Role } from '@/types/users';
import { onMounted, ref } from 'vue';
import RolePermissionsDialog from './RolePermissionsDialog.vue';

// Emits
interface Emits {
  (e: 'success', message: string): void;
  (e: 'error', message: string): void;
}

const emit = defineEmits<Emits>();

// Reactive data
const loading = ref(false);
const saving = ref(false);
const roles = ref<Role[]>([]);

// Role dialog
const roleDialog = ref({
  show: false,
  isEdit: false,
  role: null as Role | null,
});

const roleForm = ref({
  name: '',
  display_name: '',
  description: '',
  color: '#1976D2',
  priority: 0,
  is_active: true,
});

const roleErrors = ref<Record<string, string>>({});
const roleFormRef = ref();

// Permissions dialog
const permissionsDialog = ref({
  show: false,
  role: null as Role | null,
});

// Methods
const loadRoles = async () => {
  try {
    loading.value = true;
    const response = await usersService.getRoles(1, 100);
    if (response.status === 'success') {
      roles.value = response.data.items;
    } else {
      emit('error', response.error || 'Ошибка загрузки ролей');
    }
  } catch (error: any) {
    console.error('Ошибка загрузки ролей:', error);
    emit('error', 'Ошибка загрузки ролей');
  } finally {
    loading.value = false;
  }
};

const openCreateRoleDialog = () => {
  roleDialog.value = {
    show: true,
    isEdit: false,
    role: null,
  };
  resetRoleForm();
};

const editRole = (role: Role) => {
  roleDialog.value = {
    show: true,
    isEdit: true,
    role,
  };
  fillRoleForm(role);
};

const resetRoleForm = () => {
  roleForm.value = {
    name: '',
    display_name: '',
    description: '',
    color: '#1976D2',
    priority: 0,
    is_active: true,
  };
  roleErrors.value = {};
};

const fillRoleForm = (role: Role) => {
  roleForm.value = {
    name: role.name,
    display_name: role.display_name,
    description: role.description || '',
    color: role.color || '#1976D2',
    priority: role.priority,
    is_active: role.is_active,
  };
};

const validateRoleForm = (): boolean => {
  roleErrors.value = {};
  
  if (!roleForm.value.name.trim()) {
    roleErrors.value.name = 'Системное имя роли обязательно';
    return false;
  }
  if (!roleForm.value.display_name.trim()) {
    roleErrors.value.display_name = 'Отображаемое имя роли обязательно';
    return false;
  }
  
  return true;
};

const saveRole = async () => {
  if (!validateRoleForm()) {
    return;
  }
  
  try {
    saving.value = true;
    
    const response = roleDialog.value.isEdit
      ? await usersService.updateRole(roleDialog.value.role!.id, roleForm.value)
      : await usersService.createRole(roleForm.value);
    
    if (response.status === 'success') {
      emit('success', 
        roleDialog.value.isEdit ? 'Роль успешно обновлена' : 'Роль успешно создана'
      );
      closeRoleDialog();
      await loadRoles();
    } else {
      emit('error', response.error || 'Ошибка сохранения роли');
    }
  } catch (error: any) {
    console.error('Ошибка сохранения роли:', error);
    emit('error', 'Ошибка сохранения роли');
  } finally {
    saving.value = false;
  }
};

const deleteRole = async (role: Role) => {
  if (!confirm(`Вы уверены, что хотите удалить роль "${role.display_name}"?`)) {
    return;
  }
  
  try {
    const response = await usersService.deleteRole(role.id);
    if (response.status === 'success') {
      emit('success', 'Роль успешно удалена');
      await loadRoles();
    } else {
      emit('error', response.error || 'Ошибка удаления роли');
    }
  } catch (error: any) {
    console.error('Ошибка удаления роли:', error);
    emit('error', 'Ошибка удаления роли');
  }
};

const closeRoleDialog = () => {
  roleDialog.value.show = false;
  resetRoleForm();
};

const managePermissions = (role: Role) => {
  permissionsDialog.value = {
    show: true,
    role,
  };
};

const onPermissionsSaved = (role: Role) => {
  emit('success', `Права доступа для роли "${role.display_name}" успешно обновлены`);
  loadRoles(); // Перезагружаем роли чтобы обновить счетчик прав
};

// Lifecycle
onMounted(() => {
  loadRoles();
});
</script>

<style scoped>
.roles-management {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.roles-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.roles-title-section {
  display: flex;
  align-items: center;
}

.roles-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.role-card {
  border: 1px solid rgba(60, 60, 67, 0.08);
  border-radius: 12px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.2s ease;
}

.role-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.system-role {
  border-color: rgba(255, 193, 7, 0.3);
  background: rgba(255, 193, 7, 0.05);
}

.role-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.role-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.role-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.role-name {
  font-weight: 500;
  color: var(--text-primary);
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.875rem;
}

.role-description {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.role-stats {
  display: flex;
  align-items: center;
}

.role-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

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

/* Темная тема */
[data-theme="dark"] .role-card {
  border-color: rgba(84, 84, 136, 0.16);
  background: rgba(255, 255, 255, 0.05);
}

[data-theme="dark"] .role-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .system-role {
  border-color: rgba(255, 193, 7, 0.4);
  background: rgba(255, 193, 7, 0.1);
}

[data-theme="dark"] .role-name {
  color: var(--text-primary-dark);
}

[data-theme="dark"] .role-description {
  color: var(--text-secondary-dark);
}

/* Адаптивность */
@media (max-width: 768px) {
  .roles-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .roles-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .role-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .role-stats {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .role-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
