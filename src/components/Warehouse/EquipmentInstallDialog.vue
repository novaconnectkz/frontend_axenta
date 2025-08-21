<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500px"
    persistent
  >
    <v-card v-if="equipment">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-arrow-right" class="mr-2" />
        Установка оборудования
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

          <!-- Выбор объекта -->
          <v-select
            v-model="form.object_id"
            label="Объект для установки"
            :items="objectOptions"
            variant="outlined"
            density="comfortable"
            :rules="[rules.required]"
            :loading="objectsLoading"
            prepend-inner-icon="mdi-home-city"
            required
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon icon="mdi-home-city" />
                </template>
                <v-list-item-title>{{ item.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ item.subtitle }}</v-list-item-subtitle>
              </v-list-item>
            </template>
          </v-select>

          <!-- Дополнительная информация -->
          <v-textarea
            v-model="installNotes"
            label="Заметки об установке"
            variant="outlined"
            density="comfortable"
            rows="3"
            placeholder="Дополнительная информация об установке..."
          />

          <!-- Предупреждения -->
          <v-alert
            v-if="equipment.condition === 'damaged'"
            type="warning"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            <template #prepend>
              <v-icon icon="mdi-alert" />
            </template>
            Внимание! Оборудование имеет повреждения
          </v-alert>

          <v-alert
            v-if="isWarrantyExpired"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            <template #prepend>
              <v-icon icon="mdi-information" />
            </template>
            Гарантия на оборудование истекла
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
            color="success"
            type="submit"
            :loading="loading"
            :disabled="!form.object_id"
          >
            Установить
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
// import { objectsService } from '@/services/objectsService';
import type { EquipmentBase, EquipmentInstallForm } from '@/types/warehouse';
import { EQUIPMENT_TYPE_OPTIONS } from '@/types/warehouse';

// Props
interface Props {
  modelValue: boolean;
  equipment: EquipmentBase | null;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  installed: [data: EquipmentInstallForm];
}>();

// Состояние
const loading = ref(false);
const objectsLoading = ref(false);
const formRef = ref();
const installNotes = ref('');

// Форма
const form = ref<EquipmentInstallForm>({
  object_id: 0,
});

// Данные
const objects = ref<any[]>([]);

// Вычисляемые свойства
const isWarrantyExpired = computed(() => {
  if (!props.equipment?.warranty_until) return false;
  return new Date(props.equipment.warranty_until) < new Date();
});

const objectOptions = computed(() => 
  objects.value.map(obj => ({
    value: obj.id,
    title: obj.name,
    subtitle: `${obj.type} • ${obj.location || 'Без локации'}`,
  }))
);

// Правила валидации
const rules = {
  required: (value: any) => !!value || 'Поле обязательно для заполнения',
};

// Методы
const getTypeIcon = (type: string) => {
  const typeOption = EQUIPMENT_TYPE_OPTIONS.find(opt => opt.value === type);
  return typeOption?.icon || 'mdi-package-variant';
};

const loadObjects = async () => {
  try {
    objectsLoading.value = true;
    // Mock данные объектов для демо
    objects.value = [
      { id: 1, name: 'ТЦ Галерея', type: 'Торговый центр', location: 'Москва' },
      { id: 2, name: 'Офис Центр', type: 'Офисное здание', location: 'СПб' },
      { id: 3, name: 'Склад №3', type: 'Складское помещение', location: 'Екатеринбург' },
      { id: 4, name: 'Производство А1', type: 'Производственное здание', location: 'Нижний Новгород' },
    ];
  } catch (error: any) {
    console.error('Ошибка загрузки объектов:', error);
    objects.value = [];
  } finally {
    objectsLoading.value = false;
  }
};

const resetForm = () => {
  form.value = {
    object_id: 0,
  };
  installNotes.value = '';
};

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  try {
    loading.value = true;
    emit('installed', form.value);
  } catch (error: any) {
    console.error('Ошибка установки оборудования:', error);
  } finally {
    loading.value = false;
  }
};

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    resetForm();
    loadObjects();
  }
});

// Инициализация
onMounted(() => {
  if (props.modelValue) {
    loadObjects();
  }
});
</script>

<style scoped>
:deep(.v-card-title) {
  background: rgba(var(--v-theme-success), 0.1);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
}

:deep(.v-card-text) {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
