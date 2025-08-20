<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600"
  >
    <AppleCard>
      <template #header>
        <div class="dialog-header">
          <v-icon icon="mdi-tools" class="mr-2" />
          Информация об оборудовании
        </div>
      </template>

      <div class="dialog-content">
        <p>Диалог просмотра информации об оборудовании находится в разработке...</p>
      </div>

      <template #actions>
        <div class="dialog-actions">
          <AppleButton
            variant="secondary"
            @click="$emit('update:modelValue', false)"
          >
            Закрыть
          </AppleButton>
        </div>
      </template>
    </AppleCard>
  </v-dialog>
</template>

<script setup lang="ts">
import AppleButton from "@/components/Apple/AppleButton.vue";
import AppleCard from "@/components/Apple/AppleCard.vue";
import type { EquipmentBase } from "@/types/installations";

interface Props {
  modelValue: boolean;
  equipment?: EquipmentBase | null;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  equipment: null,
});

const emit = defineEmits<Emits>();
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  font-weight: 600;
}

.dialog-content {
  padding: 24px 0;
  text-align: center;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
