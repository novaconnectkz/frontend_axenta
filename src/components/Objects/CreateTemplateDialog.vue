<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="600">
    <AppleCard>
      <template #header>
        <v-icon icon="mdi-file-document-plus" class="mr-2" color="primary" />
        Создание шаблона на основе объекта
      </template>

      <div class="dialog-content">
        <p class="mb-4">
          Создание шаблона на основе объекта <strong>{{ object?.name }}</strong>
        </p>

        <div class="form-grid">
          <AppleInput :model-value="form.name"
            @update:model-value="updateField('name', $event)"
            label="Название шаблона" required :error-message="errors.name"
            placeholder="Введите название шаблона" />

          <AppleInput :model-value="form.category"
            @update:model-value="updateField('category', $event)"
            label="Категория" required :error-message="errors.category"
            placeholder="Например: Транспорт, Оборудование" />

          <AppleInput :model-value="form.description"
            @update:model-value="updateField('description', $event)"
            label="Описание" type="textarea" :error-message="errors.description"
            placeholder="Описание шаблона (необязательно)" rows="3" />

          <div class="form-row">
            <AppleInput :model-value="form.icon"
              @update:model-value="updateField('icon', $event)"
              label="Иконка" placeholder="mdi-office-building" :error-message="errors.icon" />

            <AppleInput :model-value="form.color"
              @update:model-value="updateField('color', $event)"
              label="Цвет" type="color" :error-message="errors.color" />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-actions">
          <AppleButton variant="secondary" @click="$emit('close')">Отмена</AppleButton>
          <AppleButton @click="$emit('confirm')" :loading="loading">Создать шаблон</AppleButton>
        </div>
      </template>
    </AppleCard>
  </v-dialog>
</template>

<script setup lang="ts">
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import AppleInput from '@/components/Apple/AppleInput.vue';
import type { ObjectWithRelations } from '@/types/objects';

interface CreateTemplateForm {
  name: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  [key: string]: any;
}

const props = defineProps<{
  modelValue: boolean;
  object: ObjectWithRelations | null;
  form: CreateTemplateForm;
  errors: Record<string, string>;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'update:form', form: CreateTemplateForm): void;
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();

const updateField = (key: string, value: any) => {
  emit('update:form', { ...props.form, [key]: value });
};
</script>

<style scoped>
.dialog-content {
  padding: 24px;
}

.form-grid {
  display: grid;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
}
</style>
