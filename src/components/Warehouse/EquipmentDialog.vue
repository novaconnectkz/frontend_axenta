<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="800px"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-package-variant" class="mr-2" />
        {{ isEdit ? 'Редактирование оборудования' : 'Добавление оборудования' }}
      </v-card-title>

      <v-form ref="formRef" @submit.prevent="handleSubmit">
        <v-card-text>
          <v-row>
            <!-- Основная информация -->
            <v-col cols="12">
              <v-card variant="outlined">
                <v-card-title class="text-subtitle-1">
                  <v-icon icon="mdi-information" class="mr-2" />
                  Основная информация
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="form.type"
                        label="Тип оборудования"
                        :items="typeOptions"
                        variant="outlined"
                        density="comfortable"
                        :rules="[rules.required]"
                        required
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="form.category_id"
                        label="Категория"
                        :items="categoryOptions"
                        variant="outlined"
                        density="comfortable"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.brand"
                        label="Производитель"
                        variant="outlined"
                        density="comfortable"
                        :rules="[rules.required]"
                        required
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.model"
                        label="Модель"
                        variant="outlined"
                        density="comfortable"
                        :rules="[rules.required]"
                        required
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Идентификаторы -->
            <v-col cols="12">
              <v-card variant="outlined">
                <v-card-title class="text-subtitle-1">
                  <v-icon icon="mdi-identifier" class="mr-2" />
                  Идентификаторы
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.serial_number"
                        label="Серийный номер"
                        variant="outlined"
                        density="comfortable"
                        :rules="[rules.required]"
                        required
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.qr_code"
                        label="QR код"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-qrcode"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.imei"
                        label="IMEI"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-cellphone"
                        :rules="form.imei ? [rules.imei] : []"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.phone_number"
                        label="Номер телефона"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-phone"
                        :rules="form.phone_number ? [rules.phone] : []"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.mac_address"
                        label="MAC адрес"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-network"
                        :rules="form.mac_address ? [rules.mac] : []"
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Статус и местоположение -->
            <v-col cols="12">
              <v-card variant="outlined">
                <v-card-title class="text-subtitle-1">
                  <v-icon icon="mdi-state-machine" class="mr-2" />
                  Статус и местоположение
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="4">
                      <v-select
                        v-model="form.status"
                        label="Статус"
                        :items="statusOptions"
                        variant="outlined"
                        density="comfortable"
                      />
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-select
                        v-model="form.condition"
                        label="Состояние"
                        :items="conditionOptions"
                        variant="outlined"
                        density="comfortable"
                      />
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-select
                        v-model="form.warehouse_location"
                        label="Местоположение на складе"
                        :items="locationOptions"
                        variant="outlined"
                        density="comfortable"
                        :rules="[rules.required]"
                        required
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Финансовая информация -->
            <v-col cols="12">
              <v-card variant="outlined">
                <v-card-title class="text-subtitle-1">
                  <v-icon icon="mdi-currency-rub" class="mr-2" />
                  Финансовая информация
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="form.purchase_price"
                        label="Закупочная цена"
                        variant="outlined"
                        density="comfortable"
                        type="number"
                        min="0"
                        step="0.01"
                        suffix="₽"
                        :rules="[rules.required, rules.price]"
                        required
                      />
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="form.purchase_date"
                        label="Дата закупки"
                        variant="outlined"
                        density="comfortable"
                        type="date"
                      />
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="form.warranty_until"
                        label="Гарантия до"
                        variant="outlined"
                        density="comfortable"
                        type="date"
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Дополнительная информация -->
            <v-col cols="12">
              <v-card variant="outlined">
                <v-card-title class="text-subtitle-1">
                  <v-icon icon="mdi-text-box" class="mr-2" />
                  Дополнительная информация
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12">
                      <v-textarea
                        v-model="form.specifications"
                        label="Технические характеристики (JSON)"
                        variant="outlined"
                        density="comfortable"
                        rows="3"
                        placeholder='{"voltage": "12V", "power": "5W"}'
                        :rules="form.specifications ? [rules.json] : []"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-textarea
                        v-model="form.notes"
                        label="Заметки"
                        variant="outlined"
                        density="comfortable"
                        rows="3"
                        placeholder="Дополнительная информация об оборудовании..."
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
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
            {{ isEdit ? 'Сохранить' : 'Создать' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { warehouseService } from '@/services/warehouseService';
import type { EquipmentBase, EquipmentCategory, EquipmentForm } from '@/types/warehouse';
import {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_CONDITION_LABELS,
  EQUIPMENT_TYPE_OPTIONS,
  WAREHOUSE_LOCATION_OPTIONS,
} from '@/types/warehouse';

// Props
interface Props {
  modelValue: boolean;
  equipment?: EquipmentBase | null;
  categories: EquipmentCategory[];
}

const props = withDefaults(defineProps<Props>(), {
  equipment: null,
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  created: [];
  updated: [];
}>();

// Состояние
const loading = ref(false);
const formRef = ref();

// Форма
const form = ref<EquipmentForm>({
  type: '',
  model: '',
  brand: '',
  serial_number: '',
  imei: '',
  phone_number: '',
  mac_address: '',
  qr_code: '',
  status: 'in_stock',
  condition: 'new',
  category_id: undefined,
  warehouse_location: '',
  purchase_price: '',
  purchase_date: '',
  warranty_until: '',
  specifications: '',
  notes: '',
});

// Вычисляемые свойства
const isEdit = computed(() => !!props.equipment);

const typeOptions = computed(() => EQUIPMENT_TYPE_OPTIONS);

const statusOptions = computed(() => 
  Object.entries(EQUIPMENT_STATUS_LABELS).map(([value, title]) => ({
    value,
    title,
  }))
);

const conditionOptions = computed(() => 
  Object.entries(EQUIPMENT_CONDITION_LABELS).map(([value, title]) => ({
    value,
    title,
  }))
);

const categoryOptions = computed(() => 
  props.categories.map(cat => ({
    value: cat.id,
    title: cat.name,
  }))
);

const locationOptions = computed(() => WAREHOUSE_LOCATION_OPTIONS);

// Правила валидации
const rules = {
  required: (value: any) => !!value || 'Поле обязательно для заполнения',
  price: (value: string) => {
    if (!value) return true;
    const num = parseFloat(value);
    return (num >= 0) || 'Цена должна быть положительным числом';
  },
  imei: (value: string) => {
    if (!value) return true;
    return /^\d{15}$/.test(value) || 'IMEI должен содержать 15 цифр';
  },
  phone: (value: string) => {
    if (!value) return true;
    return /^\+7\d{10}$/.test(value) || 'Номер телефона должен быть в формате +7XXXXXXXXXX';
  },
  mac: (value: string) => {
    if (!value) return true;
    return /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(value) || 'MAC адрес должен быть в формате XX:XX:XX:XX:XX:XX';
  },
  json: (value: string) => {
    if (!value) return true;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return 'Некорректный JSON формат';
    }
  },
};

// Методы
const resetForm = () => {
  form.value = {
    type: '',
    model: '',
    brand: '',
    serial_number: '',
    imei: '',
    phone_number: '',
    mac_address: '',
    qr_code: '',
    status: 'in_stock',
    condition: 'new',
    category_id: undefined,
    warehouse_location: '',
    purchase_price: '',
    purchase_date: '',
    warranty_until: '',
    specifications: '',
    notes: '',
  };
};

const fillForm = (equipment: EquipmentBase) => {
  form.value = {
    type: equipment.type,
    model: equipment.model,
    brand: equipment.brand,
    serial_number: equipment.serial_number,
    imei: equipment.imei,
    phone_number: equipment.phone_number,
    mac_address: equipment.mac_address,
    qr_code: equipment.qr_code,
    status: equipment.status,
    condition: equipment.condition,
    category_id: equipment.category_id,
    warehouse_location: equipment.warehouse_location,
    purchase_price: equipment.purchase_price,
    purchase_date: equipment.purchase_date ? equipment.purchase_date.split('T')[0] : '',
    warranty_until: equipment.warranty_until ? equipment.warranty_until.split('T')[0] : '',
    specifications: equipment.specifications,
    notes: equipment.notes,
  };
};

const generateQRCode = () => {
  if (form.value.serial_number) {
    form.value.qr_code = `EQ-${Date.now()}-${form.value.serial_number}`;
  }
};

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  try {
    loading.value = true;

    // Автогенерация QR кода если не указан
    if (!form.value.qr_code) {
      generateQRCode();
    }

    // Преобразование дат
    const submitData = { ...form.value };
    if (submitData.purchase_date) {
      submitData.purchase_date = new Date(submitData.purchase_date).toISOString();
    }
    if (submitData.warranty_until) {
      submitData.warranty_until = new Date(submitData.warranty_until).toISOString();
    }

    if (isEdit.value && props.equipment) {
      await warehouseService.updateEquipment(props.equipment.id, submitData);
      emit('updated');
    } else {
      await warehouseService.createEquipment(submitData);
      emit('created');
    }
  } catch (error: any) {
    console.error('Ошибка сохранения оборудования:', error);
    // TODO: Показать уведомление об ошибке
  } finally {
    loading.value = false;
  }
};

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    if (props.equipment) {
      fillForm(props.equipment);
    } else {
      resetForm();
    }
  }
});

watch(() => form.value.serial_number, () => {
  if (!isEdit.value && form.value.serial_number && !form.value.qr_code) {
    generateQRCode();
  }
});
</script>

<style scoped>
/* Стили для диалога */
:deep(.v-card-title) {
  background: rgba(var(--v-theme-primary), 0.1);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
}

:deep(.v-card-text) {
  max-height: 70vh;
  overflow-y: auto;
}

/* Стили для форм */
.v-card.v-card--variant-outlined {
  border: 1px solid rgba(var(--v-theme-outline-variant), 0.5);
}

.v-card.v-card--variant-outlined .v-card-title {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  padding: 12px 16px;
  border-bottom: 1px solid rgba(var(--v-theme-outline-variant), 0.3);
}

.v-card.v-card--variant-outlined .v-card-text {
  padding: 16px;
}
</style>
