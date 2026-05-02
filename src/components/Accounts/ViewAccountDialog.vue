<template>
  <v-dialog :model-value="modelValue" max-width="800" @update:model-value="$emit('update:modelValue', $event)">
    <v-card v-if="account">
      <v-card-title>
        <span class="text-h5">Информация об аккаунте</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="$emit('update:modelValue', false)" />
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field label="ID" :model-value="account.id" readonly variant="outlined" />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field label="Название" :model-value="account.name" readonly variant="outlined" />
          </v-col>
          <v-col cols="12">
            <v-text-field label="Иерархия" :model-value="account.hierarchy" readonly variant="outlined" />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              label="Родительский аккаунт"
              :model-value="account.parentAccountName"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              label="Администратор"
              :model-value="account.adminFullname"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12">
            <v-textarea
              label="Комментарий"
              :model-value="account.comment || 'Нет комментария'"
              readonly
              variant="outlined"
              rows="3"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { Account } from '@/services/accountsService';

defineProps<{
  modelValue: boolean;
  account: Account | null;
}>();

defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();
</script>
