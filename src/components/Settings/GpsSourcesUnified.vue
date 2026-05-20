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
            <v-list-item
              :disabled="axentaConfigured"
              @click="onAdd('axenta')"
            >
              <template #prepend>
                <v-icon color="indigo">mdi-cloud-key</v-icon>
              </template>
              <v-list-item-title>Axenta</v-list-item-title>
              <v-list-item-subtitle v-if="axentaConfigured" class="text-caption">
                Уже подключено
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
        density="comfortable"
        class="gps-sources-table"
      >
        <template #[`item.provider`]="{ item }">
          <div class="d-flex align-center gap-2">
            <v-avatar :color="providerColor(item.provider)" size="28">
              <v-icon size="16" color="white">{{ providerIcon(item.provider) }}</v-icon>
            </v-avatar>
            <span class="text-body-2 font-weight-medium">{{ providerLabel(item.provider, item.subtype) }}</span>
          </div>
        </template>

        <template #[`item.name`]="{ item }">
          <div>
            <div class="text-body-2">{{ item.name || '—' }}</div>
            <div v-if="item.host" class="text-caption text-medium-emphasis">{{ item.host }}</div>
          </div>
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
              v-if="item.provider !== 'axenta'"
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
              v-if="item.provider !== 'axenta'"
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
    const { data } = await apiClient.get('/auth/axenta-credentials');
    if (data?.status === 'success' && data.data) {
      axentaConfigured.value = !!data.data.configured;
      if (axentaConfigured.value) {
        return {
          key: 'axenta-1',
          provider: 'axenta',
          id: 'axenta',
          name: data.data.login || '—',
          objects: null,
          last_sync: null,
          status: 'active',
        };
      }
    }
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
      name: c.name,
      host: c.host,
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

async function loadAll() {
  loading.value = true;
  try {
    const [ax, wi, ge, sk] = await Promise.all([loadAxenta(), loadWialon(), loadGelios(), loadSkif()]);
    const all: SourceRow[] = [];
    if (ax) all.push(ax);
    all.push(...wi, ...ge, ...sk);
    rows.value = all;
  } finally {
    loading.value = false;
  }
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
</style>
