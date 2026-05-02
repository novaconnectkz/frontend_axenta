<template>
  <v-card variant="flat" border class="invoices-card">
    <v-card-title class="d-flex align-center pa-4 pb-2">
      <v-icon class="mr-2">mdi-receipt-text-outline</v-icon>
      <span class="text-h6">Последние счета</span>
      <v-spacer />
      <v-chip size="small" variant="tonal">{{ items.length }}</v-chip>
    </v-card-title>

    <v-divider />

    <div v-if="loading" class="pa-4">
      <v-skeleton-loader type="list-item-three-line" />
    </div>

    <div v-else-if="!items.length" class="pa-6 text-center text-medium-emphasis">
      <v-icon size="32" class="mb-2">mdi-receipt-outline</v-icon>
      <div>Счетов пока нет</div>
    </div>

    <v-list v-else density="comfortable" class="py-0">
      <v-list-item
        v-for="item in shownItems"
        :key="item.id"
        :to="`/billing/invoices/${item.id}`"
      >
        <v-list-item-title class="d-flex align-center">
          <span class="font-weight-medium">{{ item.number }}</span>
          <v-icon
            v-if="item.is_overdue"
            size="14"
            color="error"
            class="ml-2"
            title="Просрочен"
          >
            mdi-alert-circle
          </v-icon>
        </v-list-item-title>
        <v-list-item-subtitle v-if="item.client_name">
          {{ item.client_name }}
        </v-list-item-subtitle>

        <template #append>
          <div class="text-right">
            <div class="font-weight-medium">{{ formatRubles(item.total_amount) }}</div>
            <v-chip
              size="x-small"
              :color="statusColor(item.status, item.is_overdue)"
              variant="tonal"
            >
              {{ statusLabel(item.status, item.is_overdue) }}
            </v-chip>
          </div>
        </template>
      </v-list-item>
    </v-list>

    <v-divider v-if="items.length > maxVisible" />
    <v-card-actions v-if="items.length > maxVisible">
      <v-spacer />
      <v-btn variant="text" size="small" to="/billing">
        Все ({{ items.length }})
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { dashboardKpiService, type RecentInvoiceItem } from "@/services/dashboardKpiService";

const items = ref<RecentInvoiceItem[]>([]);
const loading = ref(false);
const maxVisible = 5;

const shownItems = computed(() => items.value.slice(0, maxVisible));

async function load() {
  loading.value = true;
  try {
    items.value = await dashboardKpiService.getRecentInvoices();
  } catch {
    items.value = [];
  } finally {
    loading.value = false;
  }
}

function statusColor(status: string, overdue: boolean): string {
  if (overdue) return "error";
  switch (status) {
    case "paid": return "success";
    case "sent": return "info";
    case "cancelled": return "grey";
    case "draft": return "warning";
    default: return "grey";
  }
}

function statusLabel(status: string, overdue: boolean): string {
  if (overdue) return "Просрочен";
  switch (status) {
    case "draft": return "Черновик";
    case "sent": return "Выставлен";
    case "paid": return "Оплачен";
    case "overdue": return "Просрочен";
    case "cancelled": return "Отменён";
    default: return status;
  }
}

function formatRubles(value: string): string {
  const n = Number(value);
  if (Number.isNaN(n)) return value + " ₽";
  return n.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽";
}

defineExpose({ reload: load });

onMounted(load);
</script>

<style scoped>
.invoices-card {
  height: 100%;
}
</style>
