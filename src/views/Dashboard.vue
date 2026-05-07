<template>
  <div class="dash">
    <div class="dash-head">
      <div class="search-wrap">
        <div class="search-box" :class="{ focused: searchFocused || searchOpen }">
          <v-icon size="16" class="search-icon">mdi-magnify</v-icon>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск: объект, клиент, № контракта, № счёта..."
            class="search-input"
            @focus="searchFocused = true"
            @blur="onSearchBlur"
            @input="onSearchInput"
            @keydown.escape="closeSearch"
          />
          <v-progress-circular v-if="searching" size="14" width="2" indeterminate color="primary" class="ml-2" />
          <v-icon v-else-if="searchQuery" size="16" class="clear-icon" @mousedown.prevent="clearSearch">mdi-close-circle</v-icon>
        </div>

        <!-- Dropdown результатов -->
        <div v-if="searchOpen" class="search-dropdown">
          <div v-if="!searchTotal && !searching && searchQuery.length >= 2" class="search-empty">
            Ничего не найдено
          </div>

          <template v-for="group in searchGroups" :key="group.key">
            <div v-if="group.items.length" class="search-group">
              <div class="search-group-title">
                <v-icon size="14" class="mr-2">{{ group.icon }}</v-icon>
                {{ group.label }} <span class="search-group-count">{{ group.items.length }}</span>
              </div>
              <div
                v-for="item in group.items"
                :key="item.id"
                class="search-item"
                @mousedown.prevent="goToResult(item)"
              >
                <div class="search-item-title">{{ item.title }}</div>
                <div v-if="item.subtitle" class="search-item-subtitle">{{ item.subtitle }}</div>
              </div>
            </div>
          </template>

          <div v-if="searchQuery.length < 2 && !searching" class="search-hint">
            Введите минимум 2 символа
          </div>
        </div>
      </div>
    </div>

    <!-- TOP: 4 KPI + chart -->
    <div class="top-grid">
      <div class="kpi-block">
        <div class="kpi highlight" @click="goObjects({ status: 'active' })">
          <div class="kpi-head">Активные объекты <v-icon size="14" class="dots">mdi-dots-vertical</v-icon></div>
          <div class="kpi-value">{{ formatNum(combinedActiveObjects) }}</div>
          <span class="kpi-delta">{{ combinedObjectsActivityPct }}% активных</span>
        </div>
        <div class="kpi" @click="goAccounts({ type: 'client' })">
          <div class="kpi-head">Учётные записи <v-icon size="14" class="dots">mdi-dots-vertical</v-icon></div>
          <div class="kpi-value">{{ formatNum(combinedAccountsTotal) }}</div>
          <span class="kpi-delta">{{ formatNum(combinedAccountsClients) }} клиентов</span>
        </div>
        <div class="kpi" @click="$router.push('/billing')">
          <div class="kpi-head">Выручка месяц <v-icon size="14" class="dots">mdi-dots-vertical</v-icon></div>
          <div class="kpi-value">{{ monthlyRevenueText }}</div>
          <span class="kpi-delta" :class="revenueDirClass">{{ revenueDeltaText }}</span>
        </div>
        <div class="kpi" :class="{warn: overdueCount > 0}" @click="$router.push('/billing/overdue')">
          <div class="kpi-head">Дебиторка <v-icon size="14" class="dots">mdi-dots-vertical</v-icon></div>
          <div class="kpi-value">{{ overdueText }}</div>
          <span class="kpi-delta" :class="{down: overdueCount > 0}">{{ overdueCount }} счетов</span>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-head">
          <div class="chart-title">Объекты и Выручка</div>
          <div class="chart-period-toggle">
            <button v-for="opt in chartPeriodOptions" :key="opt.value"
              :class="['period-btn', { active: chartPeriod === opt.value }]"
              @click="setChartPeriod(opt.value)">
              {{ opt.label }}
            </button>
          </div>
          <div class="chart-legend">
            <span><span class="dot lavender"></span>Axenta</span>
            <span v-if="hasWH"><span class="dot wh"></span>WH</span>
            <span v-if="hasWL"><span class="dot wl"></span>WL</span>
            <span v-if="chartHasRevenue"><span class="dot blue"></span>Выручка</span>
          </div>
        </div>
        <div class="chart-area">
          <div v-if="!chartHasData" class="chart-stub">Загрузка данных…</div>
          <div v-else class="small-multiples">
            <div v-for="s in sparks" :key="s.key" class="spark-card spark-card--clickable"
              :style="{ '--spark-color': s.color }" @click="openDrilldown(s)" :title="`Открыть детально: ${s.label}`">
              <div class="spark-head">
                <span class="spark-dot" :style="{ background: s.color }" />
                <span class="spark-label">{{ s.label }}</span>
              </div>
              <div class="spark-value-row">
                <span class="spark-value">{{ s.current.toLocaleString('ru-RU') }}</span>
                <span :class="['spark-delta', 'spark-delta--' + s.deltaDir]">
                  <v-icon size="14">
                    {{ s.deltaDir === 'up' ? 'mdi-arrow-up-bold' : s.deltaDir === 'down' ? 'mdi-arrow-down-bold' : 'mdi-minus' }}
                  </v-icon>
                  {{ formatDelta(s.deltaPct, s.deltaDir) }}
                </span>
              </div>
              <div v-if="s.hasStatus" class="status-bar-row">
                <div class="status-bar" :title="`Активные: ${s.active.toLocaleString('ru-RU')} · Неактивные: ${s.inactive.toLocaleString('ru-RU')}`">
                  <div class="status-bar-fill" :style="{ width: s.activePct + '%' }"></div>
                </div>
                <span class="status-bar-text">{{ Math.round(s.activePct) }}% активных</span>
              </div>
              <svg :viewBox="`0 0 ${SPARK_W} ${SPARK_H}`" :width="SPARK_W" :height="SPARK_H" class="spark-svg" preserveAspectRatio="none">
                <path :d="s.areaPath" :fill="s.color" fill-opacity="0.12" />
                <path :d="s.linePath" :stroke="s.color" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div class="spark-foot">
                <span>min <b>{{ s.min.toLocaleString('ru-RU') }}</b></span>
                <span>max <b>{{ s.max.toLocaleString('ru-RU') }}</b></span>
              </div>
            </div>

            <!-- Revenue card (если есть оплаты) -->
            <div v-if="chartHasRevenue" class="spark-card" style="--spark-color: #007aff">
              <div class="spark-head">
                <span class="spark-dot" style="background: #007aff" />
                <span class="spark-label">Выручка</span>
              </div>
              <div class="spark-value-row">
                <span class="spark-value spark-value-revenue">{{ revenueTotalText }}</span>
              </div>
              <svg :viewBox="`0 0 ${SPARK_W} ${SPARK_H}`" :width="SPARK_W" :height="SPARK_H" class="spark-svg" preserveAspectRatio="none">
                <path :d="revenueSparkArea" fill="#007aff" fill-opacity="0.12" />
                <path :d="revenueSparkLine" stroke="#007aff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div class="spark-foot">
                <span v-for="cur in chartCurrencies" :key="cur">{{ cur }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Прирост по источникам за период (current − first) -->
        <div v-if="chartHasData" class="chart-bottom-strip">
          <div v-for="s in sparks" :key="'delta-' + s.key"
            class="strip-item"
            :class="{ 'strip-up': s.deltaDir === 'up', 'strip-down': s.deltaDir === 'down', 'strip-flat': s.deltaDir === 'flat' }"
          >
            <v-icon size="14" class="mr-1" :style="{ color: s.color }">mdi-circle-medium</v-icon>
            <span class="strip-label">{{ s.label }}:</span>
            <b class="ml-1">{{ formatGrowthAbs(s.current - s.first) }}</b>
            <span class="strip-period">за {{ periodLabel }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- BOTTOM: table + donut -->
    <div class="bot-grid">
      <div class="table-card">
        <div class="table-head">
          <h2>Топ-контракты по выручке</h2>
          <v-menu>
            <template #activator="{ props: menuProps }">
              <v-btn v-bind="menuProps" variant="tonal" size="small" class="filter-pill-btn">
                <v-icon size="14" start>mdi-calendar-range</v-icon>
                {{ contractsPeriodLabel }}
                <v-icon size="14" end>mdi-chevron-down</v-icon>
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item
                v-for="o in contractsPeriodOptions"
                :key="o.value"
                :active="contractsPeriod === o.value"
                @click="setContractsPeriod(o.value)"
              >
                <v-list-item-title>{{ o.label }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>

        <div v-if="loadingContracts && !topContracts.length" class="placeholder">
          <v-skeleton-loader type="list-item-three-line" />
        </div>
        <div v-else-if="!topContracts.length" class="placeholder">
          <v-icon size="32" class="mb-2 text-medium-emphasis">mdi-file-document-outline</v-icon>
          <div>Топ-контрактов нет в выбранном периоде</div>
        </div>
        <table v-else>
          <thead>
            <tr>
              <th>№</th>
              <th>Клиент</th>
              <th class="num">Объекты</th>
              <th class="num">Активные</th>
              <th class="num">Просроч.</th>
              <th class="num">MRR</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(c, i) in topContracts" :key="c.id">
              <td class="no">{{ i + 1 }}</td>
              <td class="client">
                <span class="avatar" :style="{background: avatarColor(i)}">{{ initials(c.client_name) }}</span>
                {{ c.client_name }}
                <small>{{ c.contract_number }}</small>
              </td>
              <td class="num">{{ formatNum(c.objects) }}</td>
              <td class="num">{{ formatNum(c.active) }}</td>
              <td class="num">{{ c.overdue }}</td>
              <td class="value" :class="{danger: c.overdue > 0}">{{ formatRubles(c.mrr) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <ChartDrilldownDialog v-model="drilldownOpen" :source="drilldownSource" :points="chartPoints" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ObjectsService } from "@/services/objectsService";
import { accountsService } from "@/services/accountsService";
import { dashboardKpiService, type KPIMetric, type DashboardAlert, type SearchResponse, type SearchResultItem, type SourceStats, type SourcesStatsResponse, type ChartPoint, type TopContractRow } from "@/services/dashboardKpiService";
import { onCrossSection } from "@/utils/crossSectionBus";
import ChartDrilldownDialog from "@/components/Dashboard/ChartDrilldownDialog.vue";

const router = useRouter();

const objectsStats = reactive({
  total: 0, active: 0, inactive: 0,
  scheduled_for_delete: 0, deleted: 0,
});
const accountsStats = reactive({ total: 0, active: 0, blocked: 0, clients: 0, partners: 0 });

// Multi-source: Axenta + WH + WL. Sources массив + total — combined.
// donutIdx 0 = "Все" (total), 1..N = sources[i-1]. Клик по карточке → следующий по кругу.
const sourcesStats = ref<SourcesStatsResponse>({
  sources: [],
  total: { key: "all", label: "Все", objects: { total: 0, active: 0, inactive: 0, deleted: 0 }, accounts: { total: 0, active: 0, blocked: 0, clients: 0, partners: 0 } },
});
const donutIdx = ref(0);

const kpiMetrics = ref<KPIMetric[]>([]);
const alerts = ref<DashboardAlert[]>([]);
const chartPoints = ref<ChartPoint[]>([]);
const chartCurrencies = ref<string[]>([]);
const chartPrimaryCurrency = computed(() => chartCurrencies.value[0] || "RUB");
const chartHoverIdx = ref<number | null>(null);

// Drilldown
const drilldownOpen = ref(false);
const drilldownSource = ref<any>(null);
function openDrilldown(spark: any) {
  drilldownSource.value = spark;
  drilldownOpen.value = true;
}
type ChartPeriod = "7d" | "1m" | "3m" | "6m" | "1y";
const chartPeriod = ref<ChartPeriod>((localStorage.getItem("dashboard_chart_period") as ChartPeriod) || "7d");
const chartPeriodOptions: { value: ChartPeriod; label: string }[] = [
  { value: "7d", label: "7 дней" },
  { value: "1m", label: "Месяц" },
  { value: "3m", label: "3 мес." },
  { value: "6m", label: "6 мес." },
  { value: "1y", label: "Год" },
];
async function reloadChart() {
  try {
    const r = await dashboardKpiService.getChart(chartPeriod.value);
    chartPoints.value = r.points;
    chartCurrencies.value = r.currencies;
    writeCache("chart", { points: r.points, currencies: r.currencies, period: chartPeriod.value });
  } catch (_) {
    // ignore
  }
}
function setChartPeriod(p: ChartPeriod) {
  chartPeriod.value = p;
  localStorage.setItem("dashboard_chart_period", p);
  reloadChart();
}

// === SVG chart geometry: 3 линии (Axenta + WH + WL) + revenue (если есть) ===
const CHART_W = 600;
const CHART_H = 220;
const CHART_PAD_T = 20;
const CHART_PAD_B = 30;

// === Small Multiples: 3 mini-chart с независимой Y-осью на каждый источник ===
const SPARK_W = 280;
const SPARK_H = 56;
const SPARK_PAD = 4;

interface SparkData {
  key: 'axenta' | 'wh' | 'wl';
  label: string;
  color: string;
  current: number;
  first: number;
  min: number;
  max: number;
  deltaPct: number;
  deltaDir: 'up' | 'down' | 'flat';
  linePath: string;
  areaPath: string;
  hasData: boolean;
  active: number;
  inactive: number;
  activePct: number;
  hasStatus: boolean;
}

// Процент активных и absolute значения active/inactive из sourcesStats
function sourceStatusFor(key: 'axenta' | 'wh' | 'wl') {
  const src = sourcesStats.value.sources.find(s => s.key === key);
  if (!src) return { active: 0, inactive: 0, total: 0, activePct: 0 };
  const total = src.objects.active + src.objects.inactive;
  const activePct = total > 0 ? (src.objects.active / total) * 100 : 0;
  return { active: src.objects.active, inactive: src.objects.inactive, total, activePct };
}

function buildSpark(key: 'axenta' | 'wh' | 'wl', label: string, color: string): SparkData {
  const points = chartPoints.value;
  const values = points.map(p => p[key]);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const current = values.length ? values[values.length - 1] : 0;
  const first = values.length ? values[0] : 0;
  const deltaAbs = current - first;
  const deltaPct = first > 0 ? (deltaAbs / first) * 100 : 0;
  let deltaDir: 'up' | 'down' | 'flat' = 'flat';
  if (deltaAbs > 0) deltaDir = 'up';
  else if (deltaAbs < 0) deltaDir = 'down';

  const status = sourceStatusFor(key);

  // Sparkline path. range=0 (все одинаковые) → центрируем линию по середине canvas.
  const rangeRaw = max - min;
  const innerH = SPARK_H - SPARK_PAD * 2;
  const innerW = SPARK_W - SPARK_PAD * 2;
  const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;
  const coords = values.map((v, i) => {
    const x = SPARK_PAD + i * stepX;
    const y = rangeRaw > 0
      ? SPARK_PAD + innerH * (1 - (v - min) / rangeRaw)
      : SPARK_PAD + innerH / 2; // flat-линия по центру
    return [x, y] as const;
  });
  const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const lastX = coords.length ? coords[coords.length - 1][0] : 0;
  const firstX = coords.length ? coords[0][0] : 0;
  const areaPath = linePath ? `${linePath} L ${lastX.toFixed(1)},${SPARK_H - SPARK_PAD} L ${firstX.toFixed(1)},${SPARK_H - SPARK_PAD} Z` : '';

  return {
    key, label, color,
    current, first, min, max,
    deltaPct, deltaDir,
    linePath, areaPath,
    hasData: values.some(v => v > 0),
    active: status.active,
    inactive: status.inactive,
    activePct: status.activePct,
    hasStatus: status.total > 0,
  };
}

const sparkAxenta = computed(() => buildSpark('axenta', 'Axenta', '#5856d6'));
const sparkWH = computed(() => buildSpark('wh', 'Wialon Hosting', '#34c759'));
const sparkWL = computed(() => buildSpark('wl', 'Wialon Local', '#ff9500'));

const sparks = computed(() => {
  const out = [sparkAxenta.value];
  if (sparkWH.value.hasData) out.push(sparkWH.value);
  if (sparkWL.value.hasData) out.push(sparkWL.value);
  return out;
});

function formatDelta(pct: number, dir: string): string {
  const abs = Math.abs(pct);
  const sign = dir === 'up' ? '+' : dir === 'down' ? '−' : '';
  return `${sign}${abs.toFixed(1)}%`;
}

function formatGrowthAbs(diff: number): string {
  const sign = diff > 0 ? '+' : diff < 0 ? '−' : '';
  return `${sign}${Math.abs(diff).toLocaleString('ru-RU')}`;
}

const periodLabel = computed(() => {
  const opt = chartPeriodOptions.find(o => o.value === chartPeriod.value);
  return opt?.label.toLowerCase() || '';
});

// Старые computed для совместимости (могут понадобиться где-то ниже)
const objectsMax = computed(() => {
  let m = 1;
  for (const p of chartPoints.value) {
    m = Math.max(m, p.axenta, p.wh, p.wl);
  }
  return m;
});

const innerH = CHART_H - CHART_PAD_T - CHART_PAD_B;

// Геометрия group bars: 3 столбика рядом per день (Axenta, WH, WL)
function buildBarFor(i: number, p: ChartPoint, total: number) {
  const n = chartPoints.value.length || 1;
  const slot = CHART_W / n;
  const groupWidth = slot * 0.85;
  const barWidth = groupWidth / 3;
  const groupX = i * slot + (slot - groupWidth) / 2;
  const baseY = CHART_PAD_T + innerH;

  const scale = (v: number) => (v / total) * innerH;
  const axentaH = scale(p.axenta);
  const whH = scale(p.wh);
  const wlH = scale(p.wl);

  return {
    slotCenter: i * slot + slot / 2,
    barWidth,
    axentaX: groupX,
    axentaY: baseY - axentaH,
    axentaH,
    whX: groupX + barWidth,
    whY: baseY - whH,
    whH,
    wlX: groupX + 2 * barWidth,
    wlY: baseY - wlH,
    wlH,
    hoverX: groupX - 2,
    hoverWidth: groupWidth + 4,
  };
}

const chartBars = computed(() => {
  return chartPoints.value.map((p, i) => buildBarFor(i, p, objectsMax.value));
});

const hasWH = computed(() => chartPoints.value.some(p => p.wh > 0));
const hasWL = computed(() => chartPoints.value.some(p => p.wl > 0));

const primaryRevenue = (p: ChartPoint): number => {
  const cur = chartPrimaryCurrency.value;
  const r = p.revenues.find(rv => rv.currency === cur);
  return r?.raw || 0;
};
const revenueMax = computed(() => {
  let m = 1;
  for (const p of chartPoints.value) {
    m = Math.max(m, primaryRevenue(p));
  }
  return m;
});
const revenueLinePath = computed(() => {
  const points = chartPoints.value;
  if (!points.length) return "";
  const max = revenueMax.value;
  const n = points.length;
  const slot = CHART_W / n;
  return points.map((p, i) => {
    const x = i * slot + slot / 2;
    const y = CHART_PAD_T + innerH * (1 - primaryRevenue(p) / max);
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
});

// Revenue sparkline + total
const revenueSparkLine = computed(() => {
  const points = chartPoints.value;
  if (!points.length) return "";
  const max = revenueMax.value;
  const innerHs = SPARK_H - SPARK_PAD * 2;
  const innerW = SPARK_W - SPARK_PAD * 2;
  const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;
  return points.map((p, i) => {
    const x = SPARK_PAD + i * stepX;
    const y = SPARK_PAD + innerHs * (1 - primaryRevenue(p) / max);
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
});
const revenueSparkArea = computed(() => {
  const line = revenueSparkLine.value;
  if (!line) return "";
  const n = chartPoints.value.length;
  const innerW = SPARK_W - SPARK_PAD * 2;
  const stepX = n > 1 ? innerW / (n - 1) : 0;
  const lastX = SPARK_PAD + (n - 1) * stepX;
  return `${line} L ${lastX.toFixed(1)},${SPARK_H - SPARK_PAD} L ${SPARK_PAD},${SPARK_H - SPARK_PAD} Z`;
});
const revenueTotalText = computed(() => {
  let total = 0;
  for (const p of chartPoints.value) total += primaryRevenue(p);
  return total.toLocaleString('ru-RU') + ' ' + (chartPrimaryCurrency.value === 'RUB' ? '₽' : chartPrimaryCurrency.value === 'KZT' ? '₸' : chartPrimaryCurrency.value);
});

const chartHasData = computed(() => chartPoints.value.length > 0);
const chartHasRevenue = computed(() => chartPoints.value.some(p => p.revenues.length > 0));

function chartLabelX(i: number): number {
  const n = chartPoints.value.length || 1;
  const slot = CHART_W / n;
  return i * slot + slot / 2;
}

const labelEvery = computed(() => {
  const n = chartPoints.value.length;
  if (n <= 8) return 1;
  if (n <= 14) return 2;
  if (n <= 30) return 5;
  return 10;
});
const loadingContracts = ref(false);
const topContracts = ref<TopContractRow[]>([]);
type ContractsPeriod = "month" | "quarter" | "year";
const contractsPeriod = ref<ContractsPeriod>((localStorage.getItem("dashboard_contracts_period") as ContractsPeriod) || "month");
const contractsPeriodOptions: { value: ContractsPeriod; label: string }[] = [
  { value: "month", label: "Этот месяц" },
  { value: "quarter", label: "Квартал" },
  { value: "year", label: "Год" },
];
const contractsPeriodLabel = computed(() => contractsPeriodOptions.find(o => o.value === contractsPeriod.value)?.label || "Этот месяц");

async function reloadContracts() {
  loadingContracts.value = true;
  try {
    const rows = await dashboardKpiService.getTopContracts(contractsPeriod.value, 10);
    topContracts.value = rows;
    writeCache("top_contracts", { rows, period: contractsPeriod.value });
  } catch {
    // silent
  } finally {
    loadingContracts.value = false;
  }
}
function setContractsPeriod(p: ContractsPeriod) {
  contractsPeriod.value = p;
  localStorage.setItem("dashboard_contracts_period", p);
  reloadContracts();
}

const objectsActivityPct = computed(() => {
  if (!objectsStats.total) return 0;
  return Math.round((objectsStats.active / objectsStats.total) * 100);
});

// Combined-метрики для KPI (Axenta + WH + WL)
const combinedActiveObjects = computed(() => sourcesStats.value.total.objects.active);
const combinedTotalObjects = computed(() =>
  sourcesStats.value.total.objects.active + sourcesStats.value.total.objects.inactive
);
const combinedObjectsActivityPct = computed(() => {
  const total = combinedTotalObjects.value;
  if (!total) return 0;
  return Math.round((combinedActiveObjects.value / total) * 100);
});
const combinedAccountsTotal = computed(() => sourcesStats.value.total.accounts.total);
const combinedAccountsClients = computed(() => sourcesStats.value.total.accounts.clients);

// Карусель донат-источников: [Все, Axenta, WH, WL] (только непустые)
const donutSources = computed<SourceStats[]>(() => {
  const out: SourceStats[] = [sourcesStats.value.total];
  for (const s of sourcesStats.value.sources) {
    // Скрываем системы у которых нет ни одного объекта — нечего показывать
    if (s.objects.active + s.objects.inactive + s.objects.deleted > 0) {
      out.push(s);
    }
  }
  return out;
});
const currentDonutSource = computed<SourceStats>(() => {
  const list = donutSources.value;
  if (!list.length) return sourcesStats.value.total;
  return list[Math.min(donutIdx.value, list.length - 1)];
});
const donutSourceLabel = computed(() => currentDonutSource.value.label);
const donutStats = computed(() => currentDonutSource.value.objects);
function cycleDonutSource() {
  const len = donutSources.value.length || 1;
  donutIdx.value = (donutIdx.value + 1) % len;
}

// Cross-section navigation: KPI клики и donut-arrow ведут на /objects, /accounts
// с предзаполненными фильтрами через query-params. Целевая страница читает
// route.query на mounted и применяет фильтры. "all" / пустые значения не передаём.
function goObjects(filters: Record<string, string | undefined>) {
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(filters)) {
    if (v && v !== "all") query[k] = v;
  }
  router.push({ path: "/objects", query });
}
function goAccounts(filters: Record<string, string | undefined>) {
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(filters)) {
    if (v && v !== "all") query[k] = v;
  }
  router.push({ path: "/accounts", query });
}

const monthlyRevenueText = computed(() => {
  const m = kpiMetrics.value.find(m => m.id === "monthly_revenue");
  return m?.value || "0 ₽";
});

const revenueDeltaText = computed(() => {
  const m = kpiMetrics.value.find(m => m.id === "monthly_revenue");
  if (!m) return "—";
  if (m.delta_percentage) {
    const sign = m.delta_percentage > 0 ? "+" : "";
    return `${sign}${m.delta_percentage.toFixed(1)}%`;
  }
  return m.delta || "—";
});
const revenueDirClass = computed(() => {
  const m = kpiMetrics.value.find(m => m.id === "monthly_revenue");
  if (!m) return "flat";
  return m.delta_direction === "down" ? "down" : (m.delta_direction === "up" ? "" : "flat");
});

const overdueCount = computed(() => {
  const a = alerts.value.find(a => a.id === "billing.overdue");
  return a?.count || 0;
});
const overdueText = computed(() => {
  const a = alerts.value.find(a => a.id === "billing.overdue");
  if (!a) return "0 ₽";
  const match = a.description.match(/(\d[\d\s]*)\s*₽/);
  return match ? match[0] : a.description;
});

const CIRC = 251.3;
// Donut использует выбранный источник (карусель). Корзина у WH/WL = 0,
// тогда легенда сама скрывает строку «Корзина».
const arcTotal = computed(() => donutStats.value.active + donutStats.value.inactive + donutStats.value.deleted);
const activeArc = computed(() => arcTotal.value ? (donutStats.value.active / arcTotal.value) * CIRC : 0);
const inactiveArc = computed(() => arcTotal.value ? (donutStats.value.inactive / arcTotal.value) * CIRC : 0);
const trashArc = computed(() => arcTotal.value ? (donutStats.value.deleted / arcTotal.value) * CIRC : 0);

function formatNum(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(n);
}
function formatRubles(n: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n) + " ₽";
}
function avatarColor(i: number): string {
  // Apple System Colors — спокойная палитра под основной #007AFF
  const colors = ["#007aff", "#5856d6", "#af52de", "#ff9500", "#34c759"];
  return colors[i % colors.length];
}
function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("");
}

// Stale-while-revalidate: моментально показываем последние данные из
// localStorage, параллельно запрашиваем свежие и обновляем когда придут.
const CACHE_PREFIX = "acrm_dashboard:";
function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}
function writeCache(key: string, data: unknown) {
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data)); } catch {}
}

async function load() {
  // 1. Hydrate из localStorage синхронно — UI рендерит мгновенно
  const cachedKPI = readCache<KPIMetric[]>("kpi");
  if (cachedKPI) kpiMetrics.value = cachedKPI;

  const cachedAlerts = readCache<DashboardAlert[]>("alerts");
  if (cachedAlerts) alerts.value = cachedAlerts;

  const cachedObjects = readCache<typeof objectsStats>("objects");
  if (cachedObjects) Object.assign(objectsStats, cachedObjects);

  const cachedAccounts = readCache<typeof accountsStats>("accounts");
  if (cachedAccounts) Object.assign(accountsStats, cachedAccounts);

  const cachedSources = readCache<SourcesStatsResponse>("sources_stats");
  if (cachedSources) sourcesStats.value = cachedSources;

  const cachedContracts = readCache<{ rows: TopContractRow[]; period: ContractsPeriod }>("top_contracts");
  if (cachedContracts && cachedContracts.period === contractsPeriod.value) {
    topContracts.value = cachedContracts.rows;
  }

  // 2. Фоновый refresh — обновляет UI и кеш когда данные пришли
  const objSvc = new ObjectsService();
  await Promise.all([
    objSvc.getObjectsStats().then(s => {
      Object.assign(objectsStats, s);
      writeCache("objects", s);
    }).catch(() => {}),
    accountsService.getAccountsStats().then(s => {
      Object.assign(accountsStats, s);
      writeCache("accounts", s);
    }).catch(() => {}),
    dashboardKpiService.getSourcesStats().then(r => {
      sourcesStats.value = r;
      writeCache("sources_stats", r);
    }).catch(() => {}),
    dashboardKpiService.getKPI().then(r => {
      kpiMetrics.value = r.metrics;
      writeCache("kpi", r.metrics);
    }).catch(() => {}),
    dashboardKpiService.getAlerts().then(a => {
      alerts.value = a;
      writeCache("alerts", a);
    }).catch(() => {}),
    dashboardKpiService.getChart(chartPeriod.value).then(r => {
      chartPoints.value = r.points;
      chartCurrencies.value = r.currencies;
      writeCache("chart", { points: r.points, currencies: r.currencies, period: chartPeriod.value });
    }).catch(() => {}),
    dashboardKpiService.getTopContracts(contractsPeriod.value, 10).then(rows => {
      topContracts.value = rows;
      writeCache("top_contracts", { rows, period: contractsPeriod.value });
    }).catch(() => {}),
  ]);
}

// =====================================================================
// Глобальный поиск (объекты / клиенты / контракты / счета)
// =====================================================================

const searchQuery = ref("");
const searchFocused = ref(false);
const searching = ref(false);
const searchResults = ref<SearchResponse>({ objects: [], clients: [], query: "" });
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const searchOpen = computed(() => searchFocused.value && (searchQuery.value.length > 0 || searchTotal.value > 0));

const searchTotal = computed(() => {
  return searchResults.value.objects.length + searchResults.value.clients.length;
});

const searchGroups = computed(() => [
  { key: "objects", label: "Объекты", icon: "mdi-radar", items: searchResults.value.objects },
  { key: "clients", label: "Учётные записи", icon: "mdi-domain", items: searchResults.value.clients },
]);

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer);
  if (searchQuery.value.trim().length < 2) {
    searchResults.value = { objects: [], clients: [], query: "" };
    return;
  }
  searchTimer = setTimeout(runSearch, 300);
}

async function runSearch() {
  const q = searchQuery.value.trim();
  if (q.length < 2) return;
  searching.value = true;
  try {
    searchResults.value = await dashboardKpiService.search(q, 8);
  } catch {
    searchResults.value = { objects: [], clients: [], query: q };
  } finally {
    searching.value = false;
  }
}

function onSearchBlur() {
  // Задержка чтобы клик по dropdown успел сработать
  setTimeout(() => { searchFocused.value = false; }, 200);
}

function clearSearch() {
  searchQuery.value = "";
  searchResults.value = { objects: [], clients: [], query: "" };
}

function closeSearch() {
  clearSearch();
  searchFocused.value = false;
}

function goToResult(item: SearchResultItem) {
  router.push(item.url);
  closeSearch();
}

// Слушаем cross-section события: когда другой раздел изменил данные —
// инвалидируем localStorage cache и перезагружаем KPI/donut. Дебаунс 1.5с
// чтобы 5 быстрых мутаций не вызвали 5 запросов.
let reloadTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleReload() {
  if (reloadTimer) clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    for (const k of ["objects", "accounts", "sources_stats", "kpi", "alerts"]) {
      try { localStorage.removeItem(CACHE_PREFIX + k); } catch {}
    }
    load();
  }, 1500);
}
const unsubAccounts = onCrossSection("accounts:mutated", scheduleReload);
const unsubUsers = onCrossSection("users:mutated", scheduleReload);
const unsubObjects = onCrossSection("objects:mutated", scheduleReload);

onMounted(load);
onUnmounted(() => {
  unsubAccounts();
  unsubUsers();
  unsubObjects();
  if (reloadTimer) clearTimeout(reloadTimer);
});
</script>

<style scoped>
.dash {
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", sans-serif;
  background: #fafafa;
  padding: 24px 32px;
}
.dash-head {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 20px;
}

/* Глобальный поиск */
.search-wrap {
  position: relative;
  width: 380px;
}
.search-box {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e5e5ea;
  border-radius: 12px;
  padding: 8px 14px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-box.focused {
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}
.search-icon { color: #8e8e93; margin-right: 8px; }
.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: #1d1d1f;
  font-family: inherit;
}
.search-input::placeholder { color: #c7c7cc; }
.clear-icon { color: #c7c7cc; cursor: pointer; }
.clear-icon:hover { color: #8e8e93; }

.search-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 480px;
  max-height: 480px;
  overflow-y: auto;
  background: white;
  border: 1px solid #e5e5ea;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  z-index: 100;
  padding: 8px 0;
}
.search-empty, .search-hint {
  padding: 16px;
  text-align: center;
  color: #8e8e93;
  font-size: 13px;
}
.search-group { padding: 4px 0; }
.search-group + .search-group { border-top: 1px solid #f5f5f7; }
.search-group-title {
  display: flex;
  align-items: center;
  padding: 8px 14px 6px;
  color: #8e8e93;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.search-group-count {
  margin-left: auto;
  background: #f2f2f7;
  color: #6e6e73;
  padding: 1px 8px;
  border-radius: 8px;
  font-size: 10px;
  letter-spacing: 0;
}
.search-item {
  padding: 8px 14px;
  cursor: pointer;
  transition: background 0.1s;
}
.search-item:hover { background: #f5f5f7; }
.search-item-title { font-size: 13px; font-weight: 500; color: #1d1d1f; }
.search-item-subtitle { font-size: 11px; color: #8e8e93; margin-top: 1px; }

.top-grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 16px;
  margin-bottom: 16px;
}
.kpi-block {
  background: white;
  border-radius: 18px;
  padding: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 8px;
}
/* Apple System Colors palette — унификация с sidebar #007AFF */
.kpi {
  background: #ffffff;
  border: 1px solid #e5e5ea;
  border-radius: 14px;
  padding: 16px 18px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.kpi:hover { background: #f5f5f7; border-color: #d2d2d7; }

/* Success highlight (Активные объекты — главный KPI) */
.kpi.highlight {
  background: #eaf9ee;
  border-color: #c1ecca;
}
.kpi.highlight:hover { background: #ddf3e3; }

/* Warning (Дебиторка) */
.kpi.warn {
  background: #fff4e5;
  border-color: #ffd9a8;
}
.kpi.warn:hover { background: #ffead0; }

.kpi-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #6e6e73;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 10px;
}
.kpi.highlight .kpi-head { color: #1a7a3e; }
.kpi.warn .kpi-head { color: #b35900; }
.dots { color: #c7c7cc; }
.kpi-value {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.5px;
  line-height: 1.1;
  margin-bottom: 6px;
  color: #1d1d1f;
}
.kpi.highlight .kpi-value { color: #0f5d2f; }
.kpi.warn .kpi-value { color: #8a4500; }

.kpi-delta {
  display: inline-block;
  background: #eaf9ee;
  color: #1a7a3e;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 8px;
}
.kpi.highlight .kpi-delta { background: rgba(52,199,89,0.18); color: #0f5d2f; }
.kpi.warn .kpi-delta { background: rgba(255,149,0,0.18); color: #8a4500; }
.kpi-delta.down { background: rgba(255,59,48,0.15); color: #c0231d; }
.kpi-delta.flat { background: #f2f2f7; color: #6e6e73; }

.chart-card {
  background: white;
  border-radius: 18px;
  padding: 22px;
  display: flex;
  flex-direction: column;
}
.chart-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
  flex-wrap: wrap;
}
.chart-title { font-size: 16px; font-weight: 700; }
.chart-legend { display: flex; gap: 16px; font-size: 12px; color: #555; }
.chart-legend .dot {
  display: inline-block;
  width: 8px; height: 8px; border-radius: 50%;
  margin-right: 6px; vertical-align: middle;
}
.chart-legend .blue { background: #007aff; }
.chart-legend .wh { background: #34c759; }
.chart-legend .wl { background: #ff9500; }
.chart-period-toggle {
  display: inline-flex;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  padding: 2px;
  gap: 1px;
  margin-right: 12px;
}
.period-btn {
  border: none;
  background: transparent;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}
.period-btn:hover { color: #000; }
.period-btn.active {
  background: white;
  color: #007aff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}
[data-theme="dark"] .chart-period-toggle { background: rgba(255, 255, 255, 0.06); }
[data-theme="dark"] .period-btn { color: #aaa; }
[data-theme="dark"] .period-btn:hover { color: #fff; }
[data-theme="dark"] .period-btn.active {
  background: rgba(0, 122, 255, 0.2);
  color: #5ac8fa;
  box-shadow: none;
}
.chart-legend .lavender { background: #5856d6; }
.chart-area { flex: 1; position: relative; }
.chart-area { position: relative; }
.chart-area svg { width: 100%; height: 220px; display: block; }
.chart-area svg rect { transition: opacity 0.15s; }
.chart-area svg rect.bar-hover { opacity: 0.75; }

/* Small Multiples — карточки с sparkline */
.small-multiples {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.spark-card {
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.spark-card--clickable {
  cursor: pointer;
  transition: all 0.15s;
}
.spark-card--clickable:hover {
  border-color: var(--spark-color, #5856d6);
  background: rgba(0, 0, 0, 0.04);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.spark-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.spark-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.spark-value-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}
.spark-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.5px;
}
.spark-value-revenue { font-size: 20px; }
.spark-delta {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 13px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}
.spark-delta--up {
  color: #1a8f3c;
  background: rgba(52, 199, 89, 0.12);
}
.spark-delta--down {
  color: #c0382b;
  background: rgba(255, 59, 48, 0.12);
}
.spark-delta--flat {
  color: #888;
  background: rgba(0, 0, 0, 0.05);
}
.spark-svg {
  width: 100%;
  height: 56px;
  display: block;
}
.status-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #666;
}
.status-bar {
  flex: 1;
  height: 6px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 3px;
  overflow: hidden;
}
.status-bar-fill {
  height: 100%;
  background: var(--spark-color, #34c759);
  border-radius: 3px;
  transition: width 0.3s;
}
.status-bar-text {
  font-size: 11px;
  color: #888;
  font-weight: 500;
  white-space: nowrap;
}
[data-theme="dark"] .status-bar { background: rgba(255, 255, 255, 0.08); }
.spark-foot {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #888;
}
.spark-foot b {
  color: #555;
  font-weight: 600;
  margin-left: 2px;
}

[data-theme="dark"] .spark-card {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.08);
}
[data-theme="dark"] .spark-value { color: #f5f5f5; }
[data-theme="dark"] .spark-foot b { color: #ccc; }
[data-theme="dark"] .spark-delta--flat {
  background: rgba(255, 255, 255, 0.06);
  color: #aaa;
}
.chart-bottom-strip {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  flex-wrap: wrap;
}
.strip-item {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  color: #555;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 6px;
}
.strip-label { color: #888; margin-right: 2px; }
.strip-period { color: #aaa; margin-left: 6px; font-size: 11px; }
.strip-up b { color: #1a8f3c; }
.strip-down b { color: #c0382b; }
.strip-flat b { color: #888; }
[data-theme="dark"] .chart-bottom-strip { border-top-color: rgba(255, 255, 255, 0.08); }
[data-theme="dark"] .strip-item { background: rgba(255, 255, 255, 0.04); color: #aaa; }
.chart-tooltip {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 10px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-size: 12px;
  min-width: 160px;
  pointer-events: none;
  z-index: 5;
}
.chart-tooltip-title { font-weight: 700; margin-bottom: 6px; font-size: 13px; }
.chart-tooltip-row { display: flex; align-items: center; gap: 6px; line-height: 1.6; }
.chart-tooltip-row .dot {
  display: inline-block; width: 8px; height: 8px; border-radius: 50%;
}
.chart-tooltip-row .lavender { background: #5856d6; }
.chart-tooltip-row .wh { background: #34c759; }
.chart-tooltip-row .wl { background: #ff9500; }
.chart-tooltip-row .blue { background: #007aff; }
.chart-tooltip-total { border-top: 1px solid rgba(0,0,0,0.08); margin-top: 4px; padding-top: 4px; }
.chart-tooltip-row.text-muted { color: #999; font-size: 11px; }
[data-theme="dark"] .chart-tooltip {
  background: rgba(28, 28, 30, 0.96);
  border-color: rgba(255, 255, 255, 0.1);
  color: #f0f0f0;
}
.chart-stub {
  position: absolute;
  bottom: 30px; left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.85);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  color: #999;
}

.bot-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
.table-card, .donut-card {
  background: white;
  border-radius: 18px;
  padding: 22px;
}
.table-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.table-head h2 { font-size: 18px; font-weight: 700; }
.filter-pill {
  background: #f5f5f5;
  border-radius: 10px;
  padding: 6px 12px;
  font-size: 12px;
  color: #555;
  display: flex;
  align-items: center;
  gap: 4px;
}
table { width: 100%; border-collapse: collapse; }
th {
  text-align: left;
  color: #999;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 10px 8px;
  border-bottom: 1px solid #f0f0f0;
}
th.num { text-align: right; }
td {
  padding: 14px 8px;
  border-bottom: 1px solid #f5f5f5;
  font-size: 13px;
}
tr:last-child td { border-bottom: none; }
td.no { color: #999; width: 30px; }
td.client { font-weight: 600; }
td.client small {
  display: block;
  font-weight: 400;
  color: #999;
  font-size: 10px;
  text-transform: uppercase;
  margin-top: 2px;
}
td.num { text-align: right; }
td.value { text-align: right; color: #34c759; font-weight: 600; }
td.value.danger { color: #ff3b30; }
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px; height: 32px;
  border-radius: 50%;
  margin-right: 10px;
  color: white;
  font-weight: 700;
  font-size: 12px;
  vertical-align: middle;
}
.placeholder {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.donut-card h2 {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.donut-card h2 .arrow { color: #aaa; cursor: pointer; }
.donut-area {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 16px 0;
}
.donut-svg { width: 200px; height: 200px; }
.donut-center {
  position: absolute;
  text-align: center;
  pointer-events: none;
}
.donut-center .total { font-size: 22px; font-weight: 700; }
.donut-center .lbl {
  font-size: 10px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}
.donut-legend {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.donut-legend span {
  font-size: 12px;
  color: #555;
  display: flex;
  align-items: center;
  gap: 6px;
}
.donut-legend .dot { width: 8px; height: 8px; border-radius: 50%; }
.donut-card.clickable { cursor: pointer; transition: transform 0.15s ease; }
.donut-card.clickable:hover { transform: translateY(-2px); }
.donut-card h2 .src-label {
  color: #007aff;
  font-weight: 600;
  margin-left: 4px;
}
.donut-pager {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 10px;
}
.donut-pager .dot-pager {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d8d8de;
  transition: background 0.15s ease, width 0.15s ease;
}
.donut-pager .dot-pager.active {
  background: #007aff;
  width: 18px;
  border-radius: 3px;
}

/* =====================================================================
   Tablet (< 1100px) — top-grid в одну колонку, KPI блок шире.
   Это покрывает iPad Mini (768) и iPad Pro 11" (834) — KPI плашки
   получают полную ширину и не выглядят сжатыми.
   ===================================================================== */
@media (max-width: 1100px) {
  .top-grid {
    grid-template-columns: 1fr;
  }
  /* KPI block шире — растягиваем по 4 в строку для tablet */
  .kpi-block {
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: 1fr;
  }
}

/* =====================================================================
   Mobile (< 900px) — одна колонка, search под заголовком, компакт.
   ===================================================================== */
@media (max-width: 900px) {
  .dash {
    padding: 16px;
  }
  .dash-head {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .search-wrap {
    width: 100%;
  }
  .search-dropdown {
    width: 100%;
    max-height: 60vh;
  }
  .top-grid,
  .bot-grid {
    grid-template-columns: 1fr;
  }
  .kpi-block {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
  }
  .kpi {
    padding: 12px 14px;
  }
  .kpi-value {
    font-size: 22px;
  }
  .chart-card,
  .table-card,
  .donut-card {
    padding: 16px;
  }
  .chart-area svg { height: 180px; }
  .donut-svg { width: 160px; height: 160px; }
  .donut-legend { gap: 8px; }
  .donut-legend span { font-size: 11px; }
  /* Таблица — горизонтальный скролл если не помещается */
  .table-card { overflow-x: auto; }
  table { min-width: 480px; }
}

/* Очень узкий экран (< 480px) — KPI в одну колонку */
@media (max-width: 480px) {
  .kpi-block {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, 1fr);
  }
  .kpi-value {
    font-size: 20px;
  }
}

/* placeholder — реальные dark-overrides ниже в non-scoped style */

[data-theme="dark"] .dash {
  background: #0a0a0a;
}
[data-theme="dark"] .kpi-block,
[data-theme="dark"] .chart-card,
[data-theme="dark"] .table-card,
[data-theme="dark"] .donut-card {
  background: #1c1c1e;
  border: 1px solid #2c2c2e;
}

[data-theme="dark"] .kpi {
  background: #2c2c2e;
  border-color: #3a3a3c;
}
[data-theme="dark"] .kpi:hover { background: #3a3a3c; }
[data-theme="dark"] .kpi.highlight {
  background: rgba(52, 199, 89, 0.18);
  border-color: rgba(52, 199, 89, 0.35);
}
[data-theme="dark"] .kpi.highlight:hover { background: rgba(52, 199, 89, 0.25); }
[data-theme="dark"] .kpi.highlight .kpi-head { color: #5ed47e; }
[data-theme="dark"] .kpi.highlight .kpi-value { color: #87f0a4; }

[data-theme="dark"] .kpi.warn {
  background: rgba(255, 149, 0, 0.18);
  border-color: rgba(255, 149, 0, 0.35);
}
[data-theme="dark"] .kpi.warn:hover { background: rgba(255, 149, 0, 0.25); }
[data-theme="dark"] .kpi.warn .kpi-head { color: #ffb340; }
[data-theme="dark"] .kpi.warn .kpi-value { color: #ffcc70; }

[data-theme="dark"] .kpi-head { color: #98989d; }
[data-theme="dark"] .dots { color: #636366; }
[data-theme="dark"] .kpi-value { color: #f5f5f7; }
[data-theme="dark"] .kpi-delta { background: rgba(52, 199, 89, 0.2); color: #5ed47e; }
[data-theme="dark"] .kpi.highlight .kpi-delta { background: rgba(52, 199, 89, 0.25); color: #87f0a4; }
[data-theme="dark"] .kpi.warn .kpi-delta { background: rgba(255, 149, 0, 0.22); color: #ffcc70; }
[data-theme="dark"] .kpi-delta.down { background: rgba(255, 59, 48, 0.2); color: #ff6961; }
[data-theme="dark"] .kpi-delta.flat { background: #2c2c2e; color: #98989d; }

[data-theme="dark"] .chart-title,
[data-theme="dark"] .table-head h2,
[data-theme="dark"] .donut-card h2,
[data-theme="dark"] .donut-center .total { color: #f5f5f7; }

[data-theme="dark"] .chart-legend,
[data-theme="dark"] .donut-legend span,
[data-theme="dark"] .donut-center .lbl { color: #98989d; }

[data-theme="dark"] .chart-stub {
  background: rgba(28, 28, 30, 0.85);
  color: #98989d;
}
[data-theme="dark"] .chart-area svg line { stroke: #2c2c2e; }
[data-theme="dark"] .chart-area svg text { fill: #636366; }

[data-theme="dark"] .filter-pill {
  background: #2c2c2e;
  color: #98989d;
}
[data-theme="dark"] th {
  color: #636366;
  border-bottom-color: #2c2c2e;
}
[data-theme="dark"] td {
  color: #f5f5f7;
  border-bottom-color: #2c2c2e;
}
[data-theme="dark"] td.no { color: #636366; }
[data-theme="dark"] td.client small { color: #636366; }

[data-theme="dark"] .placeholder { color: #636366; }

/* Search */
[data-theme="dark"] .search-box {
  background: #2c2c2e;
  border-color: #3a3a3c;
}
[data-theme="dark"] .search-box.focused {
  border-color: #0a84ff;
  box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.18);
}
[data-theme="dark"] .search-input { color: #f5f5f7; }
[data-theme="dark"] .search-input::placeholder { color: #636366; }
[data-theme="dark"] .search-icon { color: #98989d; }
[data-theme="dark"] .search-dropdown {
  background: #1c1c1e;
  border-color: #2c2c2e;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}
[data-theme="dark"] .search-empty,
[data-theme="dark"] .search-hint { color: #98989d; }
[data-theme="dark"] .search-group + .search-group { border-top-color: #2c2c2e; }
[data-theme="dark"] .search-group-title { color: #636366; }
[data-theme="dark"] .search-group-count { background: #2c2c2e; color: #98989d; }
[data-theme="dark"] .search-item:hover { background: #2c2c2e; }
[data-theme="dark"] .search-item-title { color: #f5f5f7; }
[data-theme="dark"] .search-item-subtitle { color: #98989d; }
</style>
