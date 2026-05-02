<template>
  <div class="kpi-bar">
    <v-row dense>
      <v-col v-for="m in metrics" :key="m.id" cols="12" sm="6" md="3">
        <v-card
          class="kpi-card"
          :class="`kpi-card--${m.delta_direction}`"
          :to="m.action_url"
          variant="flat"
          border
        >
          <v-card-text class="pa-4">
            <div class="kpi-title text-caption text-medium-emphasis">{{ m.title }}</div>
            <div class="kpi-value">{{ m.value }}</div>
            <div class="kpi-delta" :class="`text-${deltaColor(m.delta_direction)}`">
              <v-icon size="14" class="mr-1">{{ deltaIcon(m.delta_direction) }}</v-icon>
              {{ m.delta }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col v-if="loading && !metrics.length" cols="12" sm="6" md="3">
        <v-skeleton-loader type="card" />
      </v-col>

      <v-col v-if="error && !metrics.length" cols="12">
        <v-alert type="warning" variant="tonal" density="compact">
          KPI временно недоступны: {{ error }}
        </v-alert>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { dashboardKpiService, type KPIMetric } from "@/services/dashboardKpiService";

const metrics = ref<KPIMetric[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const res = await dashboardKpiService.getKPI();
    metrics.value = res.metrics;
  } catch (e: any) {
    error.value = e?.message || "Не удалось загрузить KPI";
  } finally {
    loading.value = false;
  }
}

function deltaIcon(dir: string): string {
  switch (dir) {
    case "up": return "mdi-arrow-up-bold";
    case "down": return "mdi-arrow-down-bold";
    default: return "mdi-minus";
  }
}

function deltaColor(dir: string): string {
  switch (dir) {
    case "up": return "success";
    case "down": return "error";
    default: return "medium-emphasis";
  }
}

defineExpose({ reload: load });

onMounted(load);
</script>

<style scoped>
.kpi-bar {
  margin-bottom: 16px;
}
.kpi-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  height: 100%;
}
.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.kpi-title {
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.kpi-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.1;
  margin: 4px 0 6px;
}
.kpi-delta {
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
}
</style>
