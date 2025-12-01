<template>
  <v-card 
    variant="outlined" 
    class="billing-stat-card"
    :class="{ 'expanded': isExpanded }"
    @click="handleClick"
  >
    <v-card-text :class="cardTextClass">
      <div class="stat-header">
        <div class="stat-icon-wrapper">
          <v-icon :size="iconSize" :color="iconColor" class="stat-icon">
            {{ icon }}
          </v-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formattedValue }}</div>
          <div class="stat-label">{{ title }}</div>
        </div>
        <v-icon 
          size="16" 
          class="expand-icon"
          :class="{ 'rotated': isExpanded }"
          @click.stop="toggleExpand"
        >
          mdi-chevron-down
        </v-icon>
      </div>
      
      <v-expand-transition>
        <div v-if="isExpanded" class="stat-details" @click.stop>
          <v-divider class="my-2"></v-divider>
          <div class="stat-description">
            <slot name="description">
              {{ description }}
            </slot>
          </div>
          <div v-if="additionalInfo" class="stat-additional">
            <slot name="additional">
              {{ additionalInfo }}
            </slot>
          </div>
        </div>
      </v-expand-transition>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  title: string
  value: string | number
  icon: string
  iconColor?: string
  format?: 'currency' | 'number' | 'percentage'
  currency?: string
  description?: string
  additionalInfo?: string
  defaultExpanded?: boolean
  metricKey?: string
}

const emit = defineEmits<{
  'open-detail': [metricKey: string | undefined]
}>()

const props = withDefaults(defineProps<Props>(), {
  iconColor: 'primary',
  format: 'number',
  currency: 'RUB',
  defaultExpanded: false
})

const isExpanded = ref(props.defaultExpanded)

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

const handleClick = (event: MouseEvent) => {
  // Если клик по иконке разворачивания, только сворачиваем/разворачиваем
  const target = event.target as HTMLElement
  if (target.closest('.expand-icon') || target.closest('.stat-details')) {
    toggleExpand()
  } else {
    // Иначе открываем детальный диалог
    emit('open-detail', props.metricKey)
  }
}

const iconSize = computed(() => isExpanded.value ? 28 : 20)
const cardTextClass = computed(() => ({
  'pa-1': !isExpanded.value,
  'pa-3': isExpanded.value,
  'compact': !isExpanded.value
}))

const formattedValue = computed(() => {
  const val = typeof props.value === 'string' ? parseFloat(props.value) : props.value
  
  if (props.format === 'currency') {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: props.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val || 0)
  }
  
  if (props.format === 'percentage') {
    return `${val.toFixed(1)}%`
  }
  
  return val.toLocaleString('ru-RU')
})
</script>

<style scoped>
.billing-stat-card {
  cursor: pointer;
  transition: all 0.2s ease;
  height: 100%;
}

.billing-stat-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.billing-stat-card.expanded {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.stat-icon-wrapper {
  flex-shrink: 0;
}

.stat-icon {
  transition: transform 0.2s ease;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.2;
  color: rgba(0, 0, 0, 0.87);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.billing-stat-card.expanded .stat-value {
  font-size: 1.25rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.7rem;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 2px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.billing-stat-card.expanded .stat-label {
  font-size: 0.8125rem;
  margin-top: 4px;
}

.expand-icon {
  flex-shrink: 0;
  transition: transform 0.2s ease;
  opacity: 0.5;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

.stat-details {
  margin-top: 8px;
}

.stat-description {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1.4;
}

.stat-additional {
  margin-top: 8px;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
}

.compact {
  padding: 4px 8px !important;
}

[data-theme="dark"] .stat-value {
  color: rgba(255, 255, 255, 0.87);
}

[data-theme="dark"] .stat-label {
  color: rgba(255, 255, 255, 0.6);
}

[data-theme="dark"] .stat-description {
  color: rgba(255, 255, 255, 0.7);
}

[data-theme="dark"] .stat-additional {
  color: rgba(255, 255, 255, 0.6);
}

[data-theme="dark"] .expand-icon {
  color: rgba(255, 255, 255, 0.5) !important;
}

[data-theme="dark"] .billing-stat-card:hover {
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .billing-stat-card.expanded {
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15);
}
</style>

