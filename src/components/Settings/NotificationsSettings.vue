<template>
  <div class="notifications-settings">
    <!-- Заголовок и статистика -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h3 class="text-h6 font-weight-bold mb-1">Каналы уведомлений</h3>
        <p class="text-body-2 text-medium-emphasis">
          Настройка способов доставки уведомлений пользователям
        </p>
      </div>
      
      <!-- Статистика -->
      <div class="d-flex gap-4">
        <v-chip
          :color="stats.enabled > 0 ? 'success' : 'grey'"
          variant="elevated"
          size="small"
        >
          <v-icon start>mdi-check-circle</v-icon>
          Активных: {{ stats.enabled }}
        </v-chip>
        <v-chip
          color="info"
          variant="elevated"
          size="small"
        >
          <v-icon start>mdi-bell</v-icon>
          Всего: {{ stats.total }}
        </v-chip>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-4 text-body-2">Загрузка каналов уведомлений...</p>
    </div>

    <!-- Список каналов -->
    <div v-else>
      <v-row>
        <v-col
          v-for="channel in channels"
          :key="channel.id"
          cols="12"
          lg="4"
          md="6"
        >
          <v-card
            class="notification-card"
            :class="{ 'notification-card--enabled': channel.enabled }"
            elevation="2"
          >
            <!-- Заголовок карточки -->
            <v-card-title class="d-flex align-center justify-space-between">
              <div class="d-flex align-center gap-3">
                <v-avatar
                  :color="getChannelColor(channel.channel)"
                  size="40"
                >
                  <v-icon :icon="getChannelIcon(channel.channel)" color="white" />
                </v-avatar>
                
                <div>
                  <div class="text-subtitle-1 font-weight-bold">
                    {{ channel.name }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ getChannelLabel(channel.channel) }}
                  </div>
                </div>
              </div>

              <!-- Переключатель -->
              <v-switch
                v-model="channel.enabled"
                color="primary"
                hide-details
                @change="toggleChannel(channel)"
              />
            </v-card-title>

            <!-- События -->
            <v-card-text class="pt-2">
              <div class="mb-3">
                <h4 class="text-subtitle-2 mb-2">Типы событий ({{ channel.events.length }})</h4>
                <div class="d-flex flex-wrap gap-1">
                  <v-chip
                    v-for="event in channel.events.slice(0, 3)"
                    :key="event"
                    size="x-small"
                    variant="outlined"
                    color="primary"
                  >
                    {{ getEventLabel(event) }}
                  </v-chip>
                  <v-chip
                    v-if="channel.events.length > 3"
                    size="x-small"
                    variant="outlined"
                    color="grey"
                  >
                    +{{ channel.events.length - 3 }}
                  </v-chip>
                </div>
              </div>

              <!-- Специфичная информация для каждого канала -->
              <div v-if="channel.channel === 'telegram'" class="channel-info">
                <div class="d-flex align-center gap-2 text-caption text-medium-emphasis">
                  <v-icon size="14">mdi-clock</v-icon>
                  <span v-if="channel.settings.silent_hours_start">
                    Тихие часы: {{ channel.settings.silent_hours_start }} - {{ channel.settings.silent_hours_end }}
                  </span>
                  <span v-else>Тихие часы не настроены</span>
                </div>
              </div>

              <div v-if="channel.channel === 'email'" class="channel-info">
                <div class="d-flex align-center gap-2 text-caption text-medium-emphasis">
                  <v-icon size="14">mdi-server</v-icon>
                  <span>{{ channel.settings.smtp_host }}:{{ channel.settings.smtp_port }}</span>
                </div>
              </div>

              <div v-if="channel.channel === 'sms'" class="channel-info">
                <div class="d-flex align-center gap-2 text-caption text-medium-emphasis">
                  <v-icon size="14">mdi-cellphone</v-icon>
                  <span>{{ channel.settings.provider }} {{ channel.settings.test_mode ? '(тест)' : '' }}</span>
                </div>
              </div>
            </v-card-text>

            <!-- Действия -->
            <v-card-actions class="pt-0">
              <v-btn
                variant="text"
                size="small"
                @click="testChannel(channel)"
                :loading="testingChannels[channel.id]"
                :disabled="!channel.enabled"
              >
                <v-icon start>mdi-send</v-icon>
                Тест
              </v-btn>

              <v-spacer />

              <v-btn
                variant="text"
                size="small"
                @click="editChannel(channel)"
              >
                <v-icon start>mdi-cog</v-icon>
                Настроить
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Диалог настройки канала -->
    <v-dialog v-model="editDialog.show" max-width="700" scrollable>
      <v-card v-if="editDialog.channel">
        <v-card-title class="d-flex align-center gap-3">
          <v-avatar
            :color="getChannelColor(editDialog.channel.channel)"
            size="32"
          >
            <v-icon :icon="getChannelIcon(editDialog.channel.channel)" color="white" size="18" />
          </v-avatar>
          Настройка: {{ editDialog.channel.name }}
        </v-card-title>

        <v-divider />

        <v-card-text class="py-4">
          <!-- Общие настройки -->
          <v-text-field
            v-model="editDialog.form.name"
            label="Название канала"
            variant="outlined"
            class="mb-3"
          />

          <!-- События -->
          <div class="mb-4">
            <h4 class="text-subtitle-1 font-weight-bold mb-3">Типы событий</h4>
            <v-row>
              <v-col
                v-for="event in availableEvents"
                :key="event.value"
                cols="12"
                sm="6"
              >
                <v-checkbox
                  v-model="editDialog.form.events"
                  :value="event.value"
                  :label="event.label"
                  color="primary"
                  hide-details
                />
              </v-col>
            </v-row>
          </div>

          <!-- Специфичные настройки для каждого типа канала -->
          <div v-if="editDialog.channel.channel === 'telegram'">
            <h4 class="text-subtitle-1 font-weight-bold mb-3">Настройки Telegram</h4>
            
            <v-text-field
              v-model="editDialog.form.settings.bot_token"
              label="Bot Token"
              type="password"
              variant="outlined"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.chat_id"
              label="Chat ID"
              variant="outlined"
              hint="ID чата или канала (например: -1001234567890)"
              persistent-hint
              class="mb-3"
            />
            
            <v-select
              v-model="editDialog.form.settings.parse_mode"
              label="Режим парсинга"
              :items="[
                { value: 'HTML', title: 'HTML' },
                { value: 'Markdown', title: 'Markdown' }
              ]"
              variant="outlined"
              class="mb-3"
            />
            
            <v-switch
              v-model="editDialog.form.settings.disable_web_page_preview"
              label="Отключить предварительный просмотр ссылок"
              color="primary"
              class="mb-3"
            />
            
            <div class="mb-3">
              <h5 class="text-subtitle-2 mb-2">Тихие часы</h5>
              <p class="text-caption text-medium-emphasis mb-2">
                Время, когда уведомления не будут отправляться
              </p>
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

          <div v-if="editDialog.channel.channel === 'email'">
            <h4 class="text-subtitle-1 font-weight-bold mb-3">Настройки Email</h4>
            
            <v-row>
              <v-col cols="8">
                <v-text-field
                  v-model="editDialog.form.settings.smtp_host"
                  label="SMTP сервер"
                  variant="outlined"
                  placeholder="smtp.gmail.com"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model.number="editDialog.form.settings.smtp_port"
                  label="Порт"
                  type="number"
                  variant="outlined"
                  placeholder="587"
                />
              </v-col>
            </v-row>
            
            <v-text-field
              v-model="editDialog.form.settings.smtp_username"
              label="Имя пользователя"
              variant="outlined"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.smtp_password"
              label="Пароль"
              type="password"
              variant="outlined"
              class="mb-3"
            />
            
            <v-switch
              v-model="editDialog.form.settings.smtp_secure"
              label="Использовать SSL/TLS"
              color="primary"
              class="mb-3"
            />
            
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="editDialog.form.settings.from_email"
                  label="Email отправителя"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="editDialog.form.settings.from_name"
                  label="Имя отправителя"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </div>

          <div v-if="editDialog.channel.channel === 'sms'">
            <h4 class="text-subtitle-1 font-weight-bold mb-3">Настройки SMS</h4>
            
            <v-select
              v-model="editDialog.form.settings.provider"
              label="Провайдер SMS"
              :items="[
                { value: 'sms_ru', title: 'SMS.RU' },
                { value: 'smsc', title: 'SMSC.RU' },
                { value: 'twilio', title: 'Twilio' }
              ]"
              variant="outlined"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.api_key"
              label="API ключ"
              type="password"
              variant="outlined"
              class="mb-3"
            />
            
            <v-text-field
              v-model="editDialog.form.settings.sender_name"
              label="Имя отправителя"
              variant="outlined"
              hint="Не более 11 символов"
              persistent-hint
              class="mb-3"
            />
            
            <v-switch
              v-model="editDialog.form.settings.test_mode"
              label="Тестовый режим"
              color="primary"
              hint="SMS не будут отправляться реально"
              persistent-hint
            />
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn @click="editDialog.show = false">Отмена</v-btn>
          <v-btn
            color="primary"
            @click="saveChannel"
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
import type {
    NotificationChannelSettings
} from '@/types/settings';
import { computed, onMounted, ref } from 'vue';

// Реактивные данные
const loading = ref(false);
const channels = ref<NotificationChannelSettings[]>([]);
const testingChannels = ref<Record<string, boolean>>({});

const editDialog = ref({
  show: false,
  channel: null as NotificationChannelSettings | null,
  form: {
    name: '',
    events: [] as string[],
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

// Доступные события
const availableEvents = [
  { value: 'installation_created', label: 'Создан монтаж' },
  { value: 'installation_completed', label: 'Монтаж завершен' },
  { value: 'installation_cancelled', label: 'Монтаж отменен' },
  { value: 'low_stock_alert', label: 'Низкий остаток на складе' },
  { value: 'contract_expiring', label: 'Истекает договор' },
  { value: 'payment_overdue', label: 'Просроченный платеж' },
  { value: 'system_error', label: 'Системная ошибка' },
  { value: 'sync_error', label: 'Ошибка синхронизации' }
];

// Вычисляемые свойства
const stats = computed(() => {
  const enabled = channels.value.filter(c => c.enabled).length;
  const total = channels.value.length;
  
  return { enabled, total };
});

// Методы
const showSnackbar = (text: string, color = 'info', timeout = 5000) => {
  snackbar.value = { show: true, text, color, timeout };
};

const getChannelIcon = (channel: string) => {
  const icons = {
    telegram: 'mdi-telegram',
    email: 'mdi-email',
    sms: 'mdi-message-text',
    push: 'mdi-bell'
  };
  return icons[channel as keyof typeof icons] || 'mdi-bell';
};

const getChannelColor = (channel: string) => {
  const colors = {
    telegram: 'cyan',
    email: 'purple',
    sms: 'teal',
    push: 'orange'
  };
  return colors[channel as keyof typeof colors] || 'primary';
};

const getChannelLabel = (channel: string) => {
  const labels = {
    telegram: 'Telegram Bot',
    email: 'Email SMTP',
    sms: 'SMS Gateway',
    push: 'Push-уведомления'
  } as any;
  return labels[channel] || channel;
};

const getEventLabel = (event: string) => {
  const eventObj = availableEvents.find(e => e.value === event);
  return eventObj?.label || event;
};

const loadChannels = async () => {
  loading.value = true;
  try {
    const response = await settingsService.getNotificationChannels();
    channels.value = response.channels;
  } catch (error) {
    console.error('Ошибка загрузки каналов:', error);
    showSnackbar('Ошибка загрузки каналов уведомлений', 'error');
  } finally {
    loading.value = false;
  }
};

const toggleChannel = async (channel: NotificationChannelSettings) => {
  try {
    await settingsService.updateNotificationChannel(channel.id, {
      enabled: channel.enabled
    });
    
    showSnackbar(
      `Канал ${channel.enabled ? 'включен' : 'отключен'}`,
      'success'
    );
  } catch (error) {
    console.error('Ошибка переключения канала:', error);
    // Откатываем изменение
    channel.enabled = !channel.enabled;
    showSnackbar('Ошибка изменения статуса канала', 'error');
  }
};

const testChannel = async (channel: NotificationChannelSettings) => {
  testingChannels.value[channel.id] = true;
  
  try {
    const result = await settingsService.testNotificationChannel(channel.id);
    
    if (result.success) {
      showSnackbar(result.message, 'success');
    } else {
      showSnackbar(result.message, 'error');
    }
  } catch (error) {
    console.error('Ошибка тестирования канала:', error);
    showSnackbar('Ошибка тестирования канала', 'error');
  } finally {
    testingChannels.value[channel.id] = false;
  }
};

const editChannel = (channel: NotificationChannelSettings) => {
  editDialog.value.channel = channel;
  editDialog.value.form = {
    name: channel.name,
    events: [...channel.events],
    settings: { ...channel.settings }
  };
  editDialog.value.show = true;
};

const saveChannel = async () => {
  if (!editDialog.value.channel) return;
  
  editDialog.value.saving = true;
  
  try {
    const updated = await settingsService.updateNotificationChannel(
      editDialog.value.channel.id,
      editDialog.value.form
    );
    
    // Обновляем в списке
    const index = channels.value.findIndex(c => c.id === updated.id);
    if (index !== -1) {
      channels.value[index] = updated;
    }
    
    editDialog.value.show = false;
    showSnackbar('Канал успешно обновлен', 'success');
  } catch (error) {
    console.error('Ошибка сохранения канала:', error);
    showSnackbar('Ошибка сохранения канала', 'error');
  } finally {
    editDialog.value.saving = false;
  }
};

// Lifecycle
onMounted(() => {
  loadChannels();
});
</script>

<style scoped>
.notifications-settings {
  max-width: none;
}

.notification-card {
  transition: all 0.3s ease;
  border-radius: 12px;
  height: 100%;
}

.notification-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.notification-card--enabled {
  border: 2px solid rgba(var(--v-theme-primary), 0.3);
}

.notification-card .v-card-title {
  padding-bottom: 8px;
}

.notification-card .v-card-text {
  padding-top: 8px;
}

.channel-info {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(var(--v-border-color), 0.12);
}

/* Темная тема */
[data-theme="dark"] .notification-card:hover {
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .notification-card--enabled {
  border-color: rgba(var(--v-theme-primary), 0.5);
}

/* Responsive */
@media (max-width: 960px) {
  .notification-card {
    margin-bottom: 16px;
  }
}
</style>
