<template>
  <v-container fluid class="pa-4">
    <div class="d-flex align-center mb-4">
      <v-icon size="28" class="mr-2">mdi-account-cash</v-icon>
      <div>
        <h2 class="text-h5 mb-0">Контрагенты</h2>
        <div class="text-caption text-medium-emphasis">Единый лицевой счёт: один контрагент = N договоров = один баланс</div>
      </div>
      <v-spacer />
      <v-btn variant="text" prepend-icon="mdi-history" class="mr-2" @click="openBatches">История импортов</v-btn>
      <v-btn variant="tonal" prepend-icon="mdi-file-import" color="primary" class="mr-2" @click="importOpen = true">Импорт платежей</v-btn>
      <v-btn variant="tonal" prepend-icon="mdi-refresh" :loading="loading" @click="reload">Обновить</v-btn>
    </div>

    <v-card variant="flat" border>
      <v-card-text>
        <div class="d-flex align-center flex-wrap ga-3 mb-3">
          <v-text-field
            v-model="search"
            label="Поиск по имени или ИНН"
            prepend-inner-icon="mdi-magnify"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
            style="max-width: 360px"
            @update:model-value="debouncedReload"
          />
          <v-switch
            v-model="manualOnly"
            label="Только требующие проверки"
            color="warning"
            density="compact"
            hide-details
            @update:model-value="reload"
          />
          <v-spacer />
          <span class="text-caption text-medium-emphasis">Всего: {{ total }}</span>
        </div>

        <v-data-table
          :headers="headers"
          :items="rows"
          :loading="loading"
          density="comfortable"
          items-per-page="50"
          @click:row="(_e: unknown, ctx: any) => openDetail(ctx.item)"
        >
          <template #item.name="{ item }">
            <div class="font-weight-medium">{{ item.name }}</div>
            <div class="text-caption text-medium-emphasis">{{ clientTypeLabel(item.client_type) }}</div>
          </template>

          <template #item.tax_id="{ item }">
            <span v-if="item.tax_id">{{ idTypeLabel(item.id_type) }}: {{ item.tax_id }}</span>
            <v-chip v-else size="x-small" color="warning" variant="tonal">без ИНН</v-chip>
          </template>

          <template #item.billing_mode="{ item }">
            <v-chip size="x-small" :color="item.billing_mode === 'postpaid' ? 'info' : 'default'" variant="tonal">
              {{ item.billing_mode === 'postpaid' ? 'постоплата' : 'предоплата' }}
            </v-chip>
          </template>

          <template #item.balance="{ item }">
            <template v-if="balances[item.id]">
              <span :class="balanceClass(balances[item.id])">{{ formatMoney(balances[item.id].balance) }} ₽</span>
              <v-chip v-if="balances[item.id].is_debt" size="x-small" color="error" variant="tonal" class="ml-1">долг</v-chip>
            </template>
            <v-progress-circular v-else indeterminate size="16" width="2" />
          </template>

          <template #item.contracts="{ item }">
            <span>{{ balances[item.id]?.contracts_count ?? '—' }}</span>
          </template>

          <template #item.manual_review="{ item }">
            <v-icon v-if="item.manual_review" color="warning" size="small" title="Требует ручной проверки">mdi-alert-circle</v-icon>
          </template>

          <template #no-data>
            <div class="text-medium-emphasis py-6">Контрагенты не найдены</div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Детальный единый ЛС -->
    <v-dialog v-model="detailOpen" max-width="560">
      <v-card v-if="detail">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-account-cash</v-icon>
          <span class="text-truncate">{{ detail.name }}</span>
        </v-card-title>
        <v-card-text>
          <div v-if="detail.tax_id" class="text-body-2 mb-2">{{ idTypeLabel(detail.id_type) }}: {{ detail.tax_id }}</div>
          <v-chip v-if="detail.manual_review" size="small" color="warning" variant="tonal" class="mb-3">Требует ручной проверки (нет ИНН)</v-chip>

          <v-divider class="mb-3" />
          <div v-if="detailBalance" class="mb-2">
            <div class="d-flex justify-space-between py-1">
              <span class="text-medium-emphasis">Баланс лицевого счёта</span>
              <span class="text-h6" :class="balanceClass(detailBalance)">{{ formatMoney(detailBalance.balance) }} ₽</span>
            </div>
            <div class="d-flex justify-space-between py-1 text-body-2">
              <span class="text-medium-emphasis">Начислено</span><span>{{ formatMoney(detailBalance.total_charged) }} ₽</span>
            </div>
            <div class="d-flex justify-space-between py-1 text-body-2">
              <span class="text-medium-emphasis">Оплачено</span><span>{{ formatMoney(detailBalance.total_paid) }} ₽</span>
            </div>
            <div v-if="detailBalance.is_debt" class="d-flex justify-space-between py-1 text-body-2">
              <span class="text-error">Долг</span><span class="text-error">{{ formatMoney(detailBalance.debt_amount) }} ₽</span>
            </div>
            <div class="d-flex justify-space-between py-1 text-body-2">
              <span class="text-medium-emphasis">Кредит-лимит</span><span>{{ formatMoney(detailBalance.credit_limit) }} ₽ ({{ detailBalance.billing_mode === 'postpaid' ? 'постоплата' : 'предоплата' }})</span>
            </div>
            <div class="d-flex justify-space-between py-1 text-body-2">
              <span class="text-medium-emphasis">Договоров</span><span>{{ detailBalance.contracts_count }}</span>
            </div>
          </div>
          <v-progress-linear v-else indeterminate />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="detailOpen = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Визард Excel-импорта платежей -->
    <PaymentImportWizard v-model="importOpen" @imported="onImported" />

    <!-- История батчей импорта + откат -->
    <v-dialog v-model="batchesOpen" max-width="820" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-history</v-icon>История импортов платежей
          <v-spacer />
          <v-btn icon variant="text" @click="batchesOpen = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-progress-linear v-if="batchesLoading" indeterminate class="mb-2" />
          <v-table density="compact">
            <thead>
              <tr><th>#</th><th>Дата</th><th>Файл</th><th>Строк</th><th>Сумма</th><th>Статус</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="b in batches" :key="b.id">
                <td>{{ b.id }}</td>
                <td>{{ formatDate(b.created_at) }}</td>
                <td class="text-truncate" style="max-width: 160px">{{ b.file_name || '—' }}</td>
                <td>{{ b.rows_imported }}<span v-if="b.rows_skipped" class="text-medium-emphasis">/{{ b.rows_skipped }} проп.</span></td>
                <td>{{ formatMoney(b.total_amount) }} ₽</td>
                <td>
                  <v-chip size="x-small" :color="b.status === 'reversed' ? 'error' : 'success'" variant="tonal">
                    {{ b.status === 'reversed' ? 'откачен' : 'импортирован' }}
                  </v-chip>
                </td>
                <td>
                  <v-btn v-if="b.status !== 'reversed'" size="x-small" color="error" variant="text" :loading="reversingId === b.id" @click="reverseBatch(b)">Откатить</v-btn>
                </td>
              </tr>
              <tr v-if="!batches.length && !batchesLoading"><td colspan="7" class="text-center text-medium-emphasis py-4">Импортов пока нет</td></tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="errorOpen" color="error" timeout="5000">{{ errorMsg }}</v-snackbar>
    <v-snackbar v-model="okOpen" color="success" timeout="4000">{{ okMsg }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import counterpartiesService, {
  type Counterparty,
  type CounterpartyBalance,
  type ImportBatch,
} from "@/services/counterpartiesService";
import PaymentImportWizard from "@/components/Billing/PaymentImportWizard.vue";

const headers = [
  { title: "Контрагент", key: "name", sortable: true },
  { title: "Идентификатор", key: "tax_id", sortable: false },
  { title: "Режим", key: "billing_mode", sortable: false },
  { title: "Баланс ЛС", key: "balance", sortable: false },
  { title: "Договоров", key: "contracts", sortable: false },
  { title: "", key: "manual_review", sortable: false, width: 40 },
];

const rows = ref<Counterparty[]>([]);
const balances = ref<Record<number, CounterpartyBalance>>({});
const total = ref(0);
const loading = ref(false);
const search = ref("");
const manualOnly = ref(false);
const errorOpen = ref(false);
const errorMsg = ref("");

const detailOpen = ref(false);
const detail = ref<Counterparty | null>(null);
const detailBalance = ref<CounterpartyBalance | null>(null);

// Ф5b: импорт платежей + история батчей.
const importOpen = ref(false);
const batchesOpen = ref(false);
const batchesLoading = ref(false);
const batches = ref<ImportBatch[]>([]);
const reversingId = ref<number>(0);
const okOpen = ref(false);
const okMsg = ref("");

async function openBatches() {
  batchesOpen.value = true;
  batchesLoading.value = true;
  try {
    batches.value = await counterpartiesService.listBatches();
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.error || "Не удалось загрузить историю импортов";
    errorOpen.value = true;
  } finally {
    batchesLoading.value = false;
  }
}

async function reverseBatch(b: ImportBatch) {
  reversingId.value = b.id;
  try {
    const res = await counterpartiesService.reverseBatch(b.id);
    okMsg.value = `Батч #${b.id} откачен (сторнировано ${res.reversed})`;
    okOpen.value = true;
    await openBatches();
    await reload(); // балансы изменились
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.error || "Ошибка отката батча";
    errorOpen.value = true;
  } finally {
    reversingId.value = 0;
  }
}

function onImported() {
  reload(); // обновить балансы после импорта
}

function formatDate(s: string): string {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString("ru-RU");
}

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
function debouncedReload() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(reload, 350);
}

async function reload() {
  loading.value = true;
  try {
    const res = await counterpartiesService.list({
      q: search.value,
      manualReview: manualOnly.value,
    });
    rows.value = res.data;
    total.value = res.total;
    balances.value = {};
    // Балансы тянем параллельно для загруженной страницы (единый ЛС per контрагент).
    await Promise.all(
      res.data.map(async (cp) => {
        try {
          balances.value[cp.id] = await counterpartiesService.balance(cp.id);
        } catch {
          /* частичный сбой баланса не валит список */
        }
      })
    );
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.error || "Не удалось загрузить контрагентов";
    errorOpen.value = true;
  } finally {
    loading.value = false;
  }
}

async function openDetail(cp: Counterparty) {
  detail.value = cp;
  detailBalance.value = balances.value[cp.id] ?? null;
  detailOpen.value = true;
  if (!detailBalance.value) {
    try {
      detailBalance.value = await counterpartiesService.balance(cp.id);
    } catch {
      /* ignore */
    }
  }
}

function formatMoney(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (Number.isNaN(n)) return "0.00";
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function balanceClass(b: CounterpartyBalance): string {
  const n = parseFloat(b.balance);
  if (n < 0) return "text-error font-weight-medium";
  if (n > 0) return "text-success font-weight-medium";
  return "";
}

function idTypeLabel(t: string): string {
  return { inn: "ИНН", bin: "БИН", iin: "ИИН", passport: "Паспорт", other: "ID" }[t] || "ID";
}

function clientTypeLabel(t: string): string {
  return (
    {
      organization: "Организация",
      individual_entrepreneur: "ИП",
      physical_person: "Физлицо",
    }[t] || t || "—"
  );
}

onMounted(reload);
</script>
