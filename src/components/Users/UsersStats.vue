<template>
  <div class="stats-section">
    <div class="stats-grid">
      <template v-for="stat in stats" :key="stat.key">
        <v-tooltip v-if="stat.breakdown" location="bottom">
          <template #activator="{ props: tooltipProps }">
            <AppleCard
              v-bind="tooltipProps"
              :title="(stat.value || 0).toString()"
              :subtitle="stat.label"
              :icon="stat.icon"
              :icon-color="stat.color"
              variant="outlined"
              class="stat-card"
            />
          </template>
          <div class="stats-tooltip">
            <div><strong>Axenta:</strong> {{ stat.breakdown.axenta }}</div>
            <div v-if="stat.breakdown.wl > 0"><strong>WL:</strong> {{ stat.breakdown.wl }}</div>
            <div v-if="stat.breakdown.wh > 0"><strong>WH:</strong> {{ stat.breakdown.wh }}</div>
            <div v-if="stat.breakdown.skif > 0"><strong>SKIF:</strong> {{ stat.breakdown.skif }}</div>
          </div>
        </v-tooltip>
        <AppleCard
          v-else
          :title="(stat.value || 0).toString()"
          :subtitle="stat.label"
          :icon="stat.icon"
          :icon-color="stat.color"
          variant="outlined"
          class="stat-card"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppleCard from '@/components/Apple/AppleCard.vue';

interface Stat {
  key: string;
  label: string;
  value: number;
  icon: string;
  color: string;
  breakdown?: { axenta: number; wl: number; wh: number; skif: number };
}

defineProps<{ stats: Stat[] }>();
</script>

<style scoped>
.stats-section {
  margin: 0;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
.stat-card {
  text-align: center;
}
.stats-tooltip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
}
</style>
