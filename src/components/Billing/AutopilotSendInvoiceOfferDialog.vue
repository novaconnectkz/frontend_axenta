<template>
  <v-dialog v-model="show" max-width="600px" persistent>
    <v-card>
      <v-card-title class="d-flex align-center bg-primary text-white">
        <v-icon class="mr-2" color="white">mdi-robot</v-icon>
        <span>Автопилот: Завершающий шаг</span>
        <v-spacer />
        <v-btn icon variant="text" @click="handleLater">
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pt-6 pb-4">
        <div class="text-center mb-4">
          <v-icon size="64" color="success">mdi-check-circle</v-icon>
          <h2 class="mt-3 text-h5">Счет успешно создан!</h2>
        </div>

        <v-alert type="info" variant="tonal" class="mb-4">
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-information</v-icon>
            <div>
              <strong>Счет {{ invoiceNumber }} создан</strong><br />
              Последний шаг: отправить счет клиенту.
            </div>
          </div>
        </v-alert>

        <div class="text-body-1 mb-4">
          <p>
            Сейчас вы можете отправить счет клиенту через:
          </p>
          <ul class="pl-6">
            <li><v-icon size="small" class="mr-1">mdi-email</v-icon> Email</li>
            <li><v-icon size="small" class="mr-1">mdi-telegram</v-icon> Telegram</li>
            <li><v-icon size="small" class="mr-1">mdi-message-text</v-icon> MAX Messenger</li>
          </ul>
          <p class="mt-3">
            Вы также можете скачать PDF-версию счета для отправки другим способом.
          </p>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn variant="outlined" @click="handleLater">
          Отправить позже
        </v-btn>
        <v-spacer />
        <v-btn color="primary" variant="flat" @click="handleSendInvoice">
          <v-icon class="mr-1">mdi-send</v-icon>
          Отправить счет
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  invoiceId?: number;
  invoiceNumber?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'send-invoice', invoiceId: number): void;
  (e: 'later'): void;
}>();

const show = computed({
  get: () => {
    // Показываем диалог только если есть invoiceId
    if (props.modelValue && !props.invoiceId) {
      return false;
    }
    return props.modelValue;
  },
  set: (value) => emit('update:modelValue', value),
});

// Следим за попытками открыть диалог без данных
watch(() => props.modelValue, (newValue) => {
  if (newValue && !props.invoiceId) {
    emit('update:modelValue', false);
  }
});

const handleSendInvoice = () => {
  if (props.invoiceId) {
    emit('send-invoice', props.invoiceId);
  }
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

