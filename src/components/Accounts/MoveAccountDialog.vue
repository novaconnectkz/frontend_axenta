<template>
  <v-dialog
    :model-value="modelValue"
    max-width="600"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="text-h5 text-center pa-4">
        <v-icon icon="mdi-swap-horizontal" color="primary" size="32" class="mr-2" />
        Переместить учетную запись
      </v-card-title>

      <v-card-text class="pa-4">
        <div class="mb-4">
          <p class="text-body-1 mb-2">
            Выберите партнера, к которому будет перемещена учетная запись:
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
          <p class="text-body-2 mb-2">
            <strong>Выберите целевого партнера:</strong>
          </p>
          <v-select
            :model-value="targetPartner"
            :items="partnerOptions"
            item-title="name"
            item-value="id"
            label="Партнер"
            placeholder="Выберите партнера"
            variant="outlined"
            density="comfortable"
            :disabled="isMoving"
            :loading="loadingPartners"
            clearable
            @update:model-value="$emit('update:targetPartner', $event)"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps">
                <template #title>
                  <div class="d-flex align-center">
                    <span class="font-weight-bold">{{ item.raw.name }}</span>
                    <v-chip size="x-small" color="primary" class="ml-2">
                      ID: {{ item.raw.id }}
                    </v-chip>
                  </div>
                </template>
                <template #subtitle>
                  <span class="text-caption">{{ item.raw.type === 'partner' ? 'Партнер' : 'Клиент' }}</span>
                </template>
              </v-list-item>
            </template>
          </v-select>
        </div>

        <div class="mb-4">
          <p class="text-body-2 text-grey-darken-1 mb-2">
            <strong>Внимание!</strong> При перемещении учетной записи все её данные (объекты, пользователи, настройки) будут переданы выбранному партнеру. Это действие нельзя отменить.
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
            :disabled="isMoving"
            @update:model-value="$emit('update:confirmationId', $event)"
            @keyup.enter="$emit('confirm')"
          />
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn color="grey" variant="text" @click="$emit('cancel')" :disabled="isMoving">
          Отмена
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="isMoving"
          :disabled="!targetPartner || confirmationId !== account?.id?.toString()"
          @click="$emit('confirm')"
        >
          <v-icon icon="mdi-swap-horizontal" class="mr-1" />
          Переместить
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { Account } from '@/services/accountsService';

defineProps<{
  modelValue: boolean;
  account: Account | null;
  partnerOptions: Account[];
  targetPartner: number | null;
  confirmationId: string;
  isMoving: boolean;
  loadingPartners: boolean;
}>();

defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'update:targetPartner', value: number | null): void;
  (e: 'update:confirmationId', value: string): void;
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
