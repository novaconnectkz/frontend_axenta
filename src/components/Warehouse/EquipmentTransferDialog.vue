<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500px"
    persistent
  >
    <v-card v-if="equipment">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-swap-horizontal" class="mr-2" />
        Перемещение оборудования
      </v-card-title>

      <v-form ref="formRef" @submit.prevent="handleSubmit">
        <v-card-text>
          <!-- Информация об оборудовании -->
          <v-card variant="outlined" class="mb-4">
            <v-card-text>
              <div class="d-flex align-center">
                <v-icon :icon="getTypeIcon(equipment.type)" class="mr-3" />
                <div>
                  <div class="text-subtitle-1 font-weight-bold">{{ equipment.model }}</div>
                  <div class="text-caption text-medium-emphasis">{{ equipment.brand }}</div>
                  <div class="text-caption">S/N: {{ equipment.serial_number }}</div>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Текущее местоположение -->
          <v-text-field
            :model-value="equipment.warehouse_location"
            label="Текущее местоположение"
            variant="outlined"
            density="comfortable"
            readonly
            prepend-inner-icon="mdi-map-marker"
          />

          <!-- Новое местоположение -->
          <v-select
            v-model="form.to_location"
            label="Новое местоположение"
            :items="locationOptions"
            variant="outlined"
            density="comfortable"
            :rules="[rules.required, rules.different]"
            prepend-inner-icon="mdi-map-marker-plus"
            required
          />

          <!-- Заметки -->
          <v-textarea
            v-model="form.notes"
            label="Причина перемещения"
            variant="outlined"
            density="comfortable"
            rows="3"
            placeholder="Укажите причину перемещения оборудования..."
          />

          <!-- Информация о пользователе -->
          <v-alert
            type="info"
            variant="tonal"
            density="compact"
          >
            <template #prepend>
              <v-icon icon="mdi-account" />
            </template>
            Операция будет выполнена от имени текущего пользователя
          </v-alert>
        </v-card-text>

        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn
            variant="outlined"
            @click="$emit('update:modelValue', false)"
          >
            Отмена
          </v-btn>
          <v-btn
            color="info"
            type="submit"
            :loading="loading"
            :disabled="!form.to_location || form.to_location === equipment.warehouse_location"
          >
            Переместить
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAuthStore } from '@/store/user';
import type { EquipmentBase, EquipmentTransferForm } from '@/types/warehouse';
import { EQUIPMENT_TYPE_OPTIONS, WAREHOUSE_LOCATION_OPTIONS } from '@/types/warehouse';

// Props
interface Props {
  modelValue: boolean;
  equipment: EquipmentBase | null;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  transferred: [data: EquipmentTransferForm];
}>();

// Store
const authStore = useAuthStore();

// Состояние
const loading = ref(false);
const formRef = ref();

// Форма
const form = ref<Omit<EquipmentTransferForm, 'equipment_id' | 'from_location' | 'user_id'>>({
  to_location: '',
  notes: '',
});

// Вычисляемые свойства
const locationOptions = computed(() => {
  // Исключаем текущее местоположение из списка
  return WAREHOUSE_LOCATION_OPTIONS.filter(
    location => location.value !== props.equipment?.warehouse_location
  );
});

// Правила валидации
const rules = {
  required: (value: any) => !!value || 'Поле обязательно для заполнения',
  different: (value: string) => {
    if (!value) return true;
    return value !== props.equipment?.warehouse_location || 'Выберите другое местоположение';
  },
};

// Методы
const getTypeIcon = (type: string) => {
  const typeOption = EQUIPMENT_TYPE_OPTIONS.find(opt => opt.value === type);
  return typeOption?.icon || 'mdi-package-variant';
};

const resetForm = () => {
  form.value = {
    to_location: '',
    notes: '',
  };
};

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid || !props.equipment) return;

  try {
    loading.value = true;
    
    const transferData: EquipmentTransferForm = {
      equipment_id: props.equipment.id,
      from_location: props.equipment.warehouse_location,
      to_location: form.value.to_location,
      user_id: authStore.user?.id || 1, // Используем ID текущего пользователя
      notes: form.value.notes,
    };

    emit('transferred', transferData);
  } catch (error: any) {
    console.error('Ошибка перемещения оборудования:', error);
  } finally {
    loading.value = false;
  }
};

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    resetForm();
  }
});
</script>

<style scoped>
:deep(.v-card-title) {
  background: rgba(var(--v-theme-info), 0.1);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
}
</style>
