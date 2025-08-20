<template>
  <v-dialog
    v-model="show"
    max-width="900"
  >
    <AppleCard v-if="user">
      <template #header>
        <div class="view-dialog-header">
          <div class="user-title-section">
            <v-avatar size="32" color="primary" class="mr-3">
              <span class="text-white">{{ getUserInitials(user) }}</span>
            </v-avatar>
            <div>
              <h3>{{ getUserFullName(user) }}</h3>
              <p class="text-caption">{{ user.role?.display_name || 'Без роли' }}</p>
            </div>
          </div>
          <div class="user-status-section">
            <v-chip
              :text="user.is_active ? 'Активен' : 'Неактивен'"
              :color="user.is_active ? 'success' : 'error'"
              variant="tonal"
            />
          </div>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="closeDialog"
          />
        </div>
      </template>
      
      <div class="user-details">
        <v-row>
          <v-col cols="12" md="6">
            <div class="detail-section">
              <h4 class="section-title">Основная информация</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Логин:</span>
                  <span class="detail-value">{{ user.username }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Email:</span>
                  <span class="detail-value">
                    <a :href="`mailto:${user.email}`" class="email-link">{{ user.email }}</a>
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Телефон:</span>
                  <span class="detail-value">{{ user.phone || 'Не указан' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Telegram:</span>
                  <span class="detail-value">{{ user.telegram_id || 'Не указан' }}</span>
                </div>
              </div>
            </div>
          </v-col>
          
          <v-col cols="12" md="6">
            <div class="detail-section">
              <h4 class="section-title">Роль и доступы</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Роль:</span>
                  <span class="detail-value">
                    <v-chip
                      v-if="user.role"
                      :text="user.role.display_name"
                      :color="user.role.color || 'primary'"
                      size="small"
                      variant="tonal"
                    />
                    <span v-else>Не назначена</span>
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Тип:</span>
                  <span class="detail-value">
                    <div class="d-flex align-center">
                      <v-icon :icon="getUserTypeIcon(user.user_type)" size="20" class="mr-2" />
                      {{ getUserTypeText(user.user_type) }}
                    </div>
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Шаблон:</span>
                  <span class="detail-value">{{ user.template?.name || 'Не указан' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Статус:</span>
                  <span class="detail-value">
                    <v-chip
                      :text="user.is_active ? 'Активен' : 'Неактивен'"
                      :color="user.is_active ? 'success' : 'error'"
                      size="small"
                      variant="tonal"
                    />
                  </span>
                </div>
              </div>
            </div>
          </v-col>
          
          <v-col cols="12" md="6">
            <div class="detail-section">
              <h4 class="section-title">Активность</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Последний вход:</span>
                  <span class="detail-value">
                    {{ user.last_login ? formatDate(user.last_login) : 'Никогда' }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Всего входов:</span>
                  <span class="detail-value">{{ user.login_count }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Дата создания:</span>
                  <span class="detail-value">{{ formatDate(user.created_at) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Обновлен:</span>
                  <span class="detail-value">{{ formatDate(user.updated_at) }}</span>
                </div>
              </div>
            </div>
          </v-col>
          
          <v-col cols="12" md="6" v-if="user.external_id || user.external_source">
            <div class="detail-section">
              <h4 class="section-title">Интеграции</h4>
              <div class="detail-grid">
                <div class="detail-item" v-if="user.external_source">
                  <span class="detail-label">Источник:</span>
                  <span class="detail-value">{{ user.external_source }}</span>
                </div>
                <div class="detail-item" v-if="user.external_id">
                  <span class="detail-label">Внешний ID:</span>
                  <span class="detail-value">{{ user.external_id }}</span>
                </div>
              </div>
            </div>
          </v-col>
          
          <v-col cols="12" v-if="user.name">
            <div class="detail-section">
              <h4 class="section-title">Дополнительная информация</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Полное имя:</span>
                  <span class="detail-value">{{ user.name }}</span>
                </div>
              </div>
            </div>
          </v-col>
          
          <!-- Разрешения роли -->
          <v-col cols="12" v-if="user.role?.permissions && user.role.permissions.length > 0">
            <div class="detail-section">
              <h4 class="section-title">Разрешения</h4>
              <div class="permissions-container">
                <v-chip
                  v-for="permission in user.role.permissions"
                  :key="permission.id"
                  :text="permission.display_name"
                  size="small"
                  variant="outlined"
                  class="mr-2 mb-2"
                />
              </div>
            </div>
          </v-col>
        </v-row>
      </div>
      
      <template #footer>
        <div class="dialog-actions">
          <AppleButton
            variant="secondary"
            prepend-icon="mdi-pencil"
            @click="editUser"
          >
            Редактировать
          </AppleButton>
          <AppleButton
            variant="danger"
            prepend-icon="mdi-delete"
            @click="deleteUser"
          >
            Удалить
          </AppleButton>
        </div>
      </template>
    </AppleCard>
  </v-dialog>
</template>

<script setup lang="ts">
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import type { UserWithRelations } from '@/types/users';
import { computed } from 'vue';

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
  (e: 'edit', user: UserWithRelations): void;
  (e: 'delete', user: UserWithRelations): void;
}

const emit = defineEmits<Emits>();

// Computed
const show = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

// Methods
const getUserFullName = (user: UserWithRelations): string => {
  return `${user.first_name} ${user.last_name}`.trim() || user.username;
};

const getUserInitials = (user: UserWithRelations): string => {
  const firstName = user.first_name?.charAt(0) || '';
  const lastName = user.last_name?.charAt(0) || '';
  return (firstName + lastName).toUpperCase() || user.username.charAt(0).toUpperCase();
};

const getUserTypeText = (type: string): string => {
  const typeMap = {
    user: 'Пользователь',
    client: 'Клиент',
    installer: 'Монтажник',
    manager: 'Менеджер',
    admin: 'Администратор',
  };
  return typeMap[type as keyof typeof typeMap] || type;
};

const getUserTypeIcon = (type: string): string => {
  const iconMap = {
    user: 'mdi-account',
    client: 'mdi-account-tie',
    installer: 'mdi-account-hard-hat',
    manager: 'mdi-account-supervisor',
    admin: 'mdi-shield-account',
  };
  return iconMap[type as keyof typeof iconMap] || 'mdi-account';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const closeDialog = () => {
  show.value = false;
};

const editUser = () => {
  if (props.user) {
    emit('edit', props.user);
    closeDialog();
  }
};

const deleteUser = () => {
  if (props.user) {
    emit('delete', props.user);
    closeDialog();
  }
};
</script>

<style scoped>
.view-dialog-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.user-title-section {
  display: flex;
  align-items: center;
}

.user-status-section {
  margin-left: 16px;
}

.user-details {
  padding: 20px;
}

.detail-section {
  margin-bottom: 24px;
}

.section-title {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(60, 60, 67, 0.08);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 120px;
}

.detail-value {
  color: var(--text-primary);
  flex: 1;
}

.email-link {
  color: var(--apple-blue);
  text-decoration: none;
}

.email-link:hover {
  text-decoration: underline;
}

.permissions-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

[data-theme="dark"] .detail-label {
  color: var(--text-secondary-dark);
}

[data-theme="dark"] .detail-value {
  color: var(--text-primary-dark);
}

[data-theme="dark"] .detail-item {
  border-bottom-color: rgba(84, 84, 136, 0.16);
}

[data-theme="dark"] .email-link {
  color: var(--apple-blue-light);
}
</style>
