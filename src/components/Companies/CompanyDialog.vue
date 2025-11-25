<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="800"
    persistent
  >
    <v-card>
      <v-card-title class="dialog-header">
        <span class="text-h5">
          {{ mode === 'create' ? 'Создание компании' : 'Редактирование компании' }}
        </span>
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="closeDialog"
        />
      </v-card-title>

      <v-card-text>
        <v-form ref="form" @submit.prevent="saveCompany">
          <v-tabs v-model="activeTab" class="mb-4">
            <v-tab value="general">Основное</v-tab>
            <v-tab value="contact">Контакты</v-tab>
            <v-tab value="settings">Настройки</v-tab>
          </v-tabs>

          <v-tabs-window v-model="activeTab">
            <!-- Основная информация -->
            <v-tabs-window-item value="general">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="formData.name"
                    label="Название компании *"
                    :rules="nameRules"
                    variant="outlined"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.domain"
                    label="Домен"
                    hint="Например: company.axenta.ru"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.country"
                    label="Страна"
                    :items="countryOptions"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.city"
                    label="Город"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.address"
                    label="Адрес"
                    variant="outlined"
                  />
                </v-col>
              </v-row>
            </v-tabs-window-item>

            <!-- Контактная информация -->
            <v-tabs-window-item value="contact">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.contact_person"
                    label="Контактное лицо"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.contact_email"
                    label="Email"
                    :rules="emailRules"
                    type="email"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.contact_phone"
                    label="Телефон"
                    variant="outlined"
                    placeholder="+7 (999) 123-45-67"
                  />
                </v-col>
              </v-row>
            </v-tabs-window-item>


            <!-- Настройки -->
            <v-tabs-window-item value="settings">
              <v-row>
                <v-col cols="12">
                  <h3 class="mb-4">Лимиты ресурсов</h3>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="formData.max_users"
                    label="Максимум пользователей"
                    type="number"
                    :rules="positiveNumberRules"
                    variant="outlined"
                    min="1"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="formData.max_objects"
                    label="Максимум объектов"
                    type="number"
                    :rules="positiveNumberRules"
                    variant="outlined"
                    min="1"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="formData.storage_quota"
                    label="Квота хранилища (МБ)"
                    type="number"
                    :rules="positiveNumberRules"
                    variant="outlined"
                    min="1"
                  />
                </v-col>

                <v-col cols="12">
                  <v-divider class="my-4" />
                  <h3 class="mb-4">Локализация</h3>
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="formData.language"
                    label="Язык"
                    :items="languageOptions"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="formData.timezone"
                    label="Часовой пояс"
                    :items="timezoneOptions"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="formData.currency"
                    label="Валюта"
                    :items="currencyOptions"
                    variant="outlined"
                  />
                </v-col>

                <v-col cols="12">
                  <v-divider class="my-4" />
                  <h3 class="mb-4">Налоги и сборы</h3>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="formData.default_tax_rate"
                    label="Ставка НДС (%)"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    variant="outlined"
                    hint="От 0 до 100%"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="12" md="8">
                  <v-switch
                    v-model="formData.tax_included"
                    label="НДС включен в цену"
                    color="primary"
                    hint="Итоговая цена указывается с НДС. Влияет на отображение и расчёты."
                    persistent-hint
                  />
                </v-col>

                <!-- Интеграции (только при редактировании) -->
                <template v-if="mode === 'edit'">
                  <v-col cols="12">
                    <v-divider class="my-4" />
                    <h3 class="mb-4">Интеграции</h3>
                  </v-col>
                  
                  <v-col cols="12">
                    <h4 class="mb-3">Axenta.cloud API</h4>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="formData.axetna_login"
                      label="Логин Axenta"
                      variant="outlined"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="formData.axetna_password"
                      label="Пароль Axenta"
                      :type="showPassword ? 'text' : 'password'"
                      :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                      @click:append-inner="showPassword = !showPassword"
                      variant="outlined"
                    />
                  </v-col>

                  <v-col cols="12">
                    <h4 class="mb-3">Битрикс24 (опционально)</h4>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="formData.bitrix24_webhook_url"
                      label="URL вебхука Битрикс24"
                      variant="outlined"
                      placeholder="https://your-domain.bitrix24.ru/rest/..."
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="formData.bitrix24_client_id"
                      label="Client ID"
                      variant="outlined"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="formData.bitrix24_client_secret"
                      label="Client Secret"
                      :type="showBitrixSecret ? 'text' : 'password'"
                      :append-inner-icon="showBitrixSecret ? 'mdi-eye' : 'mdi-eye-off'"
                      @click:append-inner="showBitrixSecret = !showBitrixSecret"
                      variant="outlined"
                    />
                  </v-col>
                </template>
              </v-row>
            </v-tabs-window-item>
          </v-tabs-window>

          <!-- Ошибки валидации -->
          <v-alert
            v-if="validationErrors.length > 0"
            type="error"
            class="mt-4"
          >
            <ul class="mb-0">
              <li v-for="error in validationErrors" :key="error">{{ error }}</li>
            </ul>
          </v-alert>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeDialog">Отмена</v-btn>
        <v-btn
          color="primary"
          @click="saveCompany"
          :loading="saving"
        >
          {{ mode === 'create' ? 'Создать' : 'Сохранить' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import companiesService from '@/services/companiesService'
import type { Company, CompanyFormData } from '@/types/companies'
import {
    COMPANY_FORM_DEFAULTS,
    COUNTRY_OPTIONS,
    CURRENCY_OPTIONS,
    LANGUAGE_OPTIONS,
    TIMEZONE_OPTIONS
} from '@/types/companies'
import { reactive, ref, watch } from 'vue'

// Props
interface Props {
  modelValue: boolean
  company?: Company | null
  mode: 'create' | 'edit'
}

const props = withDefaults(defineProps<Props>(), {
  company: null
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

// Реактивные данные
const form = ref()
const activeTab = ref('general')
const formData = reactive<CompanyFormData>({ ...COMPANY_FORM_DEFAULTS })
const saving = ref(false)
const showPassword = ref(false)
const showBitrixSecret = ref(false)
const validationErrors = ref<string[]>([])

// Опции для селектов
const languageOptions = LANGUAGE_OPTIONS
const currencyOptions = CURRENCY_OPTIONS
const timezoneOptions = TIMEZONE_OPTIONS
const countryOptions = COUNTRY_OPTIONS

// Правила валидации
const nameRules = [
  (v: string) => !!v || 'Название обязательно для заполнения',
  (v: string) => (v && v.length <= 100) || 'Название не должно превышать 100 символов'
]

const emailRules = [
  (v: string) => !v || /.+@.+\..+/.test(v) || 'Некорректный формат email'
]

const requiredRules = [
  (v: string) => !!v || 'Поле обязательно для заполнения'
]

const integrationRules = [
  // Интеграционные поля не обязательны при создании
]

const positiveNumberRules = [
  (v: number) => v > 0 || 'Значение должно быть больше 0'
]

// Методы
const loadCompanyData = () => {
  if (props.company && props.mode === 'edit') {
    Object.assign(formData, {
      name: props.company.name,
      domain: props.company.domain || '',
      axetna_login: '', // Не загружаем пароли из соображений безопасности
      axetna_password: '',
      
      bitrix24_webhook_url: '',
      bitrix24_client_id: '',
      bitrix24_client_secret: '',
      
      contact_email: props.company.contact_email || '',
      contact_phone: props.company.contact_phone || '',
      contact_person: props.company.contact_person || '',
      
      address: props.company.address || '',
      city: props.company.city || '',
      country: props.company.country || 'Russia',
      
      max_users: props.company.max_users,
      max_objects: props.company.max_objects,
      storage_quota: props.company.storage_quota,
      language: props.company.language,
      timezone: props.company.timezone,
      currency: props.company.currency,
      default_tax_rate: props.company.default_tax_rate || 20,
      tax_included: props.company.tax_included || false
    })
  } else {
    Object.assign(formData, { ...COMPANY_FORM_DEFAULTS })
  }
}

const validateForm = (): boolean => {
  validationErrors.value = companiesService.validateCompanyData(formData, props.mode === 'create')
  return validationErrors.value.length === 0
}

const saveCompany = async () => {
  if (!form.value?.validate()) return
  if (!validateForm()) return

  try {
    saving.value = true
    
    if (props.mode === 'create') {
      await companiesService.createCompany(formData)
    } else if (props.company) {
      await companiesService.updateCompany(props.company.id, formData)
    }
    
    emit('saved')
  } catch (error) {
    console.error('Error saving company:', error)
    validationErrors.value = ['Ошибка сохранения компании. Попробуйте еще раз.']
  } finally {
    saving.value = false
  }
}

const closeDialog = () => {
  emit('update:modelValue', false)
  activeTab.value = 'general'
  validationErrors.value = []
  if (form.value) {
    form.value.reset()
  }
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    loadCompanyData()
  }
})

watch(() => props.company, () => {
  if (props.modelValue) {
    loadCompanyData()
  }
})
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

:deep(.v-tabs) {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

:deep(.v-tabs-window-item) {
  padding-top: 16px;
}

h3 {
  color: rgb(var(--v-theme-on-surface));
  font-weight: 500;
}

.v-alert ul {
  padding-left: 16px;
}
</style>
