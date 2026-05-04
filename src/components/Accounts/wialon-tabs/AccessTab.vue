<template>
  <div class="t">
    <div class="hd">
      <v-select
        v-model="selectedUserId"
        :items="userOptions"
        item-title="user_name"
        item-value="user_id"
        label="Пользователь"
        density="compact"
        variant="outlined"
        hide-details
        :loading="loading"
      />
      <v-select
        :model-value="templateName"
        :items="templates"
        label="Шаблон"
        density="compact"
        variant="outlined"
        hide-details
        @update:model-value="applyTemplate"
      />
    </div>

    <div v-if="selected" class="cols">
      <div class="col">
        <h5>Стандартные права</h5>
        <div v-for="f in standardFlags" :key="f.bit" class="cb">
          <v-checkbox :model-value="hasBit(f.bit)" :label="f.label" density="compact" hide-details color="primary" @update:model-value="(v: boolean) => setBit(f.bit, v)" />
        </div>
      </div>
      <div class="col">
        <h5>Специальные права (ресурсы)</h5>
        <div v-for="f in specialFlags" :key="f.bit" class="cb">
          <v-checkbox :model-value="hasBitStr(f.bit)" :label="f.label" density="compact" hide-details color="primary" @update:model-value="(v: boolean) => setBitStr(f.bit, v)" />
        </div>
      </div>
    </div>

    <div v-if="selected" class="ft">
      <span class="muted">accessMask: 0x{{ Number(selected.access_mask).toString(16) }}</span>
      <v-spacer />
      <v-btn :loading="saving" color="primary" size="small" @click="save">Сохранить</v-btn>
    </div>
    <div v-else class="muted">Выберите пользователя для редактирования прав</div>
  </div>
</template>

<script setup lang="ts">
import { apiClient } from '@/services/api';
import { computed, ref, watch } from 'vue';

interface AccessUser { user_id: number; user_name: string; access_mask: number }

const props = defineProps<{ connectionId: number; userId: number; visible: boolean }>();
const emit = defineEmits<{ (e: 'snack', p: { text: string; color: 'success'|'error'|'info' }): void }>();

const users = ref<AccessUser[]>([]);
const selectedUserId = ref<number | null>(null);
const loading = ref(false);
const saving = ref(false);
const templateName = ref<string>('');

const standardFlags = [
  { bit: 0x0001, label: 'Просмотр элемента и основных свойств' },
  { bit: 0x0002, label: 'Просмотр подробных свойств' },
  { bit: 0x0004, label: 'Управление доступом к элементу' },
  { bit: 0x0008, label: 'Удаление элемента' },
  { bit: 0x0010, label: 'Переименование элемента' },
  { bit: 0x0020, label: 'Просмотр произвольных полей' },
  { bit: 0x0040, label: 'Управление произвольными полями' },
  { bit: 0x0080, label: 'Редактирование неупомянутых свойств' },
  { bit: 0x0100, label: 'Изменить иконку' },
  { bit: 0x0200, label: 'Запрос сообщений и отчётов' },
  { bit: 0x0400, label: 'Редактирование рекурсивных элементов' },
  { bit: 0x0800, label: 'Управление журналом' },
  { bit: 0x1000, label: 'Просмотр административных полей' },
  { bit: 0x2000, label: 'Управление административными полями' },
  { bit: 0x4000, label: 'Просмотр и скачивание файлов' },
  { bit: 0x8000, label: 'Загрузка и удаление файлов' },
];

// Special flags — слишком большие для JS Number, используем BigInt через строки
const specialFlags = [
  { bit: '0x100000', label: 'Просмотр уведомлений' },
  { bit: '0x200000', label: 'CRUD уведомлений' },
  { bit: '0x1000000', label: 'Просмотр геозон' },
  { bit: '0x2000000', label: 'CRUD геозон' },
  { bit: '0x4000000', label: 'Просмотр заданий' },
  { bit: '0x8000000', label: 'CRUD заданий' },
  { bit: '0x10000000', label: 'Просмотр шаблонов отчётов' },
  { bit: '0x20000000', label: 'CRUD шаблонов отчётов' },
  { bit: '0x40000000', label: 'Просмотр водителей' },
  { bit: '0x80000000', label: 'CRUD водителей' },
  { bit: '0x100000000', label: 'Управление учётной записью' },
  { bit: '0x200000000', label: 'Просмотр заявок' },
  { bit: '0x400000000', label: 'CRUD заявок' },
  { bit: '0x800000000', label: 'Просмотр пассажиров' },
  { bit: '0x1000000000', label: 'CRUD пассажиров' },
  { bit: '0x100000000000', label: 'Просмотр прицепов' },
  { bit: '0x200000000000', label: 'CRUD прицепов' },
];

const templates = [
  { title: 'Нет доступа', value: 'none' },
  { title: 'Только чтение', value: 'read' },
  { title: 'Полный доступ', value: 'full' },
];

const userOptions = computed(() => users.value);
const selected = computed(() => users.value.find(u => u.user_id === selectedUserId.value) || null);

const load = async () => {
  if (!props.connectionId || !props.userId) return;
  loading.value = true;
  try {
    const r = await apiClient.get(`/wialon/connections/${props.connectionId}/accounts/${props.userId}/access`);
    users.value = (r.data?.users || []).sort((a: any, b: any) => (a.user_name || '').localeCompare(b.user_name || ''));
  } catch (e: any) { emit('snack', { text: e?.response?.data?.error || 'Ошибка загрузки доступа', color: 'error' }); }
  finally { loading.value = false; }
};

watch(() => [props.visible, props.userId], () => { if (props.visible) load(); }, { immediate: true });

const hasBit = (bit: number): boolean => {
  if (!selected.value) return false;
  return (BigInt(selected.value.access_mask) & BigInt(bit)) !== BigInt(0);
};
const hasBitStr = (bitHex: string): boolean => {
  if (!selected.value) return false;
  return (BigInt(selected.value.access_mask) & BigInt(bitHex)) !== BigInt(0);
};
const setBit = (bit: number, v: boolean) => {
  if (!selected.value) return;
  let mask = BigInt(selected.value.access_mask);
  if (v) mask |= BigInt(bit); else mask &= ~BigInt(bit);
  selected.value.access_mask = Number(mask);
};
const setBitStr = (bitHex: string, v: boolean) => {
  if (!selected.value) return;
  let mask = BigInt(selected.value.access_mask);
  if (v) mask |= BigInt(bitHex); else mask &= ~BigInt(bitHex);
  selected.value.access_mask = Number(mask);
};

const applyTemplate = (t: string) => {
  if (!selected.value) return;
  templateName.value = t;
  if (t === 'none') selected.value.access_mask = 0;
  else if (t === 'read') selected.value.access_mask = Number(BigInt(0x0001 | 0x0002 | 0x0020 | 0x0200 | 0x1000 | 0x4000));
  else if (t === 'full') selected.value.access_mask = Number(BigInt('0x3FFFFFFFFFFFF'));
};

const save = async () => {
  if (!selected.value) return;
  saving.value = true;
  try {
    await apiClient.put(
      `/wialon/connections/${props.connectionId}/accounts/${props.userId}/access/${selected.value.user_id}`,
      { access_mask: selected.value.access_mask },
    );
    emit('snack', { text: 'Права сохранены', color: 'success' });
  } catch (e: any) { emit('snack', { text: e?.response?.data?.error || 'Ошибка', color: 'error' }); }
  finally { saving.value = false; }
};
</script>

<style scoped>
.t { display: flex; flex-direction: column; gap: 12px; max-height: 600px; overflow-y: auto; }
.hd { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.col h5 { margin: 0 0 8px; font-size: 13px; font-weight: 600; }
.cb { margin: -8px 0; }
.ft { display: flex; align-items: center; gap: 8px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.08); }
.muted { font-size: 12px; color: rgba(0,0,0,0.6); padding: 8px 0; text-align: center; }
@media (max-width: 720px) { .cols { grid-template-columns: 1fr; } }
</style>
