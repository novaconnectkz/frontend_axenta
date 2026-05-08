<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="1100" scrollable>
    <v-card v-if="source">
      <v-card-title class="d-flex align-center">
        <span class="dot mr-2" :style="{ background: source.color }" />
        <span>{{ source.label }}</span>
        <v-chip class="ml-3" size="small" :color="deltaChipColor" variant="tonal">
          <v-icon size="14" start>{{ deltaIcon }}</v-icon>
          {{ formatDelta(source.deltaPct, source.deltaDir) }}
        </v-chip>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('update:modelValue', false)" />
      </v-card-title>

      <v-divider />

      <v-card-text class="drilldown-body">
        <div class="kpi-row">
          <div class="kpi-item">
            <div class="kpi-label">Текущее</div>
            <div class="kpi-value">{{ source.current.toLocaleString('ru-RU') }}</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-label">В начале периода</div>
            <div class="kpi-value">{{ source.first.toLocaleString('ru-RU') }}</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-label">Прирост</div>
            <div class="kpi-value" :class="{ 'kpi-up': source.deltaDir === 'up', 'kpi-down': source.deltaDir === 'down' }">
              {{ formatGrowthAbs(source.current - source.first) }}
            </div>
          </div>
          <div class="kpi-item">
            <div class="kpi-label">Min · Max</div>
            <div class="kpi-value-sm">{{ source.min.toLocaleString('ru-RU') }} · {{ source.max.toLocaleString('ru-RU') }}</div>
          </div>
        </div>

        <!-- Большой chart с осями + сеткой + vertical guideline -->
        <div class="big-chart" @mousemove="onChartMove" @mouseleave="hoverIdx = null">
          <svg :viewBox="`0 0 ${BIG_W} ${BIG_H}`" preserveAspectRatio="none">
            <!-- горизонтальная сетка с метками Y -->
            <g v-for="(yTick, i) in yTicks" :key="'y-' + i">
              <line :x1="BIG_PAD_L" :y1="yTick.y" :x2="BIG_W - BIG_PAD_R" :y2="yTick.y" stroke="#eee" stroke-dasharray="2,3"/>
              <text :x="BIG_PAD_L - 6" :y="yTick.y + 3" font-size="11" fill="#888" text-anchor="end">{{ yTick.label }}</text>
            </g>

            <!-- area + line -->
            <path :d="bigAreaPath" :fill="source.color" fill-opacity="0.08"/>
            <path :d="bigLinePath" :stroke="source.color" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>

            <!-- точки -->
            <circle v-for="(c, i) in bigPoints" :key="'pt-' + i" :cx="c.x" :cy="c.y" r="3" :fill="source.color" :class="{ 'pt-active': hoverIdx === i }"/>

            <!-- vertical guideline на hover -->
            <g v-if="hoverIdx !== null && bigPoints[hoverIdx]">
              <line :x1="bigPoints[hoverIdx].x" y1="20" :x2="bigPoints[hoverIdx].x" :y2="BIG_H - BIG_PAD_B" stroke="#999" stroke-dasharray="3,3"/>
            </g>

            <!-- X labels -->
            <g v-for="(p, i) in points" :key="'xl-' + i">
              <text v-if="i % bigLabelEvery === 0 || i === points.length - 1"
                :x="bigPoints[i].x" :y="BIG_H - 6" font-size="11" fill="#888" text-anchor="middle">{{ p.month_label }}</text>
            </g>
          </svg>

          <div v-if="hoverIdx !== null && points[hoverIdx]" class="big-tooltip" :style="tooltipStyle">
            <div class="big-tooltip-title">{{ points[hoverIdx].month_label }}</div>
            <div class="big-tooltip-row">
              <span>Объектов:</span> <b>{{ valueAt(hoverIdx).toLocaleString('ru-RU') }}</b>
            </div>
            <div v-if="hoverIdx > 0" class="big-tooltip-row" :class="diffClass(hoverIdx)">
              <span>Изменение:</span> <b>{{ formatGrowthAbs(valueAt(hoverIdx) - valueAt(hoverIdx - 1)) }}</b>
            </div>
          </div>
        </div>

        <!-- Таблица детально по дням -->
        <div class="drilldown-table-wrap">
          <div class="drilldown-table-head">
            <h3>Детально по дням</h3>
            <v-btn size="small" variant="outlined" prepend-icon="mdi-microsoft-excel" :loading="exporting" @click="exportXLSX">Excel</v-btn>
          </div>
          <table class="drilldown-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th class="num">Объектов</th>
                <th class="num">Δ vs предыд.</th>
                <th class="num">+Создано</th>
                <th class="num">−Удалено</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, i) in [...points].reverse()" :key="p.month">
                <td>{{ p.month_label }} <span class="muted">{{ p.month }}</span></td>
                <td class="num"><b>{{ valueAt(points.length - 1 - i).toLocaleString('ru-RU') }}</b></td>
                <td class="num" :class="diffClass(points.length - 1 - i)">
                  {{ points.length - 1 - i > 0 ? formatGrowthAbs(valueAt(points.length - 1 - i) - valueAt(points.length - 2 - i)) : '—' }}
                </td>
                <td class="num diff-up">{{ formatCreated(p) }}</td>
                <td class="num diff-down">{{ formatDeleted(p) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Разбивка по подключениям -->
        <div v-if="connections.length > 0" class="drilldown-table-wrap">
          <div class="drilldown-table-head">
            <h3>
              Разбивка по подключениям
              <v-chip v-if="loadingDetail" size="x-small" variant="tonal" class="ml-2">загрузка…</v-chip>
            </h3>
          </div>
          <table class="drilldown-table">
            <thead>
              <tr>
                <th>Подключение</th>
                <th class="num">Текущее</th>
                <th class="num">+Создано</th>
                <th class="num">−Удалено</th>
                <th class="num">Δ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="conn in connections" :key="conn.id">
                <td>{{ conn.name }}</td>
                <td class="num"><b>{{ conn.total.toLocaleString('ru-RU') }}</b></td>
                <td class="num diff-up">{{ conn.created > 0 ? '+' + conn.created.toLocaleString('ru-RU') : '—' }}</td>
                <td class="num diff-down">{{ conn.deleted > 0 ? '−' + conn.deleted.toLocaleString('ru-RU') : '—' }}</td>
                <td class="num" :class="connDeltaClass(conn)">{{ formatConnDelta(conn) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { dashboardKpiService, type ChartPoint, type ConnectionDetail } from '@/services/dashboardKpiService';

interface SparkSource {
  key: 'axenta' | 'wh' | 'wl' | 'skif';
  label: string;
  color: string;
  current: number;
  first: number;
  min: number;
  max: number;
  deltaPct: number;
  deltaDir: 'up' | 'down' | 'flat';
}

const props = defineProps<{
  modelValue: boolean;
  source: SparkSource | null;
  points: ChartPoint[];
  period?: '7d' | '1m' | '3m' | '6m' | '1y';
}>();

defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const connections = ref<ConnectionDetail[]>([]);
const loadingDetail = ref(false);
const exporting = ref(false);

async function loadDetail() {
  if (!props.source) {
    connections.value = [];
    return;
  }
  loadingDetail.value = true;
  try {
    const r = await dashboardKpiService.getSourceDetail(props.source.key, props.period || '7d');
    connections.value = r.connections || [];
  } catch (_) {
    connections.value = [];
  } finally {
    loadingDetail.value = false;
  }
}

watch(() => [props.modelValue, props.source?.key, props.period], () => {
  if (props.modelValue && props.source) {
    loadDetail();
  } else if (!props.modelValue) {
    connections.value = [];
  }
}, { immediate: true });

function getCreated(p: ChartPoint): number {
  if (!props.source) return 0;
  const k = props.source.key;
  return Number((p as any)[`${k}_created`] || 0);
}
function getDeleted(p: ChartPoint): number {
  if (!props.source) return 0;
  const k = props.source.key;
  return Number((p as any)[`${k}_deleted`] || 0);
}
function formatCreated(p: ChartPoint): string {
  const v = getCreated(p);
  return v > 0 ? '+' + v.toLocaleString('ru-RU') : '—';
}
function formatDeleted(p: ChartPoint): string {
  const v = getDeleted(p);
  return v > 0 ? '−' + v.toLocaleString('ru-RU') : '—';
}

function connDeltaValue(conn: ConnectionDetail): number | null {
  // Δ = live total минус первая ненулевая точка истории.
  // history[].total часто = 0 для бакетов где нет snapshot — пропускаем.
  if (!conn.history.length) return null;
  let first = 0;
  for (const h of conn.history) {
    if (h.total > 0) { first = h.total; break; }
  }
  if (first === 0) return null;
  return conn.total - first;
}
function formatConnDelta(conn: ConnectionDetail): string {
  const d = connDeltaValue(conn);
  if (d === null) return '—';
  if (d === 0) return '0';
  return (d > 0 ? '+' : '−') + Math.abs(d).toLocaleString('ru-RU');
}
function connDeltaClass(conn: ConnectionDetail): string {
  const d = connDeltaValue(conn);
  if (d === null || d === 0) return 'diff-flat';
  return d > 0 ? 'diff-up' : 'diff-down';
}

const BIG_W = 1040;
const BIG_H = 320;
const BIG_PAD_L = 60;
const BIG_PAD_R = 16;
const BIG_PAD_T = 20;
const BIG_PAD_B = 30;

const hoverIdx = ref<number | null>(null);

function valueAt(i: number): number {
  if (!props.source || !props.points[i]) return 0;
  return props.points[i][props.source.key];
}

const bigPoints = computed(() => {
  if (!props.source || !props.points.length) return [];
  const values = props.points.map(p => p[props.source!.key]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerW = BIG_W - BIG_PAD_L - BIG_PAD_R;
  const innerH = BIG_H - BIG_PAD_T - BIG_PAD_B;
  const stepX = props.points.length > 1 ? innerW / (props.points.length - 1) : 0;
  return values.map((v, i) => ({
    x: BIG_PAD_L + i * stepX,
    y: max === min ? BIG_PAD_T + innerH / 2 : BIG_PAD_T + innerH * (1 - (v - min) / range),
  }));
});

const bigLinePath = computed(() => {
  return bigPoints.value.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
});

const bigAreaPath = computed(() => {
  if (!bigPoints.value.length) return '';
  const line = bigLinePath.value;
  const lastX = bigPoints.value[bigPoints.value.length - 1].x;
  const firstX = bigPoints.value[0].x;
  return `${line} L ${lastX.toFixed(1)},${BIG_H - BIG_PAD_B} L ${firstX.toFixed(1)},${BIG_H - BIG_PAD_B} Z`;
});

const yTicks = computed(() => {
  if (!props.source || !props.points.length) return [];
  const values = props.points.map(p => p[props.source!.key]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const innerH = BIG_H - BIG_PAD_T - BIG_PAD_B;
  if (max === min) {
    return [{ y: BIG_PAD_T + innerH / 2, label: max.toLocaleString('ru-RU') }];
  }
  const ticks = 4;
  const out = [];
  for (let i = 0; i <= ticks; i++) {
    const v = min + ((max - min) * (ticks - i)) / ticks;
    out.push({
      y: BIG_PAD_T + (innerH * i) / ticks,
      label: Math.round(v).toLocaleString('ru-RU'),
    });
  }
  return out;
});

const bigLabelEvery = computed(() => {
  const n = props.points.length;
  if (n <= 12) return 1;
  if (n <= 30) return 3;
  return 7;
});

function onChartMove(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * BIG_W;
  // Найти ближайшую точку
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < bigPoints.value.length; i++) {
    const dist = Math.abs(bigPoints.value[i].x - x);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  hoverIdx.value = bestIdx;
}

const tooltipStyle = computed(() => {
  if (hoverIdx.value === null || !bigPoints.value[hoverIdx.value]) return {};
  const x = (bigPoints.value[hoverIdx.value].x / BIG_W) * 100;
  const isRight = x > 75;
  return {
    left: isRight ? 'auto' : `calc(${x}% + 10px)`,
    right: isRight ? `calc(${100 - x}% + 10px)` : 'auto',
    top: '20px',
  };
});

function diffClass(i: number): string {
  if (i <= 0) return '';
  const diff = valueAt(i) - valueAt(i - 1);
  if (diff > 0) return 'diff-up';
  if (diff < 0) return 'diff-down';
  return 'diff-flat';
}

function formatGrowthAbs(diff: number): string {
  const sign = diff > 0 ? '+' : diff < 0 ? '−' : '';
  return `${sign}${Math.abs(diff).toLocaleString('ru-RU')}`;
}

function formatDelta(pct: number, dir: string): string {
  const abs = Math.abs(pct);
  const sign = dir === 'up' ? '+' : dir === 'down' ? '−' : '';
  return `${sign}${abs.toFixed(1)}%`;
}

const deltaIcon = computed(() => {
  if (!props.source) return '';
  return props.source.deltaDir === 'up' ? 'mdi-arrow-up-bold' : props.source.deltaDir === 'down' ? 'mdi-arrow-down-bold' : 'mdi-minus';
});

const deltaChipColor = computed(() => {
  if (!props.source) return 'default';
  return props.source.deltaDir === 'up' ? 'success' : props.source.deltaDir === 'down' ? 'error' : 'grey';
});

async function exportXLSX() {
  if (!props.source) return;
  exporting.value = true;
  try {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Axenta CRM';
    wb.created = new Date();

    // Лист 1: По дням
    const ws1 = wb.addWorksheet('По дням');
    ws1.columns = [
      { header: 'Дата', key: 'date', width: 14 },
      { header: 'Объектов', key: 'total', width: 12 },
      { header: 'Δ vs предыд.', key: 'diff', width: 14 },
      { header: '+Создано', key: 'created', width: 12 },
      { header: '−Удалено', key: 'deleted', width: 12 },
    ];
    ws1.getRow(1).font = { bold: true };
    for (let i = 0; i < props.points.length; i++) {
      const p = props.points[i];
      const v = valueAt(i);
      const diff = i > 0 ? v - valueAt(i - 1) : null;
      ws1.addRow({
        date: p.month,
        total: v,
        diff: diff,
        created: getCreated(p) || null,
        deleted: getDeleted(p) || null,
      });
    }

    // Лист 2: По подключениям (если breakdown есть)
    if (connections.value.length > 0) {
      const ws2 = wb.addWorksheet('По подключениям');
      ws2.columns = [
        { header: 'Подключение', key: 'name', width: 30 },
        { header: 'Тип', key: 'type', width: 12 },
        { header: 'Текущее', key: 'total', width: 12 },
        { header: '+Создано', key: 'created', width: 12 },
        { header: '−Удалено', key: 'deleted', width: 12 },
      ];
      ws2.getRow(1).font = { bold: true };
      for (const c of connections.value) {
        ws2.addRow({
          name: c.name,
          type: c.type,
          total: c.total,
          created: c.created || null,
          deleted: c.deleted || null,
        });
      }

      // Лист 3: Подробная история по подключениям
      if (connections.value.some(c => c.history.length > 0)) {
        const ws3 = wb.addWorksheet('История по подключениям');
        ws3.columns = [
          { header: 'Подключение', key: 'name', width: 30 },
          { header: 'Дата', key: 'date', width: 14 },
          { header: 'Объектов', key: 'total', width: 12 },
          { header: '+Создано', key: 'created', width: 12 },
          { header: '−Удалено', key: 'deleted', width: 12 },
        ];
        ws3.getRow(1).font = { bold: true };
        for (const c of connections.value) {
          for (const h of c.history) {
            ws3.addRow({
              name: c.name,
              date: h.date,
              total: h.total,
              created: h.created || null,
              deleted: h.deleted || null,
            });
          }
        }
      }
    }

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${props.source.key}-history-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    exporting.value = false;
  }
}
</script>

<style scoped>
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
.drilldown-body { padding: 16px 24px 24px; }

.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 12px 0 16px;
}
.kpi-item {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  padding: 10px 14px;
}
.kpi-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.4px; }
.kpi-value { font-size: 22px; font-weight: 700; margin-top: 2px; }
.kpi-value-sm { font-size: 14px; font-weight: 500; margin-top: 6px; }
.kpi-up { color: #1a8f3c; }
.kpi-down { color: #c0382b; }

.big-chart {
  position: relative;
  margin: 12px 0;
}
.big-chart svg {
  width: 100%;
  height: 320px;
  display: block;
  background: rgba(0, 0, 0, 0.01);
  border-radius: 8px;
}
.pt-active { r: 5; stroke: white; stroke-width: 2; }
.big-tooltip {
  position: absolute;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 10px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-size: 12px;
  pointer-events: none;
  min-width: 140px;
}
.big-tooltip-title { font-weight: 700; margin-bottom: 6px; font-size: 13px; }
.big-tooltip-row { display: flex; justify-content: space-between; gap: 12px; line-height: 1.6; }
.big-tooltip-row.diff-up b { color: #1a8f3c; }
.big-tooltip-row.diff-down b { color: #c0382b; }

.drilldown-table-wrap {
  margin-top: 16px;
}
.drilldown-table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.drilldown-table-head h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}
.drilldown-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.drilldown-table th {
  text-align: left;
  font-weight: 600;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  color: #555;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.drilldown-table th.num,
.drilldown-table td.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.drilldown-table td {
  padding: 6px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}
.drilldown-table .muted { color: #aaa; font-size: 11px; margin-left: 4px; }
.drilldown-table .diff-up { color: #1a8f3c; }
.drilldown-table .diff-down { color: #c0382b; }
.drilldown-table .diff-flat { color: #aaa; }

[data-theme="dark"] .kpi-item { background: rgba(255, 255, 255, 0.04); }
[data-theme="dark"] .big-chart svg { background: rgba(255, 255, 255, 0.02); }
[data-theme="dark"] .big-tooltip { background: #2a2a2a; border-color: rgba(255, 255, 255, 0.1); color: #f0f0f0; }
</style>
