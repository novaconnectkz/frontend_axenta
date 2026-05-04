<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="500">
    <AppleCard>
      <template #header>
        <v-icon icon="mdi-clock-alert" class="mr-2" color="warning" />
        Плановое удаление объекта
      </template>

      <div class="dialog-content">
        <p class="mb-4">
          Объект <strong>{{ object?.name }}</strong>
          будет автоматически удален в указанную дату.
        </p>

        <AppleInput :model-value="form.scheduled_delete_at"
          @update:model-value="$emit('update:form', { ...form, scheduled_delete_at: $event })"
          label="Дата удаления" type="date" required :min="minDate"
          :error-message="errors.scheduled_delete_at" />
      </div>

      <template #footer>
        <div class="dialog-actions">
          <AppleButton variant="secondary" @click="$emit('close')">Отмена</AppleButton>
          <AppleButton variant="danger" @click="$emit('confirm')" :loading="loading">
            Запланировать
          </AppleButton>
        </div>
      </template>
    </AppleCard>
  </v-dialog>
</template>

<script setup lang="ts">
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import AppleInput from '@/components/Apple/AppleInput.vue';
import type { ObjectWithRelations, ScheduleDeleteForm } from '@/types/objects';

defineProps<{
  modelValue: boolean;
  object: ObjectWithRelations | null;
  form: ScheduleDeleteForm;
  errors: Record<string, string>;
  minDate: string;
  loading: boolean;
}>();

defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'update:form', form: ScheduleDeleteForm): void;
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();
</script>

<style scoped>
.dialog-content {
  padding: 24px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
}
</style>
