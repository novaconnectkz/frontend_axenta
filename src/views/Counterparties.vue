<template>
  <v-container fluid class="pa-4">
    <!-- Метрики биллинга (как на вкладке Договоры) -->
    <BillingMetricsPanel />

    <!-- Общая полоса табов раздела «Биллинг» (Фаза A): контрагенты — точка входа -->
    <BillingSectionTabs />

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
          <!-- Phase D: фильтр по роли (клиенты — субъекты ЛС; партнёры — справочник) -->
          <v-btn-toggle
            v-model="kindFilter"
            density="compact"
            variant="outlined"
            divided
            mandatory
            @update:model-value="reload"
          >
            <v-btn value="" size="small">Все</v-btn>
            <v-btn value="client" size="small">Клиенты</v-btn>
            <v-btn value="partner" size="small">Партнёры</v-btn>
          </v-btn-toggle>
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
            <div class="font-weight-medium">
              {{ item.short_name || item.name }}
              <v-chip v-if="item.kind === 'partner'" size="x-small" color="purple" variant="tonal" class="ml-1" title="Партнёр — справочник, биллинг по снимкам (не лицевой счёт)">партнёр</v-chip>
            </div>
            <div class="text-caption text-medium-emphasis">{{ clientTypeLabel(item.client_type) }}</div>
          </template>

          <template #item.tax_id="{ item }">
            <span v-if="item.tax_id">{{ idTypeLabel(item.id_type) }}: {{ item.tax_id }}</span>
            <v-chip v-else size="x-small" color="warning" variant="tonal">без ИНН</v-chip>
          </template>

          <template #item.billing_mode="{ item }">
            <v-chip v-if="item.kind === 'partner'" size="x-small" color="purple" variant="tonal" title="Биллинг по снимкам (объекты × тариф × скидка)">снимки</v-chip>
            <v-chip v-else size="x-small" :color="item.billing_mode === 'postpaid' ? 'info' : 'default'" variant="tonal">
              {{ item.billing_mode === 'postpaid' ? 'постоплата' : 'предоплата' }}
            </v-chip>
          </template>

          <template #item.balance="{ item }">
            <!-- Phase D: партнёр не субъект ЛС → баланса нет -->
            <span v-if="item.kind === 'partner'" class="text-medium-emphasis">—</span>
            <template v-else-if="balances[item.id]">
              <span :class="balanceClass(balances[item.id])">{{ formatMoney(balances[item.id].balance) }} {{ balanceCcy(balances[item.id]) }}</span>
              <v-chip v-if="balances[item.id].is_debt" size="x-small" color="error" variant="tonal" class="ml-1">долг</v-chip>
              <v-chip v-if="balances[item.id].multicurrency" size="x-small" color="info" variant="tonal" class="ml-1" title="Несколько валют — баланс приведён по курсу">мультивалюта</v-chip>
            </template>
            <v-progress-circular v-else indeterminate size="16" width="2" />
          </template>

          <template #item.contracts="{ item }">
            <span>{{ balances[item.id]?.contracts_count ?? '—' }}</span>
          </template>

          <template #item.manual_review="{ item }">
            <v-icon v-if="item.manual_review" color="warning" size="small" title="Требует ручной проверки">mdi-alert-circle</v-icon>
          </template>

          <template #item.actions="{ item }">
            <!-- Phase D: партнёру платёж недоступен (не субъект ЛС) -->
            <v-btn
              v-if="canEdit && item.kind !== 'partner'"
              size="x-small"
              variant="tonal"
              color="success"
              prepend-icon="mdi-cash-plus"
              @click.stop="openPay(item)"
            >Платёж</v-btn>
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

          <!-- Phase D: партнёр — справочник, НЕ лицевой счёт. Вместо баланса — пояснение. -->
          <v-alert v-if="isPartnerDetail" type="info" variant="tonal" density="compact" class="mb-2 text-caption">
            <b>Партнёр</b> — биллинг по снимкам (объекты × тариф × скидка), не лицевой счёт.
            Баланс, начисления и отсрочки к партнёру не применяются.
          </v-alert>

          <div v-else-if="detailBalance" class="mb-2">
            <div class="d-flex justify-space-between py-1">
              <span class="text-medium-emphasis">Баланс лицевого счёта</span>
              <span class="text-h6" :class="balanceClass(detailBalance)">{{ formatMoney(detailBalance.balance) }} {{ balanceCcy(detailBalance) }}</span>
            </div>
            <div v-if="detailBalance.multicurrency" class="text-caption text-medium-emphasis mb-1">
              Баланс приведён по курсу ({{ detailBalance.presentation_currency }}). Разбивка по валютам ниже.
            </div>
            <div class="d-flex justify-space-between py-1 text-body-2">
              <span class="text-medium-emphasis">Начислено</span><span>{{ formatMoney(detailBalance.total_charged) }} {{ balanceCcy(detailBalance) }}</span>
            </div>
            <div class="d-flex justify-space-between py-1 text-body-2">
              <span class="text-medium-emphasis">Оплачено</span><span>{{ formatMoney(detailBalance.total_paid) }} {{ balanceCcy(detailBalance) }}</span>
            </div>
            <div v-if="detailBalance.is_debt" class="d-flex justify-space-between py-1 text-body-2">
              <span class="text-error">Долг</span><span class="text-error">{{ formatMoney(detailBalance.debt_amount) }} {{ balanceCcy(detailBalance) }}</span>
            </div>
            <div class="d-flex justify-space-between py-1 text-body-2">
              <span class="text-medium-emphasis">Кредит-лимит</span><span>{{ formatMoney(detailBalance.credit_limit) }} {{ balanceCcy(detailBalance) }} ({{ detailBalance.billing_mode === 'postpaid' ? 'постоплата' : 'предоплата' }})</span>
            </div>
            <div class="d-flex justify-space-between py-1 text-body-2">
              <span class="text-medium-emphasis">Договоров</span><span>{{ detailBalance.contracts_count }}</span>
            </div>
            <template v-if="detailBalance.sub_balances && detailBalance.sub_balances.length">
              <v-divider class="my-2" />
              <div class="text-caption text-medium-emphasis mb-1">По валютам</div>
              <div v-for="sb in detailBalance.sub_balances" :key="sb.currency" class="d-flex justify-space-between py-1 text-body-2">
                <span class="text-medium-emphasis">{{ ccySymbol(sb.currency) }} {{ sb.currency }}</span>
                <span :class="parseFloat(sb.balance) < 0 ? 'text-error' : (parseFloat(sb.balance) > 0 ? 'text-success' : '')">{{ formatMoney(sb.balance) }} {{ ccySymbol(sb.currency) }}</span>
              </div>
            </template>
          </div>
          <v-progress-linear v-else-if="!isPartnerDetail" indeterminate />

          <!-- Guardrail: единый ЛС → блокировка действует на весь контрагент (не для партнёра) -->
          <v-alert v-if="!isPartnerDetail" type="warning" variant="tonal" density="compact" class="mt-3 mb-1 text-caption">
            Баланс — единый лицевой счёт. Приостановка/блокировка за неоплату действует на <b>весь контрагент</b> (все его договоры).
          </v-alert>

          <!-- Договоры контрагента (Фаза A) -->
          <v-divider class="my-3" />
          <div class="d-flex align-center mb-1">
            <span class="text-subtitle-2">Договоры контрагента</span>
            <v-spacer />
            <v-btn size="x-small" variant="text" append-icon="mdi-arrow-right" @click="goToContracts(detail)">Открыть в договорах</v-btn>
          </div>
          <v-progress-linear v-if="detailContractsLoading" indeterminate class="my-2" />
          <v-table v-else-if="detailContracts.length" density="compact">
            <thead>
              <tr><th>Номер</th><th>Тариф</th><th>Сумма</th><th>Баланс</th><th>Статус</th></tr>
            </thead>
            <tbody>
              <tr v-for="ct in detailContracts" :key="ct.id">
                <td class="font-weight-medium">{{ ct.number }}</td>
                <td>{{ ct.tariff_name || ct.contract_type }}</td>
                <td>{{ formatMoney(ct.total_amount) }} {{ ccySymbol(ct.currency) }}</td>
                <td :class="ct.is_debt ? 'text-error' : (parseFloat(ct.balance) > 0 ? 'text-success' : '')">{{ formatMoney(ct.balance) }} {{ ccySymbol(ct.currency) }}</td>
                <td><v-chip size="x-small" :color="ct.is_active ? 'success' : 'default'" variant="tonal">{{ ct.status }}</v-chip></td>
              </tr>
            </tbody>
          </v-table>
          <div v-else class="text-caption text-medium-emphasis py-2">Договоров нет</div>
        </v-card-text>
        <v-card-actions>
          <v-btn v-if="canEdit" variant="tonal" prepend-icon="mdi-account-edit" @click="openEdit(detail)">Редактировать</v-btn>
          <v-btn v-if="canEdit && !isPartnerDetail" color="success" variant="tonal" prepend-icon="mdi-cash-plus" @click="openPay(detail)">Внести платёж</v-btn>
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

    <!-- Создание/редактирование контрагента (Фаза A/B + edit): полные реквизиты — общий компонент -->
    <CounterpartyCreateDialog
      v-model="createOpen"
      :edit-counterparty="editTarget"
      @created="onCpCreated"
      @updated="onCpUpdated"
      @error="onCpError"
    />

    <!-- Быстрый платёж (Фаза A) -->
    <QuickPaymentDialog v-model="payOpen" :counterparty="payTarget" @paid="onPaid" @error="onPayError" />

    <!-- Действия раздела в едином FAB (Apple-стиль) -->
    <AppleFAB :items="fabItems" />

    <v-snackbar v-model="errorOpen" color="error" timeout="5000">{{ errorMsg }}</v-snackbar>
    <v-snackbar v-model="okOpen" color="success" timeout="4000">{{ okMsg }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import counterpartiesService, {
  type Counterparty,
  type CounterpartyBalance,
  type CounterpartyContract,
  type ImportBatch,
} from "@/services/counterpartiesService";
import { canManageBilling } from "@/utils/billingRole";
import PaymentImportWizard from "@/components/Billing/PaymentImportWizard.vue";
import BillingSectionTabs from "@/components/Billing/BillingSectionTabs.vue";
import BillingMetricsPanel from "@/components/Billing/BillingMetricsPanel.vue";
import QuickPaymentDialog from "@/components/Billing/QuickPaymentDialog.vue";
import CounterpartyCreateDialog from "@/components/Contracts/CounterpartyCreateDialog.vue";
import AppleFAB from "@/components/Apple/AppleFAB.vue";

const router = useRouter();
// Деньги/создание — admin/бухгалтер (решение владельца). Кнопки гейтятся; BE-guard защищает реально.
const canEdit = computed(() => canManageBilling());

// Действия раздела в FAB (единый Apple-стиль). «Создать контрагента» — только admin/бухгалтер.
const fabItems = computed(() => {
  const items: { id: string; label: string; icon: string; color?: "primary" | "success" | "warning"; action: () => void }[] = [];
  if (canEdit.value) {
    items.push({ id: "create", label: "Создать контрагента", icon: "mdi-account-plus", color: "primary", action: openCreate });
  }
  items.push({ id: "import", label: "Импорт платежей", icon: "mdi-file-import", color: "success", action: () => { importOpen.value = true; } });
  items.push({ id: "batches", label: "История импортов", icon: "mdi-history", color: "warning", action: openBatches });
  return items;
});

const headers = [
  { title: "Контрагент", key: "name", sortable: true },
  { title: "Идентификатор", key: "tax_id", sortable: false },
  { title: "Режим", key: "billing_mode", sortable: false },
  { title: "Баланс ЛС", key: "balance", sortable: false },
  { title: "Договоров", key: "contracts", sortable: false },
  { title: "", key: "manual_review", sortable: false, width: 40 },
  { title: "Действия", key: "actions", sortable: false, width: 120 },
];

const rows = ref<Counterparty[]>([]);
const balances = ref<Record<number, CounterpartyBalance>>({});
const total = ref(0);
const loading = ref(false);
const search = ref("");
const manualOnly = ref(false);
// Phase D: фильтр по роли ("" — все, "client", "partner").
const kindFilter = ref<"" | "client" | "partner">("");
const errorOpen = ref(false);
const errorMsg = ref("");

const detailOpen = ref(false);
const detail = ref<Counterparty | null>(null);
const detailBalance = ref<CounterpartyBalance | null>(null);
const detailContracts = ref<CounterpartyContract[]>([]);
const detailContractsLoading = ref(false);
// Phase D: открытый в карточке контрагент — партнёр? (баланс/платёж/holds скрыты)
const isPartnerDetail = computed(() => detail.value?.kind === "partner");

// A4/B1: создание контрагента (полные реквизиты) — в общем компоненте CounterpartyCreateDialog.
// editTarget != null → тот же диалог в режиме редактирования.
const createOpen = ref(false);
const editTarget = ref<Counterparty | null>(null);

// A5: быстрый платёж.
const payOpen = ref(false);
const payTarget = ref<Counterparty | null>(null);

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
      kind: kindFilter.value || undefined,
    });
    rows.value = res.data;
    total.value = res.total;
    balances.value = {};
    // Балансы тянем параллельно для загруженной страницы (единый ЛС per контрагент).
    // Phase D: для партнёров баланс не запрашиваем — они не субъекты ЛС.
    await Promise.all(
      res.data
        .filter((cp) => cp.kind !== "partner")
        .map(async (cp) => {
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
  detailContracts.value = [];
  detailOpen.value = true;
  // Phase D: партнёр не субъект ЛС → баланс не запрашиваем (карточка показывает только реквизиты+договоры).
  if (!detailBalance.value && cp.kind !== "partner") {
    try {
      detailBalance.value = await counterpartiesService.balance(cp.id);
    } catch {
      /* ignore */
    }
  }
  // A3: договоры контрагента для карточки.
  detailContractsLoading.value = true;
  try {
    detailContracts.value = await counterpartiesService.contracts(cp.id);
  } catch {
    /* частичный сбой не валит карточку */
  } finally {
    detailContractsLoading.value = false;
  }
}

// A6: переход к договорам контрагента (пред-фильтр по ?counterparty).
function goToContracts(cp: Counterparty | null) {
  if (!cp) return;
  router.push({ path: "/billing", query: { tab: "contracts", counterparty: String(cp.id) } });
}

// A4: создание контрагента (форма — в общем компоненте CounterpartyCreateDialog).
function openCreate() {
  editTarget.value = null; // режим создания
  createOpen.value = true;
}
// Редактирование реквизитов контрагента (тот же диалог, edit-режим). Клиент и партнёр.
function openEdit(cp: Counterparty | null) {
  if (!cp) return;
  editTarget.value = cp;
  detailOpen.value = false; // не стекать диалоги
  createOpen.value = true;
}
function onCpCreated() {
  okMsg.value = "Контрагент создан";
  okOpen.value = true;
  reload();
}
function onCpUpdated() {
  okMsg.value = "Реквизиты сохранены";
  okOpen.value = true;
  editTarget.value = null;
  reload();
}
function onCpError(message: string) {
  errorMsg.value = message;
  errorOpen.value = true;
}

// A5: быстрый платёж.
function openPay(cp: Counterparty | null) {
  payTarget.value = cp;
  payOpen.value = true;
}
function onPaid() {
  okMsg.value = "Платёж внесён";
  okOpen.value = true;
  reload(); // балансы изменились
  if (detail.value) {
    // обновить договоры в открытой карточке
    counterpartiesService.contracts(detail.value.id).then((c) => (detailContracts.value = c)).catch(() => {});
  }
}
function onPayError(msg: string) {
  errorMsg.value = msg;
  errorOpen.value = true;
}

function formatMoney(v: string | number | undefined): string {
  if (v === undefined || v === null) return "0.00";
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (Number.isNaN(n)) return "0.00";
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ccySymbol(code?: string): string {
  if (!code) return "₽";
  return ({ RUB: "₽", USD: "$", EUR: "€", KZT: "₸" } as Record<string, string>)[code] || code;
}

// Символ валюты для баланса: мультивалютный контрагент → валюта презентации (свёртка по курсу),
// иначе ₽. Прод сегодня одновалютный → всегда ₽.
function balanceCcy(b?: { multicurrency?: boolean; presentation_currency?: string } | null): string {
  return b && b.multicurrency ? ccySymbol(b.presentation_currency) : "₽";
}

function balanceClass(b: CounterpartyBalance): string {
  const n = parseFloat(b.balance ?? "0");
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
