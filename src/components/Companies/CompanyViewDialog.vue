<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="700"
  >
    <v-card v-if="company">
      <v-card-title class="dialog-header">
        <div class="header-content">
          <h2 class="company-name">{{ company.name }}</h2>
          <v-chip
            :color="company.is_active ? 'success' : 'error'"
            size="small"
          >
            {{ company.is_active ? 'Активна' : 'Неактивна' }}
          </v-chip>
        </div>
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="closeDialog"
        />
      </v-card-title>

      <v-card-text>
        <v-tabs v-model="activeTab">
          <v-tab value="general">Общее</v-tab>
          <v-tab value="contact">Контакты</v-tab>
          <v-tab value="usage">Использование</v-tab>
          <v-tab value="settings">Настройки</v-tab>
        </v-tabs>

        <v-tabs-window v-model="activeTab" class="mt-4">
          <!-- Общая информация -->
          <v-tabs-window-item value="general">
            <div class="info-section">
              <div class="info-grid">
                <div class="info-item">
                  <div class="label">ID компании</div>
                  <div class="value">{{ company.id }}</div>
                </div>
                <div class="info-item">
                  <div class="label">Схема БД</div>
                  <div class="value">{{ company.database_schema }}</div>
                </div>
                <div class="info-item" v-if="company.domain">
                  <div class="label">Домен</div>
                  <div class="value">{{ company.domain }}</div>
                </div>
                <div class="info-item" v-if="company.city">
                  <div class="label">Город</div>
                  <div class="value">{{ company.city }}</div>
                </div>
                <div class="info-item" v-if="company.country">
                  <div class="label">Страна</div>
                  <div class="value">{{ company.country }}</div>
                </div>
                <div class="info-item" v-if="company.address">
                  <div class="label">Адрес</div>
                  <div class="value">{{ company.address }}</div>
                </div>
                <div class="info-item">
                  <div class="label">Дата создания</div>
                  <div class="value">{{ formatDate(company.created_at) }}</div>
                </div>
                <div class="info-item">
                  <div class="label">Последнее обновление</div>
                  <div class="value">{{ formatDate(company.updated_at) }}</div>
                </div>
              </div>
            </div>
          </v-tabs-window-item>

          <!-- Контактная информация -->
          <v-tabs-window-item value="contact">
            <div class="info-section">
              <div class="info-grid">
                <div class="info-item" v-if="company.contact_person">
                  <div class="label">Контактное лицо</div>
                  <div class="value">{{ company.contact_person }}</div>
                </div>
                <div class="info-item" v-if="company.contact_email">
                  <div class="label">Email</div>
                  <div class="value">
                    <a :href="`mailto:${company.contact_email}`" class="link">
                      {{ company.contact_email }}
                    </a>
                  </div>
                </div>
                <div class="info-item" v-if="company.contact_phone">
                  <div class="label">Телефон</div>
                  <div class="value">
                    <a :href="`tel:${company.contact_phone}`" class="link">
                      {{ company.contact_phone }}
                    </a>
                  </div>
                </div>
              </div>
              
              <div v-if="!company.contact_person && !company.contact_email && !company.contact_phone" 
                   class="no-data">
                <v-icon>mdi-information-outline</v-icon>
                <span>Контактная информация не указана</span>
              </div>
            </div>
          </v-tabs-window-item>

          <!-- Использование ресурсов -->
          <v-tabs-window-item value="usage">
            <div class="info-section">
              <div v-if="company.usage_stats" class="usage-stats">
                <div class="usage-grid">
                  <div class="usage-card">
                    <div class="usage-icon primary">
                      <v-icon>mdi-account-group</v-icon>
                    </div>
                    <div class="usage-content">
                      <div class="usage-value">{{ company.usage_stats.users_count }}</div>
                      <div class="usage-label">Пользователей</div>
                      <div class="usage-limit">из {{ company.max_users }}</div>
                    </div>
                    <div class="usage-progress">
                      <v-progress-linear
                        :model-value="(company.usage_stats.users_count / company.max_users) * 100"
                        color="primary"
                        height="4"
                      />
                    </div>
                  </div>

                  <div class="usage-card">
                    <div class="usage-icon info">
                      <v-icon>mdi-radar</v-icon>
                    </div>
                    <div class="usage-content">
                      <div class="usage-value">{{ company.usage_stats.objects_count }}</div>
                      <div class="usage-label">Объектов</div>
                      <div class="usage-limit">из {{ company.max_objects }}</div>
                    </div>
                    <div class="usage-progress">
                      <v-progress-linear
                        :model-value="(company.usage_stats.objects_count / company.max_objects) * 100"
                        color="info"
                        height="4"
                      />
                    </div>
                  </div>

                  <div class="usage-card">
                    <div class="usage-icon warning">
                      <v-icon>mdi-harddisk</v-icon>
                    </div>
                    <div class="usage-content">
                      <div class="usage-value">{{ formatStorage(company.usage_stats.storage_used_mb) }}</div>
                      <div class="usage-label">Хранилище</div>
                      <div class="usage-limit">из {{ formatStorage(company.storage_quota) }}</div>
                    </div>
                    <div class="usage-progress">
                      <v-progress-linear
                        :model-value="(company.usage_stats.storage_used_mb / company.storage_quota) * 100"
                        color="warning"
                        height="4"
                      />
                    </div>
                  </div>
                </div>

                <div v-if="company.usage_stats.last_activity" class="last-activity">
                  <v-icon>mdi-clock-outline</v-icon>
                  <span>Последняя активность: {{ formatDate(company.usage_stats.last_activity) }}</span>
                </div>
              </div>
              
              <div v-else class="no-data">
                <v-icon>mdi-chart-line</v-icon>
                <span>Статистика использования недоступна</span>
              </div>
            </div>
          </v-tabs-window-item>

          <!-- Настройки -->
          <v-tabs-window-item value="settings">
            <div class="info-section">
              <h3 class="section-title">Лимиты ресурсов</h3>
              <div class="info-grid">
                <div class="info-item">
                  <div class="label">Максимум пользователей</div>
                  <div class="value">{{ company.max_users }}</div>
                </div>
                <div class="info-item">
                  <div class="label">Максимум объектов</div>
                  <div class="value">{{ company.max_objects }}</div>
                </div>
                <div class="info-item">
                  <div class="label">Квота хранилища</div>
                  <div class="value">{{ formatStorage(company.storage_quota) }}</div>
                </div>
              </div>

              <h3 class="section-title">Локализация</h3>
              <div class="info-grid">
                <div class="info-item">
                  <div class="label">Язык</div>
                  <div class="value">{{ getLanguageLabel(company.language) }}</div>
                </div>
                <div class="info-item">
                  <div class="label">Часовой пояс</div>
                  <div class="value">{{ getTimezoneLabel(company.timezone) }}</div>
                </div>
                <div class="info-item">
                  <div class="label">Валюта</div>
                  <div class="value">{{ getCurrencyLabel(company.currency) }}</div>
                </div>
              </div>

              <h3 class="section-title">Налоги и сборы</h3>
              <div class="info-grid">
                <div class="info-item">
                  <div class="label">Ставка НДС</div>
                  <div class="value">{{ company.default_tax_rate }}%</div>
                </div>
                <div class="info-item">
                  <div class="label">НДС включен в цену</div>
                  <div class="value">
                    <v-chip
                      :color="company.tax_included ? 'success' : 'grey'"
                      size="small"
                      variant="flat"
                    >
                      {{ company.tax_included ? 'Да' : 'Нет' }}
                    </v-chip>
                  </div>
                </div>
              </div>
            </div>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeDialog">Закрыть</v-btn>
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-pencil"
          @click="editCompany"
        >
          Редактировать
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { Company } from '@/types/companies'
import {
    CURRENCY_OPTIONS,
    LANGUAGE_OPTIONS,
    TIMEZONE_OPTIONS
} from '@/types/companies'
import { ref } from 'vue'

// Props
interface Props {
  modelValue: boolean
  company?: Company | null
}

const props = withDefaults(defineProps<Props>(), {
  company: null
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'edit': [company: Company]
}>()

// Реактивные данные
const activeTab = ref('general')

// Методы
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatStorage = (mb: number): string => {
  if (mb < 1024) return `${mb} МБ`
  return `${(mb / 1024).toFixed(1)} ГБ`
}

const getLanguageLabel = (code: string): string => {
  const option = LANGUAGE_OPTIONS.find(opt => opt.value === code)
  return option?.label || code
}

const getCurrencyLabel = (code: string): string => {
  const option = CURRENCY_OPTIONS.find(opt => opt.value === code)
  return option?.label || code
}

const getTimezoneLabel = (timezone: string): string => {
  const option = TIMEZONE_OPTIONS.find(opt => opt.value === timezone)
  return option?.label || timezone
}

const closeDialog = () => {
  emit('update:modelValue', false)
  activeTab.value = 'general'
}

const editCompany = () => {
  if (props.company) {
    emit('edit', props.company)
    closeDialog()
  }
}
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.company-name {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.info-section {
  padding: 16px 0;
}

.section-title {
  font-size: 18px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 16px;
  margin-top: 24px;
}

.section-title:first-child {
  margin-top: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-weight: 500;
}

.info-item .value {
  font-size: 16px;
  color: rgb(var(--v-theme-on-surface));
}

.link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-style: italic;
}

.usage-stats {
  padding: 16px 0;
}

.usage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.usage-card {
  background-color: rgb(var(--v-theme-surface-variant));
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.usage-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.usage-icon.primary {
  background-color: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

.usage-icon.info {
  background-color: rgba(var(--v-theme-info), 0.1);
  color: rgb(var(--v-theme-info));
}

.usage-icon.warning {
  background-color: rgba(var(--v-theme-warning), 0.1);
  color: rgb(var(--v-theme-warning));
}

.usage-content {
  flex: 1;
}

.usage-value {
  font-size: 24px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 4px;
}

.usage-label {
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 2px;
}

.usage-limit {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.usage-progress {
  margin-top: 8px;
}

.last-activity {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background-color: rgb(var(--v-theme-surface-variant));
  border-radius: 8px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 14px;
}

:deep(.v-tabs) {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .usage-grid {
    grid-template-columns: 1fr;
  }
}
</style>
