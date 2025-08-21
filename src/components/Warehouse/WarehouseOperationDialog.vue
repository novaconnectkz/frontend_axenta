<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600px"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-plus" class="mr-2" />
        Создание складской операции
      </v-card-title>

      <v-form ref="formRef" @submit.prevent="handleSubmit">
        <v-card-text>
          <v-row>
            <!-- Тип операции -->
            <v-col cols="12">
              <v-select
                v-model="form.type"
                label="Тип операции"
                :items="typeOptions"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                required
                @update:model-value="updateFormFields"
              />
            </v-col>

            <!-- Оборудование -->
            <v-col cols="12">
              <v-select
                v-model="form.equipment_id"
                label="Оборудование"
                :items="equipmentOptions"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                :loading="equipmentLoading"
                prepend-inner-icon="mdi-package-variant"
                required
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-icon :icon="getEquipmentTypeIcon(item.raw.type)" />
                    </template>
                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.subtitle }}</v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>

            <!-- Описание -->
            <v-col cols="12">
              <v-text-field
                v-model="form.description"
                label="Описание операции"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                required
              />
            </v-col>

            <!-- Местоположения -->
            <v-col v-if="showFromLocation" cols="12" md="6">
              <v-select
                v-model="form.from_location"
                label="Откуда"
                :items="locationOptions"
                variant="outlined"
                density="comfortable"
                :rules="showFromLocation ? [rules.required] : []"
                prepend-inner-icon="mdi-map-marker-minus"
              />
            </v-col>
            <v-col :cols="showFromLocation ? 12 : 12" :md="showFromLocation ? 6 : 12">
              <v-select
                v-model="form.to_location"
                label="Куда"
                :items="getToLocationOptions"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-map-marker-plus"
                required
              />
            </v-col>

            <!-- Количество -->
            <v-col v-if="showQuantity" cols="12" md="6">
              <v-text-field
                v-model.number="form.quantity"
                label="Количество"
                type="number"
                min="1"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required, rules.positive]"
                prepend-inner-icon="mdi-counter"
                required
              />
            </v-col>

            <!-- Номер документа -->
            <v-col cols="12" :md="showQuantity ? 6 : 12">
              <v-text-field
                v-model="form.document_number"
                label="Номер документа"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-file-document"
                :placeholder="generateDocumentNumber()"
              />
            </v-col>

            <!-- Заметки -->
            <v-col cols="12">
              <v-textarea
                v-model="form.notes"
                label="Заметки"
                variant="outlined"
                density="comfortable"
                rows="3"
                placeholder="Дополнительная информация об операции..."
              />
            </v-col>
          </v-row>
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
            color="primary"
            type="submit"
            :loading="loading"
          >
            Создать операцию
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useAuthStore } from '@/store/user';
import { warehouseService } from '@/services/warehouseService';
import type { EquipmentBase, WarehouseOperationForm, WarehouseOperationType } from '@/types/warehouse';
import {
  WAREHOUSE_OPERATION_TYPE_LABELS,
  WAREHOUSE_LOCATION_OPTIONS,
  EQUIPMENT_TYPE_OPTIONS,
} from '@/types/warehouse';

// Props
interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  created: [];
}>();

// Store
const authStore = useAuthStore();

// Состояние
const loading = ref(false);
const equipmentLoading = ref(false);
const formRef = ref();

// Данные
const equipment = ref<EquipmentBase[]>([]);

// Форма
const form = ref<WarehouseOperationForm>({
  type: 'receive',
  description: '',
  equipment_id: 0,
  quantity: 1,
  from_location: '',
  to_location: '',
  user_id: 0,
  document_number: '',
  notes: '',
});

// Опции для селектов
const typeOptions = computed(() => 
  Object.entries(WAREHOUSE_OPERATION_TYPE_LABELS).map(([value, title]) => ({
    value,
    title,
  }))
);

const equipmentOptions = computed(() => 
  equipment.value.map(eq => ({
    value: eq.id,
    title: `${eq.model} ${eq.brand}`,
    subtitle: `S/N: ${eq.serial_number} • ${eq.warehouse_location || 'Без локации'}`,
    raw: eq,
  }))
);

const locationOptions = computed(() => [
  { value: 'Поставщик', title: 'Поставщик' },
  { value: 'Клиент', title: 'Клиент' },
  { value: 'Мастерская', title: 'Мастерская' },
  { value: 'Списание', title: 'Списание' },
  ...WAREHOUSE_LOCATION_OPTIONS,
]);

// Условная логика для полей формы
const showFromLocation = computed(() => 
  ['transfer', 'issue', 'maintenance', 'disposal'].includes(form.value.type)
);

const showQuantity = computed(() => 
  ['receive', 'inventory'].includes(form.value.type)
);

const getToLocationOptions = computed(() => {
  if (form.value.type === 'receive') {
    return WAREHOUSE_LOCATION_OPTIONS;
  }
  if (form.value.type === 'issue') {
    return [
      { value: 'Объект', title: 'Объект' },
      { value: 'Клиент', title: 'Клиент' },
      { value: 'Монтажник', title: 'Монтажник' },
    ];
  }
  if (form.value.type === 'maintenance') {
    return [
      { value: 'Мастерская', title: 'Мастерская' },
      { value: 'Сервисный центр', title: 'Сервисный центр' },
    ];
  }
  if (form.value.type === 'disposal') {
    return [
      { value: 'Списание', title: 'Списание' },
      { value: 'Утилизация', title: 'Утилизация' },
    ];
  }
  return locationOptions.value;
});

// Правила валидации
const rules = {
  required: (value: any) => !!value || 'Поле обязательно для заполнения',
  positive: (value: number) => value > 0 || 'Значение должно быть больше 0',
};

// Методы
const getEquipmentTypeIcon = (type: string) => {
  const typeOption = EQUIPMENT_TYPE_OPTIONS.find(opt => opt.value === type);
  return typeOption?.icon || 'mdi-package-variant';
};

const generateDocumentNumber = () => {
  const prefix = form.value.type.toUpperCase().substring(0, 3);
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${date}-${random}`;
};

const updateFormFields = () => {
  // Обновляем описание в зависимости от типа операции
  const descriptions: Record<string, string> = {
    receive: 'Поступление оборудования на склад',
    issue: 'Выдача оборудования со склада',
    transfer: 'Перемещение оборудования между локациями',
    inventory: 'Инвентаризация оборудования',
    maintenance: 'Отправка оборудования на обслуживание',
    disposal: 'Списание оборудования',
  };
  
  form.value.description = descriptions[form.value.type] || '';
  
  // Сбрасываем локации при смене типа
  form.value.from_location = '';
  form.value.to_location = '';
  
  // Автогенерация номера документа
  if (!form.value.document_number) {
    form.value.document_number = generateDocumentNumber();
  }
};

const loadEquipment = async () => {
  try {
    equipmentLoading.value = true;
    const response = await warehouseService.getEquipment({ limit: 100 });
    equipment.value = response.data;
  } catch (error: any) {
    console.error('Ошибка загрузки оборудования:', error);
    equipment.value = [];
  } finally {
    equipmentLoading.value = false;
  }
};

const resetForm = () => {
  form.value = {
    type: 'receive',
    description: '',
    equipment_id: 0,
    quantity: 1,
    from_location: '',
    to_location: '',
    user_id: authStore.user?.id || 1,
    document_number: '',
    notes: '',
  };
  updateFormFields();
};

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  try {
    loading.value = true;
    
    // Автогенерация номера документа если не указан
    if (!form.value.document_number) {
      form.value.document_number = generateDocumentNumber();
    }

    emit('created');
  } catch (error: any) {
    console.error('Ошибка создания операции:', error);
  } finally {
    loading.value = false;
  }
};

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    resetForm();
    loadEquipment();
  }
});

// Инициализация
onMounted(() => {
  if (props.modelValue) {
    loadEquipment();
  }
});
</script>

<style scoped>
:deep(.v-card-title) {
  background: rgba(var(--v-theme-primary), 0.1);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
}

:deep(.v-card-text) {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
