<template>
  <!--
    Компактный расчёт стоимости партнёрского договора за период.
    Тот же endpoint, что «Рассчитать стоимость» в Billing/ContractsTab (партнёрская
    статистика), но самодостаточный диалог — без связи с тяжёлым ContractsTab-диалогом.
  -->
  <v-dialog
    :model-value="modelValue"
    max-width="720"
    scrollable
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-calculator</v-icon>
        Расчёт стоимости
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="$emit('update:modelValue', false)" />
      </v-card-title>
      <v-card-subtitle v-if="contractNumber" class="pb-0">
        {{ contractNumber }}<span v-if="partnerName"> · {{ partnerName }}</span>
      </v-card-subtitle>
      <v-card-text>
        <v-row dense class="mb-2">
          <v-col cols="6">
            <v-text-field v-model="startDate" type="date" label="С" variant="outlined" density="compact" hide-details />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="endDate" type="date" label="По" variant="outlined" density="compact" hide-details />
          </v-col>
        </v-row>
        <v-btn block color="primary" variant="flat" :loading="loading" class="mb-3" prepend-icon="mdi-calculator" @click="load">
          Рассчитать
        </v-btn>

        <template v-if="summary">
          <div class="d-flex justify-space-between mb-1">
            <span class="text-medium-emphasis">Дней в периоде</span><b>{{ summary.total_days ?? snapshots.length }}</b>
          </div>
          <div class="d-flex justify-space-between mb-1">
            <span class="text-medium-emphasis">Снимков</span><b>{{ snapshots.length }}</b>
          </div>
          <div class="d-flex justify-space-between mb-3 text-h6">
            <span>Стоимость за период</span><b class="text-success">{{ money(summary.total_cost) }} ₽</b>
          </div>

          <v-table v-if="snapshots.length" density="compact">
            <thead>
              <tr>
                <th class="text-left">Дата</th>
                <th class="text-center">Активн. / всего</th>
                <th class="text-right">₽/день</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(s, i) in snapshots" :key="i">
                <td>{{ fmtDate(s.snapshot_date) }}</td>
                <td class="text-center">
                  <b class="text-success">{{ s.active_objects_count }}</b>
                  <span class="text-disabled"> / {{ s.total_objects_count }}</span>
                </td>
                <td class="text-right">{{ money(s.daily_cost) }} ₽</td>
              </tr>
            </tbody>
          </v-table>
          <div v-else class="text-center text-medium-emphasis py-3">Снимков за период нет</div>
        </template>
        <div v-else-if="!loading" class="text-center text-medium-emphasis py-4">
          Выберите период и нажмите «Рассчитать»
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import axios from 'axios';
import { config } from '@/config/env';

const props = defineProps<{
  modelValue: boolean;
  contractId?: number | null;
  contractNumber?: string;
  partnerName?: string;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'error', m: string): void;
}>();

const startDate = ref('');
const endDate = ref('');
const loading = ref(false);
const snapshots = ref<any[]>([]);
const summary = ref<any>(null);

function authHeaders() {
  const token = localStorage.getItem('axenta_token');
  const companyData = localStorage.getItem('axenta_company');
  const tenantId = companyData ? JSON.parse(companyData).id : '';
  return { Authorization: `Bearer ${token}`, 'X-Tenant-ID': String(tenantId) };
}

function defaultMonth() {
  const now = new Date();
  const f = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  startDate.value = f(new Date(now.getFullYear(), now.getMonth(), 1));
  endDate.value = f(new Date(now.getFullYear(), now.getMonth() + 1, 0));
}

async function load() {
  if (!props.contractId || !startDate.value || !endDate.value) return;
  loading.value = true;
  summary.value = null;
  snapshots.value = [];
  try {
    const r = await axios.get(`${config.apiBaseUrl}/auth/contracts/${props.contractId}/partner-snapshots`, {
      headers: authHeaders(),
      params: { start_date: startDate.value, end_date: endDate.value },
    });
    if (r.data?.status === 'success') {
      snapshots.value = r.data.snapshots || [];
      summary.value = r.data.summary || { total_cost: 0 };
    } else {
      emit('error', 'Неверный формат ответа');
    }
  } catch (e: any) {
    emit('error', e?.response?.data?.error || 'Ошибка расчёта стоимости');
  } finally {
    loading.value = false;
  }
}

// При открытии: дефолт текущий месяц + авто-расчёт.
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      if (!startDate.value) defaultMonth();
      snapshots.value = [];
      summary.value = null;
      load();
    }
  }
);

function money(v: any) {
  const n = typeof v === 'string' ? parseFloat(v) : v || 0;
  return (n || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(s: string) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
</script>
