<template>
  <v-card variant="flat" border class="today-card">
    <v-card-title class="d-flex align-center pa-4 pb-2">
      <v-icon class="mr-2">mdi-tools</v-icon>
      <span class="text-h6">Монтажи на сегодня</span>
      <v-spacer />
      <v-chip size="small" variant="tonal">{{ items.length }}</v-chip>
    </v-card-title>

    <v-divider />

    <div v-if="loading" class="pa-4">
      <v-skeleton-loader type="list-item-three-line" />
    </div>

    <div v-else-if="!items.length" class="pa-6 text-center text-medium-emphasis">
      <v-icon size="32" class="mb-2">mdi-calendar-blank-outline</v-icon>
      <div>Нет запланированных монтажей</div>
    </div>

    <v-list v-else density="comfortable" class="py-0">
      <v-list-item
        v-for="item in shownItems"
        :key="item.id"
        :to="`/installations?id=${item.id}`"
        :class="`status-${item.status}`"
      >
        <template #prepend>
          <div class="time-label">{{ item.time_label }}</div>
        </template>

        <v-list-item-title class="text-body-1">
          {{ item.installer_name || "—" }}
          <span v-if="item.object_name" class="text-medium-emphasis">
            · {{ item.object_name }}
          </span>
        </v-list-item-title>
        <v-list-item-subtitle v-if="item.address">
          <v-icon size="12" class="mr-1">mdi-map-marker-outline</v-icon>
          {{ item.address }}
        </v-list-item-subtitle>

        <template #append>
          <v-chip
            size="x-small"
            :color="statusColor(item.status)"
            variant="tonal"
          >
            {{ statusLabel(item.status) }}
          </v-chip>
        </template>
      </v-list-item>
    </v-list>

    <v-divider v-if="items.length > maxVisible" />
    <v-card-actions v-if="items.length > maxVisible">
      <v-spacer />
      <v-btn variant="text" size="small" to="/installations?date=today">
        Все ({{ items.length }})
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { dashboardKpiService, type TodayInstallationItem } from "@/services/dashboardKpiService";

const items = ref<TodayInstallationItem[]>([]);
const loading = ref(false);
const maxVisible = 5;

const shownItems = computed(() => items.value.slice(0, maxVisible));

async function load() {
  loading.value = true;
  try {
    items.value = await dashboardKpiService.getTodayInstallations();
  } catch {
    items.value = [];
  } finally {
    loading.value = false;
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "completed": return "success";
    case "in_progress": return "info";
    case "cancelled": return "error";
    default: return "warning";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "planned": return "План";
    case "in_progress": return "В работе";
    case "completed": return "Готов";
    case "cancelled": return "Отменён";
    default: return status;
  }
}

defineExpose({ reload: load });

onMounted(load);
</script>

<style scoped>
.today-card {
  height: 100%;
}
.time-label {
  font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, monospace;
  margin-right: 12px;
  font-size: 14px;
  color: rgb(var(--v-theme-primary));
  min-width: 48px;
}
.status-completed {
  opacity: 0.65;
}
</style>
