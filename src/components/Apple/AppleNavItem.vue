<template>
  <router-link
    :to="to"
    class="apple-nav-item"
    :class="{ 'apple-nav-item-active': isActive }"
    @click="handleClick"
  >
    <!-- Icon -->
    <div class="apple-nav-icon">
      <v-icon :icon="icon" :size="iconSize" />
    </div>
    
    <!-- Content -->
    <div v-if="!rail" class="apple-nav-content">
      <div class="apple-nav-title">{{ title }}</div>
      <div v-if="subtitle" class="apple-nav-subtitle">{{ subtitle }}</div>
    </div>
    
    <!-- Badge -->
    <div v-if="badge && badge > 0 && !rail" class="apple-nav-badge">
      {{ badge > 99 ? '99+' : badge }}
    </div>
    
    <!-- Tooltip для collapsed режима -->
    <v-tooltip
      v-if="rail"
      :text="title"
      location="right"
      activator="parent"
    />
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

interface Props {
  to: string;
  icon: string;
  title: string;
  subtitle?: string;
  badge?: number;
  rail?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  rail: false,
  badge: 0,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const route = useRoute();

const isActive = computed(() => {
  return route.path === props.to;
});

const iconSize = computed(() => {
  return props.rail ? 24 : 20;
});

const handleClick = (event: MouseEvent) => {
  emit('click', event);
};
</script>

<style scoped>
.apple-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  
  padding: 12px 16px;
  margin: 2px 12px;
  
  color: var(--apple-text-secondary);
  text-decoration: none;
  border-radius: 12px;
  
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  
  position: relative;
  overflow: hidden;
}

/* Hover эффект */
.apple-nav-item:hover {
  background: rgba(0, 122, 255, 0.1);
  color: var(--apple-blue);
  transform: translateX(4px);
}

.apple-nav-item:hover .apple-nav-icon {
  transform: scale(1.1);
}

/* Active состояние */
.apple-nav-item-active {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.15) 0%, rgba(0, 122, 255, 0.05) 100%);
  color: var(--apple-blue);
  font-weight: 600;
}

.apple-nav-item-active .apple-nav-icon {
  color: var(--apple-blue);
}

/* Icon */
.apple-nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  color: inherit;
}

/* Content */
.apple-nav-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.apple-nav-title {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.2;
  color: inherit;
}

.apple-nav-subtitle {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.2;
  color: var(--apple-text-tertiary);
  opacity: 0.8;
}

/* Badge */
.apple-nav-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  
  background: var(--apple-red);
  color: white;
  
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(255, 59, 48, 0.3);
}

/* Темная тема */
[data-theme="dark"] .apple-nav-item {
  color: #EBEBF5;
}

[data-theme="dark"] .apple-nav-item:hover {
  background: rgba(77, 166, 255, 0.15);
  color: #4DA6FF;
}

[data-theme="dark"] .apple-nav-item-active {
  background: linear-gradient(135deg, rgba(77, 166, 255, 0.2) 0%, rgba(77, 166, 255, 0.1) 100%);
  color: #4DA6FF;
}

[data-theme="dark"] .apple-nav-subtitle {
  color: #EBEBF5CC;
}

/* Rail режим */
.apple-nav-item[data-rail="true"] {
  justify-content: center;
  padding: 12px;
}

.apple-nav-item[data-rail="true"] .apple-nav-content {
  display: none;
}

.apple-nav-item[data-rail="true"] .apple-nav-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  min-width: 16px;
  height: 16px;
  font-size: 10px;
}

/* Анимация появления */
.apple-nav-content {
  animation: slideInLeft 0.3s ease-out;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Mobile optimizations */
@media (max-width: 480px) {
  .apple-nav-item {
    padding: 14px 16px;
  }
  
  .apple-nav-title {
    font-size: 16px;
  }
  
  .apple-nav-subtitle {
    font-size: 13px;
  }
}

/* Touch devices */
@media (hover: none) and (pointer: coarse) {
  .apple-nav-item:hover {
    transform: none;
  }
  
  .apple-nav-item:active {
    background: rgba(0, 122, 255, 0.2);
    transform: scale(0.98);
  }
  
  [data-theme="dark"] .apple-nav-item:active {
    background: rgba(77, 166, 255, 0.25);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .apple-nav-item {
    border: 1px solid transparent;
  }
  
  .apple-nav-item:hover,
  .apple-nav-item-active {
    border-color: currentColor;
  }
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  .apple-nav-item,
  .apple-nav-icon,
  .apple-nav-content {
    transition: none;
    animation: none;
  }
}

@media (max-width: 960px) {
  .sidebar-header {
    padding: 16px;
  }
  
  .main-content {
    padding: 16px;
  }
}
