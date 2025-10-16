<template>
  <div class="activity-indicator">
    <!-- Основной контейнер с тенью -->
    <div class="indicator-container" :class="containerClass">
      
      <!-- Заголовок убран, так как дублирует заголовок виджета -->

      <!-- Прямоугольные индикаторы для каждой категории -->
      <div class="indicators-row">
        <div 
          v-for="(item, index) in indicatorData" 
          :key="index"
          class="indicator-item"
          :class="{ 'clickable': item.clickable }"
          @click="item.clickable && $emit('item-click', item)"
        >
          <!-- Прямоугольный индикатор -->
          <div class="rectangular-indicator" :class="item.colorClass">
            <div class="indicator-content">
              <div class="indicator-value">{{ item.value }}</div>
              <div class="indicator-label">{{ item.label }}</div>
            </div>
            <div class="indicator-progress" :style="getProgressStyle(item)"></div>
          </div>
        </div>
      </div>

      <!-- Общая статистика -->
      <div class="summary-stats">
        <div class="stat-bar">
          <div 
            v-for="(item, index) in indicatorData" 
            :key="index"
            class="stat-segment"
            :class="item.colorClass"
            :style="{ width: getSegmentWidth(item) + '%' }"
            :title="`${item.label}: ${item.value}`"
          ></div>
        </div>
        <div class="summary-text">
          <span class="summary-label">{{ summaryLabel }}</span>
          <span class="summary-value">{{ Math.round(activePercentage) }}% {{ activeLabel }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from 'vue';

export interface ActivityIndicatorItem {
  label: string;
  value: number;
  colorClass: string;
  percentage: number;
  clickable?: boolean;
}

export default defineComponent({
  name: 'ActivityIndicator',
  props: {
    title: {
      type: String,
      required: true
    },
    data: {
      type: Array as PropType<ActivityIndicatorItem[]>,
      required: true
    },
    activePercentage: {
      type: Number,
      required: true
    },
    activeLabel: {
      type: String,
      default: 'активных'
    },
    summaryLabel: {
      type: String,
      default: 'Общая активность'
    },
    size: {
      type: String as PropType<'small' | 'medium' | 'large'>,
      default: 'medium'
    }
  },
  emits: ['item-click'],
  setup(props) {
    const containerClass = computed(() => ({
      [`size-${props.size}`]: true
    }));

    const indicatorData = computed(() => {
      return props.data.map(item => ({
        ...item,
        percentage: item.value > 0 ? (item.value / props.data.reduce((sum, d) => sum + d.value, 0)) * 100 : 0
      }));
    });

    const getProgressStyle = (item: ActivityIndicatorItem) => {
      return {
        '--progress-width': `${item.percentage}%`
      };
    };

    const getSegmentWidth = (item: ActivityIndicatorItem) => {
      const total = props.data.reduce((sum, d) => sum + d.value, 0);
      return total > 0 ? (item.value / total) * 100 : 0;
    };

    return {
      containerClass,
      indicatorData,
      getProgressStyle,
      getSegmentWidth
    };
  }
});
</script>

<style scoped>
.activity-indicator {
  width: 100%;
}

.indicator-container {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-surface), 0.9) 0%, 
    rgba(var(--v-theme-surface-variant), 0.1) 100%);
  border: 1px solid rgba(var(--v-theme-outline-variant), 0.3);
  border-radius: 16px;
  padding: 16px; /* Уменьшено с 20px */
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.indicator-container:hover {
  box-shadow: 
    0 8px 30px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}


.indicators-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 20px; /* Уменьшено с 28px */
  gap: 16px; /* Уменьшено с 20px */
}

.indicator-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
}

.indicator-item.clickable {
  cursor: pointer;
}

.indicator-item.clickable:hover {
  transform: scale(1.05);
}

.rectangular-indicator {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  border: 2px solid rgba(var(--v-theme-outline-variant), 0.2);
  overflow: hidden;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.rectangular-indicator:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.indicator-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 8px;
}

.indicator-value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 4px;
}

.indicator-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
  text-transform: uppercase;
  letter-spacing: 0.3px;
  line-height: 1;
  text-align: center;
}

.indicator-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  width: var(--progress-width);
  border-radius: 0 0 12px 12px;
  transition: width 0.3s ease;
}

/* Цветовые классы для прямоугольных индикаторов */
.rectangular-indicator.primary {
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.rectangular-indicator.primary .indicator-progress {
  background: linear-gradient(90deg, 
    rgb(var(--v-theme-primary)), 
    rgba(var(--v-theme-primary), 0.8));
}

.rectangular-indicator.success {
  border-color: rgba(var(--v-theme-success), 0.3);
}

.rectangular-indicator.success .indicator-progress {
  background: linear-gradient(90deg, 
    rgb(var(--v-theme-success)), 
    rgba(var(--v-theme-success), 0.8));
}

.rectangular-indicator.warning {
  border-color: rgba(var(--v-theme-warning), 0.3);
}

.rectangular-indicator.warning .indicator-progress {
  background: linear-gradient(90deg, 
    rgb(var(--v-theme-warning)), 
    rgba(var(--v-theme-warning), 0.8));
}

.rectangular-indicator.error {
  border-color: rgba(var(--v-theme-error), 0.3);
}

.rectangular-indicator.error .indicator-progress {
  background: linear-gradient(90deg, 
    rgb(var(--v-theme-error)), 
    rgba(var(--v-theme-error), 0.8));
}

.rectangular-indicator.info {
  border-color: rgba(var(--v-theme-info), 0.3);
}

.rectangular-indicator.info .indicator-progress {
  background: linear-gradient(90deg, 
    rgb(var(--v-theme-info)), 
    rgba(var(--v-theme-info), 0.8));
}

.rectangular-indicator.secondary {
  border-color: rgba(var(--v-theme-secondary), 0.3);
}

.rectangular-indicator.secondary .indicator-progress {
  background: linear-gradient(90deg, 
    rgb(var(--v-theme-secondary)), 
    rgba(var(--v-theme-secondary), 0.8));
}

/* Статистическая полоса */
.summary-stats {
  margin-top: 16px;
}

.stat-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
  background: rgba(var(--v-theme-outline-variant), 0.1);
}

.stat-segment {
  height: 100%;
  transition: all 0.3s ease;
  position: relative;
}

.stat-segment::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    rgba(255, 255, 255, 0.2) 0%, 
    transparent 50%, 
    rgba(255, 255, 255, 0.1) 100%);
}

.stat-segment.primary {
  background: linear-gradient(135deg, 
    rgb(var(--v-theme-primary)), 
    rgba(var(--v-theme-primary), 0.8));
}

.stat-segment.success {
  background: linear-gradient(135deg, 
    rgb(var(--v-theme-success)), 
    rgba(var(--v-theme-success), 0.8));
}

.stat-segment.warning {
  background: linear-gradient(135deg, 
    rgb(var(--v-theme-warning)), 
    rgba(var(--v-theme-warning), 0.8));
}

.stat-segment.error {
  background: linear-gradient(135deg, 
    rgb(var(--v-theme-error)), 
    rgba(var(--v-theme-error), 0.8));
}

.stat-segment.info {
  background: linear-gradient(135deg, 
    rgb(var(--v-theme-info)), 
    rgba(var(--v-theme-info), 0.8));
}

.stat-segment.secondary {
  background: linear-gradient(135deg, 
    rgb(var(--v-theme-secondary)), 
    rgba(var(--v-theme-secondary), 0.8));
}

.summary-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
  font-weight: 500;
}

.summary-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

/* Размеры */
.size-small .indicator-container {
  padding: 12px;
}

.size-small .indicators-row {
  margin-bottom: 12px;
}

.size-large .indicator-container {
  padding: 24px;
}

.size-large .indicators-row {
  margin-bottom: 32px;
}

/* Анимации */
@keyframes pulse {
  0%, 100% {
    opacity: 0.8;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.02);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.indicator-container {
  animation: fadeInUp 0.6s ease-out;
}

/* Адаптивность для разных разрешений экрана */

/* Большие экраны (1400px+) */
@media (min-width: 1400px) {
  .indicators-row {
    gap: 24px;
  }
  
  .indicator-value {
    font-size: 1.6rem;
  }
  
  .indicator-label {
    font-size: 1rem;
  }
  
  .rectangular-indicator {
    width: 120px;
    height: 120px;
  }
}

/* Большие экраны (1200px-1399px) */
@media (max-width: 1399px) and (min-width: 1200px) {
  .indicators-row {
    gap: 20px;
  }
  
  .indicator-value {
    font-size: 1.5rem;
  }
  
  .indicator-label {
    font-size: 0.95rem;
  }
  
  .rectangular-indicator {
    width: 120px;
    height: 120px;
  }
}

/* Средне-большие экраны (992px-1199px) */
@media (max-width: 1199px) and (min-width: 992px) {
  .indicators-row {
    gap: 16px;
  }
  
  .indicator-value {
    font-size: 1.4rem;
  }
  
  .indicator-label {
    font-size: 0.9rem;
  }
  
  .rectangular-indicator {
    width: 120px;
    height: 120px;
  }
}

/* Планшеты (768px-991px) */
@media (max-width: 991px) and (min-width: 768px) {
  .indicators-row {
    flex-wrap: wrap;
    gap: 14px;
  }
  
  .indicator-item {
    flex: 1;
    min-width: calc(50% - 7px);
  }
  
  .indicator-value {
    font-size: 1.3rem;
  }
  
  .indicator-label {
    font-size: 0.85rem;
  }
  
  .rectangular-indicator {
    width: 120px;
    height: 120px;
  }
}

/* Малые планшеты и большие телефоны (576px-767px) */
@media (max-width: 767px) and (min-width: 576px) {
  .indicator-container {
    padding: 18px;
  }
  
  .indicators-row {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .indicator-item {
    flex: 1;
    min-width: calc(50% - 6px);
  }
  
  .indicator-value {
    font-size: 1.2rem;
  }
  
  .indicator-label {
    font-size: 0.85rem;
  }
  
  .rectangular-indicator {
    width: 120px;
    height: 120px;
  }
}

/* Мобильные устройства (480px-575px) */
@media (max-width: 575px) and (min-width: 480px) {
  .indicator-container {
    padding: 16px;
  }
  
  .indicators-row {
    flex-direction: column;
    gap: 18px;
  }
  
  .indicator-item {
    min-width: auto;
  }
  
  .indicator-value {
    font-size: 1.1rem;
  }
  
  .indicator-label {
    font-size: 0.8rem;
  }
  
  .rectangular-indicator {
    width: 120px;
    height: 120px;
  }
}

/* Маленькие мобильные устройства (360px-479px) */
@media (max-width: 479px) and (min-width: 360px) {
  .indicator-container {
    padding: 14px;
  }
  
  .indicators-row {
    flex-direction: column;
    gap: 16px;
  }
  
  .indicator-value {
    font-size: 1rem;
  }
  
  .indicator-label {
    font-size: 0.75rem;
  }
  
  .rectangular-indicator {
    width: 120px;
    height: 120px;
  }
}

/* Очень маленькие экраны (до 359px) */
@media (max-width: 359px) {
  .indicator-container {
    padding: 12px;
  }
  
  .indicators-row {
    flex-direction: column;
    gap: 14px;
  }
  
  .indicator-value {
    font-size: 0.9rem;
  }
  
  .indicator-label {
    font-size: 0.7rem;
  }
  
  .rectangular-indicator {
    width: 120px;
    height: 120px;
  }
}

/* Горизонтальная ориентация на мобильных */
@media (max-height: 500px) and (orientation: landscape) {
  .indicator-container {
    padding: 12px;
  }
  
  .indicators-row {
    flex-direction: row;
    gap: 8px;
    margin-bottom: 16px;
  }
  
  .indicator-item {
    flex: 1;
  }
  
  .indicator-value {
    font-size: 1rem;
  }
  
  .rectangular-indicator {
    width: 120px;
    height: 120px;
  }
  
  .indicator-label {
    font-size: 0.7rem;
  }
}
</style>
