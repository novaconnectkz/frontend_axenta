<template>
  <div
    class="apple-card"
    :class="cardClasses"
    @click="handleClick"
  >
    <!-- Header -->
    <div v-if="$slots.header || title" class="apple-card-header">
      <slot name="header">
        <div class="apple-card-title-section">
          <v-icon
            v-if="icon"
            :icon="icon"
            :color="iconColor"
            :size="iconSize"
            class="apple-card-icon"
          />
          <div>
            <h3 v-if="title" class="apple-card-title">{{ title }}</h3>
            <p v-if="subtitle" class="apple-card-subtitle">{{ subtitle }}</p>
          </div>
        </div>
        
        <div v-if="$slots.actions" class="apple-card-actions">
          <slot name="actions" />
        </div>
      </slot>
    </div>
    
    <!-- Body -->
    <div v-if="$slots.default" class="apple-card-body">
      <slot />
    </div>
    
    <!-- Footer -->
    <div v-if="$slots.footer" class="apple-card-footer">
      <slot name="footer" />
    </div>
    
    <!-- Loading overlay -->
    <div v-if="loading" class="apple-card-loading">
      <div class="apple-card-spinner">
        <div class="apple-spinner-large"></div>
        <p v-if="loadingText" class="apple-loading-text">{{ loadingText }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title?: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  variant?: 'elevated' | 'outlined' | 'flat';
  clickable?: boolean;
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  hover?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'elevated',
  clickable: false,
  loading: false,
  disabled: false,
  hover: true,
  iconColor: 'primary',
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const cardClasses = computed(() => [
  `apple-card-${props.variant}`,
  {
    'apple-card-clickable': props.clickable,
    'apple-card-disabled': props.disabled,
    'apple-card-loading': props.loading,
    'apple-card-hover': props.hover,
  }
]);

const iconSize = computed(() => {
  return props.subtitle ? 24 : 20;
});

const handleClick = (event: MouseEvent) => {
  if (props.clickable && !props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<style scoped>
.apple-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Variants */
.apple-card-elevated {
  border: 1px solid rgba(60, 60, 67, 0.08);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.12), 
    0 1px 2px rgba(0, 0, 0, 0.24);
}

.apple-card-outlined {
  border: 1px solid rgba(60, 60, 67, 0.16);
  box-shadow: none;
}

.apple-card-flat {
  border: none;
  box-shadow: none;
  background: transparent;
}

/* States */
.apple-card-hover:hover:not(.apple-card-disabled):not(.apple-card-loading) {
  box-shadow: 
    0 3px 6px rgba(0, 0, 0, 0.16), 
    0 3px 6px rgba(0, 0, 0, 0.23);
  transform: translateY(-2px);
}

.apple-card-clickable {
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}

.apple-card-clickable:active:not(.apple-card-disabled):not(.apple-card-loading) {
  transform: translateY(0) scale(0.98);
}

.apple-card-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.apple-card-loading {
  pointer-events: none;
}

/* Header */
.apple-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid rgba(60, 60, 67, 0.08);
  background: rgba(242, 242, 247, 0.3);
}

.apple-card-title-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.apple-card-icon {
  margin-top: 2px;
}

.apple-card-title {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.apple-card-subtitle {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
  color: var(--text-secondary);
  margin: 0;
}

.apple-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Body */
.apple-card-body {
  flex: 1;
  padding: 20px;
}

/* Footer */
.apple-card-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(60, 60, 67, 0.08);
  background: rgba(242, 242, 247, 0.3);
}

/* Loading */
.apple-card-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.apple-card-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.apple-spinner-large {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0, 122, 255, 0.2);
  border-top: 3px solid #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.apple-loading-text {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Темная тема */
[data-theme="dark"] .apple-card {
  background: rgba(28, 28, 30, 1);
  border-color: rgba(84, 84, 136, 0.16);
}

[data-theme="dark"] .apple-card-header,
[data-theme="dark"] .apple-card-footer {
  background: rgba(44, 44, 46, 0.3);
  border-color: rgba(84, 84, 136, 0.08);
}

[data-theme="dark"] .apple-card-loading {
  background: rgba(28, 28, 30, 0.8);
}

/* Совместимость с браузерами */
@supports not (backdrop-filter: blur(20px)) {
  .apple-card-elevated {
    background: rgba(255, 255, 255, 0.95);
  }
  
  .apple-card-loading {
    background: rgba(255, 255, 255, 0.9);
  }
  
  [data-theme="dark"] .apple-card {
    background: rgba(28, 28, 30, 0.95);
  }
  
  [data-theme="dark"] .apple-card-loading {
    background: rgba(28, 28, 30, 0.9);
  }
}

/* Mobile optimizations */
@media (max-width: 480px) {
  .apple-card-header,
  .apple-card-body,
  .apple-card-footer {
    padding: 16px;
  }
  
  .apple-card-title {
    font-size: 16px;
  }
  
  .apple-card-subtitle {
    font-size: 13px;
  }
}

/* Touch devices */
@media (hover: none) and (pointer: coarse) {
  .apple-card-hover:hover {
    transform: none;
  }
  
  .apple-card-clickable:active {
    transform: scale(0.98);
  }
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  .apple-card,
  .apple-card-loading,
  .apple-spinner-large {
    transition: none;
    animation: none;
  }
}

/* High contrast */
@media (prefers-contrast: high) {
  .apple-card {
    border: 2px solid var(--text-primary);
  }
  
  .apple-card-header,
  .apple-card-footer {
    border-color: var(--text-primary);
  }
}
</style>
