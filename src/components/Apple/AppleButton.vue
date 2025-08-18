<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
    v-bind="$attrs"
  >
    <!-- Loader -->
    <div v-if="loading" class="apple-button-loader">
      <div class="apple-spinner"></div>
    </div>
    
    <!-- Icon слева -->
    <v-icon
      v-if="prependIcon && !loading"
      :icon="prependIcon"
      :size="iconSize"
      class="apple-button-icon-prepend"
    />
    
    <!-- Контент -->
    <span v-if="!loading" class="apple-button-content">
      <slot>{{ text }}</slot>
    </span>
    
    <!-- Icon справа -->
    <v-icon
      v-if="appendIcon && !loading"
      :icon="appendIcon"
      :size="iconSize"
      class="apple-button-icon-append"
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  text?: string;
  prependIcon?: string;
  appendIcon?: string;
  block?: boolean;
  rounded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'medium',
  disabled: false,
  loading: false,
  text: '',
  block: false,
  rounded: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const buttonClasses = computed(() => [
  'apple-button',
  `apple-button-${props.variant}`,
  `apple-button-${props.size}`,
  {
    'apple-button-block': props.block,
    'apple-button-rounded': props.rounded,
    'apple-button-loading': props.loading,
    'apple-button-disabled': props.disabled,
  }
]);

const iconSize = computed(() => {
  switch (props.size) {
    case 'small': return 16;
    case 'large': return 24;
    default: return 20;
  }
});

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<style scoped>
.apple-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0);
  
  outline: none;
  overflow: hidden;
}

/* Варианты кнопок */
.apple-button-primary {
  background: linear-gradient(135deg, #007AFF 0%, #0056CC 100%);
  color: white;
  box-shadow: 0 3px 6px rgba(0, 122, 255, 0.3), 0 3px 6px rgba(0, 0, 0, 0.15);
}

.apple-button-primary:hover:not(:disabled):not(.apple-button-loading) {
  background: linear-gradient(135deg, #4DA6FF 0%, #007AFF 100%);
  box-shadow: 0 6px 12px rgba(0, 122, 255, 0.4), 0 6px 12px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.apple-button-primary:active {
  background: linear-gradient(135deg, #0056CC 0%, #003D99 100%);
  box-shadow: 0 1px 3px rgba(0, 122, 255, 0.2);
  transform: translateY(0);
}

.apple-button-secondary {
  background: rgba(255, 255, 255, 0.8);
  color: #007AFF;
  border: 1px solid rgba(0, 122, 255, 0.2);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.apple-button-secondary:hover:not(:disabled):not(.apple-button-loading) {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(0, 122, 255, 0.4);
  transform: translateY(-1px);
}

.apple-button-danger {
  background: linear-gradient(135deg, #FF3B30 0%, #D70015 100%);
  color: white;
  box-shadow: 0 3px 6px rgba(255, 59, 48, 0.3), 0 3px 6px rgba(0, 0, 0, 0.15);
}

.apple-button-danger:hover:not(:disabled):not(.apple-button-loading) {
  background: linear-gradient(135deg, #FF6961 0%, #FF3B30 100%);
  transform: translateY(-2px);
}

.apple-button-ghost {
  background: transparent;
  color: #007AFF;
  border: 1px solid #007AFF;
}

.apple-button-ghost:hover:not(:disabled):not(.apple-button-loading) {
  background: #007AFF;
  color: white;
}

.apple-button-text {
  background: transparent;
  color: #007AFF;
  box-shadow: none;
}

.apple-button-text:hover:not(:disabled):not(.apple-button-loading) {
  background: rgba(0, 122, 255, 0.1);
}

/* Размеры */
.apple-button-small {
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 8px;
}

.apple-button-large {
  padding: 16px 24px;
  font-size: 18px;
  border-radius: 16px;
}

/* Модификаторы */
.apple-button-block {
  width: 100%;
}

.apple-button-rounded {
  border-radius: 50px;
}

/* Состояния */
.apple-button:disabled,
.apple-button-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.apple-button-loading {
  cursor: default;
  pointer-events: none;
}

/* Loader */
.apple-button-loader {
  display: flex;
  align-items: center;
  justify-content: center;
}

.apple-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Icons */
.apple-button-icon-prepend {
  margin-right: -4px;
}

.apple-button-icon-append {
  margin-left: -4px;
}

/* Темная тема */
[data-theme="dark"] .apple-button-secondary {
  background: rgba(28, 28, 30, 0.8);
  color: #4DA6FF;
  border-color: rgba(77, 166, 255, 0.2);
}

[data-theme="dark"] .apple-button-secondary:hover:not(:disabled):not(.apple-button-loading) {
  background: rgba(28, 28, 30, 0.95);
  border-color: rgba(77, 166, 255, 0.4);
}

[data-theme="dark"] .apple-button-text {
  color: #4DA6FF;
}

[data-theme="dark"] .apple-button-text:hover:not(:disabled):not(.apple-button-loading) {
  background: rgba(77, 166, 255, 0.1);
}

/* Совместимость с браузерами */
@supports not (backdrop-filter: blur(20px)) {
  .apple-button-secondary {
    background: rgba(255, 255, 255, 0.95);
  }
  
  [data-theme="dark"] .apple-button-secondary {
    background: rgba(28, 28, 30, 0.95);
  }
}

/* Mobile optimizations */
@media (max-width: 480px) {
  .apple-button {
    padding: 10px 16px;
    font-size: 15px;
  }
  
  .apple-button-small {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .apple-button-large {
    padding: 14px 20px;
    font-size: 17px;
  }
}

/* Touch devices */
@media (hover: none) and (pointer: coarse) {
  .apple-button:hover {
    transform: none;
  }
  
  .apple-button:active {
    transform: scale(0.98);
  }
}
</style>
