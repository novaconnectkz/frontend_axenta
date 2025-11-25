<template>
  <div class="system-settings-form">
    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-4 text-body-2">Загрузка системных настроек...</p>
    </div>

    <!-- Форма настроек -->
    <v-form v-else ref="formRef" @submit.prevent="saveSettings">
      <!-- Общие настройки компании -->
      <div class="settings-section mb-8">
        <h4 class="text-h6 font-weight-bold mb-4 d-flex align-center gap-2">
          <v-icon color="primary">mdi-domain</v-icon>
          Настройки компании
        </h4>
        
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.company_name"
              label="Название компании"
              variant="outlined"
              :rules="[rules.required]"
              class="mb-3"
            />
          </v-col>
          
          <v-col cols="12" md="6">
            <v-file-input
              v-model="logoFile"
              label="Логотип компании"
              variant="outlined"
              accept="image/*"
              prepend-icon="mdi-image"
              @change="handleLogoUpload"
              class="mb-3"
            />
          </v-col>
        </v-row>

        <!-- Превью логотипа -->
        <div v-if="form.company_logo" class="mb-4">
          <v-card class="pa-4" variant="outlined" style="max-width: 200px">
            <div class="text-caption text-medium-emphasis mb-2">Текущий логотип</div>
            <v-img
              :src="form.company_logo"
              :alt="form.company_name"
              height="60"
              contain
            />
          </v-card>
        </div>
      </div>

      <!-- Региональные настройки -->
      <div class="settings-section mb-8">
        <h4 class="text-h6 font-weight-bold mb-4 d-flex align-center gap-2">
          <v-icon color="primary">mdi-earth</v-icon>
          Региональные настройки
        </h4>
        
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.timezone"
              label="Часовой пояс"
              :items="timezoneOptions"
              variant="outlined"
              :rules="[rules.required]"
              class="mb-3"
            />
          </v-col>
          
          <v-col cols="12" md="6">
            <v-select
              v-model="form.language"
              label="Язык системы"
              :items="languageOptions"
              variant="outlined"
              :rules="[rules.required]"
              class="mb-3"
            />
          </v-col>
          
          <v-col cols="12" md="6">
            <v-select
              v-model="form.currency"
              label="Валюта"
              :items="currencyOptions"
              variant="outlined"
              :rules="[rules.required]"
              class="mb-3"
            />
          </v-col>
          
          <v-col cols="12" md="6">
            <v-select
              v-model="form.date_format"
              label="Формат даты"
              :items="dateFormatOptions"
              variant="outlined"
              :rules="[rules.required]"
              class="mb-3"
            />
          </v-col>
        </v-row>
      </div>

      <!-- Налоговые настройки -->
      <div class="settings-section mb-8">
        <h4 class="text-h6 font-weight-bold mb-4 d-flex align-center gap-2">
          <v-icon color="primary">mdi-cash-multiple</v-icon>
          Налоги и сборы
        </h4>
        
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.vat_rate_preset"
              label="Ставка НДС"
              :items="vatRatePresets"
              variant="outlined"
              hint="Выберите стандартную ставку или укажите свою"
              persistent-hint
              class="mb-3"
              @update:model-value="handleVatPresetChange"
            />
          </v-col>
          
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="form.vat_rate_custom"
              label="Своя ставка НДС (%)"
              type="number"
              variant="outlined"
              :disabled="form.vat_rate_preset !== 'custom'"
              :rules="form.vat_rate_preset === 'custom' ? [rules.required, rules.vatRate] : []"
              hint="От 0 до 100%"
              persistent-hint
              class="mb-3"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-switch
              v-model="form.tax_included"
              label="НДС включен в цену"
              color="primary"
              hint="Итоговая цена указывается с НДС. Влияет на отображение и расчёты."
              persistent-hint
              :disabled="form.vat_rate_preset === 'none'"
              class="mb-3"
            />
          </v-col>
        </v-row>

        <v-alert
          v-if="form.vat_rate_preset !== 'none'"
          type="info"
          variant="tonal"
          class="mt-4"
        >
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-information</v-icon>
            <div>
              <strong>Текущая ставка НДС: {{ currentVatRate }}%</strong>
              <div class="text-caption mt-1">
                {{ form.tax_included ? 'НДС будет выделяться из цены' : 'НДС будет начисляться сверх цены' }} при расчете подписок и договоров
              </div>
            </div>
          </div>
        </v-alert>
      </div>

      <!-- Настройки интерфейса -->
      <div class="settings-section mb-8">
        <h4 class="text-h6 font-weight-bold mb-4 d-flex align-center gap-2">
          <v-icon color="primary">mdi-palette</v-icon>
          Интерфейс
        </h4>
        
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.theme"
              label="Тема по умолчанию"
              :items="[
                { value: 'light', title: 'Светлая' },
                { value: 'dark', title: 'Темная' },
                { value: 'auto', title: 'Автоматически' }
              ]"
              variant="outlined"
              :rules="[rules.required]"
              class="mb-3"
            />
          </v-col>
        </v-row>
      </div>

      <!-- Настройки безопасности -->
      <div class="settings-section mb-8">
        <h4 class="text-h6 font-weight-bold mb-4 d-flex align-center gap-2">
          <v-icon color="primary">mdi-shield-check</v-icon>
          Безопасность
        </h4>
        
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="form.session_timeout"
              label="Таймаут сессии (минуты)"
              type="number"
              variant="outlined"
              :rules="[rules.required, rules.positiveNumber]"
              class="mb-3"
            />
          </v-col>
          
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="form.max_login_attempts"
              label="Максимум попыток входа"
              type="number"
              variant="outlined"
              :rules="[rules.required, rules.positiveNumber]"
              class="mb-3"
            />
          </v-col>
          
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="form.password_min_length"
              label="Минимальная длина пароля"
              type="number"
              variant="outlined"
              :rules="[rules.required, rules.positiveNumber]"
              class="mb-3"
            />
          </v-col>
          
          <v-col cols="12" md="6">
            <div class="mt-4">
              <v-switch
                v-model="form.password_require_special"
                label="Требовать специальные символы в пароле"
                color="primary"
              />
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- Настройки уведомлений -->
      <div class="settings-section mb-8">
        <h4 class="text-h6 font-weight-bold mb-4 d-flex align-center gap-2">
          <v-icon color="primary">mdi-bell</v-icon>
          Уведомления
        </h4>
        
        <v-row>
          <v-col cols="12" md="4">
            <v-switch
              v-model="form.email_notifications_enabled"
              label="Email уведомления"
              color="primary"
              class="mb-2"
            />
          </v-col>
          
          <v-col cols="12" md="4">
            <v-switch
              v-model="form.telegram_notifications_enabled"
              label="Telegram уведомления"
              color="primary"
              class="mb-2"
            />
          </v-col>
          
          <v-col cols="12" md="4">
            <v-switch
              v-model="form.sms_notifications_enabled"
              label="SMS уведомления"
              color="primary"
              class="mb-2"
            />
          </v-col>
        </v-row>
      </div>

      <!-- Настройки резервного копирования -->
      <div class="settings-section mb-8">
        <h4 class="text-h6 font-weight-bold mb-4 d-flex align-center gap-2">
          <v-icon color="primary">mdi-backup-restore</v-icon>
          Резервное копирование
        </h4>
        
        <v-row>
          <v-col cols="12" md="6">
            <v-switch
              v-model="form.backup_enabled"
              label="Включить автоматическое резервное копирование"
              color="primary"
              class="mb-3"
            />
          </v-col>
        </v-row>
        
        <v-row v-if="form.backup_enabled">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.backup_schedule"
              label="Расписание (cron)"
              variant="outlined"
              placeholder="0 2 * * *"
              hint="Каждый день в 2:00 ночи"
              persistent-hint
              :rules="[rules.required]"
              class="mb-3"
            />
          </v-col>
          
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="form.backup_retention_days"
              label="Хранить резервные копии (дней)"
              type="number"
              variant="outlined"
              :rules="[rules.required, rules.positiveNumber]"
              class="mb-3"
            />
          </v-col>
        </v-row>
      </div>

      <!-- Кнопки действий -->
      <div class="d-flex justify-end gap-3 mt-8">
        <v-btn
          variant="outlined"
          @click="resetForm"
          :disabled="saving"
        >
          Сбросить
        </v-btn>
        
        <v-btn
          color="primary"
          type="submit"
          :loading="saving"
          prepend-icon="mdi-content-save"
        >
          Сохранить настройки
        </v-btn>
      </div>
    </v-form>

    <!-- Snackbar для уведомлений -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top right"
    >
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { settingsService } from '@/services/settingsService';
import type {
    SystemSettings,
    SystemSettingsForm
} from '@/types/settings';
import { computed, onMounted, ref } from 'vue';

// Реактивные данные
const loading = ref(false);
const saving = ref(false);
const formRef = ref();
const logoFile = ref<File[]>([]);

const form = ref<SystemSettingsForm>({
  company_name: '',
  timezone: 'Europe/Moscow',
  date_format: 'DD.MM.YYYY',
  currency: 'RUB',
  language: 'ru',
  theme: 'light',
  session_timeout: 480,
  password_min_length: 8,
  password_require_special: true,
  max_login_attempts: 5,
  email_notifications_enabled: true,
  sms_notifications_enabled: false,
  telegram_notifications_enabled: true,
  backup_enabled: true,
  backup_schedule: '0 2 * * *',
  backup_retention_days: 30,
  vat_rate_preset: 'russia',
  vat_rate_custom: 20,
  default_tax_rate: 20,
  tax_included: false
});

const originalSettings = ref<SystemSettings | null>(null);

const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000
});

// Опции для селектов
const timezoneOptions = [
  { value: 'Europe/Moscow', title: 'Москва (UTC+3)' },
  { value: 'Europe/Samara', title: 'Самара (UTC+4)' },
  { value: 'Asia/Yekaterinburg', title: 'Екатеринбург (UTC+5)' },
  { value: 'Asia/Omsk', title: 'Омск (UTC+6)' },
  { value: 'Asia/Krasnoyarsk', title: 'Красноярск (UTC+7)' },
  { value: 'Asia/Irkutsk', title: 'Иркутск (UTC+8)' },
  { value: 'Asia/Yakutsk', title: 'Якутск (UTC+9)' },
  { value: 'Asia/Vladivostok', title: 'Владивосток (UTC+10)' },
  { value: 'Asia/Magadan', title: 'Магадан (UTC+11)' },
  { value: 'Asia/Kamchatka', title: 'Петропавловск-Камчатский (UTC+12)' }
];

const languageOptions = [
  { value: 'ru', title: 'Русский' },
  { value: 'en', title: 'English' },
  { value: 'kk', title: 'Қазақша' },
  { value: 'be', title: 'Беларуская' }
];

const currencyOptions = [
  { value: 'RUB', title: '₽ Российский рубль' },
  { value: 'USD', title: '$ Доллар США' },
  { value: 'EUR', title: '€ Евро' },
  { value: 'KZT', title: '₸ Тенге' },
  { value: 'BYN', title: 'Br Белорусский рубль' }
];

const dateFormatOptions = [
  { value: 'DD.MM.YYYY', title: 'ДД.ММ.ГГГГ' },
  { value: 'MM/DD/YYYY', title: 'ММ/ДД/ГГГГ' },
  { value: 'YYYY-MM-DD', title: 'ГГГГ-ММ-ДД' },
  { value: 'DD MMM YYYY', title: 'ДД МММ ГГГГ' }
];

const vatRatePresets = [
  { value: 'russia', title: 'Россия — 20%' },
  { value: 'kazakhstan', title: 'Казахстан — 12%' },
  { value: 'none', title: 'Без НДС' },
  { value: 'custom', title: 'Своя ставка' }
];

// Вычисляемое значение текущей ставки НДС
const currentVatRate = computed(() => {
  switch (form.value.vat_rate_preset) {
    case 'russia':
      return 20
    case 'kazakhstan':
      return 12
    case 'custom':
      return form.value.vat_rate_custom || 0
    default:
      return 0
  }
});

// Правила валидации
const rules = {
  required: (value: any) => !!value || 'Обязательное поле',
  positiveNumber: (value: number) => value > 0 || 'Должно быть положительным числом',
  vatRate: (value: number) => (value >= 0 && value <= 100) || 'Ставка НДС должна быть от 0 до 100%'
};

// Методы
const showSnackbar = (text: string, color = 'info', timeout = 5000) => {
  snackbar.value = { show: true, text, color, timeout };
};

const handleVatPresetChange = (preset: string) => {
  // При выборе предустановленной ставки обновляем custom значение
  if (preset === 'russia') {
    form.value.vat_rate_custom = 20
  } else if (preset === 'kazakhstan') {
    form.value.vat_rate_custom = 12
  } else if (preset === 'none') {
    form.value.vat_rate_custom = 0
  }
};

const loadSettings = async () => {
  loading.value = true;
  try {
    const settings = await settingsService.getSystemSettings();
    originalSettings.value = settings;
    
    // Заполняем форму
    form.value = {
      company_name: settings.company_name,
      timezone: settings.timezone,
      date_format: settings.date_format,
      currency: settings.currency,
      language: settings.language,
      theme: settings.theme,
      session_timeout: settings.session_timeout,
      password_min_length: settings.password_min_length,
      password_require_special: settings.password_require_special,
      max_login_attempts: settings.max_login_attempts,
      email_notifications_enabled: settings.email_notifications_enabled,
      sms_notifications_enabled: settings.sms_notifications_enabled,
      telegram_notifications_enabled: settings.telegram_notifications_enabled,
      backup_enabled: settings.backup_enabled,
      backup_schedule: settings.backup_schedule,
      backup_retention_days: settings.backup_retention_days,
      vat_rate_preset: settings.vat_rate_preset || 'russia',
      vat_rate_custom: settings.vat_rate_custom || 20,
      default_tax_rate: settings.default_tax_rate || 20,
      tax_included: settings.tax_included || false
    };
  } catch (error) {
    console.error('Ошибка загрузки настроек:', error);
    showSnackbar('Ошибка загрузки системных настроек', 'error');
  } finally {
    loading.value = false;
  }
};

const handleLogoUpload = (files: File[]) => {
  if (files.length > 0) {
    const file = files[0];
    
    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      showSnackbar('Пожалуйста, выберите изображение', 'error');
      return;
    }
    
    // Проверяем размер файла (максимум 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showSnackbar('Размер файла не должен превышать 2MB', 'error');
      return;
    }
    
    // Создаем превью
    const reader = new FileReader();
    reader.onload = (e) => {
      if (originalSettings.value) {
        originalSettings.value.company_logo = e.target?.result as string;
      }
    };
    reader.readAsDataURL(file);
  }
};

const saveSettings = async () => {
  // Валидируем форму
  const { valid } = await formRef.value.validate();
  if (!valid) {
    showSnackbar('Пожалуйста, исправьте ошибки в форме', 'error');
    return;
  }
  
  saving.value = true;
  try {
    await settingsService.updateSystemSettings(form.value);
    showSnackbar('Системные настройки сохранены', 'success');
    
    // Перезагружаем настройки
    await loadSettings();
  } catch (error) {
    console.error('Ошибка сохранения настроек:', error);
    showSnackbar('Ошибка сохранения настроек', 'error');
  } finally {
    saving.value = false;
  }
};

const resetForm = () => {
  if (originalSettings.value) {
    form.value = {
      company_name: originalSettings.value.company_name,
      timezone: originalSettings.value.timezone,
      date_format: originalSettings.value.date_format,
      currency: originalSettings.value.currency,
      language: originalSettings.value.language,
      theme: originalSettings.value.theme,
      session_timeout: originalSettings.value.session_timeout,
      password_min_length: originalSettings.value.password_min_length,
      password_require_special: originalSettings.value.password_require_special,
      max_login_attempts: originalSettings.value.max_login_attempts,
      email_notifications_enabled: originalSettings.value.email_notifications_enabled,
      sms_notifications_enabled: originalSettings.value.sms_notifications_enabled,
      telegram_notifications_enabled: originalSettings.value.telegram_notifications_enabled,
      backup_enabled: originalSettings.value.backup_enabled,
      backup_schedule: originalSettings.value.backup_schedule,
      backup_retention_days: originalSettings.value.backup_retention_days,
      vat_rate_preset: originalSettings.value.vat_rate_preset || 'russia',
      vat_rate_custom: originalSettings.value.vat_rate_custom || 20,
      default_tax_rate: originalSettings.value.default_tax_rate || 20,
      tax_included: originalSettings.value.tax_included || false
    };
  }
  
  // Очищаем ошибки валидации
  formRef.value?.resetValidation();
  logoFile.value = [];
  
  showSnackbar('Форма сброшена к исходным значениям', 'info');
};

// Lifecycle
onMounted(() => {
  loadSettings();
});
</script>

<style scoped>
.system-settings-form {
  max-width: none;
}

.settings-section {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgba(var(--v-border-color), 0.12);
}

.settings-section h4 {
  color: rgb(var(--v-theme-primary));
  margin-bottom: 16px;
}

/* Темная тема */
[data-theme="dark"] .settings-section {
  background: rgba(var(--v-theme-surface-variant), 0.2);
  border-color: rgba(var(--v-border-color), 0.2);
}

/* Responsive */
@media (max-width: 960px) {
  .settings-section {
    padding: 16px;
    margin-bottom: 16px;
  }
}
</style>
