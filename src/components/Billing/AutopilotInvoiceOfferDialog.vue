<template>
  <v-dialog v-model="show" max-width="600px" persistent>
    <v-card>
      <v-card-title class="d-flex align-center bg-primary text-white">
        <v-icon class="mr-2" color="white">mdi-robot</v-icon>
        <span>Автопилот: Следующий шаг</span>
        <v-spacer />
        <v-btn icon variant="text" @click="handleLater">
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pt-6 pb-4">
        <div class="text-center mb-4">
          <v-icon size="64" color="success">mdi-check-circle</v-icon>
          <h2 class="mt-3 text-h5">Подписка успешно создана!</h2>
        </div>

        <v-alert type="info" variant="tonal" class="mb-4">
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-information</v-icon>
            <div>
              <strong>Подписка создана</strong><br />
              Следующий шаг: создать счет на оплату для этой подписки.
            </div>
          </div>
        </v-alert>

        <div class="text-body-1 mb-4">
          <p>
            Сейчас вы можете создать счет для этой подписки.
            Счет будет содержать:
          </p>
          <ul class="pl-6">
            <li>Расчет стоимости на основе подписки</li>
            <li>Детализацию по объектам</li>
            <li>НДС (если применимо)</li>
            <li>Реквизиты для оплаты</li>
          </ul>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn variant="outlined" @click="handleLater">
          Создать позже
        </v-btn>
        <v-spacer />
        <v-btn color="primary" variant="flat" @click="handleCreateInvoice">
          <v-icon class="mr-1">mdi-file-document</v-icon>
          Создать счет
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  subscriptionId?: number;
  contractId?: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'create-invoice', data: { subscriptionId?: number; contractId?: number }): void;
  (e: 'later'): void;
}>();

const show = computed({
  get: () => {
    // Показываем диалог только если есть contractId или subscriptionId
    if (props.modelValue && !props.contractId && !props.subscriptionId) {
      return false;
    }
    return props.modelValue;
  },
  set: (value) => emit('update:modelValue', value),
});

// Следим за попытками открыть диалог без данных
watch(() => props.modelValue, (newValue) => {
  if (newValue && !props.contractId && !props.subscriptionId) {
    emit('update:modelValue', false);
  }
});

const handleCreateInvoice = () => {
  emit('create-invoice', {
    subscriptionId: props.subscriptionId,
    contractId: props.contractId,
  });
  show.value = false;
};

const handleLater = () => {
  emit('later');
  show.value = false;
};
</script>

<style scoped>
.bg-primary {
  background-color: rgb(var(--v-theme-primary)) !important;
}
</style>

