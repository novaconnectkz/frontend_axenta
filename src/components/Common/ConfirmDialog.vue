<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="400px"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon :icon="icon" :color="confirmColor" class="mr-2" />
        {{ title }}
      </v-card-title>

      <v-card-text>
        <div class="text-body-1">{{ text }}</div>
        
        <v-alert
          v-if="confirmColor === 'error'"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          <template #prepend>
            <v-icon icon="mdi-alert" />
          </template>
          Это действие нельзя будет отменить
        </v-alert>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn
          variant="outlined"
          @click="$emit('update:modelValue', false)"
        >
          {{ cancelText }}
        </v-btn>
        <v-btn
          :color="confirmColor"
          @click="handleConfirm"
          :loading="loading"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Props
interface Props {
  modelValue: boolean;
  title: string;
  text: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Подтвердить',
  cancelText: 'Отмена',
  confirmColor: 'primary',
  loading: false,
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
}>();

// Вычисляемые свойства
const icon = computed(() => {
  const iconMap: Record<string, string> = {
    error: 'mdi-delete',
    warning: 'mdi-alert',
    success: 'mdi-check',
    info: 'mdi-information',
    primary: 'mdi-help-circle',
  };
  return iconMap[props.confirmColor] || 'mdi-help-circle';
});

// Методы
const handleConfirm = () => {
  emit('confirm');
};
</script>

<style scoped>
:deep(.v-card-title) {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
}
</style>
