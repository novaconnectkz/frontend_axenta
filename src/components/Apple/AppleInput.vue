<template>
  <div class="apple-input-group">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      class="apple-input-label"
      :class="{ 'apple-input-label-error': hasError }"
    >
      {{ label }}
      <span v-if="required" class="apple-input-required">*</span>
    </label>
    
    <!-- Input container -->
    <div class="apple-input-container">
      <div
        class="apple-input-wrapper"
        :class="inputWrapperClasses"
      >
        <!-- Prepend icon -->
        <div v-if="prependIcon" class="apple-input-icon apple-input-icon-prepend">
          <v-icon :icon="prependIcon" :size="iconSize" />
        </div>
        
        <!-- Input -->
        <input
          :id="inputId"
          ref="inputRef"
          :type="computedType"
          :value="modelValue"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :autocomplete="autocomplete"
          :maxlength="maxlength"
          class="apple-input-field"
          @input="handleInput"
          @focus="handleFocus"
          @blur="handleBlur"
          @keydown="handleKeydown"
          v-bind="$attrs"
        />
        
        <!-- Password toggle -->
        <button
          v-if="type === 'password'"
          type="button"
          class="apple-input-password-toggle"
          @click="togglePasswordVisibility"
          :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
        >
          <v-icon 
            :icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'" 
            :size="iconSize" 
          />
        </button>
        
        <!-- Append icon -->
        <div v-if="appendIcon" class="apple-input-icon apple-input-icon-append">
          <v-icon :icon="appendIcon" :size="iconSize" />
        </div>
        
        <!-- Clear button -->
        <button
          v-if="clearable && modelValue && !disabled"
          type="button"
          class="apple-input-clear"
          @click="clearInput"
          aria-label="Очистить"
        >
          <v-icon icon="mdi-close-circle" :size="iconSize" />
        </button>
      </div>
    </div>
    
    <!-- Helper text / Error message -->
    <div v-if="helperText || errorMessage" class="apple-input-helper">
      <div
        class="apple-input-helper-text"
        :class="{ 'apple-input-error-text': hasError }"
      >
        {{ hasError ? errorMessage : helperText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue';

interface Props {
  modelValue?: string | number;
  type?: 'text' | 'password' | 'email' | 'tel' | 'url' | 'search' | 'number' | 'date';
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorMessage?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  clearable?: boolean;
  prependIcon?: string;
  appendIcon?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'outlined' | 'filled' | 'underlined';
  autocomplete?: string;
  maxlength?: number;
  onChange?: (value: string) => void;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'medium',
  variant: 'outlined',
  disabled: false,
  readonly: false,
  required: false,
  clearable: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'input': [value: string];
  'valueChange': [value: string];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  keydown: [event: KeyboardEvent];
  clear: [];
}>();

// Refs
const inputRef = ref<HTMLInputElement>();
const isFocused = ref(false);
const showPassword = ref(false);

// Computed
const inputId = computed(() => `apple-input-${Math.random().toString(36).substr(2, 9)}`);

const hasError = computed(() => !!props.errorMessage);

const computedType = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password';
  }
  return props.type;
});

const iconSize = computed(() => {
  switch (props.size) {
    case 'small': return 16;
    case 'large': return 24;
    default: return 20;
  }
});

const inputWrapperClasses = computed(() => [
  'apple-input-wrapper-base',
  `apple-input-${props.variant}`,
  `apple-input-${props.size}`,
  {
    'apple-input-focused': isFocused.value,
    'apple-input-error': hasError.value,
    'apple-input-disabled': props.disabled,
    'apple-input-readonly': props.readonly,
  }
]);

// Methods
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = target.value;
  console.log('🔵 AppleInput handleInput called:', value);
  
  // Эмитим все события
  emit('update:modelValue', value);
  emit('input', value);
  emit('valueChange', value); // Кастомное событие для надежности
  
  console.log('🔵 AppleInput emitted: update:modelValue, input, valueChange');
  
  // Также вызываем onChange если он передан через props
  console.log('🔵 Checking onChange prop:', { hasOnChange: !!props.onChange, onChangeType: typeof props.onChange });
  if (props.onChange && typeof props.onChange === 'function') {
    console.log('🔵 AppleInput calling onChange prop with value:', value);
    try {
      props.onChange(value);
      console.log('🔵 onChange prop called successfully');
    } catch (error) {
      console.error('🔵 Error calling onChange:', error);
    }
  } else {
    console.log('🔵 onChange prop is not a function or not provided');
  }
};

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true;
  emit('focus', event);
};

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false;
  emit('blur', event);
};

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event);
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const clearInput = () => {
  emit('update:modelValue', '');
  emit('clear');
  inputRef.value?.focus();
};

// Focus method
const focus = () => {
  inputRef.value?.focus();
};

const blur = () => {
  inputRef.value?.blur();
};

defineExpose({
  focus,
  blur,
  inputRef,
});
</script>

<style scoped>
.apple-input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.apple-input-label {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color 0.15s ease-out;
  line-height: 1.2;
  min-height: 17px;
}

.apple-input-label-error {
  color: #FF3B30;
}

.apple-input-required {
  color: #FF3B30;
  margin-left: 2px;
}

.apple-input-container {
  position: relative;
}

.apple-input-wrapper-base {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(242, 242, 247, 0.8);
  border: 1px solid rgba(60, 60, 67, 0.16);
  border-radius: 12px;
  transition: all 0.15s ease-out;
  overflow: hidden;
}

/* Variants */
.apple-input-outlined {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.apple-input-filled {
  background: rgba(242, 242, 247, 0.8);
  border: 1px solid transparent;
}

.apple-input-underlined {
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(60, 60, 67, 0.16);
  border-radius: 0;
}

/* Sizes */
.apple-input-small {
  min-height: 36px;
}

.apple-input-medium {
  min-height: 44px;
}

.apple-input-large {
  min-height: 52px;
}

/* States */
.apple-input-focused {
  border-color: #007AFF;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-1px);
}

.apple-input-error {
  border-color: #FF3B30;
  background: rgba(255, 59, 48, 0.05);
}

.apple-input-error.apple-input-focused {
  box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.1);
}

.apple-input-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.apple-input-readonly {
  background: rgba(242, 242, 247, 0.5);
}

/* Input field */
.apple-input-field {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: transparent;
  outline: none;
  
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.4;
  color: var(--text-primary);
  
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.apple-input-field::placeholder {
  color: var(--text-tertiary);
}

.apple-input-field:disabled {
  cursor: not-allowed;
}

/* Small size */
.apple-input-small .apple-input-field {
  padding: 8px 12px;
  font-size: 14px;
}

/* Large size */
.apple-input-large .apple-input-field {
  padding: 16px 20px;
  font-size: 18px;
}

/* Icons */
.apple-input-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  transition: color 0.15s ease-out;
}

.apple-input-icon-prepend {
  padding-left: 12px;
}

.apple-input-icon-append {
  padding-right: 12px;
}

.apple-input-focused .apple-input-icon {
  color: #007AFF;
}

/* Password toggle */
.apple-input-password-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s ease-out;
}

.apple-input-password-toggle:hover {
  color: #007AFF;
  background: rgba(0, 122, 255, 0.1);
}

/* Clear button */
.apple-input-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  margin-right: 8px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.15s ease-out;
}

.apple-input-clear:hover {
  color: #007AFF;
  background: rgba(0, 122, 255, 0.1);
}

/* Helper text */
.apple-input-helper {
  min-height: 20px;
}

.apple-input-helper-text {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: var(--text-tertiary);
  transition: color 0.15s ease-out;
}

.apple-input-error-text {
  color: #FF3B30;
}

/* Темная тема */
[data-theme="dark"] .apple-input-wrapper-base {
  background: rgba(44, 44, 46, 0.8);
  border-color: rgba(84, 84, 136, 0.16);
}

[data-theme="dark"] .apple-input-outlined {
  background: rgba(28, 28, 30, 0.8);
}

[data-theme="dark"] .apple-input-filled {
  background: rgba(44, 44, 46, 0.8);
}

[data-theme="dark"] .apple-input-focused {
  background: rgba(28, 28, 30, 0.95);
  border-color: #4DA6FF;
  box-shadow: 0 0 0 3px rgba(77, 166, 255, 0.1);
}

/* Совместимость с браузерами */
@supports not (backdrop-filter: blur(20px)) {
  .apple-input-outlined {
    background: rgba(255, 255, 255, 0.95);
  }
  
  [data-theme="dark"] .apple-input-outlined {
    background: rgba(28, 28, 30, 0.95);
  }
}

/* Mobile optimizations */
@media (max-width: 480px) {
  .apple-input-field {
    font-size: 16px; /* Предотвращает zoom на iOS */
  }
  
  .apple-input-small .apple-input-field {
    font-size: 15px;
  }
}

/* Touch devices */
@media (hover: none) and (pointer: coarse) {
  .apple-input-wrapper-base:hover {
    transform: none;
  }
}
</style>
