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
                <v-icon size="17" color="grey-darken-1" title="Дата снимка">mdi-calendar-range</v-icon>
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
                <v-icon size="17" color="grey-darken-1" title="Система">mdi-satellite-variant</v-icon>
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
                <v-icon size="17" color="grey-darken-1" title="Сверка">mdi-shield-check-outline</v-icon>
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
          <div class="d-flex align-center" style="gap: 6px">
            <v-tooltip :text="getSourceLabel(item.partner_source)" location="top">
              <template #activator="{ props }">
                <v-icon v-bind="props" :color="getSourceColor(item.partner_source)" size="22">{{ getSourceIcon(item.partner_source) }}</v-icon>
              </template>
            </v-tooltip>
            <!-- Сервис подключения (glomoskz/glomosuz/…) — чтобы не путать аккаунты под одним источником -->
            <span v-if="item.connection_name" class="text-caption text-medium-emphasis text-truncate" style="max-width: 130px" :title="item.connection_name">
              {{ item.connection_name }}
            </span>
          </div>
        </template>
        <!-- «Договор» → воронка-фильтр (поиск по номеру договора или имени партнёра) -->
        <template #header.contract_id>
          <v-menu :close-on-content-click="false">
            <template #activator="{ props }">
              <span v-bind="props" class="header-filter">
                <v-icon size="14" :color="contractQuery ? 'primary' : 'grey'">mdi-filter-variant</v-icon>
                <v-icon size="18" color="grey-darken-1" title="Договор">mdi-file-document-outline</v-icon>
                <span v-if="contractQuery" class="text-caption text-primary ml-1">«{{ contractQuery }}»</span>
              </span>
            </template>
            <v-card min-width="280" class="pa-3">
              <v-text-field
                v-model="contractQuery"
                label="Номер договора или партнёр"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                autofocus
                prepend-inner-icon="mdi-magnify"
              />
            </v-card>
          </v-menu>
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
        <!-- Заголовок «Активные / всего» — иконка (tooltip раскрывает смысл) -->
        <template #header.active_objects_count>
          <v-tooltip text="Активных / всего объектов" location="top">
            <template #activator="{ props }">
              <v-icon v-bind="props" color="success" size="18" style="cursor: help">mdi-checkbox-marked-circle-outline</v-icon>
            </template>
          </v-tooltip>
        </template>
        <template #item.active_objects_count="{ item }">
          <span class="font-weight-bold text-success">{{ item.active_objects_count }}</span>
          <span class="text-disabled text-caption"> / {{ item.total_objects_count }}</span>
        </template>
        <template #item.verify_status="{ item }">
          <v-tooltip :text="verifyLabel(item.verify_status)" location="top">
            <template #activator="{ props }">
              <v-icon v-bind="props" :color="verifyColor(item.verify_status)" size="20">{{ verifyIcon(item.verify_status) }}</v-icon>
            </template>
          </v-tooltip>
          <span v-if="item.amount_at_risk && Number(item.amount_at_risk) > 0" class="text-caption text-warning ml-1">
            ⚠ {{ formatMoney(item.amount_at_risk) }}
          </span>
        </template>
        <!-- Заголовок «Стоимость/день» → иконка (выравнивание справа из column align:end) -->
        <template #header.daily_cost>
          <v-tooltip text="Стоимость в день" location="top">
            <template #activator="{ props }">
              <v-icon v-bind="props" color="grey-darken-1" size="18" style="cursor: help">mdi-cash-clock</v-icon>
            </template>
          </v-tooltip>
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
          <div class="d-flex align-center justify-end" style="gap: 4px">
            <v-btn
              v-if="item.verify_status === 'needs_review' || item.verify_status === 'estimated'"
              color="success"
              size="x-small"
              variant="tonal"
              @click="openApprove(item)"
            >
              Подтвердить
            </v-btn>
            <!-- Рассчитать стоимость за период (как в договорах) — только для строк с договором -->
            <v-tooltip v-if="item.contract_id" text="Рассчитать стоимость" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-calculator"
                  size="x-small"
                  variant="text"
                  color="primary"
                  @click="openCost(item)"
                />
              </template>
            </v-tooltip>
            <!-- Скрыть/вернуть дилера-ориентир (только без договора) -->
            <v-tooltip v-if="!item.contract_id && !item.is_hidden" text="Скрыть дилера из справочника (все даты)" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-eye-off-outline"
                  size="x-small"
                  variant="text"
                  color="grey"
                  :loading="hidingId === item.id"
                  @click="hideDealer(item)"
                />
              </template>
            </v-tooltip>
            <v-tooltip v-if="!item.contract_id && item.is_hidden" text="Вернуть дилера в справочник" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-eye-outline"
                  size="x-small"
                  variant="text"
                  color="primary"
                  :loading="hidingId === item.id"
                  @click="unhideDealer(item)"
                />
              </template>
            </v-tooltip>
          </div>
        </template>
        <template #no-data>
          <div class="py-6 text-center text-medium-emphasis">Снимков по фильтру нет</div>
        </template>
      </v-data-table>

      <!-- Низ: очередь + обновить + пагинация (стиль страницы «Учётные записи») -->
      <div class="compact-pagination">
        <v-chip v-if="reviewCount > 0" color="warning" variant="tonal" size="small">
          На проверке: {{ reviewCount }} · ₽ под риском: {{ reviewAtRisk }}
        </v-chip>
        <v-btn
          v-if="reviewCount > 0"
          color="success"
          variant="tonal"
          size="small"
          prepend-icon="mdi-check-all"
          :loading="bulkApproving"
          @click="openBulkApprove"
        >
          Подтвердить всё
        </v-btn>
        <v-btn icon="mdi-refresh" variant="text" size="small" :loading="loading" @click="reload" />
        <!-- Показать/спрятать скрытые дилеры-ориентиры -->
        <v-btn
          :variant="showHidden ? 'tonal' : 'text'"
          :color="showHidden ? 'primary' : undefined"
          size="small"
          :prepend-icon="showHidden ? 'mdi-eye' : 'mdi-eye-off'"
          :title="showHidden ? 'Скрытые показаны (приглушены)' : 'Показать скрытые дилеры-ориентиры'"
          @click="toggleHidden"
        >
          {{ showHidden ? 'Скрытые показаны' : 'Показать скрытые' }}
        </v-btn>
        <v-spacer />
        <v-select
          :model-value="limit"
          :items="itemsPerPageOptions"
          variant="outlined"
          density="compact"
          class="items-select"
          hide-details
          @update:model-value="onItemsPerPageChange"
        />
        <span class="range-info">{{ displayRange }} из {{ total }}</span>
        <div class="nav-controls">
          <v-btn icon="mdi-page-first" variant="text" size="x-small" :disabled="currentPage === 1 || loading" title="Первая" @click="goToFirstPage" />
          <v-btn icon="mdi-chevron-left" variant="text" size="x-small" :disabled="currentPage === 1 || loading" title="Предыдущая" @click="prevPage" />
          <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
          <v-btn icon="mdi-chevron-right" variant="text" size="x-small" :disabled="currentPage === totalPages || loading" title="Следующая" @click="nextPage" />
          <v-btn icon="mdi-page-last" variant="text" size="x-small" :disabled="currentPage === totalPages || loading" title="Последняя" @click="goToLastPage" />
        </div>
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

    <!-- Массовое подтверждение всех заблокированных по текущим фильтрам -->
    <v-dialog v-model="bulkDialog" max-width="520">
      <v-card>
        <v-card-title>Подтвердить всё «на проверке»</v-card-title>
        <v-card-text>
          <p class="text-body-2 mb-2">
            Подтвердит ВСЕ снимки «оценка/на проверке» по текущим фильтрам:
            <template v-if="sourceFilter"> источник <b>{{ labelOf(sources, sourceFilter) }}</b>;</template>
            <template v-if="contractQuery"> «<b>{{ contractQuery }}</b>»;</template>
            <template v-if="dateFrom || dateTo"> период <b>{{ dateRangeLabel }}</b>;</template>
            <template v-if="!sourceFilter && !contractQuery && !dateFrom && !dateTo"> <b>без фильтров — ВСЕ заблокированные снимки тенанта</b>;</template>
          </p>
          <p class="text-caption text-medium-emphasis mb-3">
            Подтверждённые включатся в биллинг и заморозятся (ночной пересчёт не трогает).
            Статус-фильтр игнорируется — всегда только needs_review/estimated.
          </p>
          <v-textarea
            v-model="bulkComment"
            label="Комментарий (зачем подтверждаем)"
            rows="2"
            variant="outlined"
            density="compact"
            auto-grow
          />
          <p class="text-caption text-warning">
            На проверке сейчас: {{ reviewCount }} · ₽ под риском: {{ reviewAtRisk }}
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="bulkDialog = false">Отмена</v-btn>
          <v-btn color="success" :loading="bulkApproving" @click="confirmBulkApprove">Подтвердить всё</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Расчёт стоимости договора за период -->
    <PartnerCostDialog
      v-model="costDialog"
      :contract-id="costTarget?.contract_id"
      :contract-number="costTarget?.contract_number"
      :partner-name="costTarget?.partner_name"
      @error="showSnack($event, 'error')"
    />

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3500">{{ snackbarText }}</v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { config } from '@/config/env';
import { useUserAvatar } from '@/composables/useUserAvatar';
import PartnerCostDialog from './PartnerCostDialog.vue';

const router = useRouter();
// Общие иконки/цвета источников — те же, что в «Учётные записи»/«Пользователи».
const { getSourceIcon, getSourceColor, getSourceLabel } = useUserAvatar();

interface PartnerSnapshot {
  id: number;
  snapshot_date: string;
  partner_source: string;
  connection_id: number;
  connection_name?: string; // сервис подключения (glomoskz/glomosuz/…), резолвится в API
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
  is_hidden?: boolean; // дилер-ориентир скрыт (приходит при show_hidden=true)
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
  { title: 'Активные', key: 'active_objects_count', sortable: false },
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
const contractQuery = ref(''); // поиск по «Договор»: номер или имя партнёра (BE-параметр q)
const showHidden = ref(false); // показывать скрытые дилеры-ориентиры (BE-параметр show_hidden)
const hidingId = ref<number | null>(null); // id строки в процессе скрытия/возврата (спиннер)

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

const costDialog = ref(false);
const costTarget = ref<PartnerSnapshot | null>(null);
function openCost(item: PartnerSnapshot) {
  costTarget.value = item;
  costDialog.value = true;
}

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
    if (contractQuery.value.trim()) params.q = contractQuery.value.trim();
    if (dateFrom.value) params.start_date = dateFrom.value;
    if (dateTo.value) params.end_date = dateTo.value;
    if (showHidden.value) params.show_hidden = 'true';
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

// Пагинация в стиле страницы «Учётные записи» (select + X–Y из N + first/prev/next/last).
const itemsPerPageOptions = [
  { value: 5, title: '5' },
  { value: 10, title: '10' },
  { value: 25, title: '25' },
  { value: 50, title: '50' },
  { value: 75, title: '75' },
  { value: 100, title: '100' },
  { value: 150, title: '150' },
];
const currentPage = computed(() => Math.floor(offset.value / limit.value) + 1);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)));
const displayRange = computed(() =>
  total.value === 0 ? '0–0' : `${offset.value + 1}–${Math.min(offset.value + limit.value, total.value)}`
);
function goToFirstPage() {
  if (offset.value === 0) return;
  offset.value = 0;
  loadRows();
}
function goToLastPage() {
  const last = (totalPages.value - 1) * limit.value;
  if (offset.value === last) return;
  offset.value = last;
  loadRows();
}
function onItemsPerPageChange(v: number) {
  limit.value = v;
  offset.value = 0;
  loadRows();
}

// Текстовый поиск «Договор» — с дебаунсом (не дёргать запрос на каждый символ).
let cqTimer: ReturnType<typeof setTimeout> | null = null;
watch(contractQuery, () => {
  if (cqTimer) clearTimeout(cqTimer);
  cqTimer = setTimeout(() => {
    offset.value = 0;
    loadRows();
  }, 350);
});
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

// Массовое подтверждение: те же фильтры что в списке (source/q/период), BE форсит
// needs_review/estimated. Без фильтров — все заблокированные тенанта (диалог предупреждает).
const bulkDialog = ref(false);
const bulkApproving = ref(false);
const bulkComment = ref('');

function openBulkApprove() {
  bulkComment.value = '';
  bulkDialog.value = true;
}

async function confirmBulkApprove() {
  bulkApproving.value = true;
  try {
    const body: Record<string, any> = { comment: bulkComment.value };
    if (sourceFilter.value) body.source = sourceFilter.value;
    if (contractQuery.value.trim()) body.q = contractQuery.value.trim();
    if (dateFrom.value) body.start_date = dateFrom.value;
    if (dateTo.value) body.end_date = dateTo.value;
    // Нет фильтров → явное согласие на тенант-wide (BE требует approve_all, диалог предупредил).
    if (!body.source && !body.q && !body.start_date && !body.end_date) body.approve_all = true;
    const r = await axios.post(
      `${config.apiBaseUrl}/auth/partner-snapshots/approve-bulk`,
      body,
      { headers: authHeaders() }
    );
    showSnack(r.data.message || 'Снимки подтверждены', 'success');
    bulkDialog.value = false;
    reload();
  } catch (e: any) {
    showSnack(e?.response?.data?.error || 'Ошибка массового подтверждения', 'error');
  } finally {
    bulkApproving.value = false;
  }
}

// Скрытие/возврат дилера-ориентира (contract_id=0). Скрывает дилера ЦЕЛИКОМ (все даты) —
// BE ключует по source+connection_id+external_id. Договорные строки кнопок не имеют.
async function hideDealer(item: PartnerSnapshot) {
  hidingId.value = item.id;
  try {
    await axios.post(
      `${config.apiBaseUrl}/auth/partner-snapshots/hide-dealer`,
      { source: item.partner_source, connection_id: item.connection_id, external_id: item.partner_external_id },
      { headers: authHeaders() }
    );
    showSnack('Дилер скрыт из справочника', 'success');
    reload();
  } catch (e: any) {
    showSnack(e?.response?.data?.error || 'Ошибка скрытия', 'error');
  } finally {
    hidingId.value = null;
  }
}

async function unhideDealer(item: PartnerSnapshot) {
  hidingId.value = item.id;
  try {
    await axios.post(
      `${config.apiBaseUrl}/auth/partner-snapshots/unhide-dealer`,
      { source: item.partner_source, connection_id: item.connection_id, external_id: item.partner_external_id },
      { headers: authHeaders() }
    );
    showSnack('Дилер возвращён в справочник', 'success');
    reload();
  } catch (e: any) {
    showSnack(e?.response?.data?.error || 'Ошибка возврата', 'error');
  } finally {
    hidingId.value = null;
  }
}

function toggleHidden() {
  showHidden.value = !showHidden.value;
  offset.value = 0;
  loadRows();
}

function showSnack(text: string, color: string) {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
}

function labelOf(opts: { value: string; label: string }[], val: string) {
  return opts.find((o) => o.value === val)?.label || val;
}
// Подсветка строк «без договора» (внимание админа) + приглушение скрытых дилеров (при show_hidden).
function rowProps({ item }: { item: PartnerSnapshot }) {
  const classes: string[] = [];
  if (!item.contract_id) classes.push('row-no-contract');
  if (item.is_hidden) classes.push('row-hidden-dealer');
  return classes.length ? { class: classes.join(' ') } : {};
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
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
function formatMoney(v: string | number) {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return (n || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
// Тематическая иконка статуса сверки (цвет берётся из verifyColor).
function verifyIcon(s: string) {
  return ({
    verified: 'mdi-check-circle',        // подтверждён
    needs_review: 'mdi-alert-circle',    // на проверке — внимание
    estimated: 'mdi-progress-clock',     // оценка/прикидка
    manual_approved: 'mdi-shield-check', // подтверждён вручную (заморожен)
  } as Record<string, string>)[s] || 'mdi-help-circle';
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
   tr-фон перекрывается фоном ячеек в v-data-table. :deep() — строки v-data-table
   рендерит Vuetify (вне scope этого компонента), без :deep scoped-селектор их не цепляет. */
:deep(.row-no-contract > td) {
  background-color: rgba(255, 152, 0, 0.13) !important;
}
/* Скрытый дилер-ориентир (виден только при «Показать скрытые») — приглушён. */
:deep(.row-hidden-dealer > td) {
  opacity: 0.5;
}
:deep(.row-no-contract:hover > td) {
  background-color: rgba(255, 152, 0, 0.22) !important;
}
:deep(.row-no-contract > td:first-child) {
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

/* Пагинация 1:1 со страницей «Учётные записи» (AccountsTable.compact-pagination) */
.compact-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 14px 20px;
  flex-wrap: nowrap;
  white-space: nowrap;
  min-height: 40px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-top: 8px;
}
.items-select {
  min-width: 60px !important;
  width: fit-content !important;
  max-width: 120px !important;
  flex-shrink: 0;
  height: 40px;
}
.items-select :deep(.v-field) {
  min-width: 50px !important;
  width: auto !important;
}
.items-select :deep(.v-field__input) {
  min-width: 0 !important;
  width: auto !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
}
.items-select :deep(.v-field__append-inner) {
  padding-left: 4px !important;
}
.items-select :deep(.v-select__selection) {
  max-width: none !important;
  min-width: 0 !important;
}
.range-info {
  font-size: 0.9rem;
  color: #555;
  flex-shrink: 0;
  min-width: 120px;
  text-align: center;
  font-weight: 600;
  padding: 8px 12px;
  background-color: #f0f0f0;
  border-radius: 6px;
}
.nav-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 4px;
  background-color: #f0f0f0;
  border-radius: 6px;
}
.page-info {
  font-size: 0.9rem;
  color: #555;
  font-weight: 700;
  min-width: 50px;
  text-align: center;
  padding: 8px 12px;
  background-color: #e8e8e8;
  border-radius: 6px;
}
.nav-controls .v-btn {
  min-width: 32px !important;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background-color: white;
  border: 1px solid #ddd;
}
[data-theme="dark"] .compact-pagination {
  background-color: #1e1e1e;
}
[data-theme="dark"] .range-info,
[data-theme="dark"] .nav-controls {
  background-color: #2a2a2a;
  color: #ddd;
}
[data-theme="dark"] .page-info {
  background-color: #333;
  color: #eee;
}
[data-theme="dark"] .nav-controls .v-btn {
  background-color: #2a2a2a;
  border-color: #444;
}
</style>
