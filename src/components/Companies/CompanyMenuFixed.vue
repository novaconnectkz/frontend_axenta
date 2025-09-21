<template>
  <div class="company-name-wrapper">
    <v-menu 
      v-model="menuOpen"
      location="bottom start"
      offset="8"
      min-width="280"
      :close-on-content-click="false"
    >
      <template #activator="{ props: menuProps }">
        <div 
          v-bind="menuProps"
          class="company-name-clickable"
        >
          <div class="name">{{ company.name }}</div>
          <div class="schema" v-if="company.database_schema">{{ company.database_schema }}</div>
        </div>
      </template>

      <v-card elevation="8">
        <!-- Заголовок -->
        <v-card-title class="d-flex align-center justify-space-between pa-4">
          <div class="d-flex align-center">
            <v-avatar color="primary" size="32" class="mr-3">
              <v-icon color="white" size="18">mdi-domain</v-icon>
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold">{{ company.name }}</div>
              <v-chip 
                :color="company.is_active ? 'success' : 'error'" 
                size="x-small"
                variant="flat"
              >
                {{ company.is_active ? 'Активна' : 'Неактивна' }}
              </v-chip>
            </div>
          </div>
          <v-btn 
            icon="mdi-close" 
            variant="text" 
            size="small" 
            @click="menuOpen = false"
          />
        </v-card-title>

        <v-divider />

        <!-- Основные действия -->
        <v-list density="compact">
          <v-list-subheader>
            <v-icon size="small" class="mr-2">mdi-cog</v-icon>
            Основные настройки
          </v-list-subheader>
          
          <v-list-item @click="editCompany" prepend-icon="mdi-pencil">
            <v-list-item-title>Редактировать компанию</v-list-item-title>
            <v-list-item-subtitle>Изменить основные данные</v-list-item-subtitle>
          </v-list-item>
          
          <v-list-item @click="viewCompanyDetails" prepend-icon="mdi-eye">
            <v-list-item-title>Просмотреть детали</v-list-item-title>
            <v-list-item-subtitle>Полная информация</v-list-item-subtitle>
          </v-list-item>
          
          <v-list-item @click="toggleCompanyStatus" :prepend-icon="company.is_active ? 'mdi-pause' : 'mdi-play'">
            <v-list-item-title>{{ company.is_active ? 'Деактивировать' : 'Активировать' }}</v-list-item-title>
            <v-list-item-subtitle>{{ company.is_active ? 'Приостановить работу' : 'Возобновить работу' }}</v-list-item-subtitle>
          </v-list-item>

          <v-divider class="my-2" />

          <v-list-subheader>
            <v-icon size="small" class="mr-2">mdi-database</v-icon>
            Управление данными
          </v-list-subheader>
          
          <v-list-item @click="manageUsers" prepend-icon="mdi-account-group">
            <v-list-item-title>Пользователи</v-list-item-title>
            <v-list-item-subtitle>{{ company.usage_stats?.users_count || 0 }} активных</v-list-item-subtitle>
            <template #append>
              <v-chip size="x-small" color="info">{{ company.usage_stats?.users_count || 0 }}</v-chip>
            </template>
          </v-list-item>
          
          <v-list-item @click="manageObjects" prepend-icon="mdi-radar">
            <v-list-item-title>Объекты</v-list-item-title>
            <v-list-item-subtitle>{{ company.usage_stats?.objects_count || 0 }} объектов</v-list-item-subtitle>
            <template #append>
              <v-chip size="x-small" color="info">{{ company.usage_stats?.objects_count || 0 }}</v-chip>
            </template>
          </v-list-item>
          
          <v-list-item @click="viewStorage" prepend-icon="mdi-harddisk">
            <v-list-item-title>Хранилище</v-list-item-title>
            <v-list-item-subtitle>{{ formatStorage(company.usage_stats?.storage_used_mb || 0) }} / {{ formatStorage(company.storage_quota) }}</v-list-item-subtitle>
          </v-list-item>

          <v-divider class="my-2" />

          <v-list-subheader>
            <v-icon size="small" class="mr-2">mdi-tools</v-icon>
            Дополнительные действия
          </v-list-subheader>
          
          <v-list-item @click="exportCompanyData" prepend-icon="mdi-download">
            <v-list-item-title>Экспорт данных</v-list-item-title>
            <v-list-item-subtitle>Скачать данные компании</v-list-item-subtitle>
          </v-list-item>
          
          <v-list-item @click="viewLogs" prepend-icon="mdi-text-box-search">
            <v-list-item-title>Просмотр логов</v-list-item-title>
            <v-list-item-subtitle>История активности</v-list-item-subtitle>
          </v-list-item>
          
          <v-list-item @click="deleteCompany" prepend-icon="mdi-delete" class="text-error">
            <v-list-item-title>Удалить компанию</v-list-item-title>
            <v-list-item-subtitle>Безвозвратное удаление</v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <!-- Информация о лимитах -->
        <v-card-text class="pt-0">
          <v-divider class="mb-3" />
          <div class="text-subtitle-2 mb-3 d-flex align-center">
            <v-icon size="small" class="mr-2">mdi-gauge</v-icon>
            Использование ресурсов
          </div>
          
          <div class="mb-2">
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-caption">Пользователи</span>
              <span class="text-caption font-weight-bold">{{ company.usage_stats?.users_count || 0 }} / {{ company.max_users }}</span>
            </div>
            <v-progress-linear
              :model-value="getUsersProgress()"
              :color="getUsersProgress() > 90 ? 'error' : getUsersProgress() > 70 ? 'warning' : 'success'"
              height="4"
              rounded
            />
          </div>
          
          <div class="mb-2">
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-caption">Объекты</span>
              <span class="text-caption font-weight-bold">{{ company.usage_stats?.objects_count || 0 }} / {{ company.max_objects }}</span>
            </div>
            <v-progress-linear
              :model-value="getObjectsProgress()"
              :color="getObjectsProgress() > 90 ? 'error' : getObjectsProgress() > 70 ? 'warning' : 'success'"
              height="4"
              rounded
            />
          </div>
          
          <div>
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-caption">Хранилище</span>
              <span class="text-caption font-weight-bold">{{ formatStorage(company.usage_stats?.storage_used_mb || 0) }} / {{ formatStorage(company.storage_quota) }}</span>
            </div>
            <v-progress-linear
              :model-value="getStorageProgress()"
              :color="getStorageProgress() > 90 ? 'error' : getStorageProgress() > 70 ? 'warning' : 'success'"
              height="4"
              rounded
            />
          </div>
        </v-card-text>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import type { Company } from '@/types/companies'
import { ref, computed } from 'vue'

interface Props {
  company: Company
}

interface Emits {
  (e: 'edit', company: Company): void
  (e: 'view', company: Company): void
  (e: 'delete', company: Company): void
  (e: 'toggle-status', company: Company): void
  (e: 'manage-users', company: Company): void
  (e: 'manage-objects', company: Company): void
  (e: 'export-data', company: Company): void
  (e: 'view-logs', company: Company): void
  (e: 'view-storage', company: Company): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const menuOpen = ref(false)

const editCompany = () => {
  emit('edit', props.company)
  menuOpen.value = false
}

const viewCompanyDetails = () => {
  emit('view', props.company)
  menuOpen.value = false
}

const deleteCompany = () => {
  emit('delete', props.company)
  menuOpen.value = false
}

const toggleCompanyStatus = () => {
  emit('toggle-status', props.company)
  menuOpen.value = false
}

const manageUsers = () => {
  emit('manage-users', props.company)
  menuOpen.value = false
}

const manageObjects = () => {
  emit('manage-objects', props.company)
  menuOpen.value = false
}

const exportCompanyData = () => {
  emit('export-data', props.company)
  menuOpen.value = false
}

const viewLogs = () => {
  emit('view-logs', props.company)
  menuOpen.value = false
}

const viewStorage = () => {
  emit('view-storage', props.company)
  menuOpen.value = false
}

// Вычисляемые свойства для прогресс-баров
const getUsersProgress = computed(() => {
  const used = props.company.usage_stats?.users_count || 0
  const max = props.company.max_users
  return Math.min((used / max) * 100, 100)
})

const getObjectsProgress = computed(() => {
  const used = props.company.usage_stats?.objects_count || 0
  const max = props.company.max_objects
  return Math.min((used / max) * 100, 100)
})

const getStorageProgress = computed(() => {
  const used = props.company.usage_stats?.storage_used_mb || 0
  const max = props.company.storage_quota
  return Math.min((used / max) * 100, 100)
})

// Утилита для форматирования размера хранилища
const formatStorage = (mb: number): string => {
  if (mb < 1024) return `${mb} МБ`
  return `${(mb / 1024).toFixed(1)} ГБ`
}
</script>

<style scoped>
.company-name-wrapper {
  position: relative;
}

.company-name-clickable {
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.company-name-clickable:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
  border-color: rgba(var(--v-theme-primary), 0.2);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.1);
}

.company-name-clickable .name {
  font-weight: 600;
  margin-bottom: 4px;
  color: rgb(var(--v-theme-primary));
  font-size: 14px;
}

.company-name-clickable .schema {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
