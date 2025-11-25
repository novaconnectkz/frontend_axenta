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
          <h2 class="mt-3 text-h5">Договор успешно создан!</h2>
        </div>

        <v-alert type="info" variant="tonal" class="mb-4">
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-information</v-icon>
            <div>
              <strong>Договор {{ contractNumber }}</strong> создан.<br />
              Следующий шаг: создать подписку к этому договору.
            </div>
          </div>
        </v-alert>

        <div class="text-body-1 mb-4">
          <p>
            Сейчас вы можете создать подписку с помощью "Мастера создания подписки".
            Подписка позволит:
          </p>
          <ul class="pl-6">
            <li>Привязать тарифный план к договору</li>
            <li>Добавить объекты мониторинга</li>
            <li>Настроить период действия</li>
            <li>Автоматически рассчитать стоимость</li>
          </ul>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn variant="outlined" @click="handleLater">
          Привязать позже
        </v-btn>
        <v-spacer />
        <v-btn color="primary" variant="flat" @click="handleCreateSubscription">
          <v-icon class="mr-1">mdi-wizard-hat</v-icon>
          Создать подписку
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  contractId?: number;
  contractNumber?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'create-subscription', contractId: number): void;
  (e: 'later'): void;
}>();

const show = computed({
  get: () => {
    // Показываем диалог только если есть contractId
    if (props.modelValue && !props.contractId) {
      return false;
    }
    return props.modelValue;
  },
  set: (value) => {
    emit('update:modelValue', value);
  },
});

// Следим за попытками открыть диалог без данных
watch(() => props.modelValue, (newValue) => {
  if (newValue && !props.contractId) {
    emit('update:modelValue', false);
  }
});

const handleCreateSubscription = () => {
  if (props.contractId) {
    emit('create-subscription', props.contractId);
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

