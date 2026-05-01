<template>
  <div class="notification-logs-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Журнал уведомлений</h1>
        <p class="page-subtitle">История отправок по каналам, статусы и ошибки</p>
      </div>
      <div class="header-actions">
        <v-btn variant="outlined" prepend-icon="mdi-refresh" :loading="loading" @click="reload">
          Обновить
        </v-btn>
      </div>
    </div>

    <!-- Статистика по каналам/статусам -->
    <div class="stats-cards">
      <v-row dense>
        <v-col v-for="row in statsRows" :key="row.channel + '_' + row.status" cols="6" sm="4" md="3" lg="2">
          <v-card class="stat-card" :color="statusColor(row.status)" variant="tonal">
            <v-card-text class="d-flex align-center">
              <v-icon class="mr-2">{{ channelIcon(row.channel) }}</v-icon>
              <div>
                <div class="text-h6">{{ row.count }}</div>
                <div class="text-caption">{{ channelLabel(row.channel) }} · {{ statusLabel(row.status) }}</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col v-if="!statsRows.length" cols="12">
          <v-alert v-if="!loadingStats" type="info" variant="tonal" density="compact">
            Статистика отсутствует — уведомлений пока не было.
          </v-alert>
          <v-skeleton-loader v-else type="card" />
        </v-col>
      </v-row>
    </div>

    <!-- Фильтры -->
    <v-card class="filters-card mt-4">
      <v-card-text>
        <v-row dense>
          <v-col cols="12" sm="6" md="3">
            <v-text-field v-model="filters.type" label="Тип" placeholder="installation_created…" clearable
              density="compact" hide-details @update:model-value="onFilterChange" />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select v-model="filters.channel" :items="channelOptions" label="Канал" clearable density="compact"
              hide-details @update:model-value="onFilterChange" />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select v-model="filters.status" :items="statusOptions" label="Статус" clearable density="compact"
              hide-details @update:model-value="onFilterChange" />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field v-model="filters.related_type" label="Связанная сущность" placeholder="installation, billing…"
              clearable density="compact" hide-details @update:model-value="onFilterChange" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Таблица логов -->
    <v-card class="logs-card mt-4">
      <v-data-table
        :headers="headers"
        :items="logs"
        :loading="loading"
        :items-per-page="filters.limit"
        :items-per-page-options="[20, 50, 100, 200]"
        :page="page"
        :items-length="total"
        @update:page="onPageChange"
        @update:items-per-page="onLimitChange"
        class="logs-table"
      >
        <template #item.created_at="{ item }">
          {{ formatDateTime(item.created_at) }}
        </template>

        <template #item.channel="{ item }">
          <v-chip size="small" variant="tonal">
            <v-icon start size="small">{{ channelIcon(item.channel) }}</v-icon>
            {{ channelLabel(item.channel) }}
          </v-chip>
        </template>

        <template #item.type="{ item }">
          <code class="text-caption">{{ item.type }}</code>
        </template>

        <template #item.recipient="{ item }">
          <span class="text-truncate d-inline-block" style="max-width: 220px">{{ item.recipient }}</span>
        </template>

        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="small">
            {{ statusLabel(item.status) }}
          </v-chip>
        </template>

        <template #item.attempt_count="{ item }">
          <span :class="item.attempt_count > 1 ? 'text-warning' : ''">{{ item.attempt_count }}</span>
        </template>

        <template #item.related="{ item }">
          <span v-if="item.related_type">
            {{ item.related_type }}{{ item.related_id ? ` #${item.related_id}` : "" }}
          </span>
          <span v-else class="text-grey">—</span>
        </template>

        <template #item.actions="{ item }">
          <v-btn icon="mdi-eye" size="small" variant="text" @click="openDetails(item)" />
        </template>

        <template #no-data>
          <div class="pa-4 text-center text-grey">Нет записей по выбранным фильтрам</div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Диалог деталей -->
    <v-dialog v-model="detailsOpen" max-width="720">
      <v-card v-if="selected">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">{{ channelIcon(selected.channel) }}</v-icon>
          {{ selected.type }}
          <v-spacer />
          <v-chip :color="statusColor(selected.status)" size="small">{{ statusLabel(selected.status) }}</v-chip>
        </v-card-title>
        <v-card-text>
          <div class="meta-grid">
            <div><strong>ID:</strong> {{ selected.id }}</div>
            <div><strong>Канал:</strong> {{ channelLabel(selected.channel) }}</div>
            <div><strong>Получатель:</strong> {{ selected.recipient }}</div>
            <div><strong>Создано:</strong> {{ formatDateTime(selected.created_at) }}</div>
            <div v-if="selected.sent_at"><strong>Отправлено:</strong> {{ formatDateTime(selected.sent_at) }}</div>
            <div v-if="selected.next_retry_at"><strong>Следующая попытка:</strong> {{ formatDateTime(selected.next_retry_at) }}</div>
            <div><strong>Попыток:</strong> {{ selected.attempt_count }}</div>
            <div v-if="selected.external_id"><strong>External ID:</strong> {{ selected.external_id }}</div>
            <div v-if="selected.related_type">
              <strong>Связано:</strong> {{ selected.related_type }}{{ selected.related_id ? ` #${selected.related_id}` : "" }}
            </div>
          </div>

          <v-divider class="my-3" />

          <div v-if="selected.subject">
            <div class="text-overline">Тема</div>
            <div class="mb-3">{{ selected.subject }}</div>
          </div>

          <div class="text-overline">Сообщение</div>
          <pre class="message-block">{{ selected.message }}</pre>

          <template v-if="selected.error_message">
            <v-alert type="error" variant="tonal" density="compact" class="mt-3">
              {{ selected.error_message }}
            </v-alert>
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="detailsOpen = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.open" :color="snackbar.color" timeout="4000">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  notificationsService,
  type NotificationLog,
  type NotificationStatsRow,
} from "@/services/notificationsService";

const headers = [
  { title: "Дата", key: "created_at", sortable: false, width: 160 },
  { title: "Тип", key: "type", sortable: false },
  { title: "Канал", key: "channel", sortable: false, width: 120 },
  { title: "Получатель", key: "recipient", sortable: false },
  { title: "Статус", key: "status", sortable: false, width: 120 },
  { title: "Попыток", key: "attempt_count", sortable: false, width: 90 },
  { title: "Связано", key: "related", sortable: false },
  { title: "", key: "actions", sortable: false, width: 60, align: "end" as const },
];

const channelOptions = [
  { title: "Email", value: "email" },
  { title: "Telegram", value: "telegram" },
  { title: "MAX", value: "max" },
];

const statusOptions = [
  { title: "Ожидает", value: "pending" },
  { title: "Отправлено", value: "sent" },
  { title: "Ошибка", value: "failed" },
  { title: "Повтор", value: "retry" },
  { title: "Отказ окончательный", value: "failed_final" },
];

const filters = reactive<{
  limit: number;
  type?: string;
  channel?: string;
  status?: string;
  related_type?: string;
}>({
  limit: 50,
  type: undefined,
  channel: undefined,
  status: undefined,
  related_type: undefined,
});

const page = ref(1);
const total = ref(0);
const logs = ref<NotificationLog[]>([]);
const loading = ref(false);

const statsRows = ref<NotificationStatsRow[]>([]);
const loadingStats = ref(false);

const detailsOpen = ref(false);
const selected = ref<NotificationLog | null>(null);

const snackbar = reactive({ open: false, color: "info", message: "" });

const offset = computed(() => (page.value - 1) * filters.limit);

async function loadLogs() {
  loading.value = true;
  try {
    const res = await notificationsService.getLogs({
      limit: filters.limit,
      offset: offset.value,
      type: filters.type || undefined,
      channel: filters.channel || undefined,
      status: filters.status || undefined,
      related_type: filters.related_type || undefined,
    });
    logs.value = res.logs;
    total.value = res.total;
  } catch (e: any) {
    snackbar.message = `Не удалось загрузить логи: ${e?.message || e}`;
    snackbar.color = "error";
    snackbar.open = true;
  } finally {
    loading.value = false;
  }
}

async function loadStats() {
  loadingStats.value = true;
  try {
    const res = await notificationsService.getStats();
    statsRows.value = res.by_channel_status || [];
  } catch (e: any) {
    snackbar.message = `Не удалось загрузить статистику: ${e?.message || e}`;
    snackbar.color = "error";
    snackbar.open = true;
  } finally {
    loadingStats.value = false;
  }
}

function reload() {
  loadLogs();
  loadStats();
}

function onFilterChange() {
  page.value = 1;
  loadLogs();
}

function onPageChange(v: number) {
  page.value = v;
  loadLogs();
}

function onLimitChange(v: number) {
  filters.limit = v;
  page.value = 1;
  loadLogs();
}

function openDetails(item: NotificationLog) {
  selected.value = item;
  detailsOpen.value = true;
}

function channelIcon(ch: string): string {
  switch (ch) {
    case "email": return "mdi-email-outline";
    case "telegram": return "mdi-send-circle-outline";
    case "max": return "mdi-message-text-outline";
    default: return "mdi-bell-outline";
  }
}

function channelLabel(ch: string): string {
  switch (ch) {
    case "email": return "Email";
    case "telegram": return "Telegram";
    case "max": return "MAX";
    default: return ch;
  }
}

function statusColor(st: string): string {
  switch (st) {
    case "sent": return "success";
    case "failed":
    case "failed_final": return "error";
    case "retry": return "warning";
    case "pending": return "info";
    default: return "grey";
  }
}

function statusLabel(st: string): string {
  switch (st) {
    case "pending": return "Ожидает";
    case "sent": return "Отправлено";
    case "failed": return "Ошибка";
    case "retry": return "Повтор";
    case "failed_final": return "Отказ";
    default: return st;
  }
}

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("ru-RU", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

onMounted(() => {
  reload();
});
</script>

<style scoped>
.notification-logs-page {
  padding: 16px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 16px;
  flex-wrap: wrap;
}
.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}
.page-subtitle {
  color: rgba(0, 0, 0, 0.6);
  margin: 4px 0 0 0;
}
.stats-cards .stat-card {
  height: 100%;
}
.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px 16px;
  font-size: 14px;
}
.message-block {
  background: rgba(0, 0, 0, 0.04);
  padding: 12px;
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  max-height: 300px;
  overflow: auto;
}
</style>
