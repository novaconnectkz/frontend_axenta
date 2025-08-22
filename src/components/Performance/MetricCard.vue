<template>
  <v-card class="metric-card" :class="`metric-${color}`" variant="outlined">
    <v-card-text>
      <div class="metric-header">
        <div class="metric-icon">
          <v-icon :color="color" size="24">{{ icon }}</v-icon>
        </div>
        
        <div v-if="change !== undefined" class="metric-change">
          <v-icon 
            :color="change >= 0 ? 'success' : 'error'" 
            size="16"
          >
            {{ change >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}
          </v-icon>
          <span 
            class="change-value"
            :class="change >= 0 ? 'positive' : 'negative'"
          >
            {{ formatChange(change) }}
          </span>
        </div>
      </div>
      
      <div class="metric-content">
        <div class="metric-value">{{ value }}</div>
        <div class="metric-title">{{ title }}</div>
        <div v-if="description" class="metric-description">
          {{ description }}
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">

interface Props {
  title: string
  value: string | number
  change?: number
  icon: string
  color: string
  description?: string
}

const props = defineProps<Props>()

const formatChange = (change: number): string => {
  const abs = Math.abs(change)
  return `${change >= 0 ? '+' : ''}${abs.toFixed(1)}%`
}
</script>

<style scoped>
.metric-card {
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: currentColor;
  opacity: 0.6;
}

.metric-card.metric-success::before {
  background: rgb(var(--v-theme-success));
}

.metric-card.metric-error::before {
  background: rgb(var(--v-theme-error));
}

.metric-card.metric-warning::before {
  background: rgb(var(--v-theme-warning));
}

.metric-card.metric-info::before {
  background: rgb(var(--v-theme-info));
}

.metric-card.metric-primary::before {
  background: rgb(var(--v-theme-primary));
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.metric-icon {
  padding: 8px;
  border-radius: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.5);
}

.metric-change {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  font-size: 0.75rem;
  font-weight: 500;
}

.change-value.positive {
  color: rgb(var(--v-theme-success));
}

.change-value.negative {
  color: rgb(var(--v-theme-error));
}

.metric-content {
  text-align: left;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.2;
  margin-bottom: 4px;
}

.metric-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 8px;
}

.metric-description {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: 0.8;
  line-height: 1.3;
}

@media (max-width: 768px) {
  .metric-value {
    font-size: 1.5rem;
  }
  
  .metric-header {
    margin-bottom: 12px;
  }
}
</style>
