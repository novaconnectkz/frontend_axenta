<template>
  <v-dialog
    v-model="show"
    max-width="800"
    persistent
  >
    <AppleCard>
      <template #header>
        <div class="dialog-header">
          <v-icon icon="mdi-account-clock" class="mr-2" color="warning" />
          Деактивация неактивных пользователей
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="closeDialog"
          />
        </div>
      </template>
      
      <div class="dialog-content">
        <div class="warning-section">
          <v-alert
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            <strong>Внимание!</strong> Будут деактивированы пользователи, которые не входили в систему более указанного количества дней.
          </v-alert>
        </div>
        
        <div class="criteria-section">
          <h4 class="section-title">Критерии деактивации</h4>
          
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="criteria.inactiveDays"
                label="Дней неактивности"
                type="number"
                min="1"
                max="365"
                variant="outlined"
                density="comfortable"
                hint="Пользователи, не входившие в систему более указанного количества дней"
                persistent-hint
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="criteria.excludeRoles"
                :items="roleOptions"
                label="Исключить роли"
                multiple
                chips
                variant="outlined"
                density="comfortable"
                hint="Пользователи с указанными ролями не будут деактивированы"
                persistent-hint
              />
            </v-col>
            
            <v-col cols="12">
              <v-switch
                v-model="criteria.excludeNeverLoggedIn"
                label="Исключить пользователей, которые никогда не входили"
                color="primary"
                hide-details
              />
            </v-col>
            
            <v-col cols="12">
              <v-switch
                v-model="criteria.dryRun"
                label="Режим предварительного просмотра (не деактивировать)"
                color="info"
                hide-details
              />
            </v-col>
          </v-row>
        </div>
        
        <v-divider class="my-4" />
        
        <div class="preview-section" v-if="previewUsers.length > 0">
          <div class="preview-header">
            <h4 class="section-title">
              {{ criteria.dryRun ? 'Предварительный просмотр' : 'Пользователи для деактивации' }}
            </h4>
            <v-chip
              :text="`Найдено: ${previewUsers.length}`"
              color="warning"
              variant="tonal"
            />
          </div>
          
          <div class="users-preview">
            <v-data-table
              :headers="previewHeaders"
              :items="previewUsers"
              :items-per-page="10"
              class="preview-table"
              no-data-text="Пользователи не найдены"
            >
              <template #item.user="{ item }">
                <div class="user-cell">
                  <v-avatar size="24" color="primary">
                    <span class="text-white text-caption">{{ getUserInitials(item) }}</span>
                  </v-avatar>
                  <div class="user-info">
                    <span class="user-name">{{ getUserFullName(item) }}</span>
                    <span class="user-email">{{ item.email }}</span>
                  </div>
                </div>
              </template>
              
              <template #item.role="{ item }">
                <v-chip
                  v-if="item.role"
                  :text="item.role.display_name"
                  :color="item.role.color || 'primary'"
                  size="small"
                  variant="tonal"
                />
              </template>
              
              <template #item.last_login="{ item }">
                <span v-if="item.last_login">
                  {{ formatDate(item.last_login) }}
                </span>
                <span v-else class="text-medium-emphasis">
                  Никогда
                </span>
              </template>
              
              <template #item.days_inactive="{ item }">
                <v-chip
                  :text="getDaysInactive(item).toString()"
                  color="warning"
                  size="small"
                  variant="tonal"
                />
              </template>
            </v-data-table>
          </div>
        </div>
        
        <div v-else-if="searchPerformed" class="no-users">
          <v-icon icon="mdi-account-check" size="48" color="success" />
          <p>Пользователи, соответствующие критериям, не найдены</p>
        </div>
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
            variant="secondary"
            prepend-icon="mdi-magnify"
            @click="searchInactiveUsers"
            :loading="searching"
          >
            Найти пользователей
          </AppleButton>
          <AppleButton
            v-if="previewUsers.length > 0 && !criteria.dryRun"
            variant="danger"
            prepend-icon="mdi-account-off"
            @click="deactivateUsers"
            :loading="deactivating"
          >
            Деактивировать ({{ previewUsers.length }})
          </AppleButton>
        </div>
      </template>
    </AppleCard>
  </v-dialog>
</template>

<script setup lang="ts">
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import usersService from '@/services/usersService';
import type { UserWithRelations } from '@/types/users';
import { computed, onMounted, ref } from 'vue';

// Props
interface Props {
  modelValue: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
});

// Emits
interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success', message: string): void;
  (e: 'error', message: string): void;
}

const emit = defineEmits<Emits>();

// Reactive data
const searching = ref(false);
const deactivating = ref(false);
const searchPerformed = ref(false);
const previewUsers = ref<UserWithRelations[]>([]);
const roleOptions = ref<Array<{ title: string; value: string }>>([]);

const criteria = ref({
  inactiveDays: 90,
  excludeRoles: [] as string[],
  excludeNeverLoggedIn: true,
  dryRun: true,
});

// Computed
const show = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

// Table headers
const previewHeaders = [
  { title: 'Пользователь', value: 'user', sortable: false },
  { title: 'Роль', value: 'role', sortable: false },
  { title: 'Последний вход', value: 'last_login', sortable: true },
  { title: 'Дней неактивности', value: 'days_inactive', sortable: true },
];

// Methods
const loadRoles = async () => {
  try {
    const response = await usersService.getRoles(1, 100, { active_only: true });
    if (response.status === 'success') {
      roleOptions.value = response.data.items.map(role => ({
        title: role.display_name,
        value: role.name,
      }));
    }
  } catch (error) {
    console.error('Ошибка загрузки ролей:', error);
  }
};

const searchInactiveUsers = async () => {
  try {
    searching.value = true;
    searchPerformed.value = true;
    
    // Получаем всех пользователей
    const response = await usersService.getUsers(1, 1000, { active: true });
    if (response.status !== 'success') {
      emit('error', 'Ошибка загрузки пользователей');
      return;
    }
    
    const allUsers = response.data.items;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - criteria.value.inactiveDays);
    
    // Фильтруем пользователей по критериям
    previewUsers.value = allUsers.filter(user => {
      // Исключаем роли
      if (criteria.value.excludeRoles.includes(user.role?.name || '')) {
        return false;
      }
      
      // Проверяем последний вход
      if (!user.last_login) {
        // Пользователь никогда не входил
        return !criteria.value.excludeNeverLoggedIn;
      }
      
      const lastLogin = new Date(user.last_login);
      return lastLogin < cutoffDate;
    });
    
  } catch (error: any) {
    console.error('Ошибка поиска неактивных пользователей:', error);
    emit('error', 'Ошибка поиска неактивных пользователей');
  } finally {
    searching.value = false;
  }
};

const deactivateUsers = async () => {
  if (previewUsers.value.length === 0) {
    return;
  }
  
  if (!confirm(`Вы уверены, что хотите деактивировать ${previewUsers.value.length} пользователей?`)) {
    return;
  }
  
  try {
    deactivating.value = true;
    
    const userIds = previewUsers.value.map(user => user.id);
    const response = await usersService.deactivateUsers(userIds);
    
    if (response.status === 'success') {
      emit('success', `Деактивировано ${response.updated} пользователей`);
      closeDialog();
    } else {
      emit('error', response.error || 'Ошибка деактивации пользователей');
    }
  } catch (error: any) {
    console.error('Ошибка деактивации пользователей:', error);
    emit('error', 'Ошибка деактивации пользователей');
  } finally {
    deactivating.value = false;
  }
};

const getUserFullName = (user: UserWithRelations): string => {
  return `${user.first_name} ${user.last_name}`.trim() || user.username;
};

const getUserInitials = (user: UserWithRelations): string => {
  const firstName = user.first_name?.charAt(0) || '';
  const lastName = user.last_name?.charAt(0) || '';
  return (firstName + lastName).toUpperCase() || user.username.charAt(0).toUpperCase();
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getDaysInactive = (user: UserWithRelations): number => {
  if (!user.last_login) {
    // Если пользователь никогда не входил, считаем с даты создания
    const createdDate = new Date(user.created_at);
    const now = new Date();
    return Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  const lastLogin = new Date(user.last_login);
  const now = new Date();
  return Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
};

const closeDialog = () => {
  show.value = false;
  previewUsers.value = [];
  searchPerformed.value = false;
  criteria.value = {
    inactiveDays: 90,
    excludeRoles: [],
    excludeNeverLoggedIn: true,
    dryRun: true,
  };
};

// Lifecycle
onMounted(() => {
  loadRoles();
});
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.dialog-content {
  padding: 20px;
  max-height: 600px;
  overflow-y: auto;
}

.section-title {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.criteria-section {
  margin-bottom: 20px;
}

.preview-section {
  margin-bottom: 20px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.users-preview {
  border: 1px solid rgba(60, 60, 67, 0.08);
  border-radius: 8px;
  overflow: hidden;
}

.preview-table {
  background: transparent;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 500;
  color: var(--text-primary);
}

.user-email {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.no-users {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-secondary);
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Темная тема */
[data-theme="dark"] .section-title {
  color: var(--text-primary-dark);
}

[data-theme="dark"] .users-preview {
  border-color: rgba(84, 84, 136, 0.16);
}

[data-theme="dark"] .user-name {
  color: var(--text-primary-dark);
}

[data-theme="dark"] .user-email {
  color: var(--text-secondary-dark);
}
</style>
