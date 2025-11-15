<template>
  <div class="novaconnect-settings">
    <!-- Заголовок и описание -->
    <div class="mb-6">
      <h3 class="text-h6 font-weight-bold mb-2">Интеграция с NovaConnect</h3>
      <p class="text-body-2 text-medium-emphasis">
        Настройка подключения к API NovaConnect для управления SIM-картами, счетами и отчетами
      </p>
    </div>

    <!-- Информационная карточка -->
    <v-alert
      type="info"
      variant="tonal"
      class="mb-6"
      icon="mdi-information"
    >
      <div class="text-body-2">
        <strong>Документация API:</strong>
        <a
          href="https://kb.novaconnect.kz/books/rukovodstvo-razrabotcika"
          target="_blank"
          rel="noopener noreferrer"
          class="ml-1"
        >
          Руководство разработчика NovaConnect
        </a>
      </div>
    </v-alert>

    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-4 text-body-2">Загрузка настроек...</p>
    </div>

    <!-- Форма настроек -->
    <v-form v-else ref="formRef" @submit.prevent="saveSettings">
      <!-- Основные настройки -->
      <div class="settings-section mb-6">
        <h4 class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center gap-2">
          <v-icon color="primary" size="20">mdi-cog</v-icon>
          Основные настройки
        </h4>

        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="form.api_url"
              label="URL API"
              variant="outlined"
              :rules="[rules.required, rules.url]"
              hint="Базовый URL API NovaConnect"
              persistent-hint
              class="mb-3"
            >
              <template #append-inner>
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  @click="testConnection"
                  :loading="testing"
                  :disabled="!form.api_url || !form.token"
                >
                  <v-icon>mdi-connection</v-icon>
                </v-btn>
              </template>
            </v-text-field>
          </v-col>

          <v-col cols="12">
            <v-text-field
              v-model="form.token"
              label="Токен авторизации"
              :type="showToken ? 'text' : 'password'"
              variant="outlined"
              :rules="[rules.required]"
              hint="Bearer токен для авторизации в API. Получить можно в личном кабинете NovaConnect в разделе 'Мой профиль' → 'Токены доступа'"
              persistent-hint
              class="mb-3"
            >
              <template #append-inner>
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  @click="showToken = !showToken"
                  class="mr-1"
                >
                  <v-icon>{{ showToken ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
                </v-btn>
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  @click="copyToken"
                  :disabled="!form.token"
                >
                  <v-icon>mdi-content-copy</v-icon>
                </v-btn>
              </template>
            </v-text-field>
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="form.language"
              label="Язык ответов API"
              :items="languageOptions"
              variant="outlined"
              :rules="[rules.required]"
              hint="Язык для ответов API (ru или en)"
              persistent-hint
              class="mb-3"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-switch
              v-model="form.enabled"
              label="Интеграция включена"
              color="primary"
              hide-details
              class="mb-3"
            />
          </v-col>
        </v-row>
      </div>

      <!-- Дополнительные настройки -->
      <div class="settings-section mb-6">
        <h4 class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center gap-2">
          <v-icon color="primary" size="20">mdi-webhook</v-icon>
          Webhook настройки
        </h4>

        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="form.webhook_url"
              label="URL для получения webhook уведомлений"
              variant="outlined"
              hint="URL, на который будут приходить уведомления о событиях (опционально)"
              persistent-hint
              class="mb-3"
            />
          </v-col>

          <v-col cols="12">
            <v-switch
              v-model="form.webhook_enabled"
              label="Включить webhook уведомления"
              color="primary"
              :disabled="!form.webhook_url"
              hide-details
              class="mb-3"
            />
          </v-col>
        </v-row>
      </div>

      <!-- Настройки синхронизации -->
      <div class="settings-section mb-6">
        <h4 class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center gap-2">
          <v-icon color="primary" size="20">mdi-sync</v-icon>
          Настройки синхронизации
        </h4>

        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="form.sync_interval"
              label="Интервал синхронизации (минуты)"
              type="number"
              variant="outlined"
              :rules="[rules.required, rules.positiveNumber]"
              hint="Как часто синхронизировать данные с NovaConnect"
              persistent-hint
              class="mb-3"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-switch
              v-model="form.auto_sync_enabled"
              label="Автоматическая синхронизация"
              color="primary"
              hide-details
              class="mb-3"
            />
          </v-col>
        </v-row>
      </div>

      <!-- Статус подключения -->
      <div v-if="connectionStatus" class="mb-6">
        <v-alert
          :type="connectionStatus.success ? 'success' : 'error'"
          variant="tonal"
          :icon="connectionStatus.success ? 'mdi-check-circle' : 'mdi-alert-circle'"
        >
          <div class="text-body-2">
            <strong>{{ connectionStatus.success ? 'Подключение успешно' : 'Ошибка подключения' }}</strong>
            <div v-if="connectionStatus.message" class="mt-1">
              {{ connectionStatus.message }}
            </div>
            <div v-if="connectionStatus.lastChecked" class="text-caption mt-2">
              Последняя проверка: {{ formatDate(connectionStatus.lastChecked) }}
            </div>
          </div>
        </v-alert>
      </div>

      <!-- Кнопки действий -->
      <div class="d-flex gap-3 justify-end">
        <v-btn
          variant="outlined"
          @click="testConnection"
          :loading="testing"
          :disabled="!form.api_url || !form.token"
        >
          <v-icon start>mdi-connection</v-icon>
          Проверить подключение
        </v-btn>

        <v-btn
          color="primary"
          @click="saveSettings"
          :loading="saving"
        >
          <v-icon start>mdi-content-save</v-icon>
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
import { ref, onMounted } from 'vue';
import axios from 'axios';

// Типы
interface NovaConnectSettings {
  api_url: string;
  token: string;
  language: 'ru' | 'en';
  enabled: boolean;
  webhook_url?: string;
  webhook_enabled: boolean;
  sync_interval: number;
  auto_sync_enabled: boolean;
}

interface ConnectionStatus {
  success: boolean;
  message?: string;
  lastChecked?: Date;
}

// Реактивные данные
const loading = ref(false);
const saving = ref(false);
const testing = ref(false);
const showToken = ref(false);
const formRef = ref<any>(null);

const form = ref<NovaConnectSettings>({
  api_url: 'https://api.novaconnect.kz/api',
  token: '',
  language: 'ru',
  enabled: false,
  webhook_url: '',
  webhook_enabled: false,
  sync_interval: 15,
  auto_sync_enabled: false,
});

const connectionStatus = ref<ConnectionStatus | null>(null);

const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000,
});

const languageOptions = [
  { title: 'Русский', value: 'ru' },
  { title: 'English', value: 'en' },
];

// Правила валидации
const rules = {
  required: (v: any) => !!v || 'Поле обязательно для заполнения',
  url: (v: string) => {
    if (!v) return true;
    try {
      new URL(v);
      return true;
    } catch {
      return 'Неверный формат URL';
    }
  },
  positiveNumber: (v: number) => {
    if (v === null || v === undefined) return true;
    return v > 0 || 'Значение должно быть больше 0';
  },
};

// Методы
const showSnackbar = (text: string, color = 'info', timeout = 5000) => {
  snackbar.value = { show: true, text, color, timeout };
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

const copyToken = async () => {
  try {
    if (!form.value.token) {
      showSnackbar('Токен не заполнен', 'warning');
      return;
    }

    await navigator.clipboard.writeText(form.value.token);
    showSnackbar('Токен скопирован в буфер обмена', 'success');
  } catch (error) {
    console.error('Ошибка копирования токена:', error);
    showSnackbar('Ошибка копирования токена', 'error');
  }
};

const loadSettings = async () => {
  loading.value = true;
  try {
    // Загружаем настройки из localStorage или API
    const savedSettings = localStorage.getItem('novaconnect_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      form.value = { ...form.value, ...parsed };
    }

    // Загружаем токен отдельно (если есть)
    const savedToken = localStorage.getItem('novaconnect_token');
    if (savedToken) {
      form.value.token = savedToken;
    }

    // Загружаем статус подключения
    const savedStatus = localStorage.getItem('novaconnect_connection_status');
    if (savedStatus) {
      const parsed = JSON.parse(savedStatus);
      connectionStatus.value = {
        ...parsed,
        lastChecked: parsed.lastChecked ? new Date(parsed.lastChecked) : undefined,
      };
    }
  } catch (error) {
    console.error('Ошибка загрузки настроек:', error);
    showSnackbar('Ошибка загрузки настроек', 'error');
  } finally {
    loading.value = false;
  }
};

const testConnection = async () => {
  if (!form.value.api_url || !form.value.token) {
    showSnackbar('Заполните URL API и токен', 'warning');
    return;
  }

  testing.value = true;
  try {
    // Тестируем подключение к API NovaConnect
    // Используем простой запрос для проверки авторизации
    const response = await axios.post(
      `${form.value.api_url}/user/get?lang=${form.value.language}`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${form.value.token}`,
        },
        timeout: 10000,
      }
    );

    if (response.data && response.data.code === 200) {
      connectionStatus.value = {
        success: true,
        message: 'Подключение к API успешно установлено',
        lastChecked: new Date(),
      };
      showSnackbar('Подключение успешно установлено', 'success');
    } else {
      throw new Error('Неверный ответ от API');
    }
  } catch (error: any) {
    console.error('Ошибка подключения:', error);
    connectionStatus.value = {
      success: false,
      message: error.response?.data?.message || error.message || 'Ошибка подключения к API',
      lastChecked: new Date(),
    };
    showSnackbar('Ошибка подключения к API', 'error');
  } finally {
    testing.value = false;
    // Сохраняем статус подключения
    if (connectionStatus.value) {
      localStorage.setItem(
        'novaconnect_connection_status',
        JSON.stringify(connectionStatus.value)
      );
    }
  }
};

const saveSettings = async () => {
  if (!formRef.value) return;

  const { valid } = await formRef.value.validate();
  if (!valid) {
    showSnackbar('Проверьте правильность заполнения полей', 'warning');
    return;
  }

  saving.value = true;
  try {
    // Сохраняем настройки в localStorage
    const settingsToSave = { ...form.value };
    // Не сохраняем токен в общих настройках (он сохраняется отдельно)
    const { token, ...settingsWithoutToken } = settingsToSave;
    
    localStorage.setItem('novaconnect_settings', JSON.stringify(settingsWithoutToken));
    localStorage.setItem('novaconnect_token', form.value.token);

    // Здесь можно добавить сохранение на бэкенд через API
    // await axios.post('/api/settings/novaconnect', settingsToSave);

    showSnackbar('Настройки успешно сохранены', 'success');
  } catch (error) {
    console.error('Ошибка сохранения настроек:', error);
    showSnackbar('Ошибка сохранения настроек', 'error');
  } finally {
    saving.value = false;
  }
};

// Lifecycle
onMounted(() => {
  loadSettings();
});
</script>

<style scoped>
.novaconnect-settings {
  max-width: none;
}

.settings-section {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(var(--v-theme-outline-variant), 0.3);
}

.settings-section h4 {
  margin-bottom: 16px;
}

/* Темная тема */
[data-theme="dark"] .settings-section {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-color: rgba(var(--v-theme-outline-variant), 0.5);
}

/* Responsive */
@media (max-width: 960px) {
  .settings-section {
    padding: 16px;
  }
}
</style>

