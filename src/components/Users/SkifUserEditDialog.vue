<template>
  <v-dialog v-model="show" max-width="520">
    <AppleCard v-if="user">
      <template #header>
        <div class="hd">
          <h3>Редактирование SKIF-юзера</h3>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
        </div>
      </template>
      <div class="body">
        <v-text-field
          v-model="form.name"
          label="Имя"
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
          v-model="form.code"
          label="Код (RFID)"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
        />
        <v-text-field
          v-model="form.password"
          label="Новый пароль"
          type="password"
          placeholder="Оставить пустым — не менять"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
        />
        <v-textarea
          v-model="form.details"
          label="Описание"
          rows="2"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
        />
        <v-checkbox v-model="form.is_driver" label="Является водителем" hide-details="auto" />
        <div class="meta">
          <span><span class="lbl">UUID:</span> {{ user.external_id || user.id }}</span>
          <span><span class="lbl">Компания:</span> {{ user.creator_name || user.creatorName || '—' }}</span>
          <span><span class="lbl">Роль:</span> {{ user.role_name || user.role || '—' }}</span>
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

interface SkifUser {
  id: number;
  external_id?: string;
  externalId?: string;
  name?: string;
  email?: string;
  phone?: string;
  code?: string;
  details?: string;
  is_driver?: boolean;
  connection_id?: number;
  connectionId?: number;
  source_label?: string;
  creator_name?: string;
  creatorName?: string;
  role?: any;
  role_name?: string;
  // skif_company_id поднимается из backend rows; для обратной совместимости пробуем
  // несколько ключей.
  skif_company_id?: string;
  skifCompanyId?: string;
}

const props = defineProps<{ modelValue: boolean; user: SkifUser | null }>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'saved'): void;
  (e: 'snack', p: { text: string; color: 'success' | 'error' | 'info' }): void;
}>();

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const form = ref({
  name: '',
  email: '',
  phone: '',
  code: '',
  password: '',
  details: '',
  is_driver: false,
});
const initial = ref({ ...form.value });
const saving = ref(false);

watch(
  () => props.user,
  (u) => {
    const snap = {
      name: u?.name || '',
      email: u?.email || '',
      phone: u?.phone || '',
      code: u?.code || '',
      password: '',
      details: u?.details || '',
      is_driver: !!u?.is_driver,
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
    form.value.code !== initial.value.code ||
    form.value.password !== '' ||
    form.value.details !== initial.value.details ||
    form.value.is_driver !== initial.value.is_driver,
);

const close = () => {
  show.value = false;
};

const save = async () => {
  const u = props.user;
  const connID = u?.connection_id ?? u?.connectionId;
  const userUUID = u?.external_id || u?.externalId;
  const skifCompanyID = u?.skif_company_id || u?.skifCompanyId;
  if (!u || !connID || !userUUID || !skifCompanyID) {
    emit('snack', {
      text: 'Не хватает данных для сохранения (connection_id / external_id / skif_company_id)',
      color: 'error',
    });
    return;
  }
  const payload: Record<string, unknown> = {};
  if (form.value.name !== initial.value.name) payload.name = form.value.name;
  if (form.value.email !== initial.value.email) payload.email = form.value.email;
  if (form.value.phone !== initial.value.phone) payload.phone = form.value.phone;
  if (form.value.code !== initial.value.code) payload.code = form.value.code;
  if (form.value.password !== '') payload.password = form.value.password;
  if (form.value.details !== initial.value.details) payload.details = form.value.details;
  if (form.value.is_driver !== initial.value.is_driver) payload.is_driver = form.value.is_driver;

  saving.value = true;
  try {
    await apiClient.put(
      `/auth/skif/connections/${connID}/users/${userUUID}?company=${encodeURIComponent(skifCompanyID)}`,
      payload,
    );
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
