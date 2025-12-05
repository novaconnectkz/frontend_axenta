<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-history" class="mr-2" />
      История автоматических снимков
      <v-spacer />
      <v-btn
        icon="mdi-cog"
        size="small"
        variant="text"
        @click="showSettingsDialog = true"
        title="Настройки"
      />
      <v-btn
        icon="mdi-delete-sweep"
        size="small"
        variant="text"
        color="error"
        @click="showClearDialog = true"
        title="Очистить историю"
      />
      <v-btn
        color="primary"
        prepend-icon="mdi-database-plus"
        size="small"
        @click="showCreateDialog = true"
        :loading="creating"
      >
        Создать снимки
      </v-btn>
      <v-btn
        icon="mdi-refresh"
        size="small"
        variant="text"
        @click="loadJobs"
        :loading="loading"
        class="ml-2"
      />
    </v-card-title>

    <!-- Статистика -->
    <v-card-text v-if="stats">
      <v-row dense>
        <v-col cols="6" sm="3">
          <v-card variant="tonal" color="blue">
            <v-card-text class="text-center">
              <div class="text-h5 font-weight-bold">{{ stats.total_jobs }}</div>
              <div class="text-caption">Всего задач</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card variant="tonal" color="success">
            <v-card-text class="text-center">
              <div class="text-h5 font-weight-bold">{{ stats.completed_jobs }}</div>
              <div class="text-caption">Успешно</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card variant="tonal" color="error">
            <v-card-text class="text-center">
              <div class="text-h5 font-weight-bold">{{ stats.failed_jobs }}</div>
              <div class="text-caption">Ошибок</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card variant="tonal" color="purple">
            <v-card-text class="text-center">
              <div class="text-h5 font-weight-bold">{{ stats.total_snapshots }}</div>
              <div class="text-caption">Снимков создано</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>

    <v-divider />

    <!-- Таблица задач -->
    <v-card-text>
      <v-data-table
        :headers="headers"
        :items="jobs"
        :loading="loading"
        :items-per-page="itemsPerPage"
        @update:options="loadJobs"
        density="compact"
      >
        <!-- Статус -->
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
            variant="flat"
          >
            {{ getStatusLabel(item.status) }}
          </v-chip>
        </template>

        <!-- Дата снимка -->
        <template v-slot:item.snapshot_date="{ item }">
          <div class="text-body-2">
            {{ formatSnapshotDate(item.date_from, item.date_to) }}
          </div>
        </template>

        <!-- Тип задачи -->
        <template v-slot:item.job_type="{ item }">
          <v-chip size="small" variant="tonal">
            {{ getJobTypeLabel(item.job_type) }}
          </v-chip>
        </template>

        <!-- Дата/время -->
        <template v-slot:item.started_at="{ item }">
          {{ formatDateTime(item.started_at) }}
        </template>

        <!-- Длительность -->
        <template v-slot:item.duration_seconds="{ item }">
          <span v-if="item.duration_seconds">
            {{ formatDuration(item.duration_seconds) }}
          </span>
          <span v-else class="text-grey">—</span>
        </template>

        <!-- Статистика -->
        <template v-slot:item.stats="{ item }">
          <div class="text-caption">
            <div>✓ {{ item.success_count }} / ✗ {{ item.error_count }}</div>
            <div class="text-grey">{{ item.total_contracts }} договоров</div>
            <div class="text-grey" v-if="item.total_objects">
              {{ formatNumber(item.total_objects) }} объектов
            </div>
          </div>
        </template>

        <!-- Действия -->
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-eye"
            size="x-small"
            variant="text"
            @click="showJobDetails(item)"
          />
        </template>
      </v-data-table>
    </v-card-text>

    <!-- Диалог с деталями задачи -->
    <v-dialog v-model="detailsDialog" max-width="900">
      <v-card v-if="selectedJob">
        <v-card-title class="d-flex align-center">
          Детали задачи #{{ selectedJob.id }}
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="detailsDialog = false"
          />
        </v-card-title>

        <v-card-text>
          <!-- Основная информация -->
          <v-row dense>
            <v-col cols="6">
              <div class="text-caption text-grey">Статус</div>
              <v-chip :color="getStatusColor(selectedJob.status)" size="small">
                {{ getStatusLabel(selectedJob.status) }}
              </v-chip>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">Тип задачи</div>
              <div>{{ getJobTypeLabel(selectedJob.job_type) }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">Дата снимка</div>
              <div>{{ formatSnapshotDate(selectedJob.date_from, selectedJob.date_to) }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">Начало</div>
              <div>{{ formatDateTime(selectedJob.started_at) }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">Завершение</div>
              <div v-if="selectedJob.finished_at">
                {{ formatDateTime(selectedJob.finished_at) }}
              </div>
              <div v-else class="text-grey">—</div>
            </v-col>
            <v-col cols="6" v-if="selectedJob.scheduled_time">
              <div class="text-caption text-grey">Запустил</div>
              <div>{{ selectedJob.triggered_by || 'cron' }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">Длительность</div>
              <div v-if="selectedJob.duration_seconds">
                {{ formatDuration(selectedJob.duration_seconds) }}
              </div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">Запустил</div>
              <div>{{ selectedJob.triggered_by || 'system' }}</div>
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <!-- Статистика -->
          <div class="text-subtitle-2 mb-2">Статистика</div>
          <v-row dense>
            <v-col cols="3">
              <div class="text-caption text-grey">Компаний</div>
              <div class="text-h6">{{ selectedJob.total_companies }}</div>
            </v-col>
            <v-col cols="3">
              <div class="text-caption text-grey">Договоров</div>
              <div class="text-h6">{{ selectedJob.total_contracts }}</div>
            </v-col>
            <v-col cols="3">
              <div class="text-caption text-success">Успешно</div>
              <div class="text-h6 text-success">{{ selectedJob.success_count }}</div>
            </v-col>
            <v-col cols="3">
              <div class="text-caption text-error">Ошибок</div>
              <div class="text-h6 text-error">{{ selectedJob.error_count }}</div>
            </v-col>
          </v-row>
          
          <!-- Статистика объектов -->
          <v-row dense class="mt-2" v-if="selectedJob.total_objects">
            <v-col cols="6">
              <div class="text-caption text-grey">Всего объектов</div>
              <div class="text-h6">{{ formatNumber(selectedJob.total_objects) }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">Активных объектов</div>
              <div class="text-h6">{{ formatNumber(selectedJob.active_objects) }}</div>
            </v-col>
          </v-row>

          <!-- Ошибки -->
          <template v-if="selectedJob.details?.errors && selectedJob.details.errors.length > 0">
            <v-divider class="my-4" />
            <div class="text-subtitle-2 mb-2 text-error">
              Ошибки ({{ selectedJob.details.errors.length }})
            </div>
            <v-list density="compact" max-height="300" style="overflow-y: auto;">
              <v-list-item
                v-for="(error, index) in selectedJob.details.errors"
                :key="index"
                class="mb-2"
              >
                <v-list-item-title class="text-caption">
                  <v-icon icon="mdi-alert-circle" color="error" size="small" class="mr-1" />
                  {{ error.message }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  {{ formatDateTime(error.timestamp) }}
                  <span v-if="error.contract_id"> • Договор #{{ error.contract_id }}</span>
                  <span v-if="error.error_type"> • {{ error.error_type }}</span>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </template>

          <!-- Сообщение об ошибке -->
          <template v-if="selectedJob.error_message">
            <v-divider class="my-4" />
            <v-alert type="error" density="compact">
              {{ selectedJob.error_message }}
            </v-alert>
          </template>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="detailsDialog = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог создания снимков за период -->
    <v-dialog v-model="showCreateDialog" max-width="600">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-database-plus" class="mr-2" />
          Создать снимки из Axenta
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="showCreateDialog = false"
          />
        </v-card-title>

        <v-card-text>
          <div class="text-body-2 text-medium-emphasis mb-4">
            Выберите период для запроса данных из Axenta Cloud. Система создаст снимки за каждую дату в указанном периоде.
          </div>

          <v-row>
            <v-col cols="12">
              <v-radio-group v-model="requestMode" inline>
                <v-radio
                  label="Одна дата"
                  value="single"
                  density="compact"
                />
                <v-radio
                  label="Период"
                  value="period"
                  density="compact"
                />
              </v-radio-group>
            </v-col>
          </v-row>

          <!-- Выбор одной даты -->
          <v-row v-if="requestMode === 'single'">
            <v-col cols="12">
              <v-text-field
                v-model="singleDate"
                label="Дата"
                type="date"
                variant="outlined"
                :max="todayDate"
                :rules="[rules.required, rules.dateFormat]"
                hint="Выберите дату для создания снимка"
                persistent-hint
              />
            </v-col>
          </v-row>

          <!-- Выбор периода -->
          <v-row v-if="requestMode === 'period'">
            <v-col cols="6">
              <v-text-field
                v-model="periodStartDate"
                label="Дата начала"
                type="date"
                variant="outlined"
                :max="periodEndDate || todayDate"
                :rules="[rules.required, rules.dateFormat]"
                hint="Начало периода"
                persistent-hint
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="periodEndDate"
                label="Дата окончания"
                type="date"
                variant="outlined"
                :min="periodStartDate"
                :max="todayDate"
                :rules="[rules.required, rules.dateFormat, rules.periodValid]"
                hint="Конец периода"
                persistent-hint
              />
            </v-col>
            <v-col cols="12" v-if="periodDays > 0">
              <v-alert
                type="info"
                density="compact"
                variant="tonal"
              >
                Выбранный период: {{ periodDays }} {{ getDaysLabel(periodDays) }}
              </v-alert>
            </v-col>
          </v-row>

          <v-alert
            v-if="periodDays > 90"
            type="warning"
            density="compact"
            class="mt-2"
          >
            Внимание: период превышает 90 дней. Выберите меньший период.
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showCreateDialog = false"
            :disabled="creating"
          >
            Отмена
          </v-btn>
          <v-btn
            color="primary"
            @click="createSnapshots"
            :loading="creating"
            :disabled="!isFormValid"
          >
            Создать
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог настроек -->
    <v-dialog v-model="showSettingsDialog" max-width="600" @update:model-value="onSettingsDialogOpen">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-cog" class="mr-2" />
          Настройки истории снимков
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="showSettingsDialog = false"
          />
        </v-card-title>

        <v-card-text>
          <div class="text-body-2 text-medium-emphasis mb-4">
            Настройте токен для доступа к Axenta Cloud API. Этот токен будет использоваться для автоматического создания снимков объектов.
          </div>

          <v-text-field
            v-model="settingsForm.axentaToken"
            label="Токен авторизации Axenta"
            :type="showToken ? 'text' : 'password'"
            variant="outlined"
            :rules="[rules.required]"
            hint="Введите токен для доступа к Axenta Cloud API. Нажмите на иконку глаза, чтобы показать/скрыть токен."
            persistent-hint
            :append-inner-icon="showToken ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showToken = !showToken"
            placeholder="Вставьте или введите токен авторизации"
            autocomplete="off"
            class="mb-4"
          />

          <v-switch
            v-model="settingsForm.isActive"
            label="Активна"
            color="primary"
            hint="Включить автоматическое создание снимков"
            persistent-hint
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showSettingsDialog = false"
            :disabled="savingSettings"
          >
            Отмена
          </v-btn>
          <v-btn
            color="primary"
            @click="saveSettings"
            :loading="savingSettings"
            :disabled="!settingsForm.axentaToken"
          >
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог подтверждения очистки -->
    <v-dialog v-model="showClearDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center text-error">
          <v-icon icon="mdi-alert" class="mr-2" />
          Очистить историю снимков
        </v-card-title>

        <v-card-text>
          <div class="text-body-1 mb-4">
            Вы уверены, что хотите удалить <strong>всю</strong> историю автоматических снимков?
          </div>
          <v-alert type="warning" density="compact" class="mb-4">
            Это действие удалит:
            <ul class="mt-2 mb-0">
              <li>Все задачи создания снимков (snapshot_jobs)</li>
              <li>Все ежедневные снимки партнеров (partner_daily_snapshots)</li>
              <li>Все снимки объектов Axenta (axenta_object_snapshots)</li>
              <li>Все снимки аккаунтов Axenta (axenta_account_snapshots)</li>
            </ul>
            <strong>Это действие нельзя отменить!</strong>
          </v-alert>
          <div class="text-caption text-medium-emphasis">
            Для подтверждения введите "ОЧИСТИТЬ" в поле ниже:
          </div>
          <v-text-field
            v-model="clearConfirmText"
            label="Подтверждение"
            variant="outlined"
            class="mt-2"
            :rules="[rules.clearConfirm]"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showClearDialog = false; clearConfirmText = ''"
            :disabled="clearing"
          >
            Отмена
          </v-btn>
          <v-btn
            color="error"
            @click="clearAllHistory"
            :loading="clearing"
            :disabled="clearConfirmText !== 'ОЧИСТИТЬ'"
          >
            Очистить всё
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
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { config } from '@/config/env';
import { settingsService } from '@/services/settingsService';

interface SnapshotJob {
  id: number;
  job_type: string;
  status: string;
  started_at: string;
  finished_at?: string;
  duration_seconds?: number;
  date_from: string; // Дата начала периода снимка
  date_to: string;   // Дата окончания периода снимка
  total_companies: number;
  total_contracts: number;
  success_count: number;
  error_count: number;
  error_message?: string;
  triggered_by?: string;
  details?: {
    errors?: Array<{
      timestamp: string;
      message: string;
      contract_id?: number;
      error_type?: string;
    }>;
  };
}

interface SnapshotJobStats {
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  partial_jobs: number;
  running_jobs: number;
  total_snapshots: number;
  total_errors: number;
  avg_duration_s: number;
  last_job_started_at?: string;
}

const loading = ref(false);
const jobs = ref<SnapshotJob[]>([]);
const stats = ref<SnapshotJobStats | null>(null);
const itemsPerPage = ref(10);
const detailsDialog = ref(false);
const selectedJob = ref<SnapshotJob | null>(null);
const companyTimezone = ref<string>('Europe/Moscow'); // Часовой пояс компании по умолчанию

// Диалог создания снимков
const showCreateDialog = ref(false);
const creating = ref(false);
const requestMode = ref<'single' | 'period'>('single');
const singleDate = ref('');
const periodStartDate = ref('');
const periodEndDate = ref('');

// Диалог настроек
const showSettingsDialog = ref(false);
const savingSettings = ref(false);
const showToken = ref(false);
const settingsForm = ref({
  axentaToken: '',
  isActive: true,
});

// Диалог очистки истории
const showClearDialog = ref(false);
const clearing = ref(false);
const clearConfirmText = ref('');

// Snackbar для уведомлений
const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000
});

const headers = [
  { title: 'ID', key: 'id', width: '60px' },
  { title: 'Статус', key: 'status', width: '120px' },
  { title: 'Тип', key: 'job_type', width: '150px' },
  { title: 'Дата снимка', key: 'snapshot_date', width: '130px' },
  { title: 'Начало', key: 'started_at', width: '180px' },
  { title: 'Длительность', key: 'duration_seconds', width: '120px' },
  { title: 'Статистика', key: 'stats', width: '150px', sortable: false },
  { title: '', key: 'actions', width: '60px', sortable: false },
];

const loadJobs = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('axenta_token');
    const companyData = localStorage.getItem('axenta_company');

    if (!token || !companyData) {
      throw new Error('Отсутствует токен авторизации или информация о компании');
    }

    const company = JSON.parse(companyData);
    const tenantId = company.id;

    const response = await axios.get(`${config.apiBaseUrl}/auth/snapshot-jobs`, {
      headers: {
        'Authorization': `Token ${token}`,
        'X-Tenant-ID': String(tenantId),
      },
      params: {
        limit: 50,
        offset: 0,
      },
    });

    jobs.value = response.data.jobs || [];
  } catch (error) {
    console.error('Ошибка загрузки истории задач:', error);
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    const token = localStorage.getItem('axenta_token');
    const companyData = localStorage.getItem('axenta_company');

    if (!token || !companyData) return;

    const company = JSON.parse(companyData);
    const tenantId = company.id;

    const response = await axios.get(`${config.apiBaseUrl}/auth/snapshot-jobs/stats`, {
      headers: {
        'Authorization': `Token ${token}`,
        'X-Tenant-ID': String(tenantId),
      },
    });

    stats.value = response.data;
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
  }
};

const showJobDetails = (job: SnapshotJob) => {
  selectedJob.value = job;
  detailsDialog.value = true;
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    completed: 'success',
    failed: 'error',
    partial: 'warning',
    running: 'info',
  };
  return colors[status] || 'grey';
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    completed: 'Успешно',
    failed: 'Ошибка',
    partial: 'Частично',
    running: 'Выполняется',
  };
  return labels[status] || status;
};

const getJobTypeLabel = (jobType: string): string => {
  const labels: Record<string, string> = {
    daily_auto: 'Авто (ежедневно)',
    manual: 'Вручную',
    scheduled: 'По расписанию',
  };
  return labels[jobType] || jobType;
};

const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '—';
  try {
    // Создаем дату из строки (предполагается, что это UTC или ISO формат)
    const date = new Date(dateStr);
    
    // Форматируем время с учетом часового пояса компании
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: companyTimezone.value,
    }).format(date);
  } catch (error) {
    console.error('Ошибка форматирования даты:', error);
    return '—';
  }
};

const formatSnapshotDate = (dateFrom: string, dateTo: string): string => {
  if (!dateFrom) return '—';
  try {
    const fromDate = new Date(dateFrom);
    const toDate = dateTo ? new Date(dateTo) : null;
    
    // Если даты одинаковые, показываем одну дату
    if (toDate && fromDate.toDateString() === toDate.toDateString()) {
      return new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: companyTimezone.value,
      }).format(fromDate);
    }
    
    // Если разные даты, показываем диапазон
    if (toDate) {
      const fromStr = new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: companyTimezone.value,
      }).format(fromDate);
      const toStr = new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: companyTimezone.value,
      }).format(toDate);
      return `${fromStr} - ${toStr}`;
    }
    
    // Только одна дата
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: companyTimezone.value,
    }).format(fromDate);
  } catch (error) {
    console.error('Ошибка форматирования даты снимка:', error);
    return '—';
  }
};

const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds} сек`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} мин ${secs} сек`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} ч ${minutes} мин`;
  }
};

const formatNumber = (num: number): string => {
  return num.toLocaleString('ru-RU');
};

// Вычисляемые свойства для валидации формы
const todayDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

const periodDays = computed(() => {
  if (!periodStartDate.value || !periodEndDate.value) return 0;
  const start = new Date(periodStartDate.value);
  const end = new Date(periodEndDate.value);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // +1 потому что включаем обе даты
});

const isFormValid = computed(() => {
  if (requestMode.value === 'single') {
    return singleDate.value !== '' && singleDate.value <= todayDate.value;
  } else {
    return periodStartDate.value !== '' && 
           periodEndDate.value !== '' && 
           periodStartDate.value <= periodEndDate.value &&
           periodEndDate.value <= todayDate.value &&
           periodDays.value <= 90;
  }
});

// Правила валидации
const rules = {
  required: (value: string) => !!value || 'Обязательное поле',
  dateFormat: (value: string) => {
    if (!value) return true;
    const date = new Date(value);
    return !isNaN(date.getTime()) || 'Неверный формат даты';
  },
  periodValid: (value: string) => {
    if (!value || !periodStartDate.value) return true;
    const start = new Date(periodStartDate.value);
    const end = new Date(value);
    return end >= start || 'Дата окончания должна быть позже или равна дате начала';
  },
  clearConfirm: (value: string) => {
    return value === 'ОЧИСТИТЬ' || 'Введите "ОЧИСТИТЬ" для подтверждения';
  },
};

// Загрузка настроек
const loadSettings = async () => {
  try {
    const token = localStorage.getItem('axenta_token');
    const companyData = localStorage.getItem('axenta_company');

    if (!token || !companyData) return;

    const company = JSON.parse(companyData);
    const tenantId = company.id;

    const response = await axios.get(`${config.apiBaseUrl}/auth/snapshot-settings`, {
      headers: {
        'Authorization': `Token ${token}`,
        'X-Tenant-ID': String(tenantId),
      },
    });

    if (response.data.status === 'success' && response.data.settings) {
      const tokenValue = response.data.settings.axenta_token;
      // Загружаем токен в поле (теперь API возвращает полный токен)
      settingsForm.value.axentaToken = tokenValue || '';
      settingsForm.value.isActive = response.data.settings.is_active ?? true;
    }
  } catch (error) {
    console.error('Ошибка загрузки настроек:', error);
  }
};

// Сохранение настроек
const saveSettings = async () => {
  if (!settingsForm.value.axentaToken) {
    showSnackbar('Введите токен авторизации', 'error');
    return;
  }

  savingSettings.value = true;
  try {
    const token = localStorage.getItem('axenta_token');
    const companyData = localStorage.getItem('axenta_company');

    if (!token || !companyData) {
      throw new Error('Отсутствует токен авторизации или информация о компании');
    }

    const company = JSON.parse(companyData);
    const tenantId = company.id;

    const response = await axios.post(
      `${config.apiBaseUrl}/auth/snapshot-settings`,
      {
        axenta_token: settingsForm.value.axentaToken,
        is_active: settingsForm.value.isActive,
      },
      {
        headers: {
          'Authorization': `Token ${token}`,
          'X-Tenant-ID': String(tenantId),
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status === 'success') {
      showSnackbar('Настройки успешно сохранены', 'success');
      showSettingsDialog.value = false;
    } else {
      throw new Error(response.data.message || 'Ошибка сохранения настроек');
    }
  } catch (error: any) {
    console.error('Ошибка сохранения настроек:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Ошибка сохранения настроек';
    showSnackbar(errorMessage, 'error');
  } finally {
    savingSettings.value = false;
  }
};

const getDaysLabel = (days: number): string => {
  if (days === 1) return 'день';
  if (days >= 2 && days <= 4) return 'дня';
  return 'дней';
};

// Очистка всей истории снимков
const clearAllHistory = async () => {
  if (clearConfirmText.value !== 'ОЧИСТИТЬ') {
    showSnackbar('Введите "ОЧИСТИТЬ" для подтверждения', 'error');
    return;
  }

  clearing.value = true;
  try {
    const token = localStorage.getItem('axenta_token');
    const companyData = localStorage.getItem('axenta_company');

    if (!token || !companyData) {
      throw new Error('Отсутствует токен авторизации или информация о компании');
    }

    const company = JSON.parse(companyData);
    const tenantId = company.id;

    const response = await axios.delete(
      `${config.apiBaseUrl}/auth/snapshot-jobs/clear-all`,
      {
        headers: {
          'Authorization': `Token ${token}`,
          'X-Tenant-ID': String(tenantId),
        },
      }
    );

    if (response.data.status === 'success') {
      const deleted = response.data.deleted;
      showSnackbar(
        `История очищена: ${deleted.jobs} задач, ${deleted.partner_snapshots} снимков партнеров, ${deleted.object_snapshots} снимков объектов, ${deleted.account_snapshots} снимков аккаунтов. Всего: ${deleted.total} записей`,
        'success',
        8000
      );
      showClearDialog.value = false;
      clearConfirmText.value = '';
      
      // Обновляем список задач
      setTimeout(() => {
        loadJobs();
        loadStats();
      }, 1000);
    } else {
      throw new Error(response.data.message || 'Ошибка очистки истории');
    }
  } catch (error: any) {
    console.error('Ошибка очистки истории:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Ошибка очистки истории';
    showSnackbar(errorMessage, 'error');
  } finally {
    clearing.value = false;
  }
};

// Создание снимков
const createSnapshots = async () => {
  if (!isFormValid.value) return;

  creating.value = true;
  try {
    const token = localStorage.getItem('axenta_token');
    const companyData = localStorage.getItem('axenta_company');

    if (!token || !companyData) {
      throw new Error('Отсутствует токен авторизации или информация о компании');
    }

    const company = JSON.parse(companyData);
    const tenantId = company.id;

    let requestBody: any = {};

    if (requestMode.value === 'single') {
      requestBody.date = singleDate.value;
    } else {
      requestBody.date_from = periodStartDate.value;
      requestBody.date_to = periodEndDate.value;
    }

    const response = await axios.post(
      `${config.apiBaseUrl}/auth/snapshot-jobs/trigger`,
      requestBody,
      {
        headers: {
          'Authorization': `Token ${token}`,
          'X-Tenant-ID': String(tenantId),
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status === 'success') {
      // Закрываем диалог
      showCreateDialog.value = false;
      
      // Сбрасываем форму
      requestMode.value = 'single';
      singleDate.value = '';
      periodStartDate.value = '';
      periodEndDate.value = '';

      // Показываем сообщение об успехе
      showSnackbar(
        response.data.message || 'Запрос на создание снимков принят. Проверьте историю через несколько минут.',
        'success'
      );
      
      // Обновляем список задач через небольшую задержку
      setTimeout(() => {
        loadJobs();
        loadStats();
      }, 2000);
    } else {
      throw new Error(response.data.message || 'Ошибка создания снимков');
    }
  } catch (error: any) {
    console.error('Ошибка создания снимков:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Ошибка создания снимков';
    showSnackbar(errorMessage, 'error');
  } finally {
    creating.value = false;
  }
};

// Показать snackbar
const showSnackbar = (text: string, color: 'success' | 'error' | 'info' | 'warning' = 'info', timeout: number = 5000) => {
  snackbar.value = {
    show: true,
    text,
    color,
    timeout
  };
};

// Обработчик открытия диалога настроек
const onSettingsDialogOpen = (value: boolean) => {
  if (value) {
    // При открытии диалога загружаем настройки и сбрасываем состояние показа токена
    showToken.value = false;
    loadSettings();
  }
};

// Загрузка часового пояса компании
const loadCompanyTimezone = async () => {
  try {
    const settings = await settingsService.getSystemSettings();
    if (settings && settings.timezone) {
      companyTimezone.value = settings.timezone;
    }
  } catch (error) {
    console.error('Ошибка загрузки часового пояса компании:', error);
    // Используем значение по умолчанию
    companyTimezone.value = 'Europe/Moscow';
  }
};

onMounted(() => {
  loadJobs();
  loadStats();
  loadSettings();
  loadCompanyTimezone();
});
</script>

