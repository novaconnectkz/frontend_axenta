<template>
  <!--
    Быстрый платёж на единый ЛС контрагента (Фаза A). Платёж постится в существующий
    /ledger/payment, который требует contract_id → если у контрагента >1 договора, оператор
    выбирает договор; при одном — он выбирается автоматически. Деньги admin/бухгалтер (BE-guard).
  -->
  <v-dialog :model-value="modelValue" max-width="460" @update:model-value="$emit('update:modelValue', $event)">
    <v-card v-if="counterparty">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="success">mdi-cash-plus</v-icon>
        Внести платёж
      </v-card-title>
      <v-card-text>
        <div class="text-body-2 text-medium-emphasis mb-3">
          Контрагент: <b>{{ counterparty.name }}</b> · платёж зачисляется на единый ЛС
        </div>

        <v-progress-linear v-if="loadingContracts" indeterminate class="mb-3" />

        <v-alert v-else-if="!contracts.length" type="warning" variant="tonal" density="compact" class="mb-3">
          У контрагента нет договоров — платёж зачислить некуда.
        </v-alert>

        <template v-else>
          <v-select
            v-if="contracts.length > 1"
            v-model="contractId"
            :items="contractItems"
            item-title="title"
            item-value="id"
            label="Договор"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            hide-details
          />
          <div v-else class="text-body-2 mb-3">
            Договор: <b>{{ contracts[0].number }}</b>
          </div>

          <v-text-field
            v-model="amount"
            label="Сумма платежа"
            type="number"
            min="0"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            hide-details
            :suffix="currentCurrency"
          />
          <div class="d-flex ga-3 mb-3">
            <v-text-field
              v-model="paymentDate"
              label="Дата"
              type="date"
              variant="outlined"
              density="comfortable"
              hide-details
            />
            <v-select
              v-model="source"
              :items="sourceItems"
              label="Источник"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </div>
          <v-text-field
            v-model="comment"
            label="Комментарий (необязательно)"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </template>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Отмена</v-btn>
        <v-btn
          color="success"
          variant="flat"
          :loading="saving"
          :disabled="!canSubmit"
          @click="submit"
        >Внести платёж</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import counterpartiesService, {
  type Counterparty,
  type CounterpartyContract,
} from "@/services/counterpartiesService";

const props = defineProps<{
  modelValue: boolean;
  counterparty: Counterparty | null;
}>();
const emit = defineEmits<{
  "update:modelValue": [boolean];
  paid: [];
  error: [string];
}>();

const contracts = ref<CounterpartyContract[]>([]);
const loadingContracts = ref(false);
const contractId = ref<number | null>(null);
const amount = ref<string>("");
const paymentDate = ref<string>("");
const source = ref<string>("manual");
const comment = ref<string>("");
const saving = ref(false);

const sourceItems = [
  { title: "Вручную", value: "manual" },
  { title: "Банк (выписка)", value: "bank" },
  { title: "1С", value: "1c" },
  { title: "Платёжная система", value: "payment_system" },
  { title: "Excel", value: "excel" },
];

const contractItems = computed(() =>
  contracts.value.map((ct) => ({
    id: ct.id,
    title: `${ct.number} · ${ct.tariff_name || ct.contract_type} · баланс ${ct.balance} ${ccy(ct.currency)}`,
  }))
);

const currentCurrency = computed(() => {
  const ct = contracts.value.find((c) => c.id === contractId.value);
  return ccy(ct?.currency || "RUB");
});

const canSubmit = computed(
  () => !!contractId.value && parseFloat(amount.value) > 0 && !saving.value
);

function ccy(code?: string): string {
  return ({ RUB: "₽", USD: "$", EUR: "€", KZT: "₸" } as Record<string, string>)[code || "RUB"] || code || "₽";
}

// При открытии — грузим договоры контрагента, авто-выбор если один.
watch(
  () => props.modelValue,
  async (open) => {
    if (!open || !props.counterparty) return;
    resetForm();
    loadingContracts.value = true;
    try {
      contracts.value = await counterpartiesService.contracts(props.counterparty.id);
      if (contracts.value.length === 1) contractId.value = contracts.value[0].id;
    } catch (e: any) {
      emit("error", e?.response?.data?.error || "Не удалось загрузить договоры контрагента");
    } finally {
      loadingContracts.value = false;
    }
  }
);

function resetForm() {
  contracts.value = [];
  contractId.value = null;
  amount.value = "";
  paymentDate.value = "";
  source.value = "manual";
  comment.value = "";
}

async function submit() {
  if (!canSubmit.value || !contractId.value) return;
  saving.value = true;
  try {
    await counterpartiesService.pay({
      contract_id: contractId.value,
      amount: parseFloat(amount.value),
      source: source.value,
      comment: comment.value || undefined,
      payment_date: paymentDate.value || undefined,
    });
    emit("paid");
    emit("update:modelValue", false);
  } catch (e: any) {
    emit("error", e?.response?.data?.error || "Ошибка внесения платежа");
  } finally {
    saving.value = false;
  }
}
</script>
