<template>
  <div class="stats-section">
    <div class="stats-grid">
      <v-tooltip location="bottom">
        <template #activator="{ props: tooltipProps }">
          <AppleCard
            v-bind="tooltipProps"
            :title="totalStats.total.toString()"
            subtitle="Доступных записей"
            icon="mdi-account-group-outline"
            icon-color="primary"
            variant="outlined"
            class="stat-card"
          />
        </template>
        <div class="stats-tooltip">
          <div><strong>Axenta:</strong> {{ stats.total }}</div>
          <div v-if="wialonStats.wl.total > 0"><strong>WL:</strong> {{ wialonStats.wl.total }}</div>
          <div v-if="wialonStats.wh.total > 0"><strong>WH:</strong> {{ wialonStats.wh.total }}</div>
          <div v-if="skifStats.total > 0"><strong>SKIF:</strong> {{ skifStats.total }}</div>
        </div>
      </v-tooltip>

      <v-tooltip location="bottom">
        <template #activator="{ props: tooltipProps }">
          <AppleCard
            v-bind="tooltipProps"
            :title="totalStats.active.toString()"
            subtitle="Активных"
            icon="mdi-account-check-outline"
            icon-color="success"
            variant="outlined"
            class="stat-card"
          />
        </template>
        <div class="stats-tooltip">
          <div><strong>Axenta:</strong> {{ stats.active }}</div>
          <div v-if="wialonStats.wl.active > 0"><strong>WL:</strong> {{ wialonStats.wl.active }}</div>
          <div v-if="wialonStats.wh.active > 0"><strong>WH:</strong> {{ wialonStats.wh.active }}</div>
          <div v-if="skifStats.active > 0"><strong>SKIF:</strong> {{ skifStats.active }}</div>
        </div>
      </v-tooltip>

      <v-tooltip location="bottom">
        <template #activator="{ props: tooltipProps }">
          <AppleCard
            v-bind="tooltipProps"
            :title="(stats.clients + wialonStats.clients + skifStats.clients).toString()"
            subtitle="Клиентов"
            icon="mdi-account-outline"
            icon-color="warning"
            variant="outlined"
            class="stat-card"
          />
        </template>
        <div class="stats-tooltip">
          <div><strong>Axenta:</strong> {{ stats.clients }}</div>
          <div v-if="wialonStats.wl.clients > 0"><strong>WL:</strong> {{ wialonStats.wl.clients }}</div>
          <div v-if="wialonStats.wh.clients > 0"><strong>WH:</strong> {{ wialonStats.wh.clients }}</div>
          <div v-if="skifStats.clients > 0"><strong>SKIF:</strong> {{ skifStats.clients }}</div>
        </div>
      </v-tooltip>

      <v-tooltip location="bottom">
        <template #activator="{ props: tooltipProps }">
          <AppleCard
            v-bind="tooltipProps"
            :title="(stats.partners + wialonStats.dealers).toString()"
            subtitle="Партнеров/Дилеров"
            icon="mdi-handshake-outline"
            icon-color="purple"
            variant="outlined"
            class="stat-card"
          />
        </template>
        <div class="stats-tooltip">
          <div><strong>Axenta:</strong> {{ stats.partners }}</div>
          <div v-if="wialonStats.wl.dealers > 0"><strong>WL (Дилеры):</strong> {{ wialonStats.wl.dealers }}</div>
          <div v-if="wialonStats.wh.dealers > 0"><strong>WH (Дилеры):</strong> {{ wialonStats.wh.dealers }}</div>
        </div>
      </v-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppleCard from '@/components/Apple/AppleCard.vue';

interface AxentaStats {
  total: number;
  active: number;
  blocked: number;
  clients: number;
  partners: number;
}

interface WialonSourceBreakdown {
  total: number;
  active: number;
  clients: number;
  dealers: number;
}

interface WialonStats {
  total: number;
  active: number;
  blocked: number;
  objects: number;
  clients: number;
  dealers: number;
  wl: WialonSourceBreakdown;
  wh: WialonSourceBreakdown;
}

interface TotalStats {
  total: number;
  active: number;
  blocked: number;
}

interface SkifStats {
  total: number;
  active: number;
  blocked: number;
  clients: number;
  dealers: number;
}

defineProps<{
  stats: AxentaStats;
  wialonStats: WialonStats;
  skifStats: SkifStats;
  totalStats: TotalStats;
}>();
</script>

<style scoped>
.stats-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.stat-card {
  height: 100%;
}

[data-theme="dark"] .stat-card {
  background-color: #2c2c2e;
  border: 1px solid #3a3a3c;
}

@media (max-width: 960px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
