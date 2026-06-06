<template>
  <v-card flat>
    <v-card-text class="pt-2">
      <v-data-table
        :headers="headers"
        :items="rows"
        :loading="loading"
        density="comfortable"
        item-value="id"
        :items-per-page="limit"
        :row-props="rowProps"
        hide-default-footer
        class="elevation-0"
      >
        <!-- Фильтр по периоду дат встроен в заголовок столбца «Дата» (воронка) -->
        <template #header.snapshot_date="{ column }">
          <v-menu :close-on-content-click="false">
            <template #activator="{ props }">
              <span v-bind="props" class="header-filter">
                <v-icon size="14" :color="(dateFrom || dateTo) ? 'primary' : 'grey'">mdi-filter-variant</v-icon>
                {{ column.title }}
                <span v-if="dateFrom || dateTo" class="text-caption text-primary ml-1">{{ dateRangeLabel }}</span>
              </span>
            </template>
            <v-card min-width="260" class="pa-3">
              <div class="text-caption text-medium-emphasis mb-2">Период по дате снимка</div>
              <v-text-field
                v-model="dateFrom"
                type="date"
                label="С"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                class="mb-2"
              />
              <v-text-field
                v-model="dateTo"
                type="date"
                label="По"
                variant="outlined"
                density="compact"
                hide-details
                clearable
              />
              <div class="d-flex justify-end mt-2">
                <v-btn variant="text" size="small" :disabled="!dateFrom && !dateTo" @click="dateFrom = ''; dateTo = ''">
                  Сбросить
                </v-btn>
              </div>
            </v-card>
          </v-menu>
        </template>

        <!-- Фильтр «Система» встроен в заголовок столбца (воронка) -->
        <template #header.partner_source="{ column }">
          <v-menu :close-on-content-click="true">
            <template #activator="{ props }">
              <span v-bind="props" class="header-filter">
                <v-icon size="14" :color="sourceFilter ? 'primary' : 'grey'">mdi-filter-variant</v-icon>
                {{ column.title }}
                <span v-if="sourceFilter" class="text-caption text-primary ml-1">{{ labelOf(sources, sourceFilter) }}</span>
              </span>
            </template>
            <v-list density="compact" min-width="160">
              <v-list-item
                v-for="s in sources"
                :key="s.value"
                :active="sourceFilter === s.value"
                @click="sourceFilter = s.value"
              >
                <v-list-item-title>{{ s.label }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>

        <!-- Фильтр «Сверка» встроен в заголовок столбца (воронка) -->
        <template #header.verify_status="{ column }">
          <v-menu :close-on-content-click="true">
            <template #activator="{ props }">
              <span v-bind="props" class="header-filter">
                <v-icon size="14" :color="verifyFilter ? 'primary' : 'grey'">mdi-filter-variant</v-icon>
                {{ column.title }}
                <span v-if="verifyFilter" class="text-caption text-primary ml-1">{{ labelOf(verifyStatuses, verifyFilter) }}</span>
              </span>
            </template>
            <v-list density="compact" min-width="200">
              <v-list-item
                v-for="v in verifyStatuses"
                :key="v.value"
                :active="verifyFilter === v.value"
                @click="verifyFilter = v.value"
              >
                <v-list-item-title>{{ v.label }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>

        <!-- Сквозная нумерация строк (с учётом пагинации) -->
        <template #item.rownum="{ index }">
          <span class="text-medium-emphasis text-caption">{{ offset + index + 1 }}</span>
        </template>
        <template #item.snapshot_date="{ item }">
          {{ formatDate(item.snapshot_date) }}
        </template>
        <template #item.partner_source="{ item }">
          <v-chip :color="sourceColor(item.partner_source)" size="x-small" variant="tonal">
            {{ item.partner_source }}
          </v-chip>
        </template>
        <template #item.contract_id="{ item }">
          <template v-if="item.contract_id">
            <div class="font-weight-medium">{{ item.contract_number || ('#' + item.contract_id) }}</div>
            <div v-if="item.partner_name" class="text-caption text-medium-emphasis">{{ item.partner_name }}</div>
          </template>
          <template v-else>
            <a
              class="no-contract-link"
              role="button"
              tabindex="0"
              title="Нет договора — нажмите, чтобы создать партнёрский договор для этого аккаунта"
              @click="goCreateContract(item)"
              @keydown.enter="goCreateContract(item)"
            >
              <v-icon size="13" class="mr-1">mdi-file-plus-outline</v-icon>без договора
            </a>
            <div class="text-body-2">{{ ownerLabel(item) }}</div>
          </template>
        </template>
        <template #item.active_objects_count="{ item }">
          <span class="font-weight-medium">{{ item.active_objects_count }}</span>
          <span class="text-medium-emphasis text-caption"> / {{ item.total_objects_count }}</span>
        </template>
        <template #item.verify_status="{ item }">
          <v-chip :color="verifyColor(item.verify_status)" size="x-small" variant="tonal">
            {{ verifyLabel(item.verify_status) }}
          </v-chip>
          <span v-if="item.amount_at_risk && Number(item.amount_at_risk) > 0" class="text-caption text-warning ml-1">
            ⚠ {{ formatMoney(item.amount_at_risk) }}
          </span>
        </template>
        <template #item.daily_cost="{ item }">
          <template v-if="item.contract_id">
            {{ formatMoney(item.daily_cost) }} ₽
          </template>
          <template v-else>
            <span class="text-medium-emphasis">{{ formatMoney(item.daily_cost) }} ₽</span>
            <div class="text-caption text-medium-emphasis" title="Нет договора — посчитано по тарифу по умолчанию (70₽/объект). В биллинг не идёт.">
              ориентир · по умолч. тарифу
            </div>
          </template>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            v-if="item.verify_status === 'needs_review' || item.verify_status === 'estimated'"
            color="success"
            size="x-small"
            variant="tonal"
            @click="openApprove(item)"
          >
            Подтвердить
          </v-btn>
        </template>
        <template #no-data>
          <div class="py-6 text-center text-medium-emphasis">Снимков по фильтру нет</div>
        </template>
      </v-data-table>

      <!-- Низ: очередь + обновить + пагинация -->
      <div class="d-flex align-center mt-2 gap-2">
        <v-chip v-if="reviewCount > 0" color="warning" variant="tonal" size="small">
          На проверке: {{ reviewCount }} · ₽ под риском: {{ reviewAtRisk }}
        </v-chip>
        <v-btn icon="mdi-refresh" variant="text" size="small" :loading="loading" @click="reload" />
        <v-spacer />
        <span class="text-caption text-medium-emphasis">Всего: {{ total }}</span>
        <v-btn icon="mdi-chevron-left" variant="text" size="small" :disabled="offset === 0 || loading" @click="prevPage" />
        <span class="text-caption">{{ offset + 1 }}–{{ Math.min(offset + limit, total) }}</span>
        <v-btn icon="mdi-chevron-right" variant="text" size="small" :disabled="offset + limit >= total || loading" @click="nextPage" />
      </div>
    </v-card-text>

    <!-- Диалог подтверждения -->
    <v-dialog v-model="approveDialog" max-width="480">
      <v-card>
        <v-card-title>Подтвердить снимок вручную</v-card-title>
        <v-card-text>
          <p class="text-body-2 mb-2" v-if="approveTarget">
            {{ approveTarget.partner_source }} · договор #{{ approveTarget.contract_id }} ·
            {{ formatDate(approveTarget.snapshot_date) }} · активных {{ approveTarget.active_objects_count }}
          </p>
          <p class="text-caption text-medium-emphasis mb-3" v-if="approveTarget?.verify_notes">
            Причина: {{ approveTarget.verify_notes }}
          </p>
          <v-textarea
            v-model="approveComment"
            label="Комментарий (зачем подтверждаем)"
            rows="2"
            variant="outlined"
            density="compact"
            auto-grow
          />
          <p class="text-caption text-warning">
            Подтверждённый снимок включается в биллинг и замораживается — ночной пересчёт его не трогает.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="approveDialog = false">Отмена</v-btn>
          <v-btn color="success" :loading="approving" @click="confirmApprove">Подтвердить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3500">{{ snackbarText }}</v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { config } from '@/config/env';

const router = useRouter();

interface PartnerSnapshot {
  id: number;
  snapshot_date: string;
  partner_source: string;
  contract_id: number;
  contract_number?: string;
  partner_external_id?: string;
  partner_name?: string;
  total_objects_count: number;
  active_objects_count: number;
  verify_status: string;
  amount_at_risk: string | number;
  verify_notes?: string;
  daily_cost: string | number;
}

const sources = [
  { value: '', label: 'Все' },
  { value: 'axenta', label: 'Axenta' },
  { value: 'skif', label: 'SKIF' },
  { value: 'wialon', label: 'Wialon' },
  { value: 'gelios', label: 'GELIOS' },
];
const verifyStatuses = [
  { value: '', label: 'Все' },
  { value: 'verified', label: 'Подтверждён' },
  { value: 'needs_review', label: 'На проверке' },
  { value: 'estimated', label: 'Оценка' },
  { value: 'manual_approved', label: 'Подтверждён вручную' },
];

const headers = [
  { title: '№', key: 'rownum', sortable: false, width: 48 },
  { title: 'Дата', key: 'snapshot_date', sortable: false },
  { title: 'Система', key: 'partner_source', sortable: false },
  { title: 'Договор', key: 'contract_id', sortable: false },
  { title: 'Активных / всего', key: 'active_objects_count', sortable: false },
  { title: 'Сверка', key: 'verify_status', sortable: false },
  { title: 'Стоимость/день', key: 'daily_cost', align: 'end' as const, sortable: false },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
];

const rows = ref<PartnerSnapshot[]>([]);
const total = ref(0);
const limit = ref(50);
const offset = ref(0);
const loading = ref(false);
const sourceFilter = ref('');
const verifyFilter = ref('');
const dateFrom = ref(''); // YYYY-MM-DD; пусто = без нижней границы
const dateTo = ref('');   // YYYY-MM-DD; пусто = без верхней границы

// Короткая подпись активного периода для воронки в шапке «Дата».
const dateRangeLabel = computed(() => {
  const f = dateFrom.value ? formatDate(dateFrom.value) : '';
  const t = dateTo.value ? formatDate(dateTo.value) : '';
  if (f && t) return `${f}–${t}`;
  if (f) return `с ${f}`;
  if (t) return `по ${t}`;
  return '';
});

const reviewCount = ref(0);
const reviewAtRisk = ref('0.00');

const approveDialog = ref(false);
const approveTarget = ref<PartnerSnapshot | null>(null);
const approveComment = ref('');
const approving = ref(false);

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

function authHeaders() {
  const token = localStorage.getItem('axenta_token');
  const companyData = localStorage.getItem('axenta_company');
  const tenantId = companyData ? JSON.parse(companyData).id : '';
  return { Authorization: `Bearer ${token}`, 'X-Tenant-ID': String(tenantId) };
}

async function loadRows() {
  loading.value = true;
  try {
    const params: Record<string, any> = { limit: limit.value, offset: offset.value };
    if (sourceFilter.value) params.source = sourceFilter.value;
    if (verifyFilter.value) params.verify_status = verifyFilter.value;
    if (dateFrom.value) params.start_date = dateFrom.value;
    if (dateTo.value) params.end_date = dateTo.value;
    const r = await axios.get(`${config.apiBaseUrl}/auth/partner-snapshots/list`, {
      headers: authHeaders(),
      params,
    });
    rows.value = r.data.snapshots || [];
    total.value = r.data.total || 0;
  } catch (e: any) {
    showSnack(e?.response?.data?.error || 'Ошибка загрузки снимков', 'error');
  } finally {
    loading.value = false;
  }
}

async function loadReviewSummary() {
  try {
    const r = await axios.get(`${config.apiBaseUrl}/auth/partner-snapshots/review-queue`, {
      headers: authHeaders(),
    });
    reviewCount.value = r.data.count || 0;
    reviewAtRisk.value = r.data.total_at_risk || '0.00';
  } catch {
    reviewCount.value = 0;
  }
}

function reload() {
  loadRows();
  loadReviewSummary();
}

function nextPage() {
  if (offset.value + limit.value < total.value) {
    offset.value += limit.value;
    loadRows();
  }
}
function prevPage() {
  if (offset.value > 0) {
    offset.value = Math.max(0, offset.value - limit.value);
    loadRows();
  }
}

watch([sourceFilter, verifyFilter, dateFrom, dateTo], () => {
  offset.value = 0;
  loadRows();
});

function openApprove(item: PartnerSnapshot) {
  approveTarget.value = item;
  approveComment.value = '';
  approveDialog.value = true;
}

async function confirmApprove() {
  if (!approveTarget.value) return;
  approving.value = true;
  try {
    await axios.post(
      `${config.apiBaseUrl}/auth/partner-snapshots/${approveTarget.value.id}/approve`,
      { comment: approveComment.value },
      { headers: authHeaders() }
    );
    showSnack('Снимок подтверждён и включён в биллинг', 'success');
    approveDialog.value = false;
    reload();
  } catch (e: any) {
    showSnack(e?.response?.data?.error || 'Ошибка подтверждения', 'error');
  } finally {
    approving.value = false;
  }
}

function showSnack(text: string, color: string) {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
}

function labelOf(opts: { value: string; label: string }[], val: string) {
  return opts.find((o) => o.value === val)?.label || val;
}
// Подсветка строк «без договора» — привлекает внимание админа (аккаунт без оформленного договора).
function rowProps({ item }: { item: PartnerSnapshot }) {
  return item.contract_id ? {} : { class: 'row-no-contract' };
}
function ownerLabel(item: PartnerSnapshot) {
  if (item.partner_name) return item.partner_name;
  if (item.partner_external_id) return `акк. ${item.partner_external_id}`;
  return '—';
}
// Клик по «без договора» → создание партнёрского договора с пред-выбранным аккаунтом.
function goCreateContract(item: PartnerSnapshot) {
  router.push({
    name: 'CreateContract',
    query: {
      type: 'partner',
      source: item.partner_source,
      partner_external_id: item.partner_external_id || '',
      partner_name: ownerLabel(item),
    },
  });
}
function formatDate(s: string) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('ru-RU');
}
function formatMoney(v: string | number) {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return (n || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function sourceColor(s: string) {
  return { axenta: 'indigo', skif: 'teal', wialon: 'blue', gelios: 'deep-orange' }[s] || 'grey';
}
function verifyColor(s: string) {
  return { verified: 'success', needs_review: 'warning', estimated: 'info', manual_approved: 'purple' }[s] || 'grey';
}
function verifyLabel(s: string) {
  return ({
    verified: 'Подтверждён',
    needs_review: 'На проверке',
    estimated: 'Оценка',
    manual_approved: 'Вручную',
  } as Record<string, string>)[s] || s;
}

onMounted(reload);
</script>

<style scoped>
.header-filter {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
}
.header-filter:hover {
  color: rgb(var(--v-theme-primary));
}
/* «без договора» — подсветка для внимания админа. Фон на td с !important:
   tr-фон перекрывается фоном ячеек в v-data-table. */
.row-no-contract > td {
  background-color: rgba(255, 152, 0, 0.13) !important;
}
.row-no-contract:hover > td {
  background-color: rgba(255, 152, 0, 0.22) !important;
}
.row-no-contract > td:first-child {
  border-left: 3px solid rgb(var(--v-theme-warning));
}
/* «без договора» как кликабельная ссылка → создание договора */
.no-contract-link {
  display: inline-flex;
  align-items: center;
  color: rgb(var(--v-theme-warning));
  font-weight: 600;
  font-size: 0.8125rem;
  cursor: pointer;
  text-decoration: underline dotted;
  text-underline-offset: 2px;
}
.no-contract-link:hover {
  text-decoration: underline solid;
  filter: brightness(0.9);
}
</style>
