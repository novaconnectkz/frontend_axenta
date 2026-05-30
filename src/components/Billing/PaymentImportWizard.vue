<template>
  <v-dialog :model-value="modelValue" max-width="900" persistent scrollable @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-file-import</v-icon>
        Импорт платежей из Excel
        <v-spacer />
        <v-btn icon variant="text" @click="close"><v-icon>mdi-close</v-icon></v-btn>
      </v-card-title>

      <v-stepper v-model="step" flat class="elevation-0">
        <v-stepper-header>
          <v-stepper-item :complete="Number(step) > 1" title="Файл и колонки" value="1" />
          <v-divider />
          <v-stepper-item :complete="Number(step) > 2" title="Сопоставление" value="2" />
          <v-divider />
          <v-stepper-item title="Импорт" value="3" />
        </v-stepper-header>

        <v-stepper-window>
          <!-- Шаг 1: файл + маппинг колонок -->
          <v-stepper-window-item value="1">
            <v-file-input
              v-model="file"
              accept=".xlsx,.xls"
              label="Excel-реестр платежей (.xlsx)"
              prepend-icon="mdi-microsoft-excel"
              variant="outlined"
              density="comfortable"
              :loading="parsing"
              @update:model-value="onFile"
            />
            <v-alert v-if="parseError" type="error" variant="tonal" density="compact" class="mb-3">{{ parseError }}</v-alert>

            <div v-if="headers.length">
              <div class="text-caption text-medium-emphasis mb-2">Сопоставьте колонки файла ({{ dataRows.length }} строк):</div>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-select v-model="map.ident" :items="colOptions" label="Идентификатор (ИНН/имя) *" variant="outlined" density="compact" hide-details />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select v-model="map.amount" :items="colOptions" label="Сумма *" variant="outlined" density="compact" hide-details />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select v-model="map.date" :items="colOptionsOpt" label="Дата (опц.)" variant="outlined" density="compact" hide-details />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select v-model="map.reference" :items="colOptionsOpt" label="Референс/№ (опц., идемпотентность)" variant="outlined" density="compact" hide-details />
                </v-col>
              </v-row>
            </div>
          </v-stepper-window-item>

          <!-- Шаг 2: матчинг -->
          <v-stepper-window-item value="2">
            <div class="d-flex align-center mb-2 ga-2 flex-wrap">
              <v-chip size="small" color="success" variant="tonal">✅ {{ counts.matched }}</v-chip>
              <v-chip size="small" color="warning" variant="tonal">⚠️ {{ counts.review }}</v-chip>
              <v-chip size="small" color="error" variant="tonal">❌ {{ counts.nomatch }}</v-chip>
              <v-spacer />
              <span class="text-caption">К импорту: <b>{{ readyRows.length }}</b> на <b>{{ formatMoney(readySum) }} ₽</b></span>
            </div>
            <v-progress-linear v-if="matching" indeterminate class="mb-2" />
            <v-table density="compact" class="border" style="max-height: 360px">
              <thead>
                <tr><th>#</th><th>Идентификатор</th><th>Сумма</th><th>Контрагент</th><th>Статус</th></tr>
              </thead>
              <tbody>
                <tr v-for="row in matched" :key="row.row_index">
                  <td>{{ row.row_index + 1 }}</td>
                  <td class="text-truncate" style="max-width: 160px">{{ row.identifier }}</td>
                  <td>{{ formatMoney(row.amount) }}</td>
                  <td style="min-width: 240px">
                    <span v-if="row.status === 'matched'">{{ row.counterparty_name }}</span>
                    <v-autocomplete
                      v-else
                      v-model="row.counterparty_id"
                      :items="cpOptions"
                      item-title="title"
                      item-value="value"
                      label="выбрать контрагента"
                      density="compact"
                      variant="outlined"
                      hide-details
                      clearable
                      @update:model-value="(v: number) => onPick(row, v)"
                    />
                  </td>
                  <td>
                    <v-chip size="x-small" :color="statusColor(row.status)" variant="tonal">{{ statusLabel(row.status) }}</v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>
            <div class="text-caption text-medium-emphasis mt-1">⚠️/❌ строки без выбранного контрагента в импорт не попадут.</div>
          </v-stepper-window-item>

          <!-- Шаг 3: результат -->
          <v-stepper-window-item value="3">
            <v-progress-linear v-if="importing" indeterminate class="mb-2" />
            <div v-if="result">
              <v-alert type="success" variant="tonal" class="mb-3">
                Импортировано: <b>{{ result.imported }}</b> платежей на <b>{{ result.total_amount }} ₽</b> (батч #{{ result.batch_id }})
              </v-alert>
              <div v-if="result.skipped" class="text-body-2 mb-1">Пропущено (дубли/ошибки): {{ result.skipped }}</div>
              <ul v-if="result.errors?.length" class="text-caption text-medium-emphasis">
                <li v-for="(e, i) in result.errors.slice(0, 10)" :key="i">{{ e }}</li>
              </ul>
            </div>
          </v-stepper-window-item>
        </v-stepper-window>
      </v-stepper>

      <v-card-actions>
        <v-btn v-if="step === '2'" variant="text" @click="step = '1'">Назад</v-btn>
        <v-spacer />
        <v-btn v-if="step === '1'" color="primary" :disabled="!canMatch" @click="goMatch">Сопоставить →</v-btn>
        <v-btn v-else-if="step === '2'" color="primary" :loading="importing" :disabled="readyRows.length === 0" @click="doImport">Импортировать {{ readyRows.length }} →</v-btn>
        <v-btn v-else color="primary" @click="finish">Готово</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import counterpartiesService, { type MatchResult, type ImportBatchResult } from "@/services/counterpartiesService";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ (e: "update:modelValue", v: boolean): void; (e: "imported"): void }>();

const step = ref("1");
const file = ref<File | File[] | null>(null);
const parsing = ref(false);
const parseError = ref("");
const headers = ref<string[]>([]);
const dataRows = ref<any[][]>([]);
const map = ref<{ ident: number | null; amount: number | null; date: number | null; reference: number | null }>({
  ident: null,
  amount: null,
  date: null,
  reference: null,
});

interface Row extends MatchResult {
  identifier: string;
  date: string;
  reference: string;
}
const matched = ref<Row[]>([]);
const matching = ref(false);
const importing = ref(false);
const result = ref<ImportBatchResult | null>(null);
const cpOptions = ref<{ value: number; title: string }[]>([]);

const colOptions = computed(() => headers.value.map((h, i) => ({ title: h || `Колонка ${i + 1}`, value: i })));
const colOptionsOpt = computed(() => [{ title: "— нет —", value: -1 }, ...colOptions.value]);
const canMatch = computed(() => map.value.ident !== null && map.value.amount !== null && dataRows.value.length > 0);

const counts = computed(() => ({
  matched: matched.value.filter((r) => r.status === "matched").length,
  review: matched.value.filter((r) => r.status === "review").length,
  nomatch: matched.value.filter((r) => r.status === "nomatch").length,
}));
const readyRows = computed(() => matched.value.filter((r) => r.counterparty_id && r.counterparty_id > 0 && r.amount > 0));
const readySum = computed(() => readyRows.value.reduce((s, r) => s + r.amount, 0));

async function onFile() {
  parseError.value = "";
  headers.value = [];
  dataRows.value = [];
  const f = Array.isArray(file.value) ? file.value[0] : file.value;
  if (!f) return;
  parsing.value = true;
  try {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await f.arrayBuffer());
    const ws = wb.worksheets[0];
    if (!ws) throw new Error("Лист не найден");
    const rows: any[][] = [];
    ws.eachRow((r) => {
      const vals = (r.values as any[]).slice(1); // exceljs values[0] всегда пустой
      rows.push(vals.map((v) => (v == null ? "" : typeof v === "object" && v.text ? v.text : v)));
    });
    if (rows.length < 2) throw new Error("Нужны заголовок + хотя бы одна строка данных");
    headers.value = rows[0].map((v) => String(v ?? ""));
    dataRows.value = rows.slice(1);
    autoGuess();
  } catch (e: any) {
    parseError.value = "Не удалось прочитать файл: " + (e?.message || e);
  } finally {
    parsing.value = false;
  }
}

function autoGuess() {
  const find = (re: RegExp) => headers.value.findIndex((h) => re.test(h));
  const set = (v: number) => (v >= 0 ? v : null);
  map.value.ident = set(find(/инн|бин|контрагент|клиент|наимен|плательщ/i));
  map.value.amount = set(find(/сумм|amount|платеж|оплат|руб/i));
  map.value.date = set(find(/дата|date/i));
  map.value.reference = set(find(/референс|reference|№|номер|назнач|документ/i));
}

async function goMatch() {
  matching.value = true;
  step.value = "2";
  try {
    // Контрагенты для ручного выбора (client-side filter; контрагентов обычно немного).
    const list = await counterpartiesService.list({ limit: 1000 });
    cpOptions.value = list.data.map((c) => ({
      value: c.id,
      title: c.tax_id ? `${c.name} (${c.tax_id})` : c.name,
    }));

    const mi = map.value;
    const reqRows = dataRows.value.map((r, i) => ({
      row_index: i,
      identifier: String(r[mi.ident as number] ?? "").trim(),
      amount: parseAmount(r[mi.amount as number]),
    }));
    const res = await counterpartiesService.matchRows(reqRows);
    const byIdx = new Map(res.map((m) => [m.row_index, m]));
    matched.value = dataRows.value.map((r, i) => {
      const m = byIdx.get(i);
      return {
        row_index: i,
        identifier: String(r[mi.ident as number] ?? "").trim(),
        amount: parseAmount(r[mi.amount as number]),
        date: mi.date != null && mi.date >= 0 ? toDate(r[mi.date as number]) : "",
        reference: mi.reference != null && mi.reference >= 0 ? String(r[mi.reference as number] ?? "").trim() : "",
        status: m?.status ?? "nomatch",
        counterparty_id: m?.counterparty_id ?? 0,
        counterparty_name: m?.counterparty_name ?? "",
        note: m?.note,
      };
    });
  } catch (e: any) {
    parseError.value = "Ошибка сопоставления: " + (e?.response?.data?.error || e?.message);
    step.value = "1";
  } finally {
    matching.value = false;
  }
}

function onPick(row: Row, v: number) {
  row.counterparty_id = v || 0;
  if (v) {
    row.status = "matched";
    row.counterparty_name = cpOptions.value.find((o) => o.value === v)?.title ?? "";
  }
}

async function doImport() {
  importing.value = true;
  try {
    const f = Array.isArray(file.value) ? file.value[0] : file.value;
    result.value = await counterpartiesService.importBatch({
      source: "excel",
      file_name: f?.name ?? "",
      rows: readyRows.value.map((r) => ({
        counterparty_id: r.counterparty_id,
        amount: r.amount,
        date: r.date || undefined,
        reference: r.reference || undefined,
      })),
    });
    step.value = "3";
    emit("imported");
  } catch (e: any) {
    parseError.value = "Ошибка импорта: " + (e?.response?.data?.error || e?.message);
  } finally {
    importing.value = false;
  }
}

function finish() {
  emit("imported");
  close();
}

function close() {
  step.value = "1";
  file.value = null;
  headers.value = [];
  dataRows.value = [];
  matched.value = [];
  result.value = null;
  parseError.value = "";
  emit("update:modelValue", false);
}

function parseAmount(v: any): number {
  if (typeof v === "number") return Math.round(v * 100) / 100;
  const n = parseFloat(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

function toDate(v: any): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v ?? "").trim();
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/) || s.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (m) return m[1].length === 4 ? `${m[1]}-${m[2]}-${m[3]}` : `${m[3]}-${m[2]}-${m[1]}`;
  return "";
}

function formatMoney(v: number): string {
  return v.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function statusColor(s: string) {
  return { matched: "success", review: "warning", nomatch: "error" }[s] || "default";
}
function statusLabel(s: string) {
  return { matched: "✅ найден", review: "⚠️ проверить", nomatch: "❌ нет" }[s] || s;
}
</script>
