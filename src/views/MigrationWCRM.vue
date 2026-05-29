<template>
  <div class="migration-wcrm pa-4">
    <div class="d-flex align-center mb-4">
      <h1 class="text-h5 font-weight-bold">Миграция договоров WCRM → ACRM</h1>
      <v-spacer />
      <v-btn variant="tonal" prepend-icon="mdi-refresh" :loading="loading" @click="loadPreview">
        Обновить
      </v-btn>
    </div>

    <!-- Сводка -->
    <div class="stats-grid mb-4">
      <v-card class="stat-card" variant="flat">
        <div class="stat-value">{{ preview?.total_companies ?? '—' }}</div>
        <div class="stat-label">Компаний</div>
      </v-card>
      <v-card class="stat-card" variant="flat">
        <div class="stat-value">{{ preview?.total_contracts ?? '—' }}</div>
        <div class="stat-label">Договоров</div>
      </v-card>
      <v-card class="stat-card" variant="flat">
        <div class="stat-value">{{ preview?.total_appendix ?? '—' }}</div>
        <div class="stat-label">Приложений</div>
      </v-card>
      <v-card class="stat-card" variant="flat">
        <div class="stat-value text-success">{{ approvedCount }}</div>
        <div class="stat-label">Одобрено</div>
      </v-card>
      <v-card class="stat-card" variant="flat">
        <div class="stat-value text-warning">{{ skippedCount }}</div>
        <div class="stat-label">Пропущено</div>
      </v-card>
      <v-card class="stat-card" variant="flat">
        <div class="stat-value" :class="(preview?.conflicts ?? 0) > 0 ? 'text-error' : ''">
          {{ preview?.conflicts ?? '—' }}
        </div>
        <div class="stat-label">Конфликтов №</div>
      </v-card>
    </div>

    <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-4" closable @click:close="errorMsg = ''">
      {{ errorMsg }}
    </v-alert>

    <v-alert v-if="preview" type="info" variant="tonal" density="compact" class="mb-4">
      Snapshot: <code>{{ preview.snapshot_sha256.slice(0, 16) }}…</code> ·
      остаток средств пишется в <strong>billing_history</strong> (предоплата / долг)
    </v-alert>

    <!-- Bulk -->
    <div v-if="selectedClean.length" class="d-flex align-center mb-2">
      <span class="text-body-2 mr-3">Выбрано без проблем: {{ selectedClean.length }}</span>
      <v-btn color="primary" size="small" :loading="bulkRunning" @click="approveBulk">
        Одобрить выбранные
      </v-btn>
    </div>

    <!-- Таблица -->
    <v-card variant="flat">
      <v-data-table
        :headers="headers"
        :items="candidates"
        item-value="wcrm_company_id"
        :loading="loading"
        show-expand
        v-model:expanded="expanded"
        density="comfortable"
        :items-per-page="50"
      >
        <template #item.select="{ item }">
          <v-checkbox-btn
            :model-value="selectedIds.includes(item.wcrm_company_id)"
            :disabled="item.has_issues || item.already_imported"
            @update:model-value="toggleSelect(item.wcrm_company_id)"
          />
        </template>

        <template #item.client_name="{ item }">
          <div class="font-weight-medium">{{ item.client_name || 'Без названия' }}</div>
          <div class="text-caption text-medium-emphasis">ИНН {{ item.client_inn || '—' }}</div>
        </template>

        <template #item.client_type="{ item }">
          <v-chip v-if="item.client_type_note === 'manual_review'" color="warning" size="small" variant="tonal">
            требует выбора
          </v-chip>
          <span v-else class="text-body-2">{{ clientTypeLabel(item.client_type) }}</span>
        </template>

        <template #item.counts="{ item }">
          {{ item.contracts_count }} дог. / {{ item.appendix_count }} прил. / {{ item.object_count }} об.
        </template>

        <template #item.balance="{ item }">
          <span :class="balanceClass(item.balance)">{{ formatMoney(item.balance) }}</span>
          <div class="text-caption text-medium-emphasis">{{ item.balance_target }}</div>
        </template>

        <template #item.status="{ item }">
          <v-chip v-if="item.status === 'approved'" color="success" size="small" variant="flat">одобрено</v-chip>
          <v-chip v-else-if="item.status === 'skipped'" color="grey" size="small" variant="flat">пропущено</v-chip>
          <v-chip v-else-if="item.already_imported" color="success" size="small" variant="tonal">импортировано</v-chip>
          <v-chip v-else color="blue-grey" size="small" variant="tonal">ожидает</v-chip>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center ga-1">
            <v-select
              v-if="item.client_type_note === 'manual_review' && item.status !== 'approved'"
              :model-value="typeOverride[item.wcrm_company_id]"
              :items="clientTypeItems"
              density="compact"
              variant="outlined"
              hide-details
              placeholder="тип клиента"
              style="max-width: 180px"
              @update:model-value="(v: string) => typeOverride[item.wcrm_company_id] = v"
            />
            <v-btn
              color="primary" size="small" variant="flat"
              :loading="rowRunning === item.wcrm_company_id"
              :disabled="item.status === 'approved'"
              @click="approveOne(item)"
            >
              {{ item.status === 'approved' ? 'Одобрено' : 'Одобрить' }}
            </v-btn>
            <v-btn
              size="small" variant="text"
              :disabled="item.status === 'approved'"
              @click="skipOne(item)"
            >
              Пропустить
            </v-btn>
          </div>
        </template>

        <!-- Раскрытие: side-by-side -->
        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="expanded-cell">
              <div class="expand-grid">
                <div class="expand-col">
                  <div class="expand-title">Источник WCRM</div>
                  <div class="kv"><span>Название</span><b>{{ item.client_name }}</b></div>
                  <div class="kv"><span>ИНН</span><b>{{ item.client_inn || '—' }}</b></div>
                  <div class="kv"><span>Остаток</span><b :class="balanceClass(item.balance)">{{ formatMoney(item.balance) }}</b></div>
                </div>
                <div class="expand-col">
                  <div class="expand-title">→ ACRM (tenant_186)</div>
                  <div class="kv"><span>client_type</span><b>{{ typeOverride[item.wcrm_company_id] || item.client_type }}</b></div>
                  <div class="kv"><span>Остаток →</span><b>{{ item.balance_target }}</b></div>
                  <div class="kv"><span>Импорт</span><b>договор + подписка (тариф по цене) + объекты по uid</b></div>
                </div>
              </div>

              <!-- Договоры → приложения → объекты -->
              <div v-for="ct in item.contracts" :key="ct.wcrm_contract_id" class="contract-block mt-3" :class="{ 'will-skip': ct.will_skip }">
                <div class="contract-head">
                  <span class="font-weight-bold">{{ ct.source_number }}</span>
                  <span v-if="ct.target_number !== ct.source_number" class="text-caption">→ {{ ct.target_number }}</span>
                  <v-chip v-if="ct.number_conflict" color="error" size="x-small" variant="tonal" class="ml-1">конфликт №</v-chip>
                  <v-chip v-if="ct.will_skip" color="grey" size="x-small" variant="flat" class="ml-2">будет пропущен (нет активных приложений)</v-chip>
                  <v-chip v-else size="x-small" color="success" variant="tonal" class="ml-2">мигрируется → договор + подписка</v-chip>
                  <span class="text-caption ml-2">{{ shortDate(ct.start_date) }} — {{ shortDate(ct.end_date) || '∞' }}</span>
                  <span class="text-caption ml-2 text-medium-emphasis">
                    объектов: {{ ct.object_count }}, в ACRM найдено по uid: <b>{{ ct.objects_matched }}</b>
                  </span>
                </div>
                <v-table density="compact" class="appendix-table mt-1">
                  <thead>
                    <tr>
                      <th>Приложение → Подписка</th><th>Срок приложения</th><th>Старт подписки (ACRM)</th><th>Цена (тариф)</th><th>Период</th><th>Активно</th><th>Объекты (по uid)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="ap in ct.appendices" :key="ap.wcrm_attachment_id" :class="{ 'text-disabled': !ap.enabled }">
                      <td>{{ ap.title }}</td>
                      <td class="text-caption">{{ shortDate(ap.start_date) || '—' }} — {{ shortDate(ap.end_date) || '∞' }}</td>
                      <td class="start-cell">
                        <template v-if="ap.enabled">
                          <v-btn-toggle
                            :model-value="startMode[ap.wcrm_attachment_id] || 'auto'"
                            density="compact" mandatory variant="outlined" divided
                            @update:model-value="(v: any) => setStartMode(ap, v)"
                          >
                            <v-btn value="auto" size="x-small">Авто</v-btn>
                            <v-btn value="manual" size="x-small">Вручную</v-btn>
                          </v-btn-toggle>
                          <v-text-field
                            v-if="startMode[ap.wcrm_attachment_id] === 'manual'"
                            v-model="startDate[ap.wcrm_attachment_id]"
                            type="date" density="compact" hide-details variant="outlined"
                            class="mt-1 start-date-input"
                          />
                          <div v-else class="text-caption text-medium-emphasis mt-1">
                            {{ firstOfCurrentMonth() }} (1-е тек. месяца)
                          </div>
                        </template>
                        <span v-else class="text-medium-emphasis">—</span>
                      </td>
                      <td>{{ ap.price }} ₽/объект</td>
                      <td>{{ ap.period }}</td>
                      <td>
                        <v-chip size="x-small" :color="ap.enabled ? 'success' : 'grey'" variant="tonal">
                          {{ ap.enabled ? 'да → подписка' : 'нет → пропуск' }}
                        </v-chip>
                      </td>
                      <td>
                        <span v-if="ap.object_count === 0" class="text-medium-emphasis">—</span>
                        <span v-else>
                          <b>{{ ap.object_count }}</b>:
                          <span class="text-caption">{{ ap.object_names.slice(0, 8).join(', ') }}<span v-if="ap.object_count > 8"> … +{{ ap.object_count - 8 }}</span></span>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
              <div class="text-caption text-medium-emphasis mt-2">
                Включённое приложение → подписка (тариф по цене). Объекты привязываются по uid-матчу с ACRM (Wialon).
                Неактивные договоры (все приложения выключены) пропускаются.
              </div>
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import apiClient from '@/services/api';

interface PreviewAppendix {
  wcrm_attachment_id: number;
  title: string;
  price: string;
  period: number;
  start_date: string;
  end_date: string;
  enabled: boolean;
  object_count: number;
  object_names: string[];
}
interface PreviewContract {
  wcrm_contract_id: number;
  source_number: string;
  target_number: string;
  number_conflict: boolean;
  start_date: string;
  end_date: string;
  status: string;
  appendix_count: number;
  bad_dates: number;
  object_count: number;
  objects_matched: number;
  will_skip: boolean;
  appendices: PreviewAppendix[];
}
interface Candidate {
  wcrm_company_id: number;
  client_name: string;
  client_inn: string;
  client_type: string;
  client_type_note?: string;
  contracts_count: number;
  appendix_count: number;
  object_count: number;
  balance: string;
  balance_target: string;
  contracts: PreviewContract[];
  already_imported: boolean;
  status: string;
  has_issues: boolean;
}
interface PreviewResp {
  snapshot_sha256: string;
  total_companies: number;
  total_contracts: number;
  total_appendix: number;
  approved: number;
  skipped: number;
  conflicts: number;
  candidates: Candidate[];
}

const loading = ref(false);
const preview = ref<PreviewResp | null>(null);
const errorMsg = ref('');
const expanded = ref<number[]>([]);
const selectedIds = ref<number[]>([]);
const typeOverride = ref<Record<number, string>>({});
const rowRunning = ref<number | null>(null);
const bulkRunning = ref(false);

// Ручной старт подписки на приложение (ключ = wcrm_attachment_id).
// mode 'auto' → берём дату из WCRM; 'manual' → дата из startDate (дефолт 1-е тек. месяца).
const startMode = ref<Record<number, 'auto' | 'manual'>>({});
const startDate = ref<Record<number, string>>({});

const headers = [
  { title: '', key: 'select', sortable: false, width: 48 },
  { title: 'Клиент', key: 'client_name' },
  { title: 'Тип', key: 'client_type' },
  { title: 'Объём', key: 'counts', sortable: false },
  { title: 'Остаток', key: 'balance' },
  { title: 'Статус', key: 'status' },
  { title: 'Действия', key: 'actions', sortable: false, width: 320 },
  { title: '', key: 'data-table-expand' },
];

const clientTypeItems = [
  { title: 'Организация', value: 'organization' },
  { title: 'ИП', value: 'individual_entrepreneur' },
  { title: 'Физлицо', value: 'physical_person' },
];

const candidates = computed(() => preview.value?.candidates ?? []);
const approvedCount = computed(() => candidates.value.filter(c => c.status === 'approved').length);
const skippedCount = computed(() => candidates.value.filter(c => c.status === 'skipped').length);
const selectedClean = computed(() => selectedIds.value);

function clientTypeLabel(t: string): string {
  return clientTypeItems.find(i => i.value === t)?.title ?? t;
}
function formatMoney(v: string): string {
  const n = parseFloat(v || '0');
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽';
}
function balanceClass(v: string): string {
  const n = parseFloat(v || '0');
  if (n > 0) return 'text-success';
  if (n < 0) return 'text-error';
  return 'text-medium-emphasis';
}
function shortDate(s: string): string {
  if (!s) return '';
  return s.slice(0, 10);
}

// 1-е число текущего месяца в формате YYYY-MM-DD (дефолт ручного старта).
function firstOfCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

// Переключение режима старта приложения. При входе в 'manual' проставляем дефолт.
function setStartMode(ap: PreviewAppendix, mode: 'auto' | 'manual') {
  startMode.value[ap.wcrm_attachment_id] = mode;
  if (mode === 'manual' && !startDate.value[ap.wcrm_attachment_id]) {
    startDate.value[ap.wcrm_attachment_id] = firstOfCurrentMonth();
  }
}

// Собираем ручные override старта для компании: { attachment_id: 'YYYY-MM-DD' }.
// Только включённые приложения в режиме 'manual'. Пусто → весь импорт авто.
function buildStartOverrides(item: Candidate): Record<string, string> {
  const out: Record<string, string> = {};
  for (const ct of item.contracts || []) {
    for (const ap of ct.appendices || []) {
      if (!ap.enabled) continue;
      if (startMode.value[ap.wcrm_attachment_id] === 'manual') {
        const d = startDate.value[ap.wcrm_attachment_id];
        if (d) out[String(ap.wcrm_attachment_id)] = d;
      }
    }
  }
  return out;
}

function toggleSelect(id: number) {
  const i = selectedIds.value.indexOf(id);
  if (i >= 0) selectedIds.value.splice(i, 1);
  else selectedIds.value.push(id);
}

async function loadPreview() {
  loading.value = true;
  errorMsg.value = '';
  try {
    const { data } = await apiClient.get('/auth/migration/wcrm/preview');
    preview.value = data.data;
    selectedIds.value = [];
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.error || e.message || 'Ошибка загрузки';
  } finally {
    loading.value = false;
  }
}

async function approveOne(item: Candidate) {
  if (item.client_type_note === 'manual_review' && !typeOverride.value[item.wcrm_company_id]) {
    errorMsg.value = `Выберите тип клиента для «${item.client_name}» перед одобрением`;
    return;
  }
  rowRunning.value = item.wcrm_company_id;
  errorMsg.value = '';
  try {
    await apiClient.post(`/auth/migration/wcrm/approve/${item.wcrm_company_id}`, {
      snapshot_sha256: preview.value?.snapshot_sha256,
      client_type_override: typeOverride.value[item.wcrm_company_id] || '',
      appendix_start_overrides: buildStartOverrides(item),
    });
    item.status = 'approved';
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.error || e.message || 'Ошибка одобрения';
  } finally {
    rowRunning.value = null;
  }
}

async function skipOne(item: Candidate) {
  try {
    await apiClient.post(`/auth/migration/wcrm/skip/${item.wcrm_company_id}`, {});
    item.status = 'skipped';
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.error || e.message || 'Ошибка';
  }
}

async function approveBulk() {
  bulkRunning.value = true;
  errorMsg.value = '';
  const ids = [...selectedIds.value];
  for (const id of ids) {
    const item = candidates.value.find(c => c.wcrm_company_id === id);
    if (!item || item.status === 'approved') continue;
    try {
      await apiClient.post(`/auth/migration/wcrm/approve/${id}`, {
        snapshot_sha256: preview.value?.snapshot_sha256,
        client_type_override: typeOverride.value[id] || '',
        appendix_start_overrides: buildStartOverrides(item),
      });
      item.status = 'approved';
    } catch (e: any) {
      errorMsg.value = `Компания ${id}: ${e?.response?.data?.error || e.message}`;
      break;
    }
  }
  selectedIds.value = [];
  bulkRunning.value = false;
}

loadPreview();
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}
.stat-card {
  padding: 16px;
  border-radius: 14px;
  text-align: center;
}
.stat-value { font-size: 28px; font-weight: 700; line-height: 1.1; }
.stat-label { font-size: 13px; color: rgba(0,0,0,0.6); margin-top: 4px; }
.expanded-cell { background: rgba(0,0,0,0.02); padding: 16px !important; }
.expand-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.expand-col { }
.expand-title { font-weight: 600; margin-bottom: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; color: rgba(0,0,0,0.5); }
.kv { display: flex; justify-content: space-between; padding: 3px 0; font-size: 14px; }
.kv span { color: rgba(0,0,0,0.6); }
.contracts-table { background: transparent; }
.contract-block { border-top: 1px solid rgba(0,0,0,0.08); padding-top: 8px; }
.contract-block.will-skip { opacity: 0.55; }
.contract-head { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.appendix-table { background: transparent; }
.start-cell { min-width: 180px; }
.start-date-input { max-width: 160px; }
@media (max-width: 900px) {
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
  .expand-grid { grid-template-columns: 1fr; }
}
</style>
