<template>
  <div v-if="alerts.length" class="alerts-row mb-4">
    <v-alert
      v-for="a in alerts"
      :key="a.id"
      :type="severityType(a.severity)"
      variant="tonal"
      density="compact"
      class="mb-2 alert-row-item"
      :icon="categoryIcon(a.category)"
    >
      <div class="d-flex align-center">
        <div class="flex-grow-1">
          <div class="alert-title">{{ a.title }}</div>
          <div class="alert-desc text-body-2">{{ a.description }}</div>
        </div>
        <v-btn
          :to="a.action_url"
          :color="severityType(a.severity)"
          variant="elevated"
          size="small"
          class="ml-3 alert-cta"
        >
          {{ a.action_label }}
        </v-btn>
      </div>
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { dashboardKpiService, type DashboardAlert } from "@/services/dashboardKpiService";

const alerts = ref<DashboardAlert[]>([]);
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    alerts.value = await dashboardKpiService.getAlerts();
  } catch {
    alerts.value = [];
  } finally {
    loading.value = false;
  }
}

function severityType(sev: string): "error" | "warning" | "info" {
  switch (sev) {
    case "critical": return "error";
    case "high": return "error";
    case "medium": return "warning";
    default: return "info";
  }
}

function categoryIcon(cat: string): string {
  switch (cat) {
    case "billing": return "mdi-currency-usd-off";
    case "warehouse": return "mdi-package-variant-remove";
    case "installations": return "mdi-clock-alert-outline";
    case "notifications": return "mdi-bell-alert-outline";
    default: return "mdi-alert-circle-outline";
  }
}

defineExpose({ reload: load });

onMounted(load);
</script>

<style scoped>
.alert-row-item :deep(.v-alert__content) {
  width: 100%;
}
.alert-title {
  font-weight: 600;
}
.alert-desc {
  margin-top: 2px;
}
</style>
