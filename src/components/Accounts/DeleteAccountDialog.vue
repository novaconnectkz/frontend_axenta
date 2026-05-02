<template>
  <v-dialog
    :model-value="modelValue"
    max-width="500"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="text-h5 text-center pa-4">
        <v-icon icon="mdi-alert-circle" color="error" size="32" class="mr-2" />
        Подтверждение удаления
      </v-card-title>

      <v-card-text class="pa-4">
        <div class="mb-4">
          <p class="text-body-1 mb-2">
            Вы действительно хотите удалить учетную запись?
          </p>
          <div class="account-info pa-3">
            <div class="text-subtitle-1 font-weight-bold account-info-name">{{ account?.name }}</div>
            <div class="text-caption account-info-meta">ID: {{ account?.id }}</div>
            <div class="text-caption account-info-meta">
              Тип: {{ account?.type === 'partner' ? 'Партнер' : 'Клиент' }}
            </div>
          </div>
        </div>

        <div class="mb-4">
          <p class="text-body-2 text-grey-darken-1 mb-2">
            <strong>Внимание!</strong> Это действие нельзя отменить. Все данные учетной записи будут безвозвратно удалены.
          </p>
        </div>

        <div class="mb-4">
          <p class="text-body-2 mb-2">
            Для подтверждения введите ID учетной записи:
          </p>
          <v-text-field
            :model-value="confirmationId"
            label="ID учетной записи"
            placeholder="Введите ID для подтверждения"
            variant="outlined"
            density="comfortable"
            :disabled="isDeleting"
            @update:model-value="$emit('update:confirmationId', $event)"
            @keyup.enter="$emit('confirm')"
          />
        </div>

        <div v-if="account && (account.source || '').toUpperCase().startsWith('WH')" class="mb-4">
          <p class="text-body-2 mb-2">
            <v-icon icon="mdi-information" color="info" size="16" class="mr-1" />
            Для Wialon Hosting необходимо указать причину удаления:
          </p>
          <v-select
            :model-value="reasonKey"
            :items="wialonReasons"
            item-title="label"
            item-value="key"
            label="Причина удаления"
            variant="outlined"
            density="comfortable"
            :disabled="isDeleting"
            clearable
            @update:model-value="$emit('update:reasonKey', $event)"
          />
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn color="grey" variant="text" @click="$emit('cancel')" :disabled="isDeleting">
          Отмена
        </v-btn>
        <v-btn
          color="error"
          variant="flat"
          :loading="isDeleting"
          :disabled="confirmationId !== account?.id?.toString()"
          @click="$emit('confirm')"
        >
          <v-icon icon="mdi-delete" class="mr-1" />
          Удалить
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { Account } from '@/services/accountsService';

interface WialonReason {
  key: string;
  label: string;
}

defineProps<{
  modelValue: boolean;
  account: Account | null;
  confirmationId: string;
  reasonKey: string | null;
  isDeleting: boolean;
  wialonReasons: WialonReason[];
}>();

defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'update:confirmationId', value: string): void;
  (e: 'update:reasonKey', value: string | null): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();
</script>

<style scoped>
.account-info {
  background-color: #f5f5f5;
  border-radius: 8px;
}

.account-info-name {
  color: #1d1d1f;
}

.account-info-meta {
  color: #6e6e73;
}

[data-theme="dark"] .account-info {
  background-color: #2c2c2e;
  border: 1px solid #3a3a3c;
}

[data-theme="dark"] .account-info-name {
  color: #f5f5f7;
}

[data-theme="dark"] .account-info-meta {
  color: #8e8e93;
}
</style>
