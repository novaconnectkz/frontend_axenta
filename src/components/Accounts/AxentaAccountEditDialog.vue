<template>
  <v-dialog v-model="show" width="640" max-width="92vw" persistent>
    <AppleCard v-if="account">
      <template #header>
        <div class="hd">
          <h3>Свойства Axenta-аккаунта</h3>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
        </div>
        <div class="sub">{{ account.name }} • ID {{ account.id }}</div>
      </template>
      <div class="body">
        <v-text-field v-model="form.name" label="Название" variant="outlined" density="comfortable" hide-details="auto" />
        <v-textarea v-model="form.comment" label="Комментарий" rows="3" variant="outlined" density="comfortable" hide-details="auto" />
        <v-text-field
          v-model="form.blockingDatetime"
          label="Дата блокировки"
          type="datetime-local"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
          clearable
        />
        <v-switch v-model="form.is_active" :label="form.is_active ? 'Активен' : 'Заблокирован'" color="primary" hide-details inset />
      </div>
      <template #footer>
        <div class="ft">
          <v-spacer />
          <v-btn variant="text" :disabled="saving" @click="close">Отмена</v-btn>
          <v-btn color="primary" :loading="saving" :disabled="!hasChanges" @click="save">Сохранить</v-btn>
        </div>
      </template>
    </AppleCard>
  </v-dialog>
</template>

<script setup lang="ts">
import AppleCard from '@/components/Apple/AppleCard.vue';
import { apiClient } from '@/services/api';
import { computed, ref, watch } from 'vue';

interface Account {
  id: number;
  name?: string;
  comment?: string;
  blockingDatetime?: string | null;
  blocking_datetime?: string | null;
  isActive?: boolean;
  is_active?: boolean;
}

const props = defineProps<{ modelValue: boolean; account: Account | null }>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'saved'): void;
  (e: 'snack', p: { text: string; color: 'success' | 'error' | 'info' }): void;
}>();

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const form = ref({ name: '', comment: '', blockingDatetime: '', is_active: true });
const initial = ref({ ...form.value });
const saving = ref(false);

watch(
  () => props.account,
  (a) => {
    const snap = {
      name: a?.name || '',
      comment: a?.comment || '',
      blockingDatetime: (a?.blockingDatetime || a?.blocking_datetime || '') as string,
      is_active: (a?.isActive ?? a?.is_active ?? true) as boolean,
    };
    form.value = { ...snap };
    initial.value = { ...snap };
  },
  { immediate: true },
);

const hasChanges = computed(() =>
  form.value.name !== initial.value.name ||
  form.value.comment !== initial.value.comment ||
  form.value.blockingDatetime !== initial.value.blockingDatetime ||
  form.value.is_active !== initial.value.is_active,
);

const close = () => { show.value = false; };

const save = async () => {
  if (!props.account) return;
  saving.value = true;
  try {
    const payload: Record<string, any> = {};
    if (form.value.name !== initial.value.name) payload.name = form.value.name;
    if (form.value.comment !== initial.value.comment) payload.comment = form.value.comment;
    if (form.value.blockingDatetime !== initial.value.blockingDatetime) {
      payload.blockingDatetime = form.value.blockingDatetime || null;
    }
    if (Object.keys(payload).length > 0) {
      await apiClient.put(`/auth/cms/accounts/${props.account.id}/`, payload);
    }
    if (form.value.is_active !== initial.value.is_active) {
      await apiClient.post(`/auth/cms/accounts/${props.account.id}/activate/`, { isActive: form.value.is_active });
    }
    emit('snack', { text: 'Сохранено', color: 'success' });
    emit('saved');
    close();
  } catch (e: any) {
    emit('snack', { text: e?.response?.data?.error || 'Ошибка сохранения', color: 'error' });
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.hd { display: flex; align-items: center; gap: 8px; }
.sub { font-size: 12px; color: rgba(0, 0, 0, 0.6); padding-left: 4px; }
.body { display: flex; flex-direction: column; gap: 14px; padding: 16px 4px 4px; }
.ft { display: flex; align-items: center; gap: 8px; padding: 8px 0; }
</style>
