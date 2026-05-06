<template>
  <div class="wialon-history-settings">
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-chart-timeline-variant" class="mr-2" />
        История объектов Wialon
      </v-card-title>
      <v-card-subtitle>
        On-demand расчёт точной истории Wialon-юнитов через core/get_statistics. Используется в графике на главной.
      </v-card-subtitle>

      <v-card-text>
        <v-alert v-if="settings && !settings.enabled" type="info" variant="tonal" density="compact" class="mb-4">
          Сейчас в графиках Wialon показывается прокси по нашему `created_at` (даёт hockey-stick — резкий скачок когда scheduler впервые увидел юнит). Включи историю и пересчитай за нужный период — получишь реальную кривую.
        </v-alert>

        <div class="d-flex align-center mb-4">
          <v-switch
            v-model="enabledLocal"
            color="success"
            label="Использовать историю в графиках"
            hide-details
            :loading="updating"
            @update:model-value="onToggle"
          />
        </div>

        <v-divider class="mb-4" />

        <h4 class="mb-2 text-subtitle-1 font-weight-bold">Пересчёт истории</h4>
        <v-row align="center">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="fromDate"
              label="С даты"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="running"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="toDate"
              label="По дату"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="running"
            />
          </v-col>
          <v-col cols="12" md="4" class="d-flex">
            <v-btn
              color="primary"
              :loading="starting"
              :disabled="running || !fromDate || !toDate"
              @click="startBackfill"
            >
              <v-icon start>mdi-play</v-icon>
              {{ running ? 'Идёт пересчёт...' : 'Запустить пересчёт' }}
            </v-btn>
          </v-col>
        </v-row>

        <div v-if="progress" class="mt-4">
          <v-progress-linear
            :model-value="progressPercent"
            :indeterminate="running && progressPercent === 0"
            color="primary"
            height="8"
            rounded
            class="mb-2"
          />
          <div class="d-flex justify-space-between text-caption">
            <span>
              Подключения: {{ progress.processed_connections }} / {{ progress.total_connections }}
              <template v-if="progress.total_resources > 0">
                · Ресурсы: {{ progress.processed_resources }} / {{ progress.total_resources }}
              </template>
            </span>
            <span><b>{{ progress.rows_upserted }}</b> записей</span>
          </div>
          <div v-if="progress.error" class="text-caption text-error mt-1">
            <v-icon size="14" class="mr-1">mdi-alert</v-icon>
            {{ progress.error }}
          </div>
          <div v-if="progress.finished_at && !running" class="text-caption text-success mt-1">
            <v-icon size="14" class="mr-1">mdi-check-circle</v-icon>
            Завершено за {{ durationText }}
          </div>
        </div>

        <div v-if="settings?.last_backfill_at" class="mt-3 text-caption text-medium-emphasis">
          Последний пересчёт: {{ formatDate(settings.last_backfill_at) }}
          ({{ formatDate(settings.last_backfill_from!) }} → {{ formatDate(settings.last_backfill_to!) }}),
          <b>{{ settings.last_backfill_rows }}</b> записей
        </div>

        <v-divider class="my-4" />

        <details>
          <summary class="text-caption text-medium-emphasis" style="cursor: pointer">Опасная зона</summary>
          <div class="mt-2">
            <v-btn
              size="small"
              variant="outlined"
              color="error"
              :loading="deleting"
              :disabled="running"
              @click="deleteRange"
            >
              <v-icon start size="16">mdi-delete</v-icon>
              Удалить snapshot'ы за период
            </v-btn>
          </div>
        </details>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { apiClient } from '@/services/api';

interface WialonHistorySettings {
  id: number;
  company_id: number;
  enabled: boolean;
  last_backfill_from: string | null;
  last_backfill_to: string | null;
  last_backfill_at: string | null;
  last_backfill_rows: number;
}

interface BackfillProgress {
  running: boolean;
  company_id: number;
  total_connections: number;
  processed_connections: number;
  total_resources: number;
  processed_resources: number;
  rows_upserted: number;
  from: string;
  to: string;
  started_at: string;
  finished_at?: string;
  error?: string;
}

const settings = ref<WialonHistorySettings | null>(null);
const progress = ref<BackfillProgress | null>(null);
const running = ref(false);
const enabledLocal = ref(false);
const updating = ref(false);
const starting = ref(false);
const deleting = ref(false);

const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
const fromDate = ref(monthAgo);
const toDate = ref(today);

let pollInterval: number | null = null;

const progressPercent = computed(() => {
  if (!progress.value) return 0;
  const total = progress.value.total_connections || 0;
  if (!total) return 0;
  return Math.round((progress.value.processed_connections / total) * 100);
});

const durationText = computed(() => {
  if (!progress.value?.started_at || !progress.value?.finished_at) return '';
  const start = new Date(progress.value.started_at).getTime();
  const end = new Date(progress.value.finished_at).getTime();
  const sec = Math.round((end - start) / 1000);
  if (sec < 60) return `${sec} с`;
  return `${Math.floor(sec / 60)} мин ${sec % 60} с`;
});

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU') + (iso.includes('T') ? ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '');
}

async function loadSettings() {
  try {
    const res = await apiClient.get('/auth/wialon-history/settings');
    settings.value = res.data?.data?.settings;
    progress.value = res.data?.data?.progress;
    running.value = !!res.data?.data?.running;
    enabledLocal.value = !!settings.value?.enabled;
  } catch (e) {
    console.error('loadSettings:', e);
  }
}

async function onToggle(value: boolean | null) {
  updating.value = true;
  try {
    await apiClient.put('/auth/wialon-history/settings', { enabled: !!value });
    if (settings.value) settings.value.enabled = !!value;
  } catch (e) {
    console.error('toggle:', e);
    enabledLocal.value = !value; // revert
  } finally {
    updating.value = false;
  }
}

async function startBackfill() {
  starting.value = true;
  try {
    await apiClient.post('/auth/wialon-history/backfill', {
      from: fromDate.value,
      to: toDate.value,
    });
    running.value = true;
    startPolling();
  } catch (e: any) {
    alert('Ошибка: ' + (e.response?.data?.error || e.message));
  } finally {
    starting.value = false;
  }
}

async function pollProgress() {
  try {
    const res = await apiClient.get('/auth/wialon-history/progress');
    progress.value = res.data?.data?.progress;
    running.value = !!res.data?.data?.running;
    if (!running.value && pollInterval) {
      stopPolling();
      // обновим settings (last_backfill_*)
      loadSettings();
    }
  } catch (e) {
    console.error('poll:', e);
  }
}

function startPolling() {
  if (pollInterval) return;
  pollInterval = window.setInterval(pollProgress, 2000);
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

async function deleteRange() {
  if (!confirm(`Удалить wialon-snapshot'ы с ${fromDate.value} по ${toDate.value}?`)) return;
  deleting.value = true;
  try {
    const res = await apiClient.delete(`/auth/wialon-history/snapshots`, {
      params: { from: fromDate.value, to: toDate.value },
    });
    alert(`Удалено: ${res.data.deleted} записей`);
    loadSettings();
  } catch (e: any) {
    alert('Ошибка: ' + (e.response?.data?.error || e.message));
  } finally {
    deleting.value = false;
  }
}

onMounted(async () => {
  await loadSettings();
  if (running.value) startPolling();
});

onUnmounted(() => stopPolling());
</script>

<style scoped>
.wialon-history-settings details summary {
  list-style: none;
  user-select: none;
}
.wialon-history-settings details summary::-webkit-details-marker {
  display: none;
}
</style>
