<template>
  <div class="dash">
    <div class="dash-head">
      <h1>Главная</h1>

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
        <div class="kpi highlight" @click="$router.push('/objects')">
          <div class="kpi-head">Активные объекты <v-icon size="14" class="dots">mdi-dots-vertical</v-icon></div>
          <div class="kpi-value">{{ formatNum(objectsStats.active) }}</div>
          <span class="kpi-delta">{{ objectsActivityPct }}% активных</span>
        </div>
        <div class="kpi" @click="$router.push('/accounts')">
          <div class="kpi-head">Учётные записи <v-icon size="14" class="dots">mdi-dots-vertical</v-icon></div>
          <div class="kpi-value">{{ formatNum(accountsStats.total) }}</div>
          <span class="kpi-delta">{{ formatNum(accountsStats.clients) }} клиентов</span>
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
          <div class="chart-legend">
            <span><span class="dot lavender"></span>Объекты</span>
            <span><span class="dot blue"></span>Выручка</span>
          </div>
        </div>
        <div class="chart-area">
          <svg viewBox="0 0 600 240" preserveAspectRatio="none">
            <line x1="0" y1="40" x2="600" y2="40" stroke="#f0f0f0" stroke-dasharray="2,4"/>
            <line x1="0" y1="100" x2="600" y2="100" stroke="#f0f0f0" stroke-dasharray="2,4"/>
            <line x1="0" y1="160" x2="600" y2="160" stroke="#f0f0f0" stroke-dasharray="2,4"/>
            <path d="M 0,160 C 80,150 120,130 200,120 C 280,110 340,90 420,80 C 480,72 540,68 600,60 L 600,220 L 0,220 Z"
                  fill="rgba(88,86,214,0.12)"/>
            <path d="M 0,160 C 80,150 120,130 200,120 C 280,110 340,90 420,80 C 480,72 540,68 600,60"
                  fill="none" stroke="#5856d6" stroke-width="2"/>
            <path d="M 0,60 C 80,80 140,90 200,110 C 280,130 340,150 420,140 C 480,130 540,110 600,90"
                  fill="none" stroke="#007aff" stroke-width="2.5"/>
            <text x="20"  y="234" font-size="11" fill="#999">Дек</text>
            <text x="120" y="234" font-size="11" fill="#999">Янв</text>
            <text x="220" y="234" font-size="11" fill="#999">Фев</text>
            <text x="320" y="234" font-size="11" fill="#999">Мар</text>
            <text x="420" y="234" font-size="11" fill="#999">Апр</text>
            <text x="520" y="234" font-size="11" fill="#999">Май</text>
          </svg>
          <div class="chart-stub">Mock-данные. Реальный график подключим во второй итерации.</div>
        </div>
      </div>
    </div>

    <!-- BOTTOM: table + donut -->
    <div class="bot-grid">
      <div class="table-card">
        <div class="table-head">
          <h2>Топ-контракты по выручке</h2>
          <div class="filter-pill">
            <v-icon size="14">mdi-magnify</v-icon> Период: <b style="margin-left:4px">Этот месяц</b>
          </div>
        </div>

        <div v-if="loadingContracts" class="placeholder">
          <v-skeleton-loader type="list-item-three-line" />
        </div>
        <div v-else-if="!topContracts.length" class="placeholder">
          <v-icon size="32" class="mb-2 text-medium-emphasis">mdi-file-document-outline</v-icon>
          <div>Топ-контрактов нет в текущем периоде</div>
          <div class="text-caption text-medium-emphasis mt-1">Endpoint /api/auth/dashboard/top-contracts — следующая итерация</div>
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

      <div class="donut-card">
        <h2>
          Статус объектов
          <v-icon size="18" class="arrow" @click="$router.push('/objects')">mdi-arrow-right</v-icon>
        </h2>
        <div class="donut-area">
          <svg class="donut-svg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#f0f0f0" stroke-width="14"/>
            <circle v-if="objectsStats.total > 0"
                    cx="50" cy="50" r="40" fill="none" stroke="#34c759" stroke-width="14"
                    :stroke-dasharray="`${activeArc} 251.3`" stroke-dashoffset="0"
                    transform="rotate(-90 50 50)"/>
            <circle v-if="objectsStats.total > 0"
                    cx="50" cy="50" r="40" fill="none" stroke="#ff9500" stroke-width="14"
                    :stroke-dasharray="`${inactiveArc} 251.3`"
                    :stroke-dashoffset="`-${activeArc}`"
                    transform="rotate(-90 50 50)"/>
            <circle v-if="objectsStats.total > 0"
                    cx="50" cy="50" r="40" fill="none" stroke="#ff3b30" stroke-width="14"
                    :stroke-dasharray="`${trashArc} 251.3`"
                    :stroke-dashoffset="`-${activeArc + inactiveArc}`"
                    transform="rotate(-90 50 50)"/>
          </svg>
          <div class="donut-center">
            <div class="total">{{ formatNum(objectsStats.total) }}</div>
            <div class="lbl">всего</div>
          </div>
        </div>
        <div class="donut-legend">
          <span><span class="dot" style="background:#34c759"></span>Активные · {{ formatNum(objectsStats.active) }}</span>
          <span><span class="dot" style="background:#ff9500"></span>Неактивные · {{ formatNum(objectsStats.inactive) }}</span>
          <span><span class="dot" style="background:#ff3b30"></span>Корзина · {{ formatNum(objectsStats.deleted + objectsStats.scheduled_for_delete) }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ObjectsService } from "@/services/objectsService";
import { accountsService } from "@/services/accountsService";
import { dashboardKpiService, type KPIMetric, type DashboardAlert, type SearchResponse, type SearchResultItem } from "@/services/dashboardKpiService";

const router = useRouter();

const objectsStats = reactive({
  total: 0, active: 0, inactive: 0,
  scheduled_for_delete: 0, deleted: 0,
});
const accountsStats = reactive({ total: 0, active: 0, blocked: 0, clients: 0, partners: 0 });
const kpiMetrics = ref<KPIMetric[]>([]);
const alerts = ref<DashboardAlert[]>([]);
const loadingContracts = ref(false);
const topContracts = ref<Array<{ id: number; client_name: string; contract_number: string; objects: number; active: number; overdue: number; mrr: number }>>([]);

const objectsActivityPct = computed(() => {
  if (!objectsStats.total) return 0;
  return Math.round((objectsStats.active / objectsStats.total) * 100);
});

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
const activeArc = computed(() => objectsStats.total ? (objectsStats.active / objectsStats.total) * CIRC : 0);
const inactiveArc = computed(() => objectsStats.total ? (objectsStats.inactive / objectsStats.total) * CIRC : 0);
const trashArc = computed(() => objectsStats.total ? ((objectsStats.deleted + objectsStats.scheduled_for_delete) / objectsStats.total) * CIRC : 0);

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
    dashboardKpiService.getKPI().then(r => {
      kpiMetrics.value = r.metrics;
      writeCache("kpi", r.metrics);
    }).catch(() => {}),
    dashboardKpiService.getAlerts().then(a => {
      alerts.value = a;
      writeCache("alerts", a);
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

onMounted(load);
</script>

<style scoped>
.dash {
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", sans-serif;
  background: #fafafa;
  padding: 24px 32px;
}
.dash-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.dash-head h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }

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
}
.chart-title { font-size: 16px; font-weight: 700; }
.chart-legend { display: flex; gap: 16px; font-size: 12px; color: #555; }
.chart-legend .dot {
  display: inline-block;
  width: 8px; height: 8px; border-radius: 50%;
  margin-right: 6px; vertical-align: middle;
}
.chart-legend .blue { background: #007aff; }
.chart-legend .lavender { background: #5856d6; }
.chart-area { flex: 1; position: relative; }
.chart-area svg { width: 100%; height: 220px; display: block; }
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
  grid-template-columns: 1.6fr 1fr;
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
  .dash-head h1 {
    font-size: 22px;
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
[data-theme="dark"] .dash-head h1 { color: #f5f5f7; }

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
