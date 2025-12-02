<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-history" class="mr-2" />
      История автоматических снимков
      <v-spacer />
      <v-btn
        icon="mdi-refresh"
        size="small"
        variant="text"
        @click="loadJobs"
        :loading="loading"
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
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { config } from '@/config/env';

interface SnapshotJob {
  id: number;
  job_type: string;
  status: string;
  started_at: string;
  finished_at?: string;
  duration_seconds?: number;
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

const headers = [
  { title: 'ID', key: 'id', width: '60px' },
  { title: 'Статус', key: 'status', width: '120px' },
  { title: 'Тип', key: 'job_type', width: '150px' },
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
  const date = new Date(dateStr);
  return date.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
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

onMounted(() => {
  loadJobs();
  loadStats();
});
</script>

