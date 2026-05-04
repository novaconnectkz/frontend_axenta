<template>
  <v-dialog v-model="show" max-width="520">
    <AppleCard v-if="user">
      <template #header>
        <div class="hd">
          <h3>Редактирование Wialon-юзера</h3>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
        </div>
      </template>
      <div class="body">
        <v-text-field
          v-model="form.name"
          label="Логин (имя в Wialon)"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
        />
        <v-text-field
          v-model="form.email"
          label="Email"
          type="email"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
        />
        <v-text-field
          v-model="form.phone"
          label="Телефон"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
        />
        <v-text-field
          v-model="form.telegram"
          label="Telegram"
          placeholder="@username или ID"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
        />
        <div class="meta">
          <span class="lbl">ID:</span> {{ user.id }}
          <span class="lbl">Источник:</span> {{ user.source_label || user.external_source }}
        </div>
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

interface WialonUser {
  id: number;
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  telegram_id?: string;
  connection_id?: number;
  source_label?: string;
  external_source?: string;
}

const props = defineProps<{ modelValue: boolean; user: WialonUser | null }>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'saved'): void;
  (e: 'snack', p: { text: string; color: 'success' | 'error' | 'info' }): void;
}>();

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const form = ref({ name: '', email: '', phone: '', telegram: '' });
const initial = ref({ name: '', email: '', phone: '', telegram: '' });
const saving = ref(false);

watch(
  () => props.user,
  (u) => {
    const snap = {
      name: u?.name || u?.username || '',
      email: u?.email || '',
      phone: u?.phone || '',
      telegram: u?.telegram_id || '',
    };
    form.value = { ...snap };
    initial.value = { ...snap };
  },
  { immediate: true },
);

const hasChanges = computed(
  () =>
    form.value.name !== initial.value.name ||
    form.value.email !== initial.value.email ||
    form.value.phone !== initial.value.phone ||
    form.value.telegram !== initial.value.telegram,
);

const close = () => {
  show.value = false;
};

const save = async () => {
  const u = props.user;
  if (!u || !u.connection_id) {
    emit('snack', { text: 'Нет connection_id', color: 'error' });
    return;
  }
  const payload: { name?: string; email?: string; phone?: string; telegram?: string } = {};
  if (form.value.name !== initial.value.name) payload.name = form.value.name;
  if (form.value.email !== initial.value.email) payload.email = form.value.email;
  if (form.value.phone !== initial.value.phone) payload.phone = form.value.phone;
  if (form.value.telegram !== initial.value.telegram) payload.telegram = form.value.telegram;
  saving.value = true;
  try {
    await apiClient.put(`/wialon/connections/${u.connection_id}/users/${u.id}`, payload);
    emit('snack', { text: 'Сохранено', color: 'success' });
    emit('saved');
    close();
  } catch (e: any) {
    const msg = e?.response?.data?.error || e?.message || 'Ошибка сохранения';
    emit('snack', { text: msg, color: 'error' });
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.hd {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}
.body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
}
.meta {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.lbl {
  font-weight: 600;
  margin-right: 4px;
}
.ft {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}
</style>
