<template>
  <div class="integrations-settings">
    <!-- Заголовок и статистика -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h3 class="text-h6 font-weight-bold mb-1">Внешние интеграции</h3>
        <p class="text-body-2 text-medium-emphasis">
          Управление подключениями к внешним системам и сервисам
        </p>
      </div>
      
      <!-- Статистика -->
      <div class="d-flex gap-4">
        <v-chip
          :color="stats.active > 0 ? 'success' : 'grey'"
          variant="elevated"
          size="small"
        >
          <v-icon start>mdi-check-circle</v-icon>
          Активных: {{ stats.active }}
        </v-chip>
        <v-chip
          :color="stats.errors > 0 ? 'error' : 'grey'"
          variant="elevated"
          size="small"
        >
          <v-icon start>mdi-alert-circle</v-icon>
          Ошибок: {{ stats.errors }}
        </v-chip>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-4 text-body-2">Загрузка интеграций...</p>
    </div>

    <!-- Список интеграций -->
    <div v-else>
      <v-row>
        <v-col
          v-for="integration in integrations"
          :key="integration.id"
          cols="12"
          md="6"
        >
          <v-card
            class="integration-card"
            :class="{ 
              'integration-card--active': integration.enabled,
              'integration-card--demo': isDemoIntegration(integration.id)
            }"
            elevation="2"
          >
            <!-- Заголовок карточки -->
            <v-card-title class="d-flex align-center justify-space-between">
              <div class="d-flex align-center gap-3">
                <v-avatar
                  :color="getIntegrationColor(integration.type)"
                  size="40"
                >
                  <v-icon :icon="getIntegrationIcon(integration.type)" color="white" />
                </v-avatar>
                
                <div>
                  <div class="text-subtitle-1 font-weight-bold">
                    {{ integration.name }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ getIntegrationTypeLabel(integration.type) }}
                  </div>
                </div>
              </div>

              <!-- Статус -->
              <div class="d-flex align-center gap-2">
                <!-- Индикатор "в разработке" для демо интеграций -->
                <v-chip
                  v-if="isDemoIntegration(integration.id)"
                  color="orange"
                  variant="elevated"
                  size="small"
                >
                  <v-icon start size="14">mdi-hammer-wrench</v-icon>
                  В разработке
                </v-chip>
                
                <v-chip
                  :color="getStatusColor(integration.status)"
                  :variant="integration.enabled ? 'elevated' : 'outlined'"
                  size="small"
                >
                  <v-icon
                    start
                    :icon="getStatusIcon(integration.status)"
                    size="14"
                  />
                  {{ getStatusLabel(integration.status) }}
                </v-chip>
              </div>
            </v-card-title>

            <!-- Описание -->
            <v-card-text class="pt-0">
              <p class="text-body-2 mb-3">{{ integration.description }}</p>

              <!-- Дополнительная информация -->
              <div class="d-flex align-center justify-space-between text-caption">
                <span v-if="integration.lastSync" class="text-medium-emphasis">
                  <v-icon size="14" class="me-1">mdi-clock</v-icon>
                  Синхронизация: {{ formatDate(integration.lastSync) }}
                </span>
                
                <span v-if="integration.lastError" class="text-error">
                  <v-icon size="14" class="me-1">mdi-alert</v-icon>
                  {{ integration.lastError }}
                </span>
              </div>
            </v-card-text>

            <!-- Действия -->
            <v-card-actions class="pt-0">
              <v-switch
                v-model="integration.enabled"
                :label="integration.enabled ? 'Включено' : 'Отключено'"
                :disabled="isDemoIntegration(integration.id)"
                color="primary"
                hide-details
                @change="toggleIntegration(integration)"
              />

              <v-spacer />

              <v-btn
                variant="text"
                size="small"
                :disabled="isDemoIntegration(integration.id)"
                @click="testConnection(integration)"
                :loading="testingConnections[integration.id]"
              >
                <v-icon start>mdi-connection</v-icon>
                Тест
              </v-btn>

              <v-btn
                variant="text"
                size="small"
                :disabled="isDemoIntegration(integration.id)"
                @click="editIntegration(integration)"
              >
                <v-icon start>mdi-cog</v-icon>
                Настроить
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Диалог настройки интеграции -->
    <v-dialog v-model="editDialog.show" max-width="600" scrollable>
      <v-card v-if="editDialog.integration">
        <v-card-title class="d-flex align-center gap-3">
          <v-avatar
            :color="getIntegrationColor(editDialog.integration.type)"
            size="32"
          >
            <v-icon :icon="getIntegrationIcon(editDialog.integration.type)" color="white" size="18" />
          </v-avatar>
          Настройка: {{ editDialog.integration.name }}
        </v-card-title>

        <v-divider />

        <v-card-text class="py-4">
          <!-- Общие настройки -->
          <v-text-field
            v-model="editDialog.form.name"
            label="Название"
            variant="outlined"
            class="mb-3"
          />
          
          <v-textarea
            v-model="editDialog.form.description"
            label="Описание"
            variant="outlined"
            rows="2"
            class="mb-4"
          />

          <!-- Специфичные настройки для каждого типа интеграции -->
          <div v-if="editDialog.integration.type === 'axenta'">
            <h4 class="text-subtitle-1 font-weight-bold mb-3">Настройки Axenta API</h4>
            
            <v-text-field
              v-model="editDialog.form.settings.api_url"
              label="URL API"
              variant="outlined"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.username"
              label="Имя пользователя"
              variant="outlined"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.password"
              label="Пароль"
              type="password"
              variant="outlined"
              class="mb-3"
            />
            
            <!-- Поле для отображения токена -->
            <v-text-field
              v-model="currentToken"
              label="Токен авторизации"
              :type="showToken ? 'text' : 'password'"
              variant="outlined"
              readonly
              class="mb-2"
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
                  :disabled="!currentToken"
                >
                  <v-icon>mdi-content-copy</v-icon>
                </v-btn>
              </template>
            </v-text-field>
            
            <v-text-field
              v-model.number="editDialog.form.settings.sync_interval"
              label="Интервал синхронизации (минуты)"
              type="number"
              variant="outlined"
              class="mb-3"
            />
            
            <v-switch
              v-model="editDialog.form.settings.auto_sync_enabled"
              label="Автоматическая синхронизация"
              color="primary"
            />
          </div>

          <div v-if="editDialog.integration.type === 'bitrix24'">
            <h4 class="text-subtitle-1 font-weight-bold mb-3">Настройки Битрикс24</h4>
            
            <v-text-field
              v-model="editDialog.form.settings.domain"
              label="Домен Битрикс24"
              variant="outlined"
              placeholder="company.bitrix24.ru"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.client_id"
              label="Client ID"
              variant="outlined"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.client_secret"
              label="Client Secret"
              type="password"
              variant="outlined"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.webhook_url"
              label="Webhook URL"
              variant="outlined"
              class="mb-3"
            />
            
            <div class="mb-3">
              <h5 class="text-subtitle-2 mb-2">Синхронизация данных</h5>
              <v-switch
                v-model="editDialog.form.settings.sync_contacts"
                label="Синхронизировать контакты"
                color="primary"
                class="mb-1"
              />
              <v-switch
                v-model="editDialog.form.settings.sync_deals"
                label="Синхронизировать сделки"
                color="primary"
                class="mb-1"
              />
              <v-switch
                v-model="editDialog.form.settings.sync_companies"
                label="Синхронизировать компании"
                color="primary"
              />
            </div>
          </div>

          <div v-if="editDialog.integration.type === '1c'">
            <h4 class="text-subtitle-1 font-weight-bold mb-3">Настройки 1С</h4>
            
            <v-text-field
              v-model="editDialog.form.settings.server_url"
              label="URL сервера 1С"
              variant="outlined"
              placeholder="http://1c-server:8080/accounting/hs/api"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.database_name"
              label="Имя базы данных"
              variant="outlined"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.username"
              label="Имя пользователя"
              variant="outlined"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.password"
              label="Пароль"
              type="password"
              variant="outlined"
              class="mb-3"
            />
            
            <v-select
              v-model="editDialog.form.settings.export_format"
              label="Формат экспорта"
              :items="[
                { value: 'xml', title: 'XML' },
                { value: 'json', title: 'JSON' }
              ]"
              variant="outlined"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.export_schedule"
              label="Расписание экспорта (cron)"
              variant="outlined"
              placeholder="0 0 9 * * MON-FRI"
              class="mb-3"
            />
          </div>

          <div v-if="editDialog.integration.type === 'telegram'">
            <div class="d-flex align-center justify-space-between mb-3">
              <h4 class="text-subtitle-1 font-weight-bold mb-0">Настройки Telegram Bot</h4>
              <v-btn
                variant="text"
                size="small"
                :href="`${config.backendUrl}/api/docs/telegram`"
                target="_blank"
                rel="noopener noreferrer"
              >
                <v-icon start size="16">mdi-help-circle-outline</v-icon>
                Инструкция
              </v-btn>
            </div>
            
            <v-alert
              type="info"
              variant="tonal"
              class="mb-4"
              icon="mdi-information"
            >
              <div class="text-body-2">
                <strong>Как получить токен:</strong> Создайте бота через <a href="https://t.me/botfather" target="_blank" rel="noopener noreferrer">@BotFather</a> в Telegram и получите токен.
                <br>
                <a :href="`${config.backendUrl}/api/docs/telegram`" target="_blank" rel="noopener noreferrer" class="mt-1 d-inline-block">
                  Подробная инструкция по настройке →
                </a>
              </div>
            </v-alert>
            
            <v-text-field
              v-model="editDialog.form.settings.bot_token"
              label="Bot Token"
              :type="showToken ? 'text' : 'password'"
              variant="outlined"
              hint="Токен бота, полученный от @BotFather в Telegram"
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
              </template>
            </v-text-field>
            
            <v-text-field
              v-model="editDialog.form.settings.default_chat_id"
              label="Chat ID (по умолчанию)"
              variant="outlined"
              hint="ID чата или канала для отправки уведомлений (опционально)"
              persistent-hint
              class="mb-3"
            />
            
            <v-select
              v-model="editDialog.form.settings.parse_mode"
              label="Режим парсинга"
              :items="[
                { value: 'HTML', title: 'HTML' },
                { value: 'Markdown', title: 'Markdown' },
                { value: 'MarkdownV2', title: 'MarkdownV2' }
              ]"
              variant="outlined"
              class="mb-3"
            />
            
            <v-switch
              v-model="editDialog.form.settings.disable_notifications"
              label="Отключить уведомления"
              color="primary"
              class="mb-3"
            />
            
            <div class="mb-3">
              <h5 class="text-subtitle-2 mb-2">Тихие часы</h5>
              <v-row>
                <v-col cols="6">
                  <v-text-field
                    v-model="editDialog.form.settings.silent_hours_start"
                    label="Начало"
                    type="time"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="editDialog.form.settings.silent_hours_end"
                    label="Окончание"
                    type="time"
                    variant="outlined"
                  />
                </v-col>
              </v-row>
            </div>
          </div>

          <div v-if="editDialog.integration.type === 'novaconnect'">
            <v-alert
              type="info"
              variant="tonal"
              class="mb-4"
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

            <h4 class="text-subtitle-1 font-weight-bold mb-3">Настройки NovaConnect API</h4>
            
            <v-text-field
              v-model="editDialog.form.settings.api_url"
              label="URL API"
              variant="outlined"
              hint="Базовый URL API NovaConnect"
              persistent-hint
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.token"
              label="Токен авторизации"
              :type="showToken ? 'text' : 'password'"
              variant="outlined"
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
                  :disabled="!editDialog.form.settings.token"
                >
                  <v-icon>mdi-content-copy</v-icon>
                </v-btn>
              </template>
            </v-text-field>
            
            <v-select
              v-model="editDialog.form.settings.language"
              label="Язык ответов API"
              :items="[
                { title: 'Русский', value: 'ru' },
                { title: 'English', value: 'en' }
              ]"
              variant="outlined"
              hint="Язык для ответов API (ru или en)"
              persistent-hint
              class="mb-3"
            />

            <v-divider class="my-4" />

            <h5 class="text-subtitle-2 font-weight-bold mb-3">Webhook настройки</h5>
            
            <v-text-field
              v-model="editDialog.form.settings.webhook_url"
              label="URL для получения webhook уведомлений"
              variant="outlined"
              hint="URL, на который будут приходить уведомления о событиях (опционально)"
              persistent-hint
              class="mb-3"
            />
            
            <v-switch
              v-model="editDialog.form.settings.webhook_enabled"
              label="Включить webhook уведомления"
              color="primary"
              hide-details
              class="mb-3"
            />

            <v-divider class="my-4" />

            <h5 class="text-subtitle-2 font-weight-bold mb-3">Настройки синхронизации</h5>
            
            <v-text-field
              v-model.number="editDialog.form.settings.sync_interval"
              label="Интервал синхронизации (минуты)"
              type="number"
              variant="outlined"
              hint="Как часто синхронизировать данные с NovaConnect"
              persistent-hint
              class="mb-3"
            />
            
            <v-switch
              v-model="editDialog.form.settings.auto_sync_enabled"
              label="Автоматическая синхронизация"
              color="primary"
              hide-details
            />
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn @click="editDialog.show = false">Отмена</v-btn>
          <v-btn
            color="primary"
            @click="saveIntegration"
            :loading="editDialog.saving"
          >
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
import { config } from '@/config/env';
import type {
    IntegrationWithSettings,
    AxentaIntegrationSettings
} from '@/types/settings';
import { computed, onMounted, ref } from 'vue';

// Реактивные данные
const loading = ref(false);
const integrations = ref<IntegrationWithSettings[]>([]);
const testingConnections = ref<Record<string, boolean>>({});

const editDialog = ref({
  show: false,
  integration: null as IntegrationWithSettings | null,
  form: {
    name: '',
    description: '',
    settings: {} as any
  },
  saving: false
});

const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000
});

// Переменные для управления токеном
const showToken = ref(false);
const currentToken = ref('');

// Вычисляемые свойства
const stats = computed(() => {
  const active = integrations.value.filter(i => i.status === 'active').length;
  const errors = integrations.value.filter(i => i.status === 'error').length;
  
  return { active, errors };
});

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
    minute: '2-digit'
  }).format(new Date(date));
};

const getIntegrationIcon = (type: string) => {
  const icons = {
    axenta: 'mdi-cloud',
    novaconnect: 'mdi-sim',
    bitrix24: 'mdi-briefcase',
    '1c': 'mdi-database',
    telegram: 'mdi-telegram',
    email: 'mdi-email',
    sms: 'mdi-message-text'
  };
  return icons[type as keyof typeof icons] || 'mdi-connection';
};

const getIntegrationColor = (type: string) => {
  const colors = {
    axenta: 'blue',
    novaconnect: 'indigo',
    bitrix24: 'orange',
    '1c': 'green',
    telegram: 'cyan',
    email: 'purple',
    sms: 'teal'
  };
  return colors[type as keyof typeof colors] || 'primary';
};

const getIntegrationTypeLabel = (type: string) => {
  const labels = {
    axenta: 'Axenta Cloud',
    novaconnect: 'NovaConnect API',
    bitrix24: 'Битрикс24',
    '1c': '1С:Предприятие',
    telegram: 'Telegram Bot',
    email: 'Email SMTP',
    sms: 'SMS Gateway'
  } as any;
  return labels[type] || type;
};

const getStatusColor = (status: string) => {
  const colors = {
    active: 'success',
    inactive: 'grey',
    error: 'error',
    connecting: 'warning',
    disconnected: 'error'
  } as any;
  return colors[status] || 'grey';
};

const getStatusIcon = (status: string) => {
  const icons = {
    active: 'mdi-check-circle',
    inactive: 'mdi-pause-circle',
    error: 'mdi-alert-circle',
    connecting: 'mdi-loading',
    disconnected: 'mdi-close-circle'
  } as any;
  return icons[status] || 'mdi-help-circle';
};

const getStatusLabel = (status: string) => {
  const labels = {
    active: 'Активна',
    inactive: 'Неактивна',
    error: 'Ошибка',
    connecting: 'Подключение',
    disconnected: 'Отключена'
  } as any;
  return labels[status] || status;
};

// Проверка, является ли интеграция демо (в разработке)
const isDemoIntegration = (integrationId: string) => {
  // Telegram больше не является демо интеграцией
  if (integrationId === 'telegram' || integrationId === 'telegram-new') {
    return false;
  }
  return integrationId.includes('-demo');
};

const loadIntegrations = async () => {
  loading.value = true;
  try {
    // Создаем список интеграций с демо данными
    const allIntegrations: IntegrationWithSettings[] = [];
    
    // Пытаемся загрузить Axenta интеграцию
    let axentaIntegration = null;
    try {
      axentaIntegration = await settingsService.getAxentaIntegrationConfig();
    } catch (error) {
      // Игнорируем ошибки - интеграция просто не настроена
      // Не логируем, чтобы не засорять консоль
    }
    
    // Axenta Cloud API (реальная интеграция)
    if (axentaIntegration) {
      allIntegrations.push(axentaIntegration);
    } else {
      // Если интеграция не настроена, добавляем заглушку для настройки
      allIntegrations.push({
        id: 'axenta-new',
        type: 'axenta',
        name: 'Axenta Cloud API',
        description: 'Основная интеграция с облачным сервисом Axenta для синхронизации объектов мониторинга',
        status: 'inactive',
        enabled: false,
        lastSync: null,
        created_at: new Date(),
        updated_at: new Date(),
        settings: {
          api_url: 'https://api.axenta.cloud',
          username: '',
          password: '',
          sync_interval: 15,
          auto_sync_enabled: false,
          retry_attempts: 3,
          timeout: 30,
        },
      });
    }
    
      // NovaConnect интеграция - загружаем из БД
      try {
        const novaConnectConfig = await settingsService.getNovaConnectConfig();
        
        if (novaConnectConfig) {
          // Настройки найдены в БД
          allIntegrations.push({
            id: 'novaconnect',
            type: 'novaconnect',
            name: 'NovaConnect',
            description: 'Интеграция с API NovaConnect для управления SIM-картами, счетами и отчетами',
            // Статус активен только если есть токен И интеграция включена
            status: (novaConnectConfig.token && novaConnectConfig.enabled) ? 'active' : 'inactive',
            enabled: novaConnectConfig.enabled || false,
            lastSync: null,
            created_at: new Date(),
            updated_at: new Date(),
            settings: {
              api_url: novaConnectConfig.api_url || 'https://api.novaconnect.kz/api',
              language: novaConnectConfig.language || 'ru',
              enabled: novaConnectConfig.enabled || false,
              webhook_url: novaConnectConfig.webhook_url || '',
              webhook_enabled: novaConnectConfig.webhook_enabled || false,
              sync_interval: novaConnectConfig.sync_interval || 15,
              auto_sync_enabled: novaConnectConfig.auto_sync_enabled || false,
              token: (novaConnectConfig as any).token || '', // Токен из БД
            },
          });
        } else {
          // Настройки не найдены в БД — добавляем пустую форму (без использования localStorage)
          allIntegrations.push({
            id: 'novaconnect',
            type: 'novaconnect',
            name: 'NovaConnect',
            description: 'Интеграция с API NovaConnect для управления SIM-картами, счетами и отчетами',
            status: 'inactive',
            enabled: false,
            lastSync: null,
            created_at: new Date(),
            updated_at: new Date(),
            settings: {
              api_url: 'https://api.novaconnect.kz/api',
              token: '',
              language: 'ru',
              enabled: false,
              webhook_url: '',
              webhook_enabled: false,
              sync_interval: 15,
              auto_sync_enabled: false,
            },
          });
        }
      } catch (error) {
        console.error('Ошибка загрузки настроек NovaConnect из БД:', error);
        // При ошибке сервера показываем пустую форму без использования localStorage
        allIntegrations.push({
          id: 'novaconnect',
          type: 'novaconnect',
          name: 'NovaConnect',
          description: 'Интеграция с API NovaConnect для управления SIM-картами, счетами и отчетами',
          status: 'inactive',
          enabled: false,
          lastSync: null,
          created_at: new Date(),
          updated_at: new Date(),
          settings: {
            api_url: 'https://api.novaconnect.kz/api',
            token: '',
            language: 'ru',
            enabled: false,
            webhook_url: '',
            webhook_enabled: false,
            sync_interval: 15,
            auto_sync_enabled: false,
          },
        });
      }
    
    // Демо интеграции (в разработке)
    allIntegrations.push({
      id: 'bitrix24-demo',
      type: 'bitrix24',
      name: 'Битрикс24 CRM',
      description: 'Интеграция с системой Битрикс24 для синхронизации контактов и сделок',
      status: 'inactive',
      enabled: false,
      lastSync: null,
      created_at: new Date('2024-01-01T10:00:00'),
      updated_at: new Date('2024-01-15T14:30:00'),
      settings: {
        domain: 'company.bitrix24.ru',
        client_id: '*********************',
        client_secret: '*********************',
        webhook_url: 'https://webhook.example.com/bitrix24',
        sync_contacts: true,
        sync_deals: true,
        sync_companies: false,
      },
    });
    
    allIntegrations.push({
      id: '1c-demo',
      type: '1c',
      name: '1С:Предприятие',
      description: 'Интеграция с системой 1С для обмена данными о платежах и контрагентах',
      status: 'inactive',
      enabled: false,
      lastSync: null,
      created_at: new Date('2024-01-01T10:00:00'),
      updated_at: new Date('2024-01-15T14:30:00'),
      settings: {
        server_url: 'http://1c-server:8080/accounting/hs/api',
        database_name: 'company_db',
        username: '1c_user',
        password: '*********************',
        organization_code: 'ORG001',
        bank_account_code: 'BANK001',
        payment_type_code: 'PAY001',
        contract_type_code: 'CONTRACT001',
        currency_code: 'RUB',
        auto_export_enabled: false,
        auto_import_enabled: false,
        sync_interval: 60,
      },
    });
    
    // Telegram интеграция - загружаем из БД
    try {
      const telegramConfig = await settingsService.getTelegramConfig();
      
      if (telegramConfig) {
        // Настройки найдены в БД
        allIntegrations.push({
          id: 'telegram',
          type: 'telegram',
          name: 'Telegram Bot',
          description: 'Интеграция с Telegram для отправки уведомлений пользователям',
          // Статус активен только если есть токен И интеграция включена
          status: (telegramConfig.bot_token && telegramConfig.is_active) ? 'active' : 'inactive',
          enabled: telegramConfig.is_active || false,
          lastSync: null,
          created_at: new Date(),
          updated_at: new Date(),
          settings: {
            bot_token: telegramConfig.bot_token || '',
            default_chat_id: telegramConfig.default_chat_id || '',
            parse_mode: telegramConfig.parse_mode || 'HTML',
            disable_notifications: telegramConfig.disable_notifications || false,
            quiet_hours_start: telegramConfig.quiet_hours_start || '',
            quiet_hours_end: telegramConfig.quiet_hours_end || '',
            quiet_hours_enabled: telegramConfig.quiet_hours_enabled || false,
          },
        });
      } else {
        // Настройки не найдены в БД, добавляем заглушку для настройки
        allIntegrations.push({
          id: 'telegram-new',
          type: 'telegram',
          name: 'Telegram Bot',
          description: 'Интеграция с Telegram для отправки уведомлений пользователям',
          status: 'inactive',
          enabled: false,
          lastSync: null,
          created_at: new Date(),
          updated_at: new Date(),
          settings: {
            bot_token: '',
            default_chat_id: '',
            parse_mode: 'HTML',
            disable_notifications: false,
            quiet_hours_start: '22:00',
            quiet_hours_end: '08:00',
            quiet_hours_enabled: false,
          },
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек Telegram из БД:', error);
      // Fallback - добавляем заглушку для настройки
      allIntegrations.push({
        id: 'telegram-new',
        type: 'telegram',
        name: 'Telegram Bot',
        description: 'Интеграция с Telegram для отправки уведомлений пользователям',
        status: 'inactive',
        enabled: false,
        lastSync: null,
        created_at: new Date(),
        updated_at: new Date(),
        settings: {
          bot_token: '',
          default_chat_id: '',
          parse_mode: 'HTML',
          disable_notifications: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          quiet_hours_enabled: false,
        },
      });
    }
    
    allIntegrations.push({
      id: 'email-demo',
      type: 'email',
      name: 'Email SMTP',
      description: 'Интеграция с SMTP сервером для отправки email уведомлений',
      status: 'inactive',
      enabled: false,
      lastSync: null,
      created_at: new Date('2024-01-01T10:00:00'),
      updated_at: new Date('2024-01-15T14:30:00'),
      settings: {
        smtp_host: 'smtp.example.com',
        smtp_port: 587,
        smtp_username: 'noreply@company.com',
        smtp_password: '*********************',
        smtp_from_email: 'noreply@company.com',
        smtp_from_name: 'Axenta CRM',
        smtp_use_tls: true,
        template_language: 'ru',
      },
    });
    
    allIntegrations.push({
      id: 'sms-demo',
      type: 'sms',
      name: 'SMS Gateway',
      description: 'Интеграция с SMS провайдером для отправки SMS уведомлений',
      status: 'inactive',
      enabled: false,
      lastSync: null,
      created_at: new Date('2024-01-01T10:00:00'),
      updated_at: new Date('2024-01-15T14:30:00'),
      settings: {
        provider: 'smsc',
        api_key: '*********************',
        api_secret: '*********************',
        from_number: '+79001234567',
        test_mode: true,
        max_retry_attempts: 3,
        retry_delay_minutes: 5,
      },
    });
    
    integrations.value = allIntegrations;
  } catch (error) {
    console.error('Ошибка загрузки интеграций:', error);
    showSnackbar('Ошибка загрузки интеграций', 'error');
  } finally {
    loading.value = false;
  }
};

const toggleIntegration = async (integration: IntegrationWithSettings) => {
  // Игнорируем демо интеграции
  if (isDemoIntegration(integration.id)) {
    showSnackbar('Эта интеграция находится в разработке', 'warning');
    integration.enabled = false; // Принудительно отключаем
    return;
  }
  
  try {
    if (integration.type === 'telegram') {
      // Для Telegram используем общий метод обновления интеграции
      // enabled управляется через IsActive в модели Integration
      await settingsService.updateIntegration(integration.id, {
        enabled: integration.enabled
      });
      
      // Обновляем статус в списке
      const config = await settingsService.getTelegramConfig();
      if (config) {
        integration.status = (config.bot_token && integration.enabled) ? 'active' : 'inactive';
      } else {
        integration.status = 'inactive';
      }
    } else if (integration.type === 'novaconnect') {
      // Для NovaConnect сохраняем в БД
      const config = await settingsService.getNovaConnectConfig();
      if (config) {
        // Обновляем только поле enabled
        const result = await settingsService.updateNovaConnectIntegration({
          ...config,
          enabled: integration.enabled,
        });
        
        if (result.success) {
          // Обновляем статус на основе актуальной конфигурации из БД
          const refreshed = await settingsService.getNovaConnectConfig();
          integration.status = (refreshed?.token && integration.enabled) ? 'active' : 'inactive';
        } else {
          throw new Error(result.message || 'Ошибка обновления статуса');
        }
      } else {
        // Нет настроек — статус неактивен
        integration.status = 'inactive';
      }
    } else {
      await settingsService.updateIntegration(integration.id, {
        enabled: integration.enabled
      });
    }
    
    showSnackbar(
      `Интеграция ${integration.enabled ? 'включена' : 'отключена'}`,
      'success'
    );
  } catch (error) {
    console.error('Ошибка переключения интеграции:', error);
    // Откатываем изменение
    integration.enabled = !integration.enabled;
    showSnackbar('Ошибка изменения статуса интеграции', 'error');
  }
};

const testConnection = async (integration: IntegrationWithSettings) => {
  // Игнорируем демо интеграции
  if (isDemoIntegration(integration.id)) {
    showSnackbar('Эта интеграция находится в разработке', 'warning');
    return;
  }
  
  testingConnections.value[integration.id] = true;
  
  try {
    let result;
    
    if (integration.type === 'axenta') {
      result = await settingsService.testAxentaConnection(integration.settings as AxentaIntegrationSettings);
    } else if (integration.type === 'telegram') {
      // Тестируем подключение к Telegram Bot API
      result = await settingsService.testTelegramConnection();
      
      if (result.success) {
        showSnackbar(
          `Подключение успешно`,
          'success'
        );
      } else {
        showSnackbar(result.message, 'error');
      }
    } else if (integration.type === 'novaconnect') {
      // Тестируем подключение к API NovaConnect
      const axios = (await import('axios')).default;
      
      // Пытаемся получить токен из БД, если доступен
      let token = integration.settings.token;
      let apiUrl = integration.settings.api_url || 'https://api.novaconnect.kz/api';
      let language = integration.settings.language || 'ru';
      
      if (!token) {
        // Пытаемся загрузить из БД
        try {
          const config = await settingsService.getNovaConnectConfig();
          if (config && config.token) {
            token = config.token;
            apiUrl = config.api_url || apiUrl;
            language = config.language || language;
          }
        } catch (error) {
          // Если не удалось получить конфиг — считаем, что токена нет
          token = '';
        }
      }
      
      if (!token) {
        throw new Error('Токен не указан. Настройте интеграцию и укажите токен.');
      }
      
      const response = await axios.post(
        `${apiUrl}/user/get?lang=${language}`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.code === 200) {
        result = { success: true, message: 'Подключение к API успешно установлено' };
      } else {
        throw new Error('Неверный ответ от API');
      }
    } else {
      // Для других интеграций используем общий метод
      result = await settingsService.testIntegrationConnection(integration.id);
    }
    
    if (result.success) {
      showSnackbar(
        `Подключение успешно`,
        'success'
      );
    } else {
      showSnackbar(result.message, 'error');
    }
  } catch (error: any) {
    console.error('Ошибка тестирования подключения:', error);
    showSnackbar(
      error.response?.data?.message || error.message || 'Ошибка подключения к API',
      'error'
    );
  } finally {
    testingConnections.value[integration.id] = false;
  }
};

const editIntegration = async (integration: IntegrationWithSettings) => {
  // Игнорируем демо интеграции
  if (isDemoIntegration(integration.id)) {
    showSnackbar('Эта интеграция находится в разработке', 'warning');
    return;
  }
  
  // Сбрасываем состояние показа токена
  showToken.value = false;
  
  editDialog.value.integration = integration;
  
  // Загружаем токен и инициализируем форму
  if (integration.type === 'axenta') {
    const token = localStorage.getItem('axenta_token');
    currentToken.value = token || '';
    editDialog.value.form = {
      name: integration.name,
      description: integration.description,
      settings: { ...integration.settings }
    };
        } else if (integration.type === 'telegram') {
          // Загружаем актуальные настройки из БД
          try {
            const config = await settingsService.getTelegramConfig();
            if (config) {
              // Используем настройки из БД
              editDialog.value.form = {
                name: integration.name,
                description: integration.description,
                settings: {
                  bot_token: config.bot_token || '',
                  default_chat_id: config.default_chat_id || '',
                  parse_mode: config.parse_mode || 'HTML',
                  disable_notifications: config.disable_notifications || false,
                  quiet_hours_start: config.quiet_hours_start || '22:00',
                  quiet_hours_end: config.quiet_hours_end || '08:00',
                  quiet_hours_enabled: config.quiet_hours_enabled || false,
                }
              };
            } else {
              // Fallback на настройки из интеграции
              editDialog.value.form = {
                name: integration.name,
                description: integration.description,
                settings: {
                  bot_token: integration.settings.bot_token || '',
                  default_chat_id: integration.settings.default_chat_id || '',
                  parse_mode: integration.settings.parse_mode || 'HTML',
                  disable_notifications: integration.settings.disable_notifications || false,
                  quiet_hours_start: integration.settings.quiet_hours_start || '22:00',
                  quiet_hours_end: integration.settings.quiet_hours_end || '08:00',
                  quiet_hours_enabled: integration.settings.quiet_hours_enabled || false,
                }
              };
            }
          } catch (error) {
            console.error('Ошибка загрузки настроек Telegram из БД:', error);
            // Fallback на настройки из интеграции
            editDialog.value.form = {
              name: integration.name,
              description: integration.description,
              settings: {
                bot_token: integration.settings.bot_token || '',
                default_chat_id: integration.settings.default_chat_id || '',
                parse_mode: integration.settings.parse_mode || 'HTML',
                disable_notifications: integration.settings.disable_notifications || false,
                quiet_hours_start: integration.settings.quiet_hours_start || '22:00',
                quiet_hours_end: integration.settings.quiet_hours_end || '08:00',
                quiet_hours_enabled: integration.settings.quiet_hours_enabled || false,
              }
            };
          }
        } else if (integration.type === 'novaconnect') {
          // Загружаем актуальные настройки из БД
          try {
            const config = await settingsService.getNovaConnectConfig();
            if (config) {
              // Используем настройки из БД
              editDialog.value.form = {
                name: integration.name,
                description: integration.description,
                settings: {
                  api_url: config.api_url || 'https://api.novaconnect.kz/api',
                  token: config.token || '',
                  language: config.language || 'ru',
                  enabled: config.enabled || false,
                  webhook_url: config.webhook_url || '',
                  webhook_enabled: config.webhook_enabled || false,
                  sync_interval: config.sync_interval || 15,
                  auto_sync_enabled: config.auto_sync_enabled || false,
                }
              };
              currentToken.value = config.token || '';
            } else {
              // Fallback на настройки из интеграции (без localStorage)
              currentToken.value = '';
              editDialog.value.form = {
                name: integration.name,
                description: integration.description,
                settings: {
                  api_url: integration.settings.api_url || 'https://api.novaconnect.kz/api',
                  token: integration.settings.token || '',
                  language: integration.settings.language || 'ru',
                  enabled: integration.settings.enabled || false,
                  webhook_url: integration.settings.webhook_url || '',
                  webhook_enabled: integration.settings.webhook_enabled || false,
                  sync_interval: integration.settings.sync_interval || 15,
                  auto_sync_enabled: integration.settings.auto_sync_enabled || false,
                }
              };
            }
          } catch (error) {
            console.error('Ошибка загрузки настроек NovaConnect из БД:', error);
            // Fallback на настройки из интеграции (без localStorage)
            currentToken.value = '';
            editDialog.value.form = {
              name: integration.name,
              description: integration.description,
              settings: {
                api_url: integration.settings.api_url || 'https://api.novaconnect.kz/api',
                token: integration.settings.token || '',
                language: integration.settings.language || 'ru',
                enabled: integration.settings.enabled || false,
                webhook_url: integration.settings.webhook_url || '',
                webhook_enabled: integration.settings.webhook_enabled || false,
                sync_interval: integration.settings.sync_interval || 15,
                auto_sync_enabled: integration.settings.auto_sync_enabled || false,
              }
            };
          }
        } else {
    currentToken.value = '';
    editDialog.value.form = {
      name: integration.name,
      description: integration.description,
      settings: { ...integration.settings }
    };
  }
  
  editDialog.value.show = true;
};

const saveIntegration = async () => {
  if (!editDialog.value.integration) return;
  
  editDialog.value.saving = true;
  
  try {
    let result;
    
    if (editDialog.value.integration.type === 'axenta') {
      // Для Axenta интеграции используем специальные методы
      if (editDialog.value.integration.id === 'axenta-new') {
        // Создаем новую интеграцию
        result = await settingsService.setupAxentaIntegration(editDialog.value.form.settings);
      } else {
        // Обновляем существующую интеграцию
        result = await settingsService.updateAxentaIntegration(editDialog.value.form.settings);
      }
    } else if (editDialog.value.integration.type === 'telegram') {
      // Сохраняем настройки Telegram в БД через API
      const settingsToSave = { ...editDialog.value.form.settings };
      
      // Определяем, создаем новую интеграцию или обновляем существующую
      // Проверяем, есть ли интеграция в БД
      const existingConfig = await settingsService.getTelegramConfig();
      const isNew = !existingConfig;
      
      let result;
      if (isNew) {
        result = await settingsService.setupTelegramIntegration(settingsToSave);
      } else {
        result = await settingsService.updateTelegramIntegration(settingsToSave);
      }
      
      if (result.success) {
        // Обновляем статус интеграции в списке
        const index = integrations.value.findIndex(i => i.id === 'telegram' || i.id === 'telegram-new');
        if (index !== -1) {
          integrations.value[index] = {
            ...integrations.value[index],
            id: 'telegram',
            enabled: settingsToSave.enabled || false,
            status: settingsToSave.bot_token && (settingsToSave.enabled || false) ? 'active' : 'inactive',
            settings: settingsToSave,
          };
        }
        
        editDialog.value.show = false;
        showSnackbar(result.message || 'Настройки Telegram успешно сохранены в БД', 'success');
        // Перезагружаем список интеграций для получения актуальных данных из БД
        await loadIntegrations();
      } else {
        showSnackbar(result.message || 'Ошибка сохранения настроек Telegram', 'error');
      }
      return;
    } else if (editDialog.value.integration.type === 'novaconnect') {
      // Сохраняем настройки NovaConnect в БД через API
      const settingsToSave = { ...editDialog.value.form.settings };
      
      // Определяем, создаем новую интеграцию или обновляем существующую
      // Проверяем, есть ли интеграция в БД
      const existingConfig = await settingsService.getNovaConnectConfig();
      const isNew = !existingConfig;
      
      let result;
      if (isNew) {
        result = await settingsService.setupNovaConnectIntegration(settingsToSave);
      } else {
        result = await settingsService.updateNovaConnectIntegration(settingsToSave);
      }
      
      if (result.success) {
        // Обновляем статус интеграции в списке
        const index = integrations.value.findIndex(i => i.id === 'novaconnect');
        if (index !== -1) {
          integrations.value[index] = {
            ...integrations.value[index],
            enabled: settingsToSave.enabled || false,
            status: settingsToSave.token && settingsToSave.enabled ? 'active' : 'inactive',
            settings: settingsToSave,
          };
        }
        
        editDialog.value.show = false;
        showSnackbar(result.message || 'Настройки NovaConnect успешно сохранены в БД', 'success');
        // Перезагружаем список интеграций для получения актуальных данных из БД
        await loadIntegrations();
      } else {
        showSnackbar(result.message || 'Ошибка сохранения настроек NovaConnect', 'error');
      }
      return;
    } else {
      // Для других интеграций используем общий метод
      const updated = await settingsService.updateIntegration(
        editDialog.value.integration.id,
        editDialog.value.form
      );
      
      // Обновляем в списке
      const index = integrations.value.findIndex(i => i.id === updated.id);
      if (index !== -1) {
        integrations.value[index] = updated;
      }
      
      editDialog.value.show = false;
      showSnackbar('Интеграция успешно обновлена', 'success');
      return;
    }
    
    if (result.success) {
      editDialog.value.show = false;
      showSnackbar(result.message, 'success');
      // Перезагружаем список интеграций
      await loadIntegrations();
    } else {
      showSnackbar(result.message, 'error');
    }
  } catch (error) {
    console.error('Ошибка сохранения интеграции:', error);
    showSnackbar('Ошибка сохранения интеграции', 'error');
  } finally {
    editDialog.value.saving = false;
  }
};

// Метод для копирования токена
const copyToken = async () => {
  try {
    // Для NovaConnect используем токен из формы, для других - из currentToken
    const tokenToCopy = editDialog.value.integration?.type === 'novaconnect' 
      ? editDialog.value.form.settings.token 
      : currentToken.value;
    
    if (!tokenToCopy) {
      showSnackbar('Токен не найден. Сначала войдите в систему.', 'warning');
      return;
    }
    
    // Копируем токен в буфер обмена
    await navigator.clipboard.writeText(tokenToCopy);
    showSnackbar('Токен скопирован в буфер обмена', 'success');
  } catch (error) {
    console.error('Ошибка копирования токена:', error);
    showSnackbar('Ошибка копирования токена', 'error');
  }
};

// Lifecycle
onMounted(() => {
  loadIntegrations();
});
</script>

<style scoped>
.integrations-settings {
  max-width: none;
}

.integration-card {
  transition: all 0.3s ease;
  border-radius: 12px;
  height: 100%;
}

.integration-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.integration-card--active {
  border: 2px solid rgba(var(--v-theme-primary), 0.3);
}

/* Стили для демо интеграций */
.integration-card--demo {
  opacity: 0.7;
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.05) 0%, rgba(255, 193, 7, 0.02) 100%);
}

.integration-card--demo:hover {
  transform: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.integration-card .v-card-title {
  padding-bottom: 8px;
}

.integration-card .v-card-text {
  padding-top: 8px;
}

/* Темная тема */
[data-theme="dark"] .integration-card:hover {
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .integration-card--active {
  border-color: rgba(var(--v-theme-primary), 0.5);
}

/* Убираем выделение с кнопок глазика */
.v-text-field .v-btn--icon {
  outline: none !important;
  box-shadow: none !important;
}

.v-text-field .v-btn--icon:focus {
  outline: none !important;
  box-shadow: none !important;
}

.v-text-field .v-btn--icon:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}

/* Responsive */
@media (max-width: 960px) {
  .integration-card {
    margin-bottom: 16px;
  }
}
</style>
