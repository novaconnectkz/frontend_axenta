<template>
  <v-card variant="outlined" class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-satellite-variant" class="mr-2" color="teal-darken-1" />
      История объектов SKIF
    </v-card-title>
    <v-card-subtitle>
      Backfill через POST /api_v1/company/updates/query — точные create/delete events
      foreach company. Используется в виджете «Прирост объектов».
    </v-card-subtitle>

    <v-card-text>
      <v-alert v-if="connections.length === 0" type="info" variant="tonal" density="compact" class="mb-4">
        Нет подключений SKIF. Добавьте в разделе «Интеграции» → «SKIF».
      </v-alert>

      <v-alert v-if="error" type="error" closable density="compact" class="mb-4" @click:close="error = ''">
        {{ error }}
      </v-alert>

      <v-alert v-if="resultText" type="success" closable density="compact" class="mb-4" @click:close="resultText = ''">
        {{ resultText }}
      </v-alert>

      <v-row align="center" v-if="connections.length > 0">
        <v-col cols="12" md="4">
          <v-select
            v-model="selectedConnId"
            :items="connectionOptions"
            label="Подключение"
            variant="outlined"
            density="compact"
            hide-details
            :disabled="running"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="fromDate"
            label="С даты"
            type="date"
            variant="outlined"
            density="compact"
            hide-details
            :disabled="running"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="toDate"
            label="По дату"
            type="date"
            variant="outlined"
            density="compact"
            hide-details
            :disabled="running"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-btn
            color="primary"
            block
            :loading="running"
            :disabled="!selectedConnId || !fromDate || !toDate"
            @click="runBackfill"
          >
            Пересчитать
          </v-btn>
        </v-col>
      </v-row>

      <v-alert v-if="running" type="info" variant="tonal" density="compact" class="mt-4">
        Идёт пересчёт. SKIF API rate-limit ≈60 req/min — синхронный запрос может занять
        несколько минут на большие периоды (1 год × 66 компаний ≈ 5 мин).
      </v-alert>

      <p class="text-caption text-medium-emphasis mt-3 mb-0">
        Период ограничен 1 годом per запрос (SKIF docs). Большие окна автоматически разбиваются.
      </p>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { skifService, type SkifConnection } from "@/services/skifService";
import { apiClient } from "@/services/api";

const connections = ref<SkifConnection[]>([]);
const selectedConnId = ref<number | null>(null);
const fromDate = ref(defaultFrom());
const toDate = ref(defaultTo());
const running = ref(false);
const error = ref("");
const resultText = ref("");

const connectionOptions = computed(() =>
  connections.value.map(c => ({ title: `${c.name} (${c.login})`, value: c.id }))
);

function defaultFrom(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}
function defaultTo(): string {
  return new Date().toISOString().slice(0, 10);
}

async function loadConnections() {
  try {
    connections.value = await skifService.list();
    if (connections.value.length > 0 && !selectedConnId.value) {
      selectedConnId.value = connections.value[0].id;
    }
  } catch (e: any) {
    error.value = e?.response?.data?.error || e?.message || "Ошибка загрузки подключений";
  }
}

async function runBackfill() {
  if (!selectedConnId.value || !fromDate.value || !toDate.value) return;
  running.value = true;
  error.value = "";
  resultText.value = "";
  try {
    const r = await apiClient.post(
      `/auth/skif/connections/${selectedConnId.value}/history/backfill`,
      null,
      { params: { from: fromDate.value, to: toDate.value }, timeout: 30 * 60 * 1000 }
    );
    const data = r.data?.data || {};
    resultText.value = `Готово. Events=${data.events ?? 0}, day-snapshots=${data.upserted_days ?? 0}.`;
  } catch (e: any) {
    error.value = e?.response?.data?.error || e?.message || "Ошибка backfill";
  } finally {
    running.value = false;
  }
}

onMounted(loadConnections);
</script>
