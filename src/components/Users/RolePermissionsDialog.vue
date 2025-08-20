<template>
  <v-dialog
    v-model="show"
    max-width="1000"
    persistent
  >
    <AppleCard>
      <template #header>
        <div class="dialog-header">
          <v-icon icon="mdi-shield-key" class="mr-2" />
          Управление правами роли: {{ role?.display_name }}
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="closeDialog"
          />
        </div>
      </template>
      
      <div class="permissions-content" v-if="role">
        <div class="permissions-header">
          <div class="role-info">
            <v-chip
              :text="role.display_name"
              :color="role.color || 'primary'"
              variant="tonal"
              class="mr-2"
            />
            <span class="text-caption">{{ role.description || 'Описание не указано' }}</span>
          </div>
          
          <div class="permissions-stats">
            <v-chip
              :text="`Разрешений: ${selectedPermissions.length}/${allPermissions.length}`"
              color="info"
              variant="outlined"
              size="small"
            />
          </div>
        </div>
        
        <v-divider class="my-4" />
        
        <div class="permissions-search">
          <AppleInput
            v-model="searchQuery"
            placeholder="Поиск разрешений..."
            prepend-icon="mdi-magnify"
            clearable
          />
        </div>
        
        <div class="permissions-grid">
          <div
            v-for="category in filteredCategories"
            :key="category.name"
            class="permission-category"
          >
            <div class="category-header">
              <v-checkbox
                :model-value="isCategorySelected(category)"
                :indeterminate="isCategoryIndeterminate(category)"
                @update:model-value="toggleCategory(category, $event)"
                hide-details
                density="compact"
              />
              <h4 class="category-title">{{ getCategoryTitle(category.name) }}</h4>
              <v-chip
                :text="`${getSelectedCategoryCount(category)}/${category.permissions.length}`"
                size="small"
                variant="outlined"
              />
            </div>
            
            <div class="permissions-list">
              <v-checkbox
                v-for="permission in category.permissions"
                :key="permission.id"
                v-model="selectedPermissions"
                :value="permission.id"
                :label="permission.display_name"
                :hint="permission.description"
                persistent-hint
                hide-details="auto"
                density="compact"
                class="permission-item"
              >
                <template #label>
                  <div class="permission-label">
                    <span class="permission-name">{{ permission.display_name }}</span>
                    <span class="permission-code">{{ permission.name }}</span>
                  </div>
                </template>
              </v-checkbox>
            </div>
          </div>
        </div>
        
        <div v-if="filteredCategories.length === 0" class="no-permissions">
          <v-icon icon="mdi-magnify" size="48" color="grey" />
          <p>Разрешения не найдены</p>
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
            @click="savePermissions"
            :loading="saving"
          >
            Сохранить права
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
import type { Permission, Role } from '@/types/users';
import { computed, ref, watch } from 'vue';

// Props
interface Props {
  modelValue: boolean;
  role?: Role | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  role: null,
});

// Emits
interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved', role: Role): void;
  (e: 'error', message: string): void;
}

const emit = defineEmits<Emits>();

// Reactive data
const saving = ref(false);
const loading = ref(false);
const searchQuery = ref('');
const allPermissions = ref<Permission[]>([]);
const selectedPermissions = ref<number[]>([]);

// Computed
const show = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

// Группировка разрешений по категориям
const permissionCategories = computed(() => {
  const categories: Record<string, Permission[]> = {};
  
  allPermissions.value.forEach(permission => {
    const category = permission.category || 'other';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(permission);
  });
  
  return Object.entries(categories).map(([name, permissions]) => ({
    name,
    permissions: permissions.sort((a, b) => a.display_name.localeCompare(b.display_name)),
  }));
});

// Фильтрация категорий по поисковому запросу
const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) {
    return permissionCategories.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  return permissionCategories.value
    .map(category => ({
      ...category,
      permissions: category.permissions.filter(permission =>
        permission.display_name.toLowerCase().includes(query) ||
        permission.name.toLowerCase().includes(query) ||
        permission.description?.toLowerCase().includes(query)
      ),
    }))
    .filter(category => category.permissions.length > 0);
});

// Methods
const getCategoryTitle = (category: string): string => {
  const titles: Record<string, string> = {
    management: 'Управление',
    warehouse: 'Склад',
    billing: 'Биллинг',
    reports: 'Отчеты',
    installations: 'Монтажи',
    users: 'Пользователи',
    objects: 'Объекты',
    other: 'Прочее',
  };
  return titles[category] || category;
};

const isCategorySelected = (category: { name: string; permissions: Permission[] }): boolean => {
  return category.permissions.every(permission => 
    selectedPermissions.value.includes(permission.id)
  );
};

const isCategoryIndeterminate = (category: { name: string; permissions: Permission[] }): boolean => {
  const selectedCount = getSelectedCategoryCount(category);
  return selectedCount > 0 && selectedCount < category.permissions.length;
};

const getSelectedCategoryCount = (category: { name: string; permissions: Permission[] }): number => {
  return category.permissions.filter(permission => 
    selectedPermissions.value.includes(permission.id)
  ).length;
};

const toggleCategory = (category: { name: string; permissions: Permission[] }, selected: boolean) => {
  const categoryPermissionIds = category.permissions.map(p => p.id);
  
  if (selected) {
    // Добавляем все разрешения категории
    categoryPermissionIds.forEach(id => {
      if (!selectedPermissions.value.includes(id)) {
        selectedPermissions.value.push(id);
      }
    });
  } else {
    // Убираем все разрешения категории
    selectedPermissions.value = selectedPermissions.value.filter(id => 
      !categoryPermissionIds.includes(id)
    );
  }
};

const loadPermissions = async () => {
  try {
    loading.value = true;
    const response = await usersService.getPermissions(1, 1000);
    if (response.status === 'success') {
      allPermissions.value = response.data.items;
    }
  } catch (error) {
    console.error('Ошибка загрузки разрешений:', error);
  } finally {
    loading.value = false;
  }
};

const loadRolePermissions = async () => {
  if (!props.role) return;
  
  try {
    const response = await usersService.getRolePermissions(props.role.id);
    if (response.status === 'success') {
      selectedPermissions.value = response.data.map(p => p.id);
    }
  } catch (error) {
    console.error('Ошибка загрузки разрешений роли:', error);
  }
};

const savePermissions = async () => {
  if (!props.role) return;
  
  try {
    saving.value = true;
    
    const response = await usersService.updateRolePermissions(
      props.role.id,
      selectedPermissions.value
    );
    
    if (response.status === 'success') {
      emit('saved', props.role);
      closeDialog();
    } else {
      emit('error', response.error || 'Ошибка сохранения прав доступа');
    }
  } catch (error: any) {
    console.error('Ошибка сохранения прав доступа:', error);
    emit('error', 'Ошибка сохранения прав доступа');
  } finally {
    saving.value = false;
  }
};

const closeDialog = () => {
  show.value = false;
  searchQuery.value = '';
  selectedPermissions.value = [];
};

// Watchers
watch(() => props.role, async (newRole) => {
  if (newRole) {
    await loadPermissions();
    await loadRolePermissions();
  }
}, { immediate: true });

watch(show, (newShow) => {
  if (!newShow) {
    searchQuery.value = '';
    selectedPermissions.value = [];
  }
});
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.permissions-content {
  padding: 20px;
  max-height: 600px;
  overflow-y: auto;
}

.permissions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.role-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.permissions-search {
  margin-bottom: 20px;
}

.permissions-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.permission-category {
  border: 1px solid rgba(60, 60, 67, 0.08);
  border-radius: 12px;
  padding: 16px;
  background: rgba(60, 60, 67, 0.02);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(60, 60, 67, 0.08);
}

.category-title {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
}

.permissions-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}

.permission-item {
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(60, 60, 67, 0.08);
}

.permission-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.permission-name {
  font-weight: 500;
  color: var(--text-primary);
}

.permission-code {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

.no-permissions {
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
[data-theme="dark"] .permission-category {
  border-color: rgba(84, 84, 136, 0.16);
  background: rgba(84, 84, 136, 0.04);
}

[data-theme="dark"] .category-header {
  border-bottom-color: rgba(84, 84, 136, 0.16);
}

[data-theme="dark"] .category-title {
  color: var(--text-primary-dark);
}

[data-theme="dark"] .permission-item {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(84, 84, 136, 0.16);
}

[data-theme="dark"] .permission-name {
  color: var(--text-primary-dark);
}

[data-theme="dark"] .permission-code {
  color: var(--text-secondary-dark);
}

/* Адаптивность */
@media (max-width: 768px) {
  .permissions-list {
    grid-template-columns: 1fr;
  }
  
  .permissions-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .category-header {
    flex-wrap: wrap;
  }
}
</style>
