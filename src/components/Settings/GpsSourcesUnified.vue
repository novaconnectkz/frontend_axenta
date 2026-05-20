<template>
  <div class="gps-sources-unified">
    <!-- Заголовок + статистика + Добавить -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="d-flex align-center gap-3">
        <v-avatar color="primary" size="40">
          <v-icon>mdi-satellite-uplink</v-icon>
        </v-avatar>
        <div>
          <h3 class="text-h6 font-weight-bold mb-0">Источники данных GPS</h3>
          <p class="text-caption text-medium-emphasis mb-0">
            Подключения к Axenta, Wialon, GELIOS и SKIF в одном месте
          </p>
        </div>
      </div>

      <div class="d-flex align-center gap-2">
        <v-chip
          :color="stats.active > 0 ? 'success' : 'grey'"
          variant="elevated"
          size="small"
        >
          <v-icon start size="14">mdi-check-circle</v-icon>
          Активных: {{ stats.active }}
        </v-chip>
        <v-chip
          :color="stats.errors > 0 ? 'error' : 'grey'"
          variant="elevated"
          size="small"
        >
          <v-icon start size="14">mdi-alert-circle</v-icon>
          Ошибок: {{ stats.errors }}
        </v-chip>

        <!-- Добавить → меню типов -->
        <v-menu offset-y>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              color="primary"
              variant="elevated"
              size="small"
              prepend-icon="mdi-plus"
            >
              Добавить
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="onAdd('axenta')">
              <template #prepend>
                <v-icon color="indigo">mdi-cloud-key</v-icon>
              </template>
              <v-list-item-title>Axenta</v-list-item-title>
              <v-list-item-subtitle v-if="axentaConfigured" class="text-caption">
                Обновить логин / пароль
              </v-list-item-subtitle>
              <v-list-item-subtitle v-else class="text-caption">
                Подключить аккаунт партнёра
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item @click="onAdd('wialon')">
              <template #prepend>
                <v-icon color="primary">mdi-satellite-uplink</v-icon>
              </template>
              <v-list-item-title>Wialon (Hosting / Local)</v-list-item-title>
            </v-list-item>
            <v-list-item @click="onAdd('gelios')">
              <template #prepend>
                <v-icon color="deep-orange-darken-1">mdi-crosshairs-gps</v-icon>
              </template>
              <v-list-item-title>GELIOS</v-list-item-title>
            </v-list-item>
            <v-list-item @click="onAdd('skif')">
              <template #prepend>
                <v-icon color="teal-darken-1">mdi-satellite-variant</v-icon>
              </template>
              <v-list-item-title>SKIF</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <!-- Таблица всех подключений -->
    <v-card variant="outlined">
      <v-data-table
        :headers="headers"
        :items="rows"
        :loading="loading"
        :items-per-page="20"
        item-value="key"
        density="comfortable"
        class="gps-sources-table"
        return-object
      >
        <template #[`item.provider`]="{ item }">
          <div class="d-flex align-center provider-cell">
            <v-avatar :color="providerColor(item.provider)" size="28">
              <v-icon size="16" color="white">{{ providerIcon(item.provider) }}</v-icon>
            </v-avatar>
            <div class="provider-divider" />
            <span class="text-body-2 font-weight-medium">{{ providerLabel(item.provider, item.subtype) }}</span>
          </div>
        </template>

        <template #[`item.name`]="{ item }">
          <span
            v-if="item.host"
            class="text-body-2"
            :title="item.host"
          >{{ item.name || '—' }}</span>
          <span v-else class="text-body-2">{{ item.name || '—' }}</span>
        </template>

        <template #[`item.objects`]="{ item }">
          <span class="text-body-2">{{ formatNumber(item.objects) }}</span>
        </template>

        <template #[`item.last_sync`]="{ item }">
          <span class="text-caption">{{ formatDate(item.last_sync) }}</span>
        </template>

        <template #[`item.status`]="{ item }">
          <v-chip
            :color="item.status === 'active' ? 'success' : item.status === 'error' ? 'error' : 'grey'"
            variant="elevated"
            size="x-small"
          >
            {{ item.status === 'active' ? 'OK' : item.status === 'error' ? 'Ошибка' : '—' }}
          </v-chip>
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="d-flex align-center gap-1 justify-end">
            <v-btn
              icon
              variant="text"
              size="small"
              :loading="busy[`test-${item.provider}-${item.id}`]"
              title="Проверить подключение"
              @click="onTest(item)"
            >
              <v-icon size="18">mdi-connection</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              :loading="busy[`sync-${item.provider}-${item.id}`]"
              title="Запустить синхронизацию"
              @click="onSync(item)"
            >
              <v-icon size="18">mdi-sync</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              title="Настроить"
              @click="onConfigure(item)"
            >
              <v-icon size="18">mdi-cog</v-icon>
            </v-btn>
          </div>
        </template>

        <template #no-data>
          <div class="text-center py-6 text-medium-emphasis">
            <v-icon size="48" class="mb-2">mdi-database-off-outline</v-icon>
            <div class="text-body-2">Нет подключённых источников. Нажмите «Добавить» сверху.</div>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Реюзаем существующие модальные диалоги per provider.
         Они уже умеют create/edit/test/sync/delete внутри себя. -->
    <v-dialog v-model="axentaDialogShow" max-width="700" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon start color="indigo">mdi-cloud-key</v-icon>
          Подключение Axenta
          <v-spacer />
          <v-btn icon variant="text" @click="closeAxentaDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <AxentaConnectionSettings />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="wialonDialogShow" max-width="900" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon start color="primary">mdi-satellite-uplink</v-icon>
          Подключения Wialon
          <v-spacer />
          <v-btn icon variant="text" @click="closeWialonDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <WialonConnectionsSettings />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="geliosDialogShow" max-width="1100" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon start color="deep-orange-darken-1">mdi-crosshairs-gps</v-icon>
          Подключения GELIOS
          <v-spacer />
          <v-btn icon variant="text" @click="closeGeliosDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <GeliosConnectionsSettings />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="skifDialogShow" max-width="1100" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon start color="teal-darken-1">mdi-satellite-variant</v-icon>
          Подключения SKIF
          <v-spacer />
          <v-btn icon variant="text" @click="closeSkifDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <SkifConnectionsSettings />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000" location="top right">
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Закрыть</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { apiClient } from '@/services/api';
import { geliosService, type GeliosConnection } from '@/services/geliosService';
import { skifService, type SkifConnection } from '@/services/skifService';
import AxentaConnectionSettings from './AxentaConnectionSettings.vue';
import WialonConnectionsSettings from './WialonConnectionsSettings.vue';
import GeliosConnectionsSettings from './GeliosConnectionsSettings.vue';
import SkifConnectionsSettings from './SkifConnectionsSettings.vue';
import { config } from '@/config/env';

type Provider = 'axenta' | 'wialon' | 'gelios' | 'skif';

interface SourceRow {
  key: string;
  provider: Provider;
  subtype?: string; // Hosting / Local для Wialon
  id: number | string;
  name: string;
  host?: string;
  objects: number | null;
  last_sync: string | null;
  status: 'active' | 'error' | 'unknown';
}

interface WialonConnection {
  id: number;
  name: string;
  user_name?: string;
  host: string;
  connection_type: 'hosting' | 'local';
  units_count?: number;
  last_sync_at?: string | null;
  is_active?: boolean;
  last_error_at?: string | null;
}

const loading = ref(false);
const rows = ref<SourceRow[]>([]);
const busy = reactive<Record<string, boolean>>({});
const axentaConfigured = ref(false);

const axentaDialogShow = ref(false);
const wialonDialogShow = ref(false);
const geliosDialogShow = ref(false);
const skifDialogShow = ref(false);

const snackbar = reactive({ show: false, text: '', color: 'success' as 'success' | 'error' | 'info' });

const headers = [
  { title: 'Провайдер', key: 'provider', sortable: true, width: 200 },
  { title: 'Название / Логин', key: 'name', sortable: true },
  { title: 'Объекты', key: 'objects', sortable: true, align: 'end' as const, width: 110 },
  { title: 'Последняя синхр.', key: 'last_sync', sortable: true, width: 180 },
  { title: 'Статус', key: 'status', sortable: false, width: 90 },
  { title: '', key: 'actions', sortable: false, align: 'end' as const, width: 150 },
];

const stats = computed(() => {
  const active = rows.value.filter(r => r.status === 'active').length;
  const errors = rows.value.filter(r => r.status === 'error').length;
  return { active, errors };
});

function providerIcon(p: Provider): string {
  switch (p) {
    case 'axenta': return 'mdi-cloud-key';
    case 'wialon': return 'mdi-satellite-uplink';
    case 'gelios': return 'mdi-crosshairs-gps';
    case 'skif': return 'mdi-satellite-variant';
  }
}

function providerColor(p: Provider): string {
  switch (p) {
    case 'axenta': return 'indigo';
    case 'wialon': return 'primary';
    case 'gelios': return 'deep-orange-darken-1';
    case 'skif': return 'teal-darken-1';
  }
}

function providerLabel(p: Provider, subtype?: string): string {
  switch (p) {
    case 'axenta': return 'Axenta';
    case 'wialon': return subtype === 'local' ? 'Wialon Local' : 'Wialon Hosting';
    case 'gelios': return 'GELIOS';
    case 'skif': return 'SKIF';
  }
}

function formatNumber(n: number | null): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('ru-RU').format(n);
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function loadAxenta(): Promise<SourceRow | null> {
  try {
    const { data: cred } = await apiClient.get('/auth/axenta-credentials');
    if (cred?.status !== 'success' || !cred.data?.configured) {
      axentaConfigured.value = false;
      return null;
    }
    axentaConfigured.value = true;

    // Параллельно: статус интеграции (connection_ok) + objects total +
    // last manual axenta-sync + last partner-snapshot cron job.
    // Приоритет last_sync: manual sync finished_at > daily cron > legacy
    // integration row.
    const auth = { 'Authorization': `Bearer ${localStorage.getItem('axenta_token')}` };
    const [statusRes, statsRes, jobsRes, syncRes] = await Promise.allSettled([
      fetch(`${config.apiBaseUrl}/axenta/status`, { headers: auth })
        .then(r => r.ok ? r.json() : null),
      apiClient.get('/auth/objects/stats').then(r => r.data?.data || r.data).catch(() => null),
      apiClient.get('/auth/snapshot-jobs/stats').then(r => r.data?.data || r.data).catch(() => null),
      fetch(`${config.apiBaseUrl}/auth/axenta-sync/status`, { headers: auth })
        .then(r => r.ok ? r.json() : null),
    ]);
    const status: any = statusRes.status === 'fulfilled' ? statusRes.value : null;
    const stats: any = statsRes.status === 'fulfilled' ? statsRes.value : null;
    const jobs: any = jobsRes.status === 'fulfilled' ? jobsRes.value : null;
    const lastSyncTracker: any = syncRes.status === 'fulfilled' ? syncRes.value : null;

    // Источник правды о здоровье Axenta = cred-UX (валидирует пароль через
    // Probe). /api/axenta/status.TestConnection — другая ветка (легаси
    // integration row), часто даёт false-negative — игнорируем для статуса.
    // Status row отражаем как active если cred.configured && last successful
    // snapshot job. Если snapshot-jobs показывает failed_jobs>0 — Ошибка.
    const hasFailed = typeof jobs?.failed_jobs === 'number' && jobs.failed_jobs > 0;
    const connectionOk = !hasFailed;
    const objects = typeof stats?.total === 'number' ? stats.total : null;
    // Приоритет: ручной axenta-sync (started_at если ещё running, иначе
    // finished_at) > daily cron last_job_started_at > legacy status.last_sync.
    const manualSync = lastSyncTracker?.finished_at || lastSyncTracker?.started_at || null;
    const lastSync = manualSync || jobs?.last_job_started_at || status?.last_sync || null;

    return {
      key: 'axenta-1',
      provider: 'axenta',
      id: 'axenta',
      name: cred.data.login || '—',
      host: 'axenta.cloud',
      objects,
      last_sync: lastSync,
      status: connectionOk ? 'active' : 'error',
    };
  } catch (e) {
    console.error('axenta load failed', e);
  }
  return null;
}

async function loadWialon(): Promise<SourceRow[]> {
  try {
    const r = await fetch(`${config.apiBaseUrl}/wialon/connections`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('axenta_token')}` },
    });
    if (!r.ok) return [];
    const json = await r.json();
    const list: WialonConnection[] = json?.data?.connections || json?.data || [];
    return list.map(c => ({
      key: `wialon-${c.id}`,
      provider: 'wialon' as const,
      subtype: c.connection_type,
      id: c.id,
      // Колонка «Название / Логин» = user_name (актуальный логин Wialon).
      // c.name для Local часто = домен (app.gpsnetwork.ru) — это не логин,
      // его прячем в tooltip с host'ом.
      name: c.user_name || c.name,
      host: `${c.host}${c.name && c.name !== c.user_name ? ' · ' + c.name : ''}`,
      objects: c.units_count ?? null,
      last_sync: c.last_sync_at ?? null,
      status: c.last_error_at ? 'error' : (c.is_active === false ? 'unknown' : 'active'),
    }));
  } catch (e) {
    console.error('wialon load failed', e);
    return [];
  }
}

async function loadGelios(): Promise<SourceRow[]> {
  try {
    const list = await geliosService.list();
    return list.map((c: GeliosConnection & { last_error_at?: string | null; units_count?: number; last_sync_at?: string | null }) => ({
      key: `gelios-${c.id}`,
      provider: 'gelios' as const,
      id: c.id,
      name: c.name,
      objects: (c as any).units_count ?? null,
      last_sync: (c as any).last_sync_at ?? null,
      status: (c as any).last_error_at ? 'error' : 'active',
    }));
  } catch (e) {
    console.error('gelios load failed', e);
    return [];
  }
}

async function loadSkif(): Promise<SourceRow[]> {
  try {
    const list = await skifService.list();
    return list.map((c: SkifConnection) => ({
      key: `skif-${c.id}`,
      provider: 'skif' as const,
      id: c.id,
      name: c.login || c.name,
      host: c.base_url,
      objects: c.units_count ?? null,
      last_sync: c.last_sync_at ?? null,
      status: c.last_error_at ? 'error' : 'active',
    }));
  } catch (e) {
    console.error('skif load failed', e);
    return [];
  }
}

// Single-flight гвард: если loadAll() уже выполняется, второй вызов
// возвращает тот же in-flight promise. Защита от UI-race при sort/тест/sync
// (несколько concurrent loadAll → дубли в строках из-за стейл-кэша v-data-table).
let loadAllPromise: Promise<void> | null = null;

async function loadAll() {
  if (loadAllPromise) return loadAllPromise;
  loading.value = true;
  loadAllPromise = (async () => {
    try {
      const [ax, wi, ge, sk] = await Promise.all([loadAxenta(), loadWialon(), loadGelios(), loadSkif()]);
      // dedupe по key (на случай race-конкатенаций — каждый ключ строго уникален).
      const merged: SourceRow[] = [];
      const seen = new Set<string>();
      const all: SourceRow[] = [];
      if (ax) all.push(ax);
      all.push(...wi, ...ge, ...sk);
      for (const r of all) {
        if (!seen.has(r.key)) { seen.add(r.key); merged.push(r); }
      }
      rows.value = merged;
    } finally {
      loading.value = false;
      loadAllPromise = null;
    }
  })();
  return loadAllPromise;
}

function showSnack(text: string, color: 'success' | 'error' | 'info' = 'success') {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
}

async function onTest(item: SourceRow) {
  const key = `test-${item.provider}-${item.id}`;
  busy[key] = true;
  try {
    if (item.provider === 'wialon') {
      const r = await fetch(`${config.apiBaseUrl}/wialon/connections/${item.id}/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('axenta_token')}` },
      });
      if (r.ok) showSnack(`${providerLabel(item.provider, item.subtype)}: подключение работает`);
      else showSnack(`${providerLabel(item.provider, item.subtype)}: ошибка ${r.status}`, 'error');
    } else if (item.provider === 'gelios') {
      const d = await geliosService.test(item.id as number);
      showSnack(`${item.name}: OK, объектов ${d?.units_total ?? '—'}`);
    } else if (item.provider === 'skif') {
      await skifService.test(item.id as number);
      showSnack(`${item.name}: подключение OK`);
    } else if (item.provider === 'axenta') {
      // Axenta-test без передачи пароля. /api/axenta/status.TestConnection
      // часто даёт false-negative (legacy integration row отсутствует) —
      // не полагаемся. Источник правды:
      //  1. cred-UX configured=true (пароль валидирован через Probe);
      //  2. snapshot-jobs last successful run (cron sync с сохранёнными
      //     credentials прошёл).
      const [credRes, jobsRes] = await Promise.allSettled([
        apiClient.get('/auth/axenta-credentials'),
        apiClient.get('/auth/snapshot-jobs/stats'),
      ]);
      const cred: any = credRes.status === 'fulfilled' ? credRes.value.data : null;
      const jobs: any = jobsRes.status === 'fulfilled' ? jobsRes.value.data?.data || jobsRes.value.data : null;
      const credOk = cred?.status === 'success' && !!cred.data?.configured;
      const recentOk = !!jobs?.last_job_started_at && (jobs.failed_jobs ?? 0) === 0;
      if (credOk && recentOk) {
        showSnack(`Axenta (${item.name}): подключение работает (cred OK, ${jobs?.completed_jobs ?? 0} успешных sync)`);
      } else if (credOk) {
        showSnack(`Axenta (${item.name}): креды OK, но sync ещё не запускался`);
      } else {
        showSnack(`Axenta (${item.name}): креды не настроены — откройте «Настроить»`, 'error');
      }
    }
  } catch (e: any) {
    showSnack(`Ошибка теста: ${e?.response?.data?.error || e?.message}`, 'error');
  } finally {
    busy[key] = false;
    await loadAll();
  }
}

async function onSync(item: SourceRow) {
  const key = `sync-${item.provider}-${item.id}`;
  busy[key] = true;
  try {
    if (item.provider === 'gelios') {
      const r = await geliosService.sync(item.id as number);
      showSnack(`${item.name}: загружено ${r?.upserted ?? 0} объектов`);
    } else if (item.provider === 'skif') {
      const r = await skifService.sync(item.id as number);
      showSnack(`${item.name}: загружено ${r?.upserted ?? 0} объектов`);
    } else if (item.provider === 'wialon') {
      // Wialon test = sync (test обновляет units_count + last_sync_at)
      const r = await fetch(`${config.apiBaseUrl}/wialon/connections/${item.id}/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('axenta_token')}` },
      });
      if (r.ok) showSnack(`${providerLabel(item.provider, item.subtype)}: синхронизация завершена`);
    } else if (item.provider === 'axenta') {
      // Axenta sync — backend-async (тяжёлый snapshot всех 2000+ компаний),
      // но FE-обёртка делает polling /axenta-sync/status до finished,
      // показывая снепшот-count из /accounts/stats. UX идентичен другим.
      const auth = { 'Authorization': `Bearer ${localStorage.getItem('axenta_token')}` };
      const beforeStats = await apiClient.get('/auth/objects/stats')
        .then(r => r.data?.data?.total ?? 0).catch(() => 0);

      const t = await fetch(`${config.apiBaseUrl}/auth/axenta-sync/trigger`, { method: 'POST', headers: auth });
      if (!t.ok) {
        showSnack(`Axenta: ошибка запуска sync (${t.status})`, 'error');
        return;
      }
      showSnack(`Axenta: синхронизация запущена…`, 'info');

      // Polling до 10 минут (Axenta sync обычно 1-5 мин на 2000 учёток).
      const TIMEOUT = 10 * 60 * 1000;
      const startMs = Date.now();
      while (Date.now() - startMs < TIMEOUT) {
        await new Promise(r => setTimeout(r, 3000));
        try {
          const s = await fetch(`${config.apiBaseUrl}/auth/axenta-sync/status`, { headers: auth });
          if (!s.ok) continue;
          const j = await s.json();
          if (j.running === false && j.finished_at) {
            const afterStats = await apiClient.get('/auth/objects/stats')
              .then(r => r.data?.data?.total ?? 0).catch(() => 0);
            const diff = afterStats - beforeStats;
            const dur = Math.round(j.duration_s || 0);
            if (j.error) {
              showSnack(`Axenta: sync завершён с ошибкой — ${j.error}`, 'error');
            } else if (diff > 0) {
              showSnack(`Axenta: загружено ${afterStats} объектов (+${diff} за ${dur}с)`);
            } else {
              showSnack(`Axenta: sync завершён за ${dur}с (объектов ${afterStats})`);
            }
            return;
          }
        } catch (_) { /* network blip — продолжаем polling */ }
      }
      showSnack(`Axenta: sync продолжается дольше 10 мин — проверьте позже`, 'info');
    }
  } catch (e: any) {
    showSnack(`Ошибка sync: ${e?.response?.data?.error || e?.message}`, 'error');
  } finally {
    busy[key] = false;
    await loadAll();
  }
}

function onConfigure(item: SourceRow) {
  switch (item.provider) {
    case 'axenta': axentaDialogShow.value = true; break;
    case 'wialon': wialonDialogShow.value = true; break;
    case 'gelios': geliosDialogShow.value = true; break;
    case 'skif': skifDialogShow.value = true; break;
  }
}

function onAdd(provider: Provider) {
  // Открываем тот же modal что и Configure — внутри есть кнопка «Добавить подключение».
  onConfigure({ provider } as SourceRow);
}

function closeAxentaDialog() { axentaDialogShow.value = false; loadAll(); }
function closeWialonDialog() { wialonDialogShow.value = false; loadAll(); }
function closeGeliosDialog() { geliosDialogShow.value = false; loadAll(); }
function closeSkifDialog() { skifDialogShow.value = false; loadAll(); }

onMounted(loadAll);
</script>

<style scoped>
.gps-sources-table :deep(td) {
  vertical-align: middle;
}

.provider-cell {
  gap: 10px;
}

.provider-divider {
  width: 1px;
  height: 24px;
  background-color: rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}
</style>
