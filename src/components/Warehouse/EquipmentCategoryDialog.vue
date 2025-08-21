<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500px"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-tag" class="mr-2" />
        {{ isEdit ? 'Редактирование категории' : 'Создание категории' }}
      </v-card-title>

      <v-form ref="formRef" @submit.prevent="handleSubmit">
        <v-card-text>
          <v-row>
            <v-col cols="12" md="8">
              <v-text-field
                v-model="form.name"
                label="Название категории"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                required
                prepend-inner-icon="mdi-tag"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="form.code"
                label="Код"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required, rules.code]"
                required
                prepend-inner-icon="mdi-identifier"
                @input="formatCode"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="form.description"
                label="Описание"
                variant="outlined"
                density="comfortable"
                rows="3"
                prepend-inner-icon="mdi-text"
                placeholder="Описание категории оборудования..."
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="form.min_stock_level"
                label="Минимальный остаток"
                type="number"
                min="0"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required, rules.positive]"
                required
                prepend-inner-icon="mdi-package-down"
                suffix="шт."
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-switch
                v-model="form.is_active"
                label="Активная категория"
                color="success"
                density="comfortable"
                inset
              />
            </v-col>
          </v-row>

          <!-- Предварительный просмотр -->
          <v-card variant="outlined" class="mt-4">
            <v-card-title class="text-subtitle-2">
              Предварительный просмотр
            </v-card-title>
            <v-card-text>
              <div class="preview-category">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center">
                    <v-icon icon="mdi-tag" class="mr-2" />
                    <div>
                      <div class="text-subtitle-2 font-weight-bold">
                        {{ form.name || 'Название категории' }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ form.code || 'КОД' }}
                      </div>
                    </div>
                  </div>
                  <v-chip
                    :color="form.is_active ? 'success' : 'grey'"
                    size="small"
                    variant="tonal"
                  >
                    {{ form.is_active ? 'Активна' : 'Неактивна' }}
                  </v-chip>
                </div>
                <div v-if="form.description" class="text-body-2 text-medium-emphasis">
                  {{ form.description }}
                </div>
                <div class="text-caption mt-2">
                  Минимальный остаток: {{ form.min_stock_level }} шт.
                </div>
              </div>
            </v-card-text>
          </v-card>
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
import type { EquipmentCategory } from '@/types/warehouse';

// Props
interface Props {
  modelValue: boolean;
  category?: EquipmentCategory | null;
}

const props = withDefaults(defineProps<Props>(), {
  category: null,
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
const form = ref<Omit<EquipmentCategory, 'id' | 'created_at' | 'updated_at'>>({
  name: '',
  description: '',
  code: '',
  min_stock_level: 10,
  is_active: true,
});

// Вычисляемые свойства
const isEdit = computed(() => !!props.category);

// Правила валидации
const rules = {
  required: (value: any) => !!value || 'Поле обязательно для заполнения',
  positive: (value: number) => value >= 0 || 'Значение должно быть неотрицательным',
  code: (value: string) => {
    if (!value) return 'Поле обязательно для заполнения';
    if (!/^[A-Z0-9_]{2,10}$/.test(value)) {
      return 'Код должен содержать только заглавные буквы, цифры и подчеркивания (2-10 символов)';
    }
    return true;
  },
};

// Методы
const formatCode = () => {
  // Автоматическое форматирование кода
  form.value.code = form.value.code.toUpperCase().replace(/[^A-Z0-9_]/g, '');
};

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    code: '',
    min_stock_level: 10,
    is_active: true,
  };
};

const fillForm = (category: EquipmentCategory) => {
  form.value = {
    name: category.name,
    description: category.description,
    code: category.code,
    min_stock_level: category.min_stock_level,
    is_active: category.is_active,
  };
};

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  try {
    loading.value = true;

    if (isEdit.value && props.category) {
      await warehouseService.updateEquipmentCategory(props.category.id, form.value);
      emit('updated');
    } else {
      await warehouseService.createEquipmentCategory(form.value);
      emit('created');
    }
  } catch (error: any) {
    console.error('Ошибка сохранения категории:', error);
    // TODO: Показать уведомление об ошибке
  } finally {
    loading.value = false;
  }
};

// Автогенерация кода из названия
watch(() => form.value.name, (newName) => {
  if (!isEdit.value && newName && !form.value.code) {
    // Генерируем код из названия
    const code = newName
      .toUpperCase()
      .replace(/[^А-ЯA-Z0-9]/g, '')
      .substring(0, 6);
    form.value.code = code;
  }
});

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    if (props.category) {
      fillForm(props.category);
    } else {
      resetForm();
    }
  }
});
</script>

<style scoped>
:deep(.v-card-title) {
  background: rgba(var(--v-theme-primary), 0.1);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
}

.preview-category {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
  padding: 16px;
}
</style>
