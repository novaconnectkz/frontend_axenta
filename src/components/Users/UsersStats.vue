<template>
  <div class="stats-section">
    <div class="stats-grid">
      <AppleCard
        v-for="stat in stats"
        :key="stat.key"
        :title="(stat.value || 0).toString()"
        :subtitle="stat.label"
        :icon="stat.icon"
        :icon-color="stat.color"
        variant="outlined"
        class="stat-card"
      />
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
</style>
